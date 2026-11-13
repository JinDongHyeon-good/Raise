/**
 * 자주 묻는 질문 (/faq) — 화면과 구조화 데이터(FAQPage)가 같은 내용을 쓴다.
 * 답변은 실제 동작과 맞아야 한다: 한도 숫자 등은 src/lib/ai-quota.ts 기준.
 * link 가 있으면 답변 아래에 관련 페이지 링크를 단다.
 */
import type { AppLocale } from "@/i18n/routing";

export type FaqCategoryId = "service" | "ai" | "video" | "chart" | "community" | "account" | "bybit" | "privacy";

export type FaqItem = {
  id: string;
  category: FaqCategoryId;
  q: string;
  a: string;
  link?: { href: string; label: string };
};

export type FaqCategory = { id: FaqCategoryId; label: string; icon: string };

const CATEGORIES: Record<"ko" | "en", FaqCategory[]> = {
  ko: [
    { id: "service", label: "서비스", icon: "✦" },
    { id: "ai", label: "AI 요약", icon: "✧" },
    { id: "video", label: "영상", icon: "▶" },
    { id: "chart", label: "차트", icon: "↗" },
    { id: "community", label: "커뮤니티", icon: "✎" },
    { id: "account", label: "계정·로그인", icon: "◎" },
    { id: "bybit", label: "바이비트", icon: "₿" },
    { id: "privacy", label: "개인정보", icon: "⛉" },
  ],
  en: [
    { id: "service", label: "Service", icon: "✦" },
    { id: "ai", label: "AI summaries", icon: "✧" },
    { id: "video", label: "Videos", icon: "▶" },
    { id: "chart", label: "Charts", icon: "↗" },
    { id: "community", label: "Community", icon: "✎" },
    { id: "account", label: "Account", icon: "◎" },
    { id: "bybit", label: "Bybit", icon: "₿" },
    { id: "privacy", label: "Privacy", icon: "⛉" },
  ],
};

