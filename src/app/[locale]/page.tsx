import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import RaiseHome from "@/components/raise/raise-home";
import { JsonLd } from "@/components/seo/json-ld";
import { routing } from "@/i18n/routing";
import { buildHomePageMetadata, getHomeJsonLd } from "@/lib/seo";
import { toRoutedLocale } from "@/lib/seo-i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildHomePageMetadata(toRoutedLocale(locale));
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <JsonLd data={getHomeJsonLd(toRoutedLocale(locale))} />
      <RaiseHome />
    </>
  );
}
