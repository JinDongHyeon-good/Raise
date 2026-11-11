"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { BoardEditor } from "@/components/board/board-editor";
import {
  BOARD_POST_TYPES,
  boardPostTypeLabelKey,
  isBoardPostType,
  type BoardPostSummary,
  type BoardPostType,
} from "@/lib/board-types";
import { Link, useRouter } from "@/navigation";

export function PostWrite() {
  const t = useTranslations("community");
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("edit");
  const initialType = params.get("type");
  const { me, loading: authLoading, openLogin } = useAuth();

  const [type, setType] = useState<BoardPostType | null>(isBoardPostType(initialType) ? initialType : null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(!editId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editId) return;
    let alive = true;
    fetch(`/api/board/posts/${editId}`, { cache: "no-store", headers: { "x-ui-locale": locale } })
      .then((res) => res.json())
      .then((data: { item?: BoardPostSummary; error?: string }) => {
        if (!alive) return;
        if (!data.item) return setError(data.error ?? t("loadPostFailed"));
        setType(data.item.post_type);
        setTitle(data.item.title);
        setContent(data.item.content_html ?? "");
        setLoaded(true);
      })
      .catch(() => alive && setError(t("loadPostFailed")));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  if (!authLoading && !me) {
    return (
      <main className="rz-container max-w-3xl py-16 text-center">
        <p className="text-sm text-[var(--rz-muted)]">{t("loginToWrite")}</p>
        <button type="button" onClick={openLogin} className="mt-4 rounded-lg bg-[var(--rz-accent)] px-4 py-2 text-sm text-white">
          {t("login")}
        </button>
      </main>
    );
  }

  const submit = async () => {
    setError(null);
    if (!type) return setError(t("chooseBoard"));
    if (!title.trim()) return setError(t("enterTitle"));
    setSaving(true);
    try {
      const res = await fetch(editId ? `/api/board/posts/${editId}` : "/api/board/posts", {
        method: editId ? "PATCH" : "POST",
        headers: { "content-type": "application/json", "x-ui-locale": locale },
        body: JSON.stringify({ title: title.trim(), content_html: content, post_type: type }),
      });
      const data = (await res.json()) as { item?: BoardPostSummary; error?: string };
      if (res.status === 401) return openLogin();
      if (!res.ok || !data.item) return setError(data.error ?? t("saveFailed"));
      router.push(`/community/${data.item.id}`);
    } catch {
      setError(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="rz-container max-w-3xl py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{editId ? t("editPost") : t("write")}</h1>
        <Link href={editId ? `/community/${editId}` : "/community"} className="text-xs text-[var(--rz-muted)] hover:text-[var(--rz-text)]">
          {t("cancel")}
        </Link>
      </div>

      {!loaded && !error ? (
        <div className="h-72 animate-pulse rounded-xl bg-[var(--rz-panel-2)]" />
      ) : (
        <div className="space-y-3">
          <fieldset>
            <legend className="mb-2 text-xs text-[var(--rz-muted)]">{t("board")}</legend>
            <div className="flex flex-wrap gap-2">
              {BOARD_POST_TYPES.map((board) => (
                <button
                  key={board}
                  type="button"
                  onClick={() => setType(board)}
                  aria-pressed={type === board}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    type === board
                      ? "border-[var(--rz-accent)] bg-[var(--rz-accent)]/15 text-[var(--rz-text)]"
                      : "border-[var(--rz-line)] text-[var(--rz-muted)] hover:text-[var(--rz-text)]"
                  }`}
                >
                  {t(boardPostTypeLabelKey(board))}
                </button>
              ))}
            </div>
          </fieldset>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder={t("titlePlaceholder")}
            className="w-full rounded-lg border border-[var(--rz-line)] bg-[var(--rz-panel)] px-3 py-2.5 text-base outline-none focus:border-[var(--rz-accent)]"
          />

          {loaded ? <BoardEditor key={editId ?? "new"} value={content} onChange={setContent} onNeedLogin={openLogin} /> : null}

          {error ? <p className="text-sm text-[var(--rz-up)]">{error}</p> : null}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void submit()}
              disabled={saving}
              className="rounded-lg bg-[var(--rz-accent)] px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? t("saving") : editId ? t("saveEdit") : t("submit")}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
