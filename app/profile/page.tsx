import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Section } from "@/components/ui/Section";
import { ProfileForm } from "@/components/tarot/ProfileForm";
import { CreditsPanel } from "@/components/tarot/CreditsPanel";
import { PurchaseTracker } from "@/components/analytics/PurchaseTracker";
import { CheckoutCancelledTracker } from "@/components/analytics/CheckoutCancelledTracker";

export const metadata: Metadata = {
  title: "Hồ sơ",
  robots: { index: false, follow: false },
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  const packages = await prisma.creditPackage.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  // PayOS trả về đây sau khi thanh toán. Chỉ bắn `purchase` khi đơn thật sự đã
  // PAID (webhook mới là nguồn sự thật), và đơn đó thuộc về người đang đăng
  // nhập — query param tự nó không chứng minh được gì.
  const params = await searchParams;
  const returnedOrder = params.order
    ? await prisma.order.findFirst({
        where: { id: params.order, userId: session.user.id },
        include: { package: true },
      })
    : null;
  const paidOrder = returnedOrder?.status === "PAID" ? returnedOrder : null;

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      {paidOrder ? (
        <PurchaseTracker
          transactionId={paidOrder.id}
          value={paidOrder.amountVnd}
          itemId={paidOrder.packageId}
          itemName={paidOrder.package.name}
          credits={paidOrder.creditsGranted}
        />
      ) : null}
      {params.status === "cancelled" && returnedOrder ? (
        <CheckoutCancelledTracker orderId={returnedOrder.id} />
      ) : null}
      <main className="flex flex-1 flex-col">
        <Section className="max-w-3xl">
          <div className="flex flex-col gap-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Hồ sơ
            </h1>
            <ProfileForm email={user.email} name={user.name ?? ""} />
            <CreditsPanel
              credits={user.credits}
              packages={packages}
              showDemoTopup={process.env.NODE_ENV !== "production"}
            />
          </div>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
