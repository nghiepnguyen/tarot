/**
 * Thu hồi credit của một đơn đã thanh toán, sau khi tiền đã được hoàn ở
 * dashboard PayOS.
 *
 * PayOS không có API hoàn tiền cho merchant, nên việc chuyển tiền lại cho
 * khách vẫn làm thủ công trên dashboard. Script này chỉ đóng nốt phần sổ sách
 * phía mình: đổi đơn sang REFUNDED và trừ lại số credit đã phát.
 *
 *   pnpm refund-order <orderId>
 *
 * Chạy `--dry-run` để xem đơn trước khi động vào nó.
 */
import { PrismaClient } from "@prisma/client";
import { refundOrder } from "../lib/payments/refund";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const orderId = args.find((arg) => !arg.startsWith("--"));

  if (!orderId) {
    console.error("Thiếu orderId. Dùng: pnpm refund-order <orderId> [--dry-run]");
    process.exitCode = 1;
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { email: true, credits: true } }, package: true },
  });

  if (!order) {
    console.error(`Không tìm thấy đơn ${orderId}.`);
    process.exitCode = 1;
    return;
  }

  console.log(`Đơn        : ${order.id}`);
  console.log(`Khách      : ${order.user.email} (đang có ${order.user.credits} credit)`);
  console.log(`Gói        : ${order.package.name} — ${order.creditsGranted} credit`);
  console.log(`Số tiền    : ${order.amountVnd.toLocaleString("vi-VN")}đ`);
  console.log(`Trạng thái : ${order.status}`);
  console.log(`PayOS code : ${order.providerOrderId}`);

  if (isDryRun) {
    console.log("\n--dry-run: không thay đổi gì.");
    return;
  }

  const result = await refundOrder(prisma, orderId);

  if (!result.ok) {
    console.error(`\nKhông hoàn được: ${result.error}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `\nĐã thu hồi ${result.creditsReversed} credit. Số dư mới: ${result.balanceAfter} credit.`,
  );
  console.log("Nhớ xác nhận tiền đã hoàn cho khách trên dashboard PayOS.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
