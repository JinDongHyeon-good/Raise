import { NextResponse } from "next/server";
import { apiTranslator } from "@/lib/server-i18n";
import { requireSessionUser } from "@/lib/board-server";
import { getChannelVideos, YoutubeQuotaError, type YoutubeVideo } from "@/lib/youtube";

export const runtime = "nodejs";

/**
 * 즐겨찾기 채널들의 최신 영상을 합쳐 최신순으로 (채널당 25개, 30분 캐시, 채널당 2 units)
 * ?channelId= 를 주면 그 채널만
 */
export async function GET(request: Request) {
  const t = apiTranslator(request);
  const { supabase, user } = await requireSessionUser();
  if (!user) return NextResponse.json({ error: t("youtubeFavorites.loginRequired"), code: "login_required" }, { status: 401 });

  const only = new URL(request.url).searchParams.get("channelId");
  const { data, error } = await supabase.from("FAVORITE_CHANNELS").select("channel_id").eq("user_auth_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const channelIds = ((data ?? []) as Array<{ channel_id: string }>)
    .map((r) => r.channel_id)
    .filter((id) => !only || id === only);

  const results = await Promise.allSettled(channelIds.map((id) => getChannelVideos(id)));
  if (channelIds.length && results.every((r) => r.status === "rejected")) {
    const quota = results.some((r) => r.status === "rejected" && r.reason instanceof YoutubeQuotaError);
    return NextResponse.json({ error: quota ? t("youtubeFavorites.quotaExhausted") : t("youtubeFavorites.videosLoadFailed") }, { status: quota ? 429 : 502 });
  }
  const videos: YoutubeVideo[] = results
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 100);
  return NextResponse.json({ videos, channels: channelIds.length }, { headers: { "Cache-Control": "private, no-store" } });
}
