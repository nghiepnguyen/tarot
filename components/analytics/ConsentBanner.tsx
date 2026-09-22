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
      className="fixed inset-x-0 bottom-[var(--bottom-bar-height,0px)] z-50 border-t border-border bg-surface shadow-[0_-8px_24px_-16px_rgba(51,41,31,0.35)] sm:inset-x-auto sm:bottom-[calc(var(--bottom-bar-height,0px)+1.5rem)] sm:left-6 sm:max-w-sm sm:rounded-2xl sm:border sm:shadow-[0_12px_32px_-16px_rgba(51,41,31,0.45)]"
    >
      <div className="flex w-full flex-col gap-3 px-6 py-5 sm:px-5 sm:py-4">
        <p className="text-xs leading-relaxed text-muted">
          Chúng tôi dùng Google Analytics để biết mọi người sử dụng trang thế
          nào. Số liệu này không bao gồm câu hỏi, email hay tên của bạn. Từ chối
          thì chúng tôi chỉ đếm lượt truy cập ẩn danh, không cookie. Dù chọn gì
          thì việc bốc bài cũng không đổi.{" "}
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
