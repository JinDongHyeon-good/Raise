import { JsonLd } from "@/components/seo/json-ld";
import TarotHomeEntry from "@/components/tarot/tarot-home-entry";
import { buildHomePageMetadata, getHomeJsonLd } from "@/lib/seo";

export const metadata = buildHomePageMetadata();

export default function HomePage() {
  return (
    <>
      <JsonLd data={getHomeJsonLd()} />
      <TarotHomeEntry />
    </>
  );
}
