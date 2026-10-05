import type { Prisma } from "@prisma/client";
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
  SearchForm,
  Td,
  TextLink,
  Th,
  Tr,
} from "@/components/admin/Panel";
import { RefundOrderForm, ReconcileOrderButton } from "@/components/admin/OrderActions";
import { ORDER_STATUS, ORDER_STATUSES } from "@/lib/admin/labels";
import { formatVnDateTime } from "@/lib/admin/time";

const PAGE_SIZE = 50;
const PATH = "/admin/orders";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const status = ORDER_STATUSES.find((value) => value === params.status);
  const q = (params.q ?? "").trim();
  const page = parsePage(params.page);

  // Tìm theo email khách hoặc mã đơn PayOS: khách gọi tới thường đọc một trong
  // hai thứ đó, hiếm khi đọc được id nội bộ.
  const search: Prisma.OrderWhereInput = q
    ? {
        OR: [
          { user: { email: { contains: q, mode: "insensitive" } } },
          { providerOrderId: { contains: q } },
          { id: q },
        ],
      }
    : {};
  const where: Prisma.OrderWhereInput = status ? { ...search, status } : search;

  const [total, orders, counts, sum] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: { select: { id: true, email: true } },
        package: { select: { name: true } },
      },
    }),
    // Số đếm trên tab tính theo ô tìm kiếm hiện tại, không theo tab: đổi tab
    // phải thấy trước mình sẽ được bao nhiêu dòng.
    prisma.order.groupBy({ by: ["status"], where: search, _count: { _all: true } }),
    prisma.order.aggregate({ where, _sum: { amountVnd: true } }),
  ]);
  const countOf = (value: string) => counts.find((row) => row.status === value)?._count._all ?? 0;
  const allCount = counts.reduce((acc, row) => acc + row._count._all, 0);

  return (
    <>
      <PageHeader
        title="Đơn hàng"
        description="Hoàn credit chỉ thu hồi credit; tiền phải hoàn tay trên dashboard PayOS. Đối soát hỏi lại PayOS cho đơn còn chờ."
        meta={
          <>
            <span>
              {total.toLocaleString("vi-VN")} đơn khớp bộ lọc · tổng tiền{" "}
              <strong className="font-medium tabular-nums text-foreground">
                {(sum._sum.amountVnd ?? 0).toLocaleString("vi-VN")}đ
              </strong>
            </span>
            <span>Sắp xếp: mới nhất trước · giờ VN</span>
          </>
        }
      />

      <div className="flex flex-col gap-3">
        <SearchForm action={PATH} defaultValue={q} placeholder="Email, mã PayOS hoặc id đơn" hidden={{ status }} />
        <FilterTabs
          label="Lọc theo trạng thái"
          options={[
            { href: buildHref(PATH, { q }), label: "Tất cả", count: allCount, active: !status },
            ...ORDER_STATUSES.map((value) => ({
              href: buildHref(PATH, { q, status: value }),
              label: ORDER_STATUS[value].label,
              title: ORDER_STATUS[value].hint,
              count: countOf(value),
              active: status === value,
            })),
          ]}
        />
      </div>

      {orders.length === 0 ? (
        <EmptyRow>Không có đơn nào khớp bộ lọc.</EmptyRow>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <DataTable minWidth="min-w-5xl">
            <thead>
              <tr>
                <Th>Tạo lúc</Th>
                <Th>Khách</Th>
                <Th>Gói</Th>
                <Th align="right">Tiền</Th>
                <Th align="right">Credit</Th>
                <Th>Trạng thái</Th>
                <Th>Trả lúc</Th>
                <Th>Mã PayOS</Th>
                <Th>Thao tác</Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <Tr key={order.id}>
                  <Td className="whitespace-nowrap text-muted">{formatVnDateTime(order.createdAt)}</Td>
                  <Td>
                    <TextLink href={`/admin/users/${order.user.id}`}>{order.user.email}</TextLink>
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{order.package.name}</Td>
                  <Td align="right">{order.amountVnd.toLocaleString("vi-VN")}đ</Td>
                  <Td align="right" className="text-muted">
                    {order.creditsGranted}
                  </Td>
                  <Td>
                    <Badge tone={ORDER_STATUS[order.status].tone} title={ORDER_STATUS[order.status].hint}>
                      {ORDER_STATUS[order.status].label}
                    </Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{order.paidAt ? formatVnDateTime(order.paidAt) : "—"}</Td>
                  <Td>
                    <Mono title={`id nội bộ: ${order.id}`}>{order.providerOrderId}</Mono>
                  </Td>
                  <Td className="min-w-40">
                    {order.status === "PAID" ? <RefundOrderForm orderId={order.id} /> : null}
                    {order.status === "PENDING" ? <ReconcileOrderButton orderId={order.id} /> : null}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </DataTable>
          <Pagination path={PATH} params={{ status, q }} page={page} pageSize={PAGE_SIZE} total={total} />
        </div>
      )}
    </>
  );
}
