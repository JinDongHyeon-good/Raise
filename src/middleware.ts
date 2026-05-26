import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // 로그아웃 라우트에서는 세션 갱신(getUser)을 돌리지 않음 — signOut 직전 쿠키가 덮어쓰이지 않도록
  if (request.nextUrl.pathname === "/auth/signout") {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // 이메일 인증·비밀번호 재설정 등으로 code가 /auth/callback이 아닌 경로에 붙은 경우 교환 후 URL 정리
  const code = request.nextUrl.searchParams.get("code");
  const isAuthCallback = request.nextUrl.pathname === "/auth/callback";

  if (code && !isAuthCallback) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const nextUrl = request.nextUrl.clone();
      nextUrl.searchParams.delete("code");
      nextUrl.hash = "";

      const redirectResponse = NextResponse.redirect(nextUrl);
      response.cookies.getAll().forEach((cookie) => {
        const { name, value, ...options } = cookie as {
          name: string;
          value: string;
          path?: string;
          maxAge?: number;
          domain?: string;
          secure?: boolean;
          httpOnly?: boolean;
          sameSite?: "strict" | "lax" | "none";
        };
        redirectResponse.cookies.set(name, value, {
          ...options,
          path: options.path ?? "/",
        });
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

  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  response.headers.set("Vary", "Cookie");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
