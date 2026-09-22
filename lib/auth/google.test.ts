import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaRef = vi.hoisted(() => ({ current: null as unknown }));

vi.mock("@/lib/db/prisma", () => ({
  get prisma() {
    return prismaRef.current;
  },
}));

const { isGoogleLoginEnabled, linkGoogleAccount } = await import("./google");
const { FREE_TRIAL_CREDITS } = await import("@/lib/ai/interpretation");

interface FakeUser {
  id: string;
  email: string;
  name: string | null;
  googleId: string | null;
  passwordHash: string | null;
  credits: number;
  emailVerifiedAt: Date | null;
  freeCreditsGrantedAt: Date | null;
  passwordChangedAt: Date | null;
  role: "USER" | "ADMIN";
}

interface CreditRow {
  userId: string;
  type: string;
  amount: number;
  balanceAfter: number;
}

function makeUser(overrides: Partial<FakeUser> & { id: string; email: string }): FakeUser {
  return {
    name: null,
    googleId: null,
    passwordHash: null,
    credits: 0,
    emailVerifiedAt: null,
    freeCreditsGrantedAt: null,
    passwordChangedAt: null,
    role: "USER",
    ...overrides,
  };
}

/**
 * Fake Prisma tối thiểu cho luồng gắn tài khoản Google. `updateMany` phải trả
 * đúng số dòng khớp `where` — chốt chống cộng credit hai lần dựa hẳn vào con
 * số đó, nên mock trả bừa thì test không chứng minh được gì.
 */
function createFakeDb(users: FakeUser[] = []) {
  const rows = new Map(users.map((user) => [user.id, { ...user }]));
  const creditTransactions: CreditRow[] = [];
  let nextId = rows.size + 1;

  function find(where: { id?: string; email?: string; googleId?: string }) {
    for (const user of rows.values()) {
      if (where.id !== undefined && user.id !== where.id) continue;
      if (where.email !== undefined && user.email !== where.email) continue;
      if (where.googleId !== undefined && user.googleId !== where.googleId) continue;
      return user;
    }
    return null;
  }

  const db = {
    user: {
      findUnique: async ({ where }: { where: Record<string, string> }) => {
        // Prisma coi `findUnique({ where: { googleId: undefined } })` là lỗi,
        // không phải là "khớp mọi hàng" — nếu code gọi kiểu đó thì phải nổ ở
        // đây chứ không được lặng lẽ trả về một người dùng bất kỳ.
        const value = Object.values(where)[0];
        if (value === undefined) throw new Error("findUnique nhận khoá undefined");
        const user = find(where);
        return user ? { ...user } : null;
      },
      findUniqueOrThrow: async ({ where }: { where: { id: string } }) => {
        const user = find(where);
        if (!user) throw new Error("không tìm thấy");
        return { ...user };
      },
      create: async ({ data }: { data: Partial<FakeUser> }) => {
        const user = makeUser({
          id: `usr_${nextId++}`,
          email: data.email!,
          ...data,
        });
        rows.set(user.id, user);
        return { ...user };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<FakeUser>;
      }) => {
        const user = rows.get(where.id)!;
        Object.assign(user, data);
        return { ...user };
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; freeCreditsGrantedAt: null };
        data: { credits: { increment: number }; freeCreditsGrantedAt: Date };
      }) => {
        const user = rows.get(where.id);
        if (!user || user.freeCreditsGrantedAt !== null) return { count: 0 };
        user.credits += data.credits.increment;
        user.freeCreditsGrantedAt = data.freeCreditsGrantedAt;
        return { count: 1 };
      },
    },
    creditTransaction: {
      create: async ({ data }: { data: CreditRow }) => {
        creditTransactions.push({ ...data });
        return { ...data };
      },
    },
    $transaction: async <T>(fn: (tx: unknown) => Promise<T>) => fn(db),
  };

  return { db, rows, creditTransactions };
}

beforeEach(() => {
  prismaRef.current = null;
  delete process.env.AUTH_GOOGLE_ID;
  delete process.env.AUTH_GOOGLE_SECRET;
});

describe("isGoogleLoginEnabled", () => {
  it("cần cả hai biến môi trường", () => {
    expect(isGoogleLoginEnabled()).toBe(false);

    process.env.AUTH_GOOGLE_ID = "client-id";
    expect(isGoogleLoginEnabled()).toBe(false);

    process.env.AUTH_GOOGLE_SECRET = "client-secret";
    expect(isGoogleLoginEnabled()).toBe(true);
  });
});

