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

// ── 타입 (src/lib/video-summary.ts 와 동일) ──────────────

type Seg = { t: number; text: string };
type Segment = { id: string; t: number; text: string };
type Draft = {
  overview: Array<{ text: string; segs: string[] }>;
  points: Array<{ claim: string; segs: string[]; quote: string }>;
  levels: Array<{ coin: string; price: string; kind: string; segs: string[]; quote: string }>;
  stance: { label: string; reason: string; segs: string[] } | null;
  is_speech: boolean;
};
type SummaryItem = { text: string; segs: string[]; t: number; quote?: string };
type PriceLevel = { coin: string; price: string; kind: string; segs: string[]; t: number; quote: string };
type VideoSummary = {
  overview: SummaryItem[];
  points: SummaryItem[];
  levels: PriceLevel[];
  stance: { label: string; reason: string; segs: string[]; t: number } | null;
  dropped: number;
  noSpeech: boolean;
  model: { transcribe: string; text: string };
};
type SummaryJob = {
  v: 1;
  videoId: string;
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

const keyOf = (videoId: string) => `summary:v1:${videoId}`;

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

async function loadJob(videoId: string): Promise<SummaryJob | null> {
  const url = `${env("SUPABASE_URL")}/rest/v1/YOUTUBE_SEARCH_CACHE?select=payload&query_key=eq.${encodeURIComponent(keyOf(videoId))}`;
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
    body: JSON.stringify({ query_key: keyOf(job.videoId), payload: job, fetched_at: new Date().toISOString() }),
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
    "- 숫자·가격·코인 이름은 들린 그대로 적는다.",
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
  const transcript = allSegments(job)
    .map((s) => `[${s.id} | ${mmss(s.t)}] ${s.text}`)
    .join("\n");
  const prompt = [
    "아래는 유튜브 영상의 받아쓰기 원문이다. 이 원문에 적힌 내용만 근거로 한국어 요약을 만들어라.",
    "",
    "절대 규칙:",
    "1. 원문에 없는 사실·숫자·전망·배경지식을 절대 추가하지 마라. 네가 아는 시장 정보도 쓰지 마라.",
    "2. 화자의 의견은 사실처럼 쓰지 말고 '화자는 ~라고 본다/말한다'처럼 화자의 말로 적어라.",
    '3. 모든 항목에 근거 문단 번호(segs, 예: ["S3","S4"])를 붙여라. 근거를 댈 수 없는 내용은 쓰지 마라.',
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

  const text = await generate({ model: TEXT_MODEL, parts: [{ text: prompt }], schema: DRAFT_SCHEMA, thinkingLow: true });
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

  // (a)(b) 코드 검증
  type Candidate = { id: string; text: string; found: Segment[]; kind: "overview" | "point" | "level" | "stance"; index: number };
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
  if (draft.stance) {
    const found = cited(draft.stance.segs);
    if (!found || !numbersOk(draft.stance.reason, found)) dropped++;
    else candidates.push({ id: "T0", text: `화자의 관점: ${draft.stance.label} — ${draft.stance.reason}`, found, kind: "stance", index: 0 });
  }

  // (c) 의미 검증: 근거 원문만으로 성립하는가
  let supported = new Set<string>();
  if (candidates.length) {
    const prompt = [
      "각 항목이 함께 주어진 '근거 원문'만으로 성립하는지 엄격하게 판정하라.",
      "- 근거 원문에 직접 나오거나 명백히 같은 뜻일 때만 supported=true.",
      "- 근거에 없는 내용이 조금이라도 추가됐거나, 화자의 의견을 사실처럼 단정했거나, 숫자·대상이 다르면 false.",
      "- 원문이 외국어이고 항목이 한국어여도 뜻이 정확히 같으면 true.",
      "- 너의 배경지식으로 판단하지 마라.",
      "",
      ...candidates.map((c) => [`### ${c.id}`, `항목: ${c.text}`, "근거 원문:", ...c.found.map((s) => `[${s.id}] ${s.text}`)].join("\n")),
    ].join("\n");
    const text = await generate({ model: TEXT_MODEL, parts: [{ text: prompt }], schema: VERIFY_SCHEMA, thinkingLow: true });
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
    model: { transcribe: TRANSCRIBE_MODEL, text: TEXT_MODEL },
  };
  for (const c of candidates) {
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
async function step(videoId: string): Promise<boolean> {
  const job = await loadJob(videoId);
  if (!job || job.status === "done" || job.status === "failed") return false;
  if (job.lockedUntil > Date.now()) return false;

  job.lockedUntil = Date.now() + LOCK_MS;
  await saveJob(job);

  try {
    if (job.status === "transcribing") {
      const index = job.chunks.findIndex((c) => !c.segments);
      if (index !== -1) {
        job.chunks[index].attempts++;
        try {
          await transcribeChunk(job, index);
        } catch (error) {
          if (job.chunks[index].attempts >= MAX_ATTEMPTS) throw error;
          console.warn("transcribe retry", videoId, index, String(error));
        }
      }
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

async function kickSelf(videoId: string, hop: number) {
  await fetch(`${env("SUPABASE_URL")}/functions/v1/video-summary-worker`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-worker-secret": env("VIDEO_SUMMARY_WORKER_SECRET") },
    body: JSON.stringify({ videoId, hop }),
  }).catch((error) => console.error("kickSelf failed", String(error)));
}

async function run(videoId: string, hop: number) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < START_STEP_BEFORE_MS) {
    const more = await step(videoId);
    if (!more) return;
  }
  // 시간 예산을 다 썼는데 아직 남았으면 새 실행으로 이어간다 (무한 루프 방지: 최대 40번)
  if (hop < 40) await kickSelf(videoId, hop + 1);
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
  const body = (await req.json().catch(() => ({}))) as { videoId?: string; hop?: number };
  const videoId = body.videoId ?? "";
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return new Response("Bad Request", { status: 400 });

  const work = run(videoId, Number(body.hop) || 0).catch((error) => console.error("run failed", videoId, String(error)));
  if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(work);
  else await work;
  return new Response(JSON.stringify({ accepted: true }), { status: 202, headers: { "content-type": "application/json" } });
});
