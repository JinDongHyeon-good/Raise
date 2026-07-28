"use client";

import { useTranslations } from "next-intl";
import { ELEMENT_COLORS, type Element } from "@/lib/saju/constants";
import type { ClientChart } from "@/lib/saju/types";
import type { Pillar } from "@/lib/saju/engine";

const ELEMENT_ORDER: Element[] = ["목", "화", "토", "금", "수"];

function PillarCard({ label, pillar }: { label: string; pillar: Pillar | null }) {
  if (!pillar) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-[var(--piclick-line)] bg-white/60 px-2 py-3">
        <span className="text-[11px] font-medium text-[var(--piclick-ink-muted)]">{label}</span>
        <span className="mt-2 text-xs text-[var(--piclick-ink-muted)]">-</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-[var(--piclick-line)] bg-white px-2 py-3">
      <span className="text-[11px] font-medium text-[var(--piclick-ink-muted)]">{label}</span>
      <span
        className="mt-1 flex h-11 w-11 items-center justify-center rounded-lg text-2xl font-bold text-white"
        style={{ backgroundColor: ELEMENT_COLORS[pillar.element] }}
        aria-hidden
      >
        {pillar.stemHanja}
      </span>
      <span
        className="flex h-11 w-11 items-center justify-center rounded-lg text-2xl font-bold text-white"
        style={{ backgroundColor: ELEMENT_COLORS[pillar.branchElement] }}
        aria-hidden
      >
        {pillar.branchHanja}
      </span>
      <span className="mt-1 text-xs font-medium text-[var(--piclick-ink)]">{pillar.ganjiKo}</span>
      <span className="text-[10px] text-[var(--piclick-ink-muted)]">
        {pillar.label === "일주" ? "일간" : pillar.stemTenGod} · {pillar.branchTenGod}
      </span>
    </div>
  );
}

export function SajuChartView({ chart, name }: { chart: ClientChart; name?: string }) {
  const t = useTranslations("sajuApp");
  const total = ELEMENT_ORDER.reduce((sum, e) => sum + chart.elementCounts[e], 0) || 1;

  const timeStr = chart.timeKnown
    ? ` ${String(chart.solar.hour).padStart(2, "0")}:${String(chart.solar.minute).padStart(2, "0")}`
    : "";

  return (
    <div className="rounded-2xl border border-[var(--piclick-line)] bg-[var(--piclick-beige)]/50 p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-bold text-[var(--piclick-green-deep)]">
          {name ? `${name} · ` : ""}
          {t("result.chartTitle")}
        </h3>
        <span className="text-xs text-[var(--piclick-ink-muted)]">
          {chart.calendar === "lunar" ? "음력→양력 " : "양력 "}
          {chart.solar.year}.{String(chart.solar.month).padStart(2, "0")}.
          {String(chart.solar.day).padStart(2, "0")}
          {timeStr}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <PillarCard label={t("pillars.year")} pillar={chart.pillars.year} />
        <PillarCard label={t("pillars.month")} pillar={chart.pillars.month} />
        <PillarCard label={t("pillars.day")} pillar={chart.pillars.day} />
        <PillarCard label={chart.timeKnown ? t("pillars.hour") : t("pillars.hourUnknown")} pillar={chart.pillars.hour} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--piclick-ink)]">
        <span>
          <span className="text-[var(--piclick-ink-muted)]">{t("result.dayMaster")}:</span>{" "}
          <b className="text-[var(--piclick-green-deep)]">
            {chart.dayMaster.hanja}
            {chart.dayMaster.ko}
          </b>{" "}
          ({chart.dayMaster.element}·{chart.dayMaster.yinYang})
        </span>
        <span>
          <span className="text-[var(--piclick-ink-muted)]">{t("result.zodiac")}:</span>{" "}
          <b className="text-[var(--piclick-green-deep)]">{chart.zodiac}띠</b>
        </span>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium text-[var(--piclick-ink-muted)]">{t("result.elements")}</p>
        <div className="space-y-1.5">
          {ELEMENT_ORDER.map((e) => {
            const count = chart.elementCounts[e];
            const pct = Math.round((count / total) * 100);
            return (
              <div key={e} className="flex items-center gap-2">
                <span className="w-5 text-xs font-semibold" style={{ color: ELEMENT_COLORS[e] }}>
                  {e}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--piclick-beige)]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: ELEMENT_COLORS[e] }}
                  />
                </div>
                <span className="w-6 text-right text-[11px] tabular-nums text-[var(--piclick-ink-muted)]">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
