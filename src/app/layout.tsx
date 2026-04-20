import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const SITE_URL = "https://jjindong.com";
const siteUrl = new URL(SITE_URL);

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
};

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "jjindong Trading",
    template: "%s | jjindong Trading",
  },
  description: "아직도 선물거래 감으로 하시나요? 전문 트레이딩 AI를 통해 이제 근거 있게 매매하세요.",
  keywords: [
    "AI 트레이딩",
    "AI 비트코인",
    "선물거래",
    "암호화폐",
    "코인분석",
    "AI 차트분석",
    "AI 자동매매",
    "AI 코인분석",
    "비트코인",
    "이더리움",
  ],
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
    title: "JJINDONG TRADING",
    description: "아직도 선물거래 감으로 하시나요? 전문 트레이딩 AI를 통해 이제 근거 있게 매매하세요.",
    url: "/",
    siteName: "JJINDONG TRADING",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "https://auth.moast.ai/storage/v1/object/public/moast/temp/doge.jpg",
        width: 1200,
        height: 630,
        alt: "트레이딩 플로어 OG 이미지",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JJINDONG TRADING",
    description: "아직도 선물거래 감으로 하시나요? 전문 트레이딩 AI를 통해 이제 근거 있게 매매하세요.",
    images: ["https://auth.moast.ai/storage/v1/object/public/moast/temp/doge.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preload" as="video" href="/introduce.mp4" type="video/mp4" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
