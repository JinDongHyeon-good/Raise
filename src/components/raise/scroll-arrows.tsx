"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 가로로 넘기는 줄(모바일)에 붙이는 좌우 이동 버튼
 * const { setNode, update, edge, slide } = useHScroll([deps]);
 *   <ScrollArrows edge={edge} onSlide={slide} />  <div ref={setNode} onScroll={update}>…</div>
 */
export function useHScroll(deps: unknown[] = []) {
  // 콜백 ref 로 받은 요소 (렌더 중 ref 를 읽지 않도록 state 에 둔다)
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [edge, setEdge] = useState({ left: true, right: true });
  // 버튼으로 이동 중인 목표 위치 (0.6초 안의 연속 탭만 이어서 계산 — 중간에 끊긴 이동이 남지 않게)
  const target = useRef<{ left: number; at: number } | null>(null);

  const update = useCallback(() => {
    const el = node;
    if (!el) return;
    if (target.current && Math.abs(el.scrollLeft - target.current.left) <= 2) target.current = null;
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
    // 손으로 넘기기 시작하면 버튼 이동 목표는 버린다
    const clearTarget = () => {
      target.current = null;
    };
    el?.addEventListener("pointerdown", clearTarget, { passive: true });
    el?.addEventListener("wheel", clearTarget, { passive: true });
    return () => {
      el?.removeEventListener("pointerdown", clearTarget);
      el?.removeEventListener("wheel", clearTarget);
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [update, node, ...deps]);

  // 이동 목표를 실제 끝(0 ~ scrollWidth-clientWidth) 안으로 잘라서 이동한다.
  // scrollBy 로 고정 거리만큼 밀면 끝 근처·연속 탭에서 모바일 사파리가 끝을 넘겨 튕겼다가 돌아온다.
  // 연속 탭은 진행 중인 목표에서 이어서 계산한다 (부드러운 스크롤 도중 scrollLeft 는 중간값이라서)
  const slide = useCallback(
    (dir: -1 | 1) => {
      if (!node) return;
      const max = Math.max(0, node.scrollWidth - node.clientWidth);
      const now = Date.now();
      const from = target.current && now - target.current.at < 600 ? target.current.left : node.scrollLeft;
      const next = Math.min(max, Math.max(0, Math.round(from + dir * Math.max(160, node.clientWidth * 0.8))));
      target.current = { left: next, at: now };
      node.scrollTo({ left: next, behavior: "smooth" });
    },
    [node],
  );

  return { setNode, update, edge, slide };
}

function Arrow({ dir, size = 16 }: { dir: "left" | "right"; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}

/**
 * 슬라이더 위에 떠 있는 좌우 버튼 (흰 원 + 검은 화살표). 모바일에서만 (sm 이상 숨김)
 * 감싸는 요소에 relative 를 주고 슬라이더와 같은 곳에 둔다. 끝에 닿은 쪽 버튼은 사라진다.
 * 떠 있는 요소라 나타나거나 사라져도 레이아웃이 움직이지 않는다.
 */
export function ScrollArrows({
  edge,
  onSlide,
  size = "md",
  allScreens = false,
}: {
  edge: { left: boolean; right: boolean };
  onSlide: (dir: -1 | 1) => void;
  /** sm: 작은 칩 줄(28px)에 맞춤, md: 카드 줄(32px) */
  size?: "sm" | "md";
  /** true 면 넓은 화면에서도 보인다 (기본은 모바일만) */
  allScreens?: boolean;
}) {
  const t = useTranslations("common");
  const cls =
    `absolute top-1/2 z-10 inline-flex ${size === "sm" ? "h-7 w-7" : "h-8 w-8"} -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-[0_4px_14px_rgb(0_0_0_/_0.45)] transition-opacity duration-200 active:scale-95 ${allScreens ? "" : "sm:hidden"}`;
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
        <Arrow dir="left" size={size === "sm" ? 14 : 16} />
      </button>
      <button
        type="button"
        onClick={() => onSlide(1)}
        aria-label={t("slideNext")}
        aria-hidden={edge.right}
        tabIndex={edge.right ? -1 : 0}
        className={`${cls} right-1 ${edge.right ? "pointer-events-none opacity-0" : "opacity-100"}`}
      >
        <Arrow dir="right" size={size === "sm" ? 14 : 16} />
      </button>
    </>
  );
}
