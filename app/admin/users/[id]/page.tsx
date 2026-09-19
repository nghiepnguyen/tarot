import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { Panel, Stat, EmptyRow } from "@/components/admin/Panel";
import { AdjustCreditsForm } from "@/components/admin/AdjustCreditsForm";
import { RefundOrderForm, ReconcileOrderButton } from "@/components/admin/OrderActions";

const CREDIT_TYPE_LABEL: Record<string, string> = {
  FREE_GRANT: "Tặng dùng thử",
  PURCHASE: "Nạp tiền",
  UNLOCK_SPEND: "Mở khóa AI",
  REFUND: "Hoàn lại",
  ADMIN_ADJUST: "Chỉnh tay",
};

const datetime = (value: Date) => value.toLocaleString("vi-VN");

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      credits: true,
      emailVerifiedAt: true,
      freeCreditsGrantedAt: true,
      createdAt: true,
      _count: { select: { readings: true } },
    },
  });
  if (!user) notFound();

  const [transactions, orders] = await Promise.all([
    prisma.creditTransaction.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.order.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      include: { package: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <Link href="/admin/users" className="text-sm text-muted transition-colors duration-300 hover:text-accent">
          ← Người dùng
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{user.email}</h1>
        <p className="text-sm text-muted">
          {user.name ?? "chưa đặt tên"} · {user.role} · tạo {datetime(user.createdAt)}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Số dư" value={String(user.credits)} />
        <Stat label="Lượt trải bài" value={String(user._count.readings)} />
        <Stat
          label="Xác nhận email"
          value={user.emailVerifiedAt ? "rồi" : "chưa"}
          hint={user.emailVerifiedAt ? datetime(user.emailVerifiedAt) : undefined}
        />
        <Stat
          label="Đã nhận credit dùng thử"
          value={user.freeCreditsGrantedAt ? "rồi" : "chưa"}
          hint={user.freeCreditsGrantedAt ? datetime(user.freeCreditsGrantedAt) : undefined}
        />
      </div>

      <Panel
        title="Chỉnh credit"
        note="Ghi vào sổ với loại ADMIN_ADJUST và ký tên vào nhật ký quản trị. Không có đường nào chỉnh số dư mà không để lại vết."
      >
        <AdjustCreditsForm userId={user.id} currentCredits={user.credits} />
      </Panel>

      <Panel title="Đơn hàng">
        {orders.length === 0 ? (
          <EmptyRow>Chưa có đơn nào.</EmptyRow>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-3xl text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th className="py-2 font-normal">Tạo lúc</th>
                  <th className="py-2 font-normal">Gói</th>
                  <th className="py-2 text-right font-normal">Tiền</th>
                  <th className="py-2 text-right font-normal">Credit</th>
                  <th className="py-2 font-normal">Trạng thái</th>
                  <th className="py-2 font-normal">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border/50 align-top last:border-0">
                    <td className="py-3 text-muted">{datetime(order.createdAt)}</td>
                    <td className="py-3 text-foreground">{order.package.name}</td>
                    <td className="py-3 text-right tabular-nums text-foreground">
                      {order.amountVnd.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="py-3 text-right tabular-nums text-muted">{order.creditsGranted}</td>
                    <td className="py-3 text-muted">{order.status}</td>
                    <td className="py-3">
                      {order.status === "PAID" ? <RefundOrderForm orderId={order.id} /> : null}
                      {order.status === "PENDING" ? <ReconcileOrderButton orderId={order.id} /> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Sổ credit" note="50 dòng gần nhất.">
        {transactions.length === 0 ? (
          <EmptyRow>Chưa có giao dịch nào.</EmptyRow>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="py-2 font-normal">Lúc</th>
                <th className="py-2 font-normal">Loại</th>
                <th className="py-2 text-right font-normal">Thay đổi</th>
                <th className="py-2 text-right font-normal">Số dư sau</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2 text-muted">{datetime(tx.createdAt)}</td>
                  <td className="py-2 text-foreground">{CREDIT_TYPE_LABEL[tx.type] ?? tx.type}</td>
                  <td className="py-2 text-right tabular-nums text-foreground">
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </td>
                  <td className="py-2 text-right tabular-nums text-muted">{tx.balanceAfter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}
