import type { PrismaClient } from "@prisma/client";

/**
 * Danh mục gói credit đang bán.
 *
 * `isActive` khai báo tường minh: trang nạp credit chỉ hiện gói đang active, nên
 * một dòng bị tắt tay sẽ làm cả khu vực chọn gói trống trơn. Không có cột này
 * thì lệnh update bỏ qua nó và chạy lại seed cũng không cứu được.
 */
export const CREDIT_PACKAGES = [
  { name: "Khởi động", credits: 50, priceVnd: 19_000, sortOrder: 1, isActive: true },
  { name: "Phổ biến", credits: 100, priceVnd: 35_000, sortOrder: 2, isActive: true },
  { name: "Tiết kiệm", credits: 200, priceVnd: 65_000, sortOrder: 3, isActive: true },
  { name: "Sâu sắc", credits: 500, priceVnd: 149_000, sortOrder: 4, isActive: true },
];

/**
 * Đưa danh mục trên vào database, khớp theo tên.
 *
 * Dùng chung cho `prisma db seed` và phần chuẩn bị của e2e: bộ test cần có gói
 * để chọn, và một database vừa migrate xong thì chưa có gì. Để việc này cho
 * người chạy nhớ thì sớm muộn cũng quên — CI đã quên một lần.
 */
export async function seedCreditPackages(db: PrismaClient): Promise<void> {
  for (const pkg of CREDIT_PACKAGES) {
    const existing = await db.creditPackage.findFirst({ where: { name: pkg.name } });
    if (existing) {
      await db.creditPackage.update({ where: { id: existing.id }, data: pkg });
    } else {
      await db.creditPackage.create({ data: pkg });
    }
  }
}
