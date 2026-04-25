"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

type BoardEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onNeedLogin?: () => void;
};

export function BoardEditor({ value, onChange, onNeedLogin }: BoardEditorProps) {
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
        placeholder: "게시글 내용을 입력해 주세요. 이미지 업로드도 가능합니다.",
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "min-h-[220px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-slate-100 focus:outline-none",
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
    const href = window.prompt("링크 URL을 입력해 주세요.", previous ?? "https://");
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
        alert(data.error ?? "이미지 업로드에 실패했습니다.");
        return;
      }
      editor.chain().focus().setImage({ src: data.url, alt: "board-image" }).run();
    };
    input.click();
  };

  if (!editor) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 p-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded px-2 py-1 text-xs ${editor.isActive("bold") ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-200"}`}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded px-2 py-1 text-xs ${editor.isActive("italic") ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-200"}`}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`rounded px-2 py-1 text-xs ${editor.isActive("underline") ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-200"}`}
        >
          Underline
        </button>
        <button type="button" onClick={handleInsertLink} className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-200">
          Link
        </button>
        <button type="button" onClick={handleImageUpload} className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-200">
          Image
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
