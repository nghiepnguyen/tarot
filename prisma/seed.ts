import { PrismaClient } from "@prisma/client";
import { seedCreditPackages } from "./credit-packages";

const prisma = new PrismaClient();

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

async function main() {
  await seedCreditPackages(prisma);
}
