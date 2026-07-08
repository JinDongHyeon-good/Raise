"use client";

import { useRouter } from "@/navigation";
import { AuthPageLinks, AuthPanel, AuthPanelCard } from "@/components/auth/auth-panel";
import { ensureUserProfileClient } from "@/lib/ensure-user-profile-client";
import { getSupabaseBrowserClientSafe } from "@/lib/supabase-safe";

export default function LoginPage() {
  const router = useRouter();

  const handleAuthenticated = async () => {
    const supabase = getSupabaseBrowserClientSafe();
    if (!supabase) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await ensureUserProfileClient(supabase, user.id, user);
    router.replace("/");
    router.refresh();
  };

  return (
    <div className="w-full max-w-sm">
      <AuthPanelCard>
        <AuthPanel initialMode="login" onAuthenticated={handleAuthenticated} />
      </AuthPanelCard>
      <AuthPageLinks />
    </div>
  );
}
