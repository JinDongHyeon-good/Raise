import type { Metadata } from "next";
import { Link } from "@/navigation";
import { SitePageShell } from "@/components/site/site-page-shell";
import { SERVICE_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "문의",
  description: `${SERVICE_NAME} 피클볼 예약·모임·대관 서비스 문의 및 고객 지원 연락처입니다.`,
};

export default function ContactPage() {
  return (
    <SitePageShell title="문의">
      <main className="mx-auto w-full max-w-3xl px-4 py-10 text-slate-800 sm:px-6">
        <h1 className="font-brand-display text-3xl text-slate-900 sm:text-4xl">문의</h1>
        <p className="mt-4 leading-7">
          서비스 오류, 계정 문제, 개인정보·광고 정책 문의, 제휴 제안은 아래 연락처(이메일 또는 전화)로 연락해 주세요.
          접수된 문의는 영업일 기준 순차적으로 확인하며, 통상 1–3영업일 내 회신을 목표로 합니다.
        </p>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-800">운영자 연락처</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {SERVICE_NAME}는 개인 운영 웹 서비스입니다. 문의 시 서비스명과 문제 상황을 함께 적어 주시면 더 빠르게 도와드릴
            수 있습니다.
          </p>
          <p className="mt-4 text-sm text-slate-600">Email</p>
          <a className="text-base font-medium text-slate-700 underline" href="mailto:wlsehdgus23@gmail.com">
            wlsehdgus23@gmail.com
          </a>
          <p className="mt-4 text-sm text-slate-600">Phone</p>
          <a className="text-base font-medium text-slate-700 underline" href="tel:01032301521">
            010-3230-1521
          </a>
        </section>

        <section className="mt-8 space-y-2 leading-7">
          <h2 className="text-lg font-semibold text-slate-800">문의 시 포함하면 좋은 정보</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>문제가 발생한 페이지 주소(URL)</li>
            <li>발생 시간과 사용한 브라우저·기기</li>
            <li>오류 메시지 또는 화면 캡처</li>
            <li>개인정보·광고 관련 문의인 경우 요청 내용(열람·삭제·옵트아웃 등)</li>
          </ul>
        </section>

        <section className="mt-8 space-y-2 leading-7">
          <h2 className="text-lg font-semibold text-slate-800">관련 정책</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <Link href="/privacy" className="text-slate-700 underline">
                개인정보처리방침
              </Link>
              — 수집 항목, 쿠키·AdSense, 이용자 권리
            </li>
            <li>
              <Link href="/terms" className="text-slate-700 underline">
                이용약관
              </Link>
              — 서비스 성격(오락·참고), 면책
            </li>
            <li>
              <Link href="/about" className="text-slate-700 underline">
                서비스 소개
              </Link>
              — 이용 방법과 FAQ
            </li>
          </ul>
        </section>

        <div className="mt-10 flex flex-wrap gap-3 text-sm">
          <Link href="/" className="rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
            홈으로
          </Link>
          <Link href="/about" className="rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
            서비스 소개
          </Link>
        </div>
      </main>
    </SitePageShell>
  );
}
