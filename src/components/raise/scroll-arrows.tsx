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
 * 슬라이더 위에 떠 있는 좌우 버튼 (흰 원 + 검은 화살표). 모바일에서만 (sm 이상 숨김)
 * 감싸는 요소에 relative 를 주고 슬라이더와 같은 곳에 둔다. 끝에 닿은 쪽 버튼은 사라진다.
 * 떠 있는 요소라 나타나거나 사라져도 레이아웃이 움직이지 않는다.
 */
export function ScrollArrows({ edge, onSlide }: { edge: { left: boolean; right: boolean }; onSlide: (dir: -1 | 1) => void }) {
  const t = useTranslations("common");
  const cls =
    "absolute top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-[0_4px_14px_rgb(0_0_0_/_0.45)] transition-opacity duration-200 active:scale-95 sm:hidden";
  return (
    <>
      <button
        type="button"
        onClick={() => onSlide(-1)}
        aria-label={t("slidePrev")}
        aria-hidden={edge.left}
        tabIndex={edge.left ? -1 : 0}
        className={`${cls} left-1 ${edge.left ? "pointer-events-none opacity-0" : "opacity-100"}`}
      >
        <Arrow dir="left" />
      </button>
      <button
        type="button"
        onClick={() => onSlide(1)}
        aria-label={t("slideNext")}
        aria-hidden={edge.right}
        tabIndex={edge.right ? -1 : 0}
        className={`${cls} right-1 ${edge.right ? "pointer-events-none opacity-0" : "opacity-100"}`}
      >
        <Arrow dir="right" />
      </button>
    </>
  );
}
