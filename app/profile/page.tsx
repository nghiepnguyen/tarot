import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Section } from "@/components/ui/Section";
import { ProfileForm } from "@/components/tarot/ProfileForm";
import { CreditsPanel } from "@/components/tarot/CreditsPanel";

export const metadata: Metadata = {
  title: "Hồ sơ — Tarot Reading Web",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  const packages = await prisma.creditPackage.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <Section className="max-w-3xl">
          <div className="flex flex-col gap-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Hồ sơ
            </h1>
            <ProfileForm
              email={user.email}
              name={user.name ?? ""}
              language={user.language}
            />
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
