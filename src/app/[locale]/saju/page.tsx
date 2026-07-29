import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { JsonLd } from "@/components/seo/json-ld";
import { SajuIntro } from "@/components/saju/saju-intro";
import type { AppLocale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import { getOgImageUrl } from "@/lib/seo";
import { getSajuJsonLd, SAJU_META, SAJU_PATH } from "@/lib/saju-seo";
import {
  buildLanguageAlternates,
  getOpenGraphLocale,
  getSeoCopy,
  localizedSeoPath,
} from "@/lib/seo-i18n";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const appLocale = locale as AppLocale;
  const copy = getSeoCopy(appLocale);

  // 한국어는 사주 소개 전용 카피, 그 외 로케일은 로케일별 가이드 카피를 쓴다.
  const title = appLocale === "ko" ? SAJU_META.title : copy.guidesMetaTitle;
  const description = appLocale === "ko" ? SAJU_META.description : copy.guidesMetaDescription;
  const path = localizedSeoPath(SAJU_PATH, appLocale);

  return {
    title: { absolute: title },
    description,
    keywords: [...SAJU_META.keywords],
    alternates: {
      canonical: path,
      languages: buildLanguageAlternates(SAJU_PATH),
    },
    openGraph: {
      title,
      description,
      url: path,
      siteName: copy.siteName,
      type: "article",
      locale: getOpenGraphLocale(appLocale),
      images: [{ url: getOgImageUrl(), width: 1200, height: 630, alt: copy.ogAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [getOgImageUrl()],
    },
  };
}

export default async function SajuPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <JsonLd data={getSajuJsonLd()} />
      <SajuIntro />
    </>
  );
}
