import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Section } from "@/components/ui/Section";
import { TarotExperience } from "@/components/tarot/TarotExperience";
import { LockedAiSection } from "@/components/tarot/LockedAiSection";
import { ConsultantCta } from "@/components/tarot/ConsultantCta";
import { Disclaimer } from "@/components/tarot/Disclaimer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <Section>
          <TarotExperience />
        </Section>

        <Section className="grid gap-6 border-t border-border sm:grid-cols-2">
          <LockedAiSection />
          <ConsultantCta />
        </Section>

        <Section className="border-t border-border">
          <Disclaimer />
        </Section>
      </main>
      <Footer />
    </div>
  );
}
