import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SajuFeature } from "@/components/saju/saju-feature";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sajuApp");
  return {
    title: { absolute: t("compatibility.metaTitle") },
    description: t("compatibility.subtitle"),
    alternates: { canonical: "/dashboard/gunghap", languages: { ko: "/dashboard/gunghap" } },
    robots: { index: false, follow: false },
  };
}

export default function GunghapPage() {
  return <SajuFeature kind="compatibility" />;
}
