import { JsonLd } from "@/components/seo/json-ld";
import TarotHomeEntry from "@/components/tarot/tarot-home-entry";
import { buildHomePageMetadata, getHomeJsonLd } from "@/lib/seo";
import type { TarotTopicId } from "@/lib/tarot-deck";
import { TAROT_TOPIC_IDS } from "@/lib/tarot-deck";

export const metadata = buildHomePageMetadata();

type PageProps = {
  searchParams: Promise<{ topic?: string }>;
};

function parseInitialTopic(raw?: string): TarotTopicId | undefined {
  if (!raw) return undefined;
  return TAROT_TOPIC_IDS.includes(raw as TarotTopicId) ? (raw as TarotTopicId) : undefined;
}

export default async function HomePage({ searchParams }: PageProps) {
  const { topic } = await searchParams;
  const initialTopic = parseInitialTopic(topic);

  return (
    <>
      <JsonLd data={getHomeJsonLd()} />
      <TarotHomeEntry initialTopic={initialTopic} />
    </>
  );
}
