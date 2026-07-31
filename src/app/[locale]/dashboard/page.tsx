import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DashboardHome } from "@/components/dashboard/dashboard-home";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return {
    title: { absolute: t("metaTitle") },
    description: t("metaDescription"),
    alternates: {
      canonical: "/dashboard",
      languages: { ko: "/dashboard" },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: "/dashboard",
      type: "website",
      locale: "ko_KR",
    },
  };
}

export default function DashboardPage() {
  return <DashboardHome />;
}
