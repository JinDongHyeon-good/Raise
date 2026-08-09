"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Sparkles, Copy, Check } from "lucide-react";
import { AppShell } from "@/components/site/app-shell";
import { SajuBirthForm, emptyBirthValue, type BirthValue } from "@/components/saju/saju-birth-form";
import { SajuChartView } from "@/components/saju/saju-chart-view";
import { SajuMarkdown } from "@/components/saju/saju-markdown";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { ClientChart } from "@/lib/saju/types";
import type { AppLocale } from "@/i18n/routing";

type Kind = "daily" | "natal" | "compatibility";

type ApiResult = {
  kind: Kind;
  reading: string;
  model?: string;
  chart?: ClientChart;
  today?: string;
  chartA?: ClientChart;
  chartB?: ClientChart;
};

/** /api/ai/saju가 릴레이 모드에서 돌려주는 준비 응답 (명식 + 서명된 Gemini 실행 토큰) */
type RelayPreparation = Partial<ApiResult> & {
  mode: "relay";
  relayUrl: string;
  relayToken: string;
};

const CLIENT_MAX_ATTEMPTS = 3;
const CLIENT_RETRY_DELAY_MS = 1200;

function toPayloadPerson(v: BirthValue) {
  return {
    name: v.name.trim() || undefined,
    gender: v.gender,
    year: Number(v.year),
    month: Number(v.month),
    day: Number(v.day),
    calendar: v.calendar,
    isLeapMonth: v.isLeapMonth,
    timeKnown: v.timeKnown,
    hour: v.timeKnown ? Number(v.hour) : undefined,
    minute: v.timeKnown ? Number(v.minute || 0) : undefined,
  };
}

function isComplete(v: BirthValue) {
  if (!v.year || !v.month || !v.day) return false;
  if (v.timeKnown && v.hour === "") return false;
  return true;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function isRelayPreparation(value: unknown): value is RelayPreparation {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    v.mode === "relay" &&
    typeof v.relayUrl === "string" &&
    v.relayUrl.length > 0 &&
    typeof v.relayToken === "string" &&
    v.relayToken.length > 0
  );
}

