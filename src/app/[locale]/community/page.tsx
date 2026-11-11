import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getLocalizedBrandName } from "@/lib/brand";
import { buildPageMetadata } from "@/lib/seo";
import { toRoutedLocale } from "@/lib/seo-i18n";
import { Suspense } from "react";
import { CommunityList } from "@/components/community/community-list";
import { RaisePageShell } from "@/components/raise/raise-chrome";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = toRoutedLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "seo.pages.community" });
  return buildPageMetadata({
    locale,
    title: t("title"),
    description: t("description", { brand: getLocalizedBrandName(locale) }),
    path: "/community",
    image: "/og-community.png",
  });
}

export default async function CommunityPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <RaisePageShell plain>
      <Suspense>
        <CommunityList />
      </Suspense>
    </RaisePageShell>
  );
}
