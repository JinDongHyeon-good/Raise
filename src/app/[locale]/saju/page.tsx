import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { SajuIntro } from "@/components/saju/saju-intro";
import { getOgImageUrl } from "@/lib/seo";
import { getSajuJsonLd, SAJU_META, SAJU_PATH } from "@/lib/saju-seo";

export const metadata: Metadata = {
  title: { absolute: SAJU_META.title },
  description: SAJU_META.description,
  keywords: [...SAJU_META.keywords],
  alternates: {
    canonical: SAJU_PATH,
    languages: { ko: SAJU_PATH },
  },
  openGraph: {
    title: SAJU_META.title,
    description: SAJU_META.description,
    url: SAJU_PATH,
    type: "article",
    locale: "ko_KR",
    images: [{ url: getOgImageUrl(), width: 1200, height: 630, alt: SAJU_META.title }],
  },
  twitter: {
    card: "summary_large_image",
    title: SAJU_META.title,
    description: SAJU_META.description,
    images: [getOgImageUrl()],
  },
};

export default function SajuPage() {
  return (
    <>
      <JsonLd data={getSajuJsonLd()} />
      <SajuIntro />
    </>
  );
}
