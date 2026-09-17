"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/gtag";

/**
 * Đăng nhập và xác nhận email đều kết thúc bằng một `redirect`, nên form
 * không còn sống để tự bắn event. Server gắn `?auth=login|signup` vào URL
 * đích, ở đây bắn event rồi dọn param khỏi thanh địa chỉ (replaceState, không
 * tạo history entry mới và không kích hoạt điều hướng của Next).
 *
 * `sign_up` bắn ở trang /login sau khi xác nhận email, không phải lúc submit
 * form đăng ký: tài khoản chưa xác nhận thì chưa đăng nhập được, đếm nó là
 * conversion sẽ thổi phồng con số.
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
