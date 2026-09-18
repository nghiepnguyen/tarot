"use client";

import { useEffect, type RefObject } from "react";

/**
 * Đóng panel khi bấm ra ngoài hoặc bấm Escape.
 *
 * Tách ra vì cả `UserMenu` lẫn `MobileNav` cần đúng hành vi này, và vì lý do
 * chọn "click toggle" thay vì hover là một bug thật đã gặp: mở bằng hover thì
 * trên iPhone menu không bao giờ tới được, Safari không focus nút khi chạm nên
 * cả hover lẫn focus-within đều không bắn. Để logic ở một chỗ thì bản sửa đó
 * không bị chép lệch.
 */
export function useDismissable(
  open: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onDismiss: () => void,
) {
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) onDismiss();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, containerRef, onDismiss]);
}
