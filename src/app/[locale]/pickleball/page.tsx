import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { PickleballIntro } from "@/components/pickleball/pickleball-intro";
import { getOgImageUrl } from "@/lib/seo";
import {
  getPickleballJsonLd,
  PICKLEBALL_META,
  PICKLEBALL_PATH,
} from "@/lib/pickleball-seo";

export const metadata: Metadata = {
  title: { absolute: PICKLEBALL_META.title },
  description: PICKLEBALL_META.description,
  keywords: [...PICKLEBALL_META.keywords],
  alternates: {
    canonical: PICKLEBALL_PATH,
    languages: { ko: PICKLEBALL_PATH },
  },
  openGraph: {
    title: PICKLEBALL_META.title,
    description: PICKLEBALL_META.description,
    url: PICKLEBALL_PATH,
    type: "article",
    locale: "ko_KR",
    images: [{ url: getOgImageUrl(), width: 1200, height: 630, alt: PICKLEBALL_META.title }],
  },
  twitter: {
    card: "summary_large_image",
    title: PICKLEBALL_META.title,
    description: PICKLEBALL_META.description,
    images: [getOgImageUrl()],
  },
};

export default function PickleballPage() {
  return (
    <>
      <JsonLd data={getPickleballJsonLd()} />
      <PickleballIntro />
    </>
  );
}
