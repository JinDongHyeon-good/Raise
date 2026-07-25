import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DashboardBoardClient } from "@/components/board/dashboard-board-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("board");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default function DashboardBoardPage() {
  return <DashboardBoardClient />;
}
