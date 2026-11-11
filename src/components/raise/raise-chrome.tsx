"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HeaderUser } from "@/components/auth/header-user";
import { SERVICE_NAME } from "@/lib/brand";

const NAV = [
  { href: "/", label: "영상", match: (path: string) => path === "/" },
  { href: "/chart", label: "차트", match: (path: string) => path.startsWith("/chart") },
  { href: "/community", label: "커뮤니티", match: (path: string) => path.startsWith("/community") },
] as const;

export function RaiseHeader() {
  const pathname = usePathname() || "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    setHidden(false);
  }, [pathname]);

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
    if (menuOpen) {
      setHidden(false);
      return;
    }

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
    <header
      className={`sticky top-0 z-40 border-b border-[var(--rz-line)] bg-[var(--rz-bg)]/85 backdrop-blur-xl transition-transform duration-300 ease-out ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="rz-container relative grid h-14 grid-cols-[1fr_auto_1fr] items-stretch gap-2 sm:h-16">
        <Link
          href="/"
          className="flex items-center justify-self-start font-[family-name:var(--font-brand-display)] text-[17px] font-semibold tracking-tight sm:text-lg"
        >
          {SERVICE_NAME}
        </Link>

        <nav className="hidden items-stretch justify-center gap-1 md:flex" aria-label="주요 메뉴">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center px-3.5 text-sm transition ${
                  active ? "font-medium text-[var(--rz-text)]" : "text-[var(--rz-muted)] hover:text-[var(--rz-text)]"
                }`}
              >
                {item.label}
                {active ? (
                  <span aria-hidden className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-[var(--rz-accent)]" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-end gap-2 self-center justify-self-end">
          <HeaderUser />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--rz-line)] text-[var(--rz-text)] md:hidden"
            aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="sr-only">{menuOpen ? "메뉴 닫기" : "메뉴 열기"}</span>
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

      {menuOpen ? (
        <div className="border-t border-[var(--rz-line)] bg-[var(--rz-bg)] md:hidden">
          <nav className="rz-container flex flex-col gap-1 py-3" aria-label="모바일 메뉴">
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-4 py-3 text-center text-[15px] transition ${
                    active
                      ? "bg-[var(--rz-accent-soft)] font-medium text-[var(--rz-text)]"
                      : "text-[var(--rz-muted)] hover:bg-[var(--rz-panel)] hover:text-[var(--rz-text)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

const FOOTER_LINKS = [
  { href: "/about", label: "소개" },
  { href: "/contact", label: "문의" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/terms", label: "이용약관" },
] as const;

export function RaiseFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--rz-line)] py-8 text-xs text-[var(--rz-muted)]">
      <div className="rz-container flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <p className="font-[family-name:var(--font-brand-display)] text-sm font-semibold text-[var(--rz-text)]">
            {SERVICE_NAME}
          </p>
          <p className="max-w-xl leading-relaxed">
            © {new Date().getFullYear()} {SERVICE_NAME} · 시세 Bybit · 영상 YouTube · AI 분석은 참고용이며 투자 판단의
            책임은 본인에게 있습니다
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-[var(--rz-text)]">
              {link.label}
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
      <div className={plain ? "flex-1" : "raise-prose flex-1"}>{children}</div>
      <RaiseFooter />
    </div>
  );
}