describe("linkGoogleAccount", () => {
  it("tạo tài khoản đã xác nhận kèm credit dùng thử cho người mới", async () => {
    const { db, rows, creditTransactions } = createFakeDb();
    prismaRef.current = db;

    const linked = await linkGoogleAccount({
      googleId: "google-sub-1",
      email: "Nguoi.Moi@Example.com",
      name: "Người Mới",
    });

    const user = rows.get(linked.id)!;
    expect(user.email).toBe("nguoi.moi@example.com");
    expect(user.name).toBe("Người Mới");
    expect(user.googleId).toBe("google-sub-1");
    expect(user.passwordHash).toBeNull();
    expect(user.emailVerifiedAt).toBeInstanceOf(Date);
    expect(user.credits).toBe(FREE_TRIAL_CREDITS);
    expect(user.freeCreditsGrantedAt).toBeInstanceOf(Date);
    expect(creditTransactions).toEqual([
      {
        userId: user.id,
        type: "FREE_GRANT",
        amount: FREE_TRIAL_CREDITS,
        balanceAfter: FREE_TRIAL_CREDITS,
      },
    ]);
  });

  it("gắn vào tài khoản mật khẩu cùng email mà không cộng credit lần hai", async () => {
    const existing = makeUser({
      id: "usr_1",
      email: "cu@example.com",
      name: "Tên Tự Đặt",
      passwordHash: "hash",
      credits: 2,
      emailVerifiedAt: new Date("2026-01-01"),
      freeCreditsGrantedAt: new Date("2026-01-01"),
      passwordChangedAt: new Date("2026-02-01"),
      role: "ADMIN",
    });
    const { db, rows, creditTransactions } = createFakeDb([existing]);
    prismaRef.current = db;

    const linked = await linkGoogleAccount({
      googleId: "google-sub-2",
      email: "cu@example.com",
      name: "Tên Bên Google",
    });

    expect(linked.id).toBe("usr_1");
    // Quyền và mốc đổi mật khẩu đi thẳng vào token, nên phải là của tài khoản
    // trong database chứ không phải mặc định của một tài khoản vừa tạo.
    expect(linked.role).toBe("ADMIN");
    expect(linked.passwordChangedAt).toEqual(new Date("2026-02-01"));

    const user = rows.get("usr_1")!;
    expect(user.googleId).toBe("google-sub-2");
    expect(user.name).toBe("Tên Tự Đặt");
    expect(user.passwordHash).toBe("hash");
    expect(user.credits).toBe(2);
    expect(creditTransactions).toEqual([]);
    expect(rows.size).toBe(1);
  });

  it("mở khoá và tặng credit cho tài khoản đăng ký nhưng chưa xác nhận email", async () => {
    const { db, rows, creditTransactions } = createFakeDb([
      makeUser({
        id: "usr_1",
        email: "chua-xac-nhan@example.com",
        passwordHash: "hash",
      }),
    ]);
    prismaRef.current = db;

    await linkGoogleAccount({
      googleId: "google-sub-3",
      email: "chua-xac-nhan@example.com",
      name: "Người Chờ",
    });

    const user = rows.get("usr_1")!;
    expect(user.emailVerifiedAt).toBeInstanceOf(Date);
    expect(user.credits).toBe(FREE_TRIAL_CREDITS);
    expect(user.name).toBe("Người Chờ");
    expect(creditTransactions).toHaveLength(1);
    expect(creditTransactions[0]!.balanceAfter).toBe(FREE_TRIAL_CREDITS);
  });

  it("theo googleId khi người dùng đã đổi địa chỉ Gmail", async () => {
    const { db, rows } = createFakeDb([
      makeUser({
        id: "usr_1",
        email: "dia-chi-cu@example.com",
        googleId: "google-sub-4",
        emailVerifiedAt: new Date("2026-01-01"),
        freeCreditsGrantedAt: new Date("2026-01-01"),
        credits: 5,
      }),
    ]);
    prismaRef.current = db;

    const linked = await linkGoogleAccount({
      googleId: "google-sub-4",
      email: "dia-chi-moi@example.com",
    });

    expect(linked.id).toBe("usr_1");
    expect(rows.size).toBe(1);
    // Email trong database không chạy theo Google: cột đó là khoá duy nhất và
    // là thứ hoá đơn, email xác nhận cùng mọi đường liên lạc khác đang dùng.
    expect(rows.get("usr_1")!.email).toBe("dia-chi-cu@example.com");
    expect(rows.get("usr_1")!.credits).toBe(5);
  });

  it("cắt tên quá dài về đúng trần của form hồ sơ", async () => {
    const { db, rows } = createFakeDb();
    prismaRef.current = db;

    const linked = await linkGoogleAccount({
      googleId: "google-sub-5",
      email: "ten-dai@example.com",
      name: "  " + "a".repeat(100) + "  ",
    });

    expect(rows.get(linked.id)!.name).toHaveLength(60);
  });

  it("để tên null khi Google không đưa về tên nào", async () => {
    const { db, rows } = createFakeDb();
    prismaRef.current = db;

    const linked = await linkGoogleAccount({
      googleId: "google-sub-6",
      email: "khong-ten@example.com",
      name: "   ",
    });

    expect(rows.get(linked.id)!.name).toBeNull();
  });
});
