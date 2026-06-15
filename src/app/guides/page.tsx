import Link from "next/link";
import type { Metadata } from "next";
import { SitePageShell } from "@/components/site/site-page-shell";
import { TAROT_GUIDES } from "@/data/tarot-guides";

export const metadata: Metadata = {
  title: "타로 가이드",
  description:
    "AI 타로 이용법, 스프레드 선택, 연애·직장·오늘의 운세 타로 가이드 등 멜로타로에서 제공하는 타로 리딩 참고 글 모음입니다.",
};

export default function GuidesIndexPage() {
  return (
    <SitePageShell title="타로 가이드">
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-brand-display text-3xl text-slate-900 sm:text-4xl">타로 가이드</h1>
        <p className="mt-4 leading-7 text-slate-700">
          AI 타로를 처음 이용하시거나, 연애·커리어·오늘의 운세 등 주제별로 리딩을 받기 전에 참고할 수 있는 가이드
          모음입니다. 각 글은 멜로타로 서비스 이용과 타로 해석의 기본 이해를 돕기 위해 작성되었습니다.
        </p>

        <ul className="mt-8 space-y-4">
          {TAROT_GUIDES.map((guide) => (
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
