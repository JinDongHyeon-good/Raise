import { NextRequest, NextResponse } from "next/server";
import { SlidingRateLimiter } from "@/lib/sliding-rate-limit";
import { apiTranslator } from "@/lib/server-i18n";
import { MAX_PAGES, normalizeQuery, searchYoutube, YoutubeQuotaError } from "@/lib/youtube";

export const runtime = "nodejs";


/** 캐시에 없는 "새 검색"만 IP당 10분에 15번까지 (캐시 적중은 제한 없음) */
const missLimiter = new SlidingRateLimiter(15, 10 * 60_000);

const FRESH_HEADERS = {
  // 브라우저 10분, CDN 1시간, 이후 하루 동안은 CDN이 옛 응답을 주면서 뒤에서 갱신
  "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400",
};
const STALE_HEADERS = { "Cache-Control": "public, max-age=120, s-maxage=300" };

export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const query = normalizeQuery(params.get("q") ?? "");
  const page = Math.min(MAX_PAGES - 1, Math.max(0, Number(params.get("page")) || 0));
  // 검색 언어·지역 (en: 미국·영어 영상). 응답 메시지 언어도 같은 기준
  const lang = params.get("lang") === "en" ? "en" : "ko";
  const t = apiTranslator(request);
  if (!query) return NextResponse.json({ error: t("video.queryRequired") }, { status: 400 });

  try {
    // 1) 캐시만 먼저 확인 (할당량 0)
    const cached = await searchYoutube(query, { allowNetwork: false, page, lang });
    if (cached && cached.source !== "stale") {
      return NextResponse.json(cached.result, { headers: { ...FRESH_HEADERS, "x-cache": cached.source } });
    }

    // 2) 새 검색은 IP당 제한. 제한에 걸리면 옛 결과라도 준다
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
    if (!missLimiter.check(ip).allowed) {
      if (cached) return NextResponse.json(cached.result, { headers: { ...STALE_HEADERS, "x-cache": "stale" } });
      return NextResponse.json({ error: t("video.tooManySearches") }, { status: 429 });
    }

    const found = await searchYoutube(query, { page, lang });
    const headers = found?.source === "stale" ? STALE_HEADERS : FRESH_HEADERS;
    return NextResponse.json(found!.result, { headers: { ...headers, "x-cache": found!.source } });
  } catch (error) {
    if (error instanceof YoutubeQuotaError) {
      return NextResponse.json(
        { error: t("video.youtubeQuota") },
        { status: 429, headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } },
      );
    }
    const message = error instanceof Error ? error.message : "YouTube 조회 실패";
    console.error("[youtube/search]", message);
    return NextResponse.json({ error: t("video.loadFailed") }, { status: 502 });
  }
}
