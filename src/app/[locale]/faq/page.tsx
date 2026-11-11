import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FaqBrowser } from "@/components/raise/faq-browser";
import { RaisePageShell } from "@/components/raise/raise-chrome";
import { JsonLd } from "@/components/seo/json-ld";
import { localizedPath } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/brand";
import { getFaq } from "@/lib/faq";
import { buildPageMetadata } from "@/lib/seo";
import { toRoutedLocale } from "@/lib/seo-i18n";
import { Link } from "@/navigation";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = toRoutedLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "seo.pages.faq" });
  return buildPageMetadata({ locale, title: t("title"), description: t("description"), path: "/faq" });
}

export default async function FaqPage({ params }: PageProps) {
  const locale = toRoutedLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("faq");
  const { categories, items } = getFaq(locale);
  const url = new URL(localizedPath("/faq", locale), getSiteUrl()).toString();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    url,
    inLanguage: locale === "en" ? "en" : "ko",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <RaisePageShell plain>
      <JsonLd data={jsonLd} />
      <main className="rz-container pb-20 pt-8 sm:py-14">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 sm:gap-10">
          <header className="relative overflow-hidden rounded-3xl border border-[var(--rz-line)] bg-[radial-gradient(120%_140%_at_0%_0%,rgb(225_29_72_/_0.18),transparent_55%),var(--rz-panel)] px-5 py-7 sm:px-8 sm:py-9">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-10 select-none text-[150px] font-black leading-none text-white/[0.03] sm:text-[190px]"
            >
              ?
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--rz-accent)]">{t("eyebrow")}</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">{t("title")}</h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--rz-muted)]">{t("lead")}</p>
          </header>

          <FaqBrowser
            categories={categories}
            items={items}
            labels={{ searchPlaceholder: t("searchPlaceholder"), empty: t("empty") }}
          />

          <div className="grid gap-3 sm:grid-cols-2 sm:items-stretch">
            <Link
              href="/bybit"
              className="group flex h-full flex-col rounded-2xl border border-[#f7a600]/30 bg-[#f7a600]/[0.07] px-5 py-5 transition hover:border-[#f7a600]/60 hover:bg-[#f7a600]/[0.12]"
            >
              <p className="text-sm font-semibold leading-snug text-[#f7a600]">{t("bybitTitle")}</p>
              <p className="mt-1.5 flex-1 text-xs leading-relaxed text-[var(--rz-muted)]">{t("bybitBody")}</p>
              <p className="mt-4 text-xs font-semibold text-white transition group-hover:translate-x-0.5">
                {t("bybitCta")} →
              </p>
            </Link>
            <Link
              href="/contact"
              className="group flex h-full flex-col rounded-2xl border border-[var(--rz-line)] bg-[var(--rz-panel)] px-5 py-5 transition hover:border-[var(--rz-line-strong)] hover:bg-[var(--rz-panel-2)]"
            >
              <p className="text-sm font-semibold leading-snug text-white">{t("contactTitle")}</p>
              <p className="mt-1.5 flex-1 text-xs leading-relaxed text-[var(--rz-muted)]">{t("contactBody")}</p>
              <p className="mt-4 text-xs font-semibold text-[var(--rz-accent)] transition group-hover:translate-x-0.5">
                {t("contactCta")} →
              </p>
            </Link>
          </div>
        </div>
      </main>
    </RaisePageShell>
  );
}
