import Link from "next/link";
import { SERVICE_NAME, SERVICE_TAGLINE } from "@/lib/brand";
import { SiteFooter } from "@/components/site/site-footer";

export function SitePageShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="font-brand-display flex items-center gap-1.5 text-xl tracking-tight text-slate-900 hover:text-slate-700"
          >
            <span
              aria-hidden
              className="bg-gradient-to-br from-violet-500 to-fuchsia-500 bg-clip-text text-transparent"
            >
              ✦
            </span>
            {SERVICE_NAME}
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs text-slate-600 sm:text-sm">
            <Link href="/about" className="hover:text-slate-900 hover:underline">
              소개
            </Link>
            <Link href="/guides" className="hover:text-slate-900 hover:underline">
              가이드
            </Link>
            <Link href="/contact" className="hover:text-slate-900 hover:underline">
              문의
            </Link>
          </nav>
        </div>
        {title ? (
          <div className="mx-auto w-full max-w-5xl px-4 pb-4 sm:px-6">
            <p className="text-xs text-slate-500">{SERVICE_TAGLINE}</p>
          </div>
        ) : null}
      </header>
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
