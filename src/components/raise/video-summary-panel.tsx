"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";

type Segment = { id: string; t: number; text: string };
type Item = { text: string; segs: string[]; t: number; quote?: string };
type Level = { coin: string; price: string; kind: string; segs: string[]; t: number; quote: string };
type Summary = {
  overview: Item[];
  points: Item[];
  levels: Level[];
  stance: { label: string; reason: string; segs: string[]; t: number } | null;
  dropped: number;
  noSpeech: boolean;
};
type View = {
  status: "transcribing" | "summarizing" | "verifying" | "done" | "failed";
  progress: { done: number; total: number };
  summary: Summary | null;
  transcript: Segment[] | null;
  error: string | null;
};
type Quota = { used: number; limit: number };

function mmss(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

function TimeButton({ t, onSeek }: { t: number; onSeek: (sec: number) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSeek(Math.floor(t))}
      title="이 시점부터 영상 보기"
      className="mt-0.5 min-h-8 shrink-0 rounded-md border border-[var(--rz-accent)]/35 bg-[var(--rz-accent-soft)] px-2 py-1 font-mono text-[11px] font-medium text-[var(--rz-accent)] transition hover:border-[var(--rz-accent)]/60 hover:bg-[var(--rz-accent)]/20 sm:min-h-0 sm:px-1.5 sm:py-0.5"
    >
      {mmss(t)}
    </button>
  );
}

function AiSparkIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M12 3l1.4 5.1L18.5 9.5l-5.1 1.4L12 16l-1.4-5.1L5.5 9.5l5.1-1.4L12 3z"
        fill="currentColor"
        opacity="0.95"
      />
      <path d="M18.5 14.5l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3z" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <span className="h-3 w-0.5 shrink-0 rounded-full bg-[var(--rz-accent)]" aria-hidden />
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--rz-accent)] sm:tracking-[0.14em]">
        {children}
      </p>
    </div>
  );
}

function SummaryRow({ t, onSeek, children }: { t: number; onSeek: (sec: number) => void; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 sm:gap-3">
      <TimeButton t={t} onSeek={onSeek} />
      <div className="min-w-0 flex-1 break-words">{children}</div>
    </li>
  );
}

const STANCE_COLOR: Record<string, string> = {
  상승: "text-[var(--rz-up)]",
  하락: "text-[var(--rz-down)]",
};

const STANCE_BG: Record<string, string> = {
  상승: "border-[var(--rz-up)]/30 bg-[var(--rz-up)]/10",
  하락: "border-[var(--rz-down)]/30 bg-[var(--rz-down)]/10",
};

