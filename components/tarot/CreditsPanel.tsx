"use client";

import { useState, useTransition } from "react";
import type { CreditPackage } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { topUpCreditsAction } from "@/app/actions/ai";
import { createOrderAction } from "@/app/actions/payments";
import { trackEvent } from "@/lib/analytics/gtag";
import { COST_PER_INTERPRETATION, DEMO_TOPUP_AMOUNT } from "@/lib/ai/interpretation";
import { SUPPORT_EMAIL } from "@/lib/seo/site";

interface CreditsPanelProps {
  credits: number;
  packages: CreditPackage[];
  showDemoTopup?: boolean;
}

function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

function pricePerUnlock(pkg: CreditPackage): number {
  return Math.round(pkg.priceVnd / (pkg.credits / COST_PER_INTERPRETATION));
}

/**
 * Rẻ hơn bao nhiêu phần trăm so với gói đắt nhất tính trên mỗi lượt. Người mua
 * không tự quy đổi credit sang tiền trong đầu được, nên phải nói thẳng gói nào
 * lợi hơn — nếu không thì bốn nút giá khác nhau chỉ là bốn con số rời rạc.
 */
function savingPercent(pkg: CreditPackage, packages: CreditPackage[]): number {
  const worst = Math.max(...packages.map(pricePerUnlock));
  if (worst === 0) return 0;
  return Math.round((1 - pricePerUnlock(pkg) / worst) * 100);
}

export function CreditsPanel({ credits, packages, showDemoTopup }: CreditsPanelProps) {
  const [isDemoPending, startDemoTransition] = useTransition();
  const [pendingPackageId, setPendingPackageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startOrderTransition] = useTransition();

  const remainingUnlocks = Math.floor(credits / COST_PER_INTERPRETATION);

  const handleBuy = (packageId: string) => {
    setError(null);
    setPendingPackageId(packageId);

    const pkg = packages.find((p) => p.id === packageId);
    // GA4 ecommerce: value tính bằng VND để báo cáo doanh thu khớp với giá bán.
    trackEvent("begin_checkout", {
      currency: "VND",
      value: pkg?.priceVnd ?? 0,
      items: pkg
        ? [
            {
              item_id: pkg.id,
              item_name: pkg.name,
              price: pkg.priceVnd,
              quantity: 1,
            },
          ]
        : [],
    });

    startOrderTransition(async () => {
      const result = await createOrderAction(packageId);
      if (result.ok) {
        window.location.href = result.checkoutUrl;
      } else {
        setError(result.error);
        setPendingPackageId(null);
        trackEvent("checkout_error", { item_id: packageId, error: result.error });
      }
    });
  };

  return (
    <Card className="flex max-w-lg flex-col gap-5">
      <div>
        <p className="text-sm text-muted">Còn lại</p>
        <p className="text-2xl font-semibold text-foreground">
          {remainingUnlocks} lượt diễn giải chuyên sâu
        </p>
        <p className="text-sm text-muted">({credits} credit)</p>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium tracking-tight text-foreground">
            Nạp thêm credit
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            Mỗi lượt diễn giải chuyên sâu tốn {COST_PER_INTERPRETATION} credit. Credit
            không hết hạn.
          </p>
        </div>

        {packages.length === 0 ? (
          // Không có gói nào đang bán thì nói ra, đừng để một lưới rỗng khiến
          // người dùng tưởng trang lỗi hoặc máy họ hỏng.
          <p className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted">
            Hiện chưa có gói credit nào đang mở bán. Nếu bạn cần nạp gấp, gửi email
            tới{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-medium text-accent underline underline-offset-4"
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {packages.map((pkg) => {
                const unlocks = pkg.credits / COST_PER_INTERPRETATION;
                const saving = savingPercent(pkg, packages);
                const isPending = pendingPackageId === pkg.id;

                return (
                  <button
                    key={pkg.id}
                    type="button"
                    disabled={pendingPackageId !== null}
                    onClick={() => handleBuy(pkg.id)}
                    className="flex min-h-11 flex-col items-start gap-1 rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors duration-200 hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="flex w-full items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">{pkg.name}</span>
                      {saving > 0 ? (
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                          tiết kiệm {saving}%
                        </span>
                      ) : null}
                    </span>
                    <span className="text-sm text-muted">
                      {unlocks} lượt · {pkg.credits} credit
                    </span>
                    <span className="text-sm font-semibold text-accent">
                      {isPending ? "Đang chuyển..." : formatVnd(pkg.priceVnd)}
                    </span>
                    <span className="text-xs text-muted">
                      {formatVnd(pricePerUnlock(pkg))}/lượt
                    </span>
                  </button>
                );
              })}
            </div>

            <ol className="flex flex-col gap-1 text-sm text-muted">
              <li>1. Chọn một gói ở trên.</li>
              <li>2. Trang thanh toán PayOS mở ra — quét mã QR hoặc chuyển khoản ngân hàng.</li>
              <li>3. Xong thì bạn được đưa về đây, credit cộng vào trong vòng vài giây.</li>
            </ol>
            <p className="text-sm leading-relaxed text-muted">
              Chưa thấy credit sau vài phút, hoặc gặp sự cố thanh toán, gửi email tới{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Sự cố thanh toán")}`}
                className="font-medium text-accent underline underline-offset-4"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </>
        )}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>

      {showDemoTopup ? (
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <p className="text-sm text-muted">
            Nút dưới đây chỉ hiện ở môi trường dev, dùng để test không cần thanh toán thật.
          </p>
          <Button
            variant="secondary"
            disabled={isDemoPending}
            onClick={() => startDemoTransition(() => topUpCreditsAction())}
            className="self-start"
          >
            {isDemoPending ? "Đang nạp..." : `Nạp ${DEMO_TOPUP_AMOUNT} credit (demo)`}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
