import { BYBIT_REFERRAL } from "@/lib/bybit-referral";

export type ManualStep = {
  id: string;
  title: string;
  summary: string;
  details: string[];
  tip?: string;
};

/** Bybit 공식 가입 가이드 기준 정리 (화면은 지역·시점에 따라 다를 수 있음) */
export const BYBIT_SIGNUP_PREP = [
  "공식 도메인(bybit.com)인지 확인하세요. 가짜 사이트·피싱 링크를 주의하세요.",
  "계속 사용할 이메일(권장) 또는 휴대폰 번호를 준비하세요.",
  "실제 거주 국가를 선택하세요. 서비스 제한 국가면 가입이 막힐 수 있습니다.",
  `추천인(레퍼럴) 코드 ${BYBIT_REFERRAL.code}는 계정 생성 전에 입력·확인하세요.`,
  "KYC용 본인 명의 신분증 실물을 준비하세요. (캡처본·편집본은 거절될 수 있음)",
] as const;

export const BYBIT_SIGNUP_STEPS: ManualStep[] = [
  {
    id: "open-link",
    title: "1. 레퍼럴 링크로 가입 페이지 열기",
    summary: "찐동코인 Bybit 가입 버튼으로 공식 초대 링크를 엽니다.",
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
      "비밀번호는 보통 8–30자, 대문자·소문자·숫자 조합을 요구합니다.",
      "다른 사이트와 다른 비밀번호를 쓰고, 비밀번호 관리자를 활용하세요.",
    ],
  },
  {
    id: "kyc",
    title: "5. KYC(본인 인증) 진행",
    summary: "입금·거래·출금을 위해 신원 인증을 완료합니다.",
    details: [
      "대시보드의 Get Verified / 신원 인증에서 진행합니다.",
      "정부 발급 신분증 촬영 + 얼굴(셀피) 인증이 일반적입니다.",
      "이름·생년월일 등 입력값이 신분증과 일치해야 합니다.",
      "Bybit는 Standard / Advanced / Pro 등 단계로 안내할 수 있습니다. 기본(Standard)만으로도 입출금·거래가 가능한 경우가 많습니다.",
      "심사는 보통 수분~수십 분, 복잡한 경우 더 걸릴 수 있습니다.",
    ],
    tip: "빛 반사·흐림 없이 신분증 네 모서리가 나오게 촬영하세요.",
  },
  {
    id: "security",
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
    q: "가입 후에 추천인 코드를 넣을 수 있나요?",
    a: "Bybit 공식 안내 기준으로, 일반 Referral 코드는 계정 생성 후 추가·변경이 불가합니다. 가입 제출 전에 반드시 확인하세요. (일부 Affiliate 프로그램 코드만, 조건 충족 시 가입 후 14일 이내 예외가 있을 수 있음)",
  },
  {
    q: "웹과 앱 중 어디가 좋나요?",
    a: "둘 다 가능합니다. 앱스토어/구글플레이의 공식 Bybit 앱인지 확인하고, 앱에서도 가입 전 추천 코드 칸을 다시 확인하세요.",
  },
  {
    q: "KYC 없이도 쓸 수 있나요?",
    a: "미인증 계정은 입금·거래·출금이 크게 제한됩니다. 실사용을 위해서는 KYC 완료를 권장합니다.",
  },
  {
    q: "이 페이지의 링크는 뭔가요?",
    a: `제휴(레퍼럴) 링크입니다. 코드 ${BYBIT_REFERRAL.code}로 가입하면 추천 보상이 적용될 수 있으며, 이용자에게 별도 수수료가 붙지는 않습니다. 투자 권유가 아닙니다.`,
  },
] as const;

export const BYBIT_OFFICIAL_GUIDE_URL =
  "https://www.bybit.com/en/learn/bybit-guide/create-a-bybit-account";

// ── English ──────────────────────────────────────────────

export const BYBIT_SIGNUP_PREP_EN = [
  "Make sure you're on the official domain (bybit.com). Watch out for fake sites and phishing links.",
  "Have an email address (recommended) or phone number you'll keep using.",
  "Choose the country you actually live in. Sign-up may be blocked in restricted countries.",
  `Enter and double-check the referral code ${BYBIT_REFERRAL.code} before creating the account.`,
  "Have your physical government ID ready for KYC. (Screenshots or edited images may be rejected.)",
] as const;

