"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { MARKETS, type Market } from "@/lib/markets";

export function MarketTabs({ value, onChange }: { value: Market; onChange: (market: Market) => void }) {
  const t = useTranslations("chart");
  const activeIndex = Math.max(0, MARKETS.findIndex((m) => m.value === value));
  const [pressed, setPressed] = useState<Market | null>(null);
  const count = MARKETS.length;

  const labels: Record<Market, string> = {
    crypto: t("market.crypto"),
    us: t("market.us"),
    kr: t("market.kr"),
    usStock: t("market.usStock"),
  };

  return (
    <div
      role="tablist"
      aria-label={t("marketTabs")}
      className="relative grid w-full rounded-xl border border-[var(--rz-line)] bg-[var(--rz-panel)] p-1"
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-1 left-1 rounded-lg bg-[var(--rz-accent)] shadow-[0_6px_16px_rgb(225_29_72_/_0.28)] transition-[transform,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          width: `calc((100% - 8px) / ${count})`,
          transform: `translateX(calc(${activeIndex} * 100%))`,
        }}
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
            className={`rz-tab-press relative z-10 rounded-lg px-1 py-2.5 text-center text-[11px] font-semibold leading-none tracking-tight transition-colors duration-200 sm:px-2 sm:text-[13px] ${
              active ? "text-[var(--rz-accent-fg)]" : "text-[var(--rz-muted)] hover:text-[var(--rz-text)]"
            } ${pressed === m.value ? "rz-tab-pressed" : ""}`}
          >
            <span className="block whitespace-nowrap">{labels[m.value]}</span>
          </button>
        );
      })}
    </div>
  );
}
