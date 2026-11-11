"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { BYBIT_REFERRAL } from "@/lib/bybit-referral";

export function BybitReferralCard() {
  const t = useTranslations("bybit");
  const isEn = useLocale() === "en";
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(BYBIT_REFERRAL.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-[#F7A600]/30 bg-[var(--rz-panel)] shadow-[0_16px_40px_rgb(247_166_0_/_0.1)]">
      <div className="relative aspect-[5/3] overflow-hidden sm:aspect-[16/9]">
        <Image
          src="/bybit-referral.png"
          alt={t("imageAlt")}
          fill
          sizes="(max-width: 768px) 100vw, 640px"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgb(10_12_16_/_0.92))]" />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F7A600]">
            {t("cardEyebrow")}
          </p>
          <p
            className={`mt-1.5 font-medium leading-snug text-white ${
              isEn ? "max-w-xl text-[13px] sm:text-[15px]" : "max-w-md text-sm sm:text-base"
            }`}
          >
            {t("headline")}
          </p>
        </div>
      </div>

      <div className="space-y-3.5 p-4 sm:p-5">
        <p className={`text-xs text-[var(--rz-muted)] sm:text-[13px] ${isEn ? "leading-snug sm:leading-5" : "leading-5 sm:leading-6"}`}>
          {t("subline")}
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <div className="min-w-0 flex-1 rounded-xl border border-[#F7A600]/25 bg-black/20 px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-wide text-[var(--rz-muted)]">{t("inviteCodeLabel")}</p>
            <p className="mt-1 font-mono text-xl font-bold tracking-[0.2em] text-[#F7A600]">{BYBIT_REFERRAL.code}</p>
          </div>
          <button
            type="button"
            onClick={() => void copyCode()}
            className="rounded-xl border border-[var(--rz-line-strong)] px-4 py-3 text-sm font-medium text-white transition hover:border-[#F7A600]/50 hover:bg-[#F7A600]/10 sm:min-w-[7rem]"
          >
            {copied ? t("copied") : t("copyCode")}
          </button>
        </div>

        <a
          href={BYBIT_REFERRAL.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F7A600] px-4 py-3.5 text-sm font-semibold text-[#121212] transition hover:brightness-110"
        >
          {t("cta")}
          <span aria-hidden>→</span>
        </a>
      </div>
    </article>
  );
}
