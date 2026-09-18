import type { CreditPackage } from "@prisma/client";
import { COST_PER_INTERPRETATION, FREE_TRIAL_UNLOCKS } from "@/lib/ai/interpretation";

interface PricingProps {
  packages: CreditPackage[];
}

function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

export function Pricing({ packages }: PricingProps) {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <h2 className="max-w-[26ch] text-3xl leading-tight font-semibold tracking-tight text-foreground sm:text-4xl">
          Bốc bài miễn phí, trả tiền khi muốn đọc sâu
        </h2>
        <p className="max-w-[62ch] text-base leading-relaxed text-muted">
          Bốc ba lá và đọc luận giải cơ bản không tốn gì. Xác nhận email khi tạo
          tài khoản là bạn có {FREE_TRIAL_UNLOCKS} lượt diễn giải chuyên sâu đầu
          tiên miễn phí. Sau đó mỗi lượt tốn {COST_PER_INTERPRETATION} credit.
        </p>
      </div>

      {packages.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-6"
            >
              <span className="text-sm text-muted">{pkg.name}</span>
              <span className="text-2xl font-semibold tracking-tight text-foreground">
                {formatVnd(pkg.priceVnd)}
              </span>
              <span className="text-sm text-muted">
                {pkg.credits} credit, tương đương{" "}
                {Math.floor(pkg.credits / COST_PER_INTERPRETATION)} lượt diễn giải
              </span>
            </div>
          ))}
        </div>
      ) : (
        // Seed chưa chạy hoặc mọi gói đã tắt: nói thẳng thay vì để một hàng ô trống.
        <p className="rounded-2xl border border-border bg-surface p-6 text-sm leading-relaxed text-muted">
          Các gói credit đang được cập nhật. Bạn vẫn bốc bài và đọc luận giải cơ
          bản bình thường.
        </p>
      )}
    </div>
  );
}
