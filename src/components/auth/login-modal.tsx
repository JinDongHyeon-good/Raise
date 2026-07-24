"use client";

import { useEffect } from "react";
import { AuthPanel, type AuthMode } from "@/components/auth/auth-panel";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  onAuthenticated?: () => void | Promise<void>;
  initialMode?: AuthMode;
  nextPath?: string;
};

export function LoginModal({
  open,
  onClose,
  onAuthenticated,
  initialMode = "login",
  nextPath = "/",
}: LoginModalProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="piclick-login-modal-backdrop fixed inset-0 z-[300] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="login"
        className="piclick-login-modal relative max-h-[min(90dvh,100%)] w-full max-w-sm overflow-y-auto rounded-t-2xl border border-[var(--piclick-line)] bg-[var(--piclick-beige-soft)] pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-8px_40px_-12px_rgb(26_46_31_/_0.25)] sm:rounded-2xl sm:shadow-[0_20px_50px_-20px_rgb(26_46_31_/_0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="mx-auto mt-3 h-1 w-10 rounded-full bg-[var(--piclick-green)]/25 sm:hidden"
          aria-hidden
        />
        <div className="relative px-6 pb-6 pt-6 sm:pt-8">
          <AuthPanel
            key={initialMode}
            initialMode={initialMode}
            showCloseButton
            showHeader
            hideGoogleOnMobile
            nextPath={nextPath}
            onClose={onClose}
            onAuthenticated={onAuthenticated}
          />
        </div>
      </div>
    </div>
  );
}
