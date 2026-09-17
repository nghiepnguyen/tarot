import type { Metadata } from "next";
import { Clock, Link2Off, LockKeyhole } from "lucide-react";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Section } from "@/components/ui/Section";
import { AuthCard, AuthCardLink } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { checkPasswordResetToken } from "@/lib/auth/password-reset";

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu",
  robots: { index: false, follow: false },
};

/**
 * Đích của link trong email đặt lại mật khẩu.
 *
 * Mở trang **không** tiêu token — nó chỉ kiểm tra rồi hiện form. Token chết ở
 * bước submit. Tiêu ngay lúc GET thì trình quét thư của nhà cung cấp sẽ đốt
 * sạch link trước khi người dùng kịp bấm.
 *
 * Kiểm tra trước khi hiện form để không bắt người ta gõ xong mật khẩu mới rồi
 * mới báo link đã hỏng.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const state = await checkPasswordResetToken(token ?? "");

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <Section className="flex items-center justify-center">
          {state === "valid" ? (
            <AuthCard
              icon={<LockKeyhole className="h-6 w-6" aria-hidden="true" />}
              title="Đặt mật khẩu mới"
              description="Chọn một mật khẩu mới cho tài khoản của bạn. Mọi thiết bị đang đăng nhập sẽ bị đăng xuất."
              footer={<AuthCardLink href="/login" prompt="Đổi ý?" label="Quay lại đăng nhập" />}
            >
              <ResetPasswordForm token={token ?? ""} />
            </AuthCard>
          ) : (
            <AuthCard
              tone="warning"
              icon={
                state === "expired" ? (
                  <Clock className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Link2Off className="h-6 w-6" aria-hidden="true" />
                )
              }
              title={state === "expired" ? "Link đã hết hạn" : "Link không dùng được"}
              description={
                state === "expired"
                  ? "Link đặt lại mật khẩu chỉ sống trong 1 giờ. Nhập email để nhận một link mới."
                  : "Link này đã dùng rồi, hoặc đã bị thay bởi một link mới hơn. Nhập email để nhận lại link mới nhất."
              }
              footer={<AuthCardLink href="/login" prompt="Nhớ ra mật khẩu rồi?" label="Đăng nhập" />}
            >
              <ForgotPasswordForm />
            </AuthCard>
          )}
        </Section>
      </main>
      <Footer />
    </div>
  );
}