const ITEMS_KO: FaqItem[] = [
  {
    id: "what",
    category: "service",
    q: "찐투는 어떤 서비스인가요?",
    a: "여러 유튜버의 코인·주식 분석 영상을 한곳에 모아 보고, 긴 영상은 AI로 핵심만 빠르게 요약하고, 내 채널·키워드별로 골라 보며 비교하는 서비스입니다. 코인·미국 지수 실시간 차트와 투자자 커뮤니티도 함께 있습니다.",
  },
  {
    id: "free",
    category: "service",
    q: "이용료가 있나요?",
    a: "무료입니다. 영상 보기, 차트, 커뮤니티 읽기는 로그인 없이도 쓸 수 있고, AI 요약·글쓰기·즐겨찾기는 무료 회원가입 후 쓸 수 있습니다.",
  },
  {
    id: "advice",
    category: "service",
    q: "투자 추천이나 매매 신호를 주나요?",
    a: "아니요. AI 요약은 영상에서 말한 내용을 정리할 뿐이고, 차트와 커뮤니티 글도 참고 자료입니다. 투자 판단과 그 결과의 책임은 본인에게 있습니다.",
  },
  {
    id: "language",
    category: "service",
    q: "영어로도 볼 수 있나요?",
    a: "네. 화면 오른쪽 위 지구본 버튼으로 한국어와 영어를 바꿀 수 있고, 영어 화면에서는 AI 요약 결과도 영어로 나옵니다.",
  },
  {
    id: "ai-how",
    category: "ai",
    q: "AI 영상 요약은 어떻게 만들어지나요?",
    a: "영상 음성을 글로 받아 적은 뒤, 그 내용만으로 요약을 만듭니다. 요약의 각 문장은 받아 적은 원문과 다시 대조해, 근거가 확인되지 않은 문장과 숫자는 빼고 보여 줍니다. 문장을 누르면 영상의 해당 시점으로 이동합니다.",
  },
  {
    id: "ai-limit",
    category: "ai",
    q: "AI 요약은 하루에 몇 번 쓸 수 있나요?",
    a: "로그인한 계정당 하루 5회입니다(한국 시간 자정에 초기화). 같은 날 같은 영상을 다시 요약하면 횟수가 줄지 않습니다.",
  },
  {
    id: "ai-more",
    category: "ai",
    q: "요약 횟수를 늘릴 수 있나요?",
    a: "바이비트에 찐투 추천인 코드로 가입한 뒤 안내된 이메일로 알려 주시면, 확인 후 하루 20회로 늘려 드립니다.",
    link: { href: "/bybit#bybit-ai-bonus", label: "AI 요약 20회 혜택 보기" },
  },
  {
    id: "ai-time",
    category: "ai",
    q: "요약에 시간이 얼마나 걸리나요?",
    a: "영상 길이에 따라 다르며 보통 수십 초에서 몇 분 걸립니다. 한 번 만든 요약은 저장되어 다음부터는 바로 나옵니다.",
  },
  {
    id: "ai-fail",
    category: "ai",
    q: "요약이 안 되는 영상이 있어요.",
    a: "말소리가 거의 없는 영상, 아주 긴 영상, 재생이 제한된 영상은 요약되지 않을 수 있습니다. 실패하면 '다시 시도'를 눌러 보세요.",
  },
  {
    id: "video-which",
    category: "video",
    q: "어떤 영상이 나오나요?",
    a: "유튜브의 코인·주식 관련 영상을 검색해 보여 줍니다. 쇼츠와 라이브 방송은 목록에서 뺍니다.",
  },
  {
    id: "video-filter",
    category: "video",
    q: "정렬이나 영상 길이로 거를 수 있나요?",
    a: "필터 버튼에서 정렬(관련도·최신·조회수), 업로드 날짜, 영상 길이를 고를 수 있고, '기본값으로 저장'을 누르면 이 브라우저에서 다음에도 그대로 적용됩니다.",
  },
  {
    id: "video-favorite",
    category: "video",
    q: "좋아하는 채널만 모아 볼 수 있나요?",
    a: "로그인하면 채널을 즐겨찾기에 추가할 수 있고, 즐겨찾기한 채널의 영상을 따로 모아 볼 수 있습니다.",
  },
  {
    id: "chart-which",
    category: "chart",
    q: "어떤 차트를 볼 수 있나요?",
    a: "비트코인(BTC), 이더리움(ETH), 리플(XRP), 솔라나(SOL) 차트와 나스닥, 나스닥100, S&P500, 다우존스 지수 차트를 볼 수 있습니다.",
    link: { href: "/chart", label: "차트 보러 가기" },
  },
  {
    id: "chart-source",
    category: "chart",
    q: "차트 데이터는 어디서 오나요? 실시간인가요?",
    a: "코인 시세는 바이비트 공개 데이터, 미국 지수는 야후 파이낸스 데이터를 씁니다. 지수는 거래소 사정에 따라 지연될 수 있어 참고용으로만 보세요.",
  },
  {
    id: "community-boards",
    category: "community",
    q: "어떤 게시판이 있나요?",
    a: "자유게시판, 코인분석, 주식분석, 해외주식, 국내주식, 뉴스·정보, 질문, 손익인증 게시판이 있습니다. 추천순·조회순으로 인기 글을 볼 수 있습니다.",
    link: { href: "/community", label: "커뮤니티 가기" },
  },
  {
    id: "community-write",
    category: "community",
    q: "글을 쓰려면 로그인해야 하나요?",
    a: "글 읽기는 누구나 할 수 있고, 글·댓글 쓰기와 추천은 로그인 후 할 수 있습니다.",
  },
  {
    id: "community-report",
    category: "community",
    q: "광고나 불쾌한 글을 봤어요.",
    a: "문의 페이지의 이메일로 글 주소와 함께 알려 주시면 확인 후 조치합니다.",
    link: { href: "/contact", label: "문의하기" },
  },
  {
    id: "account-login",
    category: "account",
    q: "어떻게 가입하나요?",
    a: "Google 계정으로 바로 로그인하거나, 이메일과 비밀번호로 가입할 수 있습니다. 이메일 가입은 받은 인증 메일의 링크를 눌러야 AI 요약을 쓸 수 있습니다.",
  },
  {
    id: "account-password",
    category: "account",
    q: "비밀번호나 아이디를 잊어버렸어요.",
    a: "로그인 창의 '아이디 찾기'와 '비밀번호 재설정'을 이용하세요. 재설정 링크는 가입한 이메일로 보내 드립니다.",
  },
  {
    id: "account-mail",
    category: "account",
    q: "인증 메일이 오지 않아요.",
    a: "스팸함을 먼저 확인해 주세요. 몇 분이 지나도 없으면 다시 보내기를 누르거나, Google 로그인으로 가입해 보세요.",
  },
  {
    id: "bybit-why",
    category: "bybit",
    q: "바이비트 추천인 코드는 무엇인가요?",
    a: "찐투의 바이비트 추천인(레퍼럴) 코드는 XQZZ6O 입니다. 가입할 때 추천인 코드 칸에 넣거나 안내 페이지의 가입 링크로 가입하면 자동으로 들어갑니다.",
    link: { href: "/bybit", label: "바이비트 가입 방법 보기" },
  },
  {
    id: "bybit-later",
    category: "bybit",
    q: "이미 가입했는데 추천인 코드를 나중에 넣을 수 있나요?",
    a: "일반적으로 추천인 코드는 가입할 때만 넣을 수 있습니다. 가입 전에 코드가 입력됐는지 꼭 확인하세요.",
  },
  {
    id: "bybit-safe",
    category: "bybit",
    q: "추천인 코드로 가입하면 불리한 점이 있나요?",
    a: "없습니다. 수수료나 계정 조건은 똑같고, 바이비트가 신규 가입자에게 주는 이벤트 혜택도 그대로 받을 수 있습니다. 거주 국가에 따라 이용이 제한될 수 있으니 가입 전에 확인하세요.",
  },
  {
    id: "privacy-data",
    category: "privacy",
    q: "어떤 개인정보를 저장하나요?",
    a: "로그인에 필요한 이메일과 계정 정보, 작성한 글·댓글, 즐겨찾기, AI 사용 횟수를 저장합니다. 악용을 막기 위해 IP 주소는 원문이 아닌 되돌릴 수 없는 형태로만 기록합니다.",
    link: { href: "/privacy", label: "개인정보처리방침" },
  },
  {
    id: "privacy-delete",
    category: "privacy",
    q: "탈퇴하거나 정보를 지우고 싶어요.",
    a: "문의 페이지의 이메일로 가입한 이메일 주소와 함께 요청해 주시면 처리해 드립니다.",
    link: { href: "/contact", label: "문의하기" },
  },
];

