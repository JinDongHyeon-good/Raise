import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DashboardHome } from "@/components/dashboard/dashboard-home";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default function DashboardPage() {
  return <DashboardHome />;
}
