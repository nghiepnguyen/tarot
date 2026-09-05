import type { Metadata } from "next";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Section } from "@/components/ui/Section";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Đăng ký — Tarot Reading Web",
};

export default function SignupPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <Section className="flex items-center justify-center">
          <SignupForm />
        </Section>
      </main>
      <Footer />
    </div>
  );
}
