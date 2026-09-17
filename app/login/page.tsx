import type { Metadata } from "next";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Section } from "@/components/ui/Section";
import { CircleCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthSuccessTracker } from "@/components/analytics/AuthSuccessTracker";

export const metadata: Metadata = {
  title: "Đăng nhập",
  robots: { index: false, follow: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; auth?: string }>;
}) {
  // Trang xác nhận email đổ về đây kèm `?verified=1`, và kèm `?auth=signup`
  // cho đúng lần xác nhận đầu tiên — đó mới là lúc việc đăng ký hoàn tất.
  const { verified, auth: authResult } = await searchParams;

  return (
    <div className="flex flex-1 flex-col">
      {authResult === "signup" ? <AuthSuccessTracker method="signup" /> : null}
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <Section className="flex flex-col items-center justify-center gap-4">
          {verified === "1" ? (
            <p
              role="status"
              className="flex w-full max-w-sm items-start gap-3 rounded-2xl border border-accent/30 bg-sage-tint px-5 py-4 text-sm leading-relaxed text-foreground"
            >
              <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
              <span>
                Email đã được xác nhận và credit dùng thử đã vào tài khoản. Đăng nhập để
                bắt đầu.
              </span>
            </p>
          ) : null}
          <LoginForm />
        </Section>
      </main>
      <Footer />
    </div>
  );
}
