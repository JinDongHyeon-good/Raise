/**
 * 유튜브 영상 AI 요약 — "영상에 실제로 나온 말"만 근거로 한다.
 *
 * 단계 (각 단계는 요청 1번, Amplify 30초 제한 안에서 끝나도록 쪼갬):
 *   1) 받아쓰기: 영상을 3분 구간으로 나눠 Gemini가 들리는 그대로 받아 적는다 (요약·의역 금지)
 *   2) 요약: 받아쓰기 텍스트만 보고 한국어로 요약. 항목마다 근거 문단 번호와 원문 인용을 붙이게 한다
 *   3) 검증: 코드로 (a) 인용문이 근거 문단에 글자 그대로 있는지 (b) 요약에 나온 숫자가 근거 문단에 있는지
 *      확인하고, 통과한 항목만 다시 Gemini에게 "근거 문단만으로 이 문장이 성립하는가"를 묻는다.
 *      하나라도 실패하면 그 항목은 버린다. (버린 개수는 화면에 표시)
 *
 * 상태는 YOUTUBE_SEARCH_CACHE 테이블(키 summary:v1:<videoId>)에 저장 → 한 영상은 한 번만 요약된다.
 */
import { GEMINI_TEXT_MODEL, GEMINI_TRANSCRIBE_MODEL } from "@/lib/gemini-models";
import { vertexGenerate } from "@/lib/gemini-fetch";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getVideoMeta } from "@/lib/youtube";

export const MAX_VIDEO_SEC = 60 * 60;
const CHUNK_SEC = 180;
/**
 * 단계 1번에 쓰는 최대 시간. 영상 구간 받아쓰기는 Google 쪽 영상 처리 때문에 3분 구간도 23~50초가 걸린다
 * (2026-11-11 실측). Amplify처럼 응답을 30초에 끊는 곳에서는 이 단계를 시간 제한 없는 곳(백그라운드 함수)에서 돌려야 한다.
 */
const STEP_TIMEOUT_MS = Number(process.env.VIDEO_SUMMARY_STEP_TIMEOUT_MS) || 90_000;
const LOCK_MS = STEP_TIMEOUT_MS + 5_000;
const MAX_ATTEMPTS = 3;

export type Segment = { id: string; t: number; text: string };

export type SummaryItem = { text: string; segs: string[]; t: number; quote?: string };
export type PriceLevel = { coin: string; price: string; kind: string; segs: string[]; t: number; quote: string };

export type VideoSummary = {
  overview: SummaryItem[];
  points: SummaryItem[];
  levels: PriceLevel[];
  stance: { label: string; reason: string; segs: string[]; t: number } | null;
  /** 검증에서 떨어진 항목 수 */
  dropped: number;
  noSpeech: boolean;
  model: { transcribe: string; text: string };
};

type Draft = {
  overview: Array<{ text: string; segs: string[] }>;
  points: Array<{ claim: string; segs: string[]; quote: string }>;
  levels: Array<{ coin: string; price: string; kind: string; segs: string[]; quote: string }>;
  stance: { label: string; reason: string; segs: string[] } | null;
  is_speech: boolean;
};

export type SummaryJob = {
  v: 1;
  videoId: string;
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
const keyOf = (videoId: string) => `summary:v1:${videoId}`;

async function loadJob(videoId: string): Promise<SummaryJob | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return memory.get(videoId) ?? null;
  const { data } = await admin
    .from("YOUTUBE_SEARCH_CACHE")
    .select("payload")
    .eq("query_key", keyOf(videoId))
    .maybeSingle<{ payload: SummaryJob }>();
  return data?.payload ?? null;
}

async function saveJob(job: SummaryJob) {
  job.updatedAt = Date.now();
  memory.set(job.videoId, job);
  const admin = getSupabaseAdminClient();
  if (!admin) return;
  const { error } = await admin
    .from("YOUTUBE_SEARCH_CACHE")
    .upsert({ query_key: keyOf(job.videoId), payload: job, fetched_at: new Date().toISOString() });
  if (error) console.warn("[video-summary] save failed", error.message);
}

// ── 공통 ─────────────────────────────────────────────────

