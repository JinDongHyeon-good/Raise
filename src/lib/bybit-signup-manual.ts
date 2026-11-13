import type { BybitGuideSlug } from "@/lib/bybit-guides";
import { BYBIT_REFERRAL } from "@/lib/bybit-referral";

export type ManualStep = {
  id: string;
  title: string;
  summary: string;
  details: string[];
  tip?: string;
  /** 이 단계를 더 자세히 다루는 세부 가이드 (/bybit/<slug>) */
  guide?: BybitGuideSlug;
};

/** Bybit 공식 가입 가이드 기준 정리 (화면은 지역·시점에 따라 다를 수 있음) */
export const BYBIT_SIGNUP_PREP = [
  "공식 도메인(bybit.com)인지 확인하세요. 가짜 사이트·피싱 링크를 주의하세요.",
  "계속 사용할 이메일(권장) 또는 휴대폰 번호를 준비하세요.",
  "실제 거주 국가를 선택하세요. 서비스 제한 국가면 가입이 막힐 수 있습니다.",
  `추천인(레퍼럴) 코드 ${BYBIT_REFERRAL.code}는 계정 생성 전에 입력·확인하세요.`,
  "KYC용 본인 명의 신분증 실물을 준비하세요. Bybit는 실물 신분증 촬영만 받으며 스캔본·사본·캡처본은 받지 않습니다.",
] as const;

export const BYBIT_SIGNUP_STEPS: ManualStep[] = [
  {
    id: "open-link",
    title: "1. 레퍼럴 링크로 가입 페이지 열기",
    summary: "찐투 Bybit 가입 버튼으로 공식 초대 링크를 엽니다.",
    details: [
      `아래 CTA 또는 초대코드 ${BYBIT_REFERRAL.code}가 포함된 링크로 Bybit 가입 화면에 접속합니다.`,
      "웹에서 Sign Up / 가입을 눌러 회원가입 화면으로 이동합니다.",
      "앱으로 이어질 경우에도, 계정 생성 전에 Referral Code(추천인 코드) 칸을 다시 확인하세요.",
    ],
    tip: "링크로 들어오면 코드가 자동 입력되는 경우가 많습니다. 비어 있으면 직접 XQZZ6O를 입력하세요.",
  },
  {
    id: "country-method",
    title: "2. 거주 국가 · 가입 방식 선택",
    summary: "거주 국가를 고르고 이메일·휴대폰·소셜 로그인 중 하나를 선택합니다.",
    details: [
      "거주 국가는 실제와 같아야 합니다. 제한 지역이면 경고가 뜨고 가입이 불가할 수 있습니다.",
      "가입 방식: 이메일(권장), 휴대폰, Google / Apple / Telegram 등.",
      "출금 시 이메일·Google Authenticator가 필요한 경우가 많아 이메일 가입을 권장합니다.",
      "이메일·휴대폰은 한 계정에만 연결됩니다. 반각(영문/숫자)으로 입력하세요.",
    ],
  },
  {
    id: "referral-code",
    title: "3. 추천인 코드 확인 후 가입 제출",
    summary: "Sign Up Now / Create Account 누르기 전에 코드를 확인합니다.",
    details: [
      `Referral Code(optional) 칸에 ${BYBIT_REFERRAL.code}가 보이는지 확인합니다.`,
      "비어 있으면 직접 입력한 뒤, 이용약관·개인정보 처리방침에 동의합니다.",
      "캡차(퍼즐) 등을 통과하고 가입을 제출합니다.",
      "공식 안내상 계정 생성 후에는 일반 추천 코드를 추가·변경·삭제할 수 없습니다.",
    ],
    tip: "가입 완료 전에 코드를 꼭 확인하세요. 가장 흔한 실수입니다.",
  },
  {
    id: "verify-password",
    title: "4. 인증 코드 · 비밀번호 설정",
    summary: "이메일/SMS 인증 후 비밀번호를 만듭니다.",
    details: [
      "이메일 또는 휴대폰으로 온 인증 코드를 입력합니다. (스팸함도 확인)",
      "화면에 표시되는 비밀번호 조건(길이, 대문자·소문자·숫자 조합 등)에 맞게 만듭니다.",
      "다른 사이트와 다른 비밀번호를 쓰고, 비밀번호 관리자를 활용하세요.",
    ],
  },
  {
    id: "kyc",
    guide: "kyc",
    title: "5. KYC(본인 인증) 진행",
    summary: "입금·거래·출금을 위해 신원 인증을 완료합니다.",
    details: [
      "대시보드의 Get Verified / 신원 인증에서 진행합니다.",
      "정부 발급 신분증 촬영 + 얼굴(셀피) 인증이 일반적입니다.",
      "이름·생년월일 등 입력값이 신분증과 일치해야 합니다.",
      "인증은 Standard / Advanced (지역에 따라 Pro) 단계로 나뉘며, Bybit의 모든 상품·서비스를 쓰려면 최소 Standard 인증이 필요합니다.",
      "심사는 보통 약 15분 걸리며, 경우에 따라 최대 48시간까지 걸릴 수 있습니다.",
    ],
    tip: "빛 반사·흐림 없이 신분증 네 모서리가 나오게 촬영하세요.",
  },
  {
    id: "security",
    guide: "app",
    title: "6. 보안 설정 (2FA · 출금 보호)",
    summary: "Google Authenticator 등 2단계 인증을 켜 둡니다.",
    details: [
      "이메일 인증과 Google Authenticator(OTP)를 연결하세요.",
      "자금 비밀번호, 피싱 방지 코드, 출금 주소 화이트리스트 등을 설정하세요.",
      "OTP 복구 키는 오프라인에 안전하게 보관하세요. 타인에게 절대 공유하지 마세요.",
    ],
  },
  {
    id: "deposit",
    guide: "deposit",
    title: "7. (선택) 첫 입금은 소액 테스트",
    summary: "네트워크·메모(태그)를 맞춘 뒤 소액으로 먼저 확인합니다.",
    details: [
      "입금 코인과 네트워크(체인)가 출금 지갑과 동일한지 확인합니다.",
      "XRP, EOS, TON 등은 메모/태그가 필요할 수 있습니다. 누락 시 자산을 잃을 수 있습니다.",
      "처음에는 소액으로 입금해 반영을 확인한 뒤 본 금액을 옮기세요.",
    ],
  },
];

