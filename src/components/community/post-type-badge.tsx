import { BOARD_POST_TYPE_LABELS, type BoardPostType } from "@/lib/board-types";

const COLORS: Record<BoardPostType, string> = {
  free: "bg-slate-500/15 text-slate-300",
  analysis: "bg-amber-500/15 text-amber-300",
  stock_analysis: "bg-rose-500/15 text-rose-300",
  us_stock: "bg-indigo-500/15 text-indigo-300",
  kr_stock: "bg-teal-500/15 text-teal-300",
  news: "bg-sky-500/15 text-sky-300",
  question: "bg-violet-500/15 text-violet-300",
  profit: "bg-emerald-500/15 text-emerald-300",
};

export function PostTypeBadge({ type }: { type: BoardPostType }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${COLORS[type]}`}>
      {BOARD_POST_TYPE_LABELS[type]}
    </span>
  );
}
