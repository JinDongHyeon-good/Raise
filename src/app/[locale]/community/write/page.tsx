import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { PostWrite } from "@/components/community/post-write";
import { RaisePageShell } from "@/components/raise/raise-chrome";
import { toRoutedLocale } from "@/lib/seo-i18n";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = toRoutedLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "seo.pages.communityWrite" });
  return {
    title: t("title"),
    robots: { index: false, follow: false },
  };
}

export default async function CommunityWritePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <RaisePageShell plain>
      <Suspense>
        <PostWrite />
      </Suspense>
    </RaisePageShell>
  );
}
