import { NextRequest, NextResponse } from "next/server";
import { apiTranslator, hideError } from "@/lib/server-i18n";
import { requireSessionUser } from "@/lib/board-server";
import { ensureUserProfileOnAuth } from "@/lib/ensure-user-profile-server";
import { isNicknameTakenByOther } from "@/lib/nickname-duplicate";
import { getAiUsage } from "@/lib/ai-quota";

export const runtime = "nodejs";

/** 로그인 사용자 프로필 (없으면 생성) */
export async function GET() {
  const { supabase, user } = await requireSessionUser();
  if (!user) return NextResponse.json({ user: null });
  try {
    await ensureUserProfileOnAuth(supabase, user.id, user);
  } catch (e) {
    console.error("[api/me] ensure profile", e);
  }
  const [{ data }, aiUsage] = await Promise.all([
    supabase.from("USER_MST").select("nickname").eq("auth_id", user.id).maybeSingle<{ nickname: string }>(),
    getAiUsage(user.id),
  ]);
  return NextResponse.json(
    { user: { id: user.id, email: user.email ?? null, nickname: data?.nickname ?? "방문자", aiUsage } },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: NextRequest) {
  const t = apiTranslator(request);
  const { supabase, user } = await requireSessionUser();
  if (!user) return NextResponse.json({ error: t("me.loginRequired") }, { status: 401 });

  const body = (await request.json()) as { nickname?: string };
  const nickname = body.nickname?.trim() ?? "";
  if (nickname.length < 2 || nickname.length > 16) {
    return NextResponse.json({ error: t("me.nicknameLength") }, { status: 400 });
  }
  if (!/^[\p{L}\p{N}_.-]+$/u.test(nickname)) {
    return NextResponse.json({ error: t("me.nicknameChars") }, { status: 400 });
  }
  if (await isNicknameTakenByOther(supabase, nickname, user.id)) {
    return NextResponse.json({ error: t("me.nicknameTaken") }, { status: 409 });
  }

  const { error } = await supabase
    .from("USER_MST")
    .update({ nickname, updated_at: new Date().toISOString() })
    .eq("auth_id", user.id);
  if (error) return NextResponse.json({ error: hideError(error, t("common.serverError")) }, { status: 500 });
  return NextResponse.json({ nickname });
}
