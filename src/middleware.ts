import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const SESSION_PATH_PREFIXES = ["/mypage", "/auth", "/trading-floor", "/resume", "/board", "/dashboard"] as const;
const AUTH_REQUIRED_PREFIXES = ["/mypage", "/dashboard"] as const;
/**
 * 대시보드 진입과 커뮤니티(게시판) 열람은 로그인 없이 허용하고,
 * 그 아래 개인화 기능(today/saju/gunghap 등)에서만 로그인을 요구한다.
 */
const PUBLIC_EXACT_PATHS = ["/dashboard", "/dashboard/board"] as const;

/**
 * 기본 로케일(ko)은 접두사 없이 서빙하므로 `/ko/...` 는 `/...` 로 정규화한다.
 * `/en`·`/ja` 는 실제로 서빙되는 경로이므로 건드리지 않는다.
 */
function stripLegacyLocalePrefix(pathname: string) {
  const match = pathname.match(/^\/ko(\/.*)?$/);
  if (!match) return null;
  return match[1] || "/";
}

/** 경로 규칙 매칭용: 로케일 접두사(ko/en/ja)를 제거한 경로 */
function barePathname(pathname: string) {
  const match = pathname.match(/^\/(ko|en|ja)(\/.*)?$/);
  if (match) return match[2] || "/";
  return pathname;
}

function needsSessionRefresh(pathname: string) {
  const bare = barePathname(pathname);
  return SESSION_PATH_PREFIXES.some(
    (prefix) => bare === prefix || bare.startsWith(`${prefix}/`),
  );
}

function requiresAuth(pathname: string) {
  const bare = barePathname(pathname);
  if ((PUBLIC_EXACT_PATHS as readonly string[]).includes(bare)) return false;
  return AUTH_REQUIRED_PREFIXES.some(
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

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
}

async function refreshSupabaseSession(
  request: NextRequest,
  response: NextResponse,
  options?: { requireAuth?: boolean },
) {
  const bare = barePathname(request.nextUrl.pathname);
  if (bare === "/auth/signout") {
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
        cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
          sessionResponse.cookies.set(name, value, cookieOptions);
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
      copyCookies(sessionResponse, redirectResponse);
      redirectResponse.headers.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      );
      redirectResponse.headers.set("Vary", "Cookie");
      return redirectResponse;
    }
    console.error("[middleware] exchangeCodeForSession", error.message);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (options?.requireAuth && !user) {
    // 로그인 유도는 현재 로케일 홈으로 보낸다 (/en/dashboard → /en?login=1&next=/en/dashboard)
    const localePrefix = request.nextUrl.pathname.match(/^\/(en|ja)(?=\/|$)/)?.[0] ?? "";
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = localePrefix || "/";
    loginUrl.search = "";
    loginUrl.searchParams.set("login", "1");
    loginUrl.searchParams.set("next", `${localePrefix}${bare === "/" ? "" : bare}` || "/");
    const redirectResponse = NextResponse.redirect(loginUrl);
    copyCookies(sessionResponse, redirectResponse);
    redirectResponse.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    redirectResponse.headers.set("Vary", "Cookie");
    return redirectResponse;
  }

  sessionResponse.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  sessionResponse.headers.set("Vary", "Cookie");

  return sessionResponse;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const legacyPath = stripLegacyLocalePrefix(pathname);
  if (legacyPath !== null) {
    const url = request.nextUrl.clone();
    url.pathname = legacyPath;
    return NextResponse.redirect(url);
  }

  const authRequired = requiresAuth(pathname);

  if (shouldSkipIntl(pathname)) {
    if (needsSessionRefresh(pathname) || authRequired) {
      const response = NextResponse.next({
        request: { headers: request.headers },
      });
      return refreshSupabaseSession(request, response, { requireAuth: authRequired });
    }
    return NextResponse.next();
  }

  const intlResponse = intlMiddleware(request);

  if (needsSessionRefresh(pathname) || authRequired) {
    return refreshSupabaseSession(request, intlResponse, { requireAuth: authRequired });
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
