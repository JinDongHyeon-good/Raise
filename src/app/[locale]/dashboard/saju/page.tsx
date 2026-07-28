import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SajuFeature } from "@/components/saju/saju-feature";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sajuApp");
  return {
    title: t("natal.metaTitle"),
    description: t("natal.subtitle"),
    alternates: { canonical: "/dashboard/saju", languages: { ko: "/dashboard/saju" } },
    robots: { index: false, follow: false },
  };
}

export default function NatalSajuPage() {
  return <SajuFeature kind="natal" />;
}
