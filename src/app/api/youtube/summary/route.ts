import { NextRequest, NextResponse } from "next/server";
import { guardAiRequest } from "@/lib/ai-quota";
import { requireSessionUser } from "@/lib/board-server";
import { SlidingRateLimiter } from "@/lib/sliding-rate-limit";
import { ensureSummary, resetFailedSummary, SummaryRejectedError } from "@/lib/video-summary";
import { YoutubeQuotaError } from "@/lib/youtube";

export const runtime = "nodejs";

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
/** 단계 진행 호출 남용 방지 (사용자당) */
const stepLimiter = new SlidingRateLimiter(120, 60_000);

/**
 * 영상 AI 요약 시작(백그라운드 작업 생성) 또는 진행 상태 조회. 클라이언트는 done/failed가 될 때까지 몇 초마다 다시 부른다.
 * - 로그인 필수
 * - 하루 AI 사용 한도 적용 (같은 날 같은 영상은 한 번만 셈)
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { videoId?: string; retry?: boolean };
  const videoId = body.videoId ?? "";
  if (!VIDEO_ID.test(videoId)) return NextResponse.json({ error: "잘못된 영상" }, { status: 400 });

  const { user } = await requireSessionUser();
  if (user && !stepLimiter.check(user.id).allowed) {
    return NextResponse.json({ error: "요청이 너무 많아요. 잠시 후 다시 시도해 주세요." }, { status: 429 });
  }

  try {
    // 출처·로그인·이메일 인증·하루 한도(사용자/IP/전체)·차단 목록
    const guard = await guardAiRequest(request, user, "video-summary", videoId);
    if (!guard.ok) return guard.response;
    const quota = guard.quota;

    if (body.retry) await resetFailedSummary(videoId);
    const view = await ensureSummary(videoId);
    return NextResponse.json({ item: view, quota }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SummaryRejectedError) return NextResponse.json({ error: error.message }, { status: 422 });
    if (error instanceof YoutubeQuotaError) {
      return NextResponse.json({ error: "오늘 YouTube 조회 한도를 다 썼어요." }, { status: 429 });
    }
    console.error("[youtube/summary]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "요약을 진행하지 못했어요." }, { status: 500 });
  }
}
