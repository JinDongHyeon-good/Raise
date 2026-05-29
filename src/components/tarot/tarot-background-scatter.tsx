"use client";

import { useEffect, useState } from "react";
import {
  FULL_TAROT_DECK,
  getTarotImageUrl,
  getTarotImageUrlNfd,
  getTarotImageUrlNfdFileOnly,
} from "@/lib/tarot-deck";

const SCATTER_STORAGE_KEY = "melotaro-bg-scatter-v4";
const SCATTER_COUNT = 22;
const CARD_ASPECT = 1.5;
const MAX_PLACEMENT_ATTEMPTS = 90;
/** 반경 기준 허용 겹침 비율 — 작을수록 거의 안 겹침 */
const MAX_OVERLAP_RATIO = 0.14;

type ScatterLayoutItem = {
  cardId: string;
  topPct: number;
  leftPct: number;
  width: number;
  rotate: number;
  opacity: number;
};

type ScatterRenderItem = ScatterLayoutItem & {
  srcNfc: string;
  srcNfdFileOnly: string;
  srcNfd: string;
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function shuffleDeck<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function cardRadiusPx(width: number) {
  const height = width * CARD_ASPECT;
  return Math.hypot(width, height) * 0.48;
}

function clampPosition(
  topPct: number,
  leftPct: number,
  width: number,
  viewportW: number,
  viewportH: number,
) {
  const halfW = width / 2;
  const halfH = (width * CARD_ASPECT) / 2;
  const minLeft = (halfW / viewportW) * 100 + 1;
  const maxLeft = 100 - minLeft;
  const minTop = (halfH / viewportH) * 100 + 2;
  const maxTop = 100 - minTop;

  return {
    topPct: Math.min(maxTop, Math.max(minTop, topPct)),
    leftPct: Math.min(maxLeft, Math.max(minLeft, leftPct)),
  };
}

function isOverlappingTooMuch(
  candidate: { topPct: number; leftPct: number; width: number },
  placed: ScatterLayoutItem[],
  viewportW: number,
  viewportH: number,
) {
  const cx = (candidate.leftPct / 100) * viewportW;
  const cy = (candidate.topPct / 100) * viewportH;
  const radius = cardRadiusPx(candidate.width);

  for (const other of placed) {
    const otherCx = (other.leftPct / 100) * viewportW;
    const otherCy = (other.topPct / 100) * viewportH;
    const otherRadius = cardRadiusPx(other.width);
    const allowedOverlap = Math.min(radius, otherRadius) * MAX_OVERLAP_RATIO;
    const minCenterDistance = radius + otherRadius - allowedOverlap;

    const distance = Math.hypot(cx - otherCx, cy - otherCy);
    if (distance < minCenterDistance) return true;
  }

  return false;
}

function placeCard(
  cardId: string,
  placed: ScatterLayoutItem[],
  viewportW: number,
  viewportH: number,
): ScatterLayoutItem {
  let width = Math.round(randomBetween(88, 128));

  for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt += 1) {
    if (attempt > 50) {
      width = Math.max(72, width - 3);
    }

    const { topPct, leftPct } = clampPosition(
      randomBetween(5, 92),
      randomBetween(5, 93),
      width,
      viewportW,
      viewportH,
    );

    const candidate = { topPct, leftPct, width };
    if (!isOverlappingTooMuch(candidate, placed, viewportW, viewportH)) {
      return {
        cardId,
        topPct,
        leftPct,
        width,
        rotate: Math.round(randomBetween(-22, 22)),
        opacity: randomBetween(0.32, 0.48),
      };
    }
  }

  const fallback = clampPosition(
    randomBetween(8, 90),
    randomBetween(8, 90),
    width,
    viewportW,
    viewportH,
  );

  return {
    cardId,
    ...fallback,
    width,
    rotate: Math.round(randomBetween(-18, 18)),
    opacity: randomBetween(0.3, 0.45),
  };
}

function createRandomLayout(viewportW: number, viewportH: number): ScatterLayoutItem[] {
  const picked = shuffleDeck(FULL_TAROT_DECK).slice(0, SCATTER_COUNT);
  const placed: ScatterLayoutItem[] = [];

  for (const card of picked) {
    placed.push(placeCard(card.id, placed, viewportW, viewportH));
  }

  return placed;
}

function readStoredLayout(): ScatterLayoutItem[] | null {
  try {
    const raw = sessionStorage.getItem(SCATTER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ScatterLayoutItem[];
    if (!Array.isArray(parsed) || parsed.length < SCATTER_COUNT) return null;
    return parsed;
  } catch {
    return null;
  }
}

function resolveLayout(layout: ScatterLayoutItem[]): ScatterRenderItem[] {
  return layout
    .map((item) => {
      const card = FULL_TAROT_DECK.find((entry) => entry.id === item.cardId);
      if (!card) return null;
      return {
        ...item,
        srcNfc: getTarotImageUrl(card),
        srcNfdFileOnly: getTarotImageUrlNfdFileOnly(card),
        srcNfd: getTarotImageUrlNfd(card),
      };
    })
    .filter((item): item is ScatterRenderItem => item !== null);
}

function loadScatterLayout(viewportW: number, viewportH: number): ScatterRenderItem[] {
  const stored = readStoredLayout();
  const layout = stored ?? createRandomLayout(viewportW, viewportH);

  if (!stored) {
    try {
      sessionStorage.setItem(SCATTER_STORAGE_KEY, JSON.stringify(layout));
    } catch {
      /* ignore quota / private mode */
    }
  }

  return resolveLayout(layout);
}

export function TarotBackgroundScatter() {
  const [cards, setCards] = useState<ScatterRenderItem[]>([]);
  const [fallbackStageById, setFallbackStageById] = useState<Record<string, number>>({});

  const getSrc = (card: ScatterRenderItem) => {
    const stage = fallbackStageById[card.cardId] ?? 0;
    if (stage === 0) return card.srcNfc;
    if (stage === 1) return card.srcNfdFileOnly;
    return card.srcNfd;
  };

  useEffect(() => {
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    setCards(loadScatterLayout(viewportW, viewportH));
  }, []);

  return (
    <div className="tarot-bg-scatter" aria-hidden>
      {cards.map((card) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={card.cardId}
          src={getSrc(card)}
          alt=""
          className="tarot-bg-scatter__card"
          style={{
            top: `${card.topPct}%`,
            left: `${card.leftPct}%`,
            width: card.width,
            opacity: card.opacity,
            transform: `translate(-50%, -50%) rotate(${card.rotate}deg)`,
          }}
          loading="lazy"
          decoding="async"
          onError={() => {
            setFallbackStageById((prev) => {
              const stage = prev[card.cardId] ?? 0;
              if (stage >= 2) return prev;
              return { ...prev, [card.cardId]: stage + 1 };
            });
          }}
        />
      ))}
    </div>
  );
}
