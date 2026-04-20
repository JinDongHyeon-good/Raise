import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
};

export const metadata: Metadata = {
  title: "jjindong Trading",
  description: "아직도 선물거래 감으로 하시나요? 전문 트레이딩 AI를 통해 이제 근거 있게 매매하세요.",
  openGraph: {
    title: "jjindong Trading",
    description: "아직도 선물거래 감으로 하시나요? 전문 트레이딩 AI를 통해 이제 근거 있게 매매하세요.",
    images: [
      {
        url: "https://auth.moast.ai/storage/v1/object/public/moast/temp/doge.jpg",
        width: 1200,
        height: 630,
        alt: "트레이딩 플로어 OG 이미지",
      },
    ],
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
