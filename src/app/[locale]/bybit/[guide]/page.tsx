import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BybitGuideLinks } from "@/components/raise/bybit-guide-links";
import { BybitStickyCta } from "@/components/raise/bybit-sticky-cta";
import { RaisePageShell } from "@/components/raise/raise-chrome";
import { JsonLd } from "@/components/seo/json-ld";
import { localizedPath, locales } from "@/i18n/routing";
import { Link } from "@/navigation";
import { getLocalizedBrandName, getSiteUrl } from "@/lib/brand";
import { BYBIT_REFERRAL } from "@/lib/bybit-referral";
import {
  BYBIT_GUIDE_SLUGS,
  BYBIT_GUIDES_CHECKED,
  type BybitGuide,
  type GuideSection,
  getBybitGuide,
  isBybitGuideSlug,
} from "@/lib/bybit-guides";
import { buildPageMetadata } from "@/lib/seo";
import { toRoutedLocale } from "@/lib/seo-i18n";

type Params = Promise<{ locale: string; guide: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => BYBIT_GUIDE_SLUGS.map((guide) => ({ locale, guide })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale: rawLocale, guide: slug } = await params;
  if (!isBybitGuideSlug(slug)) return {};
  const locale = toRoutedLocale(rawLocale);
  const guide = getBybitGuide(slug, locale);
  const brand = getLocalizedBrandName(locale);
  return buildPageMetadata({
    locale,
    title: guide.metaTitle,
    description: guide.description,
    keywords: guide.keywords,
    path: `/bybit/${slug}`,
    image: "/og-bybit.png",
    imageAlt: guide.h1,
    socialTitle: `${guide.h1} | ${brand}`,
    socialDescription: guide.socialDescription,
    type: "article",
  });
}

function guideJsonLd(guide: BybitGuide, locale: "ko" | "en", labels: { home: string; signup: string }) {
  const site = getSiteUrl();
  const url = `${site}${localizedPath(`/bybit/${guide.slug}`, locale)}`;
  const brand = getLocalizedBrandName(locale);
  const org = { "@type": "Organization", name: brand, url: `${site}${localizedPath("/", locale)}` };
  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "@id": `${url}#article`,
      mainEntityOfPage: url,
      headline: guide.h1,
      description: guide.description,
      inLanguage: locale,
      dateModified: BYBIT_GUIDES_CHECKED,
      author: org,
      publisher: org,
      image: `${site}${locale === "en" ? "/og-bybit-en.png" : "/og-bybit.png"}`,
      about: { "@type": "Organization", name: "Bybit", url: "https://www.bybit.com" },
      keywords: guide.keywords.join(", "),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: locale,
      mainEntity: guide.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: labels.home, item: `${site}${localizedPath("/", locale)}` },
        { "@type": "ListItem", position: 2, name: labels.signup, item: `${site}${localizedPath("/bybit", locale)}` },
        { "@type": "ListItem", position: 3, name: guide.navTitle, item: url },
      ],
    },
  ];
}

