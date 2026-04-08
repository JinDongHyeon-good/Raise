"use client";

type AnimatedCharTextProps = {
  text: string;
  className?: string;
  /** 이 블록 시작 전까지 기다리는 시간(초) — 여러 줄 연속 애니용 */
  baseDelay?: number;
  as?: "p" | "span";
};

export function AnimatedCharText({
  text,
  className = "",
  baseDelay = 0,
  as = "p",
}: AnimatedCharTextProps) {
  const chars = Array.from(text);
  const Tag = as === "span" ? "span" : "p";

  return (
    <Tag className={className} lang="ko">
      {chars.map((ch, i) => (
        <span
          key={`${as}-${i}-${ch}`}
          className="hero-char"
          style={{
            animationDelay: `${baseDelay + 0.06 + i * 0.038}s`,
          }}
        >
          {ch}
        </span>
      ))}
    </Tag>
  );
}