function mmss(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
}

function parseTime(raw: string) {
  const parts = raw.trim().split(":").map((p) => Number(p));
  if (parts.some((n) => !Number.isFinite(n))) return NaN;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

/** 비교용 정규화: 소문자, 공백·문장부호 제거 */
function norm(text: string) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s.,!?·…'"“”‘’`()[\]{}<>:;~\-_/\\|*#@%^&+=]/g, "");
}

/** 숫자 토큰 (1,234 → 1234, 1.5 유지) */
function numbersIn(text: string) {
  return (text.normalize("NFKC").match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((n) => n.replace(/,/g, ""));
}

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

// ── 1) 받아쓰기 ──────────────────────────────────────────

const TRANSCRIPT_SCHEMA = {
  type: "OBJECT",
  properties: {
    segments: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          t: { type: "STRING", description: "이 문단이 시작되는 시각, 영상 전체 기준 mm:ss 또는 h:mm:ss" },
          text: { type: "STRING", description: "들린 말 그대로. 원래 언어 유지" },
        },
        required: ["t", "text"],
      },
    },
  },
  required: ["segments"],
};

async function transcribeChunk(job: SummaryJob, index: number) {
  const chunk = job.chunks[index];
  const prompt = [
    `이 영상의 ${mmss(chunk.start)} ~ ${mmss(chunk.end)} 구간에서 사람이 말한 내용을 들리는 그대로 받아 적어라.`,
    "규칙:",
    "- 요약, 의역, 번역, 보충 설명, 맺음말 추가를 절대 하지 마라. 실제로 들린 말만 적는다.",
    "- 말한 언어 그대로 적는다 (영어면 영어, 한국어면 한국어).",
    "- 숫자·가격·코인 이름은 들린 그대로 적는다.",
    "- 15~40초 단위 문단으로 나누고, 각 문단 시작 시각을 영상 전체 기준으로 적는다.",
    "- 잘 안 들리는 부분은 추측하지 말고 [불분명]이라고 적는다.",
    "- 말소리가 전혀 없으면 segments를 빈 배열로 둔다.",
  ].join("\n");

  const { text } = await vertexGenerate({
    model: GEMINI_TRANSCRIBE_MODEL,
    parts: [
      {
        fileData: { fileUri: `https://www.youtube.com/watch?v=${job.videoId}`, mimeType: "video/*" },
        videoMetadata: { startOffset: `${chunk.start}s`, endOffset: `${chunk.end}s` },
      },
      { text: prompt },
    ],
    responseSchema: TRANSCRIPT_SCHEMA,
    mediaResolution: "MEDIA_RESOLUTION_LOW",
    timeoutMs: STEP_TIMEOUT_MS,
    maxOutputTokens: 12_000,
  });

  const parsed = JSON.parse(text) as { segments?: Array<{ t?: string; text?: string }> };
  let lastT = chunk.start;
  chunk.segments = (parsed.segments ?? [])
    .map((seg) => {
      const raw = parseTime(seg.t ?? "");
      // 구간 밖 시각은 믿지 않는다 → 직전 시각으로 고정
      const t = Number.isFinite(raw) && raw >= chunk.start - 2 && raw <= chunk.end + 2 ? Math.max(raw, lastT) : lastT;
      lastT = t;
      return { t, text: (seg.text ?? "").trim() };
    })
    .filter((seg) => seg.text.length > 0);
}

// ── 2) 요약 ──────────────────────────────────────────────

