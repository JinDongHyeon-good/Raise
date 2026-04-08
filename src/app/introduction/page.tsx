import type { Metadata } from "next";
import Link from "next/link";
import { IntroductionTextClient } from "./IntroductionTextClient";

export const metadata: Metadata = {
  title: "자기소개서",
  description: "자기소개",
};

export default function IntroductionPage() {
  return (
    <div
      className="min-h-dvh bg-zinc-50 font-sans dark:bg-black"
      style={{
        paddingTop: "max(1rem, env(safe-area-inset-top))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1.25rem, env(safe-area-inset-left))",
        paddingRight: "max(1.25rem, env(safe-area-inset-right))",
      }}
    >
      <Link
        href="/"
        className="inline-flex rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-800 shadow-sm dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200"
      >
        ← 홈
      </Link>
      <main className="mx-auto flex max-w-2xl flex-col pt-10 md:max-w-3xl md:pt-14">
        <h1 className="mb-8 text-center text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-left sm:text-3xl">
          자기소개서
        </h1>
        <IntroductionTextClient />
      </main>
    </div>
  );
}
