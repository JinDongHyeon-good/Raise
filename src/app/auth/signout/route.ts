import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Supabase SSR: signOut 시 만료 쿠키는 반드시 **최종으로 반환하는 Response**에 붙여야 합니다.
 * `cookies().set()`만 쓰고 `NextResponse.redirect`를 따로 반환하면 Set-Cookie가 빠지는 경우가 있습니다.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const home = new URL("/", url.origin);

  const redirectResponse = NextResponse.redirect(home, 302);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    redirectResponse.headers.set("Cache-Control", "no-store");
    return redirectResponse;
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          redirectResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[auth/signout]", error.message);
  }

  redirectResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return redirectResponse;
}
