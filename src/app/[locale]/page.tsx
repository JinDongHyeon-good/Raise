import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { JsonLd } from "@/components/seo/json-ld";
import PiclickHome from "@/components/piclick/piclick-home";
import type { AppLocale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import { buildHomePageMetadata, getHomeJsonLd } from "@/lib/seo";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildHomePageMetadata(locale as AppLocale);
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <JsonLd data={getHomeJsonLd(locale as AppLocale)} />
      <PiclickHome />
    </>
  );
}
