import Link from "next/link";
import type { CreditTransactionType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { EmptyRow } from "@/components/admin/Panel";

const TYPES: CreditTransactionType[] = [
  "FREE_GRANT",
  "PURCHASE",
  "UNLOCK_SPEND",
  "REFUND",
  "ADMIN_ADJUST",
];

const TYPE_LABEL: Record<CreditTransactionType, string> = {
  FREE_GRANT: "Tặng dùng thử",
  PURCHASE: "Nạp tiền",
  UNLOCK_SPEND: "Mở khóa AI",
  REFUND: "Hoàn lại",
  ADMIN_ADJUST: "Chỉnh tay",
};

const PAGE_SIZE = 100;

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const type = TYPES.find((value) => value === params.type);
  const where = type ? { type } : {};

  const transactions = await prisma.creditTransaction.findMany({
    where,
    orderBy: { createdAt: "desc" as const },
    take: PAGE_SIZE,
    include: { user: { select: { id: true, email: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sổ credit</h1>
        <p className="text-sm text-muted">{PAGE_SIZE} dòng gần nhất. Đây là con số doanh thu đúng, không phải GA4.</p>
      </div>

      <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Lọc theo loại giao dịch">
        <Link
          href="/admin/transactions"
          aria-current={type ? undefined : "page"}
          className={`text-sm transition-colors duration-300 hover:text-accent ${type ? "text-muted" : "text-accent"}`}
        >
          Tất cả
        </Link>
        {TYPES.map((value) => (
          <Link
            key={value}
            href={`/admin/transactions?type=${value}`}
            aria-current={type === value ? "page" : undefined}
            className={`text-sm transition-colors duration-300 hover:text-accent ${
              type === value ? "text-accent" : "text-muted"
            }`}
          >
            {TYPE_LABEL[value]}
          </Link>
        ))}
      </nav>

      {transactions.length === 0 ? (
        <EmptyRow>Chưa có giao dịch nào.</EmptyRow>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-3xl text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-3 font-normal">Lúc</th>
                <th className="px-4 py-3 font-normal">Khách</th>
                <th className="px-4 py-3 font-normal">Loại</th>
                <th className="px-4 py-3 text-right font-normal">Thay đổi</th>
                <th className="px-4 py-3 text-right font-normal">Số dư sau</th>
                <th className="px-4 py-3 font-normal">Liên quan</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 text-muted">{tx.createdAt.toLocaleString("vi-VN")}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${tx.user.id}`}
                      className="text-foreground transition-colors duration-300 hover:text-accent"
                    >
                      {tx.user.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{TYPE_LABEL[tx.type]}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted">{tx.balanceAfter}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {tx.relatedOrderId ?? tx.relatedReadingId ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
