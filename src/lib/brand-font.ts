import { Outfit } from "next/font/google";

/** Piclick 로고·브랜드 타이틀용 (모던 스포츠 디스플레이) */
export const brandDisplayFont = Outfit({
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-brand-display",
});
