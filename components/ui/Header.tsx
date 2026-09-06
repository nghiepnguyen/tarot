import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { logoutAction } from "@/app/actions/auth";
import { LeafSprig } from "@/components/ui/Botanical";

export async function Header() {
  const session = await auth();
  const user = session?.user
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, credits: true },
      })
    : null;

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-base font-medium tracking-[0.08em] text-foreground"
        >
          <LeafSprig className="h-5 w-5 text-accent" />
          Tarot
        </Link>

        {user ? (
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <span className="shrink-0 rounded-full bg-sage-tint px-2 py-1 text-xs font-medium text-accent">
              {user.credits} credit
            </span>

            <div className="group relative min-w-0">
              <button
                type="button"
                className="flex min-w-0 cursor-pointer items-center gap-1.5 rounded-full border border-border px-2.5 py-1.5 text-xs text-foreground transition-colors duration-300 hover:border-accent sm:gap-2 sm:px-3"
              >
                <span className="min-w-0 max-w-[4.5rem] truncate sm:max-w-[8rem]">
                  {user.name || user.email.split("@")[0]}
                </span>
                <ChevronDown
                  className="h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-300 group-hover:rotate-180 group-focus-within:rotate-180"
                  aria-hidden="true"
                />
              </button>

              <div className="invisible absolute right-0 top-full z-20 w-40 pt-2 opacity-0 transition-opacity duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-[0_8px_24px_-16px_rgba(51,41,31,0.25)]">
                  <Link
                    href="/history"
                    className="cursor-pointer rounded-xl px-3 py-2 text-xs text-foreground transition-colors duration-300 hover:bg-sage-tint hover:text-accent"
                  >
                    Lịch sử
                  </Link>
                  <Link
                    href="/profile"
                    className="cursor-pointer rounded-xl px-3 py-2 text-xs text-foreground transition-colors duration-300 hover:bg-sage-tint hover:text-accent"
                  >
                    Hồ sơ
                  </Link>
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="w-full cursor-pointer rounded-xl px-3 py-2 text-left text-xs text-foreground transition-colors duration-300 hover:bg-sage-tint hover:text-accent"
                    >
                      Đăng xuất
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <nav className="flex items-center gap-4 text-xs text-muted">
            <Link href="/login" className="transition-colors duration-300 hover:text-accent">
              Đăng nhập
            </Link>
            <Link href="/signup" className="transition-colors duration-300 hover:text-accent">
              Đăng ký
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
