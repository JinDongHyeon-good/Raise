import { getTranslations } from "next-intl/server";
import { Link } from "@/navigation";
import { type BybitGuideSlug, getBybitGuides } from "@/lib/bybit-guides";

/** 바이비트 세부 가이드 카드 목록 — /bybit 와 각 가이드 하단에서 서로를 잇는다 (내부 링크) */
export async function BybitGuideLinks({ locale, exclude }: { locale: "ko" | "en"; exclude?: BybitGuideSlug }) {
  const t = await getTranslations({ locale, namespace: "bybit" });
  const guides = getBybitGuides(locale).filter((g) => g.slug !== exclude);

  return (
    <nav aria-labelledby="bybit-guides-heading" className="space-y-3">
      <h2 id="bybit-guides-heading" className="text-[15px] font-semibold text-white sm:text-base">
        {exclude ? t("guidesTitleOther") : t("guidesTitle")}
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {guides.map((g) => (
          <li key={g.slug}>
            <Link
              href={`/bybit/${g.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-[var(--rz-line)] bg-[var(--rz-panel)] px-4 py-3.5 transition hover:border-[#F7A600]/45"
            >
              <span className="text-sm font-semibold text-white group-hover:text-[#F7A600]">{g.navTitle}</span>
              <span className="mt-0.5 text-xs leading-5 text-[var(--rz-muted)]">{g.navBlurb}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
