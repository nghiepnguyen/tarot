"use client";

import { openConsentSettings } from "@/lib/analytics/consent";

interface CookieSettingsButtonProps {
  /**
   * Chân trang truyền class xuống để nút này trông đúng bằng các link cạnh nó.
   * Định nghĩa ở một chỗ (`Footer`) thay vì chép lại, vì chép lại thì sửa một
   * bên là lệch hàng.
   */
  className?: string;
}

export function CookieSettingsButton({ className = "" }: CookieSettingsButtonProps) {
  return (
    <button type="button" onClick={openConsentSettings} className={`cursor-pointer ${className}`}>
      Tùy chọn cookie
    </button>
  );
}
