"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Briefcase,
  Building2,
  CalendarRange,
  Check,
  Compass,
  GraduationCap,
  Heart,
  Home,
  Layers,
  MapPin,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Sun,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { getLocalizedBrandName, getLocalizedTagline } from "@/lib/brand";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { UserMenuDropdown } from "@/components/site/user-menu-dropdown";
import type { AppLocale } from "@/i18n/routing";
import {
  getLocalizedSpreads,
  getLocalizedTopics,
  localizedOrientationLabel,
  localizedSpreadPositions,
  localizedTopicPlaceholder,
} from "@/lib/tarot-deck-i18n";
import { localizedCardKeywords } from "@/lib/tarot-keywords-i18n";
import { getDefaultNicknameFromUser } from "@/lib/default-nickname";
import { ensureUserProfileClient } from "@/lib/ensure-user-profile-client";
import { isNicknameTakenByOther } from "@/lib/nickname-duplicate";
import { getSupabaseBrowserClientSafe } from "@/lib/supabase-safe";
import { SiteFooter } from "@/components/site/site-footer";
import { AuthPanel } from "@/components/auth/auth-panel";
import { TarotReadingSkeleton } from "@/components/tarot/tarot-reading-skeleton";
import { TarotReadingView } from "@/components/tarot/tarot-reading-view";
import {
  drawTarotHand,
  getTarotCardApiUrl,
  getTarotImageUrl,
  type DrawnTarotCard,
  type TarotSpreadId,
  type TarotTopicId,
} from "@/lib/tarot-deck";

function localizedCardDisplayName(card: DrawnTarotCard, locale: AppLocale) {
  if (locale === "en") return { primary: card.nameEn, secondary: null as string | null };
  if (locale === "ja") return { primary: card.nameKo, secondary: card.nameEn };
  return { primary: card.nameKo, secondary: card.nameEn };
}

const TOPIC_ICONS: Record<TarotTopicId, LucideIcon> = {
  today: Sun,
  weekly: CalendarRange,
  love: Heart,
  couple: Users,
  reunite: RefreshCw,
  family: Home,
  social: UserRound,
  career: Briefcase,
  business: Building2,
  money: Wallet,
  study: GraduationCap,
  wellbeing: Sparkles,
  choice: Compass,
  move: MapPin,
  growth: TrendingUp,
  general: Sparkles,
};

function TarotTopicCard({
  topicId,
  label,
  hint,
  selected,
  onSelect,
}: {
  topicId: TarotTopicId;
  label: string;
  hint: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = TOPIC_ICONS[topicId] ?? Sparkles;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`tarot-topic-card group h-full w-full ${selected ? "tarot-topic-card--selected" : ""}`}
    >
      <div className="tarot-topic-card__inner">
        <span className="tarot-topic-card__icon" aria-hidden>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div className="tarot-topic-card__body">
          <span className="tarot-topic-card__label">{label}</span>
          <span className="tarot-topic-card__hint">{hint}</span>
        </div>
      </div>
      {selected ? (
        <span className="tarot-topic-card__check" aria-hidden>
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </span>
      ) : null}
    </button>
  );
}

function TarotSpreadPreview({ count }: { count: number }) {
  const slots = count === 1 ? [0] : [0, 1, 2];

  return (
    <div
      className={`tarot-spread-card__preview ${
        count === 1 ? "tarot-spread-card__preview--single" : "tarot-spread-card__preview--triple"
      }`}
      aria-hidden
    >
      {slots.map((slot) => (
        <span
          key={slot}
          className={`tarot-spread-card__card${
            count === 1 ? " tarot-spread-card__card--solo" : slot === 1 ? " tarot-spread-card__card--center" : ""
          }`}
        />
      ))}
    </div>
  );
}

function TarotSpreadCard({
  count,
  label,
  description,
  selected,
  disabled,
  onSelect,
}: {
  count: number;
  label: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={`tarot-spread-card group h-full w-full ${selected ? "tarot-spread-card--selected" : ""}`}
    >
      <div className="tarot-spread-card__inner">
        <TarotSpreadPreview count={count} />
        <div className="tarot-spread-card__body">
          <span className="tarot-spread-card__label">{label}</span>
          <span className="tarot-spread-card__desc">{description}</span>
        </div>
      </div>
      {selected ? (
        <span className="tarot-spread-card__check" aria-hidden>
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </span>
      ) : null}
    </button>
  );
}

function CardLoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8" role="status" aria-live="polite" aria-label="불러오는 중">
      <div className="relative h-8 w-8" aria-hidden>
        <div className="absolute inset-0 rounded-full border border-slate-200" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-slate-400" />
      </div>
    </div>
  );
}

function TarotCardShimmerBack() {
  return (
    <div className="relative mx-auto aspect-[2/3] w-full overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-sm shadow-slate-100/30">
      <div className="tarot-card-shimmer absolute inset-0" aria-hidden />
      <div className="relative flex h-full flex-col items-center justify-center gap-1.5 p-3">
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-400">Melotaro</span>
        <span className="text-2xl text-slate-300">✦</span>
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
      <p className="mb-1.5 line-clamp-2 text-center text-[10px] font-medium leading-tight tracking-wide text-slate-600/90 sm:mb-2.5 sm:text-[11px]">
        {positionLabel}
      </p>
      <div className="w-full min-w-0">{children}</div>
    </div>
  );
}

function TarotCardBack({ label }: { label?: string }) {
  return (
    <div
      className="relative mx-auto flex aspect-[2/3] w-full items-center justify-center rounded-lg border border-slate-200/80 bg-white shadow-sm shadow-slate-100/30"
      aria-hidden={!label}
    >
      <div className="flex flex-col items-center gap-1 p-3 text-center">
        <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-slate-600">Melotaro</span>
        <span className="text-2xl text-slate-700">✦</span>
        {label ? <span className="text-[10px] text-slate-600/80">{label}</span> : null}
      </div>
    </div>
  );
}

