import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Section } from "@/components/ui/Section";
import { Input } from "@/components/ui/Input";
import { HistoryList } from "@/components/tarot/HistoryList";
import type { StoredCard } from "@/app/actions/readings";
import { toDisplayInterpretation } from "@/lib/ai/interpretation";

export const metadata: Metadata = {
  title: "Lịch sử trải bài — Tarot Reading Web",
};

const PAGE_SIZE = 8;

function buildHref(q: string, page: number) {
  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (page > 1) query.set("page", String(page));
  const qs = query.toString();
  return qs ? `/history?${qs}` : "/history";
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
      <span className="rounded-full border border-border px-4 py-2 text-xs text-muted opacity-40">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={buildHref(q, page)}
      className="cursor-pointer rounded-full border border-border px-4 py-2 text-xs text-foreground transition-colors duration-300 hover:border-accent hover:text-accent"
    >
      {children}
    </Link>
  );
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const page = Math.max(1, Number(params.page) || 1);

  const where = {
    userId: session.user.id,
    ...(q ? { question: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [total, readings] = await Promise.all([
    prisma.reading.count({ where }),
    prisma.reading.findMany({
      where,
      orderBy: { createdAt: "desc" as const },
      include: { aiInterpretation: true },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasAnyReadings = total > 0 || q.length > 0;

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <Section className="max-w-3xl">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Lịch sử trải bài
              </h1>
              {total > 0 ? (
                <p className="text-sm text-muted">
                  {total} lần trải bài{q ? " phù hợp" : " đã lưu"}
                </p>
              ) : null}
            </div>

            {hasAnyReadings ? (
              <form action="/history" className="relative">
                <input type="hidden" name="page" value="1" />
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Tìm theo câu hỏi..."
                  className="pl-11"
                />
              </form>
            ) : null}

            {readings.length > 0 ? (
              <HistoryList
                readings={readings.map((r) => ({
                  id: r.id,
                  question: r.question,
                  cards: r.cards as unknown as StoredCard[],
                  createdAt: r.createdAt.toISOString(),
                  aiInterpretation: r.aiInterpretation
                    ? toDisplayInterpretation(r.aiInterpretation)
                    : null,
                }))}
              />
            ) : (
              <p className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
                {q
                  ? `Không tìm thấy lần trải bài nào khớp với "${q}".`
                  : "Bạn chưa có lần trải bài nào được lưu. Trải bài khi đã đăng nhập để xem lại tại đây."}
              </p>
            )}

            {totalPages > 1 ? (
              <nav
                className="flex items-center justify-between gap-4 pt-2"
                aria-label="Phân trang lịch sử"
              >
                <PageLink q={q} page={page - 1} disabled={page <= 1}>
                  Trước
                </PageLink>
                <p className="text-xs text-muted">
                  Trang {page} / {totalPages}
                </p>
                <PageLink q={q} page={page + 1} disabled={page >= totalPages}>
                  Sau
                </PageLink>
              </nav>
            ) : null}
          </div>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
