"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useConsent } from "@/components/analytics/useConsent";
import { closeConsentSettings, setConsent } from "@/lib/analytics/consent";

export function ConsentBanner() {
  const { value, isBannerOpen } = useConsent();
  const prefersReducedMotion = useReducedMotion();

  if (!isBannerOpen) return null;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      role="region"
      aria-label="Lựa chọn cookie phân tích"
      // Góc phải trên desktop và gọn trên mobile: cột trái trang chủ là form câu
      // hỏi, banner to đặt bên trái từng che mất nút "Bốc 3 lá bài". Lúc chọn
      // bài (BottomBar đang hiện) thì ẩn hẳn: bộ bài kín đáy màn hình, banner
      // nằm đâu cũng che lá. Chọn xong banner tự hiện lại.
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface shadow-[0_-8px_24px_-16px_rgba(51,41,31,0.35)] [:root[data-bottom-bar]_&]:hidden sm:inset-x-auto sm:bottom-6 sm:right-6 sm:max-w-sm sm:rounded-2xl sm:border sm:shadow-[0_12px_32px_-16px_rgba(51,41,31,0.45)]"
    >
      <div className="flex w-full flex-col gap-2 px-4 py-3 sm:gap-3 sm:px-5 sm:py-4">
        <p className="text-xs leading-relaxed text-muted">
          Cho phép Google Analytics đo cách dùng trang? Không gồm câu hỏi, email
          hay tên của bạn.{" "}
          <Link
            href="/privacy"
            className="font-medium text-accent underline underline-offset-4"
          >
            Chính sách riêng tư
          </Link>
        </p>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setConsent("denied")}
            className="flex-1"
          >
            Từ chối
          </Button>
          <Button onClick={() => setConsent("granted")} className="flex-1">
            Đồng ý
          </Button>
          {/* Chỉ cho đóng suông khi đã có lựa chọn trước đó — mở lại từ footer
              mà không đổi gì thì phải quay về đúng trạng thái cũ. */}
          {value !== null ? (
            <button
              type="button"
              onClick={closeConsentSettings}
              className="inline-flex min-h-11 cursor-pointer items-center px-2 text-sm text-muted transition-colors duration-300 hover:text-accent"
            >
              Đóng
            </button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
