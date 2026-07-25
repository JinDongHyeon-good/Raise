"use client";

import type { BoardPostType } from "@/lib/board-types";
import { useTranslations } from "next-intl";

type Props = {
  type: BoardPostType;
  className?: string;
};

export function BoardPostTypeBadge({ type, className = "" }: Props) {
  const t = useTranslations("board.types");

  return (
    <span
      className={`inline-flex items-center rounded-md bg-[var(--piclick-beige)] px-2 py-0.5 text-[11px] font-semibold tracking-wide text-[var(--piclick-green-deep)] ${className}`}
    >
      {t(type)}
    </span>
  );
}
