"use server";

import type { OrderStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { createPaymentLink } from "@/lib/payments/payos";
import { ORDER_TTL_MS, reconcileOrder } from "@/lib/payments/orders";
import { SITE_URL } from "@/lib/seo/site";

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
  const expiresAt = new Date(Date.now() + ORDER_TTL_MS);

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      packageId: creditPackage.id,
      provider: "payos",
      providerOrderId: String(orderCode),
      amountVnd: creditPackage.priceVnd,
      creditsGranted: creditPackage.credits,
      status: "PENDING",
      expiresAt,
    },
  });

  try {
    const { checkoutUrl, paymentLinkId } = await createPaymentLink({
      orderCode,
      amountVnd: creditPackage.priceVnd,
      description: `Nạp ${creditPackage.credits} credit`,
      returnUrl: `${SITE_URL}/profile?order=${order.id}&status=success`,
      cancelUrl: `${SITE_URL}/profile?order=${order.id}&status=cancelled`,
      expiredAt: Math.floor(expiresAt.getTime() / 1000),
    });

    // Lưu link id để sau này còn hỏi lại PayOS trạng thái đơn khi webhook
    // không tới. Không có nó thì đơn PENDING là ngõ cụt.
    await prisma.order.update({
      where: { id: order.id },
      data: { providerPaymentLinkId: paymentLinkId },
    });

    return { ok: true, checkoutUrl };
  } catch {
    await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
    return { ok: false, error: "Không thể khởi tạo thanh toán lúc này, vui lòng thử lại." };
  }
}

export type OrderStatusResult =
  | { ok: true; status: OrderStatus; credits: number }
  | { ok: false; error: string };

/**
 * Trạng thái hiện tại của một đơn, có đối soát lại với PayOS nếu đơn còn
 * PENDING. Trang trả về sau thanh toán gọi cái này để không bắt người dùng
 * ngồi nhìn số credit cũ khi webhook về chậm — hoặc không bao giờ về.
 */
export async function getOrderStatusAction(orderId: string): Promise<OrderStatusResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Vui lòng đăng nhập." };

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id },
  });
  if (!order) return { ok: false, error: "Không tìm thấy đơn hàng." };

  let status = order.status;
  if (status === "PENDING") {
    // Mỗi lần đối soát là một request sang PayOS; chặn tần suất để một tab
    // treo không biến thành vòng lặp gọi API vô hạn.
    if (await checkRateLimit(`order-status:${session.user.id}`, 60, 10 * 60 * 1000)) {
      status = await reconcileOrder(order);
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { credits: true },
  });

  return { ok: true, status, credits: user?.credits ?? 0 };
}
