import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import Link from "next/link";
import { RaisePageShell } from "@/components/raise/raise-chrome";
import { GOOGLE_ADSENSE_CLIENT, SERVICE_NAME } from "@/lib/brand";

export const metadata: Metadata = buildPageMetadata({
  title: "개인정보처리방침",
  description: `${SERVICE_NAME} 개인정보처리방침 — 처리 정보, 쿠키·광고(Google AdSense), YouTube 임베드, AI 요약, 이용자 권리`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <RaisePageShell>
      <main>
        <h1>개인정보처리방침</h1>
        <p className="meta">시행일: 2026-11-11 · 개정: 2026-11-11 (회원 기능·AI 요약·미국 증시 데이터 반영)</p>
        <p className="mt-4">
          {SERVICE_NAME}(이하 &quot;서비스&quot;)는 「개인정보 보호법」 등 관련 법령을 준수합니다. 본 방침은 서비스가 어떤
          정보를 왜 처리하는지, 쿠키·광고·외부 콘텐츠가 어떻게 운영되는지 안내합니다.
        </p>

        <h2>1. 처리하는 정보</h2>
        <p>
          회원가입·로그인 시 이메일 주소(Google 로그인은 Google 계정의 이메일·이름·프로필 이미지)와 닉네임을 처리합니다.
          이용 과정에서 작성한 게시글·댓글·추천, 즐겨찾기한 유튜브 채널, AI 기능 사용 기록(날짜·기능·대상 영상)이 저장됩니다.
          또한 접속 로그, IP 주소, 브라우저·기기 정보, 입력한 검색어, 조회수 집계를 위한 방문자 식별 쿠키가 생성될 수 있습니다.
        </p>

        <h2>2. 이용 목적</h2>
        <ul>
          <li>회원 식별, 로그인 유지, 커뮤니티(글·댓글·추천) 기능 제공</li>
          <li>코인·미국 증시 시세·차트, 영상 검색, 채널 즐겨찾기, AI 영상 요약 기능 제공</li>
          <li>AI 기능 하루 이용 횟수 제한, 과도한 요청 차단 등 부정 이용 방지, 오류 분석, 서비스 품질 개선</li>
          <li>서비스 내 광고 게재·측정(Google AdSense 등)</li>
        </ul>

        <h2>3. 외부 서비스</h2>
        <ul>
          <li>
            <strong>Supabase:</strong> 회원 계정·게시글·댓글·즐겨찾기·이용 기록을 저장하는 데이터베이스와 인증에 사용합니다.
          </li>
          <li>
            <strong>Google Vertex AI (Gemini):</strong> AI 영상 요약 시 공개된 유튜브 영상 주소를 보내 영상 내용을 받아쓰고
            요약합니다. 이용자의 개인정보는 보내지 않습니다.
          </li>
          <li>
            <strong>YouTube:</strong> 영상 검색에 YouTube Data API를 사용하며, 영상은 개인정보 보호 강화 모드
            (youtube-nocookie.com)로 재생됩니다. 재생 시 Google의{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              개인정보처리방침
            </a>
            이 적용됩니다.
          </li>
          <li>
            <strong>Bybit · Yahoo Finance:</strong> 코인 시세는 Bybit 공개 API, 미국 지수 시세는 Yahoo Finance에서 서버를
            통해 가져오며, 이용자 정보는 전달하지 않습니다.
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
