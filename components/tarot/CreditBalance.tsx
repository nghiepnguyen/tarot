import { COST_PER_INTERPRETATION } from "@/lib/ai/interpretation";

/**
 * Số dư credit, quy đổi sẵn ra số lượt. Người dùng nghĩ theo "còn mấy lượt
 * nữa", không theo credit, nên con số lượt đứng trước.
 */
export function CreditBalance({ credits }: { credits: number }) {
  const remainingUnlocks = Math.floor(credits / COST_PER_INTERPRETATION);

  return (
    <div>
      <p className="text-sm text-muted">Còn lại</p>
      <p className="text-2xl font-semibold text-foreground">
        {remainingUnlocks} lượt diễn giải chuyên sâu
      </p>
      <p className="text-sm text-muted">({credits} credit)</p>
    </div>
  );
}
