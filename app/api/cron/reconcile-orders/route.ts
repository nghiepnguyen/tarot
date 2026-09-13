import { NextResponse } from "next/server";
import { reconcileStaleOrders } from "@/lib/payments/orders";
import { alertStuckOrders } from "@/lib/payments/alerts";

// Mỗi đơn là một lượt gọi sang PayOS, nên cho phép chạy lâu hơn mặc định.
export const maxDuration = 60;

/**
 * Quét các đơn còn PENDING quá lâu và hỏi lại PayOS trạng thái thật.
 *
 * Đây là lưới an toàn cho webhook: nếu callback trượt (PayOS lỗi, deploy đúng
 * lúc, mạng đứt) thì người đã trả tiền vẫn được cộng credit ở lượt quét kế
 * tiếp, và đơn không bao giờ trả tiền sẽ được đóng lại thay vì nằm PENDING mãi.
 *
 * Vercel Cron gọi endpoint này kèm `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Chưa cấu hình CRON_SECRET." },
      { status: 503 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Không có quyền." }, { status: 401 });
  }

  const result = await reconcileStaleOrders(25);
  // Đơn vẫn PENDING sau khi đã hỏi PayOS là tiền có thể đang treo. Báo ra
  // ngoài thay vì để nó nằm im trong log.
  await alertStuckOrders(result.stillPending);
  return NextResponse.json({ ok: true, ...result });
}
