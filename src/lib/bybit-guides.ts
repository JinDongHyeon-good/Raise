import { BYBIT_REFERRAL } from "@/lib/bybit-referral";

/**
 * /bybit 아래 세부 가이드 (입금·KYC·수수료·앱).
 * 각 페이지가 롱테일 검색어 하나씩을 맡고, 서로와 /bybit 로 링크한다.
 * 사실관계는 Bybit 공식 도움말·업비트 고객센터 기준으로 확인한 날짜를 BYBIT_GUIDES_CHECKED 에 남긴다.
 */

export const BYBIT_GUIDE_SLUGS = ["deposit", "withdraw", "kyc", "fees", "futures", "app", "vs-upbit", "bonus"] as const;
export type BybitGuideSlug = (typeof BYBIT_GUIDE_SLUGS)[number];

export function isBybitGuideSlug(value: string): value is BybitGuideSlug {
  return (BYBIT_GUIDE_SLUGS as readonly string[]).includes(value);
}

/** 가이드 내용을 공식 안내와 마지막으로 대조한 날짜 */
export const BYBIT_GUIDES_CHECKED = "2026-11-13";

export type GuideSection = {
  id: string;
  heading: string;
  paragraphs?: string[];
  /** 순서가 있는 단계 (ol) */
  steps?: string[];
  /** 순서 없는 항목 (ul) */
  bullets?: string[];
  /** 표 — 첫 행이 머리글 */
  table?: string[][];
  tip?: string;
  /** 섹션 끝 외부 링크 (공식 안내) */
  link?: { label: string; href: string };
};

export type BybitGuide = {
  slug: BybitGuideSlug;
  /** <title> — 레이아웃이 "| 찐투"를 붙인다 */
  metaTitle: string;
  description: string;
  socialDescription: string;
  keywords: string[];
  /** 다른 가이드 카드에 쓰는 짧은 이름·설명 */
  navTitle: string;
  navBlurb: string;
  eyebrow: string;
  h1: string;
  lead: string;
  sections: GuideSection[];
  faq: Array<{ q: string; a: string }>;
};

const CODE = BYBIT_REFERRAL.code;

const UPBIT_VASP_URL = "https://support.upbit.com/hc/ko";
const BYBIT_FEE_URL = "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure";
const BYBIT_KYC_FAIL_URL =
  "https://www.bybit.com/en/help-center/article/Common-Reasons-and-Solutions-for-KYC-Verification-Failures";
const BYBIT_DOWNLOAD_URL = "https://www.bybit.com/en/download/";
const BYBIT_RESTRICTED_URL = "https://www.bybit.com/en/help-center/article/Service-Restricted-Countries";

// ── 한국어 ──────────────────────────────────────────────

