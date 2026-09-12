"use client";

import { openConsentSettings } from "@/lib/analytics/consent";

export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={openConsentSettings}
      className="inline-flex min-h-11 cursor-pointer items-center px-2 transition-colors duration-300 hover:text-accent"
    >
      Tùy chọn cookie
    </button>
  );
}
