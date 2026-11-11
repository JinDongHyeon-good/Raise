"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { BYBIT_REFERRAL } from "@/lib/bybit-referral";

/** 차트 아래 작은 안내 — 가입 가이드 페이지(/bybit)로 보낸다 */
export function BybitInlinePromo() {
  const t = useTranslations("bybit");
  return (
    <Link
      href="/bybit"
      className="group flex items-center gap-4 rounded-2xl border border-[#F7A600]/25 bg-[linear-gradient(120deg,rgb(247_166_0_/_0.10),transparent_60%)] px-4 py-3.5 transition hover:border-[#F7A600]/50 sm:px-5"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F7A600]/15 text-sm font-bold text-[#F7A600]" aria-hidden>
        B
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F7A600]">{t("promoEyebrow")}</span>
        <span className="mt-0.5 block text-sm font-medium text-white">{t("promoTitle")}</span>
        <span className="block truncate text-xs text-[var(--rz-muted)]">
          {t("promoBody")} · <span className="font-mono text-[#F7A600]">{BYBIT_REFERRAL.code}</span>
        </span>
      </span>
      <span className="hidden shrink-0 text-xs font-medium text-[#F7A600] transition group-hover:translate-x-0.5 sm:inline">
        {t("promoCta")} →
      </span>
    </Link>
  );
}
