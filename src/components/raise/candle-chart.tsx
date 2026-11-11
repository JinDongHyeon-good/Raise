"use client";

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

export function formatPrice(value: number) {
  if (!Number.isFinite(value)) return "-";
  const abs = Math.abs(value);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 3 : abs >= 0.01 ? 5 : 8;
  return value.toLocaleString("en-US", { minimumFractionDigits: Math.min(2, digits), maximumFractionDigits: digits });
}

function formatTime(ts: number, interval: string) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (interval === "D" || interval === "W") return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
  return `${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CandleChart({ candles, interval }: { candles: Candle[]; interval: string }) {
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
    return <div className="flex h-[300px] items-center justify-center text-sm text-[var(--rz-muted)]">차트 데이터 없음</div>;
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
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-[var(--rz-muted)] sm:text-xs">
        <span>{formatTime(active.timestamp, interval)}</span>
        <span>
          O <b className={activeUp ? "text-[var(--rz-up)]" : "text-[var(--rz-down)]"}>{formatPrice(active.open)}</b>
        </span>
        <span>
          H <b className={activeUp ? "text-[var(--rz-up)]" : "text-[var(--rz-down)]"}>{formatPrice(active.high)}</b>
        </span>
        <span>
          L <b className={activeUp ? "text-[var(--rz-up)]" : "text-[var(--rz-down)]"}>{formatPrice(active.low)}</b>
        </span>
        <span>
          C <b className={activeUp ? "text-[var(--rz-up)]" : "text-[var(--rz-down)]"}>{formatPrice(active.close)}</b>
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-[280px] w-full select-none sm:h-[380px]"
        preserveAspectRatio="none"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label="캔들 차트"
      >
        {ticks.map((price) => (
          <g key={price}>
            <line x1={0} x2={W - PAD_R} y1={y(price)} y2={y(price)} stroke="var(--rz-grid)" strokeWidth={1} />
            <text x={W - PAD_R + 8} y={y(price) + 4} fontSize={12} fill="var(--rz-muted)" fontFamily="monospace">
              {formatPrice(price)}
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
          {formatPrice(last.close)}
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
