import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * 브라우저 전용 Supabase 클라이언트 (한 브라우저 = 한 사용자라 하나를 재사용).
 * 서버에서 이걸 쓰면 모든 요청이 같은 객체(세션)를 공유해 사용자 세션이 섞이므로 서버에서는 막는다.
 * 서버는 요청마다 createSupabaseRouteHandlerClient() 를 쓴다.
 */
export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    throw new Error("getSupabaseBrowserClient 는 브라우저에서만 쓸 수 있어요. 서버는 createSupabaseRouteHandlerClient 를 쓰세요.");
  }
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }

  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: true,
      persistSession: true,
    },
  });
  return browserClient;
}
