"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { PostTypeBadge } from "@/components/community/post-type-badge";
import { formatNumber, timeAgo } from "@/lib/community-format";
import {
  BOARD_POST_TYPES,
  BOARD_SORTS,
  boardPostTypeLabelKey,
  boardSortLabelKey,
  isBoardPostType,
  parseBoardSort,
  type BoardPostSummary,
} from "@/lib/board-types";
import { Link, usePathname, useRouter } from "@/navigation";

const PAGE_SIZE = 20;

type ListResult = { key: string; items: BoardPostSummary[]; total: number; error: string | null };

export function CommunityList() {
  const t = useTranslations("community");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { me, requireLogin } = useAuth();

  const typeParam = params.get("type");
  const type = isBoardPostType(typeParam) ? typeParam : null;
  const sort = parseBoardSort(params.get("sort"));
  const page = Math.max(1, Number(params.get("page")) || 1);
  const q = params.get("q") ?? "";
  const author = params.get("author") ?? "";

  const [searchInput, setSearchInput] = useState(q);
  const [result, setResult] = useState<ListResult>({ key: "", items: [], total: 0, error: null });

  const apiQuery = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sort });
  if (type) apiQuery.set("type", type);
  if (q) apiQuery.set("q", q);
  if (author) apiQuery.set("author", author);
  const key = apiQuery.toString();

  useEffect(() => {
    let alive = true;
    fetch(`/api/board/posts?${key}`, { cache: "no-store", headers: { "x-ui-locale": locale } })
      .then(async (res) => {
        const data = (await res.json()) as { items?: BoardPostSummary[]; total?: number; error?: string };
        if (!alive) return;
        setResult(
          data.items
            ? { key, items: data.items, total: data.total ?? 0, error: null }
            : { key, items: [], total: 0, error: data.error ?? t("loadPostsFailed") },
        );
      })
      .catch(() => alive && setResult({ key, items: [], total: 0, error: t("loadPostsFailed") }));
    return () => {
      alive = false;
    };
  }, [key, locale, t]);

  const loading = result.key !== key;
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  const go = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!("page" in patch)) next.delete("page");
    router.push(`${pathname}${next.toString() ? `?${next}` : ""}`);
  };

  const writeHref = `/community/write${type ? `?type=${type}` : ""}`;

  const pageNumbers = (() => {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  })();

  return (
    <main className="rz-container py-5 sm:py-7">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-brand-display)] text-xl font-semibold tracking-tight sm:text-2xl">
            {t("title")}
          </h1>
          <p className="mt-1.5 text-sm text-[var(--rz-muted)]">
            {author ? (me?.id === author ? t("myPosts") : t("authorPosts")) : t("subtitle")}
          </p>
        </div>
        <Link
          href={writeHref}
          onClick={(e) => {
            if (!requireLogin()) e.preventDefault();
          }}
          className="shrink-0 rounded-xl bg-[var(--rz-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--rz-accent-fg)] transition hover:brightness-110"
        >
          {t("write")}
        </Link>
      </div>

      {/* 탭 */}
      <div className="-mx-4 mb-4 flex gap-1 overflow-x-auto border-b border-[var(--rz-line)] px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[null, ...BOARD_POST_TYPES].map((tab) => {
          const active = tab === type;
          return (
            <button
              key={tab ?? "all"}
              type="button"
              onClick={() => go({ type: tab })}
              className={`shrink-0 border-b-2 px-3 py-2.5 text-sm transition ${
                active
                  ? "border-[var(--rz-accent)] font-semibold text-[var(--rz-text)]"
                  : "border-transparent text-[var(--rz-muted)] hover:text-[var(--rz-text)]"
              }`}
            >
              {tab ? t(boardPostTypeLabelKey(tab)) : t("all")}
            </button>
          );
        })}
      </div>

      {/* 정렬·검색 */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex w-fit rounded-xl border border-[var(--rz-line)] bg-[var(--rz-panel)] p-0.5 text-xs">
          {BOARD_SORTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => go({ sort: s === "latest" ? null : s })}
              className={`rounded-lg px-3 py-2 sm:py-1.5 ${
                sort === s ? "bg-[var(--rz-panel-2)] text-[var(--rz-text)]" : "text-[var(--rz-muted)]"
              }`}
            >
              {t(boardSortLabelKey(s))}
            </button>
          ))}
        </div>
        <form
          className="flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            go({ q: searchInput.trim() || null });
          }}
        >
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("searchPlaceholder")}
            maxLength={50}
            className="min-w-0 flex-1 rounded-xl border border-[var(--rz-line)] bg-[var(--rz-panel)] px-3 py-2 text-sm outline-none transition focus:border-[var(--rz-accent)]/60 sm:w-56 sm:flex-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl border border-[var(--rz-line)] px-3.5 text-sm text-[var(--rz-muted)] transition hover:text-[var(--rz-text)]"
          >
            {t("search")}
          </button>
        </form>
      </div>

      {(q || author) && (
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          {q ? (
            <button type="button" onClick={() => { setSearchInput(""); go({ q: null }); }} className="rounded-full border border-[var(--rz-line)] px-2.5 py-1 text-[var(--rz-muted)]">
              {t("clearSearch", { q })}
            </button>
          ) : null}
          {author ? (
            <button type="button" onClick={() => go({ author: null })} className="rounded-full border border-[var(--rz-line)] px-2.5 py-1 text-[var(--rz-muted)]">
              {t("clearAuthor")}
            </button>
          ) : null}
        </div>
      )}

      {/* 목록 — 불러오기 전(로딩 줄 8개) 높이만큼 자리를 잡아 두어, 글이 적어도 아래 푸터가 움직이지 않게 */}
      <div className="min-h-[33rem]">
      <ul className="divide-y divide-[var(--rz-line)] overflow-hidden rounded-2xl border border-[var(--rz-line)] bg-[var(--rz-panel)] shadow-[var(--rz-shadow)]">
        {loading && result.items.length === 0
          ? Array.from({ length: 8 }, (_, i) => (
              <li key={i} className="space-y-2 px-4 py-3.5">
                <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--rz-panel-2)]" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-[var(--rz-panel-2)]" />
              </li>
            ))
          : null}
        {!loading && result.error ? <li className="px-4 py-10 text-center text-sm text-[var(--rz-up)]">{result.error}</li> : null}
        {!loading && !result.error && result.items.length === 0 ? (
          <li className="px-4 py-14 text-center text-sm text-[var(--rz-muted)]">{t("empty")}</li>
        ) : null}
        {result.items.map((post) => (
          <li key={post.id} className={loading ? "opacity-50" : ""}>
            <Link href={`/community/${post.id}`} className="block px-4 py-3.5 transition hover:bg-[var(--rz-panel-2)]">
              <div className="flex min-w-0 items-center gap-2">
                {!type ? <PostTypeBadge type={post.post_type} /> : null}
                <span className="truncate text-[15px] leading-snug">{post.title}</span>
                {post.has_image ? (
                  <span className="shrink-0 text-[11px] text-[var(--rz-muted)]" aria-label={t("hasImage")}>
                    ▣
                  </span>
                ) : null}
                {post.comment_count > 0 ? (
                  <span className="shrink-0 text-xs font-semibold text-[var(--rz-accent)]">[{formatNumber(post.comment_count, locale)}]</span>
                ) : null}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[var(--rz-muted)]">
                <span className="max-w-[120px] truncate">{post.author_nickname}</span>
                <span>{timeAgo(post.created_at, locale)}</span>
                <span>{t("views", { count: formatNumber(post.view_count, locale) })}</span>
                <span className={post.like_count > 0 ? "text-[var(--rz-up)]" : ""}>{t("likes", { count: formatNumber(post.like_count, locale) })}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* 페이지 */}
      {totalPages > 1 ? (
        <nav className="mt-5 flex items-center justify-center gap-1 text-sm" aria-label={t("pagination")}>
          <button type="button" disabled={page <= 1} onClick={() => go({ page: String(page - 1) })} className="rounded-md px-2.5 py-1.5 text-[var(--rz-muted)] disabled:opacity-30">
            ‹
          </button>
          {pageNumbers.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => go({ page: n === 1 ? null : String(n) })}
              aria-current={n === page ? "page" : undefined}
              className={`min-w-8 rounded-md px-2.5 py-1.5 ${n === page ? "bg-[var(--rz-accent)] text-[var(--rz-accent-fg)]" : "text-[var(--rz-muted)] hover:bg-[var(--rz-panel-2)]"}`}
            >
              {n}
            </button>
          ))}
          <button type="button" disabled={page >= totalPages} onClick={() => go({ page: String(page + 1) })} className="rounded-md px-2.5 py-1.5 text-[var(--rz-muted)] disabled:opacity-30">
            ›
          </button>
        </nav>
      ) : null}
      </div>
    </main>
  );
}
