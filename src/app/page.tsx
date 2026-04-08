import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 sm:px-10">
        <div className="flex w-full max-w-md flex-row gap-3 sm:gap-4">
          <Link
            href="/resume"
            className="flex h-12 flex-1 items-center justify-center rounded-full border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-900 shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800 sm:h-14 sm:text-base"
          >
            경력기술서
          </Link>
          <Link
            href="/introduction"
            className="flex h-12 flex-1 items-center justify-center rounded-full border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-900 shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800 sm:h-14 sm:text-base"
          >
            자기소개서
          </Link>
        </div>
      </main>
    </div>
  );
}
