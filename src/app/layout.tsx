import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  GOOGLE_ADSENSE_CLIENT,
  SERVICE_DESCRIPTION,
  SERVICE_KEYWORDS,
  SERVICE_NAME,
  SERVICE_NAME_EN,
  SERVICE_TAGLINE,
  getSiteUrl,
} from "@/lib/brand";
import { brandDisplayFont } from "@/lib/brand-font";
import "./globals.css";

const siteUrl = new URL(getSiteUrl());

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
  themeColor: "#fffafb",
};

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: SERVICE_NAME,
  title: {
    default: SERVICE_NAME,
    template: `%s | ${SERVICE_NAME}`,
  },
  description: SERVICE_DESCRIPTION,
  keywords: [...SERVICE_KEYWORDS],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: SERVICE_NAME,
    description: SERVICE_TAGLINE,
    url: "/",
    siteName: SERVICE_NAME,
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "https://xkgrclhvjettrtfysqxe.supabase.co/storage/v1/object/public/board-images/ogImage.png",
        width: 1200,
        height: 630,
        alt: `${SERVICE_NAME} AI 타로 서비스`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SERVICE_NAME,
    description: SERVICE_TAGLINE,
    images: ["https://xkgrclhvjettrtfysqxe.supabase.co/storage/v1/object/public/board-images/ogImage.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
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
      <body className="min-h-full flex flex-col bg-[#fffbfb] text-slate-900">{children}</body>
    </html>
  );
}
