import Link from "next/link";

export function PdfFullScreenFrame({
  pdfPath,
  docTitle,
}: {
  pdfPath: string;
  docTitle: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex h-dvh max-h-dvh flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950"
      style={{
        height: "100dvh",
        maxHeight: "100dvh",
      }}
    >
      <header
        className="flex shrink-0 flex-wrap items-center gap-2 border-b border-neutral-200/90 bg-white/95 px-2 py-2 shadow-sm supports-[backdrop-filter]:backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/95 sm:gap-3 sm:px-3"
        style={{
          paddingTop: "max(0.5rem, env(safe-area-inset-top))",
          paddingBottom: "max(0.5rem, 0.5rem)",
          paddingLeft: "max(0.5rem, env(safe-area-inset-left))",
          paddingRight: "max(0.5rem, env(safe-area-inset-right))",
        }}
      >
        <Link
          href="/"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-800 active:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:active:bg-neutral-800"
        >
          ← 홈
        </Link>
        <a
          href={pdfPath}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 py-2 text-center text-sm font-medium text-neutral-800 active:bg-neutral-100 sm:flex-initial dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:active:bg-neutral-800"
        >
          새&nbsp;탭에서 PDF
        </a>
      </header>

      <div
        className="min-h-0 flex-1 bg-neutral-300 dark:bg-neutral-900"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <iframe
          title={docTitle}
          src={pdfPath}
          className="h-full w-full min-h-0 touch-pan-y border-0 bg-white [-webkit-overflow-scrolling:touch] dark:bg-neutral-950"
        />
      </div>
    </div>
  );
}
