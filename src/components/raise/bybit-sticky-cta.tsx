"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { BYBIT_REFERRAL } from "@/lib/bybit-referral";

/** 모바일 하단 고정 — 추천인 코드 복사 + 가입 버튼 (데스크톱은 카드가 충분히 보이므로 숨김) */
export function BybitStickyCta() {
  const t = useTranslations("bybit");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(BYBIT_REFERRAL.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* 무시 */
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#F7A600]/25 bg-[var(--rz-bg)]/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:hidden">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void copy()}
          className="flex shrink-0 flex-col items-start rounded-xl border border-[#F7A600]/30 px-3 py-1.5 text-left"
          aria-label={`${t("stickyCopy")} ${BYBIT_REFERRAL.code}`}
        >
          <span className="text-[10px] text-[var(--rz-muted)]">{copied ? t("copied") : t("stickyCopy")}</span>
          <span className="font-mono text-sm font-bold tracking-[0.15em] text-[#F7A600]">{BYBIT_REFERRAL.code}</span>
        </button>
        <a
          href={BYBIT_REFERRAL.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#F7A600] px-4 py-3 text-sm font-semibold text-[#121212]"
        >
          {t("stickyCta")}
          <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}
