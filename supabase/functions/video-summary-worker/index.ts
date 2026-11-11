/**
 * video-summary-worker — Supabase Edge Function (Deno)
 *
 * 왜 존재하는가:
 *   Amplify는 응답을 30초에 끊는다. 유튜브 영상 3분 구간 받아쓰기만 해도 Google 쪽 영상 처리 때문에 15~50초가
 *   걸려서(2026-11-11 실측) Next.js API 안에서는 끝낼 수 없다. 그래서 요약 작업 전체를 이 함수가 백그라운드로 돌린다.
 *
 * 흐름:
 *   1. 브라우저 → Next /api/youtube/summary : 로그인·하루 한도 확인, 작업 생성(영상 길이 확인), 이 함수 호출
 *   2. 이 함수 : 202로 바로 응답하고 백그라운드(EdgeRuntime.waitUntil)에서 단계를 진행, 단계마다 DB에 저장
 *      시간 예산을 다 쓰면 자기 자신을 다시 호출해 이어서 진행 (긴 영상도 끝까지)
 *   3. 브라우저는 Next API로 상태만 다시 읽는다
 *
 * 요약 원칙 — 영상에서 실제로 나온 말만:
 *   받아쓰기(요약·의역 금지) → 받아쓰기만 보고 한국어 요약(항목마다 근거 문단·원문 인용) →
 *   코드 검증(인용문이 근거 문단에 글자 그대로 있는지, 숫자가 근거에 있는지) → AI 검증(근거만으로 성립하는지)
 *   하나라도 실패한 항목은 버린다.
 *
 * 대시보드에 붙여넣어도 배포되도록 의존성 없는 단일 파일로 유지한다.
 * 작업 데이터 형식은 src/lib/video-summary.ts 의 SummaryJob 과 같아야 한다.
 *
 * 시크릿:
 *   GOOGLE_SERVICE_ACCOUNT_CREDENTIALS — Vertex AI용 서비스 계정 JSON
 *   (DB 키는 Supabase가 자동으로 넣어 주는 SUPABASE_SECRET_KEYS / SUPABASE_SERVICE_ROLE_KEY 사용)
 *   VIDEO_SUMMARY_WORKER_SECRET        — Next와 공유. 이 값 없이는 호출 불가
 *   (선택) GEMINI_TRANSCRIBE_MODEL, GEMINI_TEXT_MODEL, GOOGLE_VERTEX_LOCATION
 */

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void } | undefined;

const env = (key: string) => Deno.env.get(key)?.trim() ?? "";

const TRANSCRIBE_MODEL = env("GEMINI_TRANSCRIBE_MODEL") || "gemini-3-flash-preview";
const TEXT_MODEL = env("GEMINI_TEXT_MODEL") || "gemini-3.6-flash";

/** Supabase 무료 플랜 요청당 150초. 새 단계는 이 시간 안에서만 시작하고, 넘으면 자기 자신을 다시 부른다 */
const START_STEP_BEFORE_MS = 50_000;
const STEP_TIMEOUT_MS = 80_000;
const LOCK_MS = STEP_TIMEOUT_MS + 15_000;
const MAX_ATTEMPTS = 3;
/** 동시에 받아쓸 구간 수 (3분 × 8 = 24분 분량을 한 번에) */
const TRANSCRIBE_PARALLEL = 8;

// ── 타입 (src/lib/video-summary.ts 와 동일) ──────────────

type Seg = { t: number; text: string };
type Segment = { id: string; t: number; text: string };
type Draft = {
  overview: Array<{ text: string; segs: string[] }>;
  points: Array<{ claim: string; segs: string[]; quote: string }>;
  levels: Array<{ coin: string; price: string; kind: string; segs: string[]; quote: string }>;
  stance: { label: string; reason: string; segs: string[] } | null;
  is_speech: boolean;
  video_type: VideoType;
  type_segs: string[];
};
/**
 * 영상 종류 — 받아쓴 내용으로 판단한다 (제목·썸네일 아님)
 *   analysis: 화자가 시장·종목·코인의 방향, 가격, 매매 판단을 근거와 함께 직접 말하는 분석·전망 영상
 *   news:     사건·발표·정책·규제·기업/프로젝트 소식을 전하는 영상 (화자 전망이 중심이 아님)
 *   general:  사용법·개념 설명, 강의, 인터뷰, 잡담 등 그 밖의 영상
 * analysis 가 아니면 가격대(levels)와 화자 관점(stance)을 만들지 않는다.
 */