function Section({ section }: { section: GuideSection }) {
  // 표가 있는 섹션의 문단은 표에 대한 주석이라 표 아래에 둔다
  const paragraphs = section.paragraphs?.map((p) => (
    <p key={p} className="text-sm leading-6 text-[var(--rz-muted)]">
      {p}
    </p>
  ));
  return (
    <section id={section.id} aria-labelledby={`${section.id}-h`} className="scroll-mt-24 space-y-3">
      <h2 id={`${section.id}-h`} className="text-[15px] font-semibold text-white sm:text-base">
        {section.heading}
      </h2>
      {section.table ? null : paragraphs}
      {section.steps ? (
        <ol className="space-y-2">
          {section.steps.map((s, i) => (
            <li key={s} className="flex gap-3 rounded-xl border border-[var(--rz-line)] bg-[var(--rz-panel)] px-3.5 py-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#F7A600]/15 font-mono text-xs font-bold text-[#F7A600]">
                {i + 1}
              </span>
              <span className="text-sm leading-6 text-white/90">{s}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {section.bullets ? (
        <ul className="space-y-2">
          {section.bullets.map((b) => (
            <li key={b} className="flex gap-2.5 text-sm leading-6 text-[var(--rz-muted)]">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F7A600]" aria-hidden />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {section.table ? (
        <div className="overflow-x-auto rounded-xl border border-[var(--rz-line)]">
          <table className="w-full min-w-[20rem] border-collapse text-left text-[13px]">
            <thead className="bg-white/[0.04]">
              <tr>
                {section.table[0].map((c, i) => (
                  <th key={i} scope="col" className="px-3 py-2.5 font-semibold text-white">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.slice(1).map((row) => (
                <tr key={row.join("|")} className="border-t border-[var(--rz-line)]">
                  {row.map((c, i) => (
                    <td key={i} className={`px-3 py-2.5 align-top leading-5 ${i === 0 ? "font-medium text-white/90" : "text-[var(--rz-muted)]"}`}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {section.table ? paragraphs : null}
      {section.tip ? (
        <p className="rounded-xl border border-[#F7A600]/25 bg-[#F7A600]/[0.08] px-3.5 py-2.5 text-xs leading-5 text-[#F7A600]/95">
          Tip · {section.tip}
        </p>
      ) : null}
      {section.link ? (
        <a
          href={section.link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs font-medium text-[#F7A600] underline-offset-2 hover:underline"
        >
          {section.link.label}
        </a>
      ) : null}
    </section>
  );
}

export default async function BybitGuidePage({ params }: { params: Params }) {
  const { locale: rawLocale, guide: slug } = await params;
  if (!isBybitGuideSlug(slug)) notFound();
  setRequestLocale(rawLocale);
  const locale = toRoutedLocale(rawLocale) === "en" ? "en" : "ko";
  const t = await getTranslations({ locale, namespace: "bybit" });
  const guide = getBybitGuide(slug, locale);
  const isEn = locale === "en";

  return (
    <RaisePageShell plain>
      <JsonLd data={guideJsonLd(guide, locale, { home: t("breadcrumbHome"), signup: t("breadcrumbSignup") })} />
      <main className="rz-container pb-28 pt-7 sm:py-12">
        <article className={`mx-auto flex w-full flex-col gap-8 sm:gap-10 ${isEn ? "max-w-2xl" : "max-w-xl"}`}>
          <header className="space-y-3">
            <nav aria-label="breadcrumb" className="text-[11px] text-[var(--rz-muted)]">
              <Link href="/" className="hover:text-white">
                {t("breadcrumbHome")}
              </Link>
              <span className="mx-1.5" aria-hidden>
                ›
              </span>
              <Link href="/bybit" className="hover:text-white">
                {t("breadcrumbSignup")}
              </Link>
              <span className="mx-1.5" aria-hidden>
                ›
              </span>
              <span className="text-white/80">{guide.navTitle}</span>
            </nav>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F7A600]">{guide.eyebrow}</p>
            <h1 className="font-[family-name:var(--font-brand-display)] text-[1.55rem] font-semibold leading-snug tracking-tight text-white sm:text-[1.85rem]">
              {guide.h1}
            </h1>
            <p className="text-sm leading-relaxed text-[var(--rz-muted)]">{guide.lead}</p>
            <p className="text-[11px] text-[var(--rz-muted)]">
              <time dateTime={BYBIT_GUIDES_CHECKED}>{t("guideChecked", { date: BYBIT_GUIDES_CHECKED })}</time>
            </p>
          </header>

          {guide.sections.map((s) => (
            <Section key={s.id} section={s} />
          ))}

          <aside className="space-y-3 rounded-2xl border border-[#F7A600]/30 bg-[linear-gradient(120deg,rgb(247_166_0_/_0.10),transparent_60%)] p-4 sm:p-5">
            <p className="text-sm font-semibold text-white">{t("guideCtaTitle")}</p>
            <p className="text-xs leading-5 text-[var(--rz-muted)]">
              {t("guideCtaBody")} <span className="font-mono font-bold tracking-[0.12em] text-[#F7A600]">{BYBIT_REFERRAL.code}</span>
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <a
                href={BYBIT_REFERRAL.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#F7A600] px-4 py-3 text-sm font-semibold text-[#121212] transition hover:brightness-110"
              >
                {t("guideCtaSignup")} →
              </a>
              <Link
                href="/bybit"
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-[var(--rz-line-strong)] px-4 py-3 text-sm font-medium text-white transition hover:border-[#F7A600]/50"
              >
                {t("guideCtaGuide")}
              </Link>
            </div>
          </aside>

          <section aria-labelledby="guide-faq-h" className="space-y-3">
            <h2 id="guide-faq-h" className="text-[15px] font-semibold text-white sm:text-base">
              {t("guideFaq")}
            </h2>
            <div className="divide-y divide-[var(--rz-line)] rounded-2xl border border-[var(--rz-line)] bg-[var(--rz-panel)] px-4 sm:px-5">
              {guide.faq.map((f) => (
                <div key={f.q} className="py-3.5">
                  <h3 className="text-sm font-medium text-white/90">{f.q}</h3>
                  <p className="mt-1.5 text-xs leading-5 text-[var(--rz-muted)] sm:text-sm sm:leading-6">{f.a}</p>
                </div>
              ))}
            </div>
          </section>

          <BybitGuideLinks locale={locale} exclude={slug} />

          <p className="text-[11px] leading-5 text-[var(--rz-muted)]">{t("guideDisclaimer")}</p>
        </article>
      </main>
      <BybitStickyCta />
    </RaisePageShell>
  );
}
