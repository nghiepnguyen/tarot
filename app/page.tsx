import { auth } from "@/auth";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Section } from "@/components/ui/Section";
import { TarotExperience } from "@/components/tarot/TarotExperience";
import { Disclaimer } from "@/components/tarot/Disclaimer";
import { AuthSuccessTracker } from "@/components/analytics/AuthSuccessTracker";

// Mở khóa diễn giải gọi Gemini sinh một bản đọc dài; đo trên bản build
// production mất khoảng 28 giây. Mặc định của nền tảng thấp hơn con số đó,
// nên không khai báo ở đây thì server action bị cắt giữa chừng. maxDuration
// đặt ở tầng page áp cho mọi server action dùng trong page.
export const maxDuration = 60;

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      inLanguage: "vi-VN",
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      inLanguage: "vi-VN",
      description:
        "Công cụ xem bài tarot online: nhập câu hỏi, bốc ba lá và nhận luận giải cơ bản, có thể mở diễn giải chuyên sâu bằng AI.",
      offers: {
        "@type": "Offer",
        price: 0,
        priceCurrency: "VND",
        description: "Bốc bài và luận giải cơ bản miễn phí; diễn giải chuyên sâu bằng AI dùng credit.",
      },
    },
  ],
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  const session = await auth();
  const { auth: authResult } = await searchParams;

  return (
    <div className="flex flex-1 flex-col">
      <JsonLd data={structuredData} />
      {authResult === "login" || authResult === "signup" ? (
        <AuthSuccessTracker method={authResult} />
      ) : null}
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
