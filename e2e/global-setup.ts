import { PrismaClient } from "@prisma/client";
import { seedCreditPackages } from "../prisma/credit-packages";
import { loadTestEnv } from "./env";

function isDisposableDatabase(url: string): boolean {
  // CI dựng một container Postgres tạm rồi vứt, host của nó không cố định.
  if (process.env.CI) return true;
  return /@(localhost|127\.0\.0\.1|\[::1\]|db|postgres)[:/]/.test(url);
}

export default async function globalSetup() {
  loadTestEnv();

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("e2e cần DATABASE_URL. Đặt nó trong .env.local hoặc môi trường.");
  }

  // Bộ test đăng ký tài khoản và ghi reading thật. Trỏ nhầm vào Neon là đổ rác
  // vào dữ liệu người dùng, nên chặn thẳng thay vì tin vào sự cẩn thận.
  if (!isDisposableDatabase(url)) {
    throw new Error(
      "e2e chỉ được chạy trên database dùng một lần (local hoặc CI). " +
        "DATABASE_URL đang trỏ tới một host khác — kiểm tra lại trước khi chạy.",
    );
  }

  const prisma = new PrismaClient();
  try {
    // Suite tiêu 7 trong số 10 lượt đăng ký mỗi giờ mà `signupAction` cho phép,
    // nên nếu không dọn thì lần chạy thứ hai trong cùng giờ sẽ tự chặn chính nó.
    await prisma.rateLimit.deleteMany({});

    // CI chỉ chạy `migrate deploy`, không chạy seed, nên bảng gói credit rỗng
    // và trang nạp tiền hiện nhánh "chưa có gói nào đang mở bán".
    await seedCreditPackages(prisma);
  } finally {
    await prisma.$disconnect();
  }
}
