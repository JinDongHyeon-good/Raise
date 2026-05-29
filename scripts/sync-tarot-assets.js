/**
 * Copy tarot card images to ASCII-only paths: public/tarot/{cardId}.jpg
 * Run: node scripts/sync-tarot-assets.js
 *
 * Deck metadata: scripts/tarot-deck-manifest.json
 * (tarot-deck.ts 변경 시 로컬 Node 22+에서 manifest 재생성)
 */

const fs = require("fs");
const path = require("path");

function loadDeck() {
  const manifestPath = path.join(__dirname, "tarot-deck-manifest.json");
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function resolveSourcePath(card) {
  const rel = path.join(
    card.imageBase.replace(/^\//, ""),
    card.imageFile.normalize("NFC"),
  );
  const nfcPath = path.join("public", rel);

  if (fs.existsSync(nfcPath)) return nfcPath;

  const nfdPath = path.join(
    "public",
    card.imageBase.replace(/^\//, ""),
    card.imageFile.normalize("NFD"),
  );
  if (fs.existsSync(nfdPath)) return nfdPath;

  const dir = path.join("public", card.imageBase.replace(/^\//, ""));
  if (!fs.existsSync(dir)) return null;

  const target = card.imageFile.normalize("NFC");
  for (const name of fs.readdirSync(dir)) {
    if (name.normalize("NFC") === target) {
      return path.join(dir, name);
    }
  }

  return null;
}

function main() {
  const root = path.join(__dirname, "..");
  process.chdir(root);

  const deck = loadDeck();
  const outDir = path.join("public", "tarot");
  fs.mkdirSync(outDir, { recursive: true });

  let copied = 0;
  const missing = [];

  for (const card of deck) {
    const src = resolveSourcePath(card);
    const dest = path.join(outDir, `${card.id}.jpg`);

    if (!src) {
      missing.push(card.id);
      continue;
    }

    fs.copyFileSync(src, dest);
    copied += 1;
  }

  console.log(`[sync-tarot-assets] copied ${copied}/${deck.length} -> public/tarot/`);

  if (missing.length > 0) {
    console.error("[sync-tarot-assets] missing sources:", missing.join(", "));
    process.exit(1);
  }
}

try {
  main();
} catch (error) {
  console.error("[sync-tarot-assets]", error);
  process.exit(1);
}
