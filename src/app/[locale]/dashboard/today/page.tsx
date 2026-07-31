import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SajuFeature } from "@/components/saju/saju-feature";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sajuApp");
  return {
    title: { absolute: t("daily.metaTitle") },
    description: t("daily.subtitle"),
    alternates: { canonical: "/dashboard/today", languages: { ko: "/dashboard/today" } },
    robots: { index: false, follow: false },
  };
}

export default function DailyFortunePage() {
  return <SajuFeature kind="daily" />;
}
