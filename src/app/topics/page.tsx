import Link from "next/link";
import type { Metadata } from "next";
import { SitePageShell } from "@/components/site/site-page-shell";
import { TAROT_TOPIC_PAGES } from "@/data/tarot-topic-pages";

export const metadata: Metadata = {
  title: "AI 타로 주제별 운세",
  description:
    "오늘의 운세, 오늘의 타로, 연애 타로, 재물 운세 등 멜로타로 AI 타로 주제별 페이지입니다. 궁금한 주제를 선택해 무료 타로 리딩을 시작하세요.",
  alternates: { canonical: "/topics" },
};

export default function TopicsIndexPage() {
  return (
    <SitePageShell title="AI 타로 주제별 운세">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <p className="text-sm leading-7 text-slate-600 sm:text-base">
          검색하시는 주제에 맞는 AI 타로 페이지입니다. 원하는 주제를 선택하면 해당 테마로 바로 타로를 시작할 수
          있습니다.
        </p>
        <ul className="mt-6 space-y-3">
          {TAROT_TOPIC_PAGES.map((page) => (
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
