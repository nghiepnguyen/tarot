import type { ReactNode } from "react";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Section } from "@/components/ui/Section";

interface LegalPageProps {
  title: string;
  updatedAt: string;
  children: ReactNode;
}

export function LegalPage({ title, updatedAt, children }: LegalPageProps) {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <Section className="max-w-3xl">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>
              <p className="text-sm text-muted">Cập nhật lần cuối: {updatedAt}</p>
            </div>
            <div className="flex flex-col gap-6 text-sm leading-relaxed text-foreground [&_h2]:text-base [&_h2]:font-medium [&_h2]:tracking-tight [&_p]:text-muted [&_li]:text-muted">
              {children}
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
