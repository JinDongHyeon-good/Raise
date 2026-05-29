"use client";

import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { SERVICE_NAME, SERVICE_TAGLINE } from "@/lib/brand";
import { getDefaultNicknameFromUser } from "@/lib/default-nickname";
import { isNicknameTakenByOther } from "@/lib/nickname-duplicate";
import { getPublicSiteOrigin } from "@/lib/site-origin";
import { getSupabaseBrowserClientSafe } from "@/lib/supabase-safe";
import { MeloballoonPromoBanner } from "@/components/tarot/meloballoon-promo-banner";
import { TarotReadingView } from "@/components/tarot/tarot-reading-view";
import {
  TAROT_SPREADS,
  TAROT_TOPICS,
  drawTarotHand,
  getTarotCardApiUrl,
  getTarotImageUrl,
  suitLabel,
  topicPlaceholder,
  type DrawnTarotCard,
  type TarotSpreadId,
  type TarotTopicId,
} from "@/lib/tarot-deck";

function CardLoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8" role="status" aria-live="polite" aria-label="불러오는 중">
      <div className="relative h-8 w-8" aria-hidden>
        <div className="absolute inset-0 rounded-full border border-violet-200" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-violet-500" />
      </div>
    </div>
  );
}

function TarotCardShimmerBack() {
  return (
    <div className="relative mx-auto aspect-[2/3] w-full overflow-hidden rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-purple-50">
      <div className="tarot-card-shimmer absolute inset-0" aria-hidden />
      <div className="relative flex h-full flex-col items-center justify-center gap-1.5 p-3">
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-violet-500/80">Melotaro</span>
        <span className="text-2xl text-violet-300">✦</span>
      </div>
    </div>
  );
}

function TarotDrawSlot({
  positionLabel,
  children,
}: {
  positionLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full min-w-0 flex-col items-center">
      <p className="mb-2.5 text-center text-[11px] font-medium tracking-wide text-violet-600/90">{positionLabel}</p>
      <div className="w-full max-w-[200px]">{children}</div>
    </div>
  );
}

function TarotCardBack({ label }: { label?: string }) {
  return (
    <div
      className="relative mx-auto flex aspect-[2/3] w-full max-w-[200px] items-center justify-center border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-purple-50 shadow-sm shadow-violet-200/50"
      aria-hidden={!label}
    >
      <div className="flex flex-col items-center gap-1 p-3 text-center">
        <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-violet-600">Melotaro</span>
        <span className="text-2xl text-violet-700">✦</span>
        {label ? <span className="text-[10px] text-violet-600/80">{label}</span> : null}
      </div>
    </div>
  );
}

