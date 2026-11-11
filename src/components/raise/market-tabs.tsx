"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { MARKETS, type Market } from "@/lib/markets";

export function MarketTabs({ value, onChange }: { value: Market; onChange: (market: Market) => void }) {
  const t = useTranslations("chart");
  const activeIndex = Math.max(0, MARKETS.findIndex((m) => m.value === value));
  const [pressed, setPressed] = useState<Market | null>(null);

  return (
    <div
      role="tablist"
      aria-label={t("marketTabs")}
      className="relative grid w-full grid-cols-2 rounded-xl border border-[var(--rz-line)] bg-[var(--rz-panel)] p-1 sm:w-[240px]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg bg-[var(--rz-accent)] shadow-[0_6px_16px_rgb(225_29_72_/_0.28)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateX(calc(${activeIndex} * 100% + ${activeIndex * 4}px))` }}
      />
      {MARKETS.map((m) => {
        const active = value === m.value;
        return (
          <button
            key={m.value}
            type="button"
            role="tab"
            aria-selected={active}
            onPointerDown={() => setPressed(m.value)}
            onPointerUp={() => setPressed(null)}
            onPointerLeave={() => setPressed(null)}
            onClick={() => onChange(m.value)}
            className={`rz-tab-press relative z-10 rounded-lg px-3 py-2.5 text-sm font-semibold tracking-tight transition-colors duration-200 ${
              active ? "text-[var(--rz-accent-fg)]" : "text-[var(--rz-muted)] hover:text-[var(--rz-text)]"
            } ${pressed === m.value ? "rz-tab-pressed" : ""}`}
          >
            {t(`market.${m.value}`)}
          </button>
        );
      })}
    </div>
  );
}
