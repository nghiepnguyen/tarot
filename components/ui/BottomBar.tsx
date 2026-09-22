"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

const HEIGHT_VAR = "--bottom-bar-height";

/**
 * Thanh hành động dán đáy màn hình. Nó tự đo chiều cao và ghi ra biến CSS
 * `--bottom-bar-height` để những thứ fixed khác (banner consent) biết mà né,
 * thay vì phải hardcode một con số rồi lệch mỗi lần bar đổi nội dung.
 */
export function BottomBar({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const root = document.documentElement;
    const publish = () => {
      root.style.setProperty(HEIGHT_VAR, `${node.offsetHeight}px`);
    };

    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(node);

    return () => {
      observer.disconnect();
      root.style.removeProperty(HEIGHT_VAR);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-sm"
    >
      {children}
    </div>
  );
}
