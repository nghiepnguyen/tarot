import Link from "next/link";
import type { CreditPackage } from "@prisma/client";
import { buttonClasses } from "@/components/ui/Button";
import { COST_PER_INTERPRETATION, FREE_TRIAL_UNLOCKS } from "@/lib/ai/interpretation";
import { formatVnd, pricePerUnlock, savingPercent, unlocksIn } from "@/lib/payments/pricing";

interface PricingProps {
  packages: CreditPackage[];
}

export function Pricing({ packages }: PricingProps) {
  const bestSaving = Math.max(0, ...packages.map((pkg) => savingPercent(pkg, packages)));

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
        <div className="flex flex-col gap-6">
          {/* Hai cột ngay từ mobile: ô ngắn, xếp một cột thì bảng giá dài gấp đôi. */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {packages.map((pkg) => {
              const saving = savingPercent(pkg, packages);
              const isBest = saving > 0 && saving === bestSaving;
              return (
                <div
                  key={pkg.id}
                  className={`flex flex-col gap-1.5 rounded-2xl border p-4 sm:p-6 ${
                    isBest ? "border-accent bg-sage-tint" : "border-border bg-surface"
                  }`}
                >
                  <span className="text-sm text-muted">{pkg.name}</span>
                  <span className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                    {formatVnd(pkg.priceVnd)}
                  </span>
                  <span className="text-sm text-muted">{unlocksIn(pkg)} lượt diễn giải</span>
                  <span className="text-xs text-muted">{formatVnd(pricePerUnlock(pkg))}/lượt</span>
                  {saving > 0 ? (
                    <span className="mt-1 self-start rounded-full border border-accent px-2 py-0.5 text-xs font-medium text-foreground">
                      tiết kiệm {saving}%
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Mua credit cần tài khoản, nên lối đi tiếp từ bảng giá là đăng ký. */}
          <Link href="/signup" className={buttonClasses("primary", "self-start whitespace-nowrap")}>
            Tạo tài khoản, nhận {FREE_TRIAL_UNLOCKS} lượt miễn phí
          </Link>
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
