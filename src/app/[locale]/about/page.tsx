import type { Metadata } from "next";
import Link from "next/link";
import { RaisePageShell } from "@/components/raise/raise-chrome";
import { getSeoCopy } from "@/lib/seo-i18n";
import { JsonLd } from "@/components/seo/json-ld";
import { SERVICE_VALUES } from "@/lib/brand";
import { getFaqJsonLd, HOME_SEO_INTRO } from "@/lib/seo";

export const metadata: Metadata = {
  title: "서비스 소개",
  alternates: { canonical: "/about" },
  description: HOME_SEO_INTRO.body,
};

export default function AboutPage() {
  const copy = getSeoCopy("ko");
  return (
    <RaisePageShell>
      <JsonLd data={getFaqJsonLd("ko")} />
      <main>
        <h1>{HOME_SEO_INTRO.heading}</h1>
        <p className="mt-4">{HOME_SEO_INTRO.body}</p>

        {SERVICE_VALUES.map((value) => (
          <section key={value.title}>
            <h2>{value.title}</h2>
            <p>{value.body}</p>
          </section>
        ))}

        <h2>자주 묻는 질문</h2>
        {copy.faq.map((item) => (
          <div key={item.question} className="mt-4">
            <p className="font-medium !text-[var(--rz-text)]">Q. {item.question}</p>
            <p>{item.answer}</p>
          </div>
        ))}

        <p className="mt-10">
          <Link href="/">차트 보러 가기 →</Link>
        </p>
      </main>
    </RaisePageShell>
  );
}
