/**
 * YouTube Data API 클라이언트 — 할당량을 최대한 아끼는 쪽으로 설계
 *
 * 자격증명: YOUTUBE_API_KEYS(쉼표 구분)만 사용. 1번 키부터 쓰고 소진되면 다음 키로 (서비스 계정은 YouTube에 쓰지 않음)
 *   - 일일 할당량 소진(quotaExceeded 등)이면 그 키는 다음 태평양시 자정(=YouTube 리셋 시각)까지 건너뛴다
 *   - 분당 한도(rateLimitExceeded)면 1분만 건너뛴다
 *
 * 캐시 (검색 1번 = 100 units 라서 검색 결과를 오래, 여러 겹으로 보관):
 *   L1 서버 메모리 → L2 Supabase 테이블(YOUTUBE_SEARCH_CACHE, 서버 재시작·다중 인스턴스에도 유지)
 *   - FRESH_MS 이내면 그대로 사용
 *   - 그 이후엔 새로 받아오되, 실패하거나 모든 키가 소진됐으면 STALE_MS 이내의 옛 결과라도 보여준다
 *   - 같은 검색어 동시 요청은 하나의 API 호출로 합친다
 *   - 정렬(관련도/최신/조회수)은 API를 다시 부르지 않고 받아둔 50개를 화면에서 정렬한다
 */
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const YT_BASE = "https://www.googleapis.com/youtube/v3";

export const FRESH_MS = 3 * 60 * 60 * 1000; // 3시간
export const STALE_MS = 7 * 24 * 60 * 60 * 1000; // 7일
const L1_MAX = 500;

export type YoutubeVideo = {
  id: string;
  title: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  thumbnail: string;
  viewCount: number | null;
  likeCount: number | null;
  duration: string | null;
};

export type YoutubeSearchResult = {
  query: string;
  /** 0부터. 페이지 하나 = search.list 1번(100 units) = 최대 50개 */
  page: number;
  videos: YoutubeVideo[];
  nextPageToken: string | null;
  fetchedAt: number;
};

/** 무한 스크롤로 받아올 수 있는 최대 페이지 수 (할당량 보호) */
export const MAX_PAGES = 4;

type CacheSource = "memory" | "db" | "api" | "stale";

export class YoutubeQuotaError extends Error {}

// ── 자격증명 ──────────────────────────────────────────────

type Credential = { id: string; key: string };

