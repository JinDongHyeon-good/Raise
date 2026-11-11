import type { Metadata } from "next";
import Link from "next/link";
import { RaisePageShell } from "@/components/raise/raise-chrome";
import { SERVICE_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "이용약관",
  description: `${SERVICE_NAME} 서비스 이용약관 — 서비스 성격, 투자 면책, 외부 콘텐츠, 광고`,
};

export default function TermsPage() {
  return (
    <RaisePageShell>
      <main>
        <h1>이용약관</h1>
        <p className="meta">시행일: 2026-11-11</p>

        <h2>1. 목적</h2>
        <p>
          본 약관은 {SERVICE_NAME}가 제공하는 코인 시세·차트 열람 및 관련 영상 검색 서비스의 이용 조건과 책임 범위를
          정합니다.
        </p>

        <h2>2. 서비스의 성격과 투자 면책</h2>
        <p>
          서비스는 공개된 시세와 영상을 모아 보여주는 정보 열람 서비스이며, 투자 권유나 금융 자문을 제공하지 않습니다. 시세는
          지연되거나 실제 거래 가격과 다를 수 있습니다. 서비스의 정보를 바탕으로 한 투자 판단과 그 결과에 대한 책임은
          이용자 본인에게 있습니다.
        </p>

        <h2>3. 외부 콘텐츠</h2>
        <p>
          영상은 YouTube, 시세는 Bybit에서 제공되며 각 콘텐츠의 권리와 책임은 해당 제공자와 게시자에게 있습니다. 영상 속
          의견은 {SERVICE_NAME}의 입장이 아니며, 서비스는 영상 내용의 정확성을 보증하지 않습니다.
        </p>

        <h2>4. 이용 제한</h2>
        <p>
          자동화된 대량 요청, 서비스 장애를 유발하는 행위, 관련 법령을 위반하는 이용은 사전 통지 없이 제한될 수 있습니다.
        </p>

        <h2>5. 광고</h2>
        <p>
          서비스에는 제3자 광고가 표시될 수 있으며, 광고 내용과 거래에 대한 책임은 광고주에게 있습니다. 쿠키·광고 관련
          사항은 <Link href="/privacy">개인정보처리방침</Link>을 따릅니다.
        </p>

        <h2>6. 서비스 변경 및 중단</h2>
        <p>
          서비스는 운영상·기술상 필요에 따라 기능을 변경하거나 중단할 수 있으며, 외부 API의 한도·장애로 일부 기능이
          일시적으로 제공되지 않을 수 있습니다.
        </p>

        <h2>7. 문의</h2>
        <p>
          약관 관련 문의는 <Link href="/contact">문의 페이지</Link>를 이용해 주세요.
        </p>
      </main>
    </RaisePageShell>
  );
}
