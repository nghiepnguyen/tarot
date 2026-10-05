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
  SignedNumber,
  Td,
  TextLink,
  Th,
  Tr,
} from "@/components/admin/Panel";
import { CREDIT_TYPE, CREDIT_TYPES } from "@/lib/admin/labels";
import { formatVnDateTime } from "@/lib/admin/time";

const PAGE_SIZE = 100;
const PATH = "/admin/transactions";

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string; page?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const type = CREDIT_TYPES.find((value) => value === params.type);
  const q = (params.q ?? "").trim();
  const page = parsePage(params.page);

  const search: Prisma.CreditTransactionWhereInput = q
    ? { user: { email: { contains: q, mode: "insensitive" } } }
    : {};
  const where: Prisma.CreditTransactionWhereInput = type ? { ...search, type } : search;

  const [total, transactions, counts, sum] = await Promise.all([
    prisma.creditTransaction.count({ where }),
    prisma.creditTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { id: true, email: true } } },
    }),
    prisma.creditTransaction.groupBy({ by: ["type"], where: search, _count: { _all: true } }),
    prisma.creditTransaction.aggregate({ where, _sum: { amount: true } }),
  ]);
  const countOf = (value: string) => counts.find((row) => row.type === value)?._count._all ?? 0;
  const allCount = counts.reduce((acc, row) => acc + row._count._all, 0);

  return (
    <>
      <PageHeader
        title="Sổ credit"
        description="Mỗi lần số dư đổi là một dòng, chỉ thêm không sửa. Tiền thật nằm ở bảng Đơn hàng; sổ này đếm credit."
        meta={
          <>
            <span>
              {total.toLocaleString("vi-VN")} dòng khớp bộ lọc · tổng thay đổi{" "}
              <SignedNumber value={sum._sum.amount ?? 0} /> credit
            </span>
            <span>Sắp xếp: mới nhất trước · giờ VN</span>
          </>
        }
      />

      <div className="flex flex-col gap-3">
        <SearchForm action={PATH} defaultValue={q} placeholder="Email khách" hidden={{ type }} />
        <FilterTabs
          label="Lọc theo loại giao dịch"
          options={[
            { href: buildHref(PATH, { q }), label: "Tất cả", count: allCount, active: !type },
            ...CREDIT_TYPES.map((value) => ({
              href: buildHref(PATH, { q, type: value }),
              label: CREDIT_TYPE[value].label,
              title: value,
              count: countOf(value),
              active: type === value,
            })),
          ]}
        />
      </div>

      {transactions.length === 0 ? (
        <EmptyRow>Không có giao dịch nào khớp bộ lọc.</EmptyRow>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <DataTable>
            <thead>
              <tr>
                <Th>Lúc</Th>
                <Th>Khách</Th>
                <Th>Loại</Th>
                <Th align="right">Thay đổi</Th>
                <Th align="right">Số dư sau</Th>
                <Th>Liên quan</Th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <Tr key={tx.id}>
                  <Td className="whitespace-nowrap text-muted">{formatVnDateTime(tx.createdAt)}</Td>
                  <Td>
                    <TextLink href={`/admin/users/${tx.user.id}`}>{tx.user.email}</TextLink>
                  </Td>
                  <Td>
                    <Badge tone={CREDIT_TYPE[tx.type].tone} title={tx.type}>
                      {CREDIT_TYPE[tx.type].label}
                    </Badge>
                  </Td>
                  <Td align="right">
                    <SignedNumber value={tx.amount} />
                  </Td>
                  <Td align="right" className={tx.balanceAfter < 0 ? "text-red-700 dark:text-red-400" : "text-muted"}>
                    {tx.balanceAfter}
                  </Td>
                  <Td>
                    {tx.relatedOrderId ? (
                      <TextLink href={buildHref("/admin/orders", { q: tx.relatedOrderId })}>
                        <span className="font-mono text-xs">đơn {tx.relatedOrderId}</span>
                      </TextLink>
                    ) : tx.relatedReadingId ? (
                      <Mono>trải bài {tx.relatedReadingId}</Mono>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </DataTable>
          <Pagination path={PATH} params={{ type, q }} page={page} pageSize={PAGE_SIZE} total={total} />
        </div>
      )}
    </>
  );
}
