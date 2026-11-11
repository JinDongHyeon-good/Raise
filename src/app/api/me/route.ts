import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/board-server";
import { ensureUserProfileOnAuth } from "@/lib/ensure-user-profile-server";
import { isNicknameTakenByOther } from "@/lib/nickname-duplicate";

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
  const { data } = await supabase.from("USER_MST").select("nickname").eq("auth_id", user.id).maybeSingle<{ nickname: string }>();
  return NextResponse.json(
    { user: { id: user.id, email: user.email ?? null, nickname: data?.nickname ?? "방문자" } },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: NextRequest) {
  const { supabase, user } = await requireSessionUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = (await request.json()) as { nickname?: string };
  const nickname = body.nickname?.trim() ?? "";
  if (nickname.length < 2 || nickname.length > 16) {
    return NextResponse.json({ error: "닉네임은 2~16자로 정해 주세요." }, { status: 400 });
  }
  if (!/^[\p{L}\p{N}_.-]+$/u.test(nickname)) {
    return NextResponse.json({ error: "닉네임에는 글자, 숫자, _ . - 만 쓸 수 있어요." }, { status: 400 });
  }
  if (await isNicknameTakenByOther(supabase, nickname, user.id)) {
    return NextResponse.json({ error: "이미 쓰고 있는 닉네임이에요." }, { status: 409 });
  }

  const { error } = await supabase
    .from("USER_MST")
    .update({ nickname, updated_at: new Date().toISOString() })
    .eq("auth_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ nickname });
}
