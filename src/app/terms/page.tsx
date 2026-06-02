import Link from "next/link";
import { SERVICE_NAME } from "@/lib/brand";

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 text-slate-800 sm:px-6">
      <h1 className="font-brand-display text-3xl text-violet-950 sm:text-4xl">이용약관</h1>
      <p className="mt-4 text-sm text-slate-500">시행일: 2026-06-02</p>

      <section className="mt-8 space-y-3 leading-7">
        <h2 className="text-xl font-semibold text-violet-900">1. 목적</h2>
        <p>
          본 약관은 {SERVICE_NAME}가 제공하는 AI 타로 서비스의 이용 조건, 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>
      </section>

      <section className="mt-8 space-y-3 leading-7">
        <h2 className="text-xl font-semibold text-violet-900">2. 서비스 성격</h2>
        <p>
          본 서비스의 리딩 결과는 오락·참고 목적의 정보이며, 사실 보장 또는 전문 자문을 의미하지 않습니다. 이용자는 결과를
          독립적으로 해석하고 최종 판단에 대한 책임을 집니다.
        </p>
      </section>

      <section className="mt-8 space-y-3 leading-7">
        <h2 className="text-xl font-semibold text-violet-900">3. 이용 제한</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>타인의 계정을 무단 사용하거나 서비스 운영을 방해하는 행위</li>
          <li>자동화된 비정상 요청, 스팸성 접근, 보안 취약점 악용 시도</li>
          <li>관련 법령 및 공서양속에 반하는 목적의 이용</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3 leading-7">
        <h2 className="text-xl font-semibold text-violet-900">4. 면책</h2>
        <p>
          서비스는 운영상 필요에 따라 변경·중단될 수 있습니다. 천재지변, 외부 서비스 장애, 이용자 귀책사유로 인한 손해에 대해
          회사는 관련 법령이 허용하는 범위 내에서 책임을 제한할 수 있습니다.
        </p>
      </section>

      <section className="mt-8 space-y-3 leading-7">
        <h2 className="text-xl font-semibold text-violet-900">5. 문의</h2>
        <p>
          약관 관련 문의: <a href="mailto:jindonghyeon.good@gmail.com" className="text-violet-700 underline">jindonghyeon.good@gmail.com</a>
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-3 text-sm">
        <Link href="/" className="rounded-lg border border-violet-200 px-3 py-2 hover:bg-violet-50">
          홈으로
        </Link>
        <Link href="/privacy" className="rounded-lg border border-violet-200 px-3 py-2 hover:bg-violet-50">
          개인정보처리방침
        </Link>
      </div>
    </main>
  );
}
