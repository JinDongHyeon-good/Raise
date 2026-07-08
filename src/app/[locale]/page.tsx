import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { JsonLd } from "@/components/seo/json-ld";
import TarotHomeEntry from "@/components/tarot/tarot-home-entry";
import type { AppLocale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import { buildHomePageMetadata, getHomeJsonLd } from "@/lib/seo";
import type { TarotTopicId } from "@/lib/tarot-deck";
import { TAROT_TOPIC_IDS } from "@/lib/tarot-deck";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ topic?: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildHomePageMetadata(locale as AppLocale);
}

function parseInitialTopic(raw?: string): TarotTopicId | undefined {
  if (!raw) return undefined;
  return TAROT_TOPIC_IDS.includes(raw as TarotTopicId) ? (raw as TarotTopicId) : undefined;
}

export default async function HomePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { topic } = await searchParams;
  const initialTopic = parseInitialTopic(topic);

  return (
    <>
      <JsonLd data={getHomeJsonLd(locale as AppLocale)} />
      <TarotHomeEntry initialTopic={initialTopic} />
    </>
  );
}
