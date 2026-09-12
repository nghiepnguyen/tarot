import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { LeafSprig } from "@/components/ui/Botanical";
import { UserMenu } from "@/components/ui/UserMenu";

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

            <UserMenu label={user.name || user.email.split("@")[0]} />
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
