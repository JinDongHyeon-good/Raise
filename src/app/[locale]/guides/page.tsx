import { Link } from "@/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { SitePageShell } from "@/components/site/site-page-shell";
import { getTarotGuides } from "@/data/tarot-content-i18n";
import { buildLanguageAlternates, localizedSeoPath } from "@/lib/seo-i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: t("guidesMetaTitle"),
    description: t("guidesMetaDescription"),
    alternates: {
      canonical: localizedSeoPath("/guides", locale as AppLocale),
      languages: buildLanguageAlternates("/guides"),
    },
  };
}

export default async function GuidesIndexPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pages" });
  const guides = getTarotGuides(locale as AppLocale);

  return (
    <SitePageShell title={t("guidesTitle")}>
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-brand-display text-3xl text-slate-900 sm:text-4xl">{t("guidesTitle")}</h1>
        <p className="mt-4 leading-7 text-slate-700">{t("guidesDescription")}</p>

        <ul className="mt-8 space-y-4">
          {guides.map((guide) => (
            <li key={guide.slug}>
              <Link
                href={`/guides/${guide.slug}`}
                className="block rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:border-slate-300 hover:bg-slate-50/40"
              >
                <h2 className="text-lg font-semibold text-slate-900">{guide.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{guide.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </SitePageShell>
  );
}
