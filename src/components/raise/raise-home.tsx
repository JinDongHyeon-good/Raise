"use client";

import { useState } from "react";
import { CoinTickerStrip } from "@/components/raise/coin-ticker-strip";
import { MarketTabs } from "@/components/raise/market-tabs";
import { RaiseFooter, RaiseHeader } from "@/components/raise/raise-chrome";
import { VideoSection } from "@/components/raise/video-section";
import { useMarketTickers } from "@/hooks/use-market-tickers";
import { ASSETS, type Asset, type Market } from "@/lib/markets";
import { SERVICE_NAME } from "@/lib/brand";

export default function RaiseHome() {
  const [market, setMarket] = useState<Market>("crypto");
  const [coin, setCoin] = useState<Asset>(ASSETS.crypto[0]);
  const tickers = useMarketTickers(market);
  const changeMarket = (next: Market) => {
    setMarket(next);
    setCoin(ASSETS[next][0]);
  };

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
        <h1 className="sr-only">{SERVICE_NAME} — 코인·주식 유튜브 AI 요약 · 투자 커뮤니티</h1>

        <header className="space-y-1.5">
          <h2 className="font-[family-name:var(--font-brand-display)] text-xl font-semibold tracking-tight sm:text-2xl">
            {coin.name} 관련 영상
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-[var(--rz-muted)]">
            {market === "us"
              ? "나스닥·S&P500 등 미국 증시 전망 유튜브를 모으고, 긴 영상은 AI가 핵심만 요약해 줍니다."
              : "최신·인기 코인 유튜브를 모으고, 긴 영상은 AI가 핵심만 요약해 줍니다."}
          </p>
        </header>

        <VideoSection coinName={coin.name} hideTitle />
      </main>

      <RaiseFooter />
    </div>
  );
}
