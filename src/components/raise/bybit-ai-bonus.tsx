import { getTranslations } from "next-intl/server";
import { BYBIT_REFERRAL } from "@/lib/bybit-referral";

/** 운영자가 직접 확인하는 연락처 (문의 페이지와 같은 주소) */
const BONUS_CONTACT_EMAIL = "wlsehdgus23@gmail.com";

/**
 * 레퍼럴 가입 혜택 안내: Bybit 레퍼럴로 가입 → 가입 이메일을 보내면 → 운영자가 확인 후 AI 요약 하루 5회 → 20회
 * (확인·상향은 지금은 운영자가 직접 처리)
 */
export async function BybitAiBonus({ locale }: { locale: "ko" | "en" }) {
  const t = await getTranslations({ locale, namespace: "bybit.bonus" });
  const mailto = `mailto:${BONUS_CONTACT_EMAIL}?subject=${encodeURIComponent(t("mailSubject"))}&body=${encodeURIComponent(
    t("mailBody", { code: BYBIT_REFERRAL.code }),
  )}`;
  const steps = [t("step1", { code: BYBIT_REFERRAL.code }), t("step2"), t("step3")];

  return (
    <section
      aria-labelledby="bybit-ai-bonus"
      className="overflow-hidden rounded-2xl border border-[var(--rz-accent)]/35 bg-[linear-gradient(135deg,rgb(225_29_72_/_0.14),transparent_65%)] p-4 sm:p-5"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--rz-accent)]">{t("eyebrow")}</p>
      <h2 id="bybit-ai-bonus" className="mt-1 text-base font-semibold text-white sm:text-lg">
        {t("title")}
      </h2>
      <p className="mt-1.5 text-sm leading-6 text-[var(--rz-muted)]">{t("lead")}</p>

      <div className="mt-3 flex items-center gap-3 rounded-xl border border-[var(--rz-line)] bg-black/20 px-3.5 py-2.5 text-sm">
        <span className="text-[var(--rz-muted)]">{t("limitLabel")}</span>
        <span className="font-mono text-[var(--rz-muted)] line-through decoration-[var(--rz-muted)]/60">{t("limitFrom")}</span>
        <span aria-hidden className="text-[var(--rz-muted)]">→</span>
        <span className="font-mono text-lg font-bold text-white">{t("limitTo")}</span>
      </div>

      <ol className="mt-4 space-y-2.5">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-sm leading-6 text-white/90">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[var(--rz-accent)]/20 font-mono text-xs font-bold text-[var(--rz-accent)]">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <a
        href={mailto}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--rz-accent)] px-4 py-3 text-sm font-semibold text-[var(--rz-accent-fg)] transition hover:brightness-110"
      >
        {t("cta")}
        <span aria-hidden>→</span>
      </a>
      <p className="mt-2 text-center text-xs text-[var(--rz-muted)]">
        {t("ctaHint")} <span className="font-mono text-white/80">{BONUS_CONTACT_EMAIL}</span>
      </p>

      <p className="mt-3 text-[11px] leading-5 text-[var(--rz-muted)]">{t("note")}</p>
    </section>
  );
}