const KO: Record<BybitGuideSlug, BybitGuide> = {
  deposit: {
    slug: "deposit",
    metaTitle: "업비트에서 바이비트로 송금하는 방법 (트래블룰·입금 주소·네트워크)",
    description:
      "업비트에서 바이비트(Bybit)로 코인 보내는 방법을 단계별로 정리했어요. 바이비트 입금 주소 복사, 네트워크 선택, 트래블룰 100만원 기준과 계정주 확인, 입금 대기·미반영 해결법까지.",
    socialDescription: "업비트 → 바이비트 송금 7단계. 입금 주소·네트워크·트래블룰·입금 대기 해결법 정리.",
    keywords: [
      "업비트 바이비트 송금",
      "업비트에서 바이비트로",
      "바이비트 입금",
      "바이비트 입금 방법",
      "바이비트 트래블룰",
      "업비트 바이비트 트래블룰",
      "바이비트 입금 주소",
      "바이비트 입금 안됨",
      "빗썸 바이비트 송금",
      "Bybit 입금",
    ],
    navTitle: "업비트 → 바이비트 송금",
    navBlurb: "입금 주소·네트워크·트래블룰까지 단계별로",
    eyebrow: "Bybit 바이비트 입금 가이드",
    h1: "업비트에서 바이비트로 송금하는 방법",
    lead:
      "바이비트는 원화 입금이 없어서, 보통 업비트·빗썸 같은 국내 거래소에서 코인을 산 뒤 바이비트 입금 주소로 보냅니다. 주소·네트워크·트래블룰 세 가지만 맞추면 어렵지 않아요.",
    sections: [
      {
        id: "before",
        heading: "보내기 전에 확인할 것",
        bullets: [
          "바이비트 KYC(본인인증)를 먼저 끝내세요. 국내 거래소는 받는 쪽 계정주가 나와 같은 사람인지 확인합니다.",
          "업비트와 바이비트에 등록된 이름·생년월일이 같아야 합니다. 영문 이름의 순서·띄어쓰기 차이로 확인이 실패하기도 해요.",
          "보낼 코인을 업비트와 바이비트 양쪽에서 같은 네트워크(체인)로 지원하는지 확인하세요.",
          "업비트의 '입출금 가능 가상자산사업자' 목록에 바이비트가 있는지 확인하세요. 목록은 수시로 바뀝니다.",
        ],
        link: { label: "업비트 고객센터에서 입출금 가능 사업자 확인하기 →", href: UPBIT_VASP_URL },
      },
      {
        id: "steps",
        heading: "업비트 → 바이비트 송금 단계",
        steps: [
          "업비트에서 원화로 보낼 코인을 삽니다. 전송이 빠르고 수수료가 싼 코인(예: XRP, TRX 등)을 많이 씁니다.",
          "바이비트 앱·웹에서 자산(Assets) → 입금(Deposit)을 누르고 같은 코인을 고릅니다.",
          "네트워크(체인)를 업비트 출금 네트워크와 똑같이 고르고, 입금 주소를 복사합니다. 메모/태그(Destination Tag·Memo)가 있으면 그것도 복사합니다.",
          "업비트에서 입출금 → 해당 코인 → 출금하기를 누르고, 받는 거래소로 바이비트(Bybit)를 선택합니다.",
          "바이비트 입금 주소(와 메모/태그)를 붙여 넣고, 처음에는 소액만 보냅니다.",
          "업비트 추가 인증(카카오·네이버 인증 등)을 마치면 출금이 진행됩니다.",
          "바이비트 자산 화면에서 입금이 들어왔는지 확인한 뒤 나머지 금액을 보냅니다.",
        ],
        tip: "주소·네트워크·메모가 하나라도 틀리면 자산을 되찾기 어렵습니다. 첫 전송은 꼭 소액으로 테스트하세요.",
      },
      {
        id: "travel-rule",
        heading: "트래블룰 100만원 기준과 계정주 확인",
        paragraphs: [
          "국내 거래소는 원화 환산 100만원 이상을 해외 거래소로 보낼 때 트래블룰을 적용해, 보내는 사람과 받는 사람 정보를 확인합니다. 업비트는 받는 거래소가 트래블룰 연동 사업자이거나 계정주 확인 연동 사업자일 때만 출금을 허용합니다.",
          "바이비트는 업비트에서 '계정주 확인' 방식으로 연동된 거래소로 안내되는 경우가 많지만, 연동 방식과 목록은 바뀔 수 있으니 보내기 전에 업비트 고객센터 목록을 확인하세요. 100만원 미만이라도 입금처가 확인되지 않은 주소로는 출금이 제한될 수 있습니다.",
          "바이비트 쪽에서도 입금 출처(보낸 거래소, 보낸 사람 정보)를 묻는 창이 뜰 수 있어요. 안내대로 입력하면 입금이 반영됩니다.",
        ],
      },
      {
        id: "pending",
        heading: "입금이 안 들어올 때 (입금 대기·미반영)",
        bullets: [
          "블록체인 확인(컨펌) 수가 아직 모자란 경우가 가장 흔합니다. 업비트 출금 내역의 TXID로 진행 상황을 확인하세요.",
          "바이비트에서 입금 출처 확인을 기다리는 상태일 수 있어요. 바이비트 앱 알림·자산 화면에서 추가로 입력할 정보가 있는지 확인하세요.",
          "메모/태그를 빠뜨렸거나 네트워크를 잘못 골랐다면 바이비트 고객센터(라이브 채팅)에 TXID·입금 시각·코인·금액을 알려 복구를 문의하세요. 복구가 안 되거나 수수료가 붙을 수 있습니다.",
          "업비트에서 출금이 아예 막혔다면 계정주 확인 실패(이름·생년월일 불일치)나 사업자 목록 변경일 가능성이 큽니다.",
        ],
      },
      {
        id: "notice",
        heading: "알아 둘 점",
        paragraphs: [
          "바이비트는 한국 금융정보분석원(FIU)에 신고한 가상자산사업자가 아닙니다. 국내 규제·정책 변화에 따라 국내 거래소와의 입출금이 언제든 제한될 수 있으니, 필요한 만큼만 옮기고 최신 공지를 확인하세요.",
        ],
      },
    ],
    faq: [
      {
        q: "업비트에서 바이비트로 원화(KRW)를 바로 보낼 수 있나요?",
        a: "아니요. 바이비트는 원화 입금을 받지 않아요. 업비트에서 코인을 산 뒤 그 코인을 바이비트 입금 주소로 보내야 합니다.",
      },
      {
        q: "업비트에서 바이비트로 보낼 때 어떤 코인이 좋나요?",
        a: "전송이 빠르고 출금 수수료가 싼 코인을 많이 씁니다. 다만 양쪽 거래소가 같은 네트워크를 지원하는지, 메모/태그가 필요한지 먼저 확인하세요.",
      },
      {
        q: "100만원 미만이면 트래블룰 없이 보낼 수 있나요?",
        a: "100만원 미만은 트래블룰 정보 전송 대상은 아니지만, 업비트는 입금처가 확인되지 않은 주소로의 출금을 제한합니다. 받는 거래소로 바이비트를 선택해 보내는 것이 안전합니다.",
      },
      {
        q: "바이비트 입금은 얼마나 걸리나요?",
        a: "코인과 네트워크 혼잡도에 따라 몇 분에서 수십 분이 걸립니다. 블록 컨펌이 끝났는데도 반영이 안 되면 바이비트 자산 화면에서 추가 확인 요청이 있는지 보세요.",
      },
      {
        q: "빗썸에서도 바이비트로 보낼 수 있나요?",
        a: "빗썸도 트래블룰 연동 거래소 목록을 공개합니다. 바이비트가 목록에 있는지 빗썸 고객센터에서 확인한 뒤 같은 방법(입금 주소·네트워크·소액 테스트)으로 보내면 됩니다.",
      },
    ],
  },

  kyc: {
    slug: "kyc",
    metaTitle: "바이비트 KYC 본인인증 방법과 실패 원인·해결법",
    description:
      "바이비트(Bybit) KYC 본인인증 방법과 '인증 실패' 원인별 해결법. 신분증 촬영 조건, 얼굴 인증 오류, 24시간 5회 제한, 심사 시간(약 15분~48시간), 재제출·이의 신청까지 공식 안내 기준으로 정리.",
    socialDescription: "바이비트 KYC가 안 될 때 — 실패 원인별 해결법과 재제출 방법.",
    keywords: [
      "바이비트 KYC",
      "바이비트 본인인증",
      "바이비트 KYC 실패",
      "바이비트 KYC 안됨",
      "바이비트 신분증 인증",
      "바이비트 얼굴 인증",
      "바이비트 인증 시간",
      "Bybit KYC",
      "Bybit 본인인증",
    ],
    navTitle: "바이비트 KYC 본인인증",
    navBlurb: "인증 방법과 실패 원인별 해결법",
    eyebrow: "Bybit 바이비트 KYC 가이드",
    h1: "바이비트 KYC 본인인증 방법과 실패할 때 해결법",
    lead:
      "바이비트는 입금·거래·출금 등 모든 서비스에 최소 Standard 단계 KYC(본인인증)를 요구해요. 신분증 촬영과 얼굴 인증만 제대로 하면 보통 15분 안에 끝납니다.",
    sections: [
      {
        id: "how",
        heading: "KYC 진행 순서",
        steps: [
          "바이비트 로그인 → 프로필 또는 대시보드의 '신원 인증(Get Verified / Verify Now)'을 누릅니다.",
          "국적(발급 국가)과 신분증 종류를 고릅니다. 여권·주민등록증·운전면허증·영주권(거주허가증)을 받습니다.",
          "실물 신분증의 앞·뒷면을 네 모서리가 다 보이게 촬영합니다.",
          "화면 안내에 따라 얼굴 인증(셀피, 고개 돌리기)을 합니다.",
          "결과는 이메일과 신원 인증 화면에서 확인합니다. 보통 약 15분, 길면 48시간까지 걸려요.",
        ],
        tip: "밝은 곳에서, 빛 반사 없이, 카메라를 흔들지 말고 촬영하세요. 실패 원인의 대부분이 사진 품질입니다.",
      },
      {
        id: "documents",
        heading: "받는 신분증 · 안 받는 신분증",
        table: [
          ["구분", "신분증"],
          ["받음", "여권, 주민등록증(국가 신분증), 운전면허증, 거주허가증"],
          ["안 받음", "학생·취업·여행 비자, 스캔본·복사본·캡처본, 흑백 사진, 만료된 신분증"],
        ],
        paragraphs: [
          "여권을 쓸 때는 서명란에 서명이 있어야 합니다. 이름·생년월일·유효기간이 선명하게 읽혀야 하고, 정보를 가리면 안 됩니다.",
        ],
      },
      {
        id: "fail",
        heading: "KYC 실패 원인별 해결법",
        table: [
          ["실패 사유", "해결법"],
          ["사진이 흐림·잘림·반사", "네 모서리가 다 나오게, 반사 없이 다시 촬영"],
          ["스캔본·캡처·흑백", "실물 신분증을 컬러로 직접 촬영 (편집 앱 사용 금지)"],
          ["만료된 신분증", "유효기간이 남은 신분증으로 교체"],
          ["얼굴 불일치", "신분증 사진과 같은 사람이, 혼자, 얼굴을 가리지 않고 인증"],
          ["셀피 품질 불량", "밝은 곳에서 얼굴을 원 안 가운데 두고 천천히 고개를 돌리기"],
          ["같은 신분증의 다른 계정", "한 사람당 한 계정만 인증 가능 — 이미 인증한 계정을 사용"],
          ["24시간 5회 넘게 거절", "24시간을 기다린 뒤 다시 시도"],
          ["서비스 제한 국가·만 18세 미만", "이용 불가 (이의가 있으면 고객센터에 케이스 제출)"],
        ],
        link: { label: "Bybit 공식: KYC 실패 원인과 해결법 →", href: BYBIT_KYC_FAIL_URL },
      },
      {
        id: "resubmit",
        heading: "다시 제출하는 방법",
        bullets: [
          "실패 이메일에 적힌 사유를 먼저 확인하세요. 신원 인증 화면의 [?] 아이콘에서도 볼 수 있어요.",
          "원인을 고친 뒤 'Verify Now'를 다시 누르면 됩니다. 재제출 결과는 보통 15~20분 안에 옵니다.",
          "결과 메일이 안 오면 스팸함을 확인하세요. 그래도 없으면 라이브 채팅이나 케이스 제출로 문의하세요.",
        ],
      },
    ],
    faq: [
      {
        q: "바이비트 KYC 없이 거래할 수 있나요?",
        a: "아니요. 바이비트는 모든 상품·서비스 이용에 최소 Standard 단계 본인인증을 요구합니다.",
      },
      {
        q: "바이비트 KYC는 얼마나 걸리나요?",
        a: "보통 약 15분이고, 경우에 따라 최대 48시간까지 걸릴 수 있습니다. 재제출하면 보통 15~20분 안에 결과가 나옵니다.",
      },
      {
        q: "주민등록증으로 바이비트 KYC가 되나요?",
        a: "국가 신분증(주민등록증), 여권, 운전면허증 모두 받습니다. 실물을 컬러로 직접 촬영해야 하고, 스캔본이나 캡처는 거절됩니다.",
      },
      {
        q: "KYC를 여러 번 실패했어요.",
        a: "24시간 안에 5번 넘게 거절되면 24시간을 기다려야 다시 제출할 수 있어요. 실패 메일의 사유를 확인하고 고친 뒤 제출하세요.",
      },
      {
        q: "KYC 결과에 이의를 제기할 수 있나요?",
        a: "네. 바이비트 고객센터에 케이스(지원 티켓)를 제출해 이의를 신청할 수 있습니다.",
      },
    ],
  },

  fees: {
    slug: "fees",
    metaTitle: "바이비트 수수료 총정리 (현물·선물 메이커·테이커, VIP, 입출금)",
    description:
      "바이비트(Bybit) 거래 수수료 정리: 현물 0.1%, 무기한 선물 테이커 0.055%·메이커 0.02%(일반 등급). 메이커·테이커 차이, 펀딩비, VIP 등급, 입금·출금 수수료와 수수료 아끼는 방법까지.",
    socialDescription: "바이비트 현물 0.1% · 선물 0.055%/0.02% — 수수료 구조와 아끼는 법.",
    keywords: [
      "바이비트 수수료",
      "바이비트 선물 수수료",
      "바이비트 현물 수수료",
      "바이비트 메이커 테이커",
      "바이비트 펀딩비",
      "바이비트 출금 수수료",
      "바이비트 VIP",
      "Bybit 수수료",
    ],
    navTitle: "바이비트 수수료",
    navBlurb: "현물·선물 수수료와 아끼는 방법",
    eyebrow: "Bybit 바이비트 수수료 가이드",
    h1: "바이비트 수수료 총정리",
    lead:
      "바이비트 일반(VIP 0) 등급 기준 현물은 0.1%, 무기한·선물은 시장가(테이커) 0.055%, 지정가(메이커) 0.02%예요. 주문 방식과 등급에 따라 실제로 내는 수수료가 달라집니다.",
    sections: [
      {
        id: "rates",
        heading: "거래 수수료 (일반 등급 VIP 0)",
        table: [
          ["상품", "테이커 (시장가)", "메이커 (지정가)"],
          ["현물 (코인-코인)", "0.1000%", "0.1000%"],
          ["무기한·선물 계약", "0.0550%", "0.0200%"],
          ["옵션", "0.0300%", "0.0200%"],
        ],
        paragraphs: [
          "위 표는 Bybit 공식 수수료 안내의 일반(VIP 0) 등급 기준입니다. 수수료율은 바뀔 수 있으니 거래 전에 공식 페이지를 확인하세요.",
        ],
        link: { label: "Bybit 공식 수수료 안내 보기 →", href: BYBIT_FEE_URL },
      },
      {
        id: "maker-taker",
        heading: "메이커와 테이커 차이",
        bullets: [
          "테이커: 시장가 주문처럼 호가창에 있는 주문을 바로 체결시키는 쪽. 수수료가 더 높습니다.",
          "메이커: 지정가 주문으로 호가창에 주문을 걸어 두는 쪽. 선물에서는 테이커의 절반도 안 됩니다.",
          "예: 선물 1,000 USDT 포지션을 시장가로 열고 닫으면 0.55 + 0.55 = 약 1.1 USDT, 지정가로 열고 닫으면 0.2 + 0.2 = 약 0.4 USDT입니다. 레버리지를 쓰면 수수료는 증거금이 아니라 포지션 크기 기준으로 붙어요.",
        ],
      },
      {
        id: "funding",
        heading: "펀딩비 (무기한 선물)",
        paragraphs: [
          "무기한 계약은 보통 8시간마다 롱과 숏 사이에 펀딩비를 주고받습니다. 펀딩비가 양수면 롱이 숏에게, 음수면 숏이 롱에게 냅니다. 바이비트가 가져가는 수수료가 아니라 이용자끼리 주고받는 돈이고, 정산 시점에 포지션을 들고 있을 때만 붙어요.",
        ],
      },
      {
        id: "deposit-withdraw",
        heading: "입금 · 출금 수수료",
        bullets: [
          "코인 입금은 바이비트가 수수료를 받지 않습니다. 보내는 거래소(예: 업비트)의 출금 수수료만 듭니다.",
          "출금 수수료는 코인과 네트워크마다 정해져 있고 수시로 바뀝니다. 출금 화면에 표시되는 금액을 확인하세요.",
          "같은 코인이라도 네트워크에 따라 수수료 차이가 큽니다. 받는 쪽이 지원하는 네트워크 중 싼 것을 고르세요.",
        ],
      },
      {
        id: "save",
        heading: "수수료 아끼는 방법",
        bullets: [
          "급하지 않으면 지정가(메이커) 주문을 쓰세요. 선물은 수수료가 절반 이하로 줄어듭니다.",
          "거래량·자산이 많아지면 VIP 등급이 올라 수수료율이 내려갑니다.",
          `추천인 코드(${CODE})로 가입하면 신규 가입 이벤트·보상을 받을 수 있어요. 혜택은 바이비트 정책에 따라 바뀝니다.`,
          "잦은 단타는 수수료가 쌓입니다. 포지션 크기 × 수수료율 × 2(진입·청산)를 미리 계산해 보세요.",
        ],
      },
    ],
    faq: [
      {
        q: "바이비트 선물 수수료는 얼마인가요?",
        a: "일반(VIP 0) 등급 기준 무기한·선물 계약은 테이커(시장가) 0.055%, 메이커(지정가) 0.02%입니다.",
      },
      {
        q: "바이비트 현물 수수료는 얼마인가요?",
        a: "일반(VIP 0) 등급 기준 현물(코인-코인)은 메이커·테이커 모두 0.1%입니다.",
      },
      {
        q: "레버리지를 쓰면 수수료가 늘어나나요?",
        a: "수수료는 증거금이 아니라 포지션 크기에 붙습니다. 같은 증거금으로 레버리지를 10배 쓰면 수수료도 10배가 됩니다.",
      },
      {
        q: "바이비트 입금 수수료가 있나요?",
        a: "바이비트는 코인 입금에 수수료를 받지 않습니다. 보내는 쪽 거래소나 지갑의 출금(전송) 수수료만 듭니다.",
      },
      {
        q: "추천인 코드로 가입하면 수수료가 비싸지나요?",
        a: `아니요. 추천인 코드 ${CODE}로 가입해도 이용자에게 추가 수수료는 붙지 않습니다.`,
      },
    ],
  },

  app: {
    slug: "app",
    metaTitle: "바이비트 앱 다운로드와 사용법 (설치·로그인·주요 메뉴)",
    description:
      "바이비트(Bybit) 앱 설치 방법과 기본 사용법. 공식 앱 확인하는 법, 앱스토어에서 안 보일 때, 앱 가입 시 추천인 코드 입력, 입금·현물·선물 메뉴 찾기, 보안 설정까지 정리.",
    socialDescription: "바이비트 앱 설치부터 입금·거래 메뉴, 보안 설정까지 한눈에.",
    keywords: [
      "바이비트 앱",
      "바이비트 어플",
      "바이비트 앱 다운로드",
      "바이비트 앱 사용법",
      "바이비트 사용법",
      "바이비트 앱 설치",
      "바이비트 구글플레이",
      "Bybit 앱",
    ],
    navTitle: "바이비트 앱 사용법",
    navBlurb: "설치·추천인 코드·주요 메뉴·보안",
    eyebrow: "Bybit 바이비트 앱 가이드",
    h1: "바이비트 앱 다운로드와 사용법",
    lead:
      "바이비트는 웹과 앱 모두 같은 계정으로 쓸 수 있어요. 앱은 공식 경로로만 설치하고, 앱으로 가입한다면 계정을 만들기 전에 추천인 코드 칸을 꼭 확인하세요.",
    sections: [
      {
        id: "install",
        heading: "공식 앱 설치하기",
        steps: [
          "bybit.com 공식 사이트의 다운로드 페이지에서 iOS(App Store)·Android 링크를 엽니다.",
          "개발자 이름이 Bybit인지, 다운로드 수·리뷰가 충분한지 확인합니다. 이름이 비슷한 가짜 앱이 있어요.",
          "출처를 알 수 없는 APK 파일, 메신저로 받은 설치 링크는 쓰지 마세요.",
        ],
        tip: "국가·스토어 정책에 따라 스토어 검색에 바이비트 앱이 안 나올 수 있어요. 이럴 때도 공식 사이트의 다운로드 안내만 따르고, 웹(브라우저)으로도 모든 기능을 쓸 수 있습니다.",
        link: { label: "Bybit 공식 다운로드 페이지 →", href: BYBIT_DOWNLOAD_URL },
      },
      {
        id: "signup",
        heading: "앱으로 가입할 때 추천인 코드",
        bullets: [
          `가입 화면 아래쪽 '추천인 코드(Referral Code, 선택)' 칸에 ${CODE}를 입력합니다.`,
          "계정을 만든 뒤에는 일반 추천인 코드를 추가·변경할 수 없어요. 가입 버튼을 누르기 전에 확인하세요.",
          "웹에서 추천 링크로 가입한 뒤 앱으로 로그인해도 됩니다. 계정은 같습니다.",
        ],
      },
      {
        id: "menus",
        heading: "자주 쓰는 메뉴 찾기",
        table: [
          ["하고 싶은 것", "앱에서 찾는 곳"],
          ["입금 (코인 받기)", "홈 또는 자산(Assets) → 입금(Deposit)"],
          ["현물 매수·매도", "하단 거래(Trade) → 현물(Spot)"],
          ["선물 거래", "하단 파생상품(Derivatives) 또는 거래 → 무기한(Perpetual)"],
          ["출금", "자산 → 출금(Withdraw)"],
          ["본인인증(KYC)", "프로필 아이콘 → 신원 인증"],
          ["보안 설정", "프로필 아이콘 → 계정 및 보안"],
        ],
        paragraphs: ["메뉴 이름과 위치는 앱 버전·지역에 따라 조금씩 다를 수 있어요. 앱 언어는 설정에서 한국어로 바꿀 수 있습니다."],
      },
      {
        id: "security",
        heading: "앱 보안 설정",
        bullets: [
          "Google Authenticator(OTP) 2단계 인증을 켜세요. 출금에 필요한 경우가 많아요.",
          "피싱 방지 코드를 설정하면 바이비트가 보내는 진짜 이메일에 그 코드가 표시됩니다.",
          "출금 주소 화이트리스트를 켜 두면 등록한 주소로만 출금됩니다.",
          "생체 인증(Face ID·지문) 앱 잠금을 켜 두세요.",
        ],
      },
      {
        id: "notice",
        heading: "알아 둘 점",
        paragraphs: [
          "바이비트는 한국 금융정보분석원(FIU)에 신고한 가상자산사업자가 아니며, 미국·캐나다 등 일부 국가에서는 서비스하지 않습니다. 거주 국가의 규제와 바이비트 이용 제한 국가 안내를 먼저 확인하세요.",
        ],
        link: { label: "Bybit 서비스 제한 국가 안내 →", href: BYBIT_RESTRICTED_URL },
      },
    ],
    faq: [
      {
        q: "바이비트 앱이 앱스토어·구글플레이에서 안 보여요.",
        a: "국가·스토어 정책에 따라 검색에 안 나올 수 있어요. 바이비트 공식 사이트의 다운로드 안내를 따르거나, 웹 브라우저로 이용하세요. 출처를 모르는 APK는 설치하지 마세요.",
      },
      {
        q: "앱과 웹 계정이 따로인가요?",
        a: "아니요. 같은 계정으로 앱과 웹 모두 로그인할 수 있고, 자산과 주문도 똑같이 보입니다.",
      },
      {
        q: "바이비트 앱을 한국어로 쓸 수 있나요?",
        a: "네. 앱 설정의 언어에서 한국어를 고르면 됩니다.",
      },
      {
        q: "앱에서 가입하면 추천인 코드는 어디에 넣나요?",
        a: `가입 화면의 '추천인 코드(선택)' 칸에 ${CODE}를 넣습니다. 계정 생성 후에는 넣을 수 없어요.`,
      },
    ],
  },
  withdraw: {
    slug: "withdraw",
    metaTitle: "바이비트에서 업비트로 출금하는 방법 (트래블룰 수취인 정보·네트워크)",
    description:
      "바이비트(Bybit)에서 업비트·빗썸으로 코인 출금하는 방법. 업비트 입금 주소 확인, 네트워크·태그 맞추기, 출금 주소 등록, 트래블룰(100만원 이상) 수취인 정보, 입금 대기·반환 해결법까지 단계별로 정리.",
    socialDescription: "바이비트 → 업비트 출금 단계별 정리. 네트워크·태그·트래블룰·입금 대기 해결법.",
    keywords: [
      "바이비트 출금",
      "바이비트 출금 방법",
      "바이비트 업비트 출금",
      "바이비트에서 업비트로",
      "바이비트 업비트 송금",
      "바이비트 출금 트래블룰",
      "바이비트 출금 안됨",
      "바이비트 빗썸 출금",
      "Bybit 출금",
    ],
    navTitle: "바이비트 → 업비트 출금",
    navBlurb: "출금 주소·네트워크·트래블룰 정리",
    eyebrow: "Bybit 바이비트 출금 가이드",
    h1: "바이비트에서 업비트로 출금하는 방법",
    lead:
      "바이비트에서 번 코인을 원화로 바꾸려면 업비트·빗썸 같은 국내 거래소로 코인을 보낸 뒤 원화로 팔면 됩니다. 업비트 입금 주소·네트워크·트래블룰 정보만 정확히 맞추면 돼요.",
    sections: [
      {
        id: "before",
        heading: "출금 전에 확인할 것",
        bullets: [
          "업비트에서 받을 코인의 입금 주소를 먼저 만드세요. 업비트 입출금 → 코인 선택 → 입금하기에서 주소(와 태그/메모)가 나옵니다.",
          "업비트와 바이비트 계정의 이름·생년월일이 같아야 합니다. 국내 거래소는 해외에서 들어온 입금의 계정주를 확인합니다.",
          "보낼 코인을 업비트가 같은 네트워크로 입금 지원하는지 확인하세요. 업비트에 상장되지 않았거나 입금이 막힌 코인은 받을 수 없습니다.",
          "바이비트 2단계 인증(Google Authenticator)과 출금 비밀번호 같은 보안 설정이 필요할 수 있어요.",
        ],
      },
      {
        id: "steps",
        heading: "바이비트 → 업비트 출금 단계",
        steps: [
          "업비트에서 받을 코인의 입금 주소(와 태그/메모)를 복사합니다.",
          "바이비트 자산(Assets) → 출금(Withdraw)을 누르고 같은 코인을 고릅니다.",
          "출금 주소에 업비트 주소를 붙여 넣고, 네트워크를 업비트 입금 네트워크와 똑같이 고릅니다. 태그/메모가 있으면 꼭 입력합니다.",
          "받는 거래소(플랫폼)를 묻는 창이 나오면 업비트(Upbit)를 고르고, 받는 사람 정보(본인 이름)를 입력합니다.",
          "처음에는 소액만 보내고, 이메일·OTP 인증을 마쳐 출금을 신청합니다.",
          "업비트 입출금 내역에서 입금이 반영됐는지 확인한 뒤 나머지를 보냅니다.",
          "업비트에서 코인을 원화로 팔고, 원화 출금으로 은행 계좌에 옮깁니다.",
        ],
        tip: "업비트 주소를 바이비트 '출금 주소록'에 등록해 두면 다음부터 주소를 잘못 붙여 넣을 일이 줄어듭니다.",
      },
      {
        id: "travel-rule",
        heading: "트래블룰: 100만원 이상 보낼 때",
        paragraphs: [
          "국내 거래소는 원화 환산 100만원 이상이 오갈 때 보내는 사람과 받는 사람이 누구인지 확인합니다. 해외 거래소에서 업비트로 들어오는 입금도 확인 대상이라, 업비트에서 '입금 확인'이나 계정주 확인 절차가 뜰 수 있어요. 안내대로 보낸 거래소(바이비트)와 본인 정보를 입력하면 입금이 반영됩니다.",
          "업비트가 입출금을 허용하는 해외 거래소 목록과 확인 방식은 바뀔 수 있습니다. 큰 금액을 보내기 전에는 업비트 고객센터의 최신 안내를 확인하세요.",
        ],
        link: { label: "업비트 고객센터 입출금 안내 →", href: UPBIT_VASP_URL },
      },
      {
        id: "trouble",
        heading: "업비트에 입금이 안 들어올 때",
        bullets: [
          "블록 컨펌을 기다리는 중일 수 있어요. 바이비트 출금 내역의 TXID로 진행 상황을 확인하세요.",
          "업비트에서 '입금 확인 필요'·'입금 대기' 상태면 앱 알림에서 계정주 확인이나 보낸 곳 정보를 입력하세요.",
          "이름이 다르거나 본인 계정이 아니면 입금이 반환될 수 있고, 반환할 때 수수료가 빠질 수 있습니다.",
          "태그/메모를 빠뜨렸다면 업비트 고객센터에 TXID·코인·금액·시각을 알려 복구를 문의하세요.",
        ],
      },
    ],
    faq: [
      {
        q: "바이비트에서 원화로 바로 출금할 수 있나요?",
        a: "아니요. 바이비트는 원화(KRW) 출금을 지원하지 않아요. 코인을 업비트·빗썸 같은 국내 거래소로 보낸 뒤 원화로 팔고 은행으로 출금해야 합니다.",
      },
      {
        q: "바이비트 출금 수수료는 얼마인가요?",
        a: "코인과 네트워크마다 정해져 있고 수시로 바뀝니다. 바이비트 출금 화면에 표시되는 수수료를 확인하세요. 같은 코인도 네트워크에 따라 차이가 큽니다.",
      },
      {
        q: "바이비트 출금은 얼마나 걸리나요?",
        a: "바이비트 처리와 블록 컨펌을 합쳐 보통 몇 분에서 수십 분입니다. 업비트에서 입금 확인 절차가 필요하면 그만큼 더 걸려요.",
      },
      {
        q: "바이비트에서 업비트로 보낸 코인이 반환됐어요.",
        a: "업비트 계정주와 보낸 사람 정보가 다르거나 확인 절차를 마치지 않으면 반환될 수 있어요. 업비트 알림과 입출금 내역에서 사유를 확인하세요.",
      },
    ],
  },

  futures: {
    slug: "futures",
    metaTitle: "바이비트 선물 거래 방법 (레버리지·교차/격리·청산·익절 손절)",
    description:
      "바이비트(Bybit) 선물 거래 방법을 처음부터 정리했어요. USDT 무기한 선물, 레버리지 설정, 교차·격리 마진 차이, 청산 가격, 시장가·지정가 주문, 익절(TP)·손절(SL) 설정, 펀딩비와 수수료까지.",
    socialDescription: "바이비트 선물 처음이라면 — 레버리지·마진 모드·청산·익절 손절 설정법.",
    keywords: [
      "바이비트 선물",
      "바이비트 선물 거래",
      "바이비트 선물 거래 방법",
      "바이비트 레버리지",
      "바이비트 격리 교차",
      "바이비트 청산",
      "바이비트 익절 손절",
      "바이비트 숏",
      "바이비트 롱 숏",
      "Bybit 선물",
    ],
    navTitle: "바이비트 선물 거래 방법",
    navBlurb: "레버리지·마진 모드·청산·익절 손절",
    eyebrow: "Bybit 바이비트 선물 가이드",
    h1: "바이비트 선물 거래 방법",
    lead:
      "선물은 코인을 직접 사지 않고 가격이 오를지(롱) 내릴지(숏)에 거는 거래예요. 레버리지로 수익과 손실이 함께 커지기 때문에, 주문 전에 마진 모드·청산 가격·손절부터 이해하는 게 먼저입니다.",
    sections: [
      {
        id: "prepare",
        heading: "선물 거래 준비",
        steps: [
          "바이비트 KYC를 마치고 USDT를 입금합니다. (업비트에서 보내는 법은 입금 가이드 참고)",
          "통합 거래 계정(Unified Trading Account)에 USDT가 있는지 확인합니다. 다른 계정에 있으면 '이체'로 옮깁니다.",
          "하단 파생상품(Derivatives) 또는 거래 → 무기한(Perpetual)에서 BTCUSDT 같은 계약을 고릅니다.",
        ],
      },
      {
        id: "margin",
        heading: "교차 마진과 격리 마진",
        table: [
          ["구분", "교차 (Cross)", "격리 (Isolated)"],
          ["담보", "계정의 가용 잔고 전체", "그 포지션에 넣은 증거금만"],
          ["청산될 때", "계정 잔고 전체가 위험", "그 포지션 증거금까지만 손실"],
          ["추천", "포지션 여러 개를 함께 관리할 때", "처음 시작할 때, 손실 한도를 정하고 싶을 때"],
        ],
        paragraphs: ["처음이라면 격리 마진, 낮은 레버리지로 시작하는 걸 권해요."],
      },
      {
        id: "leverage",
        heading: "레버리지와 청산 가격",
        bullets: [
          "레버리지는 주문 창 위쪽 배율(예: 10x)을 눌러 바꿉니다. 최대 배율은 코인과 포지션 크기마다 다릅니다.",
          "10배 레버리지면 가격이 약 10% 반대로 움직일 때 격리 증거금 대부분을 잃고 청산될 수 있어요. 배율이 높을수록 청산 가격이 진입가에 가까워집니다.",
          "주문 전 화면에 표시되는 '예상 청산 가격'을 꼭 확인하세요.",
        ],
      },
      {
        id: "order",
        heading: "주문 넣기: 롱·숏, 시장가·지정가",
        steps: [
          "주문 유형을 고릅니다. 지정가(Limit)는 원하는 가격에 걸어 두고, 시장가(Market)는 바로 체결됩니다.",
          "수량(USDT 금액 또는 코인 수량)을 입력합니다.",
          "익절(TP)·손절(SL) 가격을 함께 입력합니다. 주문과 동시에 걸어 두는 게 가장 안전해요.",
          "오를 것 같으면 '매수/롱(Buy/Long)', 내릴 것 같으면 '매도/숏(Sell/Short)'을 누릅니다.",
          "포지션 탭에서 진입가·청산 가격·미실현 손익을 확인하고, '청산(Close)'으로 포지션을 닫습니다.",
        ],
        tip: "지정가 주문은 메이커 수수료(0.02%)가 붙어 시장가(0.055%)보다 쌉니다. (일반 등급 기준)",
      },
      {
        id: "costs",
        heading: "선물 거래 비용",
        bullets: [
          "거래 수수료: 진입할 때와 닫을 때 각각 포지션 크기 기준으로 붙습니다.",
          "펀딩비: 무기한 계약은 보통 8시간마다 롱·숏끼리 펀딩비를 주고받아요. 정산 시점에 포지션이 있을 때만 붙습니다.",
          "자세한 수수료율은 수수료 가이드를 확인하세요.",
        ],
      },
      {
        id: "risk",
        heading: "꼭 알아 둘 위험",
        paragraphs: [
          "선물은 원금 전부를 짧은 시간에 잃을 수 있는 고위험 거래입니다. 잃어도 되는 금액만, 낮은 레버리지와 손절을 걸고 시작하세요. 이 글은 사용법 안내이며 투자 권유가 아닙니다.",
        ],
      },
    ],
    faq: [
      {
        q: "바이비트 선물은 최대 몇 배까지 되나요?",
        a: "코인과 포지션 크기에 따라 다르고, 계약마다 주문 창에 최대 배율이 표시됩니다. 포지션이 커질수록 쓸 수 있는 최대 배율은 낮아집니다.",
      },
      {
        q: "교차와 격리 중 무엇을 써야 하나요?",
        a: "처음이라면 격리 마진을 권해요. 그 포지션에 넣은 증거금까지만 잃기 때문에 손실 한도를 정하기 쉽습니다.",
      },
      {
        q: "청산되면 어떻게 되나요?",
        a: "가격이 청산 가격에 닿으면 포지션이 강제로 닫히고, 격리 마진이라면 그 포지션의 증거금 대부분을 잃습니다. 손절(SL)을 걸어 두면 청산 전에 손실을 끊을 수 있어요.",
      },
      {
        q: "바이비트에서 숏(공매도)도 할 수 있나요?",
        a: "네. 선물에서 '매도/숏'으로 진입하면 가격이 내릴 때 수익이 납니다. 업비트 같은 국내 거래소 현물로는 할 수 없는 거래예요.",
      },
    ],
  },

  "vs-upbit": {
    slug: "vs-upbit",
    metaTitle: "업비트 vs 바이비트 차이 비교 (수수료·선물·원화 입출금·안전성)",
    description:
      "업비트와 바이비트(Bybit) 무엇이 다를까? 원화 입출금, 거래 수수료(업비트 0.05%·바이비트 0.1%), 선물·숏 지원, 코인 종류, 국내 신고·이용자 보호까지 표로 비교하고, 둘을 같이 쓰는 방법을 정리했어요.",
    socialDescription: "업비트 vs 바이비트 — 수수료·선물·원화·안전성 한눈에 비교.",
    keywords: [
      "업비트 바이비트 차이",
      "업비트 vs 바이비트",
      "바이비트 업비트 비교",
      "해외 거래소 추천",
      "바이비트 안전",
      "바이비트 국내",
      "업비트 선물",
      "업비트 숏",
    ],
    navTitle: "업비트 vs 바이비트 비교",
    navBlurb: "수수료·선물·원화·안전성 비교",
    eyebrow: "업비트 · 바이비트 비교",
    h1: "업비트 vs 바이비트, 무엇이 다를까",
    lead:
      "업비트는 원화로 코인을 사고파는 국내 거래소이고, 바이비트는 선물·숏 같은 파생상품이 강한 해외 거래소예요. 그래서 많은 사람이 원화 입출금은 업비트, 선물 거래는 바이비트로 나눠 씁니다.",
    sections: [
      {
        id: "table",
        heading: "한눈에 비교",
        table: [
          ["항목", "업비트", "바이비트"],
          ["원화(KRW) 입출금", "가능 (은행 계좌 연결)", "불가 — 코인으로 입출금"],
          ["현물 거래 수수료", "원화 마켓 0.05%", "0.1% (일반 등급)"],
          ["선물·숏", "없음 (현물만)", "무기한·선물·옵션 지원"],
          ["레버리지", "없음", "있음 (코인별 최대 배율 다름)"],
          ["국내 신고", "금융정보분석원(FIU) 신고 사업자", "FIU 미신고 해외 사업자"],
          ["이용자 보호", "국내 가상자산이용자보호법 적용", "국내법 보호 대상 아님"],
          ["한국어 지원", "기본", "앱·웹 한국어 선택 가능"],
        ],
        paragraphs: ["수수료는 일반 등급 기준이며 이벤트·정책에 따라 바뀔 수 있습니다."],
      },
      {
        id: "upbit-good",
        heading: "업비트가 나은 경우",
        bullets: [
          "원화로 바로 코인을 사고팔고, 은행으로 바로 출금하고 싶을 때",
          "현물만 장기로 모아 갈 때 (원화 마켓 수수료가 더 낮음)",
          "국내 규제와 이용자 보호 안에서 거래하고 싶을 때",
        ],
      },
      {
        id: "bybit-good",
        heading: "바이비트가 나은 경우",
        bullets: [
          "하락장에서 숏으로 대응하거나 선물로 헤지하고 싶을 때",
          "국내에 상장되지 않은 코인을 거래하고 싶을 때",
          "카피 트레이딩·옵션 같은 다양한 상품을 써 보고 싶을 때",
        ],
      },
      {
        id: "together",
        heading: "둘을 같이 쓰는 흐름",
        steps: [
          "업비트에서 원화로 코인을 삽니다.",
          "바이비트 입금 주소로 보냅니다. (입금 가이드 참고)",
          "바이비트에서 현물·선물 거래를 합니다.",
          "다시 업비트로 보내 원화로 팔고 출금합니다. (출금 가이드 참고)",
        ],
      },
      {
        id: "notice",
        heading: "알아 둘 점",
        paragraphs: [
          "바이비트는 한국 금융정보분석원(FIU)에 신고한 사업자가 아니어서, 국내 정책에 따라 국내 거래소와의 입출금·앱 설치가 제한될 수 있습니다. 해외 거래소에 둔 자산은 국내 이용자 보호 제도의 대상이 아니니, 필요한 만큼만 옮겨 쓰는 걸 권해요.",
        ],
      },
    ],
    faq: [
      {
        q: "업비트에서 선물이나 숏을 할 수 있나요?",
        a: "아니요. 업비트는 현물 거래만 지원합니다. 숏·레버리지 거래는 바이비트 같은 해외 거래소의 선물 상품에서 가능합니다.",
      },
      {
        q: "업비트와 바이비트 중 수수료가 싼 곳은?",
        a: "현물은 업비트 원화 마켓(0.05%)이 바이비트 현물(0.1%, 일반 등급)보다 쌉니다. 선물은 업비트에 없고, 바이비트 선물은 테이커 0.055%·메이커 0.02%입니다.",
      },
      {
        q: "바이비트는 안전한가요?",
        a: "바이비트는 규모가 큰 글로벌 거래소지만 한국 FIU 신고 사업자가 아니어서 국내 이용자 보호 제도가 적용되지 않습니다. 2단계 인증·출금 화이트리스트를 켜고, 필요한 금액만 두는 걸 권해요.",
      },
    ],
  },

  bonus: {
    slug: "bonus",
    metaTitle: "바이비트 가입 혜택·신규 보너스 받는 방법 (리워드 허브)",
    description:
      "바이비트(Bybit) 신규 가입 혜택과 보너스 받는 방법. 추천인 코드 입력, 리워드 허브에서 미션 확인, KYC·입금·거래 조건, 보너스 사용 기한과 출금 가능 여부까지 정리했어요.",
    socialDescription: "바이비트 신규 가입 혜택 — 추천인 코드부터 리워드 허브 미션까지.",
    keywords: [
      "바이비트 가입 혜택",
      "바이비트 보너스",
      "바이비트 신규 혜택",
      "바이비트 이벤트",
      "바이비트 리워드 허브",
      "바이비트 웰컴 보너스",
      "바이비트 쿠폰",
      "Bybit 보너스",
    ],
    navTitle: "바이비트 가입 혜택",
    navBlurb: "신규 보너스·리워드 허브 받는 법",
    eyebrow: "Bybit 바이비트 혜택 가이드",
    h1: "바이비트 가입 혜택과 신규 보너스 받는 방법",
    lead:
      "바이비트는 신규 가입자에게 미션을 마치면 보상을 주는 이벤트를 수시로 열어요. 혜택 내용은 시기·지역마다 바뀌지만, 받는 방법과 조건은 거의 비슷합니다.",
    sections: [
      {
        id: "how",
        heading: "신규 혜택 받는 순서",
        steps: [
          `추천 링크로 가입하거나, 가입 화면 '추천인 코드' 칸에 ${CODE}를 입력합니다. 계정을 만든 뒤에는 넣을 수 없어요.`,
          "KYC(본인인증)를 마칩니다. 대부분의 보상은 인증한 계정만 받을 수 있습니다.",
          "앱·웹의 리워드 허브(Rewards Hub)에서 진행 중인 신규 미션을 확인합니다.",
          "미션 조건(첫 입금 금액, 거래량 등)을 기간 안에 채웁니다.",
          "보상은 리워드 허브에서 직접 받기(Claim)를 눌러야 지급되는 경우가 많아요.",
        ],
        tip: "미션마다 참여 기간이 있어요. 가입하고 바로 리워드 허브를 열어 마감일부터 확인하세요.",
      },
      {
        id: "types",
        heading: "보상은 어떤 형태인가요",
        bullets: [
          "거래 수수료 쿠폰·선물 체험 자금처럼 거래에만 쓸 수 있는 보너스가 많습니다.",
          "보너스 자체는 바로 출금할 수 없고, 보너스로 거래해서 난 수익만 출금할 수 있는 경우가 일반적이에요.",
          "보상마다 사용 기한이 있어 기한이 지나면 사라집니다.",
          "정확한 조건은 각 이벤트의 약관(Terms)에 적혀 있으니 참여 전에 확인하세요.",
        ],
      },
      {
        id: "jjintu",
        heading: "찐투 레퍼럴 가입 추가 혜택",
        paragraphs: [
          `추천인 코드 ${CODE}로 바이비트에 가입하면, 바이비트 혜택과 별개로 찐투 AI 유튜브 요약 한도를 하루 5회에서 20회로 늘려 드려요. 가입 안내 페이지의 '가입 이메일 보내기'로 신청하면 됩니다.`,
        ],
      },
    ],
    faq: [
      {
        q: "바이비트 가입 보너스는 바로 출금할 수 있나요?",
        a: "대부분의 보너스는 거래에만 쓸 수 있고 바로 출금할 수 없어요. 보너스로 거래해 생긴 수익은 조건을 채우면 출금할 수 있는 경우가 많습니다. 이벤트 약관을 확인하세요.",
      },
      {
        q: "가입한 뒤에 추천인 코드를 넣어도 혜택을 받나요?",
        a: "일반 추천인 코드는 계정 생성 후 추가할 수 없어요. 가입 버튼을 누르기 전에 코드를 확인하세요.",
      },
      {
        q: "지금 진행 중인 바이비트 이벤트는 어디서 보나요?",
        a: "바이비트 앱·웹의 리워드 허브(Rewards Hub)와 공지(Announcements)에서 확인할 수 있어요. 혜택은 지역과 시기에 따라 다릅니다.",
      },
    ],
  },
};

