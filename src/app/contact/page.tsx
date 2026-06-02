import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 text-slate-800 sm:px-6">
      <h1 className="font-brand-display text-3xl text-violet-950 sm:text-4xl">문의</h1>
      <p className="mt-4 leading-7">
        서비스 오류, 계정 문제, 제휴 제안, 정책 문의는 아래 연락처(이메일 또는 전화)로 연락해 주세요. 접수된 문의는 영업일
        기준 순차적으로 확인합니다.
      </p>

      <section className="mt-8 rounded-xl border border-violet-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-violet-900">연락처</h2>
        <p className="mt-3 text-sm text-slate-600">Email</p>
        <a className="text-base font-medium text-violet-700 underline" href="mailto:wlsehdgus23@gmail.com">
          wlsehdgus23@gmail.com
        </a>
        <p className="mt-4 text-sm text-slate-600">Phone</p>
        <a className="text-base font-medium text-violet-700 underline" href="tel:01032301521">
          010-3230-1521
        </a>
      </section>

      <section className="mt-8 space-y-2 leading-7">
        <h2 className="text-lg font-semibold text-violet-900">문의 시 포함하면 좋은 정보</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>문제가 발생한 페이지 주소(URL)</li>
          <li>발생 시간과 사용한 브라우저</li>
          <li>오류 메시지 또는 화면 캡처</li>
        </ul>
      </section>

      <div className="mt-10 flex flex-wrap gap-3 text-sm">
        <Link href="/" className="rounded-lg border border-violet-200 px-3 py-2 hover:bg-violet-50">
          홈으로
        </Link>
        <Link href="/about" className="rounded-lg border border-violet-200 px-3 py-2 hover:bg-violet-50">
          서비스 소개
        </Link>
      </div>
    </main>
  );
}