export const BYBIT_SIGNUP_FAQ = [
  {
    q: "바이비트 추천인 코드(레퍼럴 코드)는 무엇인가요?",
    a: `찐투의 바이비트 추천인 코드는 ${BYBIT_REFERRAL.code}입니다. 가입 화면의 Referral Code(선택) 칸에 입력하거나, 이 페이지의 가입 버튼으로 들어가면 자동으로 입력됩니다. 계정을 만들기 전에 입력해야 적용됩니다.`,
  },
  {
    q: "추천인 코드로 가입하면 어떤 혜택이 있나요?",
    a: "신규 가입자 보상·이벤트는 Bybit 정책에 따라 수시로 바뀝니다. 가입 화면과 Bybit 이벤트(Rewards Hub) 페이지에서 현재 혜택을 확인하세요. 추천인 코드를 넣어도 이용자에게 추가 수수료는 붙지 않습니다.",
  },
  {
    q: "레퍼럴로 가입하면 찐투 AI 요약이 늘어나나요?",
    a: `네. 추천인 코드 ${BYBIT_REFERRAL.code}로 Bybit에 가입한 뒤, 이 페이지의 '가입 이메일 보내기'로 Bybit 가입 이메일과 찐투 로그인 이메일을 보내 주세요. 운영자가 확인한 뒤 AI 요약 한도를 하루 5회에서 20회로 늘려 드립니다(영업일 1~3일).`,
  },
  {
    q: "한국에서도 바이비트에 가입할 수 있나요?",
    a: "이용 가능 여부는 국가·지역마다 다르고, Bybit는 미국·캐나다·중국 본토 등 일부 국가에서 서비스를 제공하지 않습니다. 거주 국가의 규제나 금융당국 안내에 따라 이용이 제한될 수 있으니, 가입 전 Bybit 공식 '서비스 제한 국가' 안내와 거주 국가의 관련 안내를 확인하세요.",
  },
  {
    q: "가입 후에 추천인 코드를 넣을 수 있나요?",
    a: "Bybit 공식 안내 기준으로, 일반 Referral 코드는 계정 생성 후 추가·변경이 불가합니다. 가입 제출 전에 반드시 확인하세요. (일부 Affiliate 프로그램 코드만, 조건 충족 시 가입 후 14일 이내 예외가 있을 수 있음)",
  },
  {
    q: "바이비트 가입이 안 되거나 인증 코드가 안 와요.",
    a: "인증 메일은 스팸함도 확인하고, 잠시 뒤 '코드 재전송'을 눌러 보세요. 거주 국가가 서비스 제한 국가로 선택돼 있으면 가입이 막힐 수 있고, 다른 사람 명의나 이미 쓰인 이메일·휴대폰 번호로는 가입할 수 없습니다. 계속 안 되면 Bybit 고객센터(라이브 채팅)로 문의하세요.",
  },
  {
    q: "웹과 앱 중 어디가 좋나요?",
    a: "둘 다 가능합니다. 앱스토어/구글플레이의 공식 Bybit 앱인지 확인하고, 앱에서도 가입 전 추천 코드 칸을 다시 확인하세요.",
  },
  {
    q: "KYC 없이도 쓸 수 있나요?",
    a: "Bybit는 모든 상품·서비스 이용에 최소 Standard 본인인증(KYC)을 요구합니다. 가입 후 신분증 촬영과 얼굴 인증을 마쳐야 입금·거래·출금을 제대로 쓸 수 있어요.",
  },
  {
    q: "이 페이지의 링크는 뭔가요?",
    a: `제휴(레퍼럴) 링크입니다. 코드 ${BYBIT_REFERRAL.code}로 가입하면 추천 보상이 적용될 수 있으며, 이용자에게 별도 수수료가 붙지는 않습니다. 투자 권유가 아닙니다.`,
  },
] as const;

