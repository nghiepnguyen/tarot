import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

/**
 * Playwright chạy trong tiến trình node của chính nó, không đi qua Next nên
 * không tự nạp `.env.local`. Đọc tay đúng như Next làm, để `pnpm test:e2e`
 * chạy được mà không phải source gì trước.
 */
function loadEnvFile(file: string) {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) return;

  for (const line of fs.readFileSync(fullPath, "utf8").split("\n")) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue; // biến có sẵn thắng file
    process.env[key] = rawValue.trim().replace(/^["']|["']$/g, "");
  }
}

function isDisposableDatabase(url: string): boolean {
  // CI dựng một container Postgres tạm rồi vứt, host của nó không cố định.
  if (process.env.CI) return true;
  return /@(localhost|127\.0\.0\.1|\[::1\]|db|postgres)[:/]/.test(url);
}

export default async function globalSetup() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

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

  // Suite tiêu 4 trong số 5 lượt đăng ký mỗi giờ mà `signupAction` cho phép,
  // nên nếu không dọn thì lần chạy thứ hai trong cùng giờ sẽ tự chặn chính nó.
  const prisma = new PrismaClient();
  try {
    await prisma.rateLimit.deleteMany({});
  } finally {
    await prisma.$disconnect();
  }
}
