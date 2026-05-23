export const SERVICE_NAME = "멜로타로";
export const SERVICE_NAME_EN = "Melotaro";

export const SERVICE_TAGLINE = "AI 타로 서비스 멜로타로";

export const SERVICE_DESCRIPTION =
  "멜로타로는 AI 타로 서비스입니다. 카드와 질문을 바탕으로 관계, 일, 커리어 등 지금 궁금한 흐름을 차분하고 명확하게 읽어드립니다.";

export const SERVICE_KEYWORDS = [
  "AI 타로",
  "타로 리딩",
  "온라인 타로",
  "타로 카드",
  "운세",
  "연애 타로",
  "오늘의 타로",
  "멜로타로",
  "AI 점술",
] as const;

export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return "https://jjindong.com";
  try {
    const withScheme = raw.includes("://") ? raw : `https://${raw}`;
    return withScheme.replace(/\/$/, "");
  } catch {
    return "https://jjindong.com";
  }
}