function TarotCardFace({ card }: { card: DrawnTarotCard }) {
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState(false);
  const [src, setSrc] = useState(() => getTarotImageUrl(card));

  return (
    <div className="relative mx-auto w-full max-w-[200px]">
      <div
        className={`relative flex aspect-[2/3] w-full items-center justify-center bg-white/90 ${
          card.orientation === "reversed" ? "rotate-180" : ""
        }`}
      >
        {!loaded && !error ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-violet-50/90">
            <CardLoadingSpinner />
          </div>
        ) : null}
        {error ? (
          <div className="flex h-full w-full items-center justify-center border border-dashed border-violet-200 px-2 text-center text-xs text-violet-600">
            카드 이미지를 불러오지 못했습니다
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={`${card.nameKo} 타로 카드`}
            width={320}
            height={480}
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => {
              if (attempt === 0) {
                setAttempt(1);
                setLoaded(false);
                setSrc(getTarotCardApiUrl(card.id));
                return;
              }

              setError(true);
              setLoaded(true);
            }}
            className={`max-h-full max-w-full object-contain object-center transition-opacity duration-300 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
      </div>
    </div>
  );
}

function DrawnCardPanel({ card, showMeta = true }: { card: DrawnTarotCard; showMeta?: boolean }) {
  return (
    <article className="border border-violet-200 bg-white/95 p-3 text-center shadow-sm shadow-violet-200/40">
      {showMeta ? (
        <>
          <p className="text-[11px] font-semibold tracking-wide text-violet-600">{card.position}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">{suitLabel(card.suit)}</p>
        </>
      ) : null}
      <div className={showMeta ? "mt-2" : ""}>
        <TarotCardFace card={card} />
      </div>
      <p className="mt-2 text-base font-bold text-violet-950">{card.nameKo}</p>
      <p className="mt-0.5 text-xs text-slate-400">{card.nameEn}</p>
      <p
        className={`mt-2 text-[11px] font-medium ${
          card.orientation === "reversed" ? "text-amber-700" : "text-emerald-700"
        }`}
      >
        {card.orientation === "reversed" ? "역방향" : "정방향"}
      </p>
    </article>
  );
}

const TOTAL_STEPS = 4;
const PENDING_AUTH_STORAGE_KEY = "melotaro-pending-auth";

type PendingAuthAction = "advance-step" | "start-reading";

const STEP_META: Array<{ title: string; description: string }> = [
  {
    title: "리딩 영역 선택",
    description: "지금 가장 깊이 들여다보고 싶은 질문의 영역을 골라 주세요. 선택하신 테마에 맞춰 카드의 흐름을 읽습니다.",
  },
  { title: "궁금한 점", description: "마음속 질문을 적어 주세요. (선택)" },
  { title: "카드 뽑기", description: "한 장 또는 세 장을 고른 뒤 카드를 뽑아 주세요." },
  { title: "AI 타로 리딩", description: "뽑은 카드를 바탕으로 AI 리딩을 받아 보세요." },
];

function StepTopProgressBar({ current }: { current: number }) {
  const steps = Array.from({ length: TOTAL_STEPS }, (_, index) => index + 1);

  return (
    <nav className="w-full" aria-label={`진행 ${current}단계 / ${TOTAL_STEPS}단계`}>
      <div className="tarot-step-track flex items-center">
        {steps.map((stepNumber, index) => {
          const isActive = stepNumber === current;
          const isDone = stepNumber < current;
          const lineDone = index > 0 && stepNumber <= current;

          return (
            <Fragment key={stepNumber}>
              {index > 0 ? (
                <div
                  className={`h-0.5 min-w-[1.25rem] flex-1 transition-colors duration-300 ${
                    lineDone ? "bg-violet-300" : "bg-violet-200/70"
                  }`}
                  aria-hidden
                />
              ) : null}
              <div
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 sm:text-sm ${
                  isActive
                    ? "bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 text-white shadow-md shadow-violet-300/50 ring-2 ring-violet-200 ring-offset-2 ring-offset-[#f8f5fc]"
                    : isDone
                      ? "bg-violet-100 text-violet-700"
                      : "border border-violet-200 bg-white text-violet-400"
                }`}
                aria-current={isActive ? "step" : undefined}
              >
                {stepNumber}
              </div>
            </Fragment>
          );
        })}
      </div>
    </nav>
  );
}