/** 가이드 내용을 공식 안내와 마지막으로 대조한 날짜 (페이지에 표시·구조화 데이터 dateModified) */
export const BYBIT_GUIDE_UPDATED = "2026-11-11";

export const BYBIT_RESTRICTED_COUNTRIES_URL = "https://www.bybit.com/en/help-center/article/Service-Restricted-Countries";

export const BYBIT_OFFICIAL_GUIDE_URL =
  "https://www.bybit.com/en/learn/bybit-guide/create-a-bybit-account";

// ── English ──────────────────────────────────────────────

export const BYBIT_SIGNUP_PREP_EN = [
  "Confirm you're on the official bybit.com domain (watch for phishing).",
  "Have an email (recommended) or phone you'll keep using.",
  "Choose the country you actually live in. Restricted countries may block sign-up.",
  `Enter and double-check referral code ${BYBIT_REFERRAL.code} before creating the account.`,
  "Have a physical government ID ready for KYC. Bybit accepts photos of physical documents only — no scans, copies or screenshots.",
] as const;

export const BYBIT_SIGNUP_STEPS_EN: ManualStep[] = [
  {
    id: "open-link",
    title: "Open sign-up via referral link",
    summary: "Use the Bybit button to open the official invite link.",
    details: [
      `Open Bybit sign-up with the button below or a link that includes ${BYBIT_REFERRAL.code}.`,
      "On web, click Sign Up to reach the registration screen.",
      "In the app, re-check the Referral Code field before creating the account.",
    ],
    tip: `The link usually fills the code automatically. If empty, type ${BYBIT_REFERRAL.code}.`,
  },
  {
    id: "country-method",
    title: "Country & sign-up method",
    summary: "Pick residence country; sign up with email, phone, or social.",
    details: [
      "Country must match where you live. Restricted regions may block sign-up.",
      "Methods: email (recommended), phone, Google / Apple / Telegram.",
      "Withdrawals often need email + Google Authenticator — prefer email sign-up.",
      "One email/phone per account. Use Latin letters and numbers.",
    ],
  },
  {
    id: "referral-code",
    title: "Confirm code, then submit",
    summary: "Check the code before Sign Up Now / Create Account.",
    details: [
      `Confirm ${BYBIT_REFERRAL.code} is in the Referral Code (optional) field.`,
      "If empty, enter it, then agree to Terms and Privacy Policy.",
      "Pass the captcha and submit.",
      "A regular referral code can't be added or changed after account creation.",
    ],
    tip: "Always verify the code before finishing — the most common mistake.",
  },
  {
    id: "verify-password",
    title: "Verify & set password",
    summary: "Verify via email/SMS, then create a password.",
    details: [
      "Enter the code sent to email or phone. (Check spam too.)",
      "Create a password that meets the rules shown on screen (length, upper/lowercase, numbers, etc.).",
      "Don't reuse passwords; a password manager helps.",
    ],
  },
  {
    id: "kyc",
    guide: "kyc",
    title: "Complete KYC",
    summary: "Verify identity to deposit, trade, and withdraw.",
    details: [
      "Start from Get Verified on the dashboard.",
      "Usually a government ID photo plus a selfie check.",
      "Name, DOB, and details must match your ID.",
      "Levels are Standard / Advanced (plus Pro in some regions); at least Standard is required for any Bybit product or service.",
      "Review usually takes about 15 minutes, but can take up to 48 hours.",
    ],
    tip: "Shoot ID with all four corners visible — no glare or blur.",
  },
  {
    id: "security",
    guide: "app",
    title: "Security (2FA & withdrawals)",
    summary: "Enable 2FA such as Google Authenticator.",
    details: [
      "Link email verification and Google Authenticator (OTP).",
      "Set a fund password, anti-phishing code, and withdrawal whitelist.",
      "Store the OTP recovery key offline. Never share it.",
    ],
  },
  {
    id: "deposit",
    guide: "deposit",
    title: "(Optional) Small test deposit",
    summary: "Match network & memo/tag; start with a small amount.",
    details: [
      "Coin and network (chain) must match the sending wallet.",
      "XRP, EOS, TON may need a memo/tag — missing it can lose funds.",
      "Deposit a little first, confirm arrival, then send the rest.",
    ],
  },
];

