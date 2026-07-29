import type { Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GOOGLE_ADSENSE_CLIENT } from "@/lib/brand";
import { brandDisplayFont } from "@/lib/brand-font";
import { defaultLocale } from "@/i18n/routing";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2a2150",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // lang은 [locale] 레이아웃의 래퍼에서 로케일별로 지정한다.
  // (여기서 getLocale()을 쓰면 모든 페이지가 동적 렌더링으로 바뀌어 SSG가 깨진다)
  return (
    <html
      lang={defaultLocale}
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
      <body className="min-h-full flex flex-col bg-[var(--piclick-beige-soft)] text-[var(--piclick-ink)]">{children}</body>
    </html>
  );
}