export function SajuFeature({ kind }: { kind: Kind }) {
  const t = useTranslations("sajuApp");
  const locale = useLocale() as AppLocale;

  const [personA, setPersonA] = useState<BirthValue>(emptyBirthValue);
  const [personB, setPersonB] = useState<BirthValue>({ ...emptyBirthValue });
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);
  const chartReadyRef = useRef(false);

  /** 스트리밍 텍스트 부드럽게 흘려보내기용 상태(리렌더를 유발하지 않는 순수 버퍼는 ref로 관리) */
  const revealedRef = useRef("");
  const pendingRef = useRef("");
  const rafRef = useRef<number | null>(null);
  const streamOpenRef = useRef(false);

  const isCompat = kind === "compatibility";
  const canSubmit = isComplete(personA) && (!isCompat || isComplete(personB));
  const hasReadingText = Boolean(result?.reading.trim().length);
  const loadingSteps = t.raw("result.loadingSteps") as string[];

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }
    const id = window.setInterval(() => {
      setLoadingStep((i) => (i + 1) % loadingSteps.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, [loading, loadingSteps.length]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const resetReveal = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    revealedRef.current = "";
    pendingRef.current = "";
    streamOpenRef.current = false;
  };

  /**
   * 네트워크가 뭉텅이로 몰아서 보내는 텍스트를 rAF로 조금씩 흘려보내 타자기처럼 부드럽게 표시한다.
   * 밀린 양이 많을수록 더 빠르게 따라잡아서(비율 기반 스텝) 실제 도착 속도보다 과하게 뒤처지지 않는다.
   */
  const runReveal = () => {
    const target = pendingRef.current;
    const current = revealedRef.current;
    if (current.length < target.length) {
      const remaining = target.length - current.length;
      const step = Math.min(remaining, Math.max(2, Math.ceil(remaining * 0.16)));
      const next = target.slice(0, current.length + step);
      revealedRef.current = next;
      setResult((prev) => (prev ? { ...prev, reading: next } : prev));
    }
    if (streamOpenRef.current || revealedRef.current.length < pendingRef.current.length) {
      rafRef.current = requestAnimationFrame(runReveal);
    } else {
      rafRef.current = null;
    }
  };

  const ensureReveal = () => {
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(runReveal);
    }
  };

  const handleCopyReading = async () => {
    if (!result?.reading.trim()) return;
    try {
      await navigator.clipboard.writeText(result.reading);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t("errors.copyFailed"));
    }
  };

  /** 명식이 준비되면 결과 영역을 먼저 띄운다. 해석 본문은 이후 스트리밍으로 채워진다. */
  const showChart = (meta: Partial<ApiResult>) => {
    chartReadyRef.current = true;
    setResult({ ...meta, kind, reading: "" } as ApiResult);
    setLoading(false);
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        document.getElementById("saju-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  /** 서버가 조각조각 흘려보내는 해석을 받아 화면을 실시간으로 채우고, 최종 텍스트를 돌려준다. */
  const consumeReadingStream = async (
    stream: ReadableStream<Uint8Array>,
    /** true면 첫 줄이 chart/model 등 메타 JSON이다 (Next.js 직접 스트리밍 폴백 경로). */
    expectMetaLine: boolean,
  ) => {
    streamOpenRef.current = true;
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let metaPending = expectMetaLine;
    let reading = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      if (metaPending) {
        const newlineIndex = buffer.indexOf("\n");
        if (newlineIndex === -1) continue;
        const firstLine = buffer.slice(0, newlineIndex);
        let meta: Partial<ApiResult> = {};
        try {
          meta = JSON.parse(firstLine) as Partial<ApiResult>;
          buffer = buffer.slice(newlineIndex + 1);
        } catch {
          // 메타 JSON이 아니면 본문 시작으로 간주한다 (파싱 오류로 본문을 버리지 않음).
          meta = {};
        }
        metaPending = false;
        showChart(meta);
      }

      if (buffer) {
        reading += buffer;
        buffer = "";
        pendingRef.current = reading;
        ensureReveal();
      }
    }

    streamOpenRef.current = false;
    ensureReveal();
    return reading;
  };

  /**
   * 릴레이 모드: Amplify가 응답을 30초에서 끊기 때문에 긴 Gemini 생성은
   * Supabase Edge Function이 맡는다. 브라우저가 그 함수를 직접 호출한다.
   */
  const openRelayStream = async (
    prep: RelayPreparation,
  ): Promise<{ body: ReadableStream<Uint8Array> } | { error: string; retryable: boolean }> => {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return { error: t("errors.authSession"), retryable: false };

    let res: Response;
    try {
      res = await fetch(prep.relayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
        },
        body: JSON.stringify({ token: prep.relayToken }),
      });
    } catch {
      return { error: t("errors.network"), retryable: true };
    }

    if (!res.ok || !res.body) {
      const data = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
      const message = typeof data?.error === "string" ? data.error : t("errors.generic");
      const retryable =
        res.status >= 500 ||
        res.status === 429 ||
        data?.code === "invalid_token" ||
        data?.code === "gemini_error" ||
        data?.code === "timeout";
      return { error: message, retryable };
    }
    return { body: res.body };
  };

  /** 한 번의 해석 시도. 성공 시 reading 텍스트, 실패 시 retryable 여부를 돌려준다. */
  const attemptOnce = async (): Promise<
    { ok: true; reading: string } | { ok: false; error: string; retryable: boolean }
  > => {
    resetReveal();
    setStreaming(true);
    const body: Record<string, unknown> = { kind, locale };
    if (isCompat) {
      body.personA = toPayloadPerson(personA);
      body.personB = toPayloadPerson(personB);
    } else {
      body.person = toPayloadPerson(personA);
    }

    let res: Response;
    try {
      res = await fetch("/api/ai/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      return { ok: false, error: t("errors.network"), retryable: true };
    }

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const message = typeof data?.error === "string" ? data.error : t("errors.generic");
      const retryable = res.status >= 500 || res.status === 429 || data?.code === "timeout";
      return { ok: false, error: message, retryable };
    }

    const contentType = res.headers.get("content-type") ?? "";
    const isRelay = contentType.includes("application/json");
    let readingStream: ReadableStream<Uint8Array> | null = res.body;
    let expectMetaLine = true;

    if (isRelay) {
      let prepRaw: unknown;
      try {
        prepRaw = await res.json();
      } catch {
        return { ok: false, error: t("errors.generic"), retryable: true };
      }

      if (!isRelayPreparation(prepRaw)) {
        return { ok: false, error: t("errors.generic"), retryable: true };
      }

      showChart(prepRaw);
      expectMetaLine = false;

      const opened = await openRelayStream(prepRaw);
      if ("error" in opened) {
        return { ok: false, error: opened.error, retryable: opened.retryable };
      }
      readingStream = opened.body;
    }

    if (!readingStream) {
      return { ok: false, error: t("errors.generic"), retryable: true };
    }

    try {
      const reading = await consumeReadingStream(readingStream, expectMetaLine);
      if (!reading.trim()) {
        return { ok: false, error: t("errors.empty"), retryable: true };
      }
      return { ok: true, reading };
    } catch {
      return { ok: false, error: t("errors.network"), retryable: true };
    }
  };

  const submit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    chartReadyRef.current = false;

    let lastError = t("errors.generic");

    try {
      for (let attempt = 1; attempt <= CLIENT_MAX_ATTEMPTS; attempt += 1) {
        if (attempt > 1) {
          setLoading(true);
          await sleep(CLIENT_RETRY_DELAY_MS * attempt);
        }

        const outcome = await attemptOnce();
        setStreaming(false);
        if (outcome.ok) {
          setError(null);
          return;
        }

        lastError = outcome.error;
        if (!outcome.retryable) break;
      }

      if (chartReadyRef.current) {
        setResult((prev) =>
          prev
            ? {
                ...prev,
                reading: prev.reading.trim() || t("errors.emptyFallback"),
              }
            : prev,
        );
        setError(null);
      } else {
        setError(lastError);
      }
    } finally {
      setLoading(false);
    }
  };

  const navKey = kind === "daily" ? "today" : kind === "natal" ? "natal" : "gunghap";
  const appPath =
    kind === "daily" ? "/dashboard/today" : kind === "natal" ? "/dashboard/saju" : "/dashboard/gunghap";

  return (
    <AppShell active={navKey} nextPath={appPath}>
      <div className="piclick-container py-8 sm:py-10">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <h1 className="font-brand-display text-3xl font-bold tracking-tight text-[var(--piclick-green-deep)] sm:text-4xl">
              {t(`${kind}.title`)}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--piclick-ink-muted)] sm:text-base">
              {t(`${kind}.subtitle`)}
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-[var(--piclick-line)] bg-white p-5 shadow-[0_18px_40px_-28px_rgb(42_33_80_/0.5)] sm:p-6">
            {isCompat ? (
              <div className="space-y-6">
                <div>
                  <p className="mb-3 text-sm font-semibold text-[var(--piclick-green-deep)]">{t("form.personA")}</p>
                  <SajuBirthForm value={personA} onChange={setPersonA} />
                </div>
                <div className="border-t border-[var(--piclick-line)] pt-6">
                  <p className="mb-3 text-sm font-semibold text-[var(--piclick-green-deep)]">{t("form.personB")}</p>
                  <SajuBirthForm value={personB} onChange={setPersonB} />
                </div>
              </div>
            ) : (
              <SajuBirthForm value={personA} onChange={setPersonA} />
            )}

            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit || loading}
              className="pk-btn pk-btn-lg pk-btn-primary mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? t("result.loading") : t(`${kind}.cta`)}
            </button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-[var(--piclick-ink-muted)]">
              {t("disclaimer")}
            </p>
          </div>

          {error ? (
            <div className="mt-5 rounded-xl border border-[#c0483f]/25 bg-[#c0483f]/5 p-4 text-sm text-[#a53d35]">
              {error}
            </div>
          ) : null}

          {loading ? (
            <motion.div
              className="relative mt-6 flex flex-col items-center gap-4 overflow-hidden rounded-2xl border border-[var(--piclick-line)] bg-gradient-to-b from-white to-[var(--piclick-beige-soft)] p-10 text-center shadow-[0_18px_40px_-28px_rgb(42_33_80_/0.5)]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div
                className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[var(--piclick-gold)]/15 blur-2xl"
                aria-hidden
              />
              <span className="relative flex h-14 w-14 items-center justify-center">
                <span className="absolute h-14 w-14 animate-ping rounded-full bg-[var(--piclick-gold)]/25" />
                <span
                  className="absolute h-11 w-11 animate-ping rounded-full bg-[var(--piclick-green)]/20"
                  style={{ animationDelay: "0.3s" }}
                />
                <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--piclick-green)] to-[var(--piclick-green-deep)] text-white shadow-[0_6px_18px_-6px_rgb(42_33_80_/0.6)]">
                  <Sparkles className="h-5 w-5 animate-[spin_5s_linear_infinite]" aria-hidden />
                </span>
              </span>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-[var(--piclick-green-deep)]">{t("result.loading")}</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingStep}
                    className="text-xs text-[var(--piclick-ink-muted)]"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3 }}
                  >
                    {loadingSteps[loadingStep] ?? t("result.loadingSub")}
                  </motion.p>
                </AnimatePresence>
              </div>
              <div className="h-1 w-40 overflow-hidden rounded-full bg-[var(--piclick-line)]">
                <motion.div
                  className="h-full w-1/3 rounded-full bg-gradient-to-r from-[var(--piclick-green)] to-[var(--piclick-gold)]"
                  animate={{ x: ["-120%", "220%"] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          ) : null}
        </div>

        {result && !loading ? (
          <motion.div
            id="saju-result"
            className="mx-auto mt-8 max-w-2xl scroll-mt-20 space-y-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {isCompat ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {result.chartA ? <SajuChartView chart={result.chartA} name={personA.name.trim() || t("form.personA")} /> : null}
                {result.chartB ? <SajuChartView chart={result.chartB} name={personB.name.trim() || t("form.personB")} /> : null}
              </div>
            ) : result.chart ? (
              <SajuChartView chart={result.chart} name={personA.name.trim() || undefined} />
            ) : null}

            <div className="rounded-2xl border border-[var(--piclick-line)] bg-white p-5 sm:p-7">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--piclick-green-deep)]">
                  <Sparkles className="h-4 w-4 text-[var(--piclick-gold)]" aria-hidden />
                  {t("result.readingTitle")}
                </h2>
                <button
                  type="button"
                  onClick={() => void handleCopyReading()}
                  disabled={!hasReadingText}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--piclick-line)] px-3 py-1.5 text-xs font-medium text-[var(--piclick-ink-muted)] transition hover:border-[var(--piclick-green)]/40 hover:text-[var(--piclick-green-deep)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-[var(--piclick-green)]" aria-hidden />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {copied ? t("result.copied") : t("result.copy")}
                </button>
              </div>

              {!hasReadingText && streaming ? (
                <div className="space-y-3 py-2" aria-hidden>
                  <div className="flex items-center gap-2 text-xs font-medium text-[var(--piclick-green-deep)]">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute h-2 w-2 animate-ping rounded-full bg-[var(--piclick-gold)]" />
                      <span className="relative h-2 w-2 rounded-full bg-[var(--piclick-green)]" />
                    </span>
                    {t("result.thinking")}
                  </div>
                  {["w-full", "w-11/12", "w-4/5", "w-full", "w-2/3"].map((w, i) => (
                    <div
                      key={w}
                      className={`h-3 ${w} animate-pulse rounded-full bg-gradient-to-r from-[var(--piclick-line)] via-[var(--piclick-beige)] to-[var(--piclick-line)]`}
                      style={{ animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </div>
              ) : (
                <>
                  <SajuMarkdown text={result.reading} />
                  {streaming ? (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--piclick-ink-muted)]">
                      <span className="flex gap-0.5">
                        <span
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--piclick-green)]"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--piclick-green)]"
                          style={{ animationDelay: "120ms" }}
                        />
                        <span
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--piclick-green)]"
                          style={{ animationDelay: "240ms" }}
                        />
                      </span>
                      {t("result.typing")}
                    </div>
                  ) : null}
                </>
              )}

              <p className="mt-6 border-t border-[var(--piclick-line)] pt-4 text-[11px] text-[var(--piclick-ink-muted)]">
                {t("disclaimer")}
              </p>
            </div>
          </motion.div>
        ) : null}
      </div>
    </AppShell>
  );
}
