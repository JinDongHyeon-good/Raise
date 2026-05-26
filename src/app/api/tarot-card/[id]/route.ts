import { readFile } from "node:fs/promises";
import path from "node:path";
import { FULL_TAROT_DECK } from "@/lib/tarot-deck";

export const runtime = "nodejs";

async function readImage(cardId: string) {
  const card = FULL_TAROT_DECK.find((entry) => entry.id === cardId);
  if (!card) return null;

  const candidates = [
    path.join(process.cwd(), "public", "tarot", `${card.id}.jpg`),
    path.join(
      process.cwd(),
      "public",
      ...card.imageBase.replace(/^\//, "").split("/"),
      card.imageFile.normalize("NFC"),
    ),
    path.join(
      process.cwd(),
      "public",
      ...card.imageBase.replace(/^\//, "").split("/"),
      card.imageFile.normalize("NFD"),
    ),
  ];

  for (const filePath of candidates) {
    try {
      return await readFile(filePath);
    } catch {
      /* try next */
    }
  }

  return null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const buffer = await readImage(id);

  if (!buffer) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(buffer, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