export const BYBIT_SIGNUP_STEPS_EN: ManualStep[] = [
  {
    id: "open-link",
    title: "1. Open the sign-up page with the referral link",
    summary: "Use the JindongCoin Bybit button to open the official invite link.",
    details: [
      `Open the Bybit sign-up page with the button below or a link that includes invite code ${BYBIT_REFERRAL.code}.`,
      "On the web, click Sign Up to go to the registration screen.",
      "If you continue in the app, check the Referral Code field again before creating the account.",
    ],
    tip: `Coming from the link usually fills the code in automatically. If it's empty, type ${BYBIT_REFERRAL.code} yourself.`,
  },
  {
    id: "country-method",
    title: "2. Choose your country and sign-up method",
    summary: "Pick your country of residence and sign up with email, phone, or a social login.",
    details: [
      "Your country must match where you actually live. Restricted regions show a warning and may not be able to sign up.",
      "Sign-up methods: email (recommended), phone, Google / Apple / Telegram, etc.",
      "Withdrawals often require email and Google Authenticator, so email sign-up is recommended.",
      "An email or phone number can be linked to only one account. Use half-width (Latin letters/numbers) characters.",
    ],
  },
  {
    id: "referral-code",
    title: "3. Confirm the referral code, then submit",
    summary: "Check the code before pressing Sign Up Now / Create Account.",
    details: [
      `Make sure ${BYBIT_REFERRAL.code} appears in the Referral Code (optional) field.`,
      "If it's empty, enter it yourself, then agree to the Terms of Service and Privacy Policy.",
      "Pass the captcha (puzzle) and submit the sign-up.",
      "According to Bybit, a regular referral code can't be added, changed, or removed after the account is created.",
    ],
    tip: "Always check the code before finishing sign-up. It's the most common mistake.",
  },
  {
    id: "verify-password",
    title: "4. Verification code and password",
    summary: "Verify by email or SMS, then create a password.",
    details: [
      "Enter the verification code sent to your email or phone. (Check your spam folder too.)",
      "Passwords usually need 8–30 characters with uppercase, lowercase, and numbers.",
      "Use a password you don't use elsewhere, and consider a password manager.",
    ],
  },
  {
    id: "kyc",
    title: "5. Complete KYC (identity verification)",
    summary: "Verify your identity to deposit, trade, and withdraw.",
    details: [
      "Start from Get Verified on the dashboard.",
      "Usually a photo of a government-issued ID plus a selfie check.",
      "Your name, date of birth, and other details must match your ID.",
      "Bybit may describe levels such as Standard / Advanced / Pro. Standard alone often allows deposits, withdrawals, and trading.",
      "Review usually takes minutes to tens of minutes, and can take longer in complex cases.",
    ],
    tip: "Photograph your ID with all four corners visible, without glare or blur.",
  },
  {
    id: "security",
    title: "6. Security settings (2FA, withdrawal protection)",
    summary: "Turn on two-factor authentication such as Google Authenticator.",
    details: [
      "Link email verification and Google Authenticator (OTP).",
      "Set a fund password, an anti-phishing code, and a withdrawal address whitelist.",
      "Store your OTP recovery key safely offline. Never share it with anyone.",
    ],
  },
  {
    id: "deposit",
    title: "7. (Optional) Test your first deposit with a small amount",
    summary: "Match the network and memo (tag), then try a small amount first.",
    details: [
      "Make sure the deposit coin and network (chain) match the wallet you're sending from.",
      "Coins such as XRP, EOS, and TON may need a memo/tag. Leaving it out can lose your funds.",
      "Deposit a small amount first, confirm it arrives, then move the rest.",
    ],
  },
];

export const BYBIT_SIGNUP_FAQ_EN = [
  {
    q: "Can I add a referral code after signing up?",
    a: "According to Bybit, a regular referral code can't be added or changed after the account is created, so check it before submitting. (Some affiliate program codes may be an exception within 14 days of sign-up if conditions are met.)",
  },
  {
    q: "Web or app — which is better?",
    a: "Either works. Make sure it's the official Bybit app on the App Store / Google Play, and check the referral code field again in the app before signing up.",
  },
  {
    q: "Can I use it without KYC?",
    a: "Unverified accounts are heavily limited for deposits, trading, and withdrawals. Completing KYC is recommended for real use.",
  },
  {
    q: "What is the link on this page?",
    a: `It's an affiliate (referral) link. Signing up with code ${BYBIT_REFERRAL.code} may give referral rewards, and no extra fees are charged to you. This is not investment advice.`,
  },
] as const;

/** 화면 언어에 맞는 매뉴얼 데이터 */
export function getBybitSignupManual(locale: string) {
  return locale === "en"
    ? { prep: BYBIT_SIGNUP_PREP_EN, steps: BYBIT_SIGNUP_STEPS_EN, faq: BYBIT_SIGNUP_FAQ_EN }
    : { prep: BYBIT_SIGNUP_PREP, steps: BYBIT_SIGNUP_STEPS, faq: BYBIT_SIGNUP_FAQ };
}