type VideoType = "analysis" | "news" | "general";
const VIDEO_TYPES: VideoType[] = ["analysis", "news", "general"];
/** 요약 형식 버전 — 올리면 예전 요약은 받아쓰기를 재사용해 다시 요약된다 (src/lib/video-summary.ts 와 같게) */
const SUMMARY_VERSION = 2;
type SummaryItem = { text: string; segs: string[]; t: number; quote?: string };
type PriceLevel = { coin: string; price: string; kind: string; segs: string[]; t: number; quote: string };
type VideoSummary = {
  overview: SummaryItem[];
  points: SummaryItem[];
  levels: PriceLevel[];
  stance: { label: string; reason: string; segs: string[]; t: number } | null;
  dropped: number;
  noSpeech: boolean;
  videoType: VideoType;
  version: number;
  model: { transcribe: string; text: string };
};
type Lang = "ko" | "en";

type SummaryJob = {
  v: 1;
  videoId: string;
  /** 요약 언어 (없으면 ko). 받아쓰기는 언어와 무관하게 원문 그대로 */
  lang?: Lang;
  title: string;
  channelTitle: string;
  durationSec: number;
  status: "transcribing" | "summarizing" | "verifying" | "done" | "failed";
  chunks: Array<{ start: number; end: number; segments: Seg[] | null; attempts: number }>;
  draft: Draft | null;
  attempts: number;
  summary: VideoSummary | null;
  error: string | null;
  lockedUntil: number;
  createdAt: number;
  updatedAt: number;
};

// ── DB (PostgREST) ───────────────────────────────────────

const keyOf = (videoId: string, lang: Lang = "ko") => (lang === "ko" ? `summary:v1:${videoId}` : `summary:v1:${videoId}:${lang}`);
const isLang = (v: unknown): v is Lang => v === "ko" || v === "en";

/** Supabase가 자동으로 넣어 주는 키 사용 (새 sb_secret 키 우선, 없으면 구형 service_role) */
function dbKey() {
  try {
    const keys = JSON.parse(env("SUPABASE_SECRET_KEYS") || "{}") as Record<string, string>;
    const first = keys.default ?? Object.values(keys)[0];
    if (first) return first;
  } catch {
    // 무시하고 아래로
  }
  return env("SUPABASE_SERVICE_ROLE_KEY");
}

function dbHeaders(extra: Record<string, string> = {}) {
  const key = dbKey();
  const headers: Record<string, string> = { apikey: key, "content-type": "application/json", ...extra };
  // 구형 JWT 키는 Authorization 헤더도 필요
  if (key.startsWith("eyJ")) headers.authorization = `Bearer ${key}`;
  return headers;
}

async function loadJob(videoId: string, lang: Lang): Promise<SummaryJob | null> {
  const url = `${env("SUPABASE_URL")}/rest/v1/YOUTUBE_SEARCH_CACHE?select=payload&query_key=eq.${encodeURIComponent(keyOf(videoId, lang))}`;
  const res = await fetch(url, { headers: dbHeaders() });
  if (!res.ok) throw new Error(`DB 읽기 실패 ${res.status}`);
  const rows = (await res.json()) as Array<{ payload: SummaryJob }>;
  return rows[0]?.payload ?? null;
}

