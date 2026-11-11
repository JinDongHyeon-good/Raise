import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { privateJson } from "@/lib/private-response";

/**
 * 로그아웃 — POST 만 받는다. GET 으로 받으면 다른 사이트의 링크나 글 속 <img> 만으로 로그아웃시킬 수 있다.
 * Supabase SSR: signOut 시 만료 쿠키는 반드시 **최종으로 반환하는 Response**에 붙여야 한다.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
    let sameSite = false;
    try {
      sameSite = new URL(origin).host.toLowerCase().replace(/^www\./, "") === host.toLowerCase().replace(/^www\./, "");
    } catch {
      sameSite = false;
    }
    if (!sameSite) return privateJson({ ok: false }, { status: 403 });
  }

  const response = privateJson({ ok: true }, { headers: { "Cache-Control": "no-store" } });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return response;

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.signOut();
  if (error) console.error("[auth/signout]", error.message);
  return response;
}

/** 예전 링크로 들어오면 로그아웃하지 않고 홈으로 */
export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/", new URL(request.url).origin), 302);
}
