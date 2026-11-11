import { NextRequest } from "next/server";
import { privateJson } from "@/lib/private-response";
import { guardAiRequest } from "@/lib/ai-quota";
import { requireSessionUser } from "@/lib/board-server";
import { apiTranslator } from "@/lib/server-i18n";
import { SlidingRateLimiter } from "@/lib/sliding-rate-limit";
import { ensureSummary, isSummaryLang, resetFailedSummary, SummaryRejectedError } from "@/lib/video-summary";
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
  const body = (await request.json().catch(() => ({}))) as { videoId?: string; retry?: boolean; lang?: string };
  const videoId = body.videoId ?? "";
  // 요약 언어 (화면 언어). 받아쓰기는 언어끼리 공유한다
  const lang = isSummaryLang(body.lang) ? body.lang : "ko";
  const t = apiTranslator(request);
  if (!VIDEO_ID.test(videoId)) return privateJson({ error: t("video.invalidVideo") }, { status: 400 });

  const { user } = await requireSessionUser();
  if (user && !stepLimiter.check(user.id).allowed) {
    return privateJson({ error: t("video.tooManyRequests") }, { status: 429 });
  }

  try {
    // 출처·로그인·이메일 인증·하루 한도(사용자/IP/전체)·차단 목록
    // 실패한 요약 "다시 시도"는 받아쓰기부터 다시 하므로 새 사용으로 센다 (같은 영상 재조회는 세지 않음)
    const guard = await guardAiRequest(request, user, "video-summary", body.retry ? `${videoId}:retry:${crypto.randomUUID()}` : videoId);
    if (!guard.ok) return guard.response;
    const quota = guard.quota;

    if (body.retry) await resetFailedSummary(videoId, lang);
    const view = await ensureSummary(videoId, lang);
    if (view.status === "failed") view.error = t("video.summaryFailed");
    return privateJson({ item: view, quota }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SummaryRejectedError) {
      return privateJson({ error: t(`video.rejected.${error.message}`) }, { status: 422 });
    }
    if (error instanceof YoutubeQuotaError) {
      return privateJson({ error: t("video.youtubeQuotaShort") }, { status: 429 });
    }
    console.error("[youtube/summary]", error instanceof Error ? error.message : error);
    return privateJson({ error: t("video.summaryStepFailed") }, { status: 500 });
  }
}
