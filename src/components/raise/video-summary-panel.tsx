"use client";

import { useLocale, useTranslations } from "next-intl";
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
  const tr = useTranslations("summary");
  return (
    <button
      type="button"
      onClick={() => onSeek(Math.floor(t))}
      title={tr("seekTitle")}
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

/** 서버가 돌려준 관점 라벨(한국어·영어) → 상승/하락 */
function stanceDirection(label: string): "up" | "down" | null {
  const key = label.trim().toLowerCase();
  if (key === "상승" || key === "bullish") return "up";
  if (key === "하락" || key === "bearish") return "down";
  return null;
}

const STANCE_COLOR: Record<"up" | "down", string> = {
  up: "text-[var(--rz-up)]",
  down: "text-[var(--rz-down)]",
};

const STANCE_BG: Record<"up" | "down", string> = {
  up: "border-[var(--rz-up)]/30 bg-[var(--rz-up)]/10",
  down: "border-[var(--rz-down)]/30 bg-[var(--rz-down)]/10",
};

export function VideoSummaryPanel({ videoId, onSeek }: { videoId: string; onSeek: (sec: number) => void }) {
  const { me, requireLogin, refresh } = useAuth();
  const t = useTranslations("summary");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ko";
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
          headers: { "content-type": "application/json", "x-ui-locale": locale },
          body: JSON.stringify({ videoId, lang, retry: retry && first }),
        });
        first = false;
        const data = (await res.json().catch(() => ({}))) as { item?: View; quota?: Quota; error?: string; code?: string };
        if (data.quota) setQuota({ used: data.quota.used, limit: data.quota.limit });
        if (res.status === 401) {
          requireLogin();
          return;
        }
        if (!res.ok || !data.item) {
          setError(data.error ?? t("failed"));
          return;
        }
        setView(data.item);
        if (data.item.status === "done" || data.item.status === "failed") return;
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch {
      setError(t("failedRetryLater"));
    } finally {
      setRunning(false);
      void refresh();
    }
  };

  const usage = quota ?? me?.aiUsage ?? null;
  const summary = view?.status === "done" ? view.summary : null;
  const stanceDir = summary?.stance ? stanceDirection(summary.stance.label) : null;

  const statusText = (() => {
    if (!view) return t("statusPreparing");
    if (view.status === "transcribing") {
      return t("statusTranscribing", { done: view.progress.done, total: view.progress.total });
    }
    if (view.status === "summarizing") return t("statusSummarizing");
    if (view.status === "verifying") return t("statusVerifying");
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
              {t("title")}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--rz-muted)] sm:max-w-md">
              {t("intro")}
              {me && usage ? ` ${t("usageToday", { used: usage.used, limit: usage.limit })}` : ` ${t("loginDailyLimit")}`}
            </p>
            {error ? <p className="mt-2 text-xs text-[var(--rz-up)]">{error}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => void start()}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--rz-accent)] px-4 py-3 text-sm font-semibold text-[var(--rz-accent-fg)] shadow-[0_8px_20px_rgb(225_29_72_/_0.35)] transition hover:brightness-110 sm:w-auto sm:shrink-0 sm:py-2.5"
          >
            <AiSparkIcon />
            {me ? t("start") : t("loginToStart")}
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
            {t("title")}
          </p>
        </div>
        {usage ? (
          <span className="shrink-0 rounded-lg border border-[var(--rz-line)] bg-[var(--rz-panel)]/80 px-2 py-1 text-[10px] text-[var(--rz-muted)] sm:px-2.5 sm:text-[11px]">
            {t("quotaBadge", { used: usage.used, limit: usage.limit })}
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
            {t("waitNote")}
          </p>
        </div>
      ) : null}

      {error ? <p className="relative mt-3 text-xs text-[var(--rz-up)]">{error}</p> : null}

      {view?.status === "failed" ? (
        <div className="relative mt-3 flex flex-col gap-2.5 rounded-xl border border-[var(--rz-up)]/25 bg-[var(--rz-up)]/10 px-3 py-3 sm:mt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:px-3.5">
          <p className="min-w-0 break-words text-xs text-[var(--rz-up)]">{view.error ?? t("failed")}</p>
          <button
            type="button"
            onClick={() => void start(true)}
            className="w-full rounded-lg border border-[var(--rz-line)] bg-[var(--rz-panel)] px-3 py-2.5 text-xs text-white transition hover:bg-[var(--rz-panel-2)] sm:w-auto sm:py-1.5"
          >
            {t("retry")}
          </button>
        </div>
      ) : null}

      {summary ? (
        <div className="relative mt-3 space-y-3 text-sm sm:mt-4 sm:space-y-4">
          {summary.noSpeech || (summary.overview.length === 0 && summary.points.length === 0) ? (
            <p className={`${cardClass} text-xs text-[var(--rz-muted)]`}>
              {t("noEvidence")}
            </p>
          ) : null}

          {summary.stance ? (
            <div
              className={`flex items-start gap-2.5 rounded-xl border px-3 py-3 sm:gap-3 sm:px-3.5 ${
                stanceDir ? STANCE_BG[stanceDir] : "border-[var(--rz-line)] bg-[var(--rz-bg)]/50"
              }`}
            >
              <TimeButton t={summary.stance.t} onSeek={onSeek} />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--rz-muted)]">{t("stanceTitle")}</p>
                <p className="mt-1 break-words leading-6 text-white">
                  <b className={`text-[15px] sm:text-base ${stanceDir ? STANCE_COLOR[stanceDir] : ""}`}>
                    {summary.stance.label}
                  </b>
                  <span className="text-[var(--rz-muted)]"> — {summary.stance.reason}</span>
                </p>
              </div>
            </div>
          ) : null}

          {summary.overview.length ? (
            <div className={cardClass}>
              <SectionTitle>{t("overviewTitle")}</SectionTitle>
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
              <SectionTitle>{t("pointsTitle")}</SectionTitle>
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
              <SectionTitle>{t("levelsTitle")}</SectionTitle>
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
            {t("disclaimerMethod")}
            {summary.dropped > 0 ? ` ${t("disclaimerDropped", { count: summary.dropped })}` : ""} {t("disclaimerTail")}
          </div>

          {view?.transcript?.length ? (
            <div>
              <button
                type="button"
                onClick={() => setShowTranscript((v) => !v)}
                className="min-h-10 text-left text-xs font-medium text-[var(--rz-accent)] transition hover:brightness-125 sm:min-h-0"
              >
                {showTranscript ? t("hideTranscript") : t("showTranscript", { count: view.transcript.length })}
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
