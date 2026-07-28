import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const SESSION_PATH_PREFIXES = ["/mypage", "/auth", "/trading-floor", "/resume", "/board", "/dashboard"] as const;
const AUTH_REQUIRED_PREFIXES = ["/mypage", "/dashboard"] as const;

function stripLegacyLocalePrefix(pathname: string) {
  const match = pathname.match(/^\/(ko|en|ja)(\/.*)?$/);
  if (!match) return null;
  return match[2] || "/";
}

function barePathname(pathname: string) {
  return stripLegacyLocalePrefix(pathname) ?? pathname;
}

function needsSessionRefresh(pathname: string) {
  const bare = barePathname(pathname);
  return SESSION_PATH_PREFIXES.some(
    (prefix) => bare === prefix || bare.startsWith(`${prefix}/`),
  );
}

function requiresAuth(pathname: string) {
  const bare = barePathname(pathname);
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
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/";
    loginUrl.search = "";
    loginUrl.searchParams.set("login", "1");
    loginUrl.searchParams.set("next", bare);
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
