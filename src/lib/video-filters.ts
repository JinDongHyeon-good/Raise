/**
 * 영상 목록 필터 — 이미 받아온 영상에만 적용 (YouTube 할당량을 쓰지 않음)
 * "기본값으로 저장"은 이 브라우저(localStorage)에 저장한다.
 */
import { useSyncExternalStore } from "react";

export type VideoOrder = "relevance" | "date" | "viewCount";
export type UploadedWithin = "any" | "day" | "week" | "month" | "year";
export type VideoLength = "any" | "short" | "medium" | "long";

export type VideoFilters = { order: VideoOrder; uploaded: UploadedWithin; length: VideoLength };

export const DEFAULT_FILTERS: VideoFilters = { order: "relevance", uploaded: "any", length: "any" };

/** 화면 라벨은 video 메시지의 filters.order.<value> / filters.uploaded.<value> / filters.length.<value> */
export const ORDER_OPTIONS: Array<{ value: VideoOrder }> = [{ value: "relevance" }, { value: "date" }, { value: "viewCount" }];

export const UPLOADED_OPTIONS: Array<{ value: UploadedWithin }> = [
  { value: "any" },
  { value: "day" },
  { value: "week" },
  { value: "month" },
  { value: "year" },
];

export const LENGTH_OPTIONS: Array<{ value: VideoLength }> = [{ value: "any" }, { value: "short" }, { value: "medium" }, { value: "long" }];

const STORAGE_KEY = "jd.videoFilters.v1";
const CHANGE_EVENT = "jd-video-filters-change";

function parse(raw: string | null): VideoFilters | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<VideoFilters>;
    const pick = <T extends string>(value: unknown, options: Array<{ value: T }>, fallback: T) =>
      options.some((o) => o.value === value) ? (value as T) : fallback;
    return {
      order: pick(v.order, ORDER_OPTIONS, DEFAULT_FILTERS.order),
      uploaded: pick(v.uploaded, UPLOADED_OPTIONS, DEFAULT_FILTERS.uploaded),
      length: pick(v.length, LENGTH_OPTIONS, DEFAULT_FILTERS.length),
    };
  } catch {
    return null;
  }
}

function readRaw() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  const handler = () => onChange();
  window.addEventListener("storage", handler);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(CHANGE_EVENT, handler);
  };
}

/** 저장된 기본 필터 (없으면 DEFAULT_FILTERS). 서버 렌더링 때는 항상 DEFAULT_FILTERS */
export function useSavedVideoFilters(): VideoFilters {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  return parse(raw) ?? DEFAULT_FILTERS;
}

export function saveDefaultVideoFilters(filters: VideoFilters | null) {
  try {
    if (filters) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 저장소를 못 쓰는 환경(사생활 보호 모드 등)에서는 이번 화면에만 적용
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function sameFilters(a: VideoFilters, b: VideoFilters) {
  return a.order === b.order && a.uploaded === b.uploaded && a.length === b.length;
}

/** 기본값과 다른 항목 수 (버튼 배지용) */
export function activeFilterCount(f: VideoFilters) {
  return Number(f.order !== DEFAULT_FILTERS.order) + Number(f.uploaded !== "any") + Number(f.length !== "any");
}

function durationSec(iso: string | null) {
  const m = (iso ?? "").match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  const [, d, h, min, s] = m.map((x) => Number(x ?? 0));
  return d * 86400 + h * 3600 + min * 60 + s;
}

const WITHIN_MS: Record<Exclude<UploadedWithin, "any">, number> = {
  day: 24 * 3600_000,
  week: 7 * 24 * 3600_000,
  month: 31 * 24 * 3600_000,
  year: 366 * 24 * 3600_000,
};

type FilterableVideo = { publishedAt: string; duration: string | null; viewCount: number | null };

export function applyVideoFilters<T extends FilterableVideo>(videos: T[], f: VideoFilters, now = Date.now()): T[] {
  let list = videos.filter((v) => {
    if (f.uploaded !== "any") {
      const t = new Date(v.publishedAt).getTime();
      if (!Number.isFinite(t) || now - t > WITHIN_MS[f.uploaded]) return false;
    }
    if (f.length !== "any") {
      const sec = durationSec(v.duration);
      if (sec === null) return false;
      if (f.length === "short" && sec >= 240) return false;
      if (f.length === "medium" && (sec < 240 || sec > 1200)) return false;
      if (f.length === "long" && sec <= 1200) return false;
    }
    return true;
  });
  if (f.order === "date") list = [...list].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  if (f.order === "viewCount") list = [...list].sort((a, b) => (b.viewCount ?? -1) - (a.viewCount ?? -1));
  return list;
}
