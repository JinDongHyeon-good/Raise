"use client";

import { useTranslations } from "next-intl";
import { StatusScreen } from "@/components/raise/status-screen";

export default function NotFound() {
  const t = useTranslations("common");
  return <StatusScreen code="404" title={t("notFoundTitle")} body={t("notFoundBody")} />;
}
