import type { Metadata } from "next";
import Link from "next/link";
import { RaisePageShell } from "@/components/raise/raise-chrome";
import { GOOGLE_ADSENSE_CLIENT, SERVICE_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: `${SERVICE_NAME} 개인정보처리방침 — 처리 정보, 쿠키·광고(Google AdSense), YouTube 임베드, 이용자 권리`,
};

export default function PrivacyPage() {
  return (
    <RaisePageShell>
      <main>
        <h1>개인정보처리방침</h1>
        <p className="meta">시행일: 2026-11-11</p>
        <p className="mt-4">
          {SERVICE_NAME}(이하 &quot;서비스&quot;)는 「개인정보 보호법」 등 관련 법령을 준수합니다. 본 방침은 서비스가 어떤
          정보를 왜 처리하는지, 쿠키·광고·외부 콘텐츠가 어떻게 운영되는지 안내합니다.
        </p>

        <h2>1. 처리하는 정보</h2>
        <p>
          서비스는 회원가입·로그인 기능이 없으며 이름, 이메일 등 이용자를 직접 식별하는 정보를 수집하지 않습니다. 다만 서비스
          운영 과정에서 접속 로그, IP 주소, 브라우저·기기 정보, 입력한 검색어가 서버 로그에 일시적으로 남을 수 있습니다.
        </p>

        <h2>2. 이용 목적</h2>
        <ul>
          <li>코인 시세·차트 및 영상 검색 기능 제공</li>
          <li>과도한 요청 차단 등 부정 이용 방지, 오류 분석, 서비스 품질 개선</li>
          <li>서비스 내 광고 게재·측정(Google AdSense 등)</li>
        </ul>

        <h2>3. 외부 서비스</h2>
        <ul>
          <li>
            <strong>YouTube:</strong> 영상 검색에 YouTube Data API를 사용하며, 영상은 개인정보 보호 강화 모드
            (youtube-nocookie.com)로 재생됩니다. 재생 시 Google의{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              개인정보처리방침
            </a>
            이 적용됩니다.
          </li>
          <li>
            <strong>Bybit:</strong> 코인 시세는 Bybit 공개 API에서 서버를 통해 가져오며, 이용자 정보는 전달하지 않습니다.
          </li>
        </ul>

        <h2>4. 쿠키 및 광고</h2>
        <p>
          서비스는 Google AdSense 등 제3자 광고를 게재할 수 있으며(게시자 ID {GOOGLE_ADSENSE_CLIENT}), Google을 포함한
          광고 공급업체는 쿠키를 사용해 이용자의 이전 방문 기록을 바탕으로 광고를 게재할 수 있습니다. 맞춤 광고는{" "}
          <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">
            Google 광고 설정
          </a>
          에서 제한할 수 있고, 자세한 내용은{" "}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
            Google 광고 및 개인정보 보호
          </a>
          에서 확인할 수 있습니다. 브라우저 설정에서 쿠키를 거부할 수 있으나 일부 기능이 제한될 수 있습니다.
        </p>

        <h2>5. 보관 기간</h2>
        <p>
          서버 로그는 운영·보안 목적 달성 후 지체 없이 파기합니다. 광고·분석 쿠키의 유효기간은 각 제공사의 정책을 따릅니다.
        </p>

        <h2>6. 이용자 권리</h2>
        <p>
          개인정보 관련 열람·삭제 요청과 문의는 <Link href="/contact">문의 페이지</Link> 또는{" "}
          <a href="mailto:wlsehdgus23@gmail.com">wlsehdgus23@gmail.com</a>으로 접수할 수 있습니다.
        </p>

        <h2>7. 아동의 개인정보</h2>
        <p>서비스는 만 14세 미만 아동을 대상으로 하지 않으며, 고의로 아동의 개인정보를 처리하지 않습니다.</p>

        <h2>8. 방침 변경</h2>
        <p>본 방침은 법령·서비스 변경에 따라 수정될 수 있으며, 변경 시 본 페이지의 시행일을 갱신합니다.</p>
      </main>
    </RaisePageShell>
  );
}