function TarotCardFace({ card, locale }: { card: DrawnTarotCard; locale: AppLocale }) {
  const t = useTranslations("tarot");
  const { primary } = localizedCardDisplayName(card, locale);
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState(false);
  const [src, setSrc] = useState(() => getTarotImageUrl(card));

  return (
    <div className="relative mx-auto w-full min-w-0">
      <div
        className={`relative flex aspect-[2/3] w-full items-center justify-center bg-white/90 ${
          card.orientation === "reversed" ? "rotate-180" : ""
        }`}
      >
        {!loaded && !error ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50/90">
            <CardLoadingSpinner />
          </div>
        ) : null}
        {error ? (
          <div className="flex h-full w-full items-center justify-center border border-dashed border-slate-200 px-2 text-center text-xs text-slate-600">
            {t("cardImageError")}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={primary}
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
            className={`h-full w-full object-contain object-center transition-opacity duration-300 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
      </div>
    </div>
  );
}

function DrawnCardCaption({ card, locale }: { card: DrawnTarotCard; locale: AppLocale }) {
  const { primary, secondary } = localizedCardDisplayName(card, locale);
  const orientationLabel = localizedOrientationLabel(card.orientation, locale);

  return (
    <div className="mt-2 w-full min-w-0 px-0.5 text-center">
      <p className="line-clamp-2 text-[11px] font-bold leading-snug text-slate-900 sm:text-xs">{primary}</p>
      {secondary ? (
        <p className="mt-0.5 line-clamp-1 text-[10px] leading-tight text-slate-400">{secondary}</p>
      ) : null}
      <p
        className={`mt-1 text-[10px] font-medium ${
          card.orientation === "reversed" ? "text-amber-700" : "text-emerald-700"
        }`}
      >
        {orientationLabel}
      </p>
    </div>
  );
}

const TOTAL_STEPS = 3;
const PENDING_AUTH_STORAGE_KEY = "melotaro-pending-auth";

function scrollTarotPageToTop() {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

type PendingAuthAction = "advance-step" | "start-reading";

const STEP_ICONS = [Sparkles, MessageSquare, Layers] as const;

function StepTopProgressBar({ current }: { current: number }) {
  const t = useTranslations("tarot");
  const steps = Array.from({ length: TOTAL_STEPS }, (_, index) => index + 1);

  return (
    <nav
      className="tarot-step-progress mx-auto mb-4 w-full max-w-md px-2 sm:mb-5 sm:max-w-lg"
      aria-label={t("stepProgress", { current, total: TOTAL_STEPS })}
    >
      <div className="tarot-step-progress__track">
        {steps.map((stepNumber, index) => {
          const isActive = stepNumber === current;
          const isDone = stepNumber < current;
          const state = isActive ? "active" : isDone ? "done" : "pending";
          const StepIcon = STEP_ICONS[index];
          const lineFilled = index > 0 && stepNumber <= current;

          return (
            <Fragment key={stepNumber}>
              {index > 0 ? (
                <div className="tarot-step-progress__line" aria-hidden>
                  <div className={`tarot-step-progress__line-fill${lineFilled ? " is-filled" : ""}`} />
                </div>
              ) : null}

              <div className="tarot-step-progress__node" data-state={state}>
                <div className="tarot-step-progress__circle-wrap">
                  {isActive ? (
                    <>
                      <span className="tarot-step-progress__ring" aria-hidden />
                      <span className="tarot-step-progress__ring tarot-step-progress__ring--delayed" aria-hidden />
                    </>
                  ) : null}

                  <div className="tarot-step-progress__circle" aria-current={isActive ? "step" : undefined}>
                    {isDone ? (
                      <Check className="tarot-step-progress__check" strokeWidth={2.75} aria-hidden />
                    ) : (
                      <StepIcon className="tarot-step-progress__icon" strokeWidth={2.25} aria-hidden />
                    )}
                  </div>
                </div>

                <span className="tarot-step-progress__label">{t(`stepLabels.${stepNumber}` as "stepLabels.1")}</span>
              </div>
            </Fragment>
          );
        })}
      </div>
    </nav>
  );
}

export default function TarotHome({ initialTopic }: { initialTopic?: TarotTopicId }) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("tarot");
  const tCommon = useTranslations("common");
  const localizedTopics = getLocalizedTopics(locale);
  const localizedSpreads = getLocalizedSpreads(locale);
  const brandName = getLocalizedBrandName(locale);
  const tagline = getLocalizedTagline(locale);

  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState<TarotTopicId>(initialTopic ?? "today");
  const [spread, setSpread] = useState<TarotSpreadId>("single");
  const [question, setQuestion] = useState("");
  const [drawnCards, setDrawnCards] = useState<DrawnTarotCard[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [reading, setReading] = useState("");
  const [readingError, setReadingError] = useState<string | null>(null);
  const [isReadingLoading, setIsReadingLoading] = useState(false);
  const [readingCopied, setReadingCopied] = useState(false);
  const [isReadingErrorModalOpen, setIsReadingErrorModalOpen] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [isNicknameSaving, setIsNicknameSaving] = useState(false);

  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const pendingAuthActionRef = useRef<PendingAuthAction | null>(null);
  const readingInFlightRef = useRef(false);
  const scrollToTopOnStepRef = useRef(false);

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

  const spreadConfig = localizedSpreads.find((item) => item.id === spread) ?? localizedSpreads[0];
  const spreadPositions = localizedSpreadPositions(spread, locale);
  const isSingleSpread = spreadConfig.count === 1;
  const cardsLayoutClass = isSingleSpread ? "tarot-cards-single" : "tarot-cards-multi";
  const selectedTopic = localizedTopics.find((item) => item.id === topic) ?? localizedTopics[0];
  const stepMeta = {
    title: t(`steps.${step}.title` as "steps.1.title" | "steps.2.title" | "steps.3.title"),
    description: t(`steps.${step}.description` as "steps.1.description" | "steps.2.description" | "steps.3.description"),
  };
  const isResultActionBusy = isDrawing || isReadingLoading;
  const showStepPrev = step > 1 && !(step === TOTAL_STEPS && reading);
  const showStepPrimary = step !== TOTAL_STEPS || !reading;
  const showStepNav = showStepPrev || showStepPrimary;

  const prevLocaleRef = useRef(locale);

  useEffect(() => {
    if (prevLocaleRef.current === locale) return;
    prevLocaleRef.current = locale;

    setReading("");
    setReadingCopied(false);
    setReadingError(null);

    setDrawnCards((prev) => {
      if (prev.length === 0) return prev;
      const positions = localizedSpreadPositions(spread, locale);
      return prev.map((card, index) => ({
        ...card,
        position: positions[index] ?? card.position,
      }));
    });
  }, [locale, spread]);

  useLayoutEffect(() => {
    if (!scrollToTopOnStepRef.current) return;
    scrollToTopOnStepRef.current = false;
    scrollTarotPageToTop();
  }, [step]);

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
    } else if (step === 3) {
      setReading("");
      setIsReadingLoading(false);
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
      if (step < TOTAL_STEPS) {
        scrollToTopOnStepRef.current = true;
      }
      setStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
    })();
  };

  const restartTarot = () => {
    if (isDrawing || isReadingLoading || readingInFlightRef.current) return;

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

      if (!data?.auth_id) {
        try {
          await ensureUserProfileClient(supabase, user.id, user);
        } catch (profileError) {
          console.error("[user-profile] create failed", profileError);
          return false;
        }
        setNicknameDraft(defaultNickname);
        setNicknameError(null);
        setIsNicknameModalOpen(true);
        return true;
      }

      if (welcomeFromSignup) {
        setNicknameDraft(data.nickname?.trim() || defaultNickname);
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
    if (isDrawing || isReadingLoading || readingInFlightRef.current) return;

    setIsDrawing(true);
    setReading("");
    setReadingError(null);
    window.setTimeout(() => {
      const positions = localizedSpreadPositions(spread, locale);
      const drawn = drawTarotHand(spread).map((card, index) => ({
        ...card,
        position: positions[index] ?? card.position,
      }));
      setDrawnCards(drawn);
      setIsDrawing(false);
    }, 700);
  };

  const handleSpreadChange = (next: TarotSpreadId) => {
    if (isDrawing || isReadingLoading || readingInFlightRef.current) return;

    setSpread(next);
    setDrawnCards([]);
    setReading("");
    setReadingError(null);
  };

  const handleEmailAuthSuccess = useCallback(async () => {
    const user = await syncSession();
    if (!user) return;

    const needsNickname = await ensureUserProfile({
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata ?? undefined,
    });

    setIsLoginModalOpen(false);
    if (!needsNickname) {
      setPendingAuthAction(null);
      flushPendingAuthActionRef.current?.();
    }
  }, [syncSession, ensureUserProfile]);

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
      try {
        const supabase = getSupabaseBrowserClientSafe();
        if (supabase) {
          const { data: sessionData } = await supabase.auth.getSession();
          const user = sessionData.session?.user;
          if (user) {
            await ensureUserProfileClient(supabase, user.id, user);
          }
        }
      } catch {
        /* ignore */
      }
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
          { auth_id: user.id, nickname: trimmed, use_count: 0 },
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
      setReadingError(t("drawCardsFirst"));
      return;
    }
    if (readingInFlightRef.current) {
      return;
    }

    setReadingError(null);
    setIsReadingErrorModalOpen(false);
    setReadingCopied(false);
    setIsReadingLoading(true);
    setReading("");
    readingInFlightRef.current = true;

    const positions = localizedSpreadPositions(spread, locale);

    const payload = {
      topic,
      spread,
      locale,
      question: question.trim() || undefined,
      cards: drawnCards.map((card, index) => ({
        id: card.id,
        suit: card.suit,
        nameKo: card.nameKo,
        nameEn: card.nameEn,
        position: positions[index] ?? card.position,
        orientation: card.orientation,
        keywords: localizedCardKeywords(card.id, card.keywords, locale),
      })),
    };

    const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
    const maxAttempts = 2;

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        let response: Response;
        try {
          response = await fetch("/api/ai/tarot-reading", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch {
          if (attempt < maxAttempts) {
            await sleep(2000 * attempt);
            continue;
          }
          throw new Error(t("errors.network"));
        }

        let data: {
          reading?: string;
          error?: string;
          code?: string;
          warning?: string;
        } = {};

        try {
          data = (await response.json()) as typeof data;
        } catch {
          if (attempt < maxAttempts && (response.status === 502 || response.status === 504)) {
            await sleep(2000 * attempt);
            continue;
          }
          throw new Error(t("errors.parse"));
        }

        if (response.status === 401 || data.code === "auth_required") {
          setPendingAuthAction("start-reading");
          setIsLoginModalOpen(true);
          return;
        }

        if (response.status === 409 || data.code === "in_flight") {
          setReadingError(t("readingInFlight"));
          return;
        }

        const shouldRetry =
          attempt < maxAttempts &&
          response.status !== 429 &&
          response.status !== 409 &&
          (response.status === 504 ||
            response.status === 502 ||
            data.code === "timeout" ||
            data.code === "gemini_error");

        if (!response.ok) {
          if (shouldRetry) {
            await sleep(2000 * attempt);
            continue;
          }
          throw new Error(data.error || t("readingFailed"));
        }

        const nextReading = data.reading?.trim() ?? "";
        if (!nextReading) {
          if (shouldRetry) {
            await sleep(2000 * attempt);
            continue;
          }
          throw new Error(t("readingEmpty"));
        }

        setReading(nextReading);
        return;
      }
    } catch (error) {
      setReading("");
      setReadingError(error instanceof Error ? error.message : t("readingGenericError"));
      setIsReadingErrorModalOpen(true);
    } finally {
      readingInFlightRef.current = false;
      setIsReadingLoading(false);
    }
  };

  const handleStartReading = async () => {
    if (isReadingLoading || readingInFlightRef.current) return;

    if (drawnCards.length !== spreadConfig.count) {
      setReadingError(t("drawCardsFirst"));
      return;
    }

    if (isNicknameModalOpen) {
      setPendingAuthAction("start-reading");
      return;
    }

    await runReading();
  };

  const handleCopyReading = async () => {
    if (!reading.trim()) return;

    try {
      await navigator.clipboard.writeText(reading);
      setReadingCopied(true);
      window.setTimeout(() => setReadingCopied(false), 2000);
    } catch {
      setReadingError(t("copyFailed"));
    }
  };

  useLayoutEffect(() => {
    flushPendingAuthActionRef.current = () => {
      const action = pendingAuthActionRef.current;
      setPendingAuthAction(null);
      setIsLoginModalOpen(false);
      if (action === "advance-step") {
        scrollToTopOnStepRef.current = true;
        setStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
      } else if (action === "start-reading") {
        void runReading();
      }
    };
  });

  return (
    <main className="tarot-home-page relative flex min-h-dvh flex-col overflow-x-hidden">
      <div className="tarot-home-glow" aria-hidden />

      <div className="tarot-page-inner flex-1">
        <header className="flex min-w-0 items-center justify-between gap-3">
          <Link
            href="/"
            className="font-brand-display flex min-w-0 shrink items-center gap-1.5 text-xl leading-tight tracking-tight text-slate-900 sm:text-2xl md:text-3xl"
          >
            <span
              aria-hidden
              className="bg-gradient-to-br from-violet-500 to-fuchsia-500 bg-clip-text text-transparent"
            >
              ✦
            </span>
            <span className="block truncate">{brandName}</span>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher />

            <div
              ref={userMenuRef}
              className={`relative flex h-10 shrink-0 items-center justify-center ${isLoggedIn ? "w-10" : "w-auto"}`}
            >
              {isLoggedIn ? (
                <button
                  type="button"
                  aria-label={tCommon("userMenu")}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border p-0 leading-none shadow-sm transition ${
                    isUserMenuOpen
                      ? "border-violet-200 ring-2 ring-violet-100"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  {userAvatarUrl ? (
                    <img src={userAvatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="inline-flex h-full w-full items-center justify-center bg-slate-100 text-xs font-semibold leading-none text-slate-700">
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
                  className="flex h-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold leading-none text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  {tCommon("login")}
                </button>
              )}

              <UserMenuDropdown
                open={isLoggedIn && isUserMenuOpen}
                onLogout={handleLogout}
                onNavigate={() => setIsUserMenuOpen(false)}
              />
            </div>
          </div>
        </header>

        <StepTopProgressBar current={step} />

        <section className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 md:p-6">
          <div className="border-b border-slate-200 pb-4 text-center">
            {step === 1 ? (
              <h1 className="font-brand-display mx-auto flex min-h-[3rem] max-w-2xl items-center justify-center text-balance text-2xl tracking-tight text-slate-900 sm:min-h-[3.25rem] sm:text-3xl md:text-[2rem]">
                {tagline}
              </h1>
            ) : null}
            <h2
              className={`mx-auto flex max-w-2xl items-center justify-center text-balance text-base font-semibold leading-snug text-slate-900 sm:min-h-[1.75rem] sm:text-lg ${step === 1 ? "mt-5 sm:mt-6" : ""}`}
            >
              {stepMeta.title}
            </h2>
            <p className="mx-auto mt-1 max-w-2xl min-h-[2.5rem] text-pretty text-xs leading-5 text-slate-400 sm:min-h-[2.75rem] sm:text-sm">
              {stepMeta.description}
            </p>
          </div>

          {step === 1 && (
            <div className="mt-4">
              <div className="tarot-topic-grid">
                {localizedTopics.map((item) => (
                  <TarotTopicCard
                    key={item.id}
                    topicId={item.id}
                    label={item.label}
                    hint={item.hint}
                    selected={topic === item.id}
                    onSelect={() => {
                      setTopic(item.id);
                      setReading("");
                      setReadingError(null);
                    }}
                  />
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
                placeholder={localizedTopicPlaceholder(topic, locale)}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
              />
              <p className="mt-2 text-[11px] text-slate-500">{t("questionOptional")}</p>
            </div>
          )}

          {step === 3 && (
            <div className="mt-4 space-y-4">
              <div className="tarot-spread-picker" role="radiogroup" aria-label={t("spreadAria")}>
                {localizedSpreads.map((item) => (
                  <TarotSpreadCard
                    key={item.id}
                    count={item.count}
                    label={item.label}
                    description={item.description}
                    selected={spread === item.id}
                    disabled={isDrawing || isReadingLoading}
                    onSelect={() => handleSpreadChange(item.id)}
                  />
                ))}
              </div>

              <div className="tarot-draw-stage">
                {isDrawing ? (
                  <p className="mb-3 flex items-center justify-center gap-2 text-center text-xs text-slate-600/90" role="status" aria-live="polite">
                    <span className="tarot-draw-pulse" aria-hidden />
                    {t("shuffling")}
                  </p>
                ) : null}

                <div className={cardsLayoutClass} aria-busy={isDrawing}>
                  {isDrawing
                    ? Array.from({ length: spreadConfig.count }).map((_, index) => (
                        <TarotDrawSlot
                          key={`drawing-${index}`}
                          positionLabel={spreadPositions[index] ?? t("cardLabel", { n: index + 1 })}
                        >
                          <TarotCardShimmerBack />
                        </TarotDrawSlot>
                      ))
                    : null}

                  {!isDrawing && drawnCards.length > 0
                    ? drawnCards.map((card, index) => (
                        <TarotDrawSlot
                          key={`${card.id}-${card.position}`}
                          positionLabel={spreadPositions[index] ?? card.position}
                        >
                          <TarotCardFace card={card} locale={locale} />
                          <DrawnCardCaption card={card} locale={locale} />
                        </TarotDrawSlot>
                      ))
                    : null}

                  {!isDrawing && drawnCards.length === 0
                    ? Array.from({ length: spreadConfig.count }).map((_, index) => (
                        <TarotDrawSlot
                          key={`placeholder-${index}`}
                          positionLabel={spreadPositions[index] ?? t("cardLabel", { n: index + 1 })}
                        >
                          <TarotCardBack />
                        </TarotDrawSlot>
                      ))
                    : null}
                </div>
              </div>

              {drawnCards.length === 0 ? (
                <button
                  type="button"
                  onClick={handleDrawCards}
                  disabled={isResultActionBusy}
                  className="w-full rounded-xl bg-slate-800 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {isDrawing ? tCommon("loading") : t("drawCards")}
                </button>
              ) : null}

              {isReadingLoading ? (
                <div className="min-w-0 border-t border-slate-100 pt-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">{t("readingResult")}</p>
                  </div>
                  <TarotReadingSkeleton sectionCount={spreadConfig.count} />
                </div>
              ) : null}

              {reading ? (
                <div className="min-w-0 space-y-4 border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">{t("readingResult")}</p>
                    <button
                      type="button"
                      onClick={() => void handleCopyReading()}
                      disabled={isResultActionBusy}
                      className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {readingCopied ? t("copied") : t("copyResult")}
                    </button>
                  </div>
                  <TarotReadingView text={reading} />
                  <button
                    type="button"
                    onClick={restartTarot}
                    disabled={isResultActionBusy}
                    className="w-full rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("restartTarot")}
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {readingError && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{readingError}</p>
          )}

          {showStepNav ? (
          <div
            className={`tarot-step-nav mt-6 ${showStepPrev && showStepPrimary ? "tarot-step-nav--split" : "tarot-step-nav--end"}`}
          >
            {showStepPrev ? (
              <button
                type="button"
                onClick={goToPrevStep}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 min-[480px]:w-auto min-[480px]:min-w-[88px]"
              >
                {tCommon("prev")}
              </button>
            ) : null}

            {step === TOTAL_STEPS && !reading ? (
              <button
                type="button"
                onClick={() => void handleStartReading()}
                disabled={isResultActionBusy || drawnCards.length !== spreadConfig.count}
                className="w-full min-w-0 rounded-xl border border-slate-300 bg-slate-800 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 min-[480px]:w-auto min-[480px]:min-w-[108px]"
              >
                {isReadingLoading ? t("reading") : t("viewResult")}
              </button>
            ) : step !== TOTAL_STEPS ? (
              <button
                type="button"
                onClick={goToNextStep}
                className="w-full min-w-0 rounded-xl bg-slate-800 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 min-[480px]:w-auto min-[480px]:min-w-[108px]"
              >
                {tCommon("next")}
              </button>
            ) : null}
          </div>
          ) : null}
        </section>
      </div>

      {isLoginModalOpen && (
        <div className="tarot-login-modal-backdrop fixed inset-0 z-[300] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div className="tarot-login-modal relative max-h-[min(90dvh,100%)] w-full max-w-sm overflow-y-auto rounded-t-3xl border border-slate-200 bg-white pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl shadow-slate-100/40 sm:rounded-3xl">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-slate-50 to-transparent" />
            <div className="relative px-6 pb-6 pt-10">
              <AuthPanel
                showCloseButton
                showHeader
                hideGoogleOnMobile
                nextPath="/"
                onClose={() => {
                  setIsLoginModalOpen(false);
                  setPendingAuthAction(null);
                }}
                onAuthenticated={handleEmailAuthSuccess}
              />
            </div>
          </div>
        </div>
      )}

      {isNicknameModalOpen && (
        <div className="fixed inset-0 z-[310] flex items-end justify-center bg-slate-900/20 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[min(90dvh,100%)] w-full max-w-sm overflow-y-auto rounded-t-3xl border border-slate-200 bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl shadow-slate-100/40 sm:rounded-3xl">
            <p className="text-center text-lg font-bold text-slate-700">환영합니다</p>
            <p className="mt-2 text-center text-sm text-slate-400">닉네임을 설정하거나 건너뛸 수 있어요.</p>
            <input
              value={nicknameDraft}
              onChange={(event) => setNicknameDraft(event.target.value)}
              maxLength={30}
              placeholder="닉네임"
              className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
            />
            {nicknameError && <p className="mt-2 text-sm text-red-600">{nicknameError}</p>}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void saveUserNickname()}
                disabled={isNicknameSaving}
                className="rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => void saveUserNickname(true)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600"
              >
                건너뛰기
              </button>
            </div>
          </div>
        </div>
      )}

      {isReadingErrorModalOpen && (
        <div className="fixed inset-0 z-[320] flex items-end justify-center bg-slate-900/20 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-sm rounded-t-3xl border border-slate-200 bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center shadow-2xl shadow-slate-100/40 sm:rounded-3xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-red-500" aria-hidden>
                <path
                  d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A1.5 1.5 0 0 0 3.4 20.5h17.2a1.5 1.5 0 0 0 1.29-2.46L13.71 3.86a1.5 1.5 0 0 0-2.42 0z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="mt-4 text-base font-bold text-slate-800">죄송합니다, 에러가 발생했습니다</p>
            <p className="mt-1.5 text-sm text-slate-400">잠시 후 다시 시도해 주세요.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsReadingErrorModalOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => void runReading()}
                className="rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      )}

      <SiteFooter maxWidthClassName="max-w-3xl" />
    </main>
  );
}
