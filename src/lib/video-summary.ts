/**
 * 유튜브 영상 AI 요약 — Next 쪽 (작업 생성·상태 조회·백그라운드 함수 호출)
 *
 * 실제 요약(받아쓰기 → 요약 → 사실 확인)은 Supabase Edge Function
 * supabase/functions/video-summary-worker 가 백그라운드로 진행한다.
 * Amplify가 응답을 30초에 끊는데 영상 받아쓰기 한 단계가 15~50초 걸리기 때문.
 * 요약 원칙·프롬프트·검증 로직은 그 함수 한 곳에만 있다.
 *
 * 작업은 YOUTUBE_SEARCH_CACHE 테이블(키 summary:v1:<videoId>)에 저장 → 한 영상은 한 번만 요약된다.
 * 아래 SummaryJob 형식은 워커 파일의 타입과 같아야 한다.
 */
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getVideoMeta } from "@/lib/youtube";

export const MAX_VIDEO_SEC = 60 * 60;
const CHUNK_SEC = 180;
/** 진행 중인데 이 시간 넘게 갱신이 없고 잠금도 풀려 있으면 워커가 멈춘 것으로 보고 다시 깨운다 */
const STALE_MS = 30_000;

export type Segment = { id: string; t: number; text: string };

export type SummaryItem = { text: string; segs: string[]; t: number; quote?: string };
export type PriceLevel = { coin: string; price: string; kind: string; segs: string[]; t: number; quote: string };

/** 영상 종류 (워커가 받아쓴 내용으로 판단). analysis 가 아니면 가격대·화자 관점이 없다 */
export type VideoType = "analysis" | "news" | "general";
/** 요약 형식 버전 — 워커의 SUMMARY_VERSION 과 같게. 이보다 낮은 완료 요약은 받아쓰기를 재사용해 다시 요약한다 */
export const SUMMARY_VERSION = 2;

export type VideoSummary = {
  overview: SummaryItem[];
  points: SummaryItem[];
  levels: PriceLevel[];
  stance: { label: string; reason: string; segs: string[]; t: number } | null;
  /** 검증에서 떨어진 항목 수 */
  dropped: number;
  noSpeech: boolean;
  /** 예전(버전 1) 요약에는 없다 */
  videoType?: VideoType;
  version?: number;
  model: { transcribe: string; text: string };
};

type Draft = {
  overview: Array<{ text: string; segs: string[] }>;
  points: Array<{ claim: string; segs: string[]; quote: string }>;
  levels: Array<{ coin: string; price: string; kind: string; segs: string[]; quote: string }>;
  stance: { label: string; reason: string; segs: string[] } | null;
  is_speech: boolean;
  video_type?: VideoType;
  type_segs?: string[];
};

export type SummaryLang = "ko" | "en";
export const isSummaryLang = (v: unknown): v is SummaryLang => v === "ko" || v === "en";

export type SummaryJob = {
  v: 1;
  videoId: string;
  /** 요약 언어 (없으면 ko). 받아쓰기는 언어와 무관하게 원문 그대로라 언어끼리 공유한다 */
  lang?: SummaryLang;
  title: string;
  channelTitle: string;
  durationSec: number;
  status: "transcribing" | "summarizing" | "verifying" | "done" | "failed";
  chunks: Array<{ start: number; end: number; segments: Array<{ t: number; text: string }> | null; attempts: number }>;
  draft: Draft | null;
  attempts: number;
  summary: VideoSummary | null;
  error: string | null;
  lockedUntil: number;
  createdAt: number;
  updatedAt: number;
};

/** 화면에 내려줄 형태 (받아쓰기 포함) */
export type SummaryView = {
  videoId: string;
  status: SummaryJob["status"];
  progress: { done: number; total: number };
  summary: VideoSummary | null;
  transcript: Segment[] | null;
  error: string | null;
};

// ── 저장소 ───────────────────────────────────────────────

const memory = new Map<string, SummaryJob>();
/** ko는 예전 키 그대로, 다른 언어는 접미사 */
const keyOf = (videoId: string, lang: SummaryLang = "ko") =>
  lang === "ko" ? `summary:v1:${videoId}` : `summary:v1:${videoId}:${lang}`;
const memKey = (videoId: string, lang: SummaryLang) => `${videoId}:${lang}`;

async function loadJob(videoId: string, lang: SummaryLang): Promise<SummaryJob | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return memory.get(memKey(videoId, lang)) ?? null;
  const { data } = await admin
    .from("YOUTUBE_SEARCH_CACHE")
    .select("payload")
    .eq("query_key", keyOf(videoId, lang))
    .maybeSingle<{ payload: SummaryJob }>();
  return data?.payload ?? null;
}

async function saveJob(job: SummaryJob) {
  job.updatedAt = Date.now();
  memory.set(memKey(job.videoId, job.lang ?? "ko"), job);
  const admin = getSupabaseAdminClient();
  if (!admin) return;
  const { error } = await admin
    .from("YOUTUBE_SEARCH_CACHE")
    .upsert({ query_key: keyOf(job.videoId, job.lang ?? "ko"), payload: job, fetched_at: new Date().toISOString() });
  if (error) console.warn("[video-summary] save failed", error.message);
}