const ITEMS_EN: FaqItem[] = [
  {
    id: "what",
    category: "service",
    q: "What is jjintu?",
    a: "A service that brings crypto and stock analysis videos from many YouTubers into one place, summarizes long videos with AI, and lets you follow your own channels and keywords to compare takes — with live crypto and US index charts and an investor community.",
  },
  {
    id: "free",
    category: "service",
    q: "Is it free?",
    a: "Yes. Videos, charts and reading the community work without an account. AI summaries, posting and favorites need a free account.",
  },
  {
    id: "advice",
    category: "service",
    q: "Do you give investment advice or trading signals?",
    a: "No. AI summaries only restate what the video says, and charts and posts are for reference. You are responsible for your own investment decisions.",
  },
  {
    id: "language",
    category: "service",
    q: "Is it available in Korean and English?",
    a: "Yes. Use the globe button at the top right to switch. On the English site, AI summaries are written in English too.",
  },
  {
    id: "ai-how",
    category: "ai",
    q: "How are AI video summaries made?",
    a: "The audio is transcribed first, and the summary is written from that transcript only. Each sentence is checked against the transcript, and anything — including numbers — that can't be verified is removed. Tap a sentence to jump to that moment in the video.",
  },
  {
    id: "ai-limit",
    category: "ai",
    q: "How many AI summaries can I use a day?",
    a: "5 per account per day, reset at midnight Korea time (KST). Re-opening the same video's summary on the same day doesn't count again.",
  },
  {
    id: "ai-more",
    category: "ai",
    q: "Can I get more summaries?",
    a: "Sign up on Bybit with our referral code and email us as described on the Bybit page. Once we check it, we raise your limit to 20 a day.",
    link: { href: "/bybit#bybit-ai-bonus", label: "See the 20-summary offer" },
  },
  {
    id: "ai-time",
    category: "ai",
    q: "How long does a summary take?",
    a: "It depends on the video's length — usually from tens of seconds to a few minutes. Finished summaries are saved, so they load instantly next time.",
  },
  {
    id: "ai-fail",
    category: "ai",
    q: "Some videos can't be summarized.",
    a: "Videos with little speech, very long videos and restricted videos may fail. If it fails, tap 'Try again'.",
  },
  {
    id: "video-which",
    category: "video",
    q: "Which videos are shown?",
    a: "Crypto and stock videos found on YouTube. Shorts and live streams are left out.",
  },
  {
    id: "video-filter",
    category: "video",
    q: "Can I sort or filter by length?",
    a: "The filter button lets you pick sort order (relevance, newest, views), upload date and length. 'Save as default' keeps your choice in this browser.",
  },
  {
    id: "video-favorite",
    category: "video",
    q: "Can I follow my favorite channels?",
    a: "Once signed in, you can add channels to favorites and view their videos in one place.",
  },
  {
    id: "chart-which",
    category: "chart",
    q: "Which charts are available?",
    a: "Bitcoin (BTC), Ethereum (ETH), XRP and Solana (SOL), plus the Nasdaq, Nasdaq-100, S&P 500 and Dow Jones indices.",
    link: { href: "/chart", label: "Open charts" },
  },
  {
    id: "chart-source",
    category: "chart",
    q: "Where does chart data come from? Is it real time?",
    a: "Coin prices come from Bybit's public data and US indices from Yahoo Finance. Index data can be delayed, so treat it as reference only.",
  },
  {
    id: "community-boards",
    category: "community",
    q: "What boards are there?",
    a: "Free Talk, Crypto Analysis, Stock Analysis, US Stocks, Korean Stocks, News & Info, Q&A and P&L Proof. Sort by upvotes or views to find popular posts.",
    link: { href: "/community", label: "Go to community" },
  },
  {
    id: "community-write",
    category: "community",
    q: "Do I need an account to post?",
    a: "Anyone can read. Posting, commenting and upvoting require signing in.",
  },
  {
    id: "community-report",
    category: "community",
    q: "I found spam or an offensive post.",
    a: "Email us via the Contact page with the post's link and we'll review it.",
    link: { href: "/contact", label: "Contact us" },
  },
  {
    id: "account-login",
    category: "account",
    q: "How do I sign up?",
    a: "Sign in with Google, or sign up with email and a password. With email sign-up, click the link in the verification email before using AI summaries.",
  },
  {
    id: "account-password",
    category: "account",
    q: "I forgot my password or ID.",
    a: "Use 'Find ID' or 'Reset password' in the sign-in window. The reset link is sent to your sign-up email.",
  },
  {
    id: "account-mail",
    category: "account",
    q: "The verification email didn't arrive.",
    a: "Check your spam folder first. If it's still missing after a few minutes, resend it or sign in with Google instead.",
  },
  {
    id: "bybit-why",
    category: "bybit",
    q: "What is the Bybit referral code?",
    a: "Our Bybit referral code is XQZZ6O. Enter it in the referral code field when signing up, or use the sign-up link on our guide page and it's filled in automatically.",
    link: { href: "/bybit", label: "How to sign up for Bybit" },
  },
  {
    id: "bybit-later",
    category: "bybit",
    q: "I already signed up. Can I add the code later?",
    a: "Generally the referral code can only be entered at sign-up, so check it's filled in before you finish.",
  },
  {
    id: "bybit-safe",
    category: "bybit",
    q: "Is there any downside to using a referral code?",
    a: "No. Fees and account terms are the same, and you still get Bybit's new-user offers. Bybit isn't available in some countries, so check your region first.",
  },
  {
    id: "privacy-data",
    category: "privacy",
    q: "What personal data do you store?",
    a: "Your email and account details for sign-in, your posts and comments, favorites and AI usage counts. To prevent abuse, IP addresses are stored only in an irreversible hashed form.",
    link: { href: "/privacy", label: "Privacy Policy" },
  },
  {
    id: "privacy-delete",
    category: "privacy",
    q: "How do I delete my account or data?",
    a: "Email us via the Contact page from your sign-up address and we'll handle it.",
    link: { href: "/contact", label: "Contact us" },
  },
];

export function getFaq(locale: AppLocale | string) {
  const en = locale === "en";
  return { categories: CATEGORIES[en ? "en" : "ko"], items: en ? ITEMS_EN : ITEMS_KO };
}
