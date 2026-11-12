import { privateJson } from "@/lib/private-response";
import { apiTranslator, hideError } from "@/lib/server-i18n";
import { requireSessionUser } from "@/lib/board-server";
import { getChannelVideos, YoutubeQuotaError, type YoutubeVideo } from "@/lib/youtube";

export const runtime = "nodejs";

/**
 * 즐겨찾기 채널들의 최신 영상을 합쳐 최신순으로 (채널당 25개, 30분 캐시, 채널당 2 units)
 * ?channelIds=a,b (또는 예전 ?channelId=a) 를 주면 그 채널들만 — 내 즐겨찾기에 있는 채널만 허용
 */
export async function GET(request: Request) {
  const t = apiTranslator(request);
  const { supabase, user } = await requireSessionUser();
  if (!user) return privateJson({ error: t("youtubeFavorites.loginRequired"), code: "login_required" }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const onlyRaw = params.get("channelIds") ?? params.get("channelId") ?? "";
  const only = new Set(onlyRaw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20));
  const { data, error } = await supabase.from("FAVORITE_CHANNELS").select("channel_id").eq("user_auth_id", user.id);
  if (error) return privateJson({ error: hideError(error, t("common.serverError")) }, { status: 500 });
  const channelIds = ((data ?? []) as Array<{ channel_id: string }>)
    .map((r) => r.channel_id)
    .filter((id) => only.size === 0 || only.has(id));

  const results = await Promise.allSettled(channelIds.map((id) => getChannelVideos(id)));
  if (channelIds.length && results.every((r) => r.status === "rejected")) {
    const quota = results.some((r) => r.status === "rejected" && r.reason instanceof YoutubeQuotaError);
    return privateJson({ error: quota ? t("youtubeFavorites.quotaExhausted") : t("youtubeFavorites.videosLoadFailed") }, { status: quota ? 429 : 502 });
  }
  const videos: YoutubeVideo[] = results
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 100);
  return privateJson({ videos, channels: channelIds.length }, { headers: { "Cache-Control": "private, no-store" } });
}
