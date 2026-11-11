import { NextRequest, NextResponse } from "next/server";
import { apiTranslator, hideError } from "@/lib/server-i18n";
import { requireSessionUser } from "@/lib/board-server";
import { parseVideoFilters } from "@/lib/video-filters";

export const runtime = "nodejs";

/** 내 설정 (영상 필터 기본값). 없으면 videoFilters: null */
export async function GET(request: NextRequest) {
  const t = apiTranslator(request);
  const { supabase, user } = await requireSessionUser();
  if (!user) return NextResponse.json({ error: t("preferences.loginRequired"), code: "login_required" }, { status: 401 });
  const { data, error } = await supabase
    .from("USER_PREFERENCES")
    .select("video_filters")
    .eq("user_auth_id", user.id)
    .maybeSingle<{ video_filters: unknown }>();
  if (error) return NextResponse.json({ error: hideError(error, t("common.serverError")) }, { status: 500 });
  return NextResponse.json({ videoFilters: parseVideoFilters(data?.video_filters) }, { headers: { "Cache-Control": "no-store" } });
}

/** 영상 필터 기본값 저장 { videoFilters } — null 이면 기본값(전체)으로 되돌림 */
export async function PUT(request: NextRequest) {
  const t = apiTranslator(request);
  const { supabase, user } = await requireSessionUser();
  if (!user) return NextResponse.json({ error: t("preferences.loginRequired"), code: "login_required" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { videoFilters?: unknown } | null;
  if (!body || !("videoFilters" in body)) return NextResponse.json({ error: t("preferences.invalid") }, { status: 400 });
  const videoFilters = body.videoFilters === null ? null : parseVideoFilters(body.videoFilters);
  if (body.videoFilters !== null && !videoFilters) return NextResponse.json({ error: t("preferences.invalid") }, { status: 400 });

  const { error } = await supabase
    .from("USER_PREFERENCES")
    .upsert({ user_auth_id: user.id, video_filters: videoFilters, updated_at: new Date().toISOString() }, { onConflict: "user_auth_id" });
  if (error) return NextResponse.json({ error: hideError(error, t("preferences.saveFailed")) }, { status: 500 });
  return NextResponse.json({ videoFilters });
}
