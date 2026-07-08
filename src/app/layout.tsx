import type { Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GOOGLE_ADSENSE_CLIENT, SERVICE_NAME_EN } from "@/lib/brand";
import { brandDisplayFont } from "@/lib/brand-font";
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
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
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
      <body className="min-h-full flex flex-col bg-white text-slate-900">{children}</body>
    </html>
  );
}
