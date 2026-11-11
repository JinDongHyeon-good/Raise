"use client";

import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";

export type SearchKeyword = { id: number; keyword: string };

/** supabase/sql/search_keywords.sql 과 맞출 것 */
export const MAX_KEYWORDS = 20;
export const MAX_KEYWORD_LENGTH = 40;

export type KeywordResult = { ok: true } | { ok: false; error: string };

/** 로그인 사용자의 검색 키워드 (DB 저장, 비로그인이면 빈 목록) */
export function useSearchKeywords() {
  const { me } = useAuth();
  const locale = useLocale();
  const meId = me?.id ?? null;
  const [state, setState] = useState<{ userId: string | null; items: SearchKeyword[] }>({ userId: null, items: [] });

  useEffect(() => {
    if (!meId) return;
    let alive = true;
    fetch("/api/youtube/keywords", { cache: "no-store", headers: { "x-ui-locale": locale } })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: SearchKeyword[] }) => {
        if (alive) setState({ userId: meId, items: data.items ?? [] });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [meId, locale]);

  // 로그아웃하거나 다른 계정이면 이전 목록을 보여 주지 않는다
  const items = useMemo(() => (state.userId === meId ? state.items : []), [state, meId]);

  const add = useCallback(
    async (keyword: string): Promise<KeywordResult> => {
      const res = await fetch("/api/youtube/keywords", {
        method: "POST",
        headers: { "content-type": "application/json", "x-ui-locale": locale },
        body: JSON.stringify({ keyword }),
      }).catch(() => null);
      const data = (await res?.json().catch(() => ({}))) as { item?: SearchKeyword; error?: string } | undefined;
      if (!res?.ok || !data?.item) return { ok: false, error: data?.error ?? "" };
      const item = data.item;
      setState((prev) => ({ userId: meId, items: [...prev.items.filter((k) => k.id !== item.id), item] }));
      return { ok: true };
    },
    [locale, meId],
  );

  const remove = useCallback(
    async (id: number): Promise<KeywordResult> => {
      const res = await fetch(`/api/youtube/keywords?id=${id}`, { method: "DELETE", headers: { "x-ui-locale": locale } }).catch(
        () => null,
      );
      if (!res?.ok) {
        const data = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
        return { ok: false, error: data?.error ?? "" };
      }
      setState((prev) => ({ userId: meId, items: prev.items.filter((k) => k.id !== id) }));
      return { ok: true };
    },
    [locale, meId],
  );

  return { items, add, remove, loggedIn: Boolean(meId) };
}
