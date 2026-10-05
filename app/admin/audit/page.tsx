import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import {
  Badge,
  buildHref,
  DataTable,
  EmptyRow,
  FilterTabs,
  Mono,
  PageHeader,
  Pagination,
  parsePage,
  SignedNumber,
  Td,
  TextLink,
  Th,
  Tr,
} from "@/components/admin/Panel";
import { AUDIT_ACTION } from "@/lib/admin/labels";
import { formatVnDateTime } from "@/lib/admin/time";

const PAGE_SIZE = 100;
const PATH = "/admin/audit";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const action = params.action && params.action in AUDIT_ACTION ? params.action : undefined;
  const page = parsePage(params.page);
  const where = action ? { action } : {};

  const [total, logs, counts] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.adminAuditLog.groupBy({ by: ["action"], _count: { _all: true } }),
  ]);
  const countOf = (value: string) => counts.find((row) => row.action === value)?._count._all ?? 0;
  const allCount = counts.reduce((acc, row) => acc + row._count._all, 0);

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
    <>
      <PageHeader
        title="Nhật ký quản trị"
        description="Sổ credit ghi cái gì đã xảy ra; chỗ này ghi ai làm và vì sao. Chỉ thêm, không sửa, không xoá."
        meta={<span>{total.toLocaleString("vi-VN")} dòng · mới nhất trước · giờ VN</span>}
      />

      <FilterTabs
        label="Lọc theo thao tác"
        options={[
          { href: PATH, label: "Tất cả", count: allCount, active: !action },
          ...Object.entries(AUDIT_ACTION).map(([value, meta]) => ({
            href: buildHref(PATH, { action: value }),
            label: meta.label,
            count: countOf(value),
            active: action === value,
          })),
        ]}
      />

      {logs.length === 0 ? (
        <EmptyRow>Chưa có thao tác quản trị nào.</EmptyRow>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <DataTable>
            <thead>
              <tr>
                <Th>Lúc</Th>
                <Th>Người làm</Th>
                <Th>Thao tác</Th>
                <Th>Đối tượng</Th>
                <Th align="right">Credit</Th>
                <Th className="w-1/3">Lý do</Th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <Tr key={log.id}>
                  <Td className="whitespace-nowrap text-muted">{formatVnDateTime(log.createdAt)}</Td>
                  <Td>{emailById.get(log.adminUserId) ?? <Mono>{log.adminUserId}</Mono>}</Td>
                  <Td>
                    <Badge tone={AUDIT_ACTION[log.action]?.tone ?? "neutral"} title={log.action}>
                      {AUDIT_ACTION[log.action]?.label ?? log.action}
                    </Badge>
                  </Td>
                  <Td>
                    {log.targetUserId ? (
                      <TextLink href={`/admin/users/${log.targetUserId}`}>
                        {emailById.get(log.targetUserId) ?? log.targetUserId}
                      </TextLink>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                    {log.targetOrderId ? (
                      <span className="block">
                        <TextLink href={buildHref("/admin/orders", { q: log.targetOrderId })}>
                          <span className="font-mono text-xs">đơn {log.targetOrderId}</span>
                        </TextLink>
                      </span>
                    ) : null}
                  </Td>
                  <Td align="right">{log.amount === null ? <span className="text-muted">—</span> : <SignedNumber value={log.amount} />}</Td>
                  <Td className="whitespace-pre-wrap break-words text-foreground">{log.reason}</Td>
                </Tr>
              ))}
            </tbody>
          </DataTable>
          <Pagination path={PATH} params={{ action }} page={page} pageSize={PAGE_SIZE} total={total} />
        </div>
      )}
    </>
  );
}
