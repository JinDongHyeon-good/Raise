"use client";

export function FloatingActions() {
  const onScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDownloadPdf = () => {
    const ok = window.confirm("pdf로 저장하시겠습니까?");
    if (!ok) return;
    window.print();
  };

  return (
    <div className="fixed bottom-5 right-4 z-20 flex flex-col items-center gap-2 sm:bottom-7 sm:right-6">
      <button
        type="button"
        onClick={onDownloadPdf}
        disabled
        className="flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-extrabold leading-none text-red-600 opacity-55 shadow-[0_10px_24px_rgb(17_24_39_/_0.22)] sm:h-12 sm:w-12 sm:text-xl"
        aria-label="PDF 다운로드"
      >
        P
      </button>
      <button
        type="button"
        onClick={onScrollTop}
        className="glass-chip flex h-11 w-11 items-center justify-center text-lg font-bold leading-none shadow-[0_10px_24px_rgb(17_24_39_/_0.22)] sm:h-12 sm:w-12 sm:text-xl"
        aria-label="맨 위로 이동"
      >
        ↑
      </button>
    </div>
  );
}

