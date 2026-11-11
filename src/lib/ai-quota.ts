/**
 * AI 기능 사용량 제한 — 로그인 사용자 1인당 하루(KST) AI_DAILY_LIMIT회.
 * DB 함수 ai_consume(supabase/sql/ai_usage.sql)가 확인과 기록을 한 번에 처리한다.
 * 확인할 수 없으면(테이블 없음·키 없음) 허용하지 않는다 (fail closed).
 */
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const AI_DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT) || 5;

export type AiFeature = "video-summary" | "chart-analysis";

export type AiQuotaResult = { allowed: boolean; used: number; limit: number; repeat: boolean };

export class AiQuotaUnavailableError extends Error {}

export async function consumeAiQuota(userId: string, feature: AiFeature, itemKey: string): Promise<AiQuotaResult> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new AiQuotaUnavailableError("SUPABASE_SECRET_KEY가 없습니다.");
  const { data, error } = await admin.rpc("ai_consume", {
    p_user: userId,
    p_feature: feature,
    p_item: itemKey.slice(0, 200),
    p_limit: AI_DAILY_LIMIT,
  });
  if (error) {
    console.error("[ai-quota]", error.message);
    throw new AiQuotaUnavailableError(error.message);
  }
  return data as AiQuotaResult;
}

function kstToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

/** 오늘 사용한 횟수 (표시용). 확인 못 하면 null */
export async function getAiUsage(userId: string): Promise<{ used: number; limit: number } | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;
  const { count, error } = await admin
    .from("AI_USAGE")
    .select("item_key", { count: "exact", head: true })
    .eq("user_auth_id", userId)
    .eq("used_on", kstToday());
  if (error) return null;
  return { used: count ?? 0, limit: AI_DAILY_LIMIT };
}
