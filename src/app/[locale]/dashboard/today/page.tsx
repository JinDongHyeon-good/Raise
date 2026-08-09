import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SajuFeature } from "@/components/saju/saju-feature";
import type { AppLocale } from "@/i18n/routing";
import { getServiceKeywords } from "@/lib/brand";
import { getOgImageUrl } from "@/lib/seo";
import { buildLanguageAlternates, getOpenGraphLocale, getSeoCopy, localizedSeoPath } from "@/lib/seo-i18n";

const PATH = "/dashboard/today";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const appLocale = locale as AppLocale;
  const t = await getTranslations({ locale, namespace: "sajuApp" });
  const copy = getSeoCopy(appLocale);

  const title = t("daily.metaTitle");
  const description =
    appLocale === "ko"
      ? "생년월일시를 입력하면 AI가 정통 명리로 오늘의 운세를 무료로 풀어 드립니다. 총운·재물운·애정운·건강운을 매일 확인해 보세요."
      : t("daily.subtitle");
  const path = localizedSeoPath(PATH, appLocale);

  return {
    title: { absolute: title },
    description,
    keywords: [...getServiceKeywords(appLocale), "오늘의 운세", "무료 오늘의운세", "일진", "AI 사주"],
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

export default function DailyFortunePage() {
  return <SajuFeature kind="daily" />;
}
