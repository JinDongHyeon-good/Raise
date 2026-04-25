import { NextResponse } from "next/server";
import { getDefaultNicknameFromUser } from "@/lib/default-nickname";
import { resolveUniqueNicknameCandidate } from "@/lib/nickname-duplicate";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase-server";

function getSafeNextPath(raw: string | null) {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

function buildAbsoluteRedirectUrl(request: Request, pathWithQuery: string) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  const isLocalhost = host?.includes("localhost") || host?.includes("127.0.0.1");
  const protocol = isLocalhost ? "http" : "https";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (siteUrl && !isLocalhost) {
    try {
      return new URL(pathWithQuery, siteUrl).toString();
    } catch {
      // fall through
    }
  }

  if (host) {
    return `${protocol}://${host}${pathWithQuery.startsWith("/") ? "" : "/"}${pathWithQuery}`;
  }

  return new URL(pathWithQuery, request.url).toString();
}

/** 신규 프로필 생성 직후 웰컴 닉네임 모달용 쿼리 */
function withWelcomeQuery(pathWithQuery: string): string {
  if (!pathWithQuery.startsWith("/") || pathWithQuery.startsWith("//")) return "/?welcome=1";
  const q = pathWithQuery.indexOf("?");
  const pathname = q === -1 ? pathWithQuery : pathWithQuery.slice(0, q);
  const search = q === -1 ? "" : pathWithQuery.slice(q + 1);
  const sp = new URLSearchParams(search);
  sp.set("welcome", "1");
  return `${pathname}?${sp.toString()}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");
  const oauthDesc = url.searchParams.get("error_description");
  const nextPath = getSafeNextPath(url.searchParams.get("next"));

  if (oauthError) {
    const msg = oauthDesc || oauthError;
    return NextResponse.redirect(buildAbsoluteRedirectUrl(request, `/?error=${encodeURIComponent(msg)}`));
  }

  if (!code) {
    return NextResponse.redirect(buildAbsoluteRedirectUrl(request, "/?error=auth-code-error"));
  }

  try {
    const supabase = await createSupabaseRouteHandlerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchangeCodeForSession", error.message);
      return NextResponse.redirect(buildAbsoluteRedirectUrl(request, "/?error=auth-code-error"));
    }

    let redirectPath = nextPath;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) {
      const { data: existing, error: profileSelectError } = await supabase
        .from("USER_MST")
        .select("auth_id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (profileSelectError) {
        console.error("[auth/callback] USER_MST select", profileSelectError.message);
      } else if (!existing?.auth_id) {
        const baseNick = getDefaultNicknameFromUser(user);
        const nickname = await resolveUniqueNicknameCandidate(supabase, baseNick, user.id);
        const { error: insertError } = await supabase.from("USER_MST").insert({
          auth_id: user.id,
          nickname,
        });
        if (insertError) {
          console.error("[auth/callback] USER_MST insert", insertError.message);
        } else {
          redirectPath = withWelcomeQuery(nextPath);
        }
      }
    }

    const redirect = NextResponse.redirect(buildAbsoluteRedirectUrl(request, redirectPath));
    redirect.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    redirect.headers.set("Pragma", "no-cache");
    redirect.headers.set("Expires", "0");
    return redirect;
  } catch (e) {
    console.error("[auth/callback]", e);
    return NextResponse.redirect(buildAbsoluteRedirectUrl(request, "/?error=auth-code-error"));
  }
}
