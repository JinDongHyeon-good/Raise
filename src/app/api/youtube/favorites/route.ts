import { NextRequest, NextResponse } from "next/server";
import { apiTranslator } from "@/lib/server-i18n";
import { requireSessionUser } from "@/lib/board-server";
import { getChannelMeta, isChannelId } from "@/lib/youtube";

export const runtime = "nodejs";

type FavoriteRow = { channel_id: string; channel_title: string; thumbnail: string; created_at: string };

/** 내 즐겨찾기 채널 목록 */
export async function GET(request: NextRequest) {
  const t = apiTranslator(request);
  const { supabase, user } = await requireSessionUser();
  if (!user) return NextResponse.json({ error: t("youtubeFavorites.loginRequired"), code: "login_required" }, { status: 401 });
  const { data, error } = await supabase
    .from("FAVORITE_CHANNELS")
    .select("channel_id, channel_title, thumbnail, created_at")
    .eq("user_auth_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const items = ((data ?? []) as FavoriteRow[]).map((r) => ({ id: r.channel_id, title: r.channel_title, thumbnail: r.thumbnail }));
  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}

/** 즐겨찾기 추가 { channelId } */
export async function POST(request: NextRequest) {
  const t = apiTranslator(request);
  const { supabase, user } = await requireSessionUser();
  if (!user) return NextResponse.json({ error: t("youtubeFavorites.favoriteLoginRequired"), code: "login_required" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { channelId?: string };
  const channelId = body.channelId ?? "";
  if (!isChannelId(channelId)) return NextResponse.json({ error: t("youtubeFavorites.invalidChannel") }, { status: 400 });

  try {
    const meta = await getChannelMeta(channelId);
    if (!meta) return NextResponse.json({ error: t("youtubeFavorites.channelNotFound") }, { status: 404 });
    const { error } = await supabase
      .from("FAVORITE_CHANNELS")
      .insert({ user_auth_id: user.id, channel_id: meta.id, channel_title: meta.title, thumbnail: meta.thumbnail });
    if (error && error.code !== "23505") {
      const limit = error.message.includes("limit reached");
      return NextResponse.json({ error: limit ? t("youtubeFavorites.favoriteLimit") : error.message }, { status: limit ? 409 : 500 });
    }
    return NextResponse.json({ item: meta }, { status: 201 });
  } catch {
    return NextResponse.json({ error: t("youtubeFavorites.channelLoadFailed") }, { status: 502 });
  }
}

/** 즐겨찾기 해제 ?channelId= */
export async function DELETE(request: NextRequest) {
  const t = apiTranslator(request);
  const { supabase, user } = await requireSessionUser();
  if (!user) return NextResponse.json({ error: t("youtubeFavorites.loginRequired"), code: "login_required" }, { status: 401 });
  const channelId = new URL(request.url).searchParams.get("channelId") ?? "";
  if (!isChannelId(channelId)) return NextResponse.json({ error: t("youtubeFavorites.invalidChannel") }, { status: 400 });
  const { error } = await supabase.from("FAVORITE_CHANNELS").delete().eq("user_auth_id", user.id).eq("channel_id", channelId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
