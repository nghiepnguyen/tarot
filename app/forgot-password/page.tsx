import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Section } from "@/components/ui/Section";
import { AuthCard, AuthCardLink } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Quên mật khẩu",
  robots: { index: false, follow: true },
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main id="main-content" className="flex flex-1 items-center justify-center">
        <Section className="flex items-center justify-center">
          <AuthCard
            icon={<KeyRound className="h-6 w-6" aria-hidden="true" />}
            title="Quên mật khẩu"
            description="Nhập email đã đăng ký. Chúng tôi gửi tới đó một link để bạn chọn mật khẩu mới."
            footer={<AuthCardLink href="/login" prompt="Nhớ ra rồi?" label="Đăng nhập" />}
          >
            <ForgotPasswordForm />
          </AuthCard>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
