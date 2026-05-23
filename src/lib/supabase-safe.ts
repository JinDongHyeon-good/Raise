import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function getSupabaseBrowserClientSafe(): SupabaseClient | null {
  try {
    return getSupabaseBrowserClient();
  } catch (error) {
    console.error("[supabase] browser client unavailable", error);
    return null;
  }
}
