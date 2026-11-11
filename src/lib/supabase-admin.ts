import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** 서버 전용 관리자 클라이언트 (SUPABASE_SECRET_KEY = sb_secret_…, 구형 SUPABASE_SERVICE_ROLE_KEY도 허용). 키가 없으면 null */
let adminClient: SupabaseClient | null = null;
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  if (!url || !key) return null;
  adminClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return adminClient;
}
