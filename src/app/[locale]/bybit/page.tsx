import type { Metadata } from "next";
import { getLocalizedBrandName } from "@/lib/brand";
import { buildPageMetadata } from "@/lib/seo";
import { toRoutedLocale } from "@/lib/seo-i18n";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BybitReferralCard } from "@/components/raise/bybit-referral-card";
import { BybitSignupManual } from "@/components/raise/bybit-signup-manual";
import { RaisePageShell } from "@/components/raise/raise-chrome";
import {
  BYBIT_REFERRAL,
  BYBIT_REFERRAL_DESCRIPTION,
  BYBIT_REFERRAL_KEYWORDS,
} from "@/lib/bybit-referral";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = toRoutedLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "seo.pages.bybit" });
  const brand = getLocalizedBrandName(locale);
  return buildPageMetadata({
    locale,
    title: t("title"),
    description: t("description"),
    keywords: [
      ...BYBIT_REFERRAL_KEYWORDS,
      "바이비트 가입 방법",
      "바이비트 KYC",
      "Bybit signup guide",
      "Bybit how to register",
      "Bybit KYC",
    ],
    path: "/bybit",
    image: "/bybit-referral.png",
    imageAlt: "Bybit referral invite",
    socialTitle: t("socialTitle", { brand }),
    socialDescription: locale === "ko" ? BYBIT_REFERRAL_DESCRIPTION : t("socialDescription"),
  });
}

export default async function BybitReferralPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("bybit");
  const code = () => <b className="text-white">{BYBIT_REFERRAL.code}</b>;

  return (
    <RaisePageShell plain>
      <main className="rz-container py-7 sm:py-12">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-8 sm:gap-10">
          <header className="space-y-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F7A600]">
              {t("pageEyebrow")}
            </p>
            <h1 className="font-[family-name:var(--font-brand-display)] text-[1.65rem] font-semibold tracking-tight text-white sm:text-3xl">
              {t("pageTitle")}
            </h1>
            <p className="text-sm leading-relaxed text-[var(--rz-muted)]">{t("headline")}</p>
            <p className="text-xs text-[var(--rz-muted)]">
              Bybit Referral Code{" "}
              <span className="font-mono font-semibold text-[#F7A600]">{BYBIT_REFERRAL.code}</span>
              <span className="mx-1.5 text-white/20">·</span>
              {t("pageCodeLine")}
            </p>
          </header>

          <BybitReferralCard />

          <BybitSignupManual />

          <section className="space-y-3 rounded-2xl border border-[var(--rz-line)] bg-[var(--rz-panel)] p-4 sm:p-5">
            <h2 className="text-[15px] font-semibold text-white">{t("aboutTitle")}</h2>
            <div className="space-y-3 text-sm leading-6 text-[var(--rz-muted)]">
              <p>{t.rich("aboutBody1", { code })}</p>
              <p>{t("aboutBody2")}</p>
            </div>
          </section>
        </div>
      </main>
    </RaisePageShell>
  );
}
