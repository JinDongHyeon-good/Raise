import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { getTranslations, setRequestLocale } from "next-intl/server";
import RaiseChart from "@/components/raise/raise-chart";
import type { AppLocale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.pages.chart" });
  return buildPageMetadata({
    locale,
    title: t("title"),
    description: t("description"),
    path: "/chart",
    image: "/og-chart.png",
  });
}

export default async function ChartPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);

  return <RaiseChart />;
}
