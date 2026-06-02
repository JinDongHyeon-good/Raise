import Link from "next/link";
import { SERVICE_NAME } from "@/lib/brand";

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 text-slate-800 sm:px-6">
      <h1 className="font-brand-display text-3xl text-violet-950 sm:text-4xl">개인정보처리방침</h1>
      <p className="mt-4 text-sm text-slate-500">시행일: 2026-06-02</p>

      <section className="mt-8 space-y-3 leading-7">
        <h2 className="text-xl font-semibold text-violet-900">1. 수집하는 정보</h2>
        <p>
          {SERVICE_NAME}는 서비스 제공을 위해 최소한의 정보를 처리합니다. 로그인 시 Google 계정의 기본 프로필 정보(이메일,
          이름, 프로필 이미지), 서비스 이용 과정에서 사용자가 직접 입력한 질문·선택값·리딩 기록이 포함될 수 있습니다.
        </p>
      </section>

      <section className="mt-8 space-y-3 leading-7">
        <h2 className="text-xl font-semibold text-violet-900">2. 이용 목적</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>회원 식별 및 로그인 제공</li>
          <li>AI 타로 리딩 결과 생성 및 기록 관리</li>
          <li>부정 이용 방지, 서비스 품질 개선, 문의 대응</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3 leading-7">
        <h2 className="text-xl font-semibold text-violet-900">3. 보관 기간</h2>
        <p>
          법령에서 별도 보관 의무가 없는 한, 계정 탈퇴 또는 이용 목적 달성 시 지체 없이 파기합니다. 다만, 관련 법령에 따라
          일정 기간 보관이 필요한 정보는 해당 기간 동안 안전하게 보관합니다.
        </p>
      </section>

      <section className="mt-8 space-y-3 leading-7">
        <h2 className="text-xl font-semibold text-violet-900">4. 제3자 제공 및 처리 위탁</h2>
        <p>
          서비스 운영을 위해 클라우드·인증·분석 제공사 등 외부 서비스를 이용할 수 있으며, 필요한 범위에서만 정보를 처리합니다.
          법령 근거가 없는 한 이용자 동의 없이 제3자에게 판매하거나 제공하지 않습니다.
        </p>
      </section>

      <section className="mt-8 space-y-3 leading-7">
        <h2 className="text-xl font-semibold text-violet-900">5. 이용자 권리</h2>
        <p>
          이용자는 본인 정보의 열람·정정·삭제를 요청할 수 있습니다. 요청은 문의 페이지 또는 이메일을 통해 접수할 수 있으며,
          확인 후 합리적인 기간 내 처리합니다.
        </p>
      </section>

      <section className="mt-8 space-y-3 leading-7">
        <h2 className="text-xl font-semibold text-violet-900">6. 문의</h2>
        <p>
          개인정보 관련 문의: <a href="mailto:wlsehdgus23@gmail.com" className="text-violet-700 underline">wlsehdgus23@gmail.com</a>
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-3 text-sm">
        <Link href="/" className="rounded-lg border border-violet-200 px-3 py-2 hover:bg-violet-50">
          홈으로
        </Link>
        <Link href="/terms" className="rounded-lg border border-violet-200 px-3 py-2 hover:bg-violet-50">
          이용약관
        </Link>
      </div>
    </main>
  );
}
