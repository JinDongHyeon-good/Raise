import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { detectLocaleFromRequest, isBot } from "@/i18n/locale-detect";
import { LOCALE_COOKIE, localizedPath, routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // API와 인증 라우트 핸들러(app/auth/*)는 로케일 라우팅을 거치면 404가 된다
  if (pathname.startsWith("/api") || pathname === "/auth/callback" || pathname === "/auth/signout") {
    return NextResponse.next();
  }

  // 예전 /ko, /ja 접두 URL → 접두 없는 경로로 (/en 은 영어 페이지)
  const legacy = pathname.match(/^\/(ko|ja)(\/.*)?$/);
  if (legacy) {
    const url = request.nextUrl.clone();
    url.pathname = legacy[2] || "/";
    return NextResponse.redirect(url, 308);
  }

  // 언어 접두 없는 주소(=한국어)로 들어왔을 때: 사람이고, 영어를 쓸 사람이면 /en 으로 보낸다
  //   직접 고른 언어(쿠키) > 국가 > 브라우저 언어. 검색엔진 봇은 그대로 둔다.
  const hasEnPrefix = pathname === "/en" || pathname.startsWith("/en/");
  if (!hasEnPrefix && !isBot(request) && detectLocaleFromRequest(request) === "en") {
    const url = request.nextUrl.clone();
    url.pathname = localizedPath(pathname, "en");
    url.search = search;
    const res = NextResponse.redirect(url, 307);
    res.headers.set("Vary", "Cookie, Accept-Language, CloudFront-Viewer-Country");
    return res;
  }

  const response = intlMiddleware(request);
  // 한국어 페이지를 보고 있으면 선택 언어를 ko로 기억 (지구본으로 바꾼 경우 포함)
  if (!hasEnPrefix && !request.cookies.get(LOCALE_COOKIE)) {
    response.cookies.set(LOCALE_COOKIE, "ko", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
