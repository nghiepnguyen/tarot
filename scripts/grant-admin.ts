/**
 * Cấp hoặc thu quyền quản trị của một tài khoản.
 *
 * Không có đường nào trong giao diện làm việc này: nâng quyền phải đi qua
 * người có quyền chạy lệnh trên máy, đúng như hoàn tiền từng chỉ đi qua
 * `pnpm refund-order`.
 *
 *   pnpm grant-admin <email>
 *   pnpm grant-admin <email> --revoke
 *
 * Chạy `--dry-run` để xem tài khoản trước khi động vào nó.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const isRevoke = args.includes("--revoke");
  const email = args.find((arg) => !arg.startsWith("--"));

  if (!email) {
    console.error("Thiếu email. Dùng: pnpm grant-admin <email> [--revoke] [--dry-run]");
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, emailVerifiedAt: true },
  });

  if (!user) {
    console.error(`Không tìm thấy tài khoản ${email}.`);
    process.exitCode = 1;
    return;
  }

  const nextRole = isRevoke ? "USER" : "ADMIN";

  console.log(`Tài khoản  : ${user.email}`);
  console.log(`Id         : ${user.id}`);
  console.log(`Xác nhận   : ${user.emailVerifiedAt ? "đã xác nhận email" : "CHƯA xác nhận email"}`);
  console.log(`Quyền      : ${user.role} -> ${nextRole}`);

  if (user.role === nextRole) {
    console.log("\nQuyền đã đúng như vậy rồi, không thay đổi gì.");
    return;
  }

  if (isDryRun) {
    console.log("\n--dry-run: không thay đổi gì.");
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { role: nextRole } });

  console.log(`\nĐã đổi quyền của ${user.email} thành ${nextRole}.`);
  console.log(
    "Phiên đang đăng nhập giữ bản cache của quyền cũ tối đa 5 phút. Đăng xuất rồi",
  );
  console.log("đăng nhập lại để có hiệu lực ngay.");

  if (!isRevoke && !user.emailVerifiedAt) {
    console.log(
      "\nLưu ý: tài khoản này chưa xác nhận email nên chưa đăng nhập được, quyền chưa dùng được.",
    );
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
