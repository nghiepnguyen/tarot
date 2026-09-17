import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaRef = vi.hoisted(() => ({ current: null as unknown }));
const sendEmail = vi.hoisted(() => vi.fn());

vi.mock("@/lib/email/resend", () => ({ sendEmail }));
vi.mock("@/lib/db/prisma", () => ({
  get prisma() {
    return prismaRef.current;
  },
}));

const {
  checkPasswordResetToken,
  consumePasswordResetToken,
  issuePasswordResetToken,
  sendPasswordResetEmail,
} = await import("./password-reset");

const MINUTE = 60 * 1000;

interface FakeUser {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  passwordChangedAt: Date | null;
}

interface FakeToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}

/**
 * Fake Prisma tối thiểu cho luồng đặt lại mật khẩu. `updateMany` trả đúng số
 * dòng khớp điều kiện — chốt chống dùng lại token dựa hẳn vào con số đó.
 */
function createFakeDb(users: FakeUser[], tokens: FakeToken[] = []) {
  const userRows = new Map(users.map((user) => [user.id, { ...user }]));
  const tokenRows = new Map(tokens.map((token) => [token.id, { ...token }]));
  let nextId = tokenRows.size + 1;

  const db = {
    passwordResetToken: {
      create: async ({ data }: { data: Omit<FakeToken, "id" | "usedAt"> }) => {
        const row: FakeToken = { id: `tok_${nextId++}`, usedAt: null, ...data };
        tokenRows.set(row.id, row);
        return { ...row };
      },
      deleteMany: async ({ where }: { where: Record<string, unknown> }) => {
        let count = 0;
        for (const [id, token] of tokenRows) {
          if (where.userId !== undefined && token.userId !== where.userId) continue;
          if (where.usedAt === null && token.usedAt !== null) continue;
          const expires = where.expiresAt as { lte?: Date } | undefined;
          if (expires?.lte && token.expiresAt > expires.lte) continue;
          tokenRows.delete(id);
          count += 1;
        }
        return { count };
      },
      findUnique: async ({ where }: { where: { tokenHash: string } }) => {
        for (const token of tokenRows.values()) {
          if (token.tokenHash === where.tokenHash) return { ...token };
        }
        return null;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; usedAt: null };
        data: Partial<FakeToken>;
      }) => {
        const token = tokenRows.get(where.id);
        if (!token || token.usedAt !== null) return { count: 0 };
        tokenRows.set(where.id, { ...token, ...data });
        return { count: 1 };
      },
    },
    user: {
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<FakeUser>;
      }) => {
        const user = userRows.get(where.id)!;
        const next = { ...user, ...data };
        userRows.set(where.id, next);
        return { ...next };
      },
    },
    $transaction: async <T,>(arg: ((tx: never) => Promise<T>) | Promise<unknown>[]) =>
      typeof arg === "function" ? arg(db as never) : (Promise.all(arg) as Promise<T>),
  };

  return { db, userRows, tokenRows };
}

function makeUser(overrides: Partial<FakeUser> = {}): FakeUser {
  return {
    id: "user_1",
    email: "user@example.com",
    name: "Người Dùng",
    passwordHash: bcrypt.hashSync("old-password-1", 10),
    passwordChangedAt: null,
    ...overrides,
  };
}

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

beforeEach(() => {
  vi.restoreAllMocks();
  sendEmail.mockReset();
  sendEmail.mockResolvedValue(true);
  // Quét token hết hạn chạy ngẫu nhiên; tắt đi để test không phụ thuộc may rủi.
  vi.spyOn(Math, "random").mockReturnValue(0.99);
});

async function setup(overrides: Partial<FakeUser> = {}) {
  const fake = createFakeDb([makeUser(overrides)]);
  prismaRef.current = fake.db;
  const token = await issuePasswordResetToken("user_1");
  return { fake, token };
}

function expire(fake: ReturnType<typeof createFakeDb>) {
  for (const [id, row] of fake.tokenRows) {
    fake.tokenRows.set(id, { ...row, expiresAt: new Date(Date.now() - MINUTE) });
  }
}

