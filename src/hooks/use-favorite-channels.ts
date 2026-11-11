"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";

export type FavoriteChannel = { id: string; title: string; thumbnail: string };

/** 로그인 사용자의 유튜브 채널 즐겨찾기 (비로그인이면 빈 목록, 토글 시 로그인 창) */
export function useFavoriteChannels() {
  const { me, requireLogin } = useAuth();
  const t = useTranslations("video");
  const locale = useLocale();
  const [state, setState] = useState<{ userId: string | null; channels: FavoriteChannel[] }>({ userId: null, channels: [] });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const meId = me?.id ?? null;

  useEffect(() => {
    if (!meId) return;
    let alive = true;
    fetch("/api/youtube/favorites", { cache: "no-store", headers: { "x-ui-locale": locale } })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: FavoriteChannel[] }) => {
        if (alive) setState({ userId: meId, channels: data.items ?? [] });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [meId, locale]);

  // 로그아웃하면 목록을 비운다 (다른 사람 목록이 남지 않게)
  const channels = useMemo(() => (state.userId === meId ? state.channels : []), [state, meId]);
  const isFavorite = useCallback((channelId: string) => channels.some((c) => c.id === channelId), [channels]);

  const toggle = useCallback(
    async (channelId: string) => {
      if (!requireLogin()) return;
      setError(null);
      setBusyId(channelId);
      const removing = channels.some((c) => c.id === channelId);
      try {
        const res = removing
          ? await fetch(`/api/youtube/favorites?channelId=${encodeURIComponent(channelId)}`, {
              method: "DELETE",
              headers: { "x-ui-locale": locale },
            })
          : await fetch("/api/youtube/favorites", {
              method: "POST",
              headers: { "content-type": "application/json", "x-ui-locale": locale },
              body: JSON.stringify({ channelId }),
            });
        const data = (await res.json().catch(() => ({}))) as { item?: FavoriteChannel; error?: string };
        if (!res.ok) {
          setError(data.error ?? t("favoriteToggleFailed"));
          return;
        }
        setState((prev) => ({
          userId: meId,
          channels: removing
            ? prev.channels.filter((c) => c.id !== channelId)
            : data.item
              ? [data.item, ...prev.channels.filter((c) => c.id !== channelId)]
              : prev.channels,
        }));
      } finally {
        setBusyId(null);
      }
    },
    [channels, meId, requireLogin, locale, t],
  );

  return { channels, isFavorite, toggle, busyId, error, loggedIn: Boolean(meId) };
}
