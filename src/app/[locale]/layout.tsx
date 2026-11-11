import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { AuthProvider } from "@/components/auth/auth-provider";
import { htmlLang, routing, type RoutedLocale } from "@/i18n/routing";
import { GOOGLE_ADSENSE_CLIENT } from "@/lib/brand";
import { brandDisplayFont } from "@/lib/brand-font";
import { buildRootMetadata } from "@/lib/seo";
import { toRoutedLocale } from "@/lib/seo-i18n";
import "../globals.css";

/**
 * 최상위 레이아웃 (app/layout.tsx 없음) — <html lang>을 URL 언어로 정해야 해서 여기서 그린다.
 * 요청 헤더를 읽지 않으므로 페이지가 정적으로 미리 만들어진다.
 */

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0c10",
};

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildRootMetadata(toRoutedLocale(locale));
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const lang = htmlLang[(locale as RoutedLocale) ?? "ko"] ?? "ko";

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} ${brandDisplayFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${GOOGLE_ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
          suppressHydrationWarning
        />
      </head>
      <body className="flex min-h-full flex-col bg-[#0a0c10] text-[#ece8df]">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>{children}</AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
