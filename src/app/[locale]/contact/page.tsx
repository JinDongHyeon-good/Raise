import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { toRoutedLocale } from "@/lib/seo-i18n";
import { Link } from "@/navigation";
import { RaisePageShell } from "@/components/raise/raise-chrome";
import { SERVICE_NAME, SERVICE_NAME_EN, getLocalizedBrandName } from "@/lib/brand";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = toRoutedLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "seo.pages.contact" });
  return buildPageMetadata({
    locale,
    title: t("title"),
    description: t("description", { brand: getLocalizedBrandName(locale) }),
    path: "/contact",
  });
}

export default async function ContactPage({ params }: PageProps) {
  const locale = toRoutedLocale((await params).locale);
  setRequestLocale(locale);
  return locale === "en" ? <ContactEn /> : <ContactKo />;
}

/* 한국어 본문 */

function ContactKo() {
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

        <h2>제휴문의</h2>
        <p>
          광고·콘텐츠·거래소 레퍼럴·미디어 제휴 등 협업 제안은 제휴문의로 보내 주세요. 메일 제목에{" "}
          <b>[제휴문의]</b>를 넣어 주시면 더 빠르게 확인합니다.
        </p>
        <ul>
          <li>
            제휴문의 Email:{" "}
            <a href="mailto:wlsehdgus23@gmail.com?subject=%5B%EC%A0%9C%ED%9C%B4%EB%AC%B8%EC%9D%98%5D%20%EC%A7%84%EB%8F%99%EC%BD%94%EC%9D%B8">
              wlsehdgus23@gmail.com
            </a>
          </li>
          <li>
            Bybit 레퍼럴 안내: <Link href="/bybit">Bybit 가입 · 레퍼럴 페이지</Link>
          </li>
        </ul>
        <p>제휴문의 시 회사/서비스명, 제안 내용, 연락 가능한 담당자 정보를 함께 적어 주세요.</p>

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

/* English body */

function ContactEn() {
  return (
    <RaisePageShell>
      <main>
        <h1>Contact</h1>
        <p className="mt-4">
          Please send bug reports, questions about our privacy or advertising policies, and partnership proposals to the
          contact details below. We aim to reply within 1–3 business days.
        </p>

        <h2>Operator contact</h2>
        <p>{SERVICE_NAME_EN} is a web service run by an individual.</p>
        <ul>
          <li>
            Email: <a href="mailto:wlsehdgus23@gmail.com">wlsehdgus23@gmail.com</a>
          </li>
          <li>
            Phone: <a href="tel:+821032301521">+82 10-3230-1521</a>
          </li>
        </ul>

        <h2>Partnership inquiries</h2>
        <p>
          For ads, content, exchange referral, or media partnerships, please email us with{" "}
          <b>[Partnership]</b> in the subject line so we can prioritize your message.
        </p>
        <ul>
          <li>
            Partnership email:{" "}
            <a href="mailto:wlsehdgus23@gmail.com?subject=%5BPartnership%5D%20jjintu">
              wlsehdgus23@gmail.com
            </a>
          </li>
          <li>
            Bybit referral info: <Link href="/bybit">Bybit signup · referral page</Link>
          </li>
        </ul>
        <p>Please include your company/product name, proposal details, and a contact person.</p>

        <h2>Helpful details to include</h2>
        <ul>
          <li>The URL of the page where the problem occurred, and the coin or search term you selected</li>
          <li>Your device and browser</li>
          <li>When the problem occurred, and a screenshot</li>
        </ul>

        <p className="mt-8">
          See our <Link href="/privacy">Privacy Policy</Link> for how we handle personal information and our{" "}
          <Link href="/terms">Terms of Service</Link> for the conditions of use.
        </p>
      </main>
    </RaisePageShell>
  );
}
