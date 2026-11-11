/** Bybit 레퍼럴(추천인) 가입 정보 */
export const BYBIT_REFERRAL = {
  code: "XQZZ6O",
  url: "https://www.bybit.com/en/invite?ref=XQZZ6O&medium=referral&utm_campaign=evergreen",
  brand: "Bybit",
  brandKo: "바이비트",
  // 화면 문구(제목·헤드라인·CTA)는 messages/<locale>/bybit.json
} as const;

/** 검색 유입용 키워드 — 언어별 (실제 검색 표현 위주) */
export const BYBIT_REFERRAL_KEYWORDS_KO = [
  "바이비트",
  "바이비트 가입",
  "바이비트 가입 방법",
  "바이비트 회원가입",
  "바이비트 추천인 코드",
  "바이비트 추천인",
  "바이비트 레퍼럴",
  "바이비트 레퍼럴 코드",
  "바이비트 초대코드",
  "바이비트 KYC",
  "바이비트 본인인증",
  "바이비트 사용법",
  "Bybit 가입",
  "Bybit 추천인 코드",
  "XQZZ6O",
] as const;

export const BYBIT_REFERRAL_KEYWORDS_EN = [
  "Bybit",
  "Bybit referral code",
  "Bybit invite code",
  "Bybit referral link",
  "Bybit sign up",
  "how to sign up for Bybit",
  "Bybit registration",
  "Bybit account",
  "Bybit KYC",
  "Bybit verification",
  "Bybit referral",
  "XQZZ6O",
] as const;

/** @deprecated 언어별 목록을 쓰세요 */
export const BYBIT_REFERRAL_KEYWORDS = [...BYBIT_REFERRAL_KEYWORDS_KO, ...BYBIT_REFERRAL_KEYWORDS_EN] as const;

export const BYBIT_REFERRAL_DESCRIPTION =
  "찐동코인 이용에 만족하셨다면 Bybit(바이비트) 레퍼럴 가입을 부탁드립니다. Bybit Referral Code XQZZ6O · 바이비트 추천인 코드 · Bybit invite signup.";
