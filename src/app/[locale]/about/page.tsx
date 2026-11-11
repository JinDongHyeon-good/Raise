import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/navigation";
import { RaisePageShell } from "@/components/raise/raise-chrome";
import { getSeoCopy, toRoutedLocale } from "@/lib/seo-i18n";
import { JsonLd } from "@/components/seo/json-ld";
import { getServiceValues } from "@/lib/brand";
import { getFaqJsonLd, getHomeSeoIntro, buildPageMetadata } from "@/lib/seo";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = toRoutedLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "seo.pages.about" });
  return buildPageMetadata({
    locale,
    title: t("title"),
    description: getHomeSeoIntro(locale).body,
    path: "/about",
  });
}

export default async function AboutPage({ params }: PageProps) {
  const locale = toRoutedLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("legal.about");
  const copy = getSeoCopy(locale);
  const intro = getHomeSeoIntro(locale);
  return (
    <RaisePageShell>
      <JsonLd data={getFaqJsonLd(locale)} />
      <main>
        <h1>{intro.heading}</h1>
        <p className="mt-4">{intro.body}</p>

        {getServiceValues(locale).map((value) => (
          <section key={value.title}>
            <h2>{value.title}</h2>
            <p>{value.body}</p>
          </section>
        ))}

        <h2>{t("faqHeading")}</h2>
        {copy.faq.map((item) => (
          <div key={item.question} className="mt-4">
            <p className="font-medium !text-[var(--rz-text)]">Q. {item.question}</p>
            <p>{item.answer}</p>
          </div>
        ))}

        <p className="mt-10">
          <Link href="/">{t("backToChart")}</Link>
        </p>
      </main>
    </RaisePageShell>
  );
}
