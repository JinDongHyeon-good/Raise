"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

/**
 * 가로로 넘기는 줄(모바일)에 붙이는 좌우 이동 버튼
 * const { setNode, update, edge, slide } = useHScroll([deps]);
 *   <ScrollArrows edge={edge} onSlide={slide} />  <div ref={setNode} onScroll={update}>…</div>
 */
export function useHScroll(deps: unknown[] = []) {
  // 콜백 ref 로 받은 요소 (렌더 중 ref 를 읽지 않도록 state 에 둔다)
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [edge, setEdge] = useState({ left: true, right: true });

  const update = useCallback(() => {
    const el = node;
    if (!el) return;
    const next = { left: el.scrollLeft <= 4, right: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 };
    setEdge((prev) => (prev.left === next.left && prev.right === next.right ? prev : next));
  }, [node]);

  useEffect(() => {
    // 첫 측정은 다음 프레임에 (effect 안에서 바로 setState 하지 않게)
    const frame = requestAnimationFrame(update);
    const el = node;
    const observer = typeof ResizeObserver !== "undefined" && el ? new ResizeObserver(update) : null;
    if (el && observer) {
      observer.observe(el);
      Array.from(el.children).forEach((child) => observer.observe(child));
    }
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [update, node, ...deps]);

  const slide = useCallback(
    (dir: -1 | 1) => {
      if (node) node.scrollBy({ left: dir * Math.max(160, node.clientWidth * 0.8), behavior: "smooth" });
    },
    [node],
  );

  return { setNode, update, edge, slide };
}

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}

/**
 * 좌우 버튼 한 쌍. 끝에 닿은 쪽은 흐리게. 기본은 모바일에서만 (sm 이상 숨김)
 * 레이아웃이 흔들리지 않도록 넘칠 게 없어도 자리는 항상 차지한다 (버튼만 비활성)
 */
export function ScrollArrows({
  edge,
  onSlide,
  className = "flex items-center justify-end gap-2 sm:hidden",
}: {
  edge: { left: boolean; right: boolean };
  onSlide: (dir: -1 | 1) => void;
  className?: string;
}) {
  const t = useTranslations("common");
  const cls =
    "inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--rz-line-strong)] bg-[var(--rz-panel)] text-[var(--rz-text)] transition active:scale-95 disabled:opacity-30";
  return (
    <div className={className}>
      <button type="button" onClick={() => onSlide(-1)} disabled={edge.left} aria-label={t("slidePrev")} className={cls}>
        <Arrow dir="left" />
      </button>
      <button type="button" onClick={() => onSlide(1)} disabled={edge.right} aria-label={t("slideNext")} className={cls}>
        <Arrow dir="right" />
      </button>
    </div>
  );
}
