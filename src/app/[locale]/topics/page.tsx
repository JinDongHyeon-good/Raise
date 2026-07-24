import { Link } from "@/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { JsonLd } from "@/components/seo/json-ld";
import { SitePageShell } from "@/components/site/site-page-shell";
import { getTarotTopicPages } from "@/data/tarot-content-i18n";
import { getSiteUrl } from "@/lib/brand";
import { buildLanguageAlternates, getSeoCopy, localizedSeoPath } from "@/lib/seo-i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const copy = getSeoCopy(locale as AppLocale);
  return {
    title: { absolute: copy.topicsMetaTitle },
    description: copy.topicsMetaDescription,
    keywords: copy.topicsMetaTitle.split(/[·|、,]/).map((s) => s.trim()).filter(Boolean),
    robots: { index: false, follow: false },
    alternates: {
      canonical: localizedSeoPath("/topics", locale as AppLocale),
      languages: buildLanguageAlternates("/topics"),
    },
    openGraph: {
      title: copy.topicsMetaTitle,
      description: copy.topicsMetaDescription,
      url: localizedSeoPath("/topics", locale as AppLocale),
    },
  };
}

export default async function TopicsIndexPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const appLocale = locale as AppLocale;
  const t = await getTranslations({ locale, namespace: "pages" });
  const copy = getSeoCopy(appLocale);
  const pages = getTarotTopicPages(appLocale);
  const siteUrl = getSiteUrl();
  const topicsUrl = `${siteUrl}${localizedSeoPath("/topics", appLocale)}`;

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: copy.topicsMetaTitle,
    description: copy.topicsMetaDescription,
    url: topicsUrl,
    inLanguage: copy.schemaLanguage,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: pages.map((page, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: page.heading,
        url: `${siteUrl}${localizedSeoPath(`/topics/${page.slug}`, appLocale)}`,
        description: page.description,
      })),
    },
  };

  return (
    <SitePageShell title={t("topicsTitle")}>
      <JsonLd data={itemListLd} />
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <h1 className="font-brand-display text-3xl text-slate-900 sm:text-4xl">{copy.topicsMetaTitle}</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">{copy.topicsMetaDescription}</p>
        <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">{t("topicsDescription")}</p>
        <ul className="mt-6 space-y-3">
          {pages.map((page) => (
            <li key={page.slug}>
              <Link
                href={`/topics/${page.slug}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow"
              >
                <span className="text-base font-semibold text-slate-900">{page.heading}</span>
                <p className="mt-1 text-sm leading-6 text-slate-600">{page.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </SitePageShell>
  );
}