const DRAFT_SCHEMA = {
  type: "OBJECT",
  properties: {
    is_speech: { type: "BOOLEAN", description: "요약할 만한 발언이 있으면 true" },
    overview: {
      type: "ARRAY",
      description: "영상 전체 요지 1~3문장",
      items: {
        type: "OBJECT",
        properties: { text: { type: "STRING" }, segs: { type: "ARRAY", items: { type: "STRING" } } },
        required: ["text", "segs"],
      },
    },
    points: {
      type: "ARRAY",
      description: "핵심 주장 3~8개",
      items: {
        type: "OBJECT",
        properties: {
          claim: { type: "STRING" },
          segs: { type: "ARRAY", items: { type: "STRING" } },
          quote: { type: "STRING", description: "근거 문단에서 글자 그대로 복사한 원문 일부 (10~80자)" },
        },
        required: ["claim", "segs", "quote"],
      },
    },
    levels: {
      type: "ARRAY",
      description: "화자가 직접 말한 가격대만. 없으면 빈 배열",
      items: {
        type: "OBJECT",
        properties: {
          coin: { type: "STRING" },
          price: { type: "STRING", description: "받아쓰기에 적힌 표기 그대로" },
          kind: { type: "STRING", enum: ["지지", "저항", "목표", "손절", "현재가", "기타"] },
          segs: { type: "ARRAY", items: { type: "STRING" } },
          quote: { type: "STRING" },
        },
        required: ["coin", "price", "kind", "segs", "quote"],
      },
    },
    stance: {
      type: "OBJECT",
      nullable: true,
      properties: {
        label: { type: "STRING", enum: ["상승", "하락", "중립", "혼재", "불명확"] },
        reason: { type: "STRING" },
        segs: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["label", "reason", "segs"],
    },
  },
  required: ["is_speech", "overview", "points", "levels"],
};

async function summarize(job: SummaryJob) {
  const segments = allSegments(job);
  const transcript = segments.map((s) => `[${s.id} | ${mmss(s.t)}] ${s.text}`).join("\n");
  const prompt = [
    "아래는 유튜브 영상의 받아쓰기 원문이다. 이 원문에 적힌 내용만 근거로 한국어 요약을 만들어라.",
    "",
    "절대 규칙:",
    "1. 원문에 없는 사실·숫자·전망·배경지식을 절대 추가하지 마라. 네가 아는 시장 정보도 쓰지 마라.",
    "2. 화자의 의견은 사실처럼 쓰지 말고 '화자는 ~라고 본다/말한다'처럼 화자의 말로 적어라.",
    "3. 모든 항목에 근거 문단 번호(segs, 예: [\"S3\",\"S4\"])를 붙여라. 근거를 댈 수 없는 내용은 쓰지 마라.",
    "4. quote는 근거 문단에서 글자 그대로 복사한 원문이어야 한다. 번역하거나 고치지 마라 (외국어면 외국어 그대로).",
    "5. 숫자·가격은 원문 표기 그대로 옮겨라 (예: 원문이 '9만 2천'이면 '9만 2천', '92,000'이면 '92,000').",
    "6. 요약 문장(overview.text, points.claim, stance.reason)은 원문이 외국어여도 반드시 한국어로 써라.",
    "7. 화자가 직접 말하지 않은 가격대는 levels에 넣지 마라. 확실하지 않으면 빼라.",
    "8. 광고·구독 요청·인사말은 요약하지 마라.",
    "",
    `영상 제목: ${job.title}`,
    `채널: ${job.channelTitle}`,
    "",
    "[받아쓰기 원문]",
    transcript,
  ].join("\n");

  const { text } = await vertexGenerate({
    model: GEMINI_TEXT_MODEL,
    parts: [{ text: prompt }],
    responseSchema: DRAFT_SCHEMA,
    thinkingLevel: "LOW",
    timeoutMs: STEP_TIMEOUT_MS,
  });
  job.draft = JSON.parse(text) as Draft;
}

// ── 3) 검증 ──────────────────────────────────────────────

const VERIFY_SCHEMA = {
  type: "OBJECT",
  properties: {
    results: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          supported: { type: "BOOLEAN" },
        },
        required: ["id", "supported"],
      },
    },
  },
  required: ["results"],
};

