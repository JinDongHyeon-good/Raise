"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useTranslations } from "next-intl";

type BoardEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onNeedLogin?: () => void;
};

export function BoardEditor({ value, onChange, onNeedLogin }: BoardEditorProps) {
  const t = useTranslations("board");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: t("editorPlaceholder"),
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "board-editor-content min-h-[220px] px-4 py-3 text-sm leading-7 text-[var(--piclick-ink)] focus:outline-none",
      },
    },
    onUpdate({ editor: current }) {
      onChange(current.getHTML());
    },
    immediatelyRender: false,
  });

  const handleInsertLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt(t("linkPrompt"), previous ?? "https://");
    if (!href) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  const handleImageUpload = async () => {
    if (!editor) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/board/upload-image", {
        method: "POST",
        body: formData,
      });
      if (response.status === 401) {
        onNeedLogin?.();
        return;
      }
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        alert(data.error ?? t("imageUploadFailed"));
        return;
      }
      editor.chain().focus().setImage({ src: data.url, alt: "board-image" }).run();
    };
    input.click();
  };

  if (!editor) return null;

  const toolClass = (active: boolean) =>
    `rounded px-2.5 py-1.5 text-xs font-medium transition ${
      active
        ? "bg-[var(--piclick-green)] text-white"
        : "bg-white text-[var(--piclick-ink-muted)] hover:bg-[var(--piclick-beige)] hover:text-[var(--piclick-ink)]"
    }`;

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--piclick-line)] bg-white">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--piclick-line)] bg-[var(--piclick-beige-soft)] p-2">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={toolClass(editor.isActive("bold"))}>
          {t("toolbar.bold")}
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={toolClass(editor.isActive("italic"))}>
          {t("toolbar.italic")}
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={toolClass(editor.isActive("underline"))}
        >
          {t("toolbar.underline")}
        </button>
        <button type="button" onClick={handleInsertLink} className={toolClass(false)}>
          {t("toolbar.link")}
        </button>
        <button type="button" onClick={() => void handleImageUpload()} className={toolClass(false)}>
          {t("toolbar.image")}
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
