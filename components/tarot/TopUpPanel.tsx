"use client";

import { useState, useTransition } from "react";
import type { CreditPackage } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { topUpCreditsAction } from "@/app/actions/ai";
import { createOrderAction } from "@/app/actions/payments";
import { trackEvent } from "@/lib/analytics/gtag";
import { COST_PER_INTERPRETATION, DEMO_TOPUP_AMOUNT } from "@/lib/ai/interpretation";
import { SUPPORT_EMAIL } from "@/lib/seo/site";

interface TopUpPanelProps {
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

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 text-accent"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.2 2.4 2.4 4.6-4.8" />
    </svg>
  );
}

export function TopUpPanel({ packages, showDemoTopup }: TopUpPanelProps) {
  const [isDemoPending, startDemoTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startOrderTransition] = useTransition();

  const selected = packages.find((pkg) => pkg.id === selectedId) ?? null;

  const handleSelect = (pkg: CreditPackage) => {
    setSelectedId(pkg.id);
    setError(null);
    trackEvent("select_credit_package", {
      item_id: pkg.id,
      item_name: pkg.name,
      price: pkg.priceVnd,
    });
  };

  const handleCheckout = () => {
    if (!selected) return;
    setError(null);
    setIsRedirecting(true);

    // GA4 ecommerce: value tính bằng VND để báo cáo doanh thu khớp với giá bán.
    trackEvent("begin_checkout", {
      currency: "VND",
      value: selected.priceVnd,
      items: [
        {
          item_id: selected.id,
          item_name: selected.name,
          price: selected.priceVnd,
          quantity: 1,
        },
      ],
    });

    startOrderTransition(async () => {
      const result = await createOrderAction(selected.id);
      if (result.ok) {
        window.location.href = result.checkoutUrl;
      } else {
        setError(result.error);
        setIsRedirecting(false);
        trackEvent("checkout_error", { item_id: selected.id, error: result.error });
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium tracking-tight text-foreground">
            Chọn gói
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            Mỗi lượt diễn giải chuyên sâu tốn {COST_PER_INTERPRETATION} credit. Credit
            không hết hạn.
          </p>
        </div>

        {packages.length === 0 ? (
          // Không có gói nào đang bán thì nói ra, đừng để một lưới rỗng khiến
          // người dùng tưởng trang lỗi hoặc máy họ hỏng.
          <p className="rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed text-muted">
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
            {/* Radio thật thay vì nút bấm: chọn gói là một lựa chọn trong nhóm,
                nên bàn phím đi bằng phím mũi tên và trình đọc màn hình đọc ra
                "1 trong 4" mà không cần ARIA thủ công. */}
            <fieldset className="flex flex-col gap-3">
              <legend className="sr-only">Chọn gói credit</legend>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {packages.map((pkg) => {
                  const unlocks = pkg.credits / COST_PER_INTERPRETATION;
                  const saving = savingPercent(pkg, packages);
                  const isSelected = selectedId === pkg.id;

                  return (
                    <div key={pkg.id} className="relative flex">
                      <input
                        type="radio"
                        name="credit-package"
                        id={`credit-package-${pkg.id}`}
                        value={pkg.id}
                        checked={isSelected}
                        disabled={isRedirecting}
                        onChange={() => handleSelect(pkg)}
                        className="peer sr-only"
                      />
                      {/* Input bị sr-only nên vòng focus phải mượn từ peer, nếu
                          không thì người dùng bàn phím không thấy mình đang ở đâu. */}
                      <label
                        htmlFor={`credit-package-${pkg.id}`}
                        className={`flex w-full cursor-pointer flex-col gap-1 rounded-xl border px-4 py-3 transition-colors duration-200 ease-out peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-disabled:cursor-not-allowed peer-disabled:opacity-50 ${
                          isSelected
                            ? "border-accent bg-sage-tint"
                            : "border-border bg-background hover:border-accent hover:bg-sage-tint"
                        }`}
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {pkg.name}
                          </span>
                          {/* Chỗ của dấu tích luôn được giữ, kể cả khi chưa chọn,
                              để lúc chọn không có gì nhảy chỗ. */}
                          <span className="shrink-0" aria-hidden="true">
                            {isSelected ? <CheckIcon /> : <span className="block h-5 w-5" />}
                          </span>
                        </span>

                        <span className="text-lg font-semibold text-foreground">
                          {formatVnd(pkg.priceVnd)}
                        </span>

                        <span className="text-sm text-muted">
                          {unlocks} lượt · {pkg.credits} credit
                        </span>

                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-muted">
                            {formatVnd(pricePerUnlock(pkg))}/lượt
                          </span>
                          {saving > 0 ? (
                            <span className="rounded-full border border-accent px-2 py-0.5 text-xs font-medium text-accent">
                              tiết kiệm {saving}%
                            </span>
                          ) : null}
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-col gap-3">
              {/* Chọn gói và rời khỏi site là hai việc khác nhau. Gộp vào một cú
                  bấm thì không ai kịp so sánh bốn gói trước khi bị đẩy sang
                  PayOS, và chạm nhầm trên điện thoại là mất trang. */}
              <Button
                type="button"
                onClick={handleCheckout}
                disabled={!selected || isRedirecting}
                className="w-full sm:w-auto sm:self-start"
              >
                {isRedirecting
                  ? "Đang chuyển tới PayOS..."
                  : selected
                    ? `Thanh toán ${formatVnd(selected.priceVnd)}`
                    : "Chọn một gói để tiếp tục"}
              </Button>

              <ol className="flex flex-col gap-1 text-sm leading-relaxed text-muted">
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
            </div>
          </>
        )}

        {error ? (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        ) : null}
      </div>

      {showDemoTopup ? (
        <div className="flex flex-col gap-2 border-t border-border pt-6">
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
    </div>
  );
}
