"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { StatusScreen } from "@/components/raise/status-screen";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return <StatusScreen code="500" title={t("errorTitle")} body={t("errorBody")} onRetry={reset} />;
}
