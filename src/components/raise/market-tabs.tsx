"use client";

import { MARKETS, type Market } from "@/lib/markets";

export function MarketTabs({ value, onChange }: { value: Market; onChange: (market: Market) => void }) {
  return (
    <div role="tablist" aria-label="시장" className="flex rounded-xl border border-[var(--rz-line)] bg-[var(--rz-panel)] p-0.5 text-xs">
      {MARKETS.map((m) => (
        <button
          key={m.value}
          type="button"
          role="tab"
          aria-selected={value === m.value}
          onClick={() => onChange(m.value)}
          className={`rounded-lg px-3.5 py-2 transition sm:py-1.5 ${
            value === m.value ? "bg-[var(--rz-panel-2)] font-medium text-[var(--rz-text)]" : "text-[var(--rz-muted)] hover:text-[var(--rz-text)]"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
