import type { Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GOOGLE_ADSENSE_CLIENT } from "@/lib/brand";
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
  themeColor: "#0a0c10",
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
      <body className="flex min-h-full flex-col bg-[#0a0c10] text-[#ece8df]">{children}</body>
    </html>
  );
}
