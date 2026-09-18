import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { CreditBalance } from "@/components/tarot/CreditBalance";
import { TopUpPanel } from "@/components/tarot/TopUpPanel";
import { OrderReturn } from "@/components/tarot/OrderReturn";

export const metadata: Metadata = {
  title: "Nạp credit",
  robots: { index: false, follow: false },
};

export default async function CreditsPage({
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

  const params = await searchParams;

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <OrderReturn userId={user.id} orderId={params.order} status={params.status} />
      <main id="main-content" className="flex flex-1 flex-col">
        <Section className="max-w-3xl">
          <div className="flex flex-col gap-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Nạp credit
            </h1>
            <Card className="flex max-w-lg flex-col gap-6">
              <CreditBalance credits={user.credits} />
              <div className="border-t border-border pt-6">
                <TopUpPanel
                  packages={packages}
                  showDemoTopup={process.env.NODE_ENV !== "production"}
                />
              </div>
            </Card>
          </div>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
