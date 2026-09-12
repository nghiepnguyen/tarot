import type { Metadata } from "next";
import { Lora, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { ToastProvider } from "@/components/ui/Toast";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import "./globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "vietnamese"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Xem bài tarot online miễn phí: nhập câu hỏi, bốc ba lá và nhận luận giải ngay trên trang, kèm diễn giải chuyên sâu bằng AI khi bạn cần đào sâu hơn.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Xem bài Tarot online — bốc ba lá và luận giải ngay",
    template: `%s — ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "/",
    siteName: SITE_NAME,
    title: "Xem bài Tarot online — bốc ba lá và luận giải ngay",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Xem bài Tarot online — bốc ba lá và luận giải ngay",
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${lora.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ToastProvider>{children}</ToastProvider>
      </body>
      <GoogleAnalytics />
    </html>
  );
}