async function saveJob(job: SummaryJob) {
  job.updatedAt = Date.now();
  const res = await fetch(`${env("SUPABASE_URL")}/rest/v1/YOUTUBE_SEARCH_CACHE`, {
    method: "POST",
    headers: dbHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify({ query_key: keyOf(job.videoId, job.lang ?? "ko"), payload: job, fetched_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`DB 저장 실패 ${res.status}: ${await res.text()}`);
}

// ── Vertex AI (서비스 계정 JWT) ──────────────────────────

let cachedToken: { token: string; exp: number } | null = null;

function b64url(input: ArrayBuffer | string) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function serviceAccount() {
  const raw = env("GOOGLE_SERVICE_ACCOUNT_CREDENTIALS");
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_CREDENTIALS 없음");
  const sa = JSON.parse(raw) as { client_email: string; private_key: string; project_id: string; token_uri?: string };
  return { ...sa, private_key: sa.private_key.replace(/\\n/g, "\n") };
}

async function accessToken() {
  if (cachedToken && cachedToken.exp - 60_000 > Date.now()) return cachedToken.token;
  const sa = serviceAccount();
  const tokenUri = sa.token_uri ?? "https://oauth2.googleapis.com/token";
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(
    JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/cloud-platform", aud: tokenUri, iat: now, exp: now + 3600 }),
  )}`;
  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const res = await fetch(tokenUri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${b64url(sig)}` }),
  });
  const data = (await res.json()) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!res.ok || !data.access_token) throw new Error(`Google 토큰 실패: ${data.error_description ?? res.status}`);
  cachedToken = { token: data.access_token, exp: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return data.access_token;
}

type Part =
  | { text: string }
  | { fileData: { fileUri: string; mimeType: string }; videoMetadata?: { startOffset?: string; endOffset?: string } };

async function generate(opts: {
  model: string;
  parts: Part[];
  schema: Record<string, unknown>;
  mediaLow?: boolean;
  thinkingLow?: boolean;
  maxOutputTokens?: number;
}): Promise<string> {
  const sa = serviceAccount();
  const location = env("GOOGLE_VERTEX_LOCATION") || "global";
  const host = location === "global" ? "aiplatform.googleapis.com" : `${location}-aiplatform.googleapis.com`;
  const url = `https://${host}/v1/projects/${sa.project_id}/locations/${location}/publishers/google/models/${opts.model}:generateContent`;
  const generationConfig: Record<string, unknown> = {
    temperature: 0,
    maxOutputTokens: opts.maxOutputTokens ?? 8192,
    responseMimeType: "application/json",
    responseSchema: opts.schema,
  };
  if (opts.mediaLow) generationConfig.mediaResolution = "MEDIA_RESOLUTION_LOW";
  if (opts.thinkingLow) generationConfig.thinkingConfig = { thinkingLevel: "LOW" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), STEP_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${await accessToken()}`, "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: opts.parts }], generationConfig }),
      signal: controller.signal,
    });
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message?: string };
    };
    if (!res.ok) throw new Error(data.error?.message || `Gemini ${res.status}`);
    return (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
  } finally {
    clearTimeout(timer);
  }
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
  if (!parts.length || parts.some((n) => !Number.isFinite(n))) return NaN;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

/** 비교용 정규화: 소문자, 공백·문장부호 제거 */
function norm(text: string) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s.,!?·…'"“”‘’`()[\]{}<>:;~\-_/\\|*#@%^&+=]/g, "");
}

