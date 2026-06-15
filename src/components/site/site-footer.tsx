import Link from "next/link";
import { SERVICE_NAME } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-6 text-xs text-slate-600 sm:px-6">
        <nav className="flex flex-wrap items-center gap-x-3 gap-y-2" aria-label="사이트 링크">
          <Link href="/" className="hover:text-slate-900 hover:underline">
            홈
          </Link>
          <span className="text-slate-300" aria-hidden>
            |
          </span>
          <Link href="/about" className="hover:text-slate-900 hover:underline">
            서비스 소개
          </Link>
          <span className="text-slate-300" aria-hidden>
            |
          </span>
          <Link href="/guides" className="hover:text-slate-900 hover:underline">
            타로 가이드
          </Link>
          <span className="text-slate-300" aria-hidden>
            |
          </span>
          <Link href="/contact" className="hover:text-slate-900 hover:underline">
            문의
          </Link>
          <span className="text-slate-300" aria-hidden>
            |
          </span>
          <Link href="/privacy" className="hover:text-slate-900 hover:underline">
            개인정보처리방침
          </Link>
          <span className="text-slate-300" aria-hidden>
            |
          </span>
          <Link href="/terms" className="hover:text-slate-900 hover:underline">
            이용약관
          </Link>
        </nav>
        <p className="leading-relaxed text-slate-500">
          © {new Date().getFullYear()} {SERVICE_NAME}. AI 타로 리딩은 오락·자기성찰을 위한 참고 콘텐츠이며, 의료·법률·투자
          판단을 대체하지 않습니다.
        </p>
      </div>
    </footer>
  );
}
