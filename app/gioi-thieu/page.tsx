import type { Metadata } from "next";
import { connection } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { Section } from "@/components/ui/Section";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SpreadPositions } from "@/components/landing/SpreadPositions";
import { DeepReading } from "@/components/landing/DeepReading";
import { Pricing } from "@/components/landing/Pricing";
import { Faq, FAQ_ITEMS } from "@/components/landing/Faq";
import { ClosingCta } from "@/components/landing/ClosingCta";

const PATH = "/gioi-thieu";

const TITLE = "Xem bài tarot online miễn phí | Tarot Reading Web";

const DESCRIPTION =
  "Trang tarot tiếng Việt: nhập câu hỏi, bốc ba lá trong bộ 78 lá và đọc luận giải ngay. Miễn phí, không cần tài khoản; diễn giải chuyên sâu bằng AI khi bạn cần đọc kỹ hơn.";

export const metadata: Metadata = {
  // absolute: template của layout gắn thêm tên site vào sau, cộng lại thì tiêu
  // đề vượt quá độ dài Google hiển thị, nên trang này tự viết trọn tiêu đề.
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: PATH,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}${PATH}#webpage`,
      url: `${SITE_URL}${PATH}`,
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: "vi-VN",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#app` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${SITE_URL}${PATH}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Giới thiệu", item: `${SITE_URL}${PATH}` },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}${PATH}#faq`,
      inLanguage: "vi-VN",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ],
};

/**
 * Giá đọc từ database nên không bao giờ lệch với số tiền lúc thanh toán, nhưng
 * đổi lại trang phải chịu hai thứ.
 *
 * Một: lúc `next build`, Next thử prerender trang này. Query chạy trước khi
 * `Header` gọi `auth()` - thứ vốn đẩy trang sang dynamic - nên nó đi hỏi
 * database ngay trong lúc build. Máy build không nhất thiết có database (CI thì
 * chắc chắn không), và build đổ. `connection()` chặn prerender ngay tại đây,
 * đúng cách tài liệu Next hướng dẫn cho query database.
 *
 * Hai: database ngắt thì phần còn lại của trang - toàn bộ nội dung giới thiệu -
 * không có lý do gì phải chết theo. Bảng giá lùi về trạng thái rỗng đã dựng sẵn
 * trong `Pricing`, lỗi vẫn ghi ra log để còn biết mà sửa.
 */
async function activeCreditPackages() {
  await connection();
  try {
    return await prisma.creditPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  } catch (error) {
    console.error("gioi-thieu: không đọc được gói credit", error);
    return [];
  }
}

export default async function GioiThieuPage() {
  const packages = await activeCreditPackages();

  return (
    <div className="flex flex-1 flex-col">
      <JsonLd data={structuredData} />
      <Header />

      <main id="main-content" className="flex flex-1 flex-col">
        <Section className="pt-12 pb-16 sm:pt-16 sm:pb-20">
          <Hero />
        </Section>

        <Section id="cach-hoat-dong" className="scroll-mt-8 border-t border-border py-16 sm:py-20">
          <div className="reveal-on-scroll">
            <HowItWorks />
          </div>
        </Section>

        <Section className="border-t border-border py-16 sm:py-20">
          <div className="reveal-on-scroll">
            <SpreadPositions />
          </div>
        </Section>

        <Section className="border-t border-border py-16 sm:py-20">
          <div className="reveal-on-scroll">
            <DeepReading />
          </div>
        </Section>

        <Section className="border-t border-border py-16 sm:py-20">
          <div className="reveal-on-scroll">
            <Pricing packages={packages} />
          </div>
        </Section>

        <Section className="border-t border-border py-16 sm:py-20">
          <div className="reveal-on-scroll">
            <Faq />
          </div>
        </Section>

        <Section className="border-t border-border py-16 sm:py-20">
          <div className="reveal-on-scroll">
            <ClosingCta />
          </div>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
