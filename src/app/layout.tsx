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
  title: "진동댕 세상",
  description: "진동댕 세상",
  openGraph: {
    title: "진동댕 세상",
    description: "여양진씨 37대손 진동현에 대해서 알아보자",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "진동댕 나라 OG 이미지",
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
