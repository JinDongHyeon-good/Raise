import { AuthPageLinks, AuthPanel, AuthPanelCard } from "@/components/auth/auth-panel";

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-sm">
      <AuthPanelCard>
        <AuthPanel initialMode="forgot" showHeader />
      </AuthPanelCard>
      <AuthPageLinks />
    </div>
  );
}
