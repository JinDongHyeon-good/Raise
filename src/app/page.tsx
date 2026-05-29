import { JsonLd } from "@/components/seo/json-ld";
import { TarotHomeSeoContent } from "@/components/seo/tarot-home-seo-content";
import TarotHomeEntry from "@/components/tarot/tarot-home-entry";
import { buildHomePageMetadata, getHomeJsonLd } from "@/lib/seo";

export const metadata = buildHomePageMetadata();

export default function HomePage() {
  return (
    <>
      <JsonLd data={getHomeJsonLd()} />
      <TarotHomeSeoContent />
      <TarotHomeEntry />
    </>
  );
}
