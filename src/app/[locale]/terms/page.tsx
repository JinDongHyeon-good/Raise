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
  const t = await getTranslations({ locale, namespace: "seo.pages.terms" });
  return buildPageMetadata({
    locale,
    title: t("title"),
    description: t("description", { brand: getLocalizedBrandName(locale) }),
    path: "/terms",
  });
}

export default async function TermsPage({ params }: PageProps) {
  const locale = toRoutedLocale((await params).locale);
  setRequestLocale(locale);
  return locale === "en" ? <TermsEn /> : <TermsKo />;
}

/* 한국어 본문 */

function TermsKo() {
  return (
    <RaisePageShell>
      <main>
        <h1>이용약관</h1>
        <p className="meta">시행일: 2026-11-11</p>

        <h2>1. 목적</h2>
        <p>
          본 약관은 {SERVICE_NAME}가 제공하는 코인·미국 증시 시세·차트 열람, 관련 영상 검색·AI 요약, 커뮤니티 서비스의 이용 조건과 책임 범위를
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
          영상은 YouTube, 코인 시세는 Bybit, 미국 지수 시세는 Yahoo Finance에서 제공되며 각 콘텐츠의 권리와 책임은 해당 제공자와 게시자에게 있습니다. 영상 속
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

/* English body */

function TermsEn() {
  return (
    <RaisePageShell>
      <main>
        <h1>Terms of Service</h1>
        <p className="meta">Effective date: 2026-11-11</p>

        <h2>1. Purpose</h2>
        <p>
          These Terms set out the conditions of use and the scope of responsibility for the services provided by{" "}
          {SERVICE_NAME_EN}: viewing crypto and US stock market prices and charts, searching related videos and AI
          summaries, and the community.
        </p>

        <h2>2. Nature of the service and investment disclaimer</h2>
        <p>
          The service is an information service that collects and displays publicly available prices and videos. It does
          not provide investment recommendations or financial advice. Prices may be delayed or differ from actual trading
          prices. You are solely responsible for any investment decisions you make based on information from the service
          and for their results.
        </p>

        <h2>3. Third-party content</h2>
        <p>
          Videos are provided by YouTube, crypto prices by Bybit, and US index prices by Yahoo Finance; the rights to and
          responsibility for each piece of content belong to its respective provider and publisher. Opinions expressed in
          videos do not represent the views of {SERVICE_NAME_EN}, and the service does not guarantee the accuracy of video
          content.
        </p>

        <h2>4. Restrictions on use</h2>
        <p>
          Automated bulk requests, actions that disrupt the service, and use that violates applicable laws may be
          restricted without prior notice.
        </p>

        <h2>5. Advertising</h2>
        <p>
          Third-party advertisements may be displayed on the service, and advertisers are responsible for the content of
          their ads and any transactions with them. Matters relating to cookies and advertising are governed by our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <h2>6. Changes to and suspension of the service</h2>
        <p>
          We may change or discontinue features for operational or technical reasons, and some features may be temporarily
          unavailable due to limits or outages of external APIs.
        </p>

        <h2>7. Contact</h2>
        <p>
          For questions about these Terms, please use our <Link href="/contact">contact page</Link>.
        </p>
      </main>
    </RaisePageShell>
  );
}
