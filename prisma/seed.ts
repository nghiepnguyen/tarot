import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CREDIT_PACKAGES = [
  { name: "Khởi động", credits: 50, priceVnd: 19_000, sortOrder: 1 },
  { name: "Phổ biến", credits: 100, priceVnd: 35_000, sortOrder: 2 },
  { name: "Tiết kiệm", credits: 200, priceVnd: 65_000, sortOrder: 3 },
  { name: "Sâu sắc", credits: 500, priceVnd: 149_000, sortOrder: 4 },
];

async function main() {
  for (const pkg of CREDIT_PACKAGES) {
    const existing = await prisma.creditPackage.findFirst({ where: { name: pkg.name } });
    if (existing) {
      await prisma.creditPackage.update({ where: { id: existing.id }, data: pkg });
    } else {
      await prisma.creditPackage.create({ data: pkg });
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
