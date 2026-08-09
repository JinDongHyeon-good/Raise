import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SajuFeature } from "@/components/saju/saju-feature";
import type { AppLocale } from "@/i18n/routing";
import { getServiceKeywords } from "@/lib/brand";
import { getOgImageUrl } from "@/lib/seo";
import { buildLanguageAlternates, getOpenGraphLocale, getSeoCopy, localizedSeoPath } from "@/lib/seo-i18n";

const PATH = "/dashboard/saju";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const appLocale = locale as AppLocale;
  const t = await getTranslations({ locale, namespace: "sajuApp" });
  const copy = getSeoCopy(appLocale);

  const title = t("natal.metaTitle");
  const description =
    appLocale === "ko"
      ? "생년월일시로 사주팔자를 세우고 AI 사주 풀이로 성격·재물·직업·인연을 무료로 확인해 보세요."
      : t("natal.subtitle");
  const path = localizedSeoPath(PATH, appLocale);

  return {
    title: { absolute: title },
    description,
    keywords: [...getServiceKeywords(appLocale), "사주팔자", "사주풀이", "무료사주", "AI 사주"],
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

export default function NatalSajuPage() {
  return <SajuFeature kind="natal" />;
}
