import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SajuFeature } from "@/components/saju/saju-feature";
import type { AppLocale } from "@/i18n/routing";
import { getServiceKeywords } from "@/lib/brand";
import { getOgImageUrl } from "@/lib/seo";
import { buildLanguageAlternates, getOpenGraphLocale, getSeoCopy, localizedSeoPath } from "@/lib/seo-i18n";

const PATH = "/dashboard/gunghap";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const appLocale = locale as AppLocale;
  const t = await getTranslations({ locale, namespace: "sajuApp" });
  const copy = getSeoCopy(appLocale);

  const title = t("compatibility.metaTitle");
  const description =
    appLocale === "ko"
      ? "두 사람의 생년월일시로 궁합 사주를 AI가 무료로 풀어 드립니다. 연애·결혼 궁합과 종합 점수를 확인하세요."
      : t("compatibility.subtitle");
  const path = localizedSeoPath(PATH, appLocale);

  return {
    title: { absolute: title },
    description,
    keywords: [...getServiceKeywords(appLocale), "궁합", "궁합 사주", "연애 궁합", "결혼 궁합", "AI 사주"],
    alternates: {
      canonical: path,
      languages: buildLanguageAlternates(PATH),
    },
    openGraph: {
      title,
      description,
      url: path,
      siteName: copy.siteName,
      type: "website",
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

export default function GunghapPage() {
  return <SajuFeature kind="compatibility" />;
}