export default function TarotHome() {
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState<TarotTopicId>("today");
  const [spread, setSpread] = useState<TarotSpreadId>("single");
  const [question, setQuestion] = useState("");
  const [drawnCards, setDrawnCards] = useState<DrawnTarotCard[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [reading, setReading] = useState("");
  const [readingError, setReadingError] = useState<string | null>(null);
  const [isReadingLoading, setIsReadingLoading] = useState(false);
  const [remainingToday, setRemainingToday] = useState<number | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [isNicknameSaving, setIsNicknameSaving] = useState(false);

  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const pendingAuthActionRef = useRef<PendingAuthAction | null>(null);

  const setPendingAuthAction = (action: PendingAuthAction | null) => {
    pendingAuthActionRef.current = action;
    if (typeof window === "undefined") return;
    if (action) {
      sessionStorage.setItem(PENDING_AUTH_STORAGE_KEY, action);
    } else {
      sessionStorage.removeItem(PENDING_AUTH_STORAGE_KEY);
    }
  };

  const restorePendingAuthAction = () => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem(PENDING_AUTH_STORAGE_KEY);
    if (stored === "advance-step" || stored === "start-reading") {
      pendingAuthActionRef.current = stored;
    }
  };
  const flushPendingAuthActionRef = useRef<(() => void) | null>(null);

  const spreadConfig = TAROT_SPREADS.find((item) => item.id === spread) ?? TAROT_SPREADS[0];
  const isSingleSpread = spreadConfig.count === 1;
  const cardsLayoutClass = isSingleSpread ? "tarot-cards-single" : "tarot-cards-multi";
  const selectedTopic = TAROT_TOPICS.find((item) => item.id === topic) ?? TAROT_TOPICS[0];
  const stepMeta = STEP_META[step - 1] ?? STEP_META[0];

  const resetLaterStepInputs = () => {
    setQuestion("");
    setSpread("single");
    setDrawnCards([]);
    setReading("");
    setReadingError(null);
    setIsDrawing(false);
  };

  const goToPrevStep = () => {
    setReadingError(null);
    const nextStep = Math.max(1, step - 1);
    if (nextStep === 1) {
      resetLaterStepInputs();
    }
    setStep(nextStep);
  };

  const goToNextStep = () => {
    void (async () => {
      setReadingError(null);
      if (step === 1) {
        const user = await syncSession();
        if (!user) {
          setPendingAuthAction("advance-step");
          setIsLoginModalOpen(true);
          return;
        }
      }
      if (step === 3 && drawnCards.length !== spreadConfig.count) {
        setReadingError("카드를 뽑은 뒤 다음으로 진행해 주세요.");
        return;
      }
      setStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
    })();
  };

  const restartTarot = () => {
    resetLaterStepInputs();
    setStep(1);
  };

  const syncSession = useCallback(async () => {
    const supabase = getSupabaseBrowserClientSafe();
    if (!supabase) return null;
    const { data: sessionData } = await supabase.auth.getSession();
    let user = sessionData.session?.user ?? null;

    if (!user) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      user = refreshed.session?.user ?? null;
    }
    if (!user) {
      const { data: userData } = await supabase.auth.getUser();
      user = userData.user ?? null;
    }

    if (!user) {
      setIsLoggedIn(false);
      setUserAvatarUrl(null);
      return null;
    }

    setIsLoggedIn(true);
    setUserAvatarUrl(
      (user.user_metadata?.avatar_url as string | undefined) ??
        (user.user_metadata?.picture as string | undefined) ??
        null,
    );
    return user;
  }, []);

  const ensureUserProfile = useCallback(
    async (user: {
      id: string;
      email?: string;
      user_metadata?: Record<string, unknown>;
    }): Promise<boolean> => {
      const welcomeFromSignup =
        typeof window !== "undefined" && new URLSearchParams(window.location.search).get("welcome") === "1";
      if (welcomeFromSignup && typeof window !== "undefined") {
        const u = new URL(window.location.href);
        u.searchParams.delete("welcome");
        window.history.replaceState(null, "", `${u.pathname}${u.search}${u.hash}`);
      }

      const supabase = getSupabaseBrowserClientSafe();
      if (!supabase) return false;

      const { data, error } = await supabase
        .from("USER_MST")
        .select("auth_id, nickname")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("[user-profile] fetch failed", error);
        return false;
      }

      const defaultNickname = getDefaultNicknameFromUser({
        email: user.email,
        user_metadata: user.user_metadata ?? null,
      });

      if (!data?.auth_id || welcomeFromSignup) {
        setNicknameDraft(data?.nickname?.trim() || defaultNickname);
        setNicknameError(null);
        setIsNicknameModalOpen(true);
        return true;
      }

      setIsNicknameModalOpen(false);
      return false;
    },
    [],
  );

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      restorePendingAuthAction();
      const user = await syncSession();
      if (!mounted || !user) return;
      const needsNickname = await ensureUserProfile(user);
      if (!mounted || needsNickname) return;
      flushPendingAuthActionRef.current?.();
    };

    void init();

    const supabase = getSupabaseBrowserClientSafe();
    if (!supabase) return;

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const user = session?.user ?? null;
      if (user) {
        setIsLoggedIn(true);
        setUserAvatarUrl(
          (user.user_metadata?.avatar_url as string | undefined) ??
            (user.user_metadata?.picture as string | undefined) ??
            null,
        );
        void ensureUserProfile(user).then((needsNickname) => {
          if (!needsNickname) flushPendingAuthActionRef.current?.();
        });
      } else {
        setIsLoggedIn(false);
        setUserAvatarUrl(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [syncSession, ensureUserProfile]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleDrawCards = () => {
    setIsDrawing(true);
    setReading("");
    setReadingError(null);
    window.setTimeout(() => {
      setDrawnCards(drawTarotHand(spread));
      setIsDrawing(false);
    }, 700);
  };

  const handleSpreadChange = (next: TarotSpreadId) => {
    setSpread(next);
    setDrawnCards([]);
    setReading("");
    setReadingError(null);
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsAuthLoading(true);

    try {
      const supabase = getSupabaseBrowserClientSafe();
      if (!supabase) {
        throw new Error("로그인 설정을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.");
      }
      const callbackUrl = new URL("/auth/callback", getPublicSiteOrigin());
      callbackUrl.searchParams.set("next", "/");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl.toString() },
      });
      if (error) throw error;
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Google 로그인 요청에 실패했습니다.");
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    try {
      const supabase = getSupabaseBrowserClientSafe();
      if (supabase) await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    setIsLoggedIn(false);
    setUserAvatarUrl(null);
    window.location.assign(`${window.location.origin}/auth/signout`);
  };

  const saveUserNickname = async (skipped?: boolean) => {
    if (skipped) {
      setIsNicknameModalOpen(false);
      flushPendingAuthActionRef.current?.();
      return;
    }

    try {
      setIsNicknameSaving(true);
      setNicknameError(null);
      const supabase = getSupabaseBrowserClientSafe();
      if (!supabase) {
        throw new Error("로그인 세션을 확인할 수 없습니다.");
      }
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.user) {
        throw new Error("로그인 세션을 확인할 수 없습니다.");
      }

      const user = sessionData.session.user;
      const trimmed = nicknameDraft.trim() || getDefaultNicknameFromUser(user);
      const taken = await isNicknameTakenByOther(supabase, trimmed, user.id);
      if (taken) {
        setNicknameError("이미 사용 중인 닉네임입니다.");
        return;
      }

      const { data: updatedRow, error } = await supabase
        .from("USER_MST")
        .update({ nickname: trimmed })
        .eq("auth_id", user.id)
        .select("auth_id")
        .maybeSingle();

      if (error) throw error;

      if (!updatedRow) {
        const { error: upErr } = await supabase.from("USER_MST").upsert(
          { auth_id: user.id, nickname: trimmed },
          { onConflict: "auth_id" },
        );
        if (upErr) throw upErr;
      }

      setNicknameDraft(trimmed);
      setIsNicknameModalOpen(false);
      flushPendingAuthActionRef.current?.();
    } catch (error) {
      setNicknameError(error instanceof Error ? error.message : "닉네임 저장 중 오류가 발생했습니다.");
    } finally {
      setIsNicknameSaving(false);
    }
  };

  const runReading = async () => {
    if (drawnCards.length !== spreadConfig.count) {
      setReadingError("먼저 카드를 뽑아 주세요.");
      return;
    }

    setReadingError(null);
    setIsReadingLoading(true);
    setReading("");

    try {
      const response = await fetch("/api/ai/tarot-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          spread,
          question: question.trim() || undefined,
          cards: drawnCards.map((card) => ({
            id: card.id,
            suit: card.suit,
            nameKo: card.nameKo,
            nameEn: card.nameEn,
            position: card.position,
            orientation: card.orientation,
            keywords: card.keywords,
          })),
        }),
      });

      const data = (await response.json()) as {
        reading?: string;
        error?: string;
        code?: string;
        warning?: string;
        remainingToday?: number;
      };

      if (response.status === 401 || data.code === "auth_required") {
        setPendingAuthAction("start-reading");
        setIsLoginModalOpen(true);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "AI 리딩에 실패했습니다.");
      }

      const nextReading = data.reading?.trim() ?? "";
      if (!nextReading) {
        throw new Error("AI 리딩 내용이 비어 있습니다. 다시 시도해 주세요.");
      }
      setReading(nextReading);
      if (typeof data.remainingToday === "number") {
        setRemainingToday(data.remainingToday);
      }
    } catch (error) {
      setReading("");
      setReadingError(error instanceof Error ? error.message : "AI 리딩 중 오류가 발생했습니다.");
    } finally {
      setIsReadingLoading(false);
    }
  };

  const handleStartReading = async () => {
    if (drawnCards.length !== spreadConfig.count) {
      setReadingError("카드를 먼저 뽑아 주세요.");
      return;
    }

    if (isNicknameModalOpen) {
      setPendingAuthAction("start-reading");
      return;
    }

    await runReading();
  };

  flushPendingAuthActionRef.current = () => {
    const action = pendingAuthActionRef.current;
    setPendingAuthAction(null);
    setIsLoginModalOpen(false);
    if (action === "advance-step") {
      setStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
    } else if (action === "start-reading") {
      void runReading();
    }
  };

  return (
    <main className="tarot-home-page relative flex min-h-dvh flex-col overflow-x-hidden">
      <div className="tarot-home-glow" aria-hidden />

      <div className="tarot-page-inner flex-1">
        <header className="flex min-w-0 items-center justify-between gap-3">
          <a
            href="/"
            className="font-brand-display min-w-0 shrink text-xl leading-tight tracking-tight text-violet-950 sm:text-2xl md:text-3xl"
          >
            <span className="block truncate">{SERVICE_NAME}</span>
          </a>

          <div ref={userMenuRef} className="relative shrink-0">
            {isLoggedIn ? (
              <button
                type="button"
                aria-label="사용자 메뉴"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="h-10 w-10 overflow-hidden rounded-full border border-violet-200 bg-white shadow-sm transition hover:border-violet-400"
              >
                {userAvatarUrl ? (
                  <img src={userAvatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="inline-flex h-full w-full items-center justify-center bg-violet-100 text-xs font-semibold text-violet-700">
                    ME
                  </span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPendingAuthAction(null);
                  setIsLoginModalOpen(true);
                }}
                className="rounded-full border border-violet-300 bg-white/95 px-4 py-2 text-xs font-semibold text-violet-800 shadow-sm transition hover:border-violet-400 hover:bg-violet-100"
              >
                Google 로그인
              </button>
            )}

            <div
              className={`absolute right-0 top-12 z-20 w-40 overflow-hidden rounded-xl border border-violet-200 bg-white/95 shadow-lg shadow-violet-200/50 transition-all duration-300 ${
                isLoggedIn && isUserMenuOpen
                  ? "max-h-40 translate-y-0 p-1.5 opacity-100"
                  : "pointer-events-none max-h-0 -translate-y-1 p-0 opacity-0"
              }`}
            >
              <a
                href="/mypage"
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-violet-100"
              >
                마이페이지
              </a>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
              >
                로그아웃
              </button>
            </div>
          </div>
        </header>

        <StepTopProgressBar current={step} />

        <section className="w-full min-w-0 rounded-2xl border border-violet-200 bg-white/85 p-4 shadow-lg shadow-violet-200/50 backdrop-blur-sm sm:p-5 md:p-6">
          <div className="border-b border-violet-200 pb-4 text-center">
            {step === 1 ? (
              <>
                <h1 className="font-brand-display text-balance text-2xl tracking-tight text-violet-950 sm:text-3xl md:text-[2rem]">
                  AI 타로
                </h1>
                <p className="mt-1 text-pretty text-sm text-violet-700/90 sm:text-base">{SERVICE_TAGLINE}</p>
              </>
            ) : null}
            <h2
              className={`text-balance text-base font-semibold text-violet-950 sm:text-lg ${step === 1 ? "mt-5 sm:mt-6" : ""}`}
            >
              {stepMeta.title}
            </h2>
            <p className="mt-1 text-pretty text-xs leading-5 text-slate-400 sm:text-sm">{stepMeta.description}</p>
          </div>

          {step === 1 && (
            <div className="mt-4">
              <div className="tarot-topic-grid">
                {TAROT_TOPICS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setTopic(item.id);
                      setReading("");
                      setReadingError(null);
                    }}
                    className={`flex min-h-[4.25rem] flex-col justify-center rounded-xl border px-2.5 py-2.5 text-left transition sm:min-h-[4.5rem] sm:px-3 sm:py-3 ${
                      topic === item.id
                        ? "border-violet-500 bg-violet-100 text-violet-950 ring-1 ring-violet-300 shadow-sm"
                        : "border-violet-200 bg-white/80 text-slate-700 hover:border-violet-300 hover:bg-violet-50"
                    }`}
                  >
                    <span className="block text-[13px] font-semibold leading-snug sm:text-sm">{item.label}</span>
                    <span className="mt-1 block text-[10px] leading-snug text-slate-400 sm:text-[11px]">{item.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mt-4">
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={400}
                rows={4}
                placeholder={topicPlaceholder(topic)}
                className="w-full resize-none rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:border-violet-400 focus:ring-1 focus:ring-violet-300/30"
              />
              <p className="mt-2 text-[11px] text-slate-500">입력하지 않아도 다음 단계로 진행할 수 있어요.</p>
            </div>
          )}

          {step === 3 && (
            <div className="mt-4 space-y-5">
              <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="뽑을 카드 수">
                {TAROT_SPREADS.map((item) => {
                  const isSelected = spread === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={isDrawing}
                      onClick={() => handleSpreadChange(item.id)}
                      className={`flex min-h-[5.5rem] flex-col rounded-xl border p-3.5 text-left transition disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[6rem] sm:p-4 ${
                        isSelected
                          ? "border-violet-400 bg-violet-100 ring-1 ring-violet-300"
                          : "border-violet-200 bg-violet-50/90 hover:border-violet-300 hover:bg-white/80"
                      }`}
                    >
                      <span
                        className={`text-base font-semibold sm:text-[1.05rem] ${
                          isSelected ? "text-violet-950" : "text-slate-800"
                        }`}
                      >
                        {item.label}
                      </span>
                      <span className="mt-1.5 text-pretty text-[11px] leading-relaxed text-slate-400 sm:text-xs">
                        {item.description}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="tarot-draw-stage rounded-2xl border border-violet-200 bg-violet-50/80 px-3 py-5 sm:px-5 sm:py-6">
                {isDrawing ? (
                  <p className="mb-4 flex items-center justify-center gap-2 text-center text-xs text-violet-600/90" role="status" aria-live="polite">
                    <span className="tarot-draw-pulse" aria-hidden />
                    카드를 섞고 있어요
                  </p>
                ) : null}

                <div className={cardsLayoutClass} aria-busy={isDrawing}>
                  {isDrawing
                    ? Array.from({ length: spreadConfig.count }).map((_, index) => (
                        <TarotDrawSlot
                          key={`drawing-${index}`}
                          positionLabel={spreadConfig.positions[index] ?? `카드 ${index + 1}`}
                        >
                          <TarotCardShimmerBack />
                        </TarotDrawSlot>
                      ))
                    : null}

                  {!isDrawing && drawnCards.length > 0
                    ? drawnCards.map((card) => (
                        <TarotDrawSlot key={`${card.id}-${card.position}`} positionLabel={card.position}>
                          <DrawnCardPanel card={card} showMeta={false} />
                        </TarotDrawSlot>
                      ))
                    : null}

                  {!isDrawing && drawnCards.length === 0
                    ? Array.from({ length: spreadConfig.count }).map((_, index) => (
                        <TarotDrawSlot
                          key={`placeholder-${index}`}
                          positionLabel={spreadConfig.positions[index] ?? `카드 ${index + 1}`}
                        >
                          <TarotCardBack />
                        </TarotDrawSlot>
                      ))
                    : null}
                </div>
              </div>

              <button
                type="button"
                onClick={handleDrawCards}
                disabled={isDrawing}
                className="w-full rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-violet-300/45 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isDrawing ? "뽑는 중..." : drawnCards.length > 0 ? "카드 다시 뽑기" : "카드 뽑기"}
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm text-slate-400">
                <p>
                  <span className="text-slate-500">리딩 테마</span>{" "}
                  <span className="font-medium text-violet-900">{selectedTopic.label}</span>
                </p>
                {question.trim() ? (
                  <p className="mt-2">
                    <span className="text-slate-500">질문</span>{" "}
                    <span className="text-slate-700">{question.trim()}</span>
                  </p>
                ) : null}
                <p className="mt-2">
                  <span className="text-slate-500">스프레드</span>{" "}
                  <span className="font-medium text-violet-900">{spreadConfig.label}</span>
                </p>
              </div>

              {drawnCards.length > 0 ? (
                <div className={`${cardsLayoutClass} mt-4`}>
                  {drawnCards.map((card) => (
                    <TarotDrawSlot key={`summary-${card.id}-${card.position}`} positionLabel={card.position}>
                      <DrawnCardPanel card={card} showMeta={false} />
                    </TarotDrawSlot>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  카드가 없습니다. 이전 단계에서 카드를 뽑아 주세요.
                </p>
              )}

              {isLoggedIn && remainingToday !== null ? (
                <p className="text-xs text-slate-400">오늘 남은 리딩: {remainingToday}회</p>
              ) : null}

              {reading && (
                <div className="space-y-2 rounded-xl border border-violet-200 bg-white/95 p-4 text-sm shadow-sm">
                  <p className="mb-3 text-xs font-semibold text-violet-600">리딩 결과</p>
                  <TarotReadingView text={reading} />
                </div>
              )}

              <button
                type="button"
                onClick={restartTarot}
                className="w-full rounded-xl border border-dashed border-violet-200 bg-white/90 px-4 py-3 text-sm font-semibold text-violet-700 transition hover:border-violet-400 hover:bg-violet-50"
              >
                타로 다시하기
              </button>
            </div>
          )}

          {readingError && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{readingError}</p>
          )}

          <div
            className={`tarot-step-nav mt-6 ${step > 1 ? "tarot-step-nav--split" : "tarot-step-nav--end"}`}
          >
            {step > 1 ? (
              <button
                type="button"
                onClick={goToPrevStep}
                className="w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-400 hover:bg-violet-100 min-[480px]:w-auto min-[480px]:min-w-[88px]"
              >
                이전
              </button>
            ) : null}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={goToNextStep}
                disabled={step === 3 && isDrawing}
                className="w-full min-w-0 rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-8 py-3 text-sm font-semibold text-white shadow-md shadow-violet-300/45 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 min-[480px]:w-auto min-[480px]:min-w-[108px]"
              >
                다음
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleStartReading()}
                disabled={isReadingLoading || drawnCards.length !== spreadConfig.count}
                className="w-full max-w-full rounded-xl border border-violet-300 bg-violet-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50 min-[480px]:w-auto min-[480px]:px-6"
              >
                {isReadingLoading ? "AI가 카드를 읽는 중..." : reading ? "다시 리딩하기" : "결과 보기"}
              </button>
            )}
          </div>
        </section>
      </div>

      <MeloballoonPromoBanner />

      {isLoginModalOpen && (
        <div className="tarot-login-modal-backdrop fixed inset-0 z-[300] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div className="tarot-login-modal relative max-h-[min(90dvh,100%)] w-full max-w-sm overflow-hidden rounded-t-3xl border border-violet-200 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl shadow-violet-300/35 sm:rounded-3xl">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-violet-100 via-purple-50 to-transparent" />
            <button
              type="button"
              aria-label="닫기"
              onClick={() => {
                setIsLoginModalOpen(false);
                setPendingAuthAction(null);
              }}
              className="absolute right-4 top-4 z-10 rounded-full p-1 text-slate-400 transition hover:bg-violet-100 hover:text-violet-900"
            >
              ✕
            </button>
            <div className="relative px-6 pb-2 pt-10 text-center">
              <p className="font-brand-display text-[2rem] leading-none tracking-tight text-violet-950 sm:text-[2.25rem]">
                {SERVICE_NAME}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Google 계정으로 로그인하고
                <br />
                나만의 타로 리딩을 시작해 보세요.
              </p>
            </div>
            <div className="relative space-y-4 px-6 pb-6 pt-2">
              {authError && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{authError}</p>
              )}
              <button
                type="button"
                onClick={() => void handleGoogleSignIn()}
                disabled={isAuthLoading}
                className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-violet-200 hover:bg-violet-50/50 disabled:opacity-70"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {isAuthLoading ? "이동 중..." : "Google 계정으로 계속하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isNicknameModalOpen && (
        <div className="fixed inset-0 z-[310] flex items-end justify-center bg-violet-950/25 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[min(90dvh,100%)] w-full max-w-sm overflow-y-auto rounded-t-3xl border border-violet-200 bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl shadow-violet-300/35 sm:rounded-3xl">
            <p className="text-center text-lg font-bold text-violet-700">환영합니다</p>
            <p className="mt-2 text-center text-sm text-slate-400">닉네임을 설정하거나 건너뛸 수 있어요.</p>
            <input
              value={nicknameDraft}
              onChange={(event) => setNicknameDraft(event.target.value)}
              maxLength={30}
              placeholder="닉네임"
              className="mt-4 w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-300/30"
            />
            {nicknameError && <p className="mt-2 text-sm text-red-600">{nicknameError}</p>}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void saveUserNickname()}
                disabled={isNicknameSaving}
                className="rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => void saveUserNickname(true)}
                className="rounded-lg border border-violet-200 px-4 py-2.5 text-sm text-slate-600"
              >
                건너뛰기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
