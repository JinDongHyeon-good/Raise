import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import RaiseHome from "@/components/raise/raise-home";
import { HomeCommunityPreview } from "@/components/community/home-community-preview";
import { JsonLd } from "@/components/seo/json-ld";
import { routing } from "@/i18n/routing";
import { buildHomePageMetadata, getHomeJsonLd } from "@/lib/seo";
import { toRoutedLocale } from "@/lib/seo-i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

// 최신 커뮤니티 글을 10분마다 다시 그린다
export const revalidate = 600;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildHomePageMetadata(toRoutedLocale(locale));
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <JsonLd data={getHomeJsonLd(toRoutedLocale(locale))} />
      <RaiseHome>
        <HomeCommunityPreview locale={toRoutedLocale(locale) === "en" ? "en" : "ko"} />
      </RaiseHome>
    </>
  );
}
