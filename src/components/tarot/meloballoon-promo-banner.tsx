import {
  MELOBALLOON_DISPLAY_NAME,
  MELOBALLOON_KEYWORDS,
  MELOBALLOON_NAME,
  MELOBALLOON_STORE_URL,
} from "@/lib/brand";

export function MeloballoonPromoBanner() {
  return (
    <aside className="meloballoon-promo" aria-label={`${MELOBALLOON_NAME} 스토어 안내`}>
      <div className="meloballoon-promo__inner">
        <div className="meloballoon-promo__main">
          <div className="meloballoon-promo__head">
            <span className="meloballoon-promo__brand font-brand-display">{MELOBALLOON_DISPLAY_NAME}</span>
            <span className="meloballoon-promo__title bg-gradient-to-r from-rose-400 via-pink-500 to-fuchsia-400 bg-clip-text font-semibold text-transparent">
              맞춤 풍선 · 이벤트 제작
            </span>
          </div>

          <div className="meloballoon-promo__tags" aria-label="서비스 키워드">
            {MELOBALLOON_KEYWORDS.map((keyword) => (
              <span key={keyword} className="meloballoon-promo__tag">
                {keyword}
              </span>
            ))}
          </div>
        </div>

        <a
          href={MELOBALLOON_STORE_URL}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="meloballoon-promo__cta"
        >
          스토어 바로가기
          <svg className="meloballoon-promo__cta-arrow" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M7 4l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </aside>
  );
}
