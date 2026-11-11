import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { RaisePageShell } from "@/components/raise/raise-chrome";

export const metadata: Metadata = {
  title: "비밀번호 재설정",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <RaisePageShell plain>
      <ResetPasswordForm />
    </RaisePageShell>
  );
}
