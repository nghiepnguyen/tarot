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
 *
 * Đường Google chỉ bắn `login`, kể cả lần đầu tiên của một người mới: đích
 * redirect được chốt lúc bấm nút, còn chuyện tài khoản đã có hay vừa được tạo
 * thì mãi tới callback `jwt` mới biết. Nghĩa là `sign_up` chỉ đếm người đăng
 * ký bằng email — đọc hai con số đó cạnh nhau phải nhớ điều này.
 */
export function AuthSuccessTracker({
  method,
  provider = "credentials",
}: {
  method: "login" | "signup";
  provider?: "credentials" | "google";
}) {
  useEffect(() => {
    trackEvent(method === "signup" ? "sign_up" : "login", { method: provider });

    const url = new URL(window.location.href);
    url.searchParams.delete("auth");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, [method, provider]);

  return null;
}
