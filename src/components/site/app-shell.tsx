"use client";

import { Link as LocaleLink, usePathname, useRouter } from "@/navigation";
import { SiteFooter } from "@/components/site/site-footer";
import { UserMenuDropdown } from "@/components/site/user-menu-dropdown";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { LoginModal } from "@/components/auth/login-modal";
import { getLocalizedBrandName } from "@/lib/brand";
import { getSupabaseBrowserClientSafe } from "@/lib/supabase-safe";
import type { AppLocale } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, Sparkles } from "lucide-react";

type AuthMode = "login" | "signup";

type AppShellProps = {
  children: React.ReactNode;
  active?: "dashboard" | "board" | "mypage" | "saju" | "today" | "natal" | "gunghap";
  nextPath?: string;
  showFooter?: boolean;
  loginOpen?: boolean;
  onLoginOpenChange?: (open: boolean) => void;
  onNeedLoginReady?: (openLogin: (mode?: AuthMode) => void) => void;
  /** 로그인 필요한 경로로 이동을 시도할 때 쓸 함수를 부모에게 넘겨준다. 로그인 상태면 바로 이동하고, 아니면 그 자리에서 로그인 모달을 띄운다. */
  onRequireAuthReady?: (requireAuth: (path: string) => void) => void;
};

export function AppShell({
  children,
  active,
  nextPath = "/dashboard",
  showFooter = true,
  loginOpen,
  onLoginOpenChange,
  onNeedLoginReady,
  onRequireAuthReady,
}: AppShellProps) {
  const locale = useLocale() as AppLocale;
  const brandName = getLocalizedBrandName(locale);
  const tc = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [internalLoginOpen, setInternalLoginOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>("login");
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const isLoginControlled = typeof loginOpen === "boolean";
  const isLoginModalOpen = isLoginControlled ? Boolean(loginOpen) : internalLoginOpen;

  const setLoginOpen = useCallback(
    (open: boolean, mode: AuthMode = "login") => {
      setAuthModalMode(mode);
      if (isLoginControlled) {
        onLoginOpenChange?.(open);
      } else {
        setInternalLoginOpen(open);
      }
    },
    [isLoginControlled, onLoginOpenChange],
  );

  const openLogin = useCallback(
    (mode: AuthMode = "login") => {
      setLoginOpen(true, mode);
    },
    [setLoginOpen],
  );

  /** 로그인 상태면 바로 이동, 아니면 그 자리에서 로그인 모달을 띄우고 로그인 후 이어서 이동한다. */
  const requireAuth = useCallback(
    (path: string) => {
      if (isLoggedIn) {
        router.push(path);
        return;
      }
      setPendingPath(path);
      openLogin("login");
    },
    [isLoggedIn, openLogin, router],
  );

  const syncSession = useCallback(async () => {
    const supabase = getSupabaseBrowserClientSafe();
    if (!supabase) {
      setIsLoggedIn(false);
      setUserAvatarUrl(null);
      return;
    }
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    setIsLoggedIn(Boolean(user));
    setUserAvatarUrl(
      (user?.user_metadata?.avatar_url as string | undefined) ??
        (user?.user_metadata?.picture as string | undefined) ??
        null,
    );
  }, []);

  useEffect(() => {
    void syncSession();
  }, [syncSession]);

  useEffect(() => {
    onNeedLoginReady?.(openLogin);
  }, [onNeedLoginReady, openLogin]);

  useEffect(() => {
    onRequireAuthReady?.(requireAuth);
  }, [onRequireAuthReady, requireAuth]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClientSafe();
    if (supabase) await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserAvatarUrl(null);
    window.location.assign(`${window.location.origin}/auth/signout`);
  };

  const resolvedActive =
    active ??
    (pathname.startsWith("/dashboard/board") || pathname === "/board"
      ? "board"
      : pathname.startsWith("/dashboard/today")
        ? "today"
        : pathname.startsWith("/dashboard/saju")
          ? "natal"
          : pathname.startsWith("/dashboard/gunghap")
            ? "gunghap"
            : pathname.startsWith("/mypage")
              ? "mypage"
              : pathname.startsWith("/saju")
                ? "saju"
                : pathname.startsWith("/dashboard")
                  ? "dashboard"
                  : undefined);

  const navClass = (key: string) =>
    `rounded-full px-3 py-1.5 transition-all duration-200 ${
      resolvedActive === key
        ? "bg-[var(--piclick-green)]/10 font-semibold text-[var(--piclick-green-deep)]"
        : "text-[var(--piclick-ink-muted)] hover:bg-[var(--piclick-beige-soft)] hover:text-[var(--piclick-green-deep)]"
    }`;

  const navItems = [
    { key: "today", href: "/dashboard/today" as const, label: tc("navToday"), authRequired: true },
    { key: "natal", href: "/dashboard/saju" as const, label: tc("navSaju"), authRequired: true },
    { key: "gunghap", href: "/dashboard/gunghap" as const, label: tc("navGunghap"), authRequired: true },
    { key: "board", href: "/dashboard/board" as const, label: tc("community"), authRequired: false },
  ];

  return (
    <div className="piclick-home flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 bg-[var(--piclick-beige)]/90 shadow-[0_1px_0_rgba(42,33,80,0.06),0_16px_32px_-28px_rgba(42,33,80,0.5)] backdrop-blur-md">
        <div
          className="h-[2px] w-full bg-gradient-to-r from-[var(--piclick-green)] via-[var(--piclick-gold)] to-[var(--piclick-green)]"
          aria-hidden
        />
        <div className="piclick-container grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-3 sm:h-16">
          <LocaleLink
            href="/dashboard"
            className="font-brand-display col-start-1 flex min-w-0 items-center gap-2 justify-self-start truncate whitespace-nowrap text-[1.35rem] font-bold tracking-tight text-[var(--piclick-green-deep)] sm:text-2xl"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--piclick-green)] to-[var(--piclick-green-deep)] text-white shadow-[0_6px_14px_-6px_rgba(42,33,80,0.55)] sm:h-9 sm:w-9">
              <Sparkles className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            <span className="truncate">{brandName}</span>
          </LocaleLink>

          <nav className="col-start-2 hidden min-w-0 items-center justify-center gap-1 overflow-x-auto whitespace-nowrap text-sm text-[var(--piclick-ink-muted)] sm:flex sm:gap-1.5">
            {navItems.map((item) =>
              item.authRequired ? (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => requireAuth(item.href)}
                  className={navClass(item.key)}
                >
                  {item.label}
                </button>
              ) : (
                <LocaleLink key={item.key} href={item.href} className={navClass(item.key)}>
                  {item.label}
                </LocaleLink>
              ),
            )}
          </nav>

          <div className="col-start-3 flex items-center gap-2 justify-self-end">
            <LanguageSwitcher />
            <button
              type="button"
              aria-label={tc("userMenu")}
              aria-expanded={isMobileMenuOpen}
              aria-haspopup="dialog"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--piclick-line)] bg-white text-[var(--piclick-ink-muted)] transition hover:border-[var(--piclick-green)]/30 hover:text-[var(--piclick-green-deep)] sm:hidden"
            >
              <Menu className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </button>
            <div ref={userMenuRef} className="relative">
              {isLoggedIn ? (
                <button
                  type="button"
                  aria-label={tc("userMenu")}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border p-0 leading-none transition ${
                    isUserMenuOpen
                      ? "border-[var(--piclick-green)]/40 ring-2 ring-[var(--piclick-green)]/15"
                      : "border-[var(--piclick-line)] bg-white hover:border-[var(--piclick-green)]/30"
                  }`}
                >
                  {userAvatarUrl ? (
                    <img src={userAvatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="inline-flex h-full w-full items-center justify-center bg-[var(--piclick-green-deep)] text-[10px] font-semibold leading-none text-white">
                      ME
                    </span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openLogin("login")}
                  className="pk-btn pk-btn-sm pk-btn-primary"
                >
                  {tc("login")}
                </button>
              )}
              <UserMenuDropdown
                open={isLoggedIn && isUserMenuOpen}
                onLogout={() => void handleLogout()}
                onNavigate={() => setIsUserMenuOpen(false)}
                showAppLinks={false}
              />
            </div>
          </div>
        </div>
      </header>

      <div
        role="dialog"
        aria-modal="true"
        aria-label={tc("userMenu")}
        className={`fixed inset-0 z-30 sm:hidden ${isMobileMenuOpen ? "" : "pointer-events-none"}`}
      >
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-[var(--piclick-line)] bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-16px_40px_-12px_rgba(15,23,42,0.25)] transition-transform duration-200 ease-out ${
            isMobileMenuOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--piclick-line)]" aria-hidden />
          <nav className="flex flex-col divide-y divide-[var(--piclick-line)]">
            {navItems.map((item) => {
              const itemClass = `py-3.5 text-left text-base ${
                resolvedActive === item.key
                  ? "font-semibold text-[var(--piclick-green-deep)]"
                  : "font-medium text-[var(--piclick-ink)]"
              }`;
              return item.authRequired ? (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    requireAuth(item.href);
                  }}
                  className={itemClass}
                >
                  {item.label}
                </button>
              ) : (
                <LocaleLink
                  key={item.key}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={itemClass}
                >
                  {item.label}
                </LocaleLink>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="flex-1">{children}</main>

      {showFooter ? <SiteFooter maxWidthClassName="piclick-container" /> : null}

      <LoginModal
        open={isLoginModalOpen}
        initialMode={authModalMode}
        nextPath={nextPath}
        onClose={() => setLoginOpen(false)}
        onAuthenticated={async () => {
          await syncSession();
          setLoginOpen(false);
          if (pendingPath) {
            router.push(pendingPath);
            setPendingPath(null);
          }
        }}
      />
    </div>
  );
}
