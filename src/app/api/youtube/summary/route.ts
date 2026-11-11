import { NextRequest, NextResponse } from "next/server";
import { AiQuotaUnavailableError, consumeAiQuota } from "@/lib/ai-quota";
import { requireSessionUser } from "@/lib/board-server";
import { SlidingRateLimiter } from "@/lib/sliding-rate-limit";
import { advanceSummary, resetFailedSummary, SummaryRejectedError } from "@/lib/video-summary";
import { YoutubeQuotaError } from "@/lib/youtube";

export const runtime = "nodejs";
export const maxDuration = 120;

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
/** 단계 진행 호출 남용 방지 (사용자당) */
const stepLimiter = new SlidingRateLimiter(120, 60_000);

/**
 * 영상 AI 요약 시작 또는 한 단계 진행. 클라이언트는 done/failed가 될 때까지 반복 호출한다.
 * - 로그인 필수
 * - 하루 AI 사용 한도 적용 (같은 날 같은 영상은 한 번만 셈)
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { videoId?: string; retry?: boolean };
  const videoId = body.videoId ?? "";
  if (!VIDEO_ID.test(videoId)) return NextResponse.json({ error: "잘못된 영상" }, { status: 400 });

  const { user } = await requireSessionUser();
  if (!user) {
    return NextResponse.json({ error: "AI 요약은 로그인 후 이용할 수 있어요.", code: "login_required" }, { status: 401 });
  }
  if (!stepLimiter.check(user.id).allowed) {
    return NextResponse.json({ error: "요청이 너무 많아요. 잠시 후 다시 시도해 주세요." }, { status: 429 });
  }

  try {
    const quota = await consumeAiQuota(user.id, "video-summary", videoId);
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `오늘 AI 사용 ${quota.limit}회를 모두 썼어요. 내일 다시 이용해 주세요.`,
          code: "ai_quota_exceeded",
          quota,
        },
        { status: 429 },
      );
    }

    if (body.retry) await resetFailedSummary(videoId);
    const view = await advanceSummary(videoId, { allowCreate: true });
    return NextResponse.json({ item: view, quota }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AiQuotaUnavailableError) {
      return NextResponse.json({ error: "AI 사용량을 확인할 수 없어 잠시 이용할 수 없어요." }, { status: 503 });
    }
    if (error instanceof SummaryRejectedError) return NextResponse.json({ error: error.message }, { status: 422 });
    if (error instanceof YoutubeQuotaError) {
      return NextResponse.json({ error: "오늘 YouTube 조회 한도를 다 썼어요." }, { status: 429 });
    }
    console.error("[youtube/summary]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "요약을 진행하지 못했어요." }, { status: 500 });
  }
}
