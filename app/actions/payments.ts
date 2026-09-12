"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { createPaymentLink } from "@/lib/payments/payos";

export type CreateOrderResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string };

export async function createOrderAction(packageId: string): Promise<CreateOrderResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Vui lòng đăng nhập để nạp credit." };

  if (!(await checkRateLimit(`create-order:${session.user.id}`, 10, 60 * 60 * 1000))) {
    return { ok: false, error: "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút." };
  }

  const creditPackage = await prisma.creditPackage.findFirst({
    where: { id: packageId, isActive: true },
  });
  if (!creditPackage) return { ok: false, error: "Gói credit không tồn tại hoặc đã ngừng bán." };

  // orderCode PayOS yêu cầu là số nguyên duy nhất; ghép timestamp + số ngẫu
  // nhiên là đủ để tránh trùng giữa các order tạo cùng mili-giây.
  const orderCode = Date.now() * 1000 + Math.floor(Math.random() * 1000);

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      packageId: creditPackage.id,
      provider: "payos",
      providerOrderId: String(orderCode),
      amountVnd: creditPackage.priceVnd,
      creditsGranted: creditPackage.credits,
      status: "PENDING",
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const { checkoutUrl } = await createPaymentLink({
      orderCode,
      amountVnd: creditPackage.priceVnd,
      description: `Nạp ${creditPackage.credits} credit`,
      returnUrl: `${appUrl}/profile?order=${order.id}&status=success`,
      cancelUrl: `${appUrl}/profile?order=${order.id}&status=cancelled`,
    });
    return { ok: true, checkoutUrl };
  } catch {
    await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
    return { ok: false, error: "Không thể khởi tạo thanh toán lúc này, vui lòng thử lại." };
  }
}