/** 숫자 토큰 (1,234 → 1234) */
function numbersIn(text: string) {
  return (text.normalize("NFKC").match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((n) => n.replace(/,/g, ""));
}

function allSegments(job: SummaryJob): Segment[] {
  let n = 0;
  return job.chunks.flatMap((chunk) => (chunk.segments ?? []).map((seg) => ({ id: `S${++n}`, t: seg.t, text: seg.text })));
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
    "- 숫자·가격·코인·종목·지수 이름은 들린 그대로 적는다 (예: 나스닥, S&P500, 엔비디아).",
    "- 15~40초 단위 문단으로 나누고, 각 문단 시작 시각을 영상 전체 기준으로 적는다.",
    "- 잘 안 들리는 부분은 추측하지 말고 [불분명]이라고 적는다.",
    "- 말소리가 전혀 없으면 segments를 빈 배열로 둔다.",
  ].join("\n");

  const text = await generate({
    model: TRANSCRIBE_MODEL,
    parts: [
      {
        fileData: { fileUri: `https://www.youtube.com/watch?v=${job.videoId}`, mimeType: "video/*" },
        videoMetadata: { startOffset: `${chunk.start}s`, endOffset: `${chunk.end}s` },
      },
      { text: prompt },
    ],
    schema: TRANSCRIPT_SCHEMA,
    mediaLow: true,
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

const KIND_ENUM: Record<Lang, string[]> = {
  ko: ["지지", "저항", "목표", "손절", "현재가", "기타"],
  en: ["Support", "Resistance", "Target", "Stop-loss", "Current", "Other"],
};
const STANCE_ENUM: Record<Lang, string[]> = {
  ko: ["상승", "하락", "중립", "혼재", "불명확"],
  en: ["Bullish", "Bearish", "Neutral", "Mixed", "Unclear"],
};

const draftSchema = (lang: Lang) => ({
  type: "OBJECT",
  properties: {
    is_speech: { type: "BOOLEAN", description: "요약할 만한 발언이 있으면 true" },
    video_type: {
      type: "STRING",
      enum: VIDEO_TYPES,
      description: "analysis=화자가 방향·가격·매매 판단을 근거와 함께 직접 말함 / news=사건·발표 소식 전달 / general=사용법·개념 설명·강의·인터뷰 등 그 밖",
    },
    type_segs: {
      type: "ARRAY",
      description: "video_type 판단의 근거 문단 번호. analysis면 화자가 전망·가격·매매 판단을 말한 문단",
      items: { type: "STRING" },
    },
    overview: {
      type: "ARRAY",
      description: "영상 전체 요지 1~3문장 (무엇을 다루고 화자가 결국 무슨 말을 하는지)",
      items: {
        type: "OBJECT",
        properties: { text: { type: "STRING" }, segs: { type: "ARRAY", items: { type: "STRING" } } },
        required: ["text", "segs"],
      },
    },
    points: {
      type: "ARRAY",
      description: "analysis면 화자의 주장과 그 근거, news·general이면 주요 내용. 영상 순서대로 3~8개",
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
      description: "analysis일 때만. 화자가 직접 말한 가격대만. 없거나 analysis가 아니면 빈 배열",
      items: {
        type: "OBJECT",
        properties: {
          coin: { type: "STRING", description: "가격이 언급된 대상 (코인·종목·지수 이름, 예: 비트코인, 나스닥, 엔비디아)" },
          price: { type: "STRING", description: "받아쓰기에 적힌 표기 그대로" },
          kind: { type: "STRING", enum: KIND_ENUM[lang] },
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
        label: { type: "STRING", enum: STANCE_ENUM[lang] },
        reason: { type: "STRING" },
        segs: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["label", "reason", "segs"],
    },
  },
  required: ["is_speech", "video_type", "type_segs", "overview", "points", "levels"],
});

async function summarize(job: SummaryJob) {
  const lang: Lang = job.lang ?? "ko";
  const outLang = lang === "en" ? "영어(English)" : "한국어";
  const transcript = allSegments(job)
    .map((s) => `[${s.id} | ${mmss(s.t)}] ${s.text}`)
    .join("\n");
  const en = lang === "en";
  const prompt = [
    `아래는 유튜브 영상의 받아쓰기 원문이다. 이 원문에 적힌 내용만 근거로 ${outLang} 요약을 만들어라.`,
    "",
    "절대 규칙 (어기면 그 항목은 버려진다):",
    "1. 원문에 없는 사실·숫자·전망·배경지식을 절대 추가하지 마라. 네가 아는 시장 정보, 최근 시세, 일반 상식도 쓰지 마라.",
    "2. 원문 내용을 부풀리거나 단정하지 마라. 화자가 '~일 수도 있다'고 했으면 그 정도로만 써라.",
    en
      ? "3. 화자의 의견·예상은 사실처럼 쓰지 말고 'The speaker says/expects ...'처럼 화자의 말로 적어라. 화자가 전한 소식도 'According to the video, ...'처럼 출처를 밝혀라."
      : "3. 화자의 의견·예상은 사실처럼 쓰지 말고 '화자는 ~라고 본다/예상한다'처럼 화자의 말로 적어라. 화자가 전한 소식도 '영상에 따르면 ~'처럼 출처를 밝혀라.",
    en
      ? "3-1. Any judgment, interpretation, forecast or recommendation by the speaker ('should', 'the cause is', 'the key is') must be attributed to the speaker. Never state it as plain fact."
      : "3-1. 화자의 판단·해석·전망·권유('~해야 한다', '~가 원인이다', '~가 핵심이다')는 반드시 '화자는 ~라고 본다/말한다/강조한다'처럼 적어라. 화자 없이 단정하는 문장을 쓰지 마라. 단, 사용법 설명의 절차(앱을 설치한다 등)는 그대로 써도 된다.",
    '4. 모든 항목에 근거 문단 번호(segs, 예: ["S3","S4"])를 붙여라. 근거를 댈 수 없는 내용은 쓰지 마라.',
    "5. quote는 근거 문단에서 글자 그대로 복사한 원문이어야 한다. 번역하거나 고치지 마라 (외국어면 외국어 그대로).",
    "6. 숫자·가격·날짜는 원문 표기 그대로 옮겨라 (예: 원문이 '9만 2천'이면 '9만 2천', '92,000'이면 '92,000').",
    `7. 요약 문장(overview.text, points.claim, stance.reason)은 원문 언어와 상관없이 반드시 ${outLang}로 써라. levels.coin(대상 이름)도 ${outLang}로 써라.`,
    "8. 광고·협찬·구독 요청·인사말·채널 홍보는 요약하지 마라.",
    "9. 받아쓰기가 잘못 들은 것 같은 부분(앞뒤가 안 맞는 단어·숫자)은 추측해서 고치지 말고 빼라.",
    "",
    "먼저 영상 종류(video_type)를 정하라. 제목·채널명이 아니라 받아쓴 내용으로만 판단한다:",
    "- analysis: 화자가 코인·주식·지수 등의 방향(상승/하락), 가격대, 매수·매도·관망 판단을 근거와 함께 직접 말하는 분석·전망 영상.",
    "- news: 사건·발표·정책·규제·기업/프로젝트 소식을 전하는 영상. 화자의 시장 전망이 중심이 아니다.",
    "- general: 사용법·가입 방법·개념 설명, 강의, 인터뷰, 토크, 잡담 등 위 둘에 해당하지 않는 영상.",
    "- 소식을 전하면서도 화자가 지지·저항 가격대, 매매 대응, 방향 판단을 여러 차례 구체적으로 말하면 analysis다.",
    "- 소식 전달이 대부분이고 끝에 한두 마디 전망을 덧붙인 정도면 news다. 제목이 '분석', '전망'이어도 내용에 화자의 판단과 근거가 없으면 analysis가 아니다.",
    "- type_segs에 판단 근거가 된 문단 번호를 넣어라.",
    "",
    "종류별로 다르게 써라:",
    "[analysis]",
    "- overview: 화자가 무엇을 분석했고 결론적으로 어떻게 보는지.",
    "- points: 화자의 주장과 그 근거(차트 패턴, 지표, 수급, 뉴스 등 화자가 직접 든 이유), 화자가 말한 조건·시나리오('~를 넘으면', '~를 깨면')와 위험 요인.",
    "- levels: 화자가 직접 말한 가격대만 (지지·저항·목표·손절·현재가). 확실하지 않으면 빼라.",
    "- stance: 화자가 전체적으로 밝힌 방향. 화자가 방향을 분명히 말하지 않았으면 '불명확'/'Unclear' 또는 null.",
    "[news]",
    "- overview: 어떤 소식/주제를 다루는지와 핵심 내용.",
    "- points: 누가·무엇을·언제·얼마나 같은 사실 정보와 영상이 설명한 배경·영향. 사실 전달은 '영상에 따르면', 화자 해석은 '화자는 ~라고 본다'로 구분.",
    "- levels는 빈 배열, stance는 null.",
    "[general]",
    "- overview: 영상의 주제와 화자가 결국 전하려는 말.",
    "- points: 영상에서 다룬 주요 내용·조언·사례·절차를 순서대로. 사용법 영상이면 단계별로.",
    "- levels는 빈 배열, stance는 null.",
    "",
    "좋은 요약의 조건: 구체적일 것(대상·숫자·이유를 원문 그대로 담기), 서로 겹치지 않을 것, 영상 순서를 따를 것, 한 항목은 한두 문장.",
    "overview는 반드시 1개 이상, 각각 한 문장으로 쓰고 segs를 붙여라. overview에는 숫자·가격·지표 이름을 넣지 말고(그건 points·levels에) 주제와 화자의 결론만 담아라. segs에는 그 결론을 화자가 직접 말한 문단만 넣어라. 대상에 대한 설명(어떤 회사·거래소인지 등)을 원문에 없는데 덧붙이지 마라.",
    en
      ? "Write in plain, natural English. Check spelling."
      : "문체: '~다'로 끝나는 간결한 평서문으로 통일하고(예: '화자는 ~라고 본다'), 맞춤법과 띄어쓰기를 지켜라. 받아쓰기의 오타는 바로잡아 옮기되 뜻은 바꾸지 마라.",
    "",
    `영상 제목(참고용, 근거로 쓰지 마라): ${job.title}`,
    `채널: ${job.channelTitle}`,
    "",
    "[받아쓰기 원문]",
    transcript,
  ].join("\n");

  const text = await generate({ model: TEXT_MODEL, parts: [{ text: prompt }], schema: draftSchema(lang) });
  const draft = JSON.parse(text) as Draft;
  if (!VIDEO_TYPES.includes(draft.video_type)) draft.video_type = "general";
  job.draft = draft;
}

// ── 3) 검증 ──────────────────────────────────────────────

const VERIFY_SCHEMA = {
  type: "OBJECT",
  properties: {
    results: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { id: { type: "STRING" }, supported: { type: "BOOLEAN" } },
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
    const unique = Array.from(new Set(segs ?? []));
    const found = unique.map((id) => byId.get(id)).filter((s): s is Segment => Boolean(s));
    return found.length === unique.length && found.length > 0 ? found : null;
  };
  const sourceText = (found: Segment[]) => found.map((s) => s.text).join(" ");
  const numbersOk = (claim: string, found: Segment[]) => {
    const source = new Set(numbersIn(sourceText(found)));
    return numbersIn(claim).every((n) => source.has(n));
  };
  const quoteOk = (quote: string, found: Segment[]) => {
    const q = norm(quote ?? "");
    return q.length >= 4 && norm(sourceText(found)).includes(q);
  };

  // 종류 판단도 원문으로 확인한다: analysis라면서 근거 문단이 없거나 그 문단에 판단이 없으면 news로 낮춘다
  let videoType: VideoType = VIDEO_TYPES.includes(draft.video_type) ? draft.video_type : "general";
  const typeFound = videoType === "analysis" ? cited(draft.type_segs ?? []) : null;
  if (videoType === "analysis" && !typeFound) videoType = "news";
  if (videoType !== "analysis") {
    // 가격대·관점은 아예 만들지 않는다 (버린 항목으로 세지 않음)
    draft.levels = [];
    draft.stance = null;
  }

  // (a)(b) 코드 검증
  type Candidate = { id: string; text: string; found: Segment[]; kind: "overview" | "point" | "level" | "stance" | "type"; index: number };
  const candidates: Candidate[] = [];

  (draft.overview ?? []).forEach((item, index) => {
    const found = cited(item.segs);
    if (!found || !numbersOk(item.text, found)) return void dropped++;
    candidates.push({ id: `O${index}`, text: item.text, found, kind: "overview", index });
  });
  (draft.points ?? []).forEach((item, index) => {
    const found = cited(item.segs);
    if (!found || !quoteOk(item.quote, found) || !numbersOk(item.claim, found)) return void dropped++;
    candidates.push({ id: `P${index}`, text: item.claim, found, kind: "point", index });
  });
  (draft.levels ?? []).forEach((item, index) => {
    const found = cited(item.segs);
    const priceNums = numbersIn(item.price ?? "");
    const quoteNums = numbersIn(item.quote ?? "");
    const priceInQuote = priceNums.length > 0 && priceNums.every((n) => quoteNums.includes(n));
    if (!found || !quoteOk(item.quote, found) || !priceInQuote) return void dropped++;
    candidates.push({ id: `L${index}`, text: `${item.coin} ${item.price} (${item.kind})`, found, kind: "level", index });
  });
  if (typeFound) {
    candidates.push({
      id: "K0",
      text: "화자가 이 대목에서 코인·주식·지수의 방향, 가격대, 또는 매수·매도·관망 판단을 자기 의견으로 직접 말한다 (단순 소식 전달이 아님)",
      found: typeFound,
      kind: "type",
      index: 0,
    });
  }
  if (draft.stance) {
    const found = cited(draft.stance.segs);
    if (!found || !numbersOk(draft.stance.reason, found)) dropped++;
    else candidates.push({ id: "T0", text: `화자의 관점(speaker's view): ${draft.stance.label} — ${draft.stance.reason}`, found, kind: "stance", index: 0 });
  }

  // (c) 의미 검증: 근거 원문만으로 성립하는가
  let supported = new Set<string>();
  if (candidates.length) {
    const prompt = [
      "각 항목이 함께 주어진 '근거 원문'만으로 성립하는지 엄격하게 판정하라.",
      "- 근거 원문에 직접 나오거나 명백히 같은 뜻일 때만 supported=true.",
      "- 근거에 없는 내용이 조금이라도 추가됐거나, 숫자·대상·시점이 다르면 false.",
      "- 화자의 판단·전망·해석·권유를 '화자는 ~'처럼 화자의 말로 쓰지 않고 객관적 사실처럼 단정했으면 false. (예: 화자가 'A 때문인 것 같다'고 했는데 항목이 'A가 원인이다'면 false)",
      "- 항목이 화자보다 더 강하게 단정하거나(가능성 → 확정) 뜻을 바꿨으면 false.",
      "- 사용법·절차 설명이나 화자가 전한 소식을 '영상에 따르면'처럼 옮긴 것은 근거와 같으면 true.",
      "- 원문이 외국어이고 항목이 한국어여도 뜻이 정확히 같으면 true.",
      "- 너의 배경지식으로 판단하지 마라.",
      "",
      ...candidates.map((c) => [`### ${c.id}`, `항목: ${c.text}`, "근거 원문:", ...c.found.map((s) => `[${s.id}] ${s.text}`)].join("\n")),
    ].join("\n");
    const text = await generate({ model: TEXT_MODEL, parts: [{ text: prompt }], schema: VERIFY_SCHEMA, thinkingLow: true });
    const parsed = JSON.parse(text) as { results?: Array<{ id: string; supported: boolean }> };
    supported = new Set((parsed.results ?? []).filter((r) => r.supported === true).map((r) => r.id));
  }

  // 종류 판정이 원문으로 확인되지 않으면 분석 영상으로 보지 않는다 → 가격대·관점도 보여 주지 않는다
  if (typeFound && !supported.has("K0")) {
    videoType = "news";
    for (const c of candidates) if (c.kind === "level" || c.kind === "stance") supported.delete(c.id);
  }

  const summary: VideoSummary = {
    overview: [],
    points: [],
    levels: [],
    stance: null,
    dropped,
    noSpeech: !draft.is_speech || segments.length === 0,
    videoType,
    version: SUMMARY_VERSION,
    model: { transcribe: TRANSCRIBE_MODEL, text: TEXT_MODEL },
  };
  for (const c of candidates) {
    if (c.kind === "type") continue;
    if (!supported.has(c.id)) {
      summary.dropped++;
      continue;
    }
    const segs = c.found.map((s) => s.id);
    const t = Math.min(...c.found.map((s) => s.t));
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

/** 한 단계 진행. 진행했으면 true, 할 게 없으면(끝났거나 다른 실행이 잡고 있음) false */
async function step(videoId: string, lang: Lang): Promise<boolean> {
  const job = await loadJob(videoId, lang);
  if (!job || job.status === "done" || job.status === "failed") return false;
  if (job.lockedUntil > Date.now()) return false;

  job.lockedUntil = Date.now() + LOCK_MS;
  await saveJob(job);

  try {
    if (job.status === "transcribing") {
      // 남은 구간을 한꺼번에(최대 TRANSCRIBE_PARALLEL개) 받아쓴다 — 구간 하나가 15~50초라 순서대로 하면 너무 느리다
      const pending = job.chunks
        .map((c, i) => ({ c, i }))
        .filter(({ c }) => !c.segments)
        .slice(0, TRANSCRIBE_PARALLEL);
      const results = await Promise.allSettled(
        pending.map(({ c, i }) => {
          c.attempts++;
          return transcribeChunk(job, i);
        }),
      );
      results.forEach((r, k) => {
        if (r.status === "rejected") {
          const { c, i } = pending[k];
          console.warn("transcribe retry", videoId, i, String(r.reason));
          if (c.attempts >= MAX_ATTEMPTS) throw r.reason;
        }
      });
      if (job.chunks.every((c) => c.segments)) job.status = "summarizing";
    } else if (job.status === "summarizing") {
      job.attempts++;
      try {
        await summarize(job);
        job.status = "verifying";
        job.attempts = 0;
      } catch (error) {
        if (job.attempts >= MAX_ATTEMPTS) throw error;
        console.warn("summarize retry", videoId, String(error));
      }
    } else if (job.status === "verifying") {
      job.attempts++;
      try {
        await verify(job);
        job.status = "done";
        job.draft = null;
      } catch (error) {
        if (job.attempts >= MAX_ATTEMPTS) throw error;
        console.warn("verify retry", videoId, String(error));
      }
    }
  } catch (error) {
    console.error("summary failed", videoId, String(error));
    job.status = "failed";
    job.error = "요약을 만들지 못했어요. 잠시 후 다시 시도해 주세요.";
  } finally {
    job.lockedUntil = 0;
    await saveJob(job);
  }
  return job.status !== "done" && job.status !== "failed";
}

async function kickSelf(videoId: string, lang: Lang, hop: number) {
  await fetch(`${env("SUPABASE_URL")}/functions/v1/video-summary-worker`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-worker-secret": env("VIDEO_SUMMARY_WORKER_SECRET") },
    body: JSON.stringify({ videoId, lang, hop }),
  }).catch((error) => console.error("kickSelf failed", String(error)));
}

async function run(videoId: string, lang: Lang, hop: number) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < START_STEP_BEFORE_MS) {
    const more = await step(videoId, lang);
    if (!more) return;
  }
  // 시간 예산을 다 썼는데 아직 남았으면 새 실행으로 이어간다 (무한 루프 방지: 최대 40번)
  if (hop < 40) await kickSelf(videoId, lang, hop + 1);
}

function timingSafeEqual(a: string, b: string) {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const secret = env("VIDEO_SUMMARY_WORKER_SECRET");
  if (!secret || !timingSafeEqual(req.headers.get("x-worker-secret") ?? "", secret)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { videoId?: string; lang?: string; hop?: number };
  const lang: Lang = isLang(body.lang) ? body.lang : "ko";
  const videoId = body.videoId ?? "";
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return new Response("Bad Request", { status: 400 });

  const hop = Math.min(Math.max(0, Math.floor(Number(body.hop) || 0)), 40);
  const work = run(videoId, lang, hop).catch((error) => console.error("run failed", videoId, String(error)));
  if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(work);
  else await work;
  return new Response(JSON.stringify({ accepted: true }), { status: 202, headers: { "content-type": "application/json" } });
});
