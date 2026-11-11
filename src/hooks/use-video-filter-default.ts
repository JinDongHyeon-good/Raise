"use client";

import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { DEFAULT_FILTERS, parseVideoFilters, sameFilters, type VideoFilters } from "@/lib/video-filters";

/**
 * 영상 필터 기본값 — 로그인 사용자의 계정(USER_PREFERENCES)에 저장.
 * 비로그인이면 항상 DEFAULT_FILTERS 이고, 저장하려면 로그인 창을 띄운다.
 */
export function useVideoFilterDefault() {
  const { me, requireLogin } = useAuth();
  const locale = useLocale();
  const meId = me?.id ?? null;
  const [state, setState] = useState<{ userId: string | null; filters: VideoFilters }>({ userId: null, filters: DEFAULT_FILTERS });

  useEffect(() => {
    if (!meId) return;
    let alive = true;
    fetch("/api/me/preferences", { cache: "no-store", headers: { "x-ui-locale": locale } })
      .then((res) => (res.ok ? res.json() : { videoFilters: null }))
      .then((data: { videoFilters?: unknown }) => {
        if (alive) setState({ userId: meId, filters: parseVideoFilters(data.videoFilters) ?? DEFAULT_FILTERS });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [meId, locale]);

  // 로그아웃·계정 전환 시 이전 계정 값이 남지 않게
  const saved = useMemo(() => (state.userId === meId && meId ? state.filters : DEFAULT_FILTERS), [state, meId]);

  /** 저장. 비로그인이면 로그인 창을 띄우고 "login" 을 돌려준다 */
  const save = useCallback(
    async (filters: VideoFilters): Promise<"saved" | "login" | "failed"> => {
      if (!requireLogin()) return "login";
      const videoFilters = sameFilters(filters, DEFAULT_FILTERS) ? null : filters;
      const res = await fetch("/api/me/preferences", {
        method: "PUT",
        headers: { "content-type": "application/json", "x-ui-locale": locale },
        body: JSON.stringify({ videoFilters }),
      }).catch(() => null);
      if (!res?.ok) return "failed";
      setState({ userId: meId, filters: videoFilters ?? DEFAULT_FILTERS });
      return "saved";
    },
    [requireLogin, locale, meId],
  );

  return { saved, save, loggedIn: Boolean(meId) };
}
