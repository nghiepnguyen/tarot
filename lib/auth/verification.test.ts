import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaRef = vi.hoisted(() => ({ current: null as unknown }));
const sendEmail = vi.hoisted(() => vi.fn());

vi.mock("@/lib/email/resend", () => ({ sendEmail }));
vi.mock("@/lib/db/prisma", () => ({
  get prisma() {
    return prismaRef.current;
  },
}));

const { consumeVerificationToken, issueVerificationToken, sendVerificationEmail } =
  await import("./verification");
const { FREE_TRIAL_CREDITS } = await import("@/lib/ai/interpretation");

const HOUR = 60 * 60 * 1000;

interface FakeUser {
  id: string;
  email: string;
  name: string | null;
  credits: number;
  emailVerifiedAt: Date | null;
  freeCreditsGrantedAt: Date | null;
}

interface FakeToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}

interface CreditRow {
  userId: string;
  type: string;
  amount: number;
  balanceAfter: number;
}

/**
 * Fake Prisma tối thiểu cho luồng xác nhận email. `updateMany` phải trả đúng
 * số dòng khớp điều kiện — chốt chống cộng credit hai lần dựa hẳn vào con số
 * đó, nên mock trả bừa thì test không chứng minh được gì.
 */
function createFakeDb(users: FakeUser[], tokens: FakeToken[] = []) {
  const userRows = new Map(users.map((user) => [user.id, { ...user }]));
  const tokenRows = new Map(tokens.map((token) => [token.id, { ...token }]));
  const creditTransactions: CreditRow[] = [];
  let nextId = tokenRows.size + 1;

  const db = {
    emailVerificationToken: {
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
          if (token.tokenHash !== where.tokenHash) continue;
          const user = userRows.get(token.userId)!;
          return { ...token, user: { ...user } };
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
        data: { credits?: { increment: number } } & Partial<FakeUser>;
      }) => {
        const user = userRows.get(where.id)!;
        const next = {
          ...user,
          ...data,
          credits:
            data.credits === undefined ? user.credits : user.credits + data.credits.increment,
        } as FakeUser;
        userRows.set(where.id, next);
        return { ...next };
      },
    },
    creditTransaction: {
      create: async ({ data }: { data: CreditRow }) => {
        creditTransactions.push(data);
        return data;
      },
    },
    $transaction: async <T,>(arg: ((tx: never) => Promise<T>) | Promise<unknown>[]) =>
      typeof arg === "function" ? arg(db as never) : (Promise.all(arg) as Promise<T>),
  };

  return { db, userRows, tokenRows, creditTransactions };
}

