"use client";

import { IntroBody } from "@/components/IntroBody";

export function IntroductionTextClient() {
  return (
    <IntroBody
      paragraphClassName="text-balance text-lg font-medium leading-[1.9] tracking-tight text-neutral-900 sm:text-xl md:text-2xl dark:text-neutral-100"
      factClassName="text-base font-medium leading-relaxed text-neutral-800 sm:text-lg md:text-xl dark:text-neutral-200"
    />
  );
}
