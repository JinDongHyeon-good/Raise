import Link from "next/link";
import { SERVICE_NAME } from "@/lib/brand";

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 text-slate-800 sm:px-6">
      <h1 className="font-brand-display text-3xl text-violet-950 sm:text-4xl">서비스 소개</h1>
      <p className="mt-4 leading-7">
        {SERVICE_NAME}는 사용자가 선택한 주제와 뽑은 카드를 바탕으로 AI가 리딩 문장을 생성해 주는 온라인 타로 서비스입니다.
        연애, 커리어, 재물, 오늘의 흐름 등 다양한 상황에서 현재 마음을 정리하고 관점을 넓히는 데 도움을 주는 것을 목표로
        합니다.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold text-violet-900">이용 방법</h2>
        <ol className="list-decimal space-y-2 pl-5 leading-7">
          <li>리딩 영역을 선택합니다.</li>
          <li>질문을 입력합니다(선택).</li>
          <li>스프레드를 선택하고 카드를 뽑습니다.</li>
          <li>AI 리딩 결과를 확인하고 복사할 수 있습니다.</li>
        </ol>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold text-violet-900">중요 안내</h2>
        <p className="leading-7">
          본 서비스의 결과는 일반적인 정보 제공 목적이며, 개인의 중요한 의사결정에 대한 전문 자문을 대체하지 않습니다.
          건강, 법률, 투자와 같은 고위험 판단은 반드시 관련 전문가와 상담해 주세요.
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-3 text-sm">
        <Link href="/" className="rounded-lg border border-violet-200 px-3 py-2 hover:bg-violet-50">
          홈으로
        </Link>
        <Link href="/privacy" className="rounded-lg border border-violet-200 px-3 py-2 hover:bg-violet-50">
          개인정보처리방침
        </Link>
        <Link href="/terms" className="rounded-lg border border-violet-200 px-3 py-2 hover:bg-violet-50">
          이용약관
        </Link>
      </div>
    </main>
  );
}
