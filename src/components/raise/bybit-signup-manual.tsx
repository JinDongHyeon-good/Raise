"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { BYBIT_OFFICIAL_GUIDE_URL, getBybitSignupManual } from "@/lib/bybit-signup-manual";
import { BYBIT_REFERRAL } from "@/lib/bybit-referral";

export function BybitSignupManual() {
  const t = useTranslations("bybit");
  const locale = useLocale();
  const isEn = locale === "en";
  const { prep: BYBIT_SIGNUP_PREP, steps: BYBIT_SIGNUP_STEPS, faq: BYBIT_SIGNUP_FAQ } = getBybitSignupManual(locale);
  const [openId, setOpenId] = useState<string | null>(BYBIT_SIGNUP_STEPS[0]?.id ?? null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section className="space-y-5" aria-labelledby="bybit-manual-heading">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F7A600]">
          {t("manual.eyebrow")}
        </p>
        <h2 id="bybit-manual-heading" className="text-[15px] font-semibold text-white sm:text-base">
          {t("manual.title")}
        </h2>
        <p className="text-xs leading-5 text-[var(--rz-muted)] sm:text-sm sm:leading-6">
          {t("manual.introBefore")}{" "}
          <a
            href={BYBIT_OFFICIAL_GUIDE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#F7A600] underline-offset-2 hover:underline"
          >
            {t("manual.officialGuide")}
          </a>
          {t("manual.introAfter")}
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--rz-line)] bg-[var(--rz-panel)] p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-white">{t("manual.checklist")}</h3>
        <ul className="mt-3 space-y-2.5">
          {BYBIT_SIGNUP_PREP.map((item) => (
            <li key={item} className="flex gap-2.5 text-xs leading-5 text-[var(--rz-muted)] sm:text-sm sm:leading-6">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F7A600]" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <ol className="space-y-2">
        {BYBIT_SIGNUP_STEPS.map((step, index) => {
          const open = openId === step.id;
          return (
            <li
              key={step.id}
              id={`step-${step.id}`}
              className="scroll-mt-24 overflow-hidden rounded-2xl border border-[var(--rz-line)] bg-[var(--rz-panel)]"
            >
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : step.id)}
                className={`flex w-full gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.02] sm:px-5 sm:py-4 ${isEn ? "items-center" : "items-start"}`}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#F7A600]/15 font-mono text-xs font-bold text-[#F7A600]">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block font-semibold text-white ${isEn ? "text-[13px] leading-snug sm:text-sm" : "text-sm"}`}>
                    {step.title}
                  </span>
                  <span className={`mt-0.5 block text-xs text-[var(--rz-muted)] ${isEn ? "leading-snug" : ""}`}>
                    {step.summary}
                  </span>
                </span>
                <span className={`mt-1 shrink-0 text-[var(--rz-muted)] transition ${open ? "rotate-180" : ""}`} aria-hidden>
                  ▾
                </span>
              </button>
              {/* 닫혀 있어도 HTML에는 남겨 검색엔진이 읽을 수 있게 (화면에서만 숨김) */}
              <div hidden={!open} className="border-t border-[var(--rz-line)] px-4 py-3.5 sm:px-5 sm:py-4">
                  <ul className="space-y-2.5">
                    {step.details.map((line) => (
                      <li key={line} className="flex gap-2 text-xs leading-5 text-[var(--rz-muted)] sm:text-sm sm:leading-6">
                        <span className="shrink-0 text-[#F7A600]">–</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  {step.tip ? (
                    <p className="mt-3 rounded-xl border border-[#F7A600]/25 bg-[#F7A600]/08 px-3 py-2.5 text-xs leading-5 text-[#F7A600]/95">
                      Tip · {step.tip}
                    </p>
                  ) : null}
                  {step.id === "open-link" ? (
                    <a
                      href={BYBIT_REFERRAL.url}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[#F7A600] px-4 py-3 text-sm font-semibold text-[#121212] transition hover:brightness-110"
                    >
                      {t("manual.startCta")}
                    </a>
                  ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="rounded-2xl border border-[var(--rz-line)] bg-[var(--rz-panel)] p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-white">{t("manual.faq")}</h3>
        <div className="mt-3 divide-y divide-[var(--rz-line)]">
          {BYBIT_SIGNUP_FAQ.map((item, i) => {
            const open = openFaq === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="flex w-full items-center justify-between gap-3 py-3 text-left"
                >
                  <span className="text-sm font-medium text-white/90">{item.q}</span>
                  <span className={`text-[var(--rz-muted)] transition ${open ? "rotate-180" : ""}`} aria-hidden>
                    ▾
                  </span>
                </button>
                <p hidden={!open} className="pb-3 text-xs leading-5 text-[var(--rz-muted)] sm:text-sm sm:leading-6">
                  {item.a}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] leading-5 text-[var(--rz-muted)]">
        {t("manual.disclaimer")}
      </p>
    </section>
  );
}
