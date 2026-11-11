import Link from "next/link";
import { HeaderUser } from "@/components/auth/header-user";
import { SERVICE_NAME, SERVICE_TAGLINE } from "@/lib/brand";

export function RaiseHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--rz-line)] bg-[var(--rz-bg)]/85 backdrop-blur-md">
      <div className="rz-container flex h-14 items-center justify-between gap-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          {SERVICE_NAME}
          <span className="ml-2 hidden text-xs font-normal text-[var(--rz-muted)] lg:inline">{SERVICE_TAGLINE}</span>
        </Link>
        <div className="flex items-center gap-4">
          <nav className="flex gap-4 text-sm text-[var(--rz-muted)]">
            <Link href="/#chart" className="hover:text-[var(--rz-text)]">
              차트
            </Link>
            <Link href="/#videos" className="hover:text-[var(--rz-text)]">
              영상
            </Link>
            <Link href="/community" className="hover:text-[var(--rz-text)]">
              커뮤니티
            </Link>
          </nav>
          <HeaderUser />
        </div>
      </div>
    </header>
  );
}

const FOOTER_LINKS = [
  { href: "/about", label: "소개" },
  { href: "/contact", label: "문의" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/terms", label: "이용약관" },
] as const;

export function RaiseFooter() {
  return (
    <footer className="border-t border-[var(--rz-line)] py-8 text-xs text-[var(--rz-muted)]">
      <div className="rz-container flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {SERVICE_NAME} · 시세 Bybit · 영상 YouTube · AI 분석은 참고용이며 투자 판단의 책임은 본인에게 있습니다
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-[var(--rz-text)]">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

/** 소개·문의·약관 등 텍스트 페이지용 레이아웃 */
export function RaisePageShell({ children, plain = false }: { children: React.ReactNode; plain?: boolean }) {
  return (
    <div className="raise-app flex min-h-dvh flex-col bg-[var(--rz-bg)] text-[var(--rz-text)]">
      <RaiseHeader />
      <div className={plain ? "flex-1" : "raise-prose flex-1"}>{children}</div>
      <RaiseFooter />
    </div>
  );
}