// ── 공통 ─────────────────────────────────────────────────

function allSegments(job: SummaryJob): Segment[] {
  let n = 0;
  return job.chunks.flatMap((chunk) =>
    (chunk.segments ?? []).map((seg) => ({ id: `S${++n}`, t: seg.t, text: seg.text })),
  );
}

function toView(job: SummaryJob): SummaryView {
  const done = job.chunks.filter((c) => c.segments).length;
  return {
    videoId: job.videoId,
    status: job.status,
    progress: { done, total: job.chunks.length },
    summary: job.summary,
    transcript: job.status === "done" ? allSegments(job) : null,
    error: job.error,
  };
}


// ── 백그라운드 함수 호출 ─────────────────────────────────

async function kickWorker(videoId: string, lang: SummaryLang) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.VIDEO_SUMMARY_WORKER_SECRET;
  if (!base || !secret) throw new Error("VIDEO_SUMMARY_WORKER_SECRET가 설정되지 않았습니다.");
  const res = await fetch(`${base}/functions/v1/video-summary-worker`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-worker-secret": secret },
    body: JSON.stringify({ videoId, lang }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok && res.status !== 202) throw new Error(`요약 작업 시작 실패 (${res.status})`);
}

export class SummaryRejectedError extends Error {}

/** 요약 상태 조회 (없으면 null) */
export async function getSummary(videoId: string, lang: SummaryLang = "ko"): Promise<SummaryView | null> {
  const job = await loadJob(videoId, lang);
  return job ? toView(job) : null;
}

/**
 * 작업이 없으면 만들고 워커를 깨운다. 진행 중인데 멈춘 것 같으면 다시 깨운다.
 * 현재 상태를 바로 돌려준다 (요약을 기다리지 않음).
 */
export async function ensureSummary(videoId: string, lang: SummaryLang = "ko"): Promise<SummaryView> {
  let job = await loadJob(videoId, lang);
  let kick = false;

  if (!job) {
    // 다른 언어 요약이 이미 받아쓰기를 끝냈으면 그 받아쓰기를 그대로 쓴다 (영상 처리 비용·시간 절약)
    for (const other of (["ko", "en"] as const).filter((l) => l !== lang)) {
      const sibling = await loadJob(videoId, other);
      if (sibling && sibling.chunks.length > 0 && sibling.chunks.every((c) => c.segments)) {
        job = {
          ...sibling,
          lang,
          status: "summarizing",
          chunks: sibling.chunks.map((c) => ({ ...c, attempts: 0 })),
          draft: null,
          attempts: 0,
          summary: null,
          error: null,
          lockedUntil: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        break;
      }
    }

    if (!job) {
      const meta = await getVideoMeta(videoId);
      // 메시지는 라우트에서 언어에 맞게 바꾼다 (코드만 던짐)
      if (!meta) throw new SummaryRejectedError("notFound");
      if (meta.isLive) throw new SummaryRejectedError("live");
      if (meta.durationSec > MAX_VIDEO_SEC) throw new SummaryRejectedError("tooLong");
      const chunks: SummaryJob["chunks"] = [];
      for (let start = 0; start < meta.durationSec; start += CHUNK_SEC) {
        chunks.push({ start, end: Math.min(meta.durationSec, start + CHUNK_SEC), segments: null, attempts: 0 });
      }
      job = {
        v: 1,
        videoId,
        lang,
        title: meta.title,
        channelTitle: meta.channelTitle,
        durationSec: meta.durationSec,
        status: "transcribing",
        chunks,
        draft: null,
        attempts: 0,
        summary: null,
        error: null,
        lockedUntil: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    await saveJob(job);
    kick = true;
  } else if (
    job.status === "done" &&
    (job.summary?.version ?? 1) < SUMMARY_VERSION &&
    job.chunks.length > 0 &&
    job.chunks.every((c) => c.segments)
  ) {
    // 예전 형식 요약 → 받아쓰기는 그대로 두고 요약·확인만 새 기준으로 다시
    job = { ...job, status: "summarizing", draft: null, summary: null, attempts: 0, error: null, lockedUntil: 0 };
    await saveJob(job);
    kick = true;
  } else if (job.status !== "done" && job.status !== "failed") {
    const now = Date.now();
    kick = job.lockedUntil < now && now - job.updatedAt > STALE_MS;
  }

  if (kick) await kickWorker(videoId, lang);
  return toView(job);
}

/** 실패한 요약을 지우고 다시 시도할 수 있게 */
export async function resetFailedSummary(videoId: string, lang: SummaryLang = "ko") {
  const job = await loadJob(videoId, lang);
  if (!job || job.status !== "failed") return;
  memory.delete(memKey(videoId, lang));
  const admin = getSupabaseAdminClient();
  if (admin) await admin.from("YOUTUBE_SEARCH_CACHE").delete().eq("query_key", keyOf(videoId, lang));
}