// ── English ──────────────────────────────────────────────

const EN: Record<BybitGuideSlug, BybitGuide> = {
  deposit: {
    slug: "deposit",
    metaTitle: "How to Deposit Crypto to Bybit (Address, Network, Travel Rule)",
    description:
      "Step-by-step guide to depositing crypto to Bybit from another exchange or wallet: copying the deposit address, choosing the right network and memo/tag, Travel Rule checks, and fixing pending or missing deposits.",
    socialDescription: "Deposit to Bybit in 7 steps — address, network, memo/tag and Travel Rule.",
    keywords: [
      "Bybit deposit",
      "how to deposit to Bybit",
      "Bybit deposit address",
      "Bybit deposit network",
      "Bybit deposit not received",
      "Bybit travel rule",
      "transfer crypto to Bybit",
    ],
    navTitle: "Deposit to Bybit",
    navBlurb: "Address, network and Travel Rule, step by step",
    eyebrow: "Bybit deposit guide",
    h1: "How to deposit crypto to Bybit",
    lead:
      "Most people fund Bybit by sending crypto from another exchange or wallet. Get three things right — address, network and Travel Rule details — and it's simple.",
    sections: [
      {
        id: "before",
        heading: "Before you send",
        bullets: [
          "Finish Bybit KYC first. Many exchanges check that the receiving account belongs to the same person.",
          "Your name and date of birth should match on both exchanges.",
          "Make sure both sides support the same coin on the same network (chain).",
          "Check whether your sending exchange allows withdrawals to Bybit — supported counterparties change over time.",
        ],
      },
      {
        id: "steps",
        heading: "Deposit steps",
        steps: [
          "Buy the coin you'll send on your source exchange. Fast, low-fee coins are popular.",
          "On Bybit, go to Assets → Deposit and pick the same coin.",
          "Pick the exact same network as your withdrawal and copy the deposit address — plus the memo/tag if shown.",
          "On the source exchange, start a withdrawal and select Bybit as the receiving platform if asked.",
          "Paste the address (and memo/tag) and send a small test amount first.",
          "Complete any 2FA or confirmation on the sending side.",
          "Confirm the deposit arrived on Bybit, then send the rest.",
        ],
        tip: "A wrong address, network or memo can mean lost funds. Always test with a small amount first.",
      },
      {
        id: "travel-rule",
        heading: "Travel Rule checks",
        paragraphs: [
          "Under the Travel Rule, exchanges share sender and recipient details for larger transfers. Your sending exchange may ask which platform you're sending to, and Bybit may ask where the deposit came from. Answer accurately and the deposit is credited.",
        ],
      },
      {
        id: "pending",
        heading: "Deposit pending or not received",
        bullets: [
          "Not enough block confirmations yet is the most common reason — track the TXID.",
          "Bybit may be waiting for source details; check app notifications and the Assets page.",
          "Missing memo/tag or wrong network: contact Bybit live chat with the TXID, time, coin and amount. Recovery isn't guaranteed and may cost a fee.",
        ],
      },
    ],
    faq: [
      {
        q: "Does Bybit charge deposit fees?",
        a: "Bybit doesn't charge for crypto deposits. You only pay the sending side's withdrawal or network fee.",
      },
      {
        q: "How long does a Bybit deposit take?",
        a: "From a few minutes to tens of minutes depending on the coin and network congestion.",
      },
      {
        q: "I forgot the memo/tag. What now?",
        a: "Contact Bybit support with the TXID, time, coin and amount. Recovery may be possible but isn't guaranteed.",
      },
    ],
  },

  kyc: {
    slug: "kyc",
    metaTitle: "Bybit KYC Verification: How to Pass and Fix Failures",
    description:
      "How to complete Bybit KYC identity verification and fix common failures: accepted IDs, photo rules, face check errors, the 5-attempts-in-24-hours limit, review times (about 15 minutes to 48 hours), resubmission and appeals.",
    socialDescription: "Bybit KYC failed? Reasons and fixes, from Bybit's official guidance.",
    keywords: [
      "Bybit KYC",
      "Bybit verification",
      "Bybit KYC failed",
      "Bybit KYC rejected",
      "Bybit identity verification",
      "Bybit KYC time",
    ],
    navTitle: "Bybit KYC",
    navBlurb: "How to verify and fix failures",
    eyebrow: "Bybit KYC guide",
    h1: "Bybit KYC verification: how to pass and fix failures",
    lead:
      "Bybit requires at least Standard KYC for all products and services. With a good ID photo and face check, it usually takes about 15 minutes.",
    sections: [
      {
        id: "how",
        heading: "How to verify",
        steps: [
          "Log in and tap Get Verified / Verify Now on your profile or dashboard.",
          "Choose the issuing country and ID type: passport, national ID, driving licence or residence permit.",
          "Photograph the physical ID front and back with all four corners visible.",
          "Follow the on-screen face check (selfie and head turn).",
          "Get the result by email and on the verification page — usually about 15 minutes, up to 48 hours.",
        ],
        tip: "Bright light, no glare, steady camera. Photo quality causes most failures.",
      },
      {
        id: "fail",
        heading: "Failure reasons and fixes",
        table: [
          ["Reason", "Fix"],
          ["Blurry, cropped or glare", "Retake with all four corners, no glare"],
          ["Scan, screenshot or black-and-white", "Photograph the physical ID in color; no editing apps"],
          ["Expired ID", "Use a valid document"],
          ["Face doesn't match", "Same person as the ID, alone, face uncovered"],
          ["Poor selfie", "Good light, face centered, turn slowly"],
          ["ID used on another account", "One verified account per person"],
          ["Rejected 5+ times in 24h", "Wait 24 hours, then retry"],
          ["Restricted country or under 18", "Not eligible (appeal via a support case)"],
        ],
        link: { label: "Bybit official: KYC failure reasons →", href: BYBIT_KYC_FAIL_URL },
      },
      {
        id: "resubmit",
        heading: "Resubmitting",
        bullets: [
          "Read the reason in the rejection email or via the [?] icon on the verification page.",
          "Fix it and tap Verify Now again — results usually arrive in 15–20 minutes.",
          "No email? Check spam, then contact live chat or submit a case.",
        ],
      },
    ],
    faq: [
      {
        q: "Can I trade on Bybit without KYC?",
        a: "No. Bybit requires at least Standard verification for all products and services.",
      },
      {
        q: "How long does Bybit KYC take?",
        a: "Usually about 15 minutes, sometimes up to 48 hours. Resubmissions usually return in 15–20 minutes.",
      },
      {
        q: "Can I appeal a KYC rejection?",
        a: "Yes — submit a case (support ticket) to Bybit.",
      },
    ],
  },

  fees: {
    slug: "fees",
    metaTitle: "Bybit Fees Explained (Spot, Futures Maker/Taker, VIP, Withdrawals)",
    description:
      "Bybit trading fees at the base (VIP 0) tier: spot 0.1%, perpetuals and futures 0.055% taker / 0.02% maker. Maker vs taker, funding fees, VIP tiers, deposit and withdrawal fees, and how to pay less.",
    socialDescription: "Bybit spot 0.1% · futures 0.055% / 0.02% — fee structure and how to save.",
    keywords: [
      "Bybit fees",
      "Bybit trading fees",
      "Bybit futures fees",
      "Bybit maker taker fee",
      "Bybit funding fee",
      "Bybit withdrawal fee",
      "Bybit VIP",
    ],
    navTitle: "Bybit fees",
    navBlurb: "Spot and futures fees, and how to save",
    eyebrow: "Bybit fee guide",
    h1: "Bybit fees explained",
    lead:
      "At the base VIP 0 tier, Bybit spot is 0.1%, and perpetuals/futures are 0.055% taker and 0.02% maker. What you actually pay depends on order type and tier.",
    sections: [
      {
        id: "rates",
        heading: "Trading fees (VIP 0)",
        table: [
          ["Product", "Taker", "Maker"],
          ["Spot (crypto-crypto)", "0.1000%", "0.1000%"],
          ["Perpetual & futures", "0.0550%", "0.0200%"],
          ["Options", "0.0300%", "0.0200%"],
        ],
        paragraphs: ["From Bybit's official fee structure for VIP 0. Rates can change — check before trading."],
        link: { label: "Bybit official fee structure →", href: BYBIT_FEE_URL },
      },
      {
        id: "maker-taker",
        heading: "Maker vs taker",
        bullets: [
          "Taker: fills an existing order immediately (e.g., market orders). Higher fee.",
          "Maker: adds a limit order to the book. On futures it's well under half the taker fee.",
          "Example: open and close a 1,000 USDT futures position with market orders ≈ 1.1 USDT; with limit orders ≈ 0.4 USDT. Fees apply to position size, not margin.",
        ],
      },
      {
        id: "funding",
        heading: "Funding fees",
        paragraphs: [
          "Perpetual contracts exchange funding between longs and shorts, typically every 8 hours. It's paid between traders, not to Bybit, and only if you hold a position at settlement.",
        ],
      },
      {
        id: "save",
        heading: "How to pay less",
        bullets: [
          "Use limit (maker) orders when you can.",
          "Higher volume or balances unlock VIP tiers with lower rates.",
          `Sign up with referral code ${CODE} for current new-user rewards (subject to Bybit policy).`,
        ],
      },
    ],
    faq: [
      {
        q: "What are Bybit futures fees?",
        a: "At VIP 0, perpetual and futures contracts are 0.055% taker and 0.02% maker.",
      },
      {
        q: "What are Bybit spot fees?",
        a: "At VIP 0, spot (crypto-crypto) is 0.1% for both maker and taker.",
      },
      {
        q: "Does leverage increase fees?",
        a: "Fees are charged on position size, so 10× leverage on the same margin means 10× the fee.",
      },
    ],
  },

  app: {
    slug: "app",
    metaTitle: "Bybit App: Download and How to Use It",
    description:
      "How to install the official Bybit app safely and use it: entering a referral code when signing up in-app, finding deposit, spot and futures menus, and essential security settings.",
    socialDescription: "Bybit app — safe install, referral code, key menus and security.",
    keywords: ["Bybit app", "Bybit app download", "how to use Bybit app", "Bybit mobile app", "Bybit app tutorial"],
    navTitle: "Bybit app guide",
    navBlurb: "Install, referral code, menus, security",
    eyebrow: "Bybit app guide",
    h1: "Bybit app: download and how to use it",
    lead:
      "The same Bybit account works on web and app. Install only from official sources, and if you sign up in-app, check the referral code field before creating the account.",
    sections: [
      {
        id: "install",
        heading: "Install the official app",
        steps: [
          "Open the iOS or Android link from the download page on bybit.com.",
          "Check the developer is Bybit and the app has plenty of downloads and reviews.",
          "Never install APKs or links from unknown sources or messengers.",
        ],
        link: { label: "Bybit official download page →", href: BYBIT_DOWNLOAD_URL },
      },
      {
        id: "signup",
        heading: "Referral code when signing up in-app",
        bullets: [
          `Enter ${CODE} in the Referral Code (optional) field on the sign-up screen.`,
          "A regular referral code can't be added after the account is created.",
        ],
      },
      {
        id: "menus",
        heading: "Where to find things",
        table: [
          ["Task", "In the app"],
          ["Deposit", "Home or Assets → Deposit"],
          ["Spot trading", "Trade → Spot"],
          ["Futures", "Derivatives or Trade → Perpetual"],
          ["Withdraw", "Assets → Withdraw"],
          ["KYC", "Profile → Identity Verification"],
          ["Security", "Profile → Account & Security"],
        ],
      },
      {
        id: "security",
        heading: "Security settings",
        bullets: [
          "Turn on Google Authenticator (2FA).",
          "Set an anti-phishing code.",
          "Enable a withdrawal address whitelist.",
          "Lock the app with Face ID or fingerprint.",
        ],
      },
    ],
    faq: [
      {
        q: "Are app and web accounts separate?",
        a: "No. One account works on both, with the same assets and orders.",
      },
      {
        q: "Where do I enter the referral code in the app?",
        a: `In the Referral Code (optional) field on the sign-up screen: ${CODE}. It can't be added later.`,
      },
    ],
  },
  withdraw: {
    slug: "withdraw",
    metaTitle: "How to Withdraw from Bybit (Address, Network, Travel Rule)",
    description:
      "How to withdraw crypto from Bybit to another exchange or wallet: copying the receiving address, matching network and memo/tag, address book, Travel Rule recipient details, and fixing pending or returned deposits.",
    socialDescription: "Withdraw from Bybit step by step — network, memo/tag and Travel Rule.",
    keywords: ["Bybit withdraw", "how to withdraw from Bybit", "Bybit withdrawal", "Bybit withdrawal travel rule", "Bybit withdrawal pending"],
    navTitle: "Withdraw from Bybit",
    navBlurb: "Address, network and Travel Rule",
    eyebrow: "Bybit withdrawal guide",
    h1: "How to withdraw from Bybit",
    lead:
      "To cash out, send crypto from Bybit to an exchange that supports your local currency, then sell it there. Match the address, network and Travel Rule details and it's straightforward.",
    sections: [
      {
        id: "steps",
        heading: "Withdrawal steps",
        steps: [
          "On the receiving exchange, copy the deposit address (and memo/tag) for the coin.",
          "On Bybit, go to Assets → Withdraw and pick the same coin.",
          "Paste the address and pick the exact same network. Enter the memo/tag if there is one.",
          "If asked, choose the receiving platform and enter the recipient's details (yourself).",
          "Send a small test amount first and complete email/2FA verification.",
          "Once it arrives, send the rest.",
        ],
        tip: "Save the address in Bybit's address book to avoid paste mistakes next time.",
      },
      {
        id: "travel-rule",
        heading: "Travel Rule",
        paragraphs: [
          "For larger transfers, exchanges share sender and recipient details. The receiving exchange may ask you to confirm the deposit's source before crediting it. Names must match on both accounts.",
        ],
      },
      {
        id: "trouble",
        heading: "Deposit pending or returned",
        bullets: [
          "Check confirmations with the TXID from Bybit's withdrawal history.",
          "Look for a 'confirm deposit source' prompt on the receiving exchange.",
          "Mismatched names or someone else's account can cause a return, minus fees.",
        ],
      },
    ],
    faq: [
      {
        q: "Can I withdraw fiat directly from Bybit?",
        a: "It depends on your region. A common route is sending crypto to a local exchange and selling it there.",
      },
      {
        q: "What are Bybit withdrawal fees?",
        a: "They're set per coin and network and change over time — check the amount shown on the withdrawal screen.",
      },
    ],
  },

  futures: {
    slug: "futures",
    metaTitle: "How to Trade Futures on Bybit (Leverage, Cross vs Isolated, TP/SL)",
    description:
      "A beginner's guide to Bybit futures: USDT perpetuals, setting leverage, cross vs isolated margin, liquidation price, market and limit orders, take-profit and stop-loss, plus funding and fees.",
    socialDescription: "Bybit futures for beginners — leverage, margin modes, liquidation and TP/SL.",
    keywords: ["Bybit futures", "how to trade futures on Bybit", "Bybit leverage", "Bybit cross isolated margin", "Bybit liquidation", "Bybit stop loss", "Bybit short"],
    navTitle: "Bybit futures guide",
    navBlurb: "Leverage, margin modes, liquidation, TP/SL",
    eyebrow: "Bybit futures guide",
    h1: "How to trade futures on Bybit",
    lead:
      "Futures let you bet on price going up (long) or down (short) without owning the coin. Leverage magnifies gains and losses, so learn margin modes, liquidation and stop-losses before your first order.",
    sections: [
      {
        id: "margin",
        heading: "Cross vs isolated margin",
        table: [
          ["", "Cross", "Isolated"],
          ["Collateral", "Your whole available balance", "Only the margin in that position"],
          ["On liquidation", "Whole balance at risk", "Loss capped at that position's margin"],
          ["Best for", "Managing several positions", "Beginners, fixed loss limits"],
        ],
      },
      {
        id: "leverage",
        heading: "Leverage and liquidation",
        bullets: [
          "Change leverage from the multiplier above the order form. Max leverage varies by contract and position size.",
          "At 10×, a roughly 10% move against you can liquidate most of an isolated position's margin.",
          "Always check the estimated liquidation price before ordering.",
        ],
      },
      {
        id: "order",
        heading: "Placing an order",
        steps: [
          "Pick Limit (your price) or Market (instant).",
          "Enter the size.",
          "Set take-profit (TP) and stop-loss (SL) with the order.",
          "Tap Buy/Long or Sell/Short.",
          "Manage it in the Positions tab and Close when done.",
        ],
        tip: "Limit orders pay the maker fee (0.02%) instead of taker (0.055%) at VIP 0.",
      },
      {
        id: "risk",
        heading: "Risk",
        paragraphs: ["Futures can wipe out your margin quickly. Use small size, low leverage and a stop-loss. This is a how-to, not investment advice."],
      },
    ],
    faq: [
      {
        q: "Cross or isolated — which should I use?",
        a: "Start with isolated: your loss is capped at the margin in that position.",
      },
      {
        q: "Can I short on Bybit?",
        a: "Yes. Open a Sell/Short futures position to profit when the price falls.",
      },
    ],
  },

  "vs-upbit": {
    slug: "vs-upbit",
    metaTitle: "Upbit vs Bybit: Fees, Futures, KRW and Safety Compared",
    description:
      "Upbit vs Bybit compared: KRW deposits and withdrawals, spot fees (Upbit 0.05% vs Bybit 0.1%), futures and shorting, Korean registration and user protection — and how Korean traders use both.",
    socialDescription: "Upbit vs Bybit — fees, futures, KRW and safety at a glance.",
    keywords: ["Upbit vs Bybit", "Bybit Upbit difference", "Upbit futures", "Korean crypto exchange vs Bybit"],
    navTitle: "Upbit vs Bybit",
    navBlurb: "Fees, futures, KRW and safety",
    eyebrow: "Upbit vs Bybit",
    h1: "Upbit vs Bybit: what's the difference?",
    lead:
      "Upbit is Korea's largest won-based spot exchange; Bybit is a global exchange strong in derivatives. Many Korean traders use Upbit for KRW in and out and Bybit for futures.",
    sections: [
      {
        id: "table",
        heading: "At a glance",
        table: [
          ["", "Upbit", "Bybit"],
          ["KRW deposits/withdrawals", "Yes (bank link)", "No — crypto only"],
          ["Spot fee", "0.05% (KRW market)", "0.1% (VIP 0)"],
          ["Futures & shorting", "No (spot only)", "Perpetuals, futures, options"],
          ["Korean registration", "Registered with Korea's FIU", "Not registered with Korea's FIU"],
        ],
      },
      {
        id: "together",
        heading: "Using both",
        steps: [
          "Buy crypto with KRW on Upbit.",
          "Send it to your Bybit deposit address.",
          "Trade spot or futures on Bybit.",
          "Send back to Upbit, sell for KRW and withdraw.",
        ],
      },
    ],
    faq: [
      {
        q: "Does Upbit offer futures?",
        a: "No. Upbit is spot-only; shorting and leverage need a derivatives exchange like Bybit.",
      },
    ],
  },

  bonus: {
    slug: "bonus",
    metaTitle: "Bybit Sign-up Bonus: How to Claim New-User Rewards",
    description:
      "How to get Bybit new-user rewards: entering a referral code, finding missions in the Rewards Hub, KYC/deposit/trading conditions, expiry dates and whether bonuses can be withdrawn.",
    socialDescription: "Bybit new-user rewards — from referral code to Rewards Hub missions.",
    keywords: ["Bybit bonus", "Bybit sign up bonus", "Bybit welcome bonus", "Bybit rewards hub", "Bybit new user rewards"],
    navTitle: "Bybit sign-up bonus",
    navBlurb: "New-user rewards and Rewards Hub",
    eyebrow: "Bybit rewards guide",
    h1: "Bybit sign-up bonus: how to claim new-user rewards",
    lead:
      "Bybit regularly runs new-user missions with rewards. Details change by region and time, but the way to claim them is much the same.",
    sections: [
      {
        id: "how",
        heading: "How to claim",
        steps: [
          `Sign up via a referral link or enter ${CODE} in the Referral Code field — it can't be added later.`,
          "Complete KYC; most rewards require a verified account.",
          "Open the Rewards Hub and check the current new-user missions.",
          "Meet the conditions (first deposit, trading volume…) before the deadline.",
          "Tap Claim in the Rewards Hub if required.",
        ],
      },
      {
        id: "types",
        heading: "What the rewards look like",
        bullets: [
          "Often fee coupons or trial funds usable only for trading.",
          "Bonuses usually can't be withdrawn directly; profits made with them often can.",
          "Rewards expire — check each event's terms.",
        ],
      },
    ],
    faq: [
      {
        q: "Can I withdraw a Bybit bonus?",
        a: "Usually not directly. Profits made with a bonus can often be withdrawn once conditions are met — see the event terms.",
      },
    ],
  },
};

export function getBybitGuide(slug: BybitGuideSlug, locale: string): BybitGuide {
  return (locale === "en" ? EN : KO)[slug];
}

export function getBybitGuides(locale: string): BybitGuide[] {
  return BYBIT_GUIDE_SLUGS.map((slug) => getBybitGuide(slug, locale));
}
