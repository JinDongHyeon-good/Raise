import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { SitePageShell } from "@/components/site/site-page-shell";
import { getTarotGuide, TAROT_GUIDES } from "@/data/tarot-guides";
import { buildGuidePageMetadata, getGuidePageJsonLd } from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return TAROT_GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getTarotGuide(slug);
  if (!guide) return {};

  return buildGuidePageMetadata(guide);
}

export default async function GuideDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getTarotGuide(slug);
  if (!guide) notFound();

  return (
    <SitePageShell>
      <JsonLd data={getGuidePageJsonLd(guide)} />
      <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <Link href="/guides" className="text-sm text-slate-600 hover:underline">
          ← 타로 가이드 목록
        </Link>
        <h1 className="mt-4 font-brand-display text-3xl leading-tight text-slate-900 sm:text-4xl">{guide.title}</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">{guide.description}</p>

        <div className="mt-8 space-y-8">
          {guide.sections.map((section, index) => (
            <section key={`${guide.slug}-section-${index}`}>
              {section.heading ? (
                <h2 className="text-xl font-semibold text-slate-800">{section.heading}</h2>
              ) : null}
              <div className={section.heading ? "mt-3 space-y-3" : "space-y-3"}>
                {section.paragraphs.map((paragraph, pIndex) => (
                  <p key={`${guide.slug}-p-${index}-${pIndex}`} className="leading-7 text-slate-700">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50/60 p-5">
          <p className="text-sm leading-6 text-slate-800">
            가이드를 읽으셨다면 멜로타로에서 직접 AI 타로 리딩을 체험해 보세요. 로그인 후 주제를 선택하고 카드를 뽑으면
            맞춤 해석을 확인할 수 있습니다.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-500"
          >
            AI 타로 시작하기
          </Link>
        </div>
      </article>
    </SitePageShell>
  );
}
