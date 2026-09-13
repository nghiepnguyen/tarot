import { SUPPORT_EMAIL, supportMailto } from "@/lib/seo/site";

interface ContactLineProps {
  /** Tiêu đề điền sẵn, để thư tới đã được phân loại theo trang gửi đi. */
  subject: string;
}

/**
 * Địa chỉ hỗ trợ, hiện dưới dạng text chứ không giấu sau chữ "liên hệ": khách
 * đang gặp sự cố thanh toán cần copy được nó, kể cả khi máy họ không có ứng
 * dụng mail nào để mailto mở lên.
 */
export function ContactLine({ subject }: ContactLineProps) {
  return (
    <a
      href={supportMailto(subject)}
      className="font-medium text-accent underline underline-offset-4"
    >
      {SUPPORT_EMAIL}
    </a>
  );
}
