"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Gắn id người dùng vào scope của Sentry phía trình duyệt.
 *
 * Chỉ id, không email hay tên: đủ để biết một lỗi ảnh hưởng bao nhiêu người và
 * tra ngược được trong database, mà không đẩy thông tin cá nhân sang bên thứ
 * ba. Server đã gắn id tương tự trong `lib/monitoring/report.ts`.
 *
 * `null` khi đăng xuất để scope không giữ lại id của người trước — quan trọng
 * trên máy dùng chung.
 */
export function SentryUser({ userId }: { userId: string | null }) {
  useEffect(() => {
    Sentry.setUser(userId ? { id: userId } : null);
  }, [userId]);

  return null;
}
