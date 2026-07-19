import type { Metadata } from "next";
import { Link } from "@/navigation";
import { SitePageShell } from "@/components/site/site-page-shell";
import { GOOGLE_ADSENSE_CLIENT, SERVICE_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: `${SERVICE_NAME} 개인정보처리방침 — 수집 항목, 이용 목적, 쿠키·광고(Google AdSense), 이용자 권리`,
};

export default function PrivacyPage() {
  return (
    <SitePageShell title="개인정보처리방침">
      <main className="mx-auto w-full max-w-3xl px-4 py-10 text-slate-800 sm:px-6">
        <h1 className="font-brand-display text-3xl text-slate-900 sm:text-4xl">개인정보처리방침</h1>
        <p className="mt-4 text-sm text-slate-500">시행일: 2026-06-02 · 최종 개정일: 2026-07-19</p>
        <p className="mt-4 leading-7 text-slate-700">
          {SERVICE_NAME}(이하 &quot;서비스&quot;)는 이용자의 개인정보를 중요하게 여기며, 「개인정보 보호법」 등 관련 법령을 준수합니다.
          본 방침은 서비스가 어떤 정보를 왜 처리하는지, 광고·쿠키는 어떻게 운영되는지, 이용자가 어떤 권리를 갖는지 안내합니다.
        </p>

        <section className="mt-8 space-y-3 leading-7">
          <h2 className="text-xl font-semibold text-slate-800">1. 수집하는 정보</h2>
          <p>
            서비스는 제공에 필요한 최소한의 정보를 처리합니다. 로그인 시 이메일 계정 또는 Google 계정의 기본 프로필
            정보(이메일, 이름, 프로필 이미지), 서비스 이용 과정에서 사용자가 직접 입력한 질문·선택값·리딩 기록이 포함될 수
            있습니다. 또한 서비스 안정성과 품질 개선을 위해 접속 로그, 기기·브라우저 정보, IP 주소, 쿠키 식별자 등 자동
            수집 정보가 생성될 수 있습니다.
          </p>
        </section>

        <section className="mt-8 space-y-3 leading-7">
          <h2 className="text-xl font-semibold text-slate-800">2. 이용 목적</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>회원 식별 및 로그인 제공</li>
            <li>AI 타로 리딩 결과 생성 및 기록 관리</li>
            <li>부정 이용 방지, 서비스 품질 개선, 문의 대응</li>
            <li>법령 준수 및 분쟁 대응</li>
            <li>서비스 내 광고 게재·측정(Google AdSense 등) 및 관련 통계 분석</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3 leading-7">
          <h2 className="text-xl font-semibold text-slate-800">3. 쿠키 및 유사 기술</h2>
          <p>
            서비스는 로그인 유지, 선호 설정 저장, 트래픽·이용 행태 파악, 광고 게재 및 성과 측정을 위해 쿠키와 유사한
            기술(로컬 스토리지 등)을 사용할 수 있습니다. 브라우저 설정에서 쿠키를 거부하거나 삭제할 수 있으나, 일부 기능이
            제한될 수 있습니다.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>필수 쿠키:</strong> 인증·보안·기본 기능 동작에 필요
            </li>
            <li>
              <strong>기능·분석 쿠키:</strong> 이용 통계, 오류 분석, UX 개선
            </li>
            <li>
              <strong>광고 쿠키:</strong> Google 등 광고 파트너가 관심사 기반 광고 제공·빈도 제한·성과 측정에 사용
            </li>
          </ul>
        </section>

        <section className="mt-8 space-y-3 leading-7">
          <h2 className="text-xl font-semibold text-slate-800">4. 광고 및 Google AdSense</h2>
          <p>
            서비스는 Google AdSense를 포함한 제3자 광고 서비스를 이용할 수 있습니다. Google을 포함한 제3자 공급업체는
            쿠키를 사용해 이용자의 이전 방문과 다른 웹사이트 방문 기록을 바탕으로 광고를 게재할 수 있습니다. AdSense
            게시자 ID는 {GOOGLE_ADSENSE_CLIENT}입니다.
          </p>
          <p>
            Google의 광고 쿠키 사용 방식과 맞춤 광고 설정은{" "}
            <a
              href="https://policies.google.com/technologies/ads"
              className="text-slate-700 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google 광고 및 개인정보 보호
            </a>
            ,{" "}
            <a
              href="https://adssettings.google.com/"
              className="text-slate-700 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google 광고 설정
            </a>
            에서 확인할 수 있습니다. 이용자는 해당 페이지에서 맞춤 광고를 제한하거나 옵트아웃할 수 있습니다.
          </p>
          <p>
            유럽경제지역(EEA)·영국 등 관련 법역의 이용자에게는 적용 가능한 동의·선택 UI가 제공될 수 있으며, 동의하지 않은
            경우 비맞춤형 광고가 표시될 수 있습니다.
          </p>
        </section>

        <section className="mt-8 space-y-3 leading-7">
          <h2 className="text-xl font-semibold text-slate-800">5. 보관 기간</h2>
          <p>
            법령에서 별도 보관 의무가 없는 한, 계정 탈퇴 또는 이용 목적 달성 시 지체 없이 파기합니다. 다만, 관련 법령에 따라
            일정 기간 보관이 필요한 정보는 해당 기간 동안 안전하게 보관합니다. 광고·분석 쿠키의 유효기간은 각 제공사의
            정책에 따릅니다.
          </p>
        </section>

        <section className="mt-8 space-y-3 leading-7">
          <h2 className="text-xl font-semibold text-slate-800">6. 제3자 제공 및 처리 위탁</h2>
          <p>
            서비스 운영을 위해 클라우드·인증·AI·분석·광고 제공사 등 외부 서비스를 이용할 수 있으며, 필요한 범위에서만 정보를
            처리합니다. 법령 근거가 없는 한 이용자 동의 없이 제3자에게 판매하거나 제공하지 않습니다. Google AdSense 등
            광고 파트너는 자체 개인정보처리방침에 따라 쿠키·기기 식별자 등을 처리할 수 있습니다.
          </p>
        </section>

        <section className="mt-8 space-y-3 leading-7">
          <h2 className="text-xl font-semibold text-slate-800">7. 이용자 권리</h2>
          <p>
            이용자는 본인 정보의 열람·정정·삭제를 요청할 수 있습니다. 요청은{" "}
            <Link href="/contact" className="text-slate-700 underline">
              문의 페이지
            </Link>
            또는 이메일을 통해 접수할 수 있으며, 확인 후 합리적인 기간 내 처리합니다. 맞춤 광고 관련 선택은 위 Google
            광고 설정에서도 변경할 수 있습니다.
          </p>
        </section>

        <section className="mt-8 space-y-3 leading-7">
          <h2 className="text-xl font-semibold text-slate-800">8. 아동의 개인정보</h2>
          <p>
            서비스는 만 14세 미만 아동을 주 대상으로 하지 않으며, 고의로 아동의 개인정보를 수집하지 않습니다. 관련 정보가
            수집된 사실을 인지하면 지체 없이 삭제 등 필요한 조치를 취합니다.
          </p>
        </section>

        <section className="mt-8 space-y-3 leading-7">
          <h2 className="text-xl font-semibold text-slate-800">9. 방침 변경</h2>
          <p>
            본 방침은 법령·서비스 변경에 따라 수정될 수 있습니다. 중요한 변경이 있을 경우 서비스 내 공지 또는 본 페이지의
            개정일을 통해 안내합니다.
          </p>
        </section>

        <section className="mt-8 space-y-3 leading-7">
          <h2 className="text-xl font-semibold text-slate-800">10. 문의</h2>
          <p>
            개인정보 관련 문의:{" "}
            <a href="mailto:wlsehdgus23@gmail.com" className="text-slate-700 underline">
              wlsehdgus23@gmail.com
            </a>
          </p>
          <p>
            운영자 연락처·서비스 소개는{" "}
            <Link href="/about" className="text-slate-700 underline">
              소개
            </Link>
            ·
            <Link href="/contact" className="text-slate-700 underline">
              문의
            </Link>{" "}
            페이지에서도 확인할 수 있습니다.
          </p>
        </section>
      </main>
    </SitePageShell>
  );
}
