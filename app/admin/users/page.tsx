import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import {
  Badge,
  buildHref,
  DataTable,
  EmptyRow,
  FilterTabs,
  PageHeader,
  Pagination,
  parsePage,
  SearchForm,
  Td,
  TextLink,
  Th,
  Tr,
} from "@/components/admin/Panel";
import { formatVnDateTime } from "@/lib/admin/time";

const PAGE_SIZE = 50;
const PATH = "/admin/users";

const FILTERS = {
  unverified: { label: "Chưa xác nhận", where: { emailVerifiedAt: null } },
  negative: { label: "Số dư âm", where: { credits: { lt: 0 } } },
  paying: { label: "Đã trả tiền", where: { orders: { some: { status: "PAID" } } } },
  admin: { label: "Admin", where: { role: "ADMIN" } },
} satisfies Record<string, { label: string; where: Prisma.UserWhereInput }>;
type FilterKey = keyof typeof FILTERS;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; filter?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const page = parsePage(params.page);
  const filter = params.filter && params.filter in FILTERS ? (params.filter as FilterKey) : undefined;

  const search: Prisma.UserWhereInput = q
    ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }, { id: q }] }
    : {};
  const where: Prisma.UserWhereInput = filter ? { AND: [search, FILTERS[filter].where] } : search;

  const [total, users, allCount, ...filterCounts] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        credits: true,
        emailVerifiedAt: true,
        createdAt: true,
        _count: { select: { orders: { where: { status: "PAID" } }, readings: true } },
      },
    }),
    prisma.user.count({ where: search }),
    ...Object.values(FILTERS).map((item) => prisma.user.count({ where: { AND: [search, item.where] } })),
  ]);

  return (
    <>
      <PageHeader
        title="Người dùng"
        description="Bấm email để xem số dư, đơn, sổ credit và chỉnh credit của từng người."
        meta={<span>{total.toLocaleString("vi-VN")} tài khoản khớp bộ lọc · mới đăng ký trước · giờ VN</span>}
      />

      <div className="flex flex-col gap-3">
        <SearchForm action={PATH} defaultValue={q} placeholder="Email, tên hoặc id" hidden={{ filter }} />
        <FilterTabs
          label="Lọc người dùng"
          options={[
            { href: buildHref(PATH, { q }), label: "Tất cả", count: allCount, active: !filter },
            ...(Object.keys(FILTERS) as FilterKey[]).map((key, index) => ({
              href: buildHref(PATH, { q, filter: key }),
              label: FILTERS[key].label,
              count: filterCounts[index],
              active: filter === key,
            })),
          ]}
        />
      </div>

      {users.length === 0 ? (
        <EmptyRow>Không có tài khoản nào khớp.</EmptyRow>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <DataTable>
            <thead>
              <tr>
                <Th>Email</Th>
                <Th>Tên</Th>
                <Th align="right">Số dư</Th>
                <Th align="right">Đơn đã trả</Th>
                <Th align="right">Trải bài</Th>
                <Th>Trạng thái</Th>
                <Th>Đăng ký lúc</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td>
                    <TextLink href={`/admin/users/${user.id}`}>{user.email}</TextLink>
                  </Td>
                  <Td className="text-muted">{user.name ?? "—"}</Td>
                  <Td align="right" className={user.credits < 0 ? "font-medium text-red-700 dark:text-red-400" : ""}>
                    {user.credits}
                  </Td>
                  <Td align="right" className="text-muted">
                    {user._count.orders}
                  </Td>
                  <Td align="right" className="text-muted">
                    {user._count.readings}
                  </Td>
                  <Td>
                    <span className="flex flex-wrap gap-1">
                      {user.role === "ADMIN" ? <Badge tone="danger">ADMIN</Badge> : null}
                      {user.emailVerifiedAt ? (
                        <Badge tone="success">Đã xác nhận</Badge>
                      ) : (
                        <Badge tone="warning">Chưa xác nhận</Badge>
                      )}
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{formatVnDateTime(user.createdAt)}</Td>
                </Tr>
              ))}
            </tbody>
          </DataTable>
          <Pagination path={PATH} params={{ q, filter }} page={page} pageSize={PAGE_SIZE} total={total} />
        </div>
      )}
    </>
  );
}
