import type { Metadata } from "next";
import { Link } from "@/navigation";
import { SitePageShell } from "@/components/site/site-page-shell";
import { SERVICE_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "이용약관",
  description: `${SERVICE_NAME} 서비스 이용약관 — 서비스 성격, 이용 제한, 면책, 광고`,
};

export default function TermsPage() {
  return (
    <SitePageShell title="이용약관">
      <main className="mx-auto w-full max-w-3xl px-4 py-10 text-slate-800 sm:px-6">
        <h1 className="font-brand-display text-3xl text-slate-900 sm:text-4xl">이용약관</h1>
        <p className="mt-4 text-sm text-slate-500">시행일: 2026-06-02 · 최종 개정일: 2026-07-24</p>

        <section className="mt-8 space-y-3 leading-7">
          <h2 className="text-xl font-semibold text-slate-800">1. 목적</h2>
          <p>
            본 약관은 {SERVICE_NAME}가 제공하는 피클볼 예약·모임 커뮤니티·대관·광고 및 관련 콘텐츠 서비스의 이용 조건,
            권리·의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section className="mt-8 space-y-3 leading-7">
          <h2 className="text-xl font-semibold text-slate-800">2. 서비스 성격 (중요)</h2>
          <p>
            본 서비스는 피클볼 코트 예약, 모임 커뮤니티, 대관, 클럽·광고 연결을 위한 플랫폼입니다. 코트·시설의 실제
            이용 조건, 요금, 안전 수칙은 각 운영자의 규정을 따르며, {SERVICE_NAME}는 시설 운영자·이용자 간 거래의
            당사자가 아닐 수 있습니다. 이용자는 예약·참가·대관 정보를 정확히 확인하고, 현장 안전에 대한 최종 책임을
            집니다.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>코트·시설의 운영 상태·가용성을 항상 보장하지 않습니다.</li>
            <li>모임 참가자 간 분쟁·부상·손실에 대해 직접 책임지지 않습니다.</li>
            <li>광고·홍보 콘텐츠의 정확성은 광고주·게시자에게 책임이 있습니다.</li>
            <li>타인의 권리를 침해하거나 혐오·폭력·불법 콘텐츠를 게시·유포해서는 안 됩니다.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3 leading-7">
          <h2 className="text-xl font-semibold text-slate-800">3. 이용 제한</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>타인의 계정을 무단 사용하거나 서비스 운영을 방해하는 행위</li>
            <li>자동화된 비정상 요청, 스팸성 접근, 보안 취약점 악용 시도</li>
            <li>관련 법령 및 공서양속에 반하는 목적의 이용</li>
            <li>타인의 권리를 침해하거나 혐오·폭력·불법 콘텐츠를 게시·유포하는 행위</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3 leading-7">
          <h2 className="text-xl font-semibold text-slate-800">4. 콘텐츠·지식재산</h2>
          <p>
            서비스에 게시된 문구, UI, 가이드, 브랜드 요소 등의 권리는 {SERVICE_NAME} 또는 정당한 권리자에게 있습니다.
            이용자는 개인적·비상업적 범위에서 서비스를 이용할 수 있으며, 무단 복제·배포·재판매를 해서는 안 됩니다. 사용자가
            업로드한 모임·대관·광고 콘텐츠의 책임은 게시자에게 있습니다.
          </p>
        </section>

        <section className="mt-8 space-y-3 leading-7">
          <h2 className="text-xl font-semibold text-slate-800">5. 광고</h2>
          <p>
            서비스는 Google AdSense 등 제3자 광고를 게재할 수 있습니다. 광고 내용·링크의 정확성·적법성에 대한 책임은 해당
            광고주에게 있으며, 이용자와 광고주 간 거래에 대해 {SERVICE_NAME}는 관련 법령이 허용하는 범위 내에서 책임을
            제한합니다. 쿠키·광고 관련 개인정보 처리는{" "}
            <Link href="/privacy" className="text-slate-700 underline">
              개인정보처리방침
            </Link>
            을 따릅니다.
          </p>
        </section>

        <section className="mt-8 space-y-3 leading-7">
          <h2 className="text-xl font-semibold text-slate-800">6. 면책</h2>
          <p>
            서비스는 운영상 필요에 따라 변경·중단될 수 있습니다. AI가 생성한 문구의 완전성·정확성·최신성을 보증하지
            않습니다. 천재지변, 외부 서비스 장애, 이용자 귀책사유로 인한 손해에 대해 회사는 관련 법령이 허용하는 범위
            내에서 책임을 제한할 수 있습니다.
          </p>
        </section>

        <section className="mt-8 space-y-3 leading-7">
          <h2 className="text-xl font-semibold text-slate-800">7. 문의</h2>
          <p>
            약관 관련 문의:{" "}
            <a href="mailto:wlsehdgus23@gmail.com" className="text-slate-700 underline">
              wlsehdgus23@gmail.com
            </a>
          </p>
          <p>
            <Link href="/contact" className="text-slate-700 underline">
              문의 페이지
            </Link>
            에서도 접수할 수 있습니다.
          </p>
        </section>
      </main>
    </SitePageShell>
  );
}
