import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BybitAiBonus } from "@/components/raise/bybit-ai-bonus";
import { BybitGuideLinks } from "@/components/raise/bybit-guide-links";
import { BybitReferralCard } from "@/components/raise/bybit-referral-card";
import { BybitSignupManual } from "@/components/raise/bybit-signup-manual";
import { BybitStickyCta } from "@/components/raise/bybit-sticky-cta";
import { RaisePageShell } from "@/components/raise/raise-chrome";
import { JsonLd } from "@/components/seo/json-ld";
import { localizedPath } from "@/i18n/routing";
import { getLocalizedBrandName, getSiteUrl } from "@/lib/brand";
import { BYBIT_REFERRAL_KEYWORDS_EN, BYBIT_REFERRAL_KEYWORDS_KO } from "@/lib/bybit-referral";
import { BYBIT_GUIDE_UPDATED, getBybitSignupManual } from "@/lib/bybit-signup-manual";
import { buildPageMetadata } from "@/lib/seo";
import { toRoutedLocale } from "@/lib/seo-i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = toRoutedLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "seo.pages.bybit" });
  const brand = getLocalizedBrandName(locale);
  return buildPageMetadata({
    locale,
    title: t("title"),
    description: t("description"),
    keywords: locale === "en" ? BYBIT_REFERRAL_KEYWORDS_EN : BYBIT_REFERRAL_KEYWORDS_KO,
    path: "/bybit",
    image: "/og-bybit.png",
    imageAlt: locale === "en" ? "Bybit referral code XQZZ6O sign-up guide" : "바이비트 추천인 코드 XQZZ6O 가입 가이드",
    socialTitle: t("socialTitle", { brand }),
    socialDescription: t("socialDescription"),
  });
}

/** 검색엔진용 구조화 데이터: 가입 단계(HowTo) · 자주 묻는 질문(FAQ) · 위치(Breadcrumb) */
function bybitJsonLd(locale: "ko" | "en", pageTitle: string, description: string, homeLabel: string) {
  const site = getSiteUrl();
  const url = `${site}${localizedPath("/bybit", locale)}`;
  const { steps, faq } = getBybitSignupManual(locale);
  const inLanguage = locale === "en" ? "en" : "ko";
  return [
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "@id": `${url}#howto`,
      name: pageTitle,
      description,
      inLanguage,
      totalTime: "PT10M",
      supply: [{ "@type": "HowToSupply", name: locale === "en" ? "Email address or phone number" : "이메일 또는 휴대폰 번호" }, { "@type": "HowToSupply", name: locale === "en" ? "Government-issued ID" : "본인 명의 신분증" }],
      step: steps.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.title.replace(/^\d+\.\s*/, ""),
        text: [s.summary, ...s.details].join(" "),
        url: `${url}#step-${s.id}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage,
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: pageTitle,
      description,
      inLanguage,
      dateModified: BYBIT_GUIDE_UPDATED,
      about: { "@type": "Organization", name: "Bybit", url: "https://www.bybit.com" },
      primaryImageOfPage: `${site}${locale === "en" ? "/og-bybit-en.png" : "/og-bybit.png"}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: homeLabel, item: `${site}${localizedPath("/", locale)}` },
        { "@type": "ListItem", position: 2, name: pageTitle, item: url },
      ],
    },
  ];
}

export default async function BybitReferralPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  setRequestLocale(rawLocale);
  const locale = toRoutedLocale(rawLocale) === "en" ? "en" : "ko";
  const t = await getTranslations("bybit");
  const seo = await getTranslations({ locale, namespace: "seo.pages.bybit" });

  const isEn = locale === "en";

  return (
    <RaisePageShell plain>
      <JsonLd data={bybitJsonLd(locale, t("pageTitle"), seo("description"), t("breadcrumbHome"))} />
      <main className="rz-container pb-28 pt-7 sm:py-12">
        <div className={`mx-auto flex w-full flex-col gap-8 sm:gap-10 ${isEn ? "max-w-2xl" : "max-w-xl"}`}>
          <header className="space-y-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F7A600]">{t("pageEyebrow")}</p>
            <h1
              className={`font-[family-name:var(--font-brand-display)] font-semibold tracking-tight text-white ${
                isEn ? "text-[1.45rem] leading-snug sm:text-[1.85rem] sm:leading-tight" : "text-[1.65rem] sm:text-3xl"
              }`}
            >
              {t("pageTitleLine1")}
              {t("pageTitleLine2") ? (
                <>
                  <br />
                  {t("pageTitleLine2")}
                </>
              ) : null}
            </h1>
            <p className={`text-sm text-[var(--rz-muted)] ${isEn ? "leading-snug sm:leading-relaxed" : "leading-relaxed"}`}>
              {t("pageLead")}
            </p>
            <p className="text-[11px] text-[var(--rz-muted)]">
              <time dateTime={BYBIT_GUIDE_UPDATED}>{t("updated", { date: BYBIT_GUIDE_UPDATED })}</time>
            </p>
          </header>


          <BybitReferralCard />

          <BybitAiBonus locale={locale} />


          <BybitSignupManual />

          <BybitGuideLinks locale={locale} />
        </div>
      </main>
      <BybitStickyCta />
    </RaisePageShell>
  );
}
