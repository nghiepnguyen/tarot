"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics/gtag";

// ReadingView là server component; tách link ra client component để gắn event
// mà không phải chuyển cả cây sang client.
export function LoginPromptLink({ placement }: { placement: string }) {
  return (
    <Link
      href="/login"
      onClick={() => trackEvent("login_prompt_click", { placement })}
      className="text-accent hover:underline"
    >
      Đăng nhập
    </Link>
  );
}
