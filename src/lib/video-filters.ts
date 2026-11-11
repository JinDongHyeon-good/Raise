/**
 * 영상 목록 필터 — 이미 받아온 영상에만 적용 (YouTube 할당량을 쓰지 않음)
 * "기본값으로 저장"은 로그인 사용자의 계정(USER_PREFERENCES)에 저장한다 — src/hooks/use-video-filter-default.ts
 */
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

/** 저장값 확인: 세 항목이 모두 올바를 때만 필터로 인정 (서버·클라이언트 공용) */
export function parseVideoFilters(value: unknown): VideoFilters | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const valid = <T extends string>(x: unknown, options: Array<{ value: T }>): x is T => options.some((o) => o.value === x);
  if (!valid(v.order, ORDER_OPTIONS) || !valid(v.uploaded, UPLOADED_OPTIONS) || !valid(v.length, LENGTH_OPTIONS)) return null;
  return { order: v.order, uploaded: v.uploaded, length: v.length };
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
