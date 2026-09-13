import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { ProfileForm } from "@/components/tarot/ProfileForm";
import { CreditBalance } from "@/components/tarot/CreditBalance";
import { OrderReturn } from "@/components/tarot/OrderReturn";

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

  const params = await searchParams;

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      {/* Đơn tạo trước khi tách trang nạp tiền vẫn mang returnUrl trỏ về đây. */}
      <OrderReturn userId={user.id} orderId={params.order} status={params.status} />
      <main className="flex flex-1 flex-col">
        <Section className="max-w-3xl">
          <div className="flex flex-col gap-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Hồ sơ
            </h1>
            <ProfileForm email={user.email} name={user.name ?? ""} />
            <Card className="flex max-w-lg flex-col gap-5">
              <CreditBalance credits={user.credits} />
              <Link
                href="/credits"
                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 self-start rounded-full border border-accent bg-accent px-6 text-sm font-medium tracking-wide text-accent-foreground shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:opacity-95 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0"
              >
                Nạp thêm credit
              </Link>
            </Card>
          </div>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