export const BYBIT_SIGNUP_FAQ_EN = [
  {
    q: "What is the Bybit referral code?",
    a: `jjintu's code is ${BYBIT_REFERRAL.code}. Enter it in Referral Code (optional) on sign-up, or use this page's button to autofill. It only works if entered before account creation.`,
  },
  {
    q: "What do I get with a referral?",
    a: "New-user rewards change under Bybit policy. Check the sign-up screen and Rewards Hub. Referral adds no extra fees for you.",
  },
  {
    q: "Do I get more AI summaries for signing up?",
    a: `Yes. Sign up for Bybit with referral code ${BYBIT_REFERRAL.code}, then use 'Send my sign-up email' on this page to send your Bybit sign-up email and jjintu login email. Once we confirm it, we'll raise your AI summary limit from 5 to 20 a day (1–3 business days).`,
  },
  {
    q: "Is Bybit available in my country?",
    a: "Depends on region. Bybit doesn't serve some places, including the US, Canada and mainland China. Check Bybit's official Service Restricted Countries page and local rules before signing up.",
  },
  {
    q: "Can I add a code after sign-up?",
    a: "Regular referral codes can't be added or changed after account creation — check before submit. (Some affiliate codes may allow a 14-day exception if conditions are met.)",
  },
  {
    q: "Sign-up fails or the code never arrives",
    a: "Check your spam folder and tap 'Resend code' after a moment. Sign-up is blocked if your country of residence is restricted, and you can't use someone else's identity or an email/phone already linked to another account. If it still fails, contact Bybit support via live chat.",
  },
  {
    q: "Web or app — which is better?",
    a: "Either works. Use the official Bybit app, and re-check the referral code field in-app before signing up.",
  },
  {
    q: "Can I use it without KYC?",
    a: "Bybit requires at least Standard identity verification (KYC) for all products and services. Finish the ID photo and face check to deposit, trade and withdraw.",
  },
  {
    q: "What is the link on this page?",
    a: `It's an affiliate (referral) link. Signing up with code ${BYBIT_REFERRAL.code} may give referral rewards, with no extra fees for you. Not investment advice.`,
  },
] as const;

/** 화면 언어에 맞는 매뉴얼 데이터 */
export function getBybitSignupManual(locale: string) {
  return locale === "en"
    ? { prep: BYBIT_SIGNUP_PREP_EN, steps: BYBIT_SIGNUP_STEPS_EN, faq: BYBIT_SIGNUP_FAQ_EN }
    : { prep: BYBIT_SIGNUP_PREP, steps: BYBIT_SIGNUP_STEPS, faq: BYBIT_SIGNUP_FAQ };
}
