import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/board-server";
import { apiTranslator, hideError } from "@/lib/server-i18n";
import { SlidingRateLimiter } from "@/lib/sliding-rate-limit";
import { lookupChannels, YoutubeQuotaError } from "@/lib/youtube";

export const runtime = "nodejs";

/** 이름 검색은 YouTube 할당량을 많이 써서 계정당 10분에 20번까지 (IP 가 아니라 로그인 계정 기준) */
const limiter = new SlidingRateLimiter(20, 10 * 60_000);

/** 채널 찾기 ?q=채널 주소·@핸들·이름 — 로그인 사용자만 */
export async function GET(request: NextRequest) {
  const t = apiTranslator(request);
  const { user } = await requireSessionUser();
  if (!user) return NextResponse.json({ error: t("youtubeFavorites.loginRequired"), code: "login_required" }, { status: 401 });

  const q = (new URL(request.url).searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ items: [] });
  if (!limiter.check(user.id).allowed) {
    return NextResponse.json({ error: t("youtubeFavorites.tooManyLookups") }, { status: 429 });
  }

  try {
    const items = await lookupChannels(q);
    return NextResponse.json({ items }, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch (error) {
    if (error instanceof YoutubeQuotaError) {
      return NextResponse.json({ error: t("youtubeFavorites.quotaExhausted") }, { status: 503 });
    }
    return NextResponse.json({ error: hideError(error, t("youtubeFavorites.channelLoadFailed")) }, { status: 502 });
  }
}
