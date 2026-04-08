"use client";

import { AnimatedCharText } from "@/components/AnimatedCharText";
import { SELF_INTRO_FACTS, SELF_INTRO_TEXT } from "@/data/intro";

/** 한 블록 애니가 끝난 뒤 다음 블록이 시작될 시점(초) */
function nextBlockStart(currentStart: number, text: string) {
  const n = Array.from(text).length;
  return currentStart + 0.06 + n * 0.038 + 0.28;
}

type IntroBodyProps = {
  paragraphClassName: string;
  listWrapperClassName?: string;
  factClassName: string;
};

export function IntroBody({
  paragraphClassName,
  listWrapperClassName = "",
  factClassName,
}: IntroBodyProps) {
  let lineStart = 0;

  const paragraphBase = lineStart;
  lineStart = nextBlockStart(paragraphBase, SELF_INTRO_TEXT);

  const factBases: number[] = [];
  for (const fact of SELF_INTRO_FACTS) {
    factBases.push(lineStart);
    lineStart = nextBlockStart(lineStart, fact);
  }

  return (
    <div className="w-full">
      <AnimatedCharText
        text={SELF_INTRO_TEXT}
        className={paragraphClassName}
        baseDelay={paragraphBase}
      />
      <ul
        className={`mt-8 list-none space-y-3 sm:mt-10 sm:space-y-3.5 ${listWrapperClassName}`}
      >
        {SELF_INTRO_FACTS.map((fact, i) => (
          <li
            key={fact}
            className="flex gap-3 text-left sm:gap-4"
          >
            <span
              className="mt-[0.4em] shrink-0 select-none text-neutral-400 dark:text-neutral-500"
              aria-hidden
            >
              —
            </span>
            <AnimatedCharText
              as="span"
              text={fact}
              className={`block ${factClassName}`}
              baseDelay={factBases[i]!}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
