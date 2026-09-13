/**
 * Fake Prisma đủ dùng cho các test về vòng đời đơn hàng: Order, User và
 * CreditTransaction trong bộ nhớ.
 *
 * Cố tình không mock từng lời gọi một. Logic thanh toán dựa vào ngữ nghĩa thật
 * của `updateMany` (số dòng khớp điều kiện) để bảo đảm idempotency, nên bản
 * fake phải diễn lại đúng ngữ nghĩa đó thì test mới nói lên điều gì.
 */
import type { Order, OrderStatus, CreditTransactionType } from "@prisma/client";

export interface FakeUser {
  id: string;
  credits: number;
}

export interface FakeCreditTransaction {
  userId: string;
  type: CreditTransactionType;
  amount: number;
  balanceAfter: number;
  relatedOrderId?: string | null;
  relatedReadingId?: string | null;
}

type NumericUpdate = number | { increment?: number; decrement?: number };

function applyNumeric(current: number, update: NumericUpdate): number {
  if (typeof update === "number") return update;
  if (update.increment !== undefined) return current + update.increment;
  if (update.decrement !== undefined) return current - update.decrement;
  return current;
}

export interface OrderSeed {
  id: string;
  userId: string;
  providerOrderId: string;
  amountVnd: number;
  creditsGranted: number;
  status?: OrderStatus;
  createdAt?: Date;
  expiresAt?: Date | null;
  providerPaymentLinkId?: string | null;
}

export function makeOrder(seed: OrderSeed): Order {
  return {
    id: seed.id,
    userId: seed.userId,
    packageId: "pkg_1",
    provider: "payos",
    providerOrderId: seed.providerOrderId,
    providerPaymentLinkId:
      seed.providerPaymentLinkId === undefined ? "link_1" : seed.providerPaymentLinkId,
    amountVnd: seed.amountVnd,
    creditsGranted: seed.creditsGranted,
    status: seed.status ?? "PENDING",
    createdAt: seed.createdAt ?? new Date(),
    expiresAt: seed.expiresAt === undefined ? null : seed.expiresAt,
    paidAt: null,
    reconciledAt: null,
  };
}

export function createFakePrisma(orders: Order[] = [], users: FakeUser[] = []) {
  const orderRows = new Map(orders.map((order) => [order.id, { ...order }]));
  const userRows = new Map(users.map((user) => [user.id, { ...user }]));
  const creditTransactions: FakeCreditTransaction[] = [];

  const matches = (order: Order, where: Record<string, unknown>): boolean =>
    Object.entries(where).every(([key, value]) => {
      if (key === "createdAt" && value && typeof value === "object") {
        const { lte } = value as { lte?: Date };
        return lte ? order.createdAt <= lte : true;
      }
      return order[key as keyof Order] === value;
    });

  const db = {
    order: {
      findUnique: async ({ where }: { where: Record<string, unknown> }) => {
        for (const order of orderRows.values()) {
          if (matches(order, where)) return { ...order };
        }
        return null;
      },
      findMany: async ({
        where = {},
        take,
      }: {
        where?: Record<string, unknown>;
        orderBy?: unknown;
        take?: number;
      }) => {
        const found = [...orderRows.values()]
          .filter((order) => matches(order, where))
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .map((order) => ({ ...order }));
        return take === undefined ? found : found.slice(0, take);
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: Record<string, unknown>;
        data: Partial<Order>;
      }) => {
        let count = 0;
        for (const [id, order] of orderRows) {
          if (!matches(order, where)) continue;
          orderRows.set(id, { ...order, ...data });
          count += 1;
        }
        return { count };
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<Order> }) => {
        const order = orderRows.get(where.id);
        if (!order) throw new Error(`Fake Prisma: không có đơn ${where.id}`);
        const next = { ...order, ...data };
        orderRows.set(where.id, next);
        return { ...next };
      },
    },
    user: {
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { credits?: NumericUpdate };
      }) => {
        const user = userRows.get(where.id);
        if (!user) throw new Error(`Fake Prisma: không có user ${where.id}`);
        const next = {
          ...user,
          credits: data.credits === undefined ? user.credits : applyNumeric(user.credits, data.credits),
        };
        userRows.set(where.id, next);
        return { ...next };
      },
    },
    creditTransaction: {
      create: async ({ data }: { data: FakeCreditTransaction }) => {
        creditTransactions.push(data);
        return data;
      },
    },
    // `tx` để unknown: bản fake dùng chính nó làm transaction client, và
    // khai báo `typeof db` ở đây sẽ tạo vòng lặp kiểu.
    $transaction: async <T,>(fn: (tx: never) => Promise<T>): Promise<T> =>
      fn(db as never),
  };

  return {
    db,
    orderRows,
    userRows,
    creditTransactions,
    order: (id: string) => orderRows.get(id),
    user: (id: string) => userRows.get(id),
  };
}
