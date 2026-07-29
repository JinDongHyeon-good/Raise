import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { htmlLang, routing, type AppLocale, type RoutedLocale } from "@/i18n/routing";
import { buildRootMetadata } from "@/lib/seo";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildRootMetadata((locale as AppLocale) || "ko");
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const lang = htmlLang[(locale as RoutedLocale) ?? "ko"] ?? "ko";

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div lang={lang} className="contents">
        {children}
      </div>
    </NextIntlClientProvider>
  );
}
