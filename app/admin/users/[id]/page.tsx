import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import {
  Badge,
  buildHref,
  DataTable,
  Mono,
  PageHeader,
  Panel,
  SignedNumber,
  Stat,
  Td,
  TextLink,
  Th,
  Tr,
} from "@/components/admin/Panel";
import { AdjustCreditsForm } from "@/components/admin/AdjustCreditsForm";
import { RefundOrderForm, ReconcileOrderButton } from "@/components/admin/OrderActions";
import { CREDIT_TYPE, ORDER_STATUS } from "@/lib/admin/labels";
import { formatVnDateTime } from "@/lib/admin/time";

const datetime = formatVnDateTime;
const TX_LIMIT = 50;

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
      _count: { select: { readings: true, creditTransactions: true } },
    },
  });
  if (!user) notFound();

  const [transactions, orders, paid] = await Promise.all([
    prisma.creditTransaction.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: TX_LIMIT,
    }),
    prisma.order.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      include: { package: { select: { name: true } } },
    }),
    prisma.order.aggregate({ where: { userId: id, status: "PAID" }, _sum: { amountVnd: true }, _count: { _all: true } }),
  ]);

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link href="/admin/users" className="text-sm text-muted transition-colors duration-150 hover:text-foreground">
          ← Người dùng
        </Link>
        <PageHeader
          title={user.email}
          meta={
            <>
              <span>{user.name ?? "chưa đặt tên"}</span>
              <span>
                id <span className="font-mono">{user.id}</span>
              </span>
              <span>đăng ký {datetime(user.createdAt)} (giờ VN)</span>
            </>
          }
          actions={
            <>
              {user.role === "ADMIN" ? <Badge tone="danger">ADMIN</Badge> : null}
              {user.emailVerifiedAt ? <Badge tone="success">Đã xác nhận email</Badge> : <Badge tone="warning">Chưa xác nhận email</Badge>}
            </>
          }
        />
      </div>

      <section aria-label="Tóm tắt" className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <Stat label="Số dư" value={String(user.credits)} tone={user.credits < 0 ? "danger" : undefined} hint="credit" />
        <Stat
          label="Đã trả"
          value={`${(paid._sum.amountVnd ?? 0).toLocaleString("vi-VN")}đ`}
          hint={`${paid._count._all} đơn PAID`}
        />
        <Stat label="Lượt trải bài" value={String(user._count.readings)} />
        <Stat
          label="Xác nhận email"
          value={user.emailVerifiedAt ? "Rồi" : "Chưa"}
          hint={user.emailVerifiedAt ? datetime(user.emailVerifiedAt) : undefined}
        />
        <Stat
          label="Credit dùng thử"
          value={user.freeCreditsGrantedAt ? "Đã nhận" : "Chưa nhận"}
          hint={user.freeCreditsGrantedAt ? datetime(user.freeCreditsGrantedAt) : undefined}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel title={`Đơn hàng (${orders.length})`} flush>
            {orders.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted">Chưa có đơn nào.</p>
            ) : (
              <DataTable>
                <thead>
                  <tr>
                    <Th>Tạo lúc</Th>
                    <Th>Gói</Th>
                    <Th align="right">Tiền</Th>
                    <Th align="right">Credit</Th>
                    <Th>Trạng thái</Th>
                    <Th>Mã PayOS</Th>
                    <Th>Thao tác</Th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <Tr key={order.id}>
                      <Td className="whitespace-nowrap text-muted">{datetime(order.createdAt)}</Td>
                      <Td className="whitespace-nowrap">{order.package.name}</Td>
                      <Td align="right">{order.amountVnd.toLocaleString("vi-VN")}đ</Td>
                      <Td align="right" className="text-muted">
                        {order.creditsGranted}
                      </Td>
                      <Td>
                        <Badge tone={ORDER_STATUS[order.status].tone} title={ORDER_STATUS[order.status].hint}>
                          {ORDER_STATUS[order.status].label}
                        </Badge>
                      </Td>
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
            )}
          </Panel>

          <Panel
            title="Sổ credit"
            note={`${Math.min(TX_LIMIT, user._count.creditTransactions)} / ${user._count.creditTransactions} dòng gần nhất.`}
            actions={
              user._count.creditTransactions > TX_LIMIT ? (
                <TextLink href={buildHref("/admin/transactions", { q: user.email })}>Xem tất cả →</TextLink>
              ) : null
            }
            flush
          >
            {transactions.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted">Chưa có giao dịch nào.</p>
            ) : (
              <DataTable minWidth="min-w-xl">
                <thead>
                  <tr>
                    <Th>Lúc</Th>
                    <Th>Loại</Th>
                    <Th align="right">Thay đổi</Th>
                    <Th align="right">Số dư sau</Th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <Tr key={tx.id}>
                      <Td className="whitespace-nowrap text-muted">{datetime(tx.createdAt)}</Td>
                      <Td>
                        <Badge tone={CREDIT_TYPE[tx.type].tone} title={tx.type}>
                          {CREDIT_TYPE[tx.type].label}
                        </Badge>
                      </Td>
                      <Td align="right">
                        <SignedNumber value={tx.amount} />
                      </Td>
                      <Td align="right" className="text-muted">
                        {tx.balanceAfter}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </DataTable>
            )}
          </Panel>
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <Panel
            title="Chỉnh credit"
            note="Ghi vào sổ với loại ADMIN_ADJUST và ký tên vào nhật ký quản trị. Không có đường nào chỉnh số dư mà không để lại vết."
          >
            <AdjustCreditsForm userId={user.id} currentCredits={user.credits} />
          </Panel>
        </div>
      </div>
    </>
  );
}
