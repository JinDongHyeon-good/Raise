import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { setRequestLocale } from "next-intl/server";
import RaiseChart from "@/components/raise/raise-chart";
import type { AppLocale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = buildPageMetadata({
  title: "코인·나스닥 실시간 차트",
  description:
    "비트코인·이더리움·리플·솔라나와 나스닥·나스닥100·S&P500·다우존스 실시간 캔들 차트. 15분봉부터 주봉까지 한눈에 확인하세요.",
  path: "/chart",
  image: "/og-chart.png",
});

export default async function ChartPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);

  return <RaiseChart />;
}
