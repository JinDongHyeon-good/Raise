/**
 * Amplify Hosting serves mutable static assets from .amplify-hosting/static.
 * public/ is not included when artifacts.baseDirectory is .next only.
 */

const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "..", "public");
const staticDir = path.join(__dirname, "..", ".amplify-hosting", "static");

function copyPublicDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destName = entry.name.normalize("NFC");
    const destPath = path.join(dest, destName);

    if (entry.isDirectory()) {
      copyPublicDir(srcPath, destPath);
      continue;
    }

    fs.copyFileSync(srcPath, destPath);
  }
}

function main() {
  if (!fs.existsSync(publicDir)) {
    console.log("[prepare-amplify-static] public/ not found — skip.");
    return;
  }

  fs.rmSync(staticDir, { recursive: true, force: true });
  copyPublicDir(publicDir, staticDir);
  console.log("[prepare-amplify-static] Copied public/ to .amplify-hosting/static");
}

main();
