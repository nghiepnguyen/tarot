import { NextResponse } from "next/server";
import { verifyWebhookPayload } from "@/lib/payments/payos";
import { closeUnpaidOrder, creditPaidOrder } from "@/lib/payments/orders";

export async function POST(request: Request) {
  // PayOS gọi endpoint này với payload test (orderCode giả) khi admin đăng ký
  // webhook URL trong dashboard, và cần nhận về 2xx để xác nhận đăng ký thành
  // công. Vì vậy mọi nhánh dưới đây trả 200 trừ khi chữ ký sai hoặc body lỗi.
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body không hợp lệ." }, { status: 400 });
  }

  const data = verifyWebhookPayload(payload);
  if (!data) {
    return NextResponse.json({ ok: false, error: "Chữ ký không hợp lệ." }, { status: 400 });
  }

  const providerOrderId = String(data.orderCode);

  // code "00" là thành công theo quy ước PayOS; các mã khác coi như thất bại.
  if (data.code !== "00") {
    await closeUnpaidOrder(providerOrderId, "FAILED");
    return NextResponse.json({ ok: true });
  }

  // Idempotency và đối chiếu số tiền nằm trong creditPaidOrder, dùng chung với
  // đường đối soát định kỳ. Không khớp đơn nào (vd payload test lúc đăng ký
  // webhook) vẫn trả 200 để PayOS không coi endpoint là lỗi.
  const outcome = await creditPaidOrder(providerOrderId, Number(data.amount));

  return NextResponse.json({ ok: true, outcome });
}
