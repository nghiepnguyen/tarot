import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { EmptyRow } from "@/components/admin/Panel";
import { RefundOrderForm, ReconcileOrderButton } from "@/components/admin/OrderActions";

const STATUSES: OrderStatus[] = ["PENDING", "PAID", "FAILED", "EXPIRED", "CANCELLED", "REFUNDED"];
const PAGE_SIZE = 50;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const status = STATUSES.find((value) => value === params.status);
  const where = status ? { status } : {};

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" as const },
      take: PAGE_SIZE,
      include: {
        user: { select: { id: true, email: true } },
        package: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Đơn hàng</h1>
        <p className="text-sm text-muted">
          {total} đơn{status ? ` ở trạng thái ${status}` : ""} · hiện {Math.min(total, PAGE_SIZE)} đơn mới nhất
        </p>
      </div>

      <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Lọc theo trạng thái">
        <Link
          href="/admin/orders"
          aria-current={status ? undefined : "page"}
          className={`text-sm transition-colors duration-300 hover:text-accent ${status ? "text-muted" : "text-accent"}`}
        >
          Tất cả
        </Link>
        {STATUSES.map((value) => (
          <Link
            key={value}
            href={`/admin/orders?status=${value}`}
            aria-current={status === value ? "page" : undefined}
            className={`text-sm transition-colors duration-300 hover:text-accent ${
              status === value ? "text-accent" : "text-muted"
            }`}
          >
            {value}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <EmptyRow>Không có đơn nào.</EmptyRow>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-3xl text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-3 font-normal">Tạo lúc</th>
                <th className="px-4 py-3 font-normal">Khách</th>
                <th className="px-4 py-3 font-normal">Gói</th>
                <th className="px-4 py-3 text-right font-normal">Tiền</th>
                <th className="px-4 py-3 text-right font-normal">Credit</th>
                <th className="px-4 py-3 font-normal">Trạng thái</th>
                <th className="px-4 py-3 font-normal">PayOS</th>
                <th className="px-4 py-3 font-normal">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border/50 align-top last:border-0">
                  <td className="px-4 py-3 text-muted">{order.createdAt.toLocaleString("vi-VN")}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${order.user.id}`}
                      className="text-foreground transition-colors duration-300 hover:text-accent"
                    >
                      {order.user.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{order.package.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {order.amountVnd.toLocaleString("vi-VN")}đ
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted">{order.creditsGranted}</td>
                  <td className="px-4 py-3 text-muted">{order.status}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{order.providerOrderId}</td>
                  <td className="px-4 py-3">
                    {order.status === "PAID" ? <RefundOrderForm orderId={order.id} /> : null}
                    {order.status === "PENDING" ? <ReconcileOrderButton orderId={order.id} /> : null}
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
