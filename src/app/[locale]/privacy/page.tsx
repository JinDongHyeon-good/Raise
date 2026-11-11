import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { toRoutedLocale } from "@/lib/seo-i18n";
import { Link } from "@/navigation";
import { RaisePageShell } from "@/components/raise/raise-chrome";
import { GOOGLE_ADSENSE_CLIENT, SERVICE_NAME, SERVICE_NAME_EN, getLocalizedBrandName } from "@/lib/brand";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = toRoutedLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "seo.pages.privacy" });
  return buildPageMetadata({
    locale,
    title: t("title"),
    description: t("description", { brand: getLocalizedBrandName(locale) }),
    path: "/privacy",
  });
}

export default async function PrivacyPage({ params }: PageProps) {
  const locale = toRoutedLocale((await params).locale);
  setRequestLocale(locale);
  return locale === "en" ? <PrivacyEn /> : <PrivacyKo />;
}

/* 한국어 본문 */

function PrivacyKo() {
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

/* English body */

function PrivacyEn() {
  return (
    <RaisePageShell>
      <main>
        <h1>Privacy Policy</h1>
        <p className="meta">
          Effective date: 2026-11-11 · Last updated: 2026-11-11 (added member features, AI summaries and US stock market
          data)
        </p>
        <p className="mt-4">
          {SERVICE_NAME_EN} (the &quot;Service&quot;) complies with the Personal Information Protection Act of the Republic
          of Korea and other applicable laws. This policy explains what information the Service processes and why, and how
          cookies, advertising and third-party content are handled.
        </p>

        <h2>1. Information we process</h2>
        <p>
          When you sign up or sign in, we process your email address (for Google sign-in, the email, name and profile
          image of your Google account) and your nickname. Posts, comments and upvotes you create, YouTube channels you
          add to favorites, and records of your use of AI features (date, feature and target video) are stored as you use
          the Service. Access logs, IP addresses, browser and device information, search terms you enter, and a visitor
          identification cookie used to count views may also be generated.
        </p>

        <h2>2. Purposes of use</h2>
        <ul>
          <li>Identifying members, keeping you signed in, and providing community features (posts, comments, upvotes)</li>
          <li>
            Providing crypto and US stock market prices and charts, video search, channel favorites, and AI video summaries
          </li>
          <li>
            Preventing abuse, such as daily usage limits for AI features and blocking excessive requests; analyzing errors;
            and improving service quality
          </li>
          <li>Displaying and measuring advertisements within the Service (Google AdSense, etc.)</li>
        </ul>

        <h2>3. Third-party services</h2>
        <ul>
          <li>
            <strong>Supabase:</strong> Used for authentication and as the database that stores member accounts, posts,
            comments, favorites and usage records.
          </li>
          <li>
            <strong>Google Vertex AI (Gemini):</strong> For AI video summaries, we send the URL of a public YouTube video
            so its content can be transcribed and summarized. No personal information about you is sent.
          </li>
          <li>
            <strong>YouTube:</strong> We use the YouTube Data API for video search, and videos are played in
            privacy-enhanced mode (youtube-nocookie.com). When you play a video, Google&apos;s{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>{" "}
            applies.
          </li>
          <li>
            <strong>Bybit · Yahoo Finance:</strong> Crypto prices are fetched from Bybit&apos;s public API and US index
            prices from Yahoo Finance through our server; no user information is passed to them.
          </li>
        </ul>

        <h2>4. Cookies and advertising</h2>
        <p>
          The Service may display third-party advertisements such as Google AdSense (publisher ID {GOOGLE_ADSENSE_CLIENT}
          ), and advertising vendors, including Google, may use cookies to serve ads based on your previous visits. You can
          limit personalized ads in{" "}
          <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">
            Google Ad Settings
          </a>
          , and you can learn more at{" "}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
            Google Advertising &amp; Privacy
          </a>
          . You can refuse cookies in your browser settings, but some features may be limited.
        </p>

        <h2>5. Retention period</h2>
        <p>
          Server logs are destroyed without delay once their operational and security purposes have been fulfilled. The
          lifetime of advertising and analytics cookies follows each provider&apos;s policy.
        </p>

        <h2>6. Your rights</h2>
        <p>
          You can submit requests to access or delete your personal information, and other privacy questions, through our{" "}
          <Link href="/contact">contact page</Link> or by emailing{" "}
          <a href="mailto:wlsehdgus23@gmail.com">wlsehdgus23@gmail.com</a>.
        </p>

        <h2>7. Children&apos;s information</h2>
        <p>
          The Service is not directed at children under 14, and we do not knowingly process personal information of
          children.
        </p>

        <h2>8. Changes to this policy</h2>
        <p>
          This policy may be revised as laws or the Service change; when it is, we will update the effective date on this
          page.
        </p>
      </main>
    </RaisePageShell>
  );
}
