import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyWebhookPayload } from "@/lib/payments/payos";

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

  // code "00" là thành công theo quy ước PayOS; các mã khác coi như thất bại.
  if (data.code !== "00") {
    await prisma.order.updateMany({
      where: { providerOrderId: String(data.orderCode), status: "PENDING" },
      data: { status: "FAILED" },
    });
    return NextResponse.json({ ok: true });
  }

  const order = await prisma.order.findUnique({
    where: { providerOrderId: String(data.orderCode) },
  });
  if (!order) {
    // Không khớp order nào (vd payload test lúc đăng ký webhook) — vẫn trả
    // 200 để không bị PayOS coi là endpoint lỗi.
    return NextResponse.json({ ok: true });
  }

  // Idempotency: webhook có thể gửi lại nhiều lần, chỉ cộng credit lần đầu
  // order chuyển sang PAID.
  if (order.status === "PAID") {
    return NextResponse.json({ ok: true });
  }

  await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: { status: "PAID", paidAt: new Date() },
    });
    if (updated.count === 0) return; // đã được xử lý bởi request webhook khác

    const user = await tx.user.update({
      where: { id: order.userId },
      data: { credits: { increment: order.creditsGranted } },
    });
    await tx.creditTransaction.create({
      data: {
        userId: order.userId,
        type: "PURCHASE",
        amount: order.creditsGranted,
        balanceAfter: user.credits,
        relatedOrderId: order.id,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
