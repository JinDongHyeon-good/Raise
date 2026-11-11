"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

export type Candle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const W = 1000;
const H = 420;
const PAD_R = 78;
const PAD_T = 12;
const PRICE_H = 320;
const VOL_TOP = 340;
const VOL_H = 64;

export type PriceCurrency = "KRW" | "USD" | undefined;

/** 숫자만 (차트 축·OHLC). 원화는 소수점 없이, 달러 주식은 소수 둘째 자리까지 */
export function formatPrice(value: number, currency?: PriceCurrency) {
  if (!Number.isFinite(value)) return "-";
  if (currency === "KRW") return Math.round(value).toLocaleString("en-US");
  if (currency === "USD") return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const abs = Math.abs(value);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 3 : abs >= 0.01 ? 5 : 8;
  return value.toLocaleString("en-US", { minimumFractionDigits: Math.min(2, digits), maximumFractionDigits: digits });
}

/** 통화 표시를 붙인 가격 (시세 카드·제목용): 206,000원 / ₩206,000 / $348.51. 코인·지수는 숫자만 */
export function formatQuote(value: number, currency: PriceCurrency, locale: string) {
  const n = formatPrice(value, currency);
  if (n === "-") return n;
  if (currency === "KRW") return locale === "ko" ? `${n}원` : `₩${n}`;
  if (currency === "USD") return `$${n}`;
  return n;
}

/**
 * 가격 + 작은 통화 표시. 통화 기호는 숫자보다 작고 흐리게 (긴 원화 가격이 카드를 넘지 않게)
 * unitClassName 으로 기호 크기를 정한다 (기본: 숫자의 약 70%)
 */
export function PriceText({
  value,
  currency,
  locale,
  unitClassName = "text-[0.7em]",
}: {
  value: number;
  currency: PriceCurrency;
  locale: string;
  unitClassName?: string;
}) {
  const n = formatPrice(value, currency);
  if (n === "-" || !currency) return <>{n}</>;
  const unitCls = `font-sans font-medium text-[var(--rz-muted)] ${unitClassName}`;
  if (currency === "KRW" && locale === "ko") {
    return (
      <>
        {n}
        <span className={`ml-0.5 ${unitCls}`}>원</span>
      </>
    );
  }
  return (
    <>
      <span className={`mr-0.5 ${unitCls}`}>{currency === "KRW" ? "₩" : "$"}</span>
      {n}
    </>
  );
}

