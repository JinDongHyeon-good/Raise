"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/navigation";
import { localeLabels, type AppLocale, locales } from "@/i18n/routing";

const localeMeta: Record<AppLocale, { code: string }> = {
  ko: { code: "KO" },
  en: { code: "EN" },
  ja: { code: "JA" },
};

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  const selectLocale = (nextLocale: AppLocale) => {
    if (nextLocale === locale) {
      setOpen(false);
      return;
    }
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.replace(pathname, { locale: nextLocale });
    setOpen(false);
  };

  const renderOption = (code: AppLocale, variant: "dropdown" | "sheet") => {
    const isActive = code === locale;
    return (
      <li key={code}>
        <button
          type="button"
          role={variant === "dropdown" ? "option" : undefined}
          aria-selected={variant === "dropdown" ? isActive : undefined}
          onClick={() => selectLocale(code)}
          className={`flex w-full items-center gap-2.5 rounded-xl text-left transition-colors duration-150 ${
            variant === "dropdown" ? "px-2.5 py-2" : "px-3 py-3.5"
          } ${
            isActive
              ? "bg-[var(--piclick-beige-soft)] text-[var(--piclick-green-deep)]"
              : "text-[var(--piclick-ink)] hover:bg-[var(--piclick-beige)]/70"
          }`}
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold tracking-wide ${
              isActive
                ? "bg-white text-[var(--piclick-green)] shadow-sm ring-1 ring-[var(--piclick-green)]/20"
                : "bg-[var(--piclick-beige)] text-[var(--piclick-ink-muted)]"
            }`}
          >
            {localeMeta[code].code}
          </span>
          <span className={`flex-1 ${variant === "sheet" ? "text-base" : "text-sm"} ${isActive ? "font-semibold" : "font-medium"}`}>
            {localeLabels[code]}
          </span>
          {isActive ? (
            <Check className="h-4 w-4 shrink-0 text-[var(--piclick-green)]" strokeWidth={2.25} aria-hidden />
          ) : (
            <span className="h-4 w-4 shrink-0" aria-hidden />
          )}
        </button>
      </li>
    );
  };

  return (
    <div ref={rootRef} className={`relative flex h-10 w-10 shrink-0 items-center justify-center ${className}`}>
      <button
        type="button"
        aria-label={t("language")}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border p-0 leading-none transition-all duration-200 ${
          open
            ? "border-[var(--piclick-green)]/30 bg-[var(--piclick-beige-soft)] text-[var(--piclick-green)] shadow-sm ring-2 ring-[var(--piclick-green)]/15"
            : "border-[var(--piclick-green)]/15 bg-white text-[var(--piclick-ink-muted)] shadow-sm hover:border-[var(--piclick-green)]/30 hover:bg-[var(--piclick-beige-soft)] hover:text-[var(--piclick-green-deep)]"
        }`}
      >
        <Globe className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </button>

      {/* 데스크톱: 드롭다운 */}
      <div
        role="listbox"
        aria-label={t("language")}
        className={`absolute right-0 top-[calc(100%+10px)] z-50 hidden min-w-[176px] origin-top-right overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-[0_12px_40px_-8px_rgba(15,23,42,0.18)] backdrop-blur-md transition-all duration-200 ease-out sm:block ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1.5 scale-[0.97] opacity-0"
        }`}
      >
        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {t("language")}
        </p>
        <ul className="space-y-0.5">{locales.map((code) => renderOption(code, "dropdown"))}</ul>
      </div>

      {/* 모바일: 바텀시트 */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("language")}
        className={`fixed inset-0 z-50 sm:hidden ${open ? "" : "pointer-events-none"}`}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-[var(--piclick-line)] bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-16px_40px_-12px_rgba(15,23,42,0.25)] transition-transform duration-200 ease-out ${
            open ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--piclick-line)]" aria-hidden />
          <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            {t("language")}
          </p>
          <ul className="divide-y divide-[var(--piclick-line)]">{locales.map((code) => renderOption(code, "sheet"))}</ul>
        </div>
      </div>
    </div>
  );
}
