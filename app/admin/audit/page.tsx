import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { EmptyRow } from "@/components/admin/Panel";

const ACTION_LABEL: Record<string, string> = {
  credit_adjust: "Chỉnh credit",
  order_refund: "Hoàn đơn",
  order_reconcile: "Đối soát đơn",
  ai_model_change: "Đổi model AI",
};

const PAGE_SIZE = 100;

export default async function AdminAuditPage() {
  await requireAdmin();

  const logs = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
  });

  // Cố tình không join: `AdminAuditLog` không có khoá ngoại để dòng nhật ký
  // sống sót khi tài khoản bị xoá. Email tra riêng, ai còn thì hiện email, ai
  // mất thì hiện id.
  const ids = [...new Set(logs.flatMap((log) => [log.adminUserId, log.targetUserId ?? ""]))].filter(
    Boolean,
  );
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, email: true },
  });
  const emailById = new Map(users.map((user) => [user.id, user.email]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nhật ký quản trị</h1>
        <p className="text-sm text-muted">
          {PAGE_SIZE} dòng gần nhất. Sổ credit ghi cái gì đã xảy ra; chỗ này ghi ai làm và vì sao.
        </p>
      </div>

      {logs.length === 0 ? (
        <EmptyRow>Chưa có thao tác quản trị nào.</EmptyRow>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-3xl text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-3 font-normal">Lúc</th>
                <th className="px-4 py-3 font-normal">Người làm</th>
                <th className="px-4 py-3 font-normal">Thao tác</th>
                <th className="px-4 py-3 font-normal">Đối tượng</th>
                <th className="px-4 py-3 text-right font-normal">Số credit</th>
                <th className="px-4 py-3 font-normal">Lý do</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border/50 align-top last:border-0">
                  <td className="px-4 py-3 text-muted">{log.createdAt.toLocaleString("vi-VN")}</td>
                  <td className="px-4 py-3 text-foreground">
                    {emailById.get(log.adminUserId) ?? log.adminUserId}
                  </td>
                  <td className="px-4 py-3 text-muted">{ACTION_LABEL[log.action] ?? log.action}</td>
                  <td className="px-4 py-3 text-muted">
                    {log.targetUserId ? (
                      <Link
                        href={`/admin/users/${log.targetUserId}`}
                        className="text-foreground transition-colors duration-300 hover:text-accent"
                      >
                        {emailById.get(log.targetUserId) ?? log.targetUserId}
                      </Link>
                    ) : (
                      "—"
                    )}
                    {log.targetOrderId ? (
                      <span className="block font-mono text-xs">{log.targetOrderId}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {log.amount === null ? "—" : log.amount > 0 ? `+${log.amount}` : log.amount}
                  </td>
                  <td className="px-4 py-3 text-muted">{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
