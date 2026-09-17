import fs from "node:fs";
import path from "node:path";

/**
 * Playwright chạy trong tiến trình node của chính nó, không đi qua Next nên
 * không tự nạp `.env.local`. Đọc tay đúng như Next làm, để `pnpm test:e2e`
 * chạy được mà không phải source gì trước.
 *
 * `globalSetup` và các worker là những tiến trình khác nhau — biến môi trường
 * đặt ở bên này không sang bên kia — nên cả hai đều gọi hàm này.
 */
export function loadTestEnv() {
  for (const file of [".env.local", ".env"]) {
    const fullPath = path.join(process.cwd(), file);
    if (!fs.existsSync(fullPath)) continue;

    for (const line of fs.readFileSync(fullPath, "utf8").split("\n")) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue; // biến có sẵn thắng file
      process.env[key] = rawValue.trim().replace(/^["']|["']$/g, "");
    }
  }
}
