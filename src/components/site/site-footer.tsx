import Link from "next/link";
import { SERVICE_NAME, SERVICE_TAGLINE } from "@/lib/brand";

const PRIMARY_LINKS = [
  { href: "/", label: "홈" },
  { href: "/topics/today-fortune", label: "오늘의 운세" },
  { href: "/topics/today-tarot", label: "오늘의 타로" },
  { href: "/topics/love-tarot", label: "연애 타로" },
  { href: "/about", label: "서비스 소개" },
  { href: "/guides", label: "타로 가이드" },
  { href: "/contact", label: "문의" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/terms", label: "이용약관" },
];

export function SiteFooter({ maxWidthClassName = "max-w-5xl" }: { maxWidthClassName?: string }) {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className={`mx-auto flex w-full flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12 ${maxWidthClassName}`}>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <a href="/" className="font-brand-display inline-flex items-center gap-1.5 text-lg text-slate-900">
              <span
                aria-hidden
                className="bg-gradient-to-br from-violet-500 to-fuchsia-500 bg-clip-text text-transparent"
              >
                ✦
              </span>
              {SERVICE_NAME}
            </a>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{SERVICE_TAGLINE}</p>
          </div>

          <nav
            className="flex flex-wrap gap-x-5 gap-y-2.5 text-sm text-slate-600 sm:justify-end"
            aria-label="사이트 링크"
          >
            {PRIMARY_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-violet-600">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <p className="text-xs leading-relaxed text-slate-400">
            © {new Date().getFullYear()} {SERVICE_NAME}. AI 타로 리딩은 오락·자기성찰을 위한 참고 콘텐츠이며,
            의료·법률·투자 판단을 대체하지 않습니다.
          </p>
          <nav className="flex shrink-0 items-center gap-x-4 text-xs text-slate-400" aria-label="법적 고지">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-slate-600 hover:underline">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
