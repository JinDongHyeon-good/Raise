import type { Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GOOGLE_ADSENSE_CLIENT, SERVICE_NAME, SERVICE_NAME_EN } from "@/lib/brand";
import { brandDisplayFont } from "@/lib/brand-font";
import { buildRootMetadata } from "@/lib/seo";
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
  themeColor: "#0f0a14",
};

export const metadata = {
  ...buildRootMetadata(),
  other: {
    "apple-mobile-web-app-title": SERVICE_NAME,
    "application-name": SERVICE_NAME_EN,
    "google-adsense-account": GOOGLE_ADSENSE_CLIENT,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${brandDisplayFont.variable} h-full antialiased`}
    >
      <head>
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${GOOGLE_ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
          suppressHydrationWarning
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#0f0a14] text-rose-50">{children}</body>
    </html>
  );
}
