"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { RaisePageShell } from "@/components/raise/raise-chrome";

type StatusScreenProps = {
  code: string;
  title: string;
  body: string;
  onRetry?: () => void;
};

/** 404 / 에러 화면 공용 레이아웃 — 헤더·푸터를 유지해 다른 메뉴로 바로 이동할 수 있게 한다 */
export function StatusScreen({ code, title, body, onRetry }: StatusScreenProps) {
  const t = useTranslations("common");
  return (
    <RaisePageShell plain>
      <main className="rz-container flex flex-1 flex-col items-center justify-center py-24 text-center">
        <p className="text-6xl font-bold tracking-tight text-[var(--rz-accent)]">{code}</p>
        <h1 className="mt-4 text-xl font-semibold text-[var(--rz-text)]">{title}</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--rz-muted)]">{body}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-xl bg-[var(--rz-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--rz-accent-fg)] transition hover:brightness-110"
            >
              {t("retry")}
            </button>
          ) : null}
          <Link
            href="/"
            className={
              onRetry
                ? "rounded-xl border border-[var(--rz-line-strong)] px-5 py-2.5 text-sm font-medium text-[var(--rz-text)] transition hover:bg-[var(--rz-panel)]"
                : "rounded-xl bg-[var(--rz-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--rz-accent-fg)] transition hover:brightness-110"
            }
          >
            {t("goHome")}
          </Link>
          <Link
            href="/chart"
            className="rounded-xl border border-[var(--rz-line-strong)] px-5 py-2.5 text-sm font-medium text-[var(--rz-text)] transition hover:bg-[var(--rz-panel)]"
          >
            {t("navChart")}
          </Link>
          <Link
            href="/community"
            className="rounded-xl border border-[var(--rz-line-strong)] px-5 py-2.5 text-sm font-medium text-[var(--rz-text)] transition hover:bg-[var(--rz-panel)]"
          >
            {t("goCommunity")}
          </Link>
        </div>
      </main>
    </RaisePageShell>
  );
}
