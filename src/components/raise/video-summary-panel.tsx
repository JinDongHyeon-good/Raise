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
      className="shrink-0 rounded bg-[var(--rz-accent)]/15 px-1.5 py-0.5 font-mono text-[11px] text-[var(--rz-accent)] hover:bg-[var(--rz-accent)]/25"
    >
      {mmss(t)}
    </button>
  );
}

const STANCE_COLOR: Record<string, string> = {
  상승: "text-[var(--rz-up)]",
  하락: "text-[var(--rz-down)]",
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
    if (!requireLogin()) return; // 비로그인: 로그인·가입 창
    setError(null);
    setRunning(true);
    let first = true;
    try {
      // 요약은 서버 백그라운드에서 진행 → done/failed가 될 때까지 상태만 다시 읽는다 (최대 약 10분)
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

  // 시작 전
  if (!view && !running) {
    return (
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--rz-line)] bg-[var(--rz-bg)] p-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">AI 영상 요약</p>
          <p className="text-xs text-[var(--rz-muted)]">
            영상에서 실제로 나온 말만 근거로 한국어로 요약해요.
            {me && usage ? ` 오늘 ${usage.used}/${usage.limit}회 사용` : " 로그인 후 하루 5회"}
          </p>
          {error ? <p className="mt-1 text-xs text-[var(--rz-up)]">{error}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => void start()}
          className="shrink-0 rounded-lg bg-[var(--rz-accent)] px-3 py-2 text-xs font-medium text-[var(--rz-accent-fg)]"
        >
          {me ? "AI 요약 보기" : "로그인하고 AI 요약 보기"}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-[var(--rz-line)] bg-[var(--rz-bg)] p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">AI 영상 요약</p>
        {usage ? <span className="text-[11px] text-[var(--rz-muted)]">오늘 {usage.used}/{usage.limit}회</span> : null}
      </div>

      {view?.status !== "done" && view?.status !== "failed" ? (
        <div className="mt-3">
          <div className="flex items-center gap-2 text-xs text-[var(--rz-muted)]">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--rz-muted)] border-t-transparent" />
            {statusText}
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded bg-[var(--rz-panel-2)]">
            <div
              className="h-full bg-[var(--rz-accent)] transition-all"
              style={{
                width: `${
                  !view
                    ? 3
                    : view.status === "transcribing"
                      ? 5 + (view.progress.done / Math.max(1, view.progress.total)) * 75
                      : view.status === "summarizing"
                        ? 85
                        : 95
                }%`,
              }}
            />
          </div>
          <p className="mt-2 text-[11px] text-[var(--rz-muted)]">처음 요약하는 영상은 1~3분 걸려요. 한 번 요약된 영상은 바로 보여요.</p>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-xs text-[var(--rz-up)]">{error}</p> : null}

      {view?.status === "failed" ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-xs text-[var(--rz-up)]">{view.error ?? "요약을 만들지 못했어요."}</p>
          <button type="button" onClick={() => void start(true)} className="rounded-md border border-[var(--rz-line)] px-2.5 py-1 text-xs">
            다시 시도
          </button>
        </div>
      ) : null}

      {summary ? (
        <div className="mt-3 space-y-4 text-sm">
          {summary.noSpeech || (summary.overview.length === 0 && summary.points.length === 0) ? (
            <p className="text-xs text-[var(--rz-muted)]">
              영상에서 근거를 확인할 수 있는 내용이 부족해 요약을 만들지 않았어요.
            </p>
          ) : null}

          {summary.overview.length ? (
            <div>
              <p className="mb-1 text-xs font-semibold text-[var(--rz-muted)]">영상 요지</p>
              <ul className="space-y-1.5">
                {summary.overview.map((o, i) => (
                  <li key={i} className="flex gap-2 leading-6">
                    <TimeButton t={o.t} onSeek={onSeek} />
                    <span>{o.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {summary.points.length ? (
            <div>
              <p className="mb-1 text-xs font-semibold text-[var(--rz-muted)]">영상 속 주요 주장</p>
              <ul className="space-y-2.5">
                {summary.points.map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <TimeButton t={p.t} onSeek={onSeek} />
                    <div className="min-w-0">
                      <p className="leading-6">{p.text}</p>
                      {p.quote ? (
                        <p className="mt-0.5 border-l-2 border-[var(--rz-line)] pl-2 text-xs leading-5 text-[var(--rz-muted)]">
                          &ldquo;{p.quote}&rdquo;
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {summary.levels.length ? (
            <div>
              <p className="mb-1 text-xs font-semibold text-[var(--rz-muted)]">영상에서 언급된 가격대</p>
              <ul className="divide-y divide-[var(--rz-line)] rounded-md border border-[var(--rz-line)]">
                {summary.levels.map((l, i) => (
                  <li key={i} className="flex items-center gap-2 px-2.5 py-2 text-xs">
                    <TimeButton t={l.t} onSeek={onSeek} />
                    <span className="w-12 shrink-0 text-[var(--rz-muted)]">{l.kind}</span>
                    <span className="shrink-0 font-mono font-semibold">{l.price}</span>
                    <span className="min-w-0 truncate text-[var(--rz-muted)]" title={l.quote}>
                      {l.coin} · &ldquo;{l.quote}&rdquo;
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {summary.stance ? (
            <div className="flex gap-2">
              <TimeButton t={summary.stance.t} onSeek={onSeek} />
              <p className="leading-6">
                <span className="text-xs text-[var(--rz-muted)]">화자의 관점 </span>
                <b className={STANCE_COLOR[summary.stance.label] ?? ""}>{summary.stance.label}</b> — {summary.stance.reason}
              </p>
            </div>
          ) : null}

          <div className="rounded-md bg-[var(--rz-panel)] p-2.5 text-[11px] leading-5 text-[var(--rz-muted)]">
            AI가 영상을 받아쓴 뒤 그 내용만으로 요약했고, 각 항목이 받아쓴 원문과 맞는지 한 번 더 확인했어요.
            {summary.dropped > 0 ? ` 원문으로 확인되지 않은 ${summary.dropped}개 항목은 뺐어요.` : ""} 시간을 누르면 그 장면부터 볼 수 있어요.
            요약은 영상 화자의 주장이며 투자 권유가 아니에요.
          </div>

          {view?.transcript?.length ? (
            <div>
              <button
                type="button"
                onClick={() => setShowTranscript((v) => !v)}
                className="text-xs text-[var(--rz-muted)] underline"
              >
                {showTranscript ? "받아쓴 원문 접기" : `받아쓴 원문 보기 (${view.transcript.length}문단)`}
              </button>
              {showTranscript ? (
                <ol className="mt-2 max-h-80 space-y-2 overflow-y-auto pr-1 text-xs leading-5">
                  {view.transcript.map((s) => (
                    <li key={s.id} className="flex gap-2">
                      <TimeButton t={s.t} onSeek={onSeek} />
                      <span className="text-[var(--rz-muted)]">{s.text}</span>
                    </li>
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
