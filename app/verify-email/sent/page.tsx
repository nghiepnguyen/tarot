import type { Metadata } from "next";
import { Inbox, MailWarning } from "lucide-react";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Section } from "@/components/ui/Section";
import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { AuthCard, AuthCardLink, VerificationSteps } from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Kiểm tra hộp thư",
  robots: { index: false, follow: false },
};

/**
 * Đích của `signupAction`. `?status=failed` nghĩa là tài khoản đã tạo nhưng
 * email không gửi đi được — nói thẳng, vì người dùng sẽ ngồi chờ một lá thư
 * không bao giờ tới.
 */
export default async function VerificationSentPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const failed = status === "failed";

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <Section className="flex items-center justify-center">
          {failed ? (
            <AuthCard
              tone="warning"
              icon={<MailWarning className="h-6 w-6" aria-hidden="true" />}
              title="Chưa gửi được email"
              description="Tài khoản đã được tạo, nhưng email xác nhận chưa gửi đi được. Nhập lại địa chỉ để thử lần nữa."
              footer={<AuthCardLink href="/login" prompt="Đã xác nhận rồi?" label="Đăng nhập" />}
            >
              <ResendVerificationForm />
            </AuthCard>
          ) : (
            <AuthCard
              icon={<Inbox className="h-6 w-6" aria-hidden="true" />}
              title="Kiểm tra hộp thư của bạn"
              description="Chúng tôi vừa gửi một link xác nhận tới email của bạn. Bấm vào link đó để hoàn tất đăng ký. Link có hiệu lực trong 24 giờ."
              footer={<AuthCardLink href="/login" prompt="Đã xác nhận rồi?" label="Đăng nhập" />}
            >
              <VerificationSteps current={1} />

              <div className="flex flex-col gap-3 border-t border-border pt-5">
                <p className="text-sm leading-relaxed text-muted">
                  Không thấy thư sau vài phút? Xem cả mục spam, hoặc nhập email để gửi
                  lại.
                </p>
                <ResendVerificationForm label="Gửi lại tới địa chỉ" />
              </div>
            </AuthCard>
          )}
        </Section>
      </main>
      <Footer />
    </div>
  );
}
