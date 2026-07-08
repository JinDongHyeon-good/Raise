import { Link } from "@/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { SitePageShell } from "@/components/site/site-page-shell";
import { getTarotTopicPage, getTarotTopicPages } from "@/data/tarot-content-i18n";
import type { AppLocale } from "@/i18n/routing";
import { locales } from "@/i18n/routing";
import { buildTopicPageMetadata, getTopicPageJsonLd } from "@/lib/seo";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return locales.flatMap((locale) => getTarotTopicPages(locale).map((page) => ({ locale, slug: page.slug })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const page = getTarotTopicPage(slug, locale as AppLocale);
  if (!page) return {};

  return buildTopicPageMetadata(page, locale as AppLocale);
}

export default async function TopicPage({ params }: PageProps) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const page = getTarotTopicPage(slug, locale as AppLocale);
  if (!page) notFound();

  const t = await getTranslations({ locale, namespace: "pages" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const startHref = `/?topic=${page.topicId}`;

  return (
    <SitePageShell>
      <JsonLd data={getTopicPageJsonLd(page, locale as AppLocale)} />
      <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <nav className="text-sm text-slate-600" aria-label="breadcrumb">
          <Link href="/" className="hover:underline">
            {tCommon("home")}
          </Link>
          <span className="mx-2 text-slate-300" aria-hidden>
            /
          </span>
          <span className="text-slate-800">{page.heading}</span>
        </nav>

        <h1 className="mt-4 font-brand-display text-3xl leading-tight text-slate-900 sm:text-4xl">{page.heading}</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">{page.intro}</p>

        <div className="mt-8 space-y-8">
          {page.sections.map((section, index) => (
            <section key={`${page.slug}-section-${index}`}>
              <h2 className="text-xl font-semibold text-slate-800">{section.heading}</h2>
              <div className="mt-3 space-y-3">
                {section.paragraphs.map((paragraph, pIndex) => (
                  <p key={`${page.slug}-p-${index}-${pIndex}`} className="leading-7 text-slate-700">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50/60 p-5">
          <p className="text-sm leading-6 text-slate-800">{t("topicCta", { heading: page.heading })}</p>
          <Link
            href={startHref}
            className="mt-4 inline-flex rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-500"
          >
            {t("topicStart", { heading: page.heading })}
          </Link>
        </div>

        <p className="mt-6 text-xs leading-6 text-slate-500">{t("disclaimer")}</p>
      </article>
    </SitePageShell>
  );
}
