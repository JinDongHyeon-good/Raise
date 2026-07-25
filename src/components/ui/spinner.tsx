type SpinnerSize = "sm" | "md" | "lg";

const SIZE_STYLE: Record<SpinnerSize, { size: string; border: string }> = {
  sm: { size: "0.875rem", border: "2px" },
  md: { size: "1.25rem", border: "2px" },
  lg: { size: "2rem", border: "3px" },
};

type SpinnerProps = {
  size?: SpinnerSize;
  className?: string;
  label?: string;
};

export function Spinner({ size = "md", className = "", label }: SpinnerProps) {
  const { size: box, border } = SIZE_STYLE[size];
  return (
    <span
      className={`pk-spinner ${className}`}
      style={{ width: box, height: box, borderWidth: border }}
      role="status"
      aria-label={label ?? "loading"}
    />
  );
}

type LoadingBlockProps = {
  size?: SpinnerSize;
  label?: string;
  className?: string;
};

export function LoadingBlock({ size = "lg", label, className = "" }: LoadingBlockProps) {
  return (
    <div className={`flex items-center justify-center py-14 ${className}`}>
      <Spinner size={size} className="text-[var(--piclick-green)]" label={label} />
    </div>
  );
}
