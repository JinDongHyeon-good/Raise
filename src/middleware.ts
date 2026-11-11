import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 예전 /ko, /en, /ja 접두 URL → 접두 없는 경로로
  const legacy = pathname.match(/^\/(ko|en|ja)(\/.*)?$/);
  if (legacy) {
    const url = request.nextUrl.clone();
    url.pathname = legacy[2] || "/";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/api")) return NextResponse.next();

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
