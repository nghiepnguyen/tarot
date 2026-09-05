import Link from "next/link";
import { auth } from "@/auth";
import { logoutAction } from "@/app/actions/auth";
import { LeafSprig } from "@/components/ui/Botanical";

export async function Header() {
  const session = await auth();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-medium tracking-[0.08em] text-foreground"
        >
          <LeafSprig className="h-5 w-5 text-accent" />
          Tarot
        </Link>

        <nav className="flex items-center gap-4 text-xs text-muted">
          {session?.user ? (
            <>
              <Link href="/history" className="transition-colors duration-300 hover:text-accent">
                Lịch sử
              </Link>
              <Link href="/profile" className="transition-colors duration-300 hover:text-accent">
                Hồ sơ
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="transition-colors duration-300 hover:text-accent"
                >
                  Đăng xuất
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="transition-colors duration-300 hover:text-accent">
                Đăng nhập
              </Link>
              <Link href="/signup" className="transition-colors duration-300 hover:text-accent">
                Đăng ký
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