function getCredentials(): Credential[] {
  const keys = (process.env.YOUTUBE_API_KEYS ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  return keys.map((key, i) => ({ id: `key${i + 1}`, key }));
}

/** 자격증명별 "이 시각까지 사용 안 함" */
const blockedUntil = new Map<string, number>();

function msUntilPacificMidnight(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const elapsed = ((get("hour") % 24) * 3600 + get("minute") * 60 + get("second")) * 1000;
  return 24 * 3600 * 1000 - elapsed + 60_000; // 리셋 직후 1분 여유
}

const DAILY_QUOTA_REASONS = new Set(["quotaExceeded", "dailyLimitExceeded", "dailyLimitExceededUnreg"]);
const SHORT_BLOCK_REASONS = new Set(["rateLimitExceeded", "userRateLimitExceeded"]);
const BROKEN_KEY_REASONS = new Set(["keyInvalid", "keyExpired", "accessNotConfigured", "ipRefererBlocked", "forbidden"]);
const BROKEN_KEY_DETAIL_REASONS = new Set([
  "API_KEY_INVALID",
  "API_KEY_EXPIRED",
  "API_KEY_SERVICE_BLOCKED",
  "API_KEY_HTTP_REFERRER_BLOCKED",
  "API_KEY_IP_ADDRESS_BLOCKED",
  "SERVICE_DISABLED",
  "CONSUMER_SUSPENDED",
]);

async function ytGet<T>(path: string, params: Record<string, string>): Promise<{ data: T; credential: string }> {
  const credentials = getCredentials();
  if (credentials.length === 0) throw new Error("YouTube 자격증명이 없습니다 (YOUTUBE_API_KEYS).");

  let lastError = "YouTube API 오류";
  let allQuota = true;

  for (const cred of credentials) {
    if ((blockedUntil.get(cred.id) ?? 0) > Date.now()) continue;

    const url = new URL(`${YT_BASE}/${path}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    url.searchParams.set("key", cred.key);

    let response: Response;
    try {
      response = await fetch(url, { cache: "no-store" });
    } catch {
      allQuota = false;
      lastError = "YouTube 서버와 통신하지 못했습니다.";
      continue;
    }
    const data = await response.json().catch(() => ({}));
    if (response.ok) return { data: data as T, credential: cred.id };

    const reason: string = data?.error?.errors?.[0]?.reason ?? "";
    const detailReasons: string[] = (data?.error?.details ?? [])
      .map((d: { reason?: string }) => d?.reason ?? "")
      .filter(Boolean);
    lastError = `YouTube API 오류(${cred.id}): ${[reason, ...detailReasons].filter(Boolean).join("/") || response.status}`;

    // 잘못된·막힌 키는 400 badRequest로 오고 진짜 사유는 details에 있다
    if (detailReasons.some((r) => BROKEN_KEY_DETAIL_REASONS.has(r))) {
      allQuota = false;
      blockedUntil.set(cred.id, Date.now() + 10 * 60_000);
      console.error(`[youtube] ${cred.id} 사용 불가: ${detailReasons.join("/")}`);
      continue;
    }
    if (DAILY_QUOTA_REASONS.has(reason)) {
      blockedUntil.set(cred.id, Date.now() + msUntilPacificMidnight());
      console.warn(`[youtube] ${cred.id} 일일 할당량 소진 → 다음 자격증명`);
      continue;
    }
    if (SHORT_BLOCK_REASONS.has(reason)) {
      blockedUntil.set(cred.id, Date.now() + 60_000);
      continue;
    }
    if (BROKEN_KEY_REASONS.has(reason)) {
      allQuota = false;
      blockedUntil.set(cred.id, Date.now() + 10 * 60_000);
      console.error(`[youtube] ${cred.id} 사용 불가: ${reason}`);
      continue;
    }
    // 요청 자체 문제(400 등)는 다른 키로 바꿔도 같으므로 바로 실패
    throw new Error(lastError);
  }

  if (allQuota) throw new YoutubeQuotaError("모든 YouTube 키의 오늘 할당량을 다 썼습니다.");
  throw new Error(lastError);
}

// ── 캐시 ──────────────────────────────────────────────────

const l1 = new Map<string, YoutubeSearchResult>();
const inflight = new Map<string, Promise<YoutubeSearchResult>>();

export function normalizeQuery(raw: string) {
  return raw.normalize("NFC").trim().replace(/\s+/g, " ").slice(0, 100);
}

/** v2: 라이브 방송 제외 + 페이지 */
function cacheKey(query: string, page: number) {
  return `v2:${page}:${query.toLowerCase()}`;
}

function l1Set(key: string, value: YoutubeSearchResult) {
  l1.delete(key);
  l1.set(key, value);
  while (l1.size > L1_MAX) l1.delete(l1.keys().next().value as string);
}

async function l2Get(key: string): Promise<YoutubeSearchResult | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;
  const { data, error } = await admin
    .from("YOUTUBE_SEARCH_CACHE")
    .select("payload, fetched_at")
    .eq("query_key", key)
    .maybeSingle<{ payload: YoutubeSearchResult; fetched_at: string }>();
  if (error || !data) return null;
  return { ...data.payload, fetchedAt: new Date(data.fetched_at).getTime() };
}

async function l2Set(key: string, value: YoutubeSearchResult) {
  const admin = getSupabaseAdminClient();
  if (!admin) return;
  const { error } = await admin.from("YOUTUBE_SEARCH_CACHE").upsert({
    query_key: key,
    payload: value,
    fetched_at: new Date(value.fetchedAt).toISOString(),
  });
  if (error) console.warn("[youtube] L2 cache write failed", error.message);
}

// ── API 호출 ─────────────────────────────────────────────

type SearchItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    channelId?: string;
    publishedAt?: string;
    liveBroadcastContent?: string;
    thumbnails?: Record<string, { url?: string }>;
  };
};

type VideoItem = {
  id: string;
  statistics?: { viewCount?: string; likeCount?: string };
  contentDetails?: { duration?: string };
  liveStreamingDetails?: Record<string, unknown>;
};

function decodeEntities(text: string) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function fetchFromApi(query: string, page: number, pageToken: string | null): Promise<YoutubeSearchResult> {
  // search.list = 100 units (maxResults와 무관하므로 최대치 50개를 한 번에)
  const { data: search, credential } = await ytGet<{ items?: SearchItem[]; nextPageToken?: string }>("search", {
    ...(pageToken ? { pageToken } : {}),
    part: "snippet",
    type: "video",
    maxResults: "50",
    q: query,
    order: "relevance",
    regionCode: "KR",
    relevanceLanguage: "ko",
    safeSearch: "moderate",
  });

  // 라이브 중·예정 방송 제외
  const items = (search.items ?? []).filter(
    (item) => item.id?.videoId && (item.snippet?.liveBroadcastContent ?? "none") === "none",
  );
  const ids = items.map((item) => item.id!.videoId!);

  // videos.list = 1 unit (최대 50개). 실패해도 검색 결과는 살린다
  let details: VideoItem[] = [];
  if (ids.length) {
    try {
      details =
        (await ytGet<{ items?: VideoItem[] }>("videos", { part: "statistics,contentDetails,liveStreamingDetails", id: ids.join(",") })).data.items ?? [];
    } catch (e) {
      console.warn("[youtube] videos.list 실패, 통계 없이 진행", e instanceof Error ? e.message : e);
    }
  }
  const detailMap = new Map(details.map((item) => [item.id, item]));

  console.info(`[youtube] search "${query}" p${page} via ${credential} (${ids.length}개)`);

  // 지난 라이브 방송 다시보기(liveStreamingDetails 있음)·길이 0(라이브)도 제외
  const isLiveRecording = (id: string) => {
    const detail = detailMap.get(id);
    if (!detail) return false;
    return Boolean(detail.liveStreamingDetails) || detail.contentDetails?.duration === "P0D";
  };

  return {
    query,
    page,
    nextPageToken: search.nextPageToken ?? null,
    fetchedAt: Date.now(),
    videos: items.filter((item) => !isLiveRecording(item.id!.videoId!)).map((item) => {
      const id = item.id!.videoId!;
      const snippet = item.snippet ?? {};
      const detail = detailMap.get(id);
      const thumbs = snippet.thumbnails ?? {};
      return {
        id,
        title: decodeEntities(snippet.title ?? ""),
        channelTitle: decodeEntities(snippet.channelTitle ?? ""),
        channelId: snippet.channelId ?? "",
        publishedAt: snippet.publishedAt ?? "",
        thumbnail: thumbs.high?.url ?? thumbs.medium?.url ?? thumbs.default?.url ?? "",
        viewCount: detail?.statistics?.viewCount ? Number(detail.statistics.viewCount) : null,
        likeCount: detail?.statistics?.likeCount ? Number(detail.statistics.likeCount) : null,
        duration: detail?.contentDetails?.duration ?? null,
      };
    }),
  };
}

/**
 * 캐시 우선 검색. allowNetwork=false면 캐시에 없을 때 API를 부르지 않고 null.
 */
export async function searchYoutube(
  rawQuery: string,
  options: { allowNetwork?: boolean; page?: number } = {},
): Promise<{ result: YoutubeSearchResult; source: CacheSource } | null> {
  const query = normalizeQuery(rawQuery);
  const page = Math.min(MAX_PAGES - 1, Math.max(0, options.page ?? 0));
  const key = cacheKey(query, page);
  const now = Date.now();

  let cached: YoutubeSearchResult | null = l1.get(key) ?? null;
  let source: CacheSource = "memory";
  if (!cached || now - cached.fetchedAt >= FRESH_MS) {
    const fromDb = await l2Get(key).catch(() => null);
    if (fromDb && (!cached || fromDb.fetchedAt > cached.fetchedAt)) {
      cached = fromDb;
      source = "db";
      l1Set(key, fromDb);
    }
  }

  if (cached && now - cached.fetchedAt < FRESH_MS) return { result: cached, source };
  if (options.allowNetwork === false) return cached && now - cached.fetchedAt < STALE_MS ? { result: cached, source: "stale" } : null;

  let pending = inflight.get(key);
  if (!pending) {
    pending = (async () => {
      let pageToken: string | null = null;
      if (page > 0) {
        // 다음 페이지 토큰은 앞 페이지 결과에 들어 있다 (앞 페이지도 캐시 우선)
        const prev = await searchYoutube(query, { page: page - 1 });
        pageToken = prev?.result.nextPageToken ?? null;
        if (!pageToken) return { query, page, videos: [], nextPageToken: null, fetchedAt: Date.now() };
      }
      return fetchFromApi(query, page, pageToken);
    })().then(async (fresh) => {
      l1Set(key, fresh);
      await l2Set(key, fresh);
      return fresh;
    });
    inflight.set(key, pending);
    pending.finally(() => inflight.delete(key)).catch(() => undefined);
  }

  try {
    return { result: await pending, source: "api" };
  } catch (error) {
    if (cached && now - cached.fetchedAt < STALE_MS) {
      console.warn("[youtube] API 실패, 이전 결과로 대체", error instanceof Error ? error.message : error);
      return { result: cached, source: "stale" };
    }
    throw error;
  }
}

// ── 단일 영상 정보 (요약 전 검증용, videos.list = 1 unit) ──

export type YoutubeVideoMeta = {
  id: string;
  title: string;
  channelTitle: string;
  durationSec: number;
  isLive: boolean;
};

export function parseIsoDuration(iso: string | null | undefined) {
  const m = (iso ?? "").match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const [, d, h, min, s] = m.map((v) => Number(v ?? 0));
  return d * 86400 + h * 3600 + min * 60 + s;
}

export async function getVideoMeta(videoId: string): Promise<YoutubeVideoMeta | null> {
  const { data } = await ytGet<{
    items?: Array<{
      id: string;
      snippet?: { title?: string; channelTitle?: string; liveBroadcastContent?: string };
      contentDetails?: { duration?: string };
    }>;
  }>("videos", { part: "snippet,contentDetails", id: videoId });
  const item = data.items?.[0];
  if (!item) return null;
  const durationSec = parseIsoDuration(item.contentDetails?.duration);
  return {
    id: item.id,
    title: decodeEntities(item.snippet?.title ?? ""),
    channelTitle: decodeEntities(item.snippet?.channelTitle ?? ""),
    durationSec,
    isLive: (item.snippet?.liveBroadcastContent ?? "none") !== "none" || durationSec === 0,
  };
}
