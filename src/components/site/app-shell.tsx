"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link as LocaleLink, usePathname } from "@/navigation";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { SiteFooter } from "@/components/site/site-footer";
import { UserMenuDropdown } from "@/components/site/user-menu-dropdown";
import { LoginModal } from "@/components/auth/login-modal";
import { getLocalizedBrandName } from "@/lib/brand";
import { getSupabaseBrowserClientSafe } from "@/lib/supabase-safe";
import type { AppLocale } from "@/i18n/routing";

type AuthMode = "login" | "signup";

type AppShellProps = {
  children: React.ReactNode;
  active?: "dashboard" | "board" | "mypage";
  nextPath?: string;
  showFooter?: boolean;
  loginOpen?: boolean;
  onLoginOpenChange?: (open: boolean) => void;
  onNeedLoginReady?: (openLogin: (mode?: AuthMode) => void) => void;
};

export function AppShell({
  children,
  active,
  nextPath = "/dashboard",
  showFooter = true,
  loginOpen,
  onLoginOpenChange,
  onNeedLoginReady,
}: AppShellProps) {
  const locale = useLocale() as AppLocale;
  const brandName = getLocalizedBrandName(locale);
  const tc = useTranslations("common");
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [internalLoginOpen, setInternalLoginOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>("login");
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
      : pathname.startsWith("/mypage")
        ? "mypage"
        : pathname.startsWith("/dashboard")
          ? "dashboard"
          : undefined);

  const navClass = (key: string) =>
    `transition hover:text-[var(--piclick-green-deep)] ${
      resolvedActive === key ? "font-medium text-[var(--piclick-green-deep)]" : ""
    }`;

  return (
    <div className="piclick-home flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-[var(--piclick-line)] bg-[var(--piclick-beige)]/90 backdrop-blur-md">
        <div className="piclick-container flex h-14 items-center justify-between sm:h-16">
          <LocaleLink
            href="/dashboard"
            className="font-brand-display text-[1.35rem] font-bold tracking-tight text-[var(--piclick-green-deep)] sm:text-2xl"
          >
            {brandName}
          </LocaleLink>
          <nav className="flex items-center gap-3 text-sm text-[var(--piclick-ink-muted)] sm:gap-5">
            <LanguageSwitcher />
            <LocaleLink href="/dashboard" className={navClass("dashboard")}>
              {tc("dashboard")}
            </LocaleLink>
            <LocaleLink href="/dashboard/board" className={`hidden sm:inline ${navClass("board")}`}>
              {tc("community")}
            </LocaleLink>
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
                    <span className="inline-flex h-full w-full items-center justify-center bg-[var(--piclick-beige)] text-[10px] font-semibold leading-none text-[var(--piclick-green-deep)]">
                      ME
                    </span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openLogin("login")}
                  className="inline-flex h-9 items-center rounded bg-[var(--piclick-green)] px-3.5 text-sm font-medium text-white transition hover:bg-[var(--piclick-green-deep)]"
                >
                  {tc("login")}
                </button>
              )}
              <UserMenuDropdown
                open={isLoggedIn && isUserMenuOpen}
                onLogout={() => void handleLogout()}
                onNavigate={() => setIsUserMenuOpen(false)}
              />
            </div>
          </nav>
        </div>
      </header>

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
        }}
      />
    </div>
  );
}
