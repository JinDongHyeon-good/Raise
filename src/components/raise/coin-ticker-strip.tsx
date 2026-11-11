"use client";

import { useLocale } from "next-intl";
import { PriceText } from "@/components/raise/candle-chart";
import { ScrollArrows, useHScroll } from "@/components/raise/scroll-arrows";
import { localizedName, type Coin, type Ticker } from "@/lib/coins";

type Props = {
  coins: Coin[];
  selected: Coin;
  tickers: Record<string, Ticker>;
  onSelect: (coin: Coin) => void;
  /** 목록 위에 붙일 도구줄 (예: 코인/미국증시 탭) */
  toolbar?: React.ReactNode;
};

export function CoinTickerStrip({ coins, selected, tickers, onSelect, toolbar }: Props) {
  const locale = useLocale();
  const { setNode: rowRef, update: onRowScroll, edge: rowEdge, slide: slideRow } = useHScroll([coins]);
  return (
    <div className="bg-[var(--rz-bg-elevated)]">
      <div className="rz-container">
        {toolbar ? <div className="w-full pt-3">{toolbar}</div> : null}
        <div className="relative">
        <div
          ref={rowRef}
          onScroll={onRowScroll}
          className="-mx-4 flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
          {coins.map((c) => {
            const t = tickers[c.symbol];
            const active = c.symbol === selected.symbol;
            return (
              <button
                key={c.symbol}
                type="button"
                onClick={() => onSelect(c)}
                className={`flex min-w-[148px] shrink-0 flex-col items-start rounded-xl border px-3.5 py-2.5 text-left transition sm:min-w-0 ${
                  active
                    ? "border-[var(--rz-accent)]/50 bg-[var(--rz-accent-soft)] shadow-[inset_0_0_0_1px_rgb(225_29_72_/_0.18)]"
                    : "border-[var(--rz-line)] bg-[var(--rz-panel)] hover:border-[var(--rz-line-strong)] hover:bg-[var(--rz-panel-2)]"
                }`}
              >
                <span className="text-[11px] tracking-wide text-[var(--rz-muted)]">
                  <b className="font-semibold text-[var(--rz-text)]">{c.ticker}</b>
                  <span className="ml-1.5">{localizedName(c, locale)}</span>
                </span>
                <span className="mt-1 whitespace-nowrap font-mono text-[15px] tabular-nums tracking-tight">
                  {t ? <PriceText value={t.price} currency={c.currency} locale={locale} unitClassName="text-[11px]" /> : "—"}
                </span>
                <span
                  className={`mt-0.5 font-mono text-[11px] tabular-nums ${
                    t ? (t.change24h >= 0 ? "text-[var(--rz-up)]" : "text-[var(--rz-down)]") : "text-[var(--rz-muted)]"
                  }`}
                >
                  {t ? `${t.change24h >= 0 ? "+" : ""}${t.change24h.toFixed(2)}%` : "\u00a0"}
                </span>
              </button>
            );
          })}
        </div>
        <ScrollArrows edge={rowEdge} onSlide={slideRow} />
        </div>
      </div>
    </div>
  );
}
