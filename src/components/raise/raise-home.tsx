"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { CoinTickerStrip } from "@/components/raise/coin-ticker-strip";
import { MarketTabs } from "@/components/raise/market-tabs";
import { RaiseFooter, RaiseHeader } from "@/components/raise/raise-chrome";
import { VideoSection } from "@/components/raise/video-section";
import { useMarketTickers } from "@/hooks/use-market-tickers";
import { ASSETS, type Asset, type Market } from "@/lib/markets";
import type { AppLocale } from "@/i18n/routing";
import { getLocalizedBrandName } from "@/lib/brand";

export default function RaiseHome() {
  const t = useTranslations("home");
  const tChart = useTranslations("chart");
  const locale = useLocale();
  const serviceName = getLocalizedBrandName(locale as AppLocale);
  const [market, setMarket] = useState<Market>("crypto");
  const [coin, setCoin] = useState<Asset>(ASSETS.crypto[0]);
  const tickers = useMarketTickers(market);
  const changeMarket = (next: Market) => {
    setMarket(next);
    setCoin(ASSETS[next][0]);
  };
  const marketTabLabel =
    market === "crypto"
      ? tChart("market.crypto")
      : market === "us"
        ? tChart("market.us")
        : market === "kr"
          ? tChart("market.kr")
          : tChart("market.usStock");

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

        <header className="space-y-1.5">
          <h2 className="font-[family-name:var(--font-brand-display)] text-xl font-semibold tracking-tight sm:text-2xl">
            {t("relatedVideos", { name: marketTabLabel })}
          </h2>
        </header>

        <VideoSection coinName={coin.name} coinNameEn={coin.nameEn} hideTitle />
      </main>

      <RaiseFooter />
    </div>
  );
}
