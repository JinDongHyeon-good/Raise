import type { Metadata } from "next";
import Link from "next/link";
import { RaisePageShell } from "@/components/raise/raise-chrome";
import { SERVICE_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "문의",
  description: `${SERVICE_NAME} 서비스 문의 및 연락처입니다.`,
};

export default function ContactPage() {
  return (
    <RaisePageShell>
      <main>
        <h1>문의</h1>
        <p className="mt-4">
          서비스 오류, 개인정보·광고 정책 문의, 제휴 제안은 아래 연락처로 보내 주세요. 영업일 기준 1–3일 안에 회신하는 것을
          목표로 합니다.
        </p>

        <h2>운영자 연락처</h2>
        <p>{SERVICE_NAME}는 개인이 운영하는 웹 서비스입니다.</p>
        <ul>
          <li>
            Email: <a href="mailto:wlsehdgus23@gmail.com">wlsehdgus23@gmail.com</a>
          </li>
          <li>
            Phone: <a href="tel:01032301521">010-3230-1521</a>
          </li>
        </ul>

        <h2>문의 시 함께 적어 주시면 좋은 정보</h2>
        <ul>
          <li>문제가 발생한 페이지 주소(URL)와 선택한 코인·검색어</li>
          <li>사용 기기와 브라우저</li>
          <li>문제가 발생한 시각과 화면 캡처</li>
        </ul>

        <p className="mt-8">
          개인정보 처리 방식은 <Link href="/privacy">개인정보처리방침</Link>, 이용 조건은{" "}
          <Link href="/terms">이용약관</Link>에서 확인할 수 있습니다.
        </p>
      </main>
    </RaisePageShell>
  );
}
