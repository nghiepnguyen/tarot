import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Section } from "@/components/ui/Section";
import { HistoryList } from "@/components/tarot/HistoryList";
import type { StoredCard } from "@/app/actions/readings";
import type { InterpretationResult } from "@/lib/ai/interpretation";

export const metadata: Metadata = {
  title: "Lịch sử trải bài — Tarot Reading Web",
};

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const readings = await prisma.reading.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { aiInterpretation: true },
  });

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <Section className="max-w-3xl">
          <div className="flex flex-col gap-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Lịch sử trải bài
            </h1>
            <HistoryList
              readings={readings.map((r) => ({
                id: r.id,
                question: r.question,
                cards: r.cards as unknown as StoredCard[],
                createdAt: r.createdAt.toISOString(),
                aiInterpretation: r.aiInterpretation
                  ? ({
                      overview: r.aiInterpretation.overview,
                      perCard: r.aiInterpretation.perCard as unknown as InterpretationResult["perCard"],
                      connections: r.aiInterpretation.connections,
                      actionSuggestions: r.aiInterpretation.actionSuggestions,
                      reflectiveQuestion: r.aiInterpretation.reflectiveQuestion,
                    } satisfies InterpretationResult)
                  : null,
              }))}
            />
          </div>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
