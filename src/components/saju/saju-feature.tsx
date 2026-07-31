"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Sparkles, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/site/app-shell";
import { SajuBirthForm, emptyBirthValue, type BirthValue } from "@/components/saju/saju-birth-form";
import { SajuChartView } from "@/components/saju/saju-chart-view";
import { SajuMarkdown } from "@/components/saju/saju-markdown";
import type { ClientChart } from "@/lib/saju/types";
import type { AppLocale } from "@/i18n/routing";

type Kind = "daily" | "natal" | "compatibility";

type ApiResult = {
  kind: Kind;
  reading: string;
  model?: string;
  chart?: ClientChart;
  today?: string;
  chartA?: ClientChart;
  chartB?: ClientChart;
};

function toPayloadPerson(v: BirthValue) {
  return {
    name: v.name.trim() || undefined,
    gender: v.gender,
    year: Number(v.year),
    month: Number(v.month),
    day: Number(v.day),
    calendar: v.calendar,
    isLeapMonth: v.isLeapMonth,
    timeKnown: v.timeKnown,
    hour: v.timeKnown ? Number(v.hour) : undefined,
    minute: v.timeKnown ? Number(v.minute || 0) : undefined,
  };
}

function isComplete(v: BirthValue) {
  if (!v.year || !v.month || !v.day) return false;
  if (v.timeKnown && v.hour === "") return false;
  return true;
}

export function SajuFeature({ kind }: { kind: Kind }) {
  const t = useTranslations("sajuApp");
  const locale = useLocale() as AppLocale;

  const [personA, setPersonA] = useState<BirthValue>(emptyBirthValue);
  const [personB, setPersonB] = useState<BirthValue>({ ...emptyBirthValue });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);

  const isCompat = kind === "compatibility";
  const canSubmit = isComplete(personA) && (!isCompat || isComplete(personB));

  const submit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const body: Record<string, unknown> = { kind, locale };
    if (isCompat) {
      body.personA = toPayloadPerson(personA);
      body.personB = toPayloadPerson(personB);
    } else {
      body.person = toPayloadPerson(personA);
    }

    try {
      const res = await fetch("/api/ai/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : t("errors.generic"));
        return;
      }
      setResult(data as ApiResult);
      if (typeof window !== "undefined") {
        requestAnimationFrame(() => {
          document.getElementById("saju-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    } catch {
      setError(t("errors.network"));
    } finally {
      setLoading(false);
    }
  };

  const navKey = kind === "daily" ? "today" : kind === "natal" ? "natal" : "gunghap";
  const appPath =
    kind === "daily" ? "/dashboard/today" : kind === "natal" ? "/dashboard/saju" : "/dashboard/gunghap";

  return (
    <AppShell active={navKey} nextPath={appPath}>
      <div className="piclick-container py-8 sm:py-10">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <h1 className="font-brand-display text-3xl font-bold tracking-tight text-[var(--piclick-green-deep)] sm:text-4xl">
              {t(`${kind}.title`)}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--piclick-ink-muted)] sm:text-base">
              {t(`${kind}.subtitle`)}
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-[var(--piclick-line)] bg-white p-5 shadow-[0_18px_40px_-28px_rgb(42_33_80_/0.5)] sm:p-6">
            {isCompat ? (
              <div className="space-y-6">
                <div>
                  <p className="mb-3 text-sm font-semibold text-[var(--piclick-green-deep)]">{t("form.personA")}</p>
                  <SajuBirthForm value={personA} onChange={setPersonA} />
                </div>
                <div className="border-t border-[var(--piclick-line)] pt-6">
                  <p className="mb-3 text-sm font-semibold text-[var(--piclick-green-deep)]">{t("form.personB")}</p>
                  <SajuBirthForm value={personB} onChange={setPersonB} />
                </div>
              </div>
            ) : (
              <SajuBirthForm value={personA} onChange={setPersonA} />
            )}

            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit || loading}
              className="pk-btn pk-btn-lg pk-btn-primary mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? t("result.loading") : t(`${kind}.cta`)}
            </button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-[var(--piclick-ink-muted)]">
              {t("disclaimer")}
            </p>
          </div>

          {error ? (
            <div className="mt-5 rounded-xl border border-[#c0483f]/25 bg-[#c0483f]/5 p-4 text-sm text-[#a53d35]">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-[var(--piclick-line)] bg-white p-10 text-center">
              <span className="relative flex h-10 w-10">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--piclick-gold)]/40" />
                <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--piclick-green)] text-white">
                  <Sparkles className="h-5 w-5" aria-hidden />
                </span>
              </span>
              <p className="text-sm font-medium text-[var(--piclick-green-deep)]">{t("result.loading")}</p>
              <p className="text-xs text-[var(--piclick-ink-muted)]">{t("result.loadingSub")}</p>
            </div>
          ) : null}
        </div>

        {result && !loading ? (
          <motion.div
            id="saju-result"
            className="mx-auto mt-8 max-w-2xl scroll-mt-20 space-y-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {isCompat ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {result.chartA ? <SajuChartView chart={result.chartA} name={personA.name.trim() || t("form.personA")} /> : null}
                {result.chartB ? <SajuChartView chart={result.chartB} name={personB.name.trim() || t("form.personB")} /> : null}
              </div>
            ) : result.chart ? (
              <SajuChartView chart={result.chart} name={personA.name.trim() || undefined} />
            ) : null}

            <div className="rounded-2xl border border-[var(--piclick-line)] bg-white p-5 sm:p-7">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--piclick-green-deep)]">
                  <Sparkles className="h-4 w-4 text-[var(--piclick-gold)]" aria-hidden />
                  {t("result.readingTitle")}
                </h2>
                <button
                  type="button"
                  onClick={submit}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--piclick-line)] px-3 py-1.5 text-xs font-medium text-[var(--piclick-ink-muted)] transition hover:border-[var(--piclick-green)]/40 hover:text-[var(--piclick-green-deep)]"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  {t("result.regenerate")}
                </button>
              </div>
              <SajuMarkdown text={result.reading} />
              <p className="mt-6 border-t border-[var(--piclick-line)] pt-4 text-[11px] text-[var(--piclick-ink-muted)]">
                {t("disclaimer")}
              </p>
            </div>
          </motion.div>
        ) : null}
      </div>
    </AppShell>
  );
}
