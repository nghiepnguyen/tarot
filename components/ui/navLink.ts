/**
 * Quy ước cho mọi link điều hướng ở header và chân trang: khoảng cách nằm ở
 * `gap` của hàng chứ không nhét vào padding ngang từng mục, vùng chạm 44px giữ
 * bằng `min-h-11`, focus dùng ring accent giống `Button`.
 *
 * File này chỉ xuất chuỗi, không import React, nên cả Server Component
 * (`Header`) lẫn Client Component (`NavLinks`) dùng chung được mà không kéo
 * theo thứ gì vào bundle phía client.
 */
const NAV_LINK_BASE =
  "inline-flex min-h-11 items-center rounded-sm text-sm transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/**
 * `emphasis` dành cho mục đáng nặng hơn phần còn lại trong cùng một hàng, ví dụ
 * "Đăng ký" đứng cạnh "Đăng nhập". Trang đang mở thì dùng `active`.
 */
export function navLinkClass(
  variant: "default" | "active" | "emphasis" = "default",
): string {
  if (variant === "active") return `${NAV_LINK_BASE} font-medium text-foreground`;
  if (variant === "emphasis") return `${NAV_LINK_BASE} text-foreground hover:text-accent`;
  return `${NAV_LINK_BASE} text-muted hover:text-accent`;
}

/**
 * Mục bên trong panel đổ xuống (`UserMenu`, `MobileNav`). Khác `navLinkClass`
 * ở chỗ đây là hàng đầy đủ chiều ngang có nền khi hover, không phải chữ đứng
 * rời trên thanh header.
 */
export function menuItemClass(active = false): string {
  const base =
    "flex min-h-11 cursor-pointer items-center rounded-xl px-3 text-sm transition-colors duration-300 hover:bg-sage-tint hover:text-accent";
  return active
    ? `${base} bg-sage-tint font-medium text-accent`
    : `${base} text-foreground`;
}
