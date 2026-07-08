import { Link } from "@/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { SitePageShell } from "@/components/site/site-page-shell";
import { getTarotGuide, getTarotGuides } from "@/data/tarot-content-i18n";
import type { AppLocale } from "@/i18n/routing";
import { locales } from "@/i18n/routing";
import { buildGuidePageMetadata, getGuidePageJsonLd } from "@/lib/seo";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return locales.flatMap((locale) => getTarotGuides(locale).map((guide) => ({ locale, slug: guide.slug })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const guide = getTarotGuide(slug, locale as AppLocale);
  if (!guide) return {};

  return buildGuidePageMetadata(guide, locale as AppLocale);
}

export default async function GuideDetailPage({ params }: PageProps) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const guide = getTarotGuide(slug, locale as AppLocale);
  if (!guide) notFound();

  const t = await getTranslations({ locale, namespace: "pages" });

  return (
    <SitePageShell>
      <JsonLd data={getGuidePageJsonLd(guide, locale as AppLocale)} />
      <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <Link href="/guides" className="text-sm text-slate-600 hover:underline">
          {t("guidesBack")}
        </Link>

        <h1 className="mt-4 font-brand-display text-3xl leading-tight text-slate-900 sm:text-4xl">{guide.title}</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">{guide.description}</p>

        <div className="mt-8 space-y-8">
          {guide.sections.map((section, index) => (
            <section key={`${guide.slug}-section-${index}`}>
              {section.heading ? (
                <h2 className="text-xl font-semibold text-slate-800">{section.heading}</h2>
              ) : null}
              <div className={`space-y-3 ${section.heading ? "mt-3" : ""}`}>
                {section.paragraphs.map((paragraph, pIndex) => (
                  <p key={`${guide.slug}-p-${index}-${pIndex}`} className="leading-7 text-slate-700">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </SitePageShell>
  );
}
