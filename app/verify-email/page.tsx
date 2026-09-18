import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Clock, Link2Off } from "lucide-react";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Section } from "@/components/ui/Section";
import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { AuthCard, AuthCardLink } from "@/components/auth/AuthCard";
import { consumeVerificationToken } from "@/lib/auth/verification";

export const metadata: Metadata = {
  title: "Xác nhận email",
  robots: { index: false, follow: false },
};

/**
 * Đích của link trong email. Token bị tiêu ngay khi trang được mở — một lần
 * bấm là một lần GET, không có bước bấm nút xác nhận thêm.
 *
 * Xác nhận xong thì chuyển sang trang đăng nhập: ở đây không có mật khẩu nên
 * không tự tạo phiên đăng nhập được, và để người dùng đứng lại một trang báo
 * thành công cụt đường thì tệ hơn là đưa thẳng họ tới ô đăng nhập.
 */
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = await consumeVerificationToken(token ?? "");

  if (result === "verified") {
    // ?auth=signup để trang đích bắn conversion GA4 — đăng ký chỉ thực sự
    // hoàn tất ở bước này, không phải lúc submit form.
    redirect("/login?verified=1&auth=signup");
  }
  if (result === "already-verified") {
    redirect("/login?verified=1");
  }

  const expired = result === "expired";

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main id="main-content" className="flex flex-1 items-center justify-center">
        <Section className="flex items-center justify-center">
          <AuthCard
            tone="warning"
            icon={
              expired ? (
                <Clock className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Link2Off className="h-6 w-6" aria-hidden="true" />
              )
            }
            title={expired ? "Link đã hết hạn" : "Link không dùng được"}
            description={
              expired
                ? "Link xác nhận chỉ sống trong 24 giờ. Nhập email để nhận một link mới."
                : "Link này không còn hiệu lực — thường là vì đã có một link mới hơn được gửi. Nhập email để nhận lại link mới nhất."
            }
            footer={<AuthCardLink href="/login" prompt="Đã xác nhận rồi?" label="Đăng nhập" />}
          >
            <ResendVerificationForm />
          </AuthCard>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