describe("issuePasswordResetToken", () => {
  it("chỉ lưu bản băm, không lưu token thật", async () => {
    const { fake, token } = await setup();

    const rows = [...fake.tokenRows.values()];
    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).toBe(hash(token));
    expect(rows[0].tokenHash).not.toBe(token);
  });

  it("đặt hạn 1 giờ, không phải 24 giờ như link xác nhận email", async () => {
    const { fake } = await setup();

    const [row] = [...fake.tokenRows.values()];
    const ttl = row.expiresAt.getTime() - Date.now();
    expect(ttl).toBeGreaterThan(55 * MINUTE);
    expect(ttl).toBeLessThanOrEqual(60 * MINUTE);
  });

  it("huỷ token chưa dùng trước đó của cùng tài khoản", async () => {
    const { fake, token: first } = await setup();

    const second = await issuePasswordResetToken("user_1");

    expect(fake.tokenRows.size).toBe(1);
    await expect(checkPasswordResetToken(first)).resolves.toBe("invalid");
    await expect(checkPasswordResetToken(second)).resolves.toBe("valid");
  });
});

describe("checkPasswordResetToken", () => {
  it("không tiêu token — mở link hai lần vẫn dùng được", async () => {
    const { token } = await setup();

    await expect(checkPasswordResetToken(token)).resolves.toBe("valid");
    await expect(checkPasswordResetToken(token)).resolves.toBe("valid");
    await expect(consumePasswordResetToken(token, "new-password-1")).resolves.toBe("reset");
  });

  it("phân biệt link hết hạn với link không tồn tại", async () => {
    const { fake, token } = await setup();
    expire(fake);

    await expect(checkPasswordResetToken(token)).resolves.toBe("expired");
    await expect(checkPasswordResetToken("khong-ton-tai")).resolves.toBe("invalid");
    await expect(checkPasswordResetToken("")).resolves.toBe("invalid");
  });
});

describe("consumePasswordResetToken", () => {
  it("đổi mật khẩu và ghi mốc để hạ các session cũ", async () => {
    const { fake, token } = await setup();

    await expect(consumePasswordResetToken(token, "new-password-1")).resolves.toBe("reset");

    const user = fake.userRows.get("user_1")!;
    expect(await bcrypt.compare("new-password-1", user.passwordHash)).toBe(true);
    expect(await bcrypt.compare("old-password-1", user.passwordHash)).toBe(false);
    expect(user.passwordChangedAt).toBeInstanceOf(Date);
  });

  it("token dùng một lần — lần thứ hai không đổi được gì", async () => {
    const { fake, token } = await setup();

    await consumePasswordResetToken(token, "new-password-1");
    await expect(consumePasswordResetToken(token, "attacker-password-9")).resolves.toBe(
      "invalid",
    );

    const user = fake.userRows.get("user_1")!;
    expect(await bcrypt.compare("new-password-1", user.passwordHash)).toBe(true);
  });

  it("hai request song song chỉ một cái đổi được mật khẩu", async () => {
    const { fake, token } = await setup();

    const results = await Promise.all([
      consumePasswordResetToken(token, "new-password-1"),
      consumePasswordResetToken(token, "other-password-2"),
    ]);

    expect(results.filter((result) => result === "reset")).toHaveLength(1);
    const user = fake.userRows.get("user_1")!;
    const matches = await Promise.all([
      bcrypt.compare("new-password-1", user.passwordHash),
      bcrypt.compare("other-password-2", user.passwordHash),
    ]);
    expect(matches.filter(Boolean)).toHaveLength(1);
  });

  it("từ chối token hết hạn và không đụng tới mật khẩu", async () => {
    const { fake, token } = await setup();
    expire(fake);

    await expect(consumePasswordResetToken(token, "new-password-1")).resolves.toBe("expired");

    const user = fake.userRows.get("user_1")!;
    expect(await bcrypt.compare("old-password-1", user.passwordHash)).toBe(true);
    expect(user.passwordChangedAt).toBeNull();
  });

  it("từ chối chuỗi rỗng mà không hỏi database", async () => {
    const fake = createFakeDb([makeUser()]);
    prismaRef.current = fake.db;
    const findUnique = vi.spyOn(fake.db.passwordResetToken, "findUnique");

    await expect(consumePasswordResetToken("", "new-password-1")).resolves.toBe("invalid");
    expect(findUnique).not.toHaveBeenCalled();
  });
});

describe("sendPasswordResetEmail", () => {
  it("gửi link chứa token", async () => {
    await expect(
      sendPasswordResetEmail({ to: "user@example.com", name: "Người Dùng", token: "abc123" }),
    ).resolves.toBe(true);

    const [input] = sendEmail.mock.calls[0];
    expect(input.to).toBe("user@example.com");
    expect(input.text).toContain("/reset-password?token=abc123");
  });

  it("trả false và ghi link ra log khi không gửi được", async () => {
    sendEmail.mockResolvedValue(false);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(
      sendPasswordResetEmail({ to: "user@example.com", name: null, token: "abc123" }),
    ).resolves.toBe(false);

    expect(warn.mock.calls[0][0]).toContain("/reset-password?token=abc123");
  });
});
