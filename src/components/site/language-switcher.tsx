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

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={t("language")}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 ${
          open
            ? "border-violet-200 bg-violet-50 text-violet-600 shadow-sm ring-2 ring-violet-100"
            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
        }`}
      >
        <Globe className="h-[17px] w-[17px]" strokeWidth={1.75} aria-hidden />
      </button>

      <div
        role="listbox"
        aria-label={t("language")}
        className={`absolute right-0 top-[calc(100%+10px)] z-50 min-w-[176px] origin-top-right overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-[0_12px_40px_-8px_rgba(15,23,42,0.18)] backdrop-blur-md transition-all duration-200 ease-out ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1.5 scale-[0.97] opacity-0"
        }`}
      >
        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {t("language")}
        </p>
        <ul className="space-y-0.5">
          {locales.map((code) => {
            const isActive = code === locale;
            return (
              <li key={code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => selectLocale(code)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors duration-150 ${
                    isActive
                      ? "bg-gradient-to-r from-violet-50 via-white to-fuchsia-50 text-violet-900"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold tracking-wide ${
                      isActive
                        ? "bg-white text-violet-600 shadow-sm ring-1 ring-violet-100"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {localeMeta[code].code}
                  </span>
                  <span className={`flex-1 text-sm ${isActive ? "font-semibold" : "font-medium"}`}>
                    {localeLabels[code]}
                  </span>
                  {isActive ? (
                    <Check className="h-4 w-4 shrink-0 text-violet-500" strokeWidth={2.25} aria-hidden />
                  ) : (
                    <span className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
