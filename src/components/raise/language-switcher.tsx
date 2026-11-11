"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "@/navigation";
import { localeLabels, type RoutedLocale } from "@/i18n/routing";

/** 헤더 오른쪽 지구본 — 한국어/English 전환 (같은 페이지 그대로, 검색 조건 유지) */
export function LanguageSwitcher({ variant = "icon" }: { variant?: "icon" | "list" }) {
  const t = useTranslations("common");
  const locale = useLocale() as RoutedLocale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (next: RoutedLocale) => {
    setOpen(false);
    if (next === locale) return;
    // 직접 고른 언어를 기억 (첫 방문 자동 선택보다 우선)
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    const query = window.location.search;
    startTransition(() => {
      router.replace(`${pathname}${query}`, { locale: next });
    });
  };

  const options = (Object.keys(localeLabels) as RoutedLocale[]).map((value) => (
    <button
      key={value}
      type="button"
      role="menuitemradio"
      aria-checked={value === locale}
      onClick={() => choose(value)}
      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
        value === locale ? "text-[var(--rz-text)]" : "text-[var(--rz-muted)] hover:bg-[var(--rz-panel-2)] hover:text-[var(--rz-text)]"
      }`}
    >
      <span>{localeLabels[value]}</span>
      {value === locale ? <span aria-hidden>✓</span> : null}
    </button>
  ));

  if (variant === "list") {
    return (
      <div className="border-t border-[var(--rz-line)] p-3" role="menu" aria-label={t("language")}>
        <p className="px-3 pb-1 text-xs text-[var(--rz-muted)]">{t("language")}</p>
        {options}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("changeLanguage")}
        title={t("changeLanguage")}
        disabled={pending}
        className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[var(--rz-line)] px-2.5 text-xs text-[var(--rz-muted)] transition hover:text-[var(--rz-text)] disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9s1.3-6.3 3.8-9z" />
        </svg>
        <span className="hidden font-medium uppercase sm:inline">{locale}</span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-40 rounded-xl border border-[var(--rz-line)] bg-[var(--rz-panel)] p-1 shadow-[var(--rz-shadow)]"
        >
          {options}
        </div>
      ) : null}
    </div>
  );
}