export function VideoSummaryPanel({ videoId, onSeek }: { videoId: string; onSeek: (sec: number) => void }) {
  const { me, requireLogin, refresh } = useAuth();
  const [view, setView] = useState<View | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
    };
  }, []);

  const start = async (retry = false) => {
    if (!requireLogin()) return;
    setError(null);
    setRunning(true);
    let first = true;
    try {
      for (let i = 0; i < 400 && !cancelled.current; i++) {
        const res = await fetch("/api/youtube/summary", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ videoId, retry: retry && first }),
        });
        first = false;
        const data = (await res.json().catch(() => ({}))) as { item?: View; quota?: Quota; error?: string; code?: string };
        if (data.quota) setQuota({ used: data.quota.used, limit: data.quota.limit });
        if (res.status === 401) {
          requireLogin();
          return;
        }
        if (!res.ok || !data.item) {
          setError(data.error ?? "요약을 만들지 못했어요.");
          return;
        }
        setView(data.item);
        if (data.item.status === "done" || data.item.status === "failed") return;
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch {
      setError("요약을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setRunning(false);
      void refresh();
    }
  };

  const usage = quota ?? me?.aiUsage ?? null;
  const summary = view?.status === "done" ? view.summary : null;

  const statusText = (() => {
    if (!view) return "준비 중…";
    if (view.status === "transcribing") return `영상 받아쓰는 중 (${view.progress.done}/${view.progress.total} 구간)`;
    if (view.status === "summarizing") return "받아쓴 내용으로 요약하는 중";
    if (view.status === "verifying") return "요약이 영상 내용과 맞는지 확인하는 중";
    return "";
  })();

  const progressWidth = !view
    ? 3
    : view.status === "transcribing"
      ? 5 + (view.progress.done / Math.max(1, view.progress.total)) * 75
      : view.status === "summarizing"
        ? 85
        : 95;

  const shellClass =
    "relative mt-3 overflow-hidden rounded-2xl border border-[var(--rz-accent)]/30 bg-[linear-gradient(160deg,rgb(225_29_72_/_0.14),rgb(18_22_30_/_0.95)_42%,rgb(18_22_30)_100%)] p-3.5 shadow-[0_12px_40px_rgb(225_29_72_/_0.12)] sm:p-5";

  const cardClass = "rounded-xl border border-[var(--rz-line)] bg-[var(--rz-bg)]/45 p-3 sm:p-3.5";

  // 시작 전
  if (!view && !running) {
    return (
      <div className={shellClass}>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-10 hidden h-32 w-32 rounded-full bg-[var(--rz-accent)]/20 blur-3xl sm:block"
        />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-[var(--rz-accent)]/35 bg-[var(--rz-accent-soft)] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[var(--rz-accent)]">
              <AiSparkIcon />
              AI SUMMARY
            </div>
            <p className="font-[family-name:var(--font-brand-display)] text-[15px] font-semibold tracking-tight text-white sm:text-lg">
              AI 영상 요약
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--rz-muted)] sm:max-w-md">
              영상에서 실제로 나온 말만 근거로 한국어로 핵심을 정리해요.
              {me && usage ? ` 오늘 ${usage.used}/${usage.limit}회 사용` : " 로그인 후 하루 5회"}
            </p>
            {error ? <p className="mt-2 text-xs text-[var(--rz-up)]">{error}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => void start()}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--rz-accent)] px-4 py-3 text-sm font-semibold text-[var(--rz-accent-fg)] shadow-[0_8px_20px_rgb(225_29_72_/_0.35)] transition hover:brightness-110 sm:w-auto sm:shrink-0 sm:py-2.5"
          >
            <AiSparkIcon />
            {me ? "AI 요약 보기" : "로그인하고 AI 요약 보기"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 hidden h-36 w-36 rounded-full bg-[var(--rz-accent)]/15 blur-3xl sm:block"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-[var(--rz-accent)]/35 bg-[var(--rz-accent-soft)] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[var(--rz-accent)]">
            <AiSparkIcon />
            AI SUMMARY
          </div>
          <p className="font-[family-name:var(--font-brand-display)] text-[15px] font-semibold tracking-tight text-white sm:text-base">
            AI 영상 요약
          </p>
        </div>
        {usage ? (
          <span className="shrink-0 rounded-lg border border-[var(--rz-line)] bg-[var(--rz-panel)]/80 px-2 py-1 text-[10px] text-[var(--rz-muted)] sm:px-2.5 sm:text-[11px]">
            오늘 {usage.used}/{usage.limit}회
          </span>
        ) : null}
      </div>

      {view?.status !== "done" && view?.status !== "failed" ? (
        <div className="relative mt-3 rounded-xl border border-[var(--rz-line)] bg-[var(--rz-bg)]/55 p-3 sm:mt-4 sm:p-3.5">
          <div className="flex items-start gap-2 text-xs text-[var(--rz-text)] sm:items-center">
            <span className="mt-0.5 inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-[var(--rz-accent)]/30 border-t-[var(--rz-accent)] sm:mt-0" />
            <span className="min-w-0 break-words font-medium leading-5">{statusText}</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--rz-panel-2)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--rz-accent),#fb7185)] transition-all duration-500"
              style={{ width: `${progressWidth}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] leading-5 text-[var(--rz-muted)]">
            처음 요약하는 영상은 1~3분 걸려요. 한 번 요약된 영상은 바로 보여요.
          </p>
        </div>
      ) : null}

      {error ? <p className="relative mt-3 text-xs text-[var(--rz-up)]">{error}</p> : null}

      {view?.status === "failed" ? (
        <div className="relative mt-3 flex flex-col gap-2.5 rounded-xl border border-[var(--rz-up)]/25 bg-[var(--rz-up)]/10 px-3 py-3 sm:mt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:px-3.5">
          <p className="min-w-0 break-words text-xs text-[var(--rz-up)]">{view.error ?? "요약을 만들지 못했어요."}</p>
          <button
            type="button"
            onClick={() => void start(true)}
            className="w-full rounded-lg border border-[var(--rz-line)] bg-[var(--rz-panel)] px-3 py-2.5 text-xs text-white transition hover:bg-[var(--rz-panel-2)] sm:w-auto sm:py-1.5"
          >
            다시 시도
          </button>
        </div>
      ) : null}

      {summary ? (
        <div className="relative mt-3 space-y-3 text-sm sm:mt-4 sm:space-y-4">
          {summary.noSpeech || (summary.overview.length === 0 && summary.points.length === 0) ? (
            <p className={`${cardClass} text-xs text-[var(--rz-muted)]`}>
              영상에서 근거를 확인할 수 있는 내용이 부족해 요약을 만들지 않았어요.
            </p>
          ) : null}

          {summary.stance ? (
            <div
              className={`flex items-start gap-2.5 rounded-xl border px-3 py-3 sm:gap-3 sm:px-3.5 ${
                STANCE_BG[summary.stance.label] ?? "border-[var(--rz-line)] bg-[var(--rz-bg)]/50"
              }`}
            >
              <TimeButton t={summary.stance.t} onSeek={onSeek} />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--rz-muted)]">화자의 관점</p>
                <p className="mt-1 break-words leading-6 text-white">
                  <b className={`text-[15px] sm:text-base ${STANCE_COLOR[summary.stance.label] ?? ""}`}>
                    {summary.stance.label}
                  </b>
                  <span className="text-[var(--rz-muted)]"> — {summary.stance.reason}</span>
                </p>
              </div>
            </div>
          ) : null}

          {summary.overview.length ? (
            <div className={cardClass}>
              <SectionTitle>영상 요지</SectionTitle>
              <ul className="space-y-2.5 sm:space-y-3">
                {summary.overview.map((o, i) => (
                  <SummaryRow key={i} t={o.t} onSeek={onSeek}>
                    <p className="leading-6 text-white/90">{o.text}</p>
                  </SummaryRow>
                ))}
              </ul>
            </div>
          ) : null}

          {summary.points.length ? (
            <div className={cardClass}>
              <SectionTitle>영상 속 주요 주장</SectionTitle>
              <ul className="space-y-3">
                {summary.points.map((p, i) => (
                  <SummaryRow key={i} t={p.t} onSeek={onSeek}>
                    <p className="leading-6 text-white/90">{p.text}</p>
                    {p.quote ? (
                      <p className="mt-1.5 rounded-lg border-l-2 border-[var(--rz-accent)]/50 bg-[var(--rz-accent-soft)]/40 py-1.5 pl-2.5 pr-2 text-xs leading-5 text-[var(--rz-muted)]">
                        &ldquo;{p.quote}&rdquo;
                      </p>
                    ) : null}
                  </SummaryRow>
                ))}
              </ul>
            </div>
          ) : null}

          {summary.levels.length ? (
            <div className={cardClass}>
              <SectionTitle>영상에서 언급된 가격대</SectionTitle>
              <ul className="divide-y divide-[var(--rz-line)] overflow-hidden rounded-xl border border-[var(--rz-line)] bg-[var(--rz-panel)]/60">
                {summary.levels.map((l, i) => (
                  <li key={i} className="flex flex-col gap-1.5 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <TimeButton t={l.t} onSeek={onSeek} />
                      <span className="shrink-0 rounded-md bg-[var(--rz-bg)]/60 px-1.5 py-0.5 text-[11px] text-[var(--rz-muted)]">
                        {l.kind}
                      </span>
                      <span className="shrink-0 font-mono text-sm font-semibold text-white">{l.price}</span>
                      <span className="text-[11px] text-[var(--rz-muted)] sm:hidden">{l.coin}</span>
                    </div>
                    <p className="min-w-0 break-words text-xs leading-5 text-[var(--rz-muted)] sm:flex-1 sm:truncate" title={l.quote}>
                      <span className="hidden sm:inline">{l.coin} · </span>
                      &ldquo;{l.quote}&rdquo;
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-xl border border-[var(--rz-line)] bg-[var(--rz-panel)]/70 p-3 text-[11px] leading-5 text-[var(--rz-muted)]">
            AI가 영상을 받아쓴 뒤 그 내용만으로 요약했고, 각 항목이 받아쓴 원문과 맞는지 한 번 더 확인했어요.
            {summary.dropped > 0 ? ` 원문으로 확인되지 않은 ${summary.dropped}개 항목은 뺐어요.` : ""} 시간을 누르면 그
            장면부터 볼 수 있어요. 요약은 영상 화자의 주장이며 투자 권유가 아니에요.
          </div>

          {view?.transcript?.length ? (
            <div>
              <button
                type="button"
                onClick={() => setShowTranscript((v) => !v)}
                className="min-h-10 text-left text-xs font-medium text-[var(--rz-accent)] transition hover:brightness-125 sm:min-h-0"
              >
                {showTranscript ? "받아쓴 원문 접기" : `받아쓴 원문 보기 (${view.transcript.length}문단)`}
              </button>
              {showTranscript ? (
                <ol className="mt-2 max-h-64 space-y-2.5 overflow-y-auto overscroll-contain rounded-xl border border-[var(--rz-line)] bg-[var(--rz-bg)]/50 p-3 text-xs leading-5 sm:mt-2.5 sm:max-h-80">
                  {view.transcript.map((s) => (
                    <SummaryRow key={s.id} t={s.t} onSeek={onSeek}>
                      <span className="text-[var(--rz-muted)]">{s.text}</span>
                    </SummaryRow>
                  ))}
                </ol>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
