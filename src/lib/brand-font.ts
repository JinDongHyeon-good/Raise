import { Jua } from "next/font/google";

/** 멜로타로 로고·브랜드 타이틀용 (둥근 한글 디스플레이) */
export const brandDisplayFont = Jua({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-brand-display",
});
