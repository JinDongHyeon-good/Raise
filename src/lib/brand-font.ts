import localFont from "next/font/local";

/**
 * 사주네 로고·브랜드 타이틀용 (둥글둥글하고 친근한 한글 디스플레이).
 * next/font/google의 Jua는 subsets 메타데이터가 "latin"만 등록돼 있어
 * 한글에 라틴 유니코드 레인지가 적용되면서 폴백 폰트로 렌더링되는 문제가 있어,
 * 동일한 원본 파일을 로컬로 내려받아 next/font/local로 직접 서빙한다.
 */
export const brandDisplayFont = localFont({
  src: "../fonts/Jua-Regular.ttf",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-brand-display",
});
