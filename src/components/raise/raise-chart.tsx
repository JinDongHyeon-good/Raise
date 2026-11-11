"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { CandleChart, PriceText, formatQuote, type Candle } from "@/components/raise/candle-chart";
import { BybitInlinePromo } from "@/components/raise/bybit-inline-promo";
import { CoinTickerStrip } from "@/components/raise/coin-ticker-strip";
import { MarketTabs } from "@/components/raise/market-tabs";
import { RaiseFooter, RaiseHeader } from "@/components/raise/raise-chrome";
import { useMarketTickers } from "@/hooks/use-market-tickers";
import { INTERVALS, formatTurnover } from "@/lib/coins";
import { ASSETS, isYahooMarket, klineUrl, localizedLabel, localizedName, type Asset, type Market } from "@/lib/markets";
import type { AppLocale } from "@/i18n/routing";
import { getLocalizedBrandName } from "@/lib/brand";

export default function RaiseChart() {
  const t = useTranslations("chart");
  const locale = useLocale();
  const serviceName = getLocalizedBrandName(locale as AppLocale);
  const [market, setMarket] = useState<Market>("crypto");
  const [coin, setCoin] = useState<Asset>(ASSETS.crypto[0]);
  const [interval, setInterval_] = useState("60");
  const tickers = useMarketTickers(market);
  const changeMarket = (next: Market) => {
    setMarket(next);
    setCoin(ASSETS[next][0]);
  };
  const [chart, setChart] = useState<{ key: string; candles: Candle[]; error: string | null }>({
    key: "",
    candles: [],
    error: null,
  });

  const chartKey = `${coin.symbol}:${interval}`;
  useEffect(() => {
    let alive = true;
    const key = `${coin.symbol}:${interval}`;
    const loadError = t("loadFailed");
    const load = async (initial: boolean) => {
      try {
        const res = await fetch(klineUrl(coin, interval), { headers: { "x-ui-locale": locale } });
        const data = (await res.json()) as { candles?: Candle[]; error?: string };
        if (!alive) return;
        if (data.candles) {
          setChart({ key, candles: data.candles, error: null });
        } else if (initial) {
          setChart((prev) => ({ key, candles: prev.candles, error: data.error ?? loadError }));
        }
      } catch {
        if (alive && initial) setChart((prev) => ({ key, candles: prev.candles, error: loadError }));
      }
    };
    void load(true);
    const id = window.setInterval(() => load(false), 30_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [coin, interval, locale, t]);

  const ticker = tickers[coin.symbol];
  const candles = chart.candles;
  const chartLoading = chart.key !== chartKey;
  const chartError = chartLoading ? null : chart.error;

  return (
    <div className="raise-app min-h-dvh bg-[var(--rz-bg)] text-[var(--rz-text)]">
      <RaiseHeader />
      <CoinTickerStrip
        coins={ASSETS[market]}
        selected={coin}
        tickers={tickers}
        onSelect={(c) => setCoin(ASSETS[market].find((a) => a.symbol === c.symbol) ?? ASSETS[market][0])}
        toolbar={<MarketTabs value={market} onChange={changeMarket} />}
      />

      <main className="rz-container space-y-5 py-5 sm:py-7">
        <h1 className="sr-only">{t("srTitle", { brand: serviceName })}</h1>

        <section className="overflow-hidden rounded-2xl border border-[var(--rz-line)] bg-[var(--rz-panel)] shadow-[var(--rz-shadow)]">
          <div className="flex flex-col gap-4 border-b border-[var(--rz-line)] px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
            <div className="min-w-0">
              <p className="text-xs tracking-wide text-[var(--rz-muted)]">
                {coin.market === "crypto" ? (
                  <>
                    {localizedName(coin, locale)} <span className="font-mono">{localizedLabel(coin, locale)}</span>
                  </>
                ) : coin.market === "us" ? (
                  localizedLabel(coin, locale)
                ) : (
                  <>
                    {localizedName(coin, locale)} <span className="font-mono">{coin.ticker}</span>
                  </>
                )}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
                  {ticker ? <PriceText value={ticker.price} currency={coin.currency} locale={locale} unitClassName="text-sm sm:text-base" /> : "—"}
                </span>
                {ticker ? (
                  <span
                    className={`font-mono text-sm tabular-nums ${ticker.change24h >= 0 ? "text-[var(--rz-up)]" : "text-[var(--rz-down)]"}`}
                  >
                    {ticker.change24h >= 0 ? "▲" : "▼"} {Math.abs(ticker.change24h).toFixed(2)}%
                  </span>
                ) : null}
              </div>
              {ticker ? (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-[var(--rz-muted)] sm:text-xs">
                  <span>
                    {t("high")} {formatQuote(ticker.high24h, coin.currency, locale)}
                  </span>
                  <span>
                    {t("low")} {formatQuote(ticker.low24h, coin.currency, locale)}
                  </span>
                  {ticker.turnover24h !== undefined ? (
                    <span>
                      {t("turnover")} {formatTurnover(ticker.turnover24h)}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="-mx-1 flex max-w-full overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex shrink-0 rounded-xl border border-[var(--rz-line)] bg-[var(--rz-bg)]/40 p-0.5 text-xs">
                {INTERVALS.map((iv) => (
                  <button
                    key={iv.value}
                    type="button"
                    onClick={() => setInterval_(iv.value)}
                    className={`rounded-lg px-3 py-2 transition sm:px-2.5 sm:py-1.5 ${
                      interval === iv.value
                        ? "bg-[var(--rz-panel-2)] font-medium text-[var(--rz-text)]"
                        : "text-[var(--rz-muted)] hover:text-[var(--rz-text)]"
                    }`}
                  >
                    {t(`interval.${iv.key}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-5">
            {chartError ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-[var(--rz-down)] sm:h-[300px]">
                {chartError}
              </div>
            ) : chartLoading && candles.length === 0 ? (
              <div className="h-[260px] animate-pulse rounded-xl bg-[var(--rz-panel-2)] sm:h-[400px]" />
            ) : (
              <div className={chartLoading ? "opacity-50 transition" : "transition"}>
                <CandleChart candles={candles} interval={interval} currency={coin.currency} />
              </div>
            )}
            <p className="mt-2 text-right text-[11px] text-[var(--rz-muted)]">
              {isYahooMarket(coin.market) ? t("sourceUs") : t("sourceCrypto")}
            </p>
          </div>
        </section>

        <BybitInlinePromo />
      </main>

      <RaiseFooter />
    </div>
  );
}