function makeUser(overrides: Partial<FakeUser> = {}): FakeUser {
  return {
    id: "user_1",
    email: "user@example.com",
    name: "Người Dùng",
    credits: 0,
    emailVerifiedAt: null,
    freeCreditsGrantedAt: null,
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

describe("issueVerificationToken", () => {
  it("chỉ lưu bản băm, không lưu token thật", async () => {
    const fake = createFakeDb([makeUser()]);
    prismaRef.current = fake.db;

    const token = await issueVerificationToken("user_1");

    const rows = [...fake.tokenRows.values()];
    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).toBe(hash(token));
    expect(rows[0].tokenHash).not.toBe(token);
  });

  it("huỷ token chưa dùng trước đó của cùng tài khoản", async () => {
    const stale = {
      id: "tok_old",
      userId: "user_1",
      tokenHash: hash("cũ"),
      expiresAt: new Date(Date.now() + HOUR),
      usedAt: null,
    };
    const fake = createFakeDb([makeUser()], [stale]);
    prismaRef.current = fake.db;

    await issueVerificationToken("user_1");

    expect(fake.tokenRows.has("tok_old")).toBe(false);
    expect(fake.tokenRows.size).toBe(1);
  });

  it("không đụng tới token của tài khoản khác", async () => {
    const other = {
      id: "tok_other",
      userId: "user_2",
      tokenHash: hash("khác"),
      expiresAt: new Date(Date.now() + HOUR),
      usedAt: null,
    };
    const fake = createFakeDb([makeUser(), makeUser({ id: "user_2" })], [other]);
    prismaRef.current = fake.db;

    await issueVerificationToken("user_1");

    expect(fake.tokenRows.has("tok_other")).toBe(true);
  });
});

describe("consumeVerificationToken", () => {
  async function setup(overrides: Partial<FakeUser> = {}) {
    const fake = createFakeDb([makeUser(overrides)]);
    prismaRef.current = fake.db;
    const token = await issueVerificationToken("user_1");
    return { fake, token };
  }

  it("xác nhận tài khoản và cộng credit dùng thử", async () => {
    const { fake, token } = await setup();

    await expect(consumeVerificationToken(token)).resolves.toBe("verified");

    const user = fake.userRows.get("user_1")!;
    expect(user.emailVerifiedAt).toBeInstanceOf(Date);
    expect(user.freeCreditsGrantedAt).toBeInstanceOf(Date);
    expect(user.credits).toBe(FREE_TRIAL_CREDITS);
    expect(fake.creditTransactions).toEqual([
      {
        userId: "user_1",
        type: "FREE_GRANT",
        amount: FREE_TRIAL_CREDITS,
        balanceAfter: FREE_TRIAL_CREDITS,
      },
    ]);
  });

  it("bấm lại link đã dùng không cộng credit lần hai", async () => {
    const { fake, token } = await setup();

    await consumeVerificationToken(token);
    await expect(consumeVerificationToken(token)).resolves.toBe("already-verified");

    expect(fake.userRows.get("user_1")!.credits).toBe(FREE_TRIAL_CREDITS);
    expect(fake.creditTransactions).toHaveLength(1);
  });

  it("hai lần bấm song song chỉ cộng credit một lần", async () => {
    const { fake, token } = await setup();

    const results = await Promise.all([
      consumeVerificationToken(token),
      consumeVerificationToken(token),
    ]);

    expect(results.filter((result) => result === "verified")).toHaveLength(1);
    expect(fake.userRows.get("user_1")!.credits).toBe(FREE_TRIAL_CREDITS);
    expect(fake.creditTransactions).toHaveLength(1);
  });

  it("từ chối token đã hết hạn", async () => {
    const { fake, token } = await setup();
    for (const [id, row] of fake.tokenRows) {
      fake.tokenRows.set(id, { ...row, expiresAt: new Date(Date.now() - HOUR) });
    }

    await expect(consumeVerificationToken(token)).resolves.toBe("expired");
    expect(fake.userRows.get("user_1")!.emailVerifiedAt).toBeNull();
    expect(fake.creditTransactions).toHaveLength(0);
  });

  it("từ chối token không có trong database", async () => {
    await setup();
    await expect(consumeVerificationToken("khong-ton-tai")).resolves.toBe("invalid");
  });

  it("từ chối chuỗi rỗng mà không hỏi database", async () => {
    const fake = createFakeDb([makeUser()]);
    prismaRef.current = fake.db;
    const findUnique = vi.spyOn(fake.db.emailVerificationToken, "findUnique");

    await expect(consumeVerificationToken("")).resolves.toBe("invalid");
    expect(findUnique).not.toHaveBeenCalled();
  });
});

describe("sendVerificationEmail", () => {
  it("gửi link chứa token và không lộ token qua bất kỳ trường nào khác", async () => {
    await expect(
      sendVerificationEmail({ to: "user@example.com", name: "Người Dùng", token: "abc123" }),
    ).resolves.toBe(true);

    const [input] = sendEmail.mock.calls[0];
    expect(input.to).toBe("user@example.com");
    expect(input.text).toContain("/verify-email?token=abc123");
  });

  it("trả false và ghi link ra log khi không gửi được", async () => {
    sendEmail.mockResolvedValue(false);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(
      sendVerificationEmail({ to: "user@example.com", name: null, token: "abc123" }),
    ).resolves.toBe(false);

    expect(warn.mock.calls[0][0]).toContain("/verify-email?token=abc123");
  });
});
