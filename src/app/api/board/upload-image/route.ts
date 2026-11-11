import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { apiTranslator } from "@/lib/server-i18n";
import { requireSessionUser } from "@/lib/board-server";

export const runtime = "nodejs";
export const maxDuration = 120;

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const t = apiTranslator(request);
  try {
    const { supabase, user } = await requireSessionUser();
    if (!user) return NextResponse.json({ error: t("board.loginRequired") }, { status: 401 });

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: t("board.imageRequired") }, { status: 400 });
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: t("board.imageTypeInvalid") }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: t("board.imageTooLarge") }, { status: 400 });
    }

    const ext = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" }[file.type] ?? "png";
    const objectPath = `${user.id}/${Date.now()}-${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage.from("board-images").upload(objectPath, buffer, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data } = supabase.storage.from("board-images").getPublicUrl(objectPath);
    return NextResponse.json({ url: data.publicUrl, path: objectPath });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : t("board.imageUploadFailed") }, { status: 500 });
  }
}
