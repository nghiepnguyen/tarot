"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/gtag";

/**
 * loginAction/signupAction `redirect("/")` sau khi thành công, nên form không
 * còn sống để tự bắn event. Server gắn `?auth=login|signup` vào URL đích, ở đây
 * bắn event rồi dọn param khỏi thanh địa chỉ (replaceState, không tạo history
 * entry mới và không kích hoạt điều hướng của Next).
 */
export function AuthSuccessTracker({ method }: { method: "login" | "signup" }) {
  useEffect(() => {
    trackEvent(method === "signup" ? "sign_up" : "login", { method: "credentials" });

    const url = new URL(window.location.href);
    url.searchParams.delete("auth");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, [method]);

  return null;
}
