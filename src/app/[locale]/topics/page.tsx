import { Link } from "@/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { locales } from "@/i18n/routing";
import { SitePageShell } from "@/components/site/site-page-shell";
import { getTarotTopicPages } from "@/data/tarot-content-i18n";
import { buildLanguageAlternates, localizedSeoPath } from "@/lib/seo-i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: t("topicsMetaTitle"),
    description: t("topicsMetaDescription"),
    alternates: {
      canonical: localizedSeoPath("/topics", locale as AppLocale),
      languages: buildLanguageAlternates("/topics"),
    },
  };
}

export default async function TopicsIndexPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pages" });
  const pages = getTarotTopicPages(locale as AppLocale);

  return (
    <SitePageShell title={t("topicsTitle")}>
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <p className="text-sm leading-7 text-slate-600 sm:text-base">{t("topicsDescription")}</p>
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
