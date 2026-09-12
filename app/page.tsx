import { auth } from "@/auth";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Section } from "@/components/ui/Section";
import { TarotExperience } from "@/components/tarot/TarotExperience";
import { Disclaimer } from "@/components/tarot/Disclaimer";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <Section>
          <TarotExperience isLoggedIn={Boolean(session?.user)} />
        </Section>

        <Section className="border-t border-border">
          <Disclaimer />
        </Section>
      </main>
      <Footer />
    </div>
  );
}
