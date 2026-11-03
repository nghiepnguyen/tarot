import type { CreditPackage } from "@prisma/client";
import { COST_PER_INTERPRETATION } from "@/lib/ai/interpretation";

type PricedPackage = Pick<CreditPackage, "credits" | "priceVnd">;

export function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

export function unlocksIn(pkg: PricedPackage): number {
  return Math.floor(pkg.credits / COST_PER_INTERPRETATION);
}

export function pricePerUnlock(pkg: PricedPackage): number {
  return Math.round(pkg.priceVnd / (pkg.credits / COST_PER_INTERPRETATION));
}

/**
 * Rẻ hơn bao nhiêu phần trăm so với gói đắt nhất tính trên mỗi lượt. Người mua
 * không tự quy đổi credit sang tiền trong đầu được, nên phải nói thẳng gói nào
 * lợi hơn — nếu không thì bốn nút giá khác nhau chỉ là bốn con số rời rạc.
 */
export function savingPercent(pkg: PricedPackage, packages: PricedPackage[]): number {
  const worst = Math.max(...packages.map(pricePerUnlock));
  if (worst === 0) return 0;
  return Math.round((1 - pricePerUnlock(pkg) / worst) * 100);
}
