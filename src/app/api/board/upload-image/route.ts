import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/board-server";

export const runtime = "nodejs";
export const maxDuration = 120;

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireSessionUser();
    if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "이미지 파일이 필요합니다." }, { status: 400 });
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: "PNG/JPEG/WEBP/GIF만 업로드 가능합니다." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "이미지는 5MB 이하만 업로드 가능합니다." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
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
    return NextResponse.json({ error: e instanceof Error ? e.message : "이미지 업로드 실패" }, { status: 500 });
  }
}