function formatTime(ts: number, interval: string, locale: string) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (locale !== "ko") {
    // 예: Nov 11, 2026 / Nov 11 14:00
    if (interval === "D" || interval === "W") {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  if (interval === "D" || interval === "W") return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
  return `${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CandleChart({ candles, interval, currency }: { candles: Candle[]; interval: string; currency?: PriceCurrency }) {
  const t = useTranslations("chart");
  const locale = useLocale();
  const [hover, setHover] = useState<number | null>(null);

  const geo = useMemo(() => {
    if (candles.length === 0) return null;
    const max = Math.max(...candles.map((c) => c.high));
    const min = Math.min(...candles.map((c) => c.low));
    const range = max - min || max * 0.01 || 1;
    const top = max + range * 0.05;
    const bottom = min - range * 0.05;
    const span = top - bottom;
    const maxVol = Math.max(...candles.map((c) => c.volume)) || 1;
    const step = (W - PAD_R) / candles.length;
    const y = (price: number) => PAD_T + ((top - price) / span) * PRICE_H;
    const ticks = Array.from({ length: 5 }, (_, i) => bottom + (span * (i + 0.5)) / 5);
    return { step, y, ticks, maxVol };
  }, [candles]);

  if (!geo) {
    return <div className="flex h-[308px] items-center justify-center text-sm text-[var(--rz-muted)] sm:h-[408px]">{t("noData")}</div>;
  }

  const { step, y, ticks, maxVol } = geo;
  const bodyW = Math.max(1, step * 0.62);
  const last = candles[candles.length - 1];
  const active = hover !== null ? candles[hover] : last;
  const activeUp = active.close >= active.open;

  const handleMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * W;
    const idx = Math.floor(x / step);
    setHover(idx >= 0 && idx < candles.length ? idx : null);
  };

  return (
    <div className="relative">
      <div className="mb-2 flex h-5 items-center gap-x-4 overflow-hidden whitespace-nowrap font-mono text-[11px] text-[var(--rz-muted)] sm:text-xs">
        <span className="inline-block w-[6.5rem] shrink-0 sm:w-[7.5rem]">{formatTime(active.timestamp, interval, locale)}</span>
        <span className="inline-block min-w-[11ch]">
          O <b className={activeUp ? "text-[var(--rz-up)]" : "text-[var(--rz-down)]"}>{formatPrice(active.open, currency)}</b>
        </span>
        <span className="inline-block min-w-[11ch]">
          H <b className={activeUp ? "text-[var(--rz-up)]" : "text-[var(--rz-down)]"}>{formatPrice(active.high, currency)}</b>
        </span>
        <span className="inline-block min-w-[11ch]">
          L <b className={activeUp ? "text-[var(--rz-up)]" : "text-[var(--rz-down)]"}>{formatPrice(active.low, currency)}</b>
        </span>
        <span className="inline-block min-w-[11ch]">
          C <b className={activeUp ? "text-[var(--rz-up)]" : "text-[var(--rz-down)]"}>{formatPrice(active.close, currency)}</b>
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-[280px] w-full select-none sm:h-[380px]"
        preserveAspectRatio="none"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={t("candleChart")}
      >
        {ticks.map((price) => (
          <g key={price}>
            <line x1={0} x2={W - PAD_R} y1={y(price)} y2={y(price)} stroke="var(--rz-grid)" strokeWidth={1} />
            <text x={W - PAD_R + 8} y={y(price) + 4} fontSize={12} fill="var(--rz-muted)" fontFamily="monospace">
              {formatPrice(price, currency)}
            </text>
          </g>
        ))}

        {candles.map((c, i) => {
          const up = c.close >= c.open;
          const color = up ? "var(--rz-up)" : "var(--rz-down)";
          const cx = i * step + step / 2;
          const bodyTop = y(Math.max(c.open, c.close));
          const bodyH = Math.max(1, Math.abs(y(c.open) - y(c.close)));
          const volH = (c.volume / maxVol) * VOL_H;
          return (
            <g key={c.timestamp}>
              <line x1={cx} x2={cx} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth={1} />
              <rect x={cx - bodyW / 2} y={bodyTop} width={bodyW} height={bodyH} fill={color} />
              <rect x={cx - bodyW / 2} y={VOL_TOP + VOL_H - volH} width={bodyW} height={volH} fill={color} opacity={0.35} />
            </g>
          );
        })}

        {/* 현재가 라인 */}
        <line
          x1={0}
          x2={W - PAD_R}
          y1={y(last.close)}
          y2={y(last.close)}
          stroke={last.close >= last.open ? "var(--rz-up)" : "var(--rz-down)"}
          strokeDasharray="4 4"
          strokeWidth={1}
        />
        <rect
          x={W - PAD_R + 2}
          y={y(last.close) - 10}
          width={PAD_R - 4}
          height={20}
          rx={3}
          fill={last.close >= last.open ? "var(--rz-up)" : "var(--rz-down)"}
        />
        <text x={W - PAD_R + 8} y={y(last.close) + 4} fontSize={12} fill="#fff" fontFamily="monospace">
          {formatPrice(last.close, currency)}
        </text>

        {hover !== null ? (
          <line
            x1={hover * step + step / 2}
            x2={hover * step + step / 2}
            y1={0}
            y2={H}
            stroke="var(--rz-muted)"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
        ) : null}
      </svg>
    </div>
  );
}
