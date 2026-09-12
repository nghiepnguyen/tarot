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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface shadow-[0_-8px_24px_-16px_rgba(51,41,31,0.35)]"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-sm leading-relaxed text-muted">
          Chúng tôi dùng Google Analytics để biết mọi người sử dụng trang thế
          nào. Số liệu này không bao gồm câu hỏi, email hay tên của bạn. Đồng ý
          nghĩa là cho phép đặt cookie phân tích; từ chối thì chúng tôi chỉ đếm
          lượt truy cập ẩn danh, không cookie và không nhận diện bạn. Dù chọn
          gì thì việc bốc bài cũng không đổi.{" "}
          <Link
            href="/privacy"
            className="font-medium text-accent underline underline-offset-4"
          >
            Chính sách riêng tư
          </Link>
        </p>

        <div className="flex shrink-0 items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setConsent("denied")}
            className="flex-1 sm:flex-none"
          >
            Từ chối
          </Button>
          <Button onClick={() => setConsent("granted")} className="flex-1 sm:flex-none">
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
