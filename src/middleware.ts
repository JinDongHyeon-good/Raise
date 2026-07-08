import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { detectLocaleFromRequest } from "@/i18n/locale-detect";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const SESSION_PATH_PREFIXES = ["/mypage", "/auth", "/trading-floor", "/resume"] as const;

function stripLocalePrefix(pathname: string) {
  const match = pathname.match(/^\/(ko|en|ja)(\/.*)?$/);
  if (!match) return pathname;
  return match[2] || "/";
}

function needsSessionRefresh(pathname: string) {
  const bare = stripLocalePrefix(pathname);
  return SESSION_PATH_PREFIXES.some(
    (prefix) => bare === prefix || bare.startsWith(`${prefix}/`),
  );
}

function shouldSkipIntl(pathname: string) {
  return (
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/auth/signout") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  );
}

function pathnameHasLocale(pathname: string) {
  return routing.locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
}

async function refreshSupabaseSession(request: NextRequest, response: NextResponse) {
  if (stripLocalePrefix(request.nextUrl.pathname) === "/auth/signout") {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  let sessionResponse = response;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        sessionResponse = NextResponse.next({
          request,
        });
        response.cookies.getAll().forEach((cookie) => {
          sessionResponse.cookies.set(cookie);
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          sessionResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const code = request.nextUrl.searchParams.get("code");
  const isAuthCallback = request.nextUrl.pathname === "/auth/callback";

  if (code && !isAuthCallback) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const nextUrl = request.nextUrl.clone();
      nextUrl.searchParams.delete("code");
      nextUrl.hash = "";

      const redirectResponse = NextResponse.redirect(nextUrl);
      sessionResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie);
      });
      redirectResponse.headers.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      );
      redirectResponse.headers.set("Vary", "Cookie");
      return redirectResponse;
    }
    console.error("[middleware] exchangeCodeForSession", error.message);
  }

  await supabase.auth.getUser();

  sessionResponse.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  sessionResponse.headers.set("Vary", "Cookie");

  return sessionResponse;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldSkipIntl(pathname)) {
    if (needsSessionRefresh(pathname)) {
      const response = NextResponse.next({
        request: { headers: request.headers },
      });
      return refreshSupabaseSession(request, response);
    }
    return NextResponse.next();
  }

  if (!pathnameHasLocale(pathname)) {
    const locale = detectLocaleFromRequest(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    const redirect = NextResponse.redirect(url);
    redirect.cookies.set("NEXT_LOCALE", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return redirect;
  }

  const intlResponse = intlMiddleware(request);

  if (needsSessionRefresh(pathname)) {
    return refreshSupabaseSession(request, intlResponse);
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
