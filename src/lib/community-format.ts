/** 커뮤니티 날짜·숫자 표기 — 한국어는 기존 표기 그대로, 영어는 "5m ago" / "Nov 11" */
type FormatLocale = string | undefined;

const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const isEnglish = (locale: FormatLocale) => locale === "en";
const pad = (n: number) => String(n).padStart(2, "0");

export function timeAgo(iso: string, locale: FormatLocale = "ko") {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return "";
  const en = isEnglish(locale);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return en ? "just now" : "방금";
  const min = Math.floor(sec / 60);
  if (min < 60) return en ? `${min}m ago` : `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return en ? `${hr}h ago` : `${hr}시간 전`;
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  if (en) {
    const md = `${EN_MONTHS[d.getMonth()]} ${d.getDate()}`;
    return sameYear ? md : `${md}, ${d.getFullYear()}`;
  }
  return sameYear ? `${pad(d.getMonth() + 1)}.${pad(d.getDate())}` : `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

export function formatDateTime(iso: string, locale: FormatLocale = "ko") {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (isEnglish(locale)) return `${EN_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${time}`;
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${time}`;
}

/** 조회수 등 정확한 숫자 표기 (1,234) */
export function formatNumber(n: number, locale: FormatLocale = "ko") {
  return Number(n ?? 0).toLocaleString(isEnglish(locale) ? "en-US" : "ko-KR");
}
