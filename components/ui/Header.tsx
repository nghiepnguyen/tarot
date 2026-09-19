import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { LeafSprig } from "@/components/ui/Botanical";
import { UserMenu } from "@/components/ui/UserMenu";
import { CreditBadge } from "@/components/ui/CreditBadge";
import { NavLinks } from "@/components/ui/NavLinks";
import { MobileNav } from "@/components/ui/MobileNav";
import { navLinkClass } from "@/components/ui/navLink";
import { SentryUser } from "@/components/monitoring/SentryUser";
import { LogIn } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Bốc bài" },
  { href: "/gioi-thieu", label: "Giới thiệu" },
];

export async function Header() {
  const session = await auth();
  const user = session?.user
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, credits: true, role: true },
      })
    : null;

  return (
    <header className="relative border-b border-border">
      <SentryUser userId={session?.user?.id ?? null} />

      {/* Header giờ có tới sáu đường đi. Không có link này thì người dùng bàn
          phím phải tab hết chúng trên từng trang mới tới được nội dung. Chỉ
          hiện khi được focus. z-30 để nằm trên dropdown của UserMenu (z-20). */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-30 focus:rounded-full focus:border focus:border-accent focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:text-foreground"
      >
        Tới nội dung chính
      </a>

      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <Link
            href="/"
            className="flex min-h-11 shrink-0 items-center gap-2 text-base font-medium tracking-[0.08em] text-foreground"
          >
            <LeafSprig className="h-5 w-5 text-accent" />
            Tarot
          </Link>

          {/* Ẩn dưới 768px: bên phải header khi đã đăng nhập đã chiếm sẵn
              khoảng 205px cho badge credit và menu người dùng, nhét thêm hai
              nhãn vào màn 375px là tràn hàng. Trên mobile "Bốc bài" chính là
              logo, còn "Giới thiệu" nằm ở chân trang của mọi trang. */}
          <NavLinks links={NAV_LINKS} />
        </div>

        <div className="flex min-w-0 items-center gap-2">
          {user ? (
            <>
              <CreditBadge credits={user.credits} />
              <UserMenu
                label={user.name || user.email.split("@")[0]}
                isAdmin={user.role === "ADMIN"}
              />
            </>
          ) : (
            <nav aria-label="Tài khoản" className="flex items-center gap-6">
              {/* Dưới 768px rút về một icon, nhường chỗ cho nút hamburger.
                  Không mất đường tới đăng ký: trang /login có sẵn link sang. */}
              <Link
                href="/login"
                aria-label="Đăng nhập"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground transition-colors duration-300 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:hidden"
              >
                <LogIn className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
              </Link>

              {/* Ẩn/hiện đặt ở khối bọc, không đặt lên từng link: `navLinkClass`
                  đã mang sẵn `inline-flex`, thêm `hidden` vào cùng thẻ là hai
                  utility cùng tranh thuộc tính `display` và `hidden` thua. */}
              <div className="hidden items-center gap-6 md:flex">
                <Link href="/login" className={navLinkClass()}>
                  Đăng nhập
                </Link>
                {/* Đăng ký nặng hơn một bậc: đây là bước người chưa có tài
                    khoản cần đi, đứng cạnh "Đăng nhập" mà cùng sắc độ thì
                    không phân biệt được đâu là đường dành cho mình. */}
                <Link href="/signup" className={navLinkClass("emphasis")}>
                  Đăng ký
                </Link>
              </div>
            </nav>
          )}

          <MobileNav links={NAV_LINKS} />
        </div>
      </div>
    </header>
  );
}
