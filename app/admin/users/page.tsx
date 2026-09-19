import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { Input } from "@/components/ui/Input";
import { EmptyRow } from "@/components/admin/Panel";

const PAGE_SIZE = 25;

function buildHref(q: string, page: number) {
  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (page > 1) query.set("page", String(page));
  const qs = query.toString();
  return qs ? `/admin/users?${qs}` : "/admin/users";
}

function PageLink({
  q,
  page,
  disabled,
  children,
}: {
  q: string;
  page: number;
  disabled: boolean;
  children: string;
}) {
  if (disabled) {
    return (
      <span className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm text-muted opacity-40">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={buildHref(q, page)}
      className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-border px-4 text-sm text-foreground transition-colors duration-300 hover:border-accent hover:text-accent"
    >
      {children}
    </Link>
  );
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const page = Math.max(1, Number(params.page) || 1);

  const where = q ? { email: { contains: q, mode: "insensitive" as const } } : {};

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" as const },
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
        _count: { select: { orders: true, readings: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Người dùng</h1>
        <p className="text-sm text-muted">{total} tài khoản{q ? " khớp tìm kiếm" : ""}</p>
      </div>

      <form action="/admin/users">
        <Input type="search" name="q" defaultValue={q} placeholder="Tìm theo email..." />
      </form>

      {users.length === 0 ? (
        <EmptyRow>Không có tài khoản nào khớp.</EmptyRow>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-3xl text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-3 font-normal">Email</th>
                <th className="px-4 py-3 font-normal">Tên</th>
                <th className="px-4 py-3 text-right font-normal">Credit</th>
                <th className="px-4 py-3 text-right font-normal">Đơn</th>
                <th className="px-4 py-3 text-right font-normal">Trải bài</th>
                <th className="px-4 py-3 font-normal">Trạng thái</th>
                <th className="px-4 py-3 font-normal">Tạo lúc</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-foreground transition-colors duration-300 hover:text-accent"
                    >
                      {user.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{user.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">{user.credits}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted">{user._count.orders}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted">{user._count.readings}</td>
                  <td className="px-4 py-3 text-muted">
                    {user.role === "ADMIN" ? "ADMIN · " : ""}
                    {user.emailVerifiedAt ? "đã xác nhận" : "chưa xác nhận"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {user.createdAt.toLocaleDateString("vi-VN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <nav className="flex items-center justify-between gap-4" aria-label="Phân trang người dùng">
          <PageLink q={q} page={page - 1} disabled={page <= 1}>
            Trước
          </PageLink>
          <p className="text-sm text-muted">
            Trang {page} / {totalPages}
          </p>
          <PageLink q={q} page={page + 1} disabled={page >= totalPages}>
            Sau
          </PageLink>
        </nav>
      ) : null}
    </div>
  );
}