async function verify(job: SummaryJob) {
  const draft = job.draft!;
  const segments = allSegments(job);
  const byId = new Map(segments.map((s) => [s.id, s]));
  let dropped = 0;

  const cited = (segs: string[]) => {
    const found = Array.from(new Set(segs)).map((id) => byId.get(id)).filter((s): s is Segment => Boolean(s));
    return found.length === segs.length && found.length > 0 ? found : null;
  };
  const firstT = (found: Segment[]) => Math.min(...found.map((s) => s.t));
  const numbersOk = (claim: string, found: Segment[]) => {
    const source = new Set(numbersIn(found.map((s) => s.text).join(" ")));
    return numbersIn(claim).every((n) => source.has(n));
  };
  const quoteOk = (quote: string, found: Segment[]) => {
    const q = norm(quote);
    return q.length >= 4 && norm(found.map((s) => s.text).join(" ")).includes(q);
  };

  // (a)(b) 코드 검증
  type Candidate = { id: string; text: string; found: Segment[]; kind: "overview" | "point" | "level" | "stance"; index: number };
  const candidates: Candidate[] = [];

  draft.overview.forEach((item, index) => {
    const found = cited(item.segs ?? []);
    if (!found || !numbersOk(item.text, found)) return void dropped++;
    candidates.push({ id: `O${index}`, text: item.text, found, kind: "overview", index });
  });
  draft.points.forEach((item, index) => {
    const found = cited(item.segs ?? []);
    if (!found || !quoteOk(item.quote ?? "", found) || !numbersOk(item.claim, found)) return void dropped++;
    candidates.push({ id: `P${index}`, text: item.claim, found, kind: "point", index });
  });
  draft.levels.forEach((item, index) => {
    const found = cited(item.segs ?? []);
    const priceInQuote = numbersIn(item.price).length > 0 && numbersIn(item.price).every((n) => numbersIn(item.quote ?? "").includes(n));
    if (!found || !quoteOk(item.quote ?? "", found) || !priceInQuote) return void dropped++;
    candidates.push({ id: `L${index}`, text: `${item.coin} ${item.price} (${item.kind})`, found, kind: "level", index });
  });
  if (draft.stance) {
    const found = cited(draft.stance.segs ?? []);
    if (!found || !numbersOk(draft.stance.reason, found)) dropped++;
    else candidates.push({ id: "T0", text: `화자의 관점: ${draft.stance.label} — ${draft.stance.reason}`, found, kind: "stance", index: 0 });
  }

  // (c) 의미 검증: 근거 문단만으로 성립하는가
  let supported = new Set<string>();
  if (candidates.length) {
    const prompt = [
      "각 항목이 함께 주어진 '근거 원문'만으로 성립하는지 엄격하게 판정하라.",
      "- 근거 원문에 직접 나오거나 명백히 같은 뜻일 때만 supported=true.",
      "- 근거에 없는 내용이 조금이라도 추가됐거나, 화자의 의견을 사실처럼 단정했거나, 숫자·대상이 다르면 false.",
      "- 원문이 외국어이고 항목이 한국어여도 뜻이 정확히 같으면 true.",
      "- 너의 배경지식으로 판단하지 마라.",
      "",
      ...candidates.map((c) =>
        [`### ${c.id}`, `항목: ${c.text}`, "근거 원문:", ...c.found.map((s) => `[${s.id}] ${s.text}`)].join("\n"),
      ),
    ].join("\n");
    const { text } = await vertexGenerate({
      model: GEMINI_TEXT_MODEL,
      parts: [{ text: prompt }],
      responseSchema: VERIFY_SCHEMA,
      thinkingLevel: "LOW",
      timeoutMs: STEP_TIMEOUT_MS,
    });
    const parsed = JSON.parse(text) as { results?: Array<{ id: string; supported: boolean }> };
    supported = new Set((parsed.results ?? []).filter((r) => r.supported === true).map((r) => r.id));
  }

  const summary: VideoSummary = {
    overview: [],
    points: [],
    levels: [],
    stance: null,
    dropped,
    noSpeech: !draft.is_speech || segments.length === 0,
    model: { transcribe: GEMINI_TRANSCRIBE_MODEL, text: GEMINI_TEXT_MODEL },
  };
  for (const c of candidates) {
    if (!supported.has(c.id)) {
      summary.dropped++;
      continue;
    }
    const segs = c.found.map((s) => s.id);
    const t = firstT(c.found);
    if (c.kind === "overview") summary.overview.push({ text: draft.overview[c.index].text, segs, t });
    if (c.kind === "point") {
      const p = draft.points[c.index];
      summary.points.push({ text: p.claim, segs, t, quote: p.quote });
    }
    if (c.kind === "level") {
      const l = draft.levels[c.index];
      summary.levels.push({ coin: l.coin, price: l.price, kind: l.kind, segs, t, quote: l.quote });
    }
    if (c.kind === "stance" && draft.stance) summary.stance = { ...draft.stance, segs, t };
  }
  summary.points.sort((a, b) => a.t - b.t);
  summary.levels.sort((a, b) => a.t - b.t);
  job.summary = summary;
}

