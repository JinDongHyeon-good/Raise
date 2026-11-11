"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link, usePathname } from "@/navigation";
import { HeaderUser } from "@/components/auth/header-user";
import { BybitReferralMenu } from "@/components/raise/bybit-referral-menu";
import { LanguageSwitcher } from "@/components/raise/language-switcher";
import { LogoMark } from "@/components/raise/logo-mark";
import type { AppLocale } from "@/i18n/routing";
import { getLocalizedBrandName } from "@/lib/brand";

const NAV = [
  { href: "/", key: "navVideos", match: (path: string) => path === "/" },
  { href: "/chart", key: "navChart", match: (path: string) => path.startsWith("/chart") },
  { href: "/community", key: "navCommunity", match: (path: string) => path.startsWith("/community") },
  { href: "/faq", key: "navFaq", match: (path: string) => path.startsWith("/faq") },
] as const;

export function RaiseHeader() {
  const t = useTranslations("common");
  const SERVICE_NAME = getLocalizedBrandName(useLocale() as AppLocale);
  const pathname = usePathname() || "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  // 페이지가 바뀌면 메뉴를 닫고 헤더를 다시 보인다 (렌더 중 조정 — effect 불필요)
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
    setHidden(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen) return; // 메뉴가 열려 있으면 숨기지 않는다 (아래 headerHidden 참고)

    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY;
        if (y <= 8) {
          setHidden(false);
        } else if (delta > 6) {
          setHidden(true);
        } else if (delta < -6) {
          setHidden(false);
        }
        lastY = y;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [menuOpen]);

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b border-[var(--rz-line)] bg-[var(--rz-bg)]/85 backdrop-blur-xl transition-transform duration-300 ease-out ${
          hidden && !menuOpen ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="rz-container relative flex h-14 items-stretch justify-between gap-3 sm:h-16">
          <Link
            href="/"
            className="relative z-10 flex shrink-0 items-center gap-2 font-[family-name:var(--font-brand-display)] text-[17px] font-semibold tracking-tight sm:text-lg"
          >
            <LogoMark size={28} className="shrink-0" />
            {SERVICE_NAME}
          </Link>

          <nav
            className="absolute left-1/2 top-0 hidden h-full -translate-x-1/2 items-stretch gap-1 md:flex"
            aria-label={t("mainMenu")}
          >
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center px-3.5 text-sm transition-colors ${
                    active ? "font-medium text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  {t(item.key)}
                  {active ? (
                    <span aria-hidden className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-white" />
                  ) : null}
                </Link>
              );
            })}
            <BybitReferralMenu variant="desktop" />
          </nav>

          <div className="relative z-10 ml-auto flex shrink-0 items-center gap-2 self-center">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            {/* 로그인 확인 전·후(빈칸 → 로그인 버튼 → 프로필)로 폭이 바뀌어 옆 버튼이 움직이지 않게 고정 칸 */}
            <div className="flex w-16 shrink-0 justify-end">
              <HeaderUser />
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--rz-line)] text-[var(--rz-text)] md:hidden"
              aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
              aria-expanded={menuOpen}
              aria-controls="mobile-sidebar"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="sr-only">{menuOpen ? t("closeMenu") : t("openMenu")}</span>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                {menuOpen ? (
                  <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                ) : (
                  <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 모바일 사이드바 */}
      <div className="md:hidden" aria-hidden={!menuOpen}>
        <button
          type="button"
          tabIndex={menuOpen ? 0 : -1}
          aria-label={t("closeMenu")}
          onClick={() => setMenuOpen(false)}
          className={`fixed inset-0 z-50 bg-black/55 transition-opacity duration-300 ease-out ${
            menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />
        <aside
          id="mobile-sidebar"
          role="dialog"
          aria-modal="true"
          aria-label={t("menu")}
          className={`fixed inset-y-0 right-0 z-50 flex w-[min(82vw,320px)] flex-col border-l border-[var(--rz-line)] bg-[var(--rz-bg)] shadow-[var(--rz-shadow)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-14 items-center justify-between border-b border-[var(--rz-line)] px-4">
            <p className="font-[family-name:var(--font-brand-display)] text-base font-semibold tracking-tight">
              {SERVICE_NAME}
            </p>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--rz-line)] text-[var(--rz-text)]"
              aria-label={t("closeMenu")}
              onClick={() => setMenuOpen(false)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label={t("mobileMenu")}>
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-xl border-b border-transparent px-4 py-3.5 text-[15px] transition ${
                    active
                      ? "border-white/20 bg-[var(--rz-panel)] font-medium text-white"
                      : "text-white/70 hover:bg-[var(--rz-panel)] hover:text-white"
                  }`}
                >
                  {t(item.key)}
                </Link>
              );
            })}
            <BybitReferralMenu variant="mobile" onNavigate={() => setMenuOpen(false)} />
          </nav>
          <LanguageSwitcher variant="list" />
        </aside>
      </div>
    </>
  );
}

const FOOTER_LINKS = [
  { href: "/bybit", key: "footerBybit" },
  { href: "/faq", key: "footerFaq" },
  { href: "/about", key: "footerAbout" },
  { href: "/contact", key: "footerContact" },
  { href: "/privacy", key: "footerPrivacy" },
  { href: "/terms", key: "footerTerms" },
] as const;

export function RaiseFooter() {
  const t = useTranslations("common");
  const SERVICE_NAME = getLocalizedBrandName(useLocale() as AppLocale);
  return (
    <footer className="mt-auto border-t border-[var(--rz-line)] py-8 text-xs text-[var(--rz-muted)]">
      <div className="rz-container flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <p className="font-[family-name:var(--font-brand-display)] text-sm font-semibold text-[var(--rz-text)]">
            {SERVICE_NAME}
          </p>
          <p>
            contact{" "}
            <a href="mailto:wlsehdgus23@gmail.com" className="transition hover:text-[var(--rz-text)]">
              wlsehdgus23@gmail.com
            </a>
          </p>
          <p className="max-w-xl leading-relaxed">
            © {new Date().getFullYear()} {SERVICE_NAME} · {t("footerDisclaimer")}
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-[var(--rz-text)]">
              {t(link.key)}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

/** 소개·문의·약관 등 텍스트 페이지용 레이아웃 */
export function RaisePageShell({ children, plain = false }: { children: React.ReactNode; plain?: boolean }) {
  return (
    <div className="raise-app flex min-h-dvh flex-col bg-[var(--rz-bg)] text-[var(--rz-text)]">
      <RaiseHeader />
      <div className={`min-h-[calc(100dvh-4rem)] ${plain ? "flex-1" : "raise-prose flex-1"}`}>{children}</div>
      <RaiseFooter />
    </div>
  );
}