// ── 단계 실행 ────────────────────────────────────────────

export class SummaryRejectedError extends Error {}

/** 요약 상태 조회 (없으면 null). 단계를 진행하지 않는다 */
export async function getSummary(videoId: string): Promise<SummaryView | null> {
  const job = await loadJob(videoId);
  return job ? toView(job) : null;
}

/** 작업을 만들거나(필요 시) 한 단계 진행하고 현재 상태를 돌려준다 */
export async function advanceSummary(videoId: string, options: { allowCreate: boolean }): Promise<SummaryView> {
  let job = await loadJob(videoId);

  if (!job) {
    if (!options.allowCreate) throw new SummaryRejectedError("잠시 후 다시 시도해 주세요.");
    const meta = await getVideoMeta(videoId);
    if (!meta) throw new SummaryRejectedError("영상을 찾을 수 없어요.");
    if (meta.isLive) throw new SummaryRejectedError("라이브 방송은 요약할 수 없어요.");
    if (meta.durationSec > MAX_VIDEO_SEC) throw new SummaryRejectedError("60분이 넘는 영상은 요약하지 않아요.");
    const chunks: SummaryJob["chunks"] = [];
    for (let start = 0; start < meta.durationSec; start += CHUNK_SEC) {
      chunks.push({ start, end: Math.min(meta.durationSec, start + CHUNK_SEC), segments: null, attempts: 0 });
    }
    job = {
      v: 1,
      videoId,
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
    await saveJob(job);
    // 생성 요청에서는 받아쓰기를 하지 않는다 (요청당 30초 제한 여유 확보)
    return toView(job);
  }

  if (job.status === "done" || job.status === "failed") return toView(job);
  if (job.lockedUntil > Date.now()) return toView(job); // 다른 요청이 진행 중

  job.lockedUntil = Date.now() + LOCK_MS;
  await saveJob(job);

  try {
    if (job.status === "transcribing") {
      const index = job.chunks.findIndex((c) => !c.segments);
      if (index === -1) {
        job.status = "summarizing";
      } else {
        job.chunks[index].attempts++;
        try {
          await transcribeChunk(job, index);
        } catch (error) {
          if (job.chunks[index].attempts >= MAX_ATTEMPTS) throw error;
          console.warn("[video-summary] transcribe retry", videoId, index, error instanceof Error ? error.message : error);
        }
        if (job.chunks.every((c) => c.segments)) job.status = "summarizing";
      }
    } else if (job.status === "summarizing") {
      job.attempts++;
      try {
        await summarize(job);
        job.status = "verifying";
        job.attempts = 0;
      } catch (error) {
        if (job.attempts >= MAX_ATTEMPTS) throw error;
      }
    } else if (job.status === "verifying") {
      job.attempts++;
      try {
        await verify(job);
        job.status = "done";
        job.draft = null;
      } catch (error) {
        if (job.attempts >= MAX_ATTEMPTS) throw error;
      }
    }
  } catch (error) {
    console.error("[video-summary] failed", videoId, error instanceof Error ? error.message : error);
    job.status = "failed";
    job.error = "요약을 만들지 못했어요. 잠시 후 다시 시도해 주세요.";
  } finally {
    job.lockedUntil = 0;
    await saveJob(job);
  }

  return toView(job);
}

/** 실패한 요약을 지우고 다시 시도할 수 있게 */
export async function resetFailedSummary(videoId: string) {
  const job = await loadJob(videoId);
  if (!job || job.status !== "failed") return;
  const admin = getSupabaseAdminClient();
  memory.delete(videoId);
  if (admin) await admin.from("YOUTUBE_SEARCH_CACHE").delete().eq("query_key", keyOf(videoId));
}
