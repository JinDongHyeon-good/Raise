/**
 * Next.js 16+ Turbopack may create hashed symlinks under .next/node_modules.
 * AWS Amplify's bundler can fail with EEXIST on those paths — resolve to real dirs.
 */

const fs = require("fs");
const path = require("path");

const nextModules = path.join(__dirname, "..", ".next", "node_modules");
const rootModules = path.join(__dirname, "..", "node_modules");

function resolveDependencyPath(depName, parentPkgPath) {
  const directPath = path.join(rootModules, depName);
  try {
    const stat = fs.lstatSync(directPath);
    if (stat.isSymbolicLink()) {
      return fs.realpathSync(directPath);
    }
    if (stat.isDirectory()) {
      return directPath;
    }
  } catch {
    /* not at root */
  }

  if (parentPkgPath) {
    const parentNodeModules = path.dirname(parentPkgPath);
    const pnpmDepPath = path.join(parentNodeModules, depName);
    try {
      const stat = fs.lstatSync(pnpmDepPath);
      if (stat.isSymbolicLink()) {
        return fs.realpathSync(pnpmDepPath);
      }
      if (stat.isDirectory()) {
        return pnpmDepPath;
      }
    } catch {
      /* not in parent */
    }
  }

  return null;
}

function copyPackageWithDeps(pkgPath, destPath, copiedSet, originalPkgPath) {
  const pkgName = path.basename(destPath);

  if (copiedSet.has(pkgName)) {
    return 0;
  }

  copiedSet.add(pkgName);
  fs.cpSync(pkgPath, destPath, { recursive: true, dereference: true });
  let count = 1;

  const pkgJsonPath = path.join(destPath, "package.json");
  if (fs.existsSync(pkgJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
    const deps = Object.keys(pkg.dependencies || {});

    for (const dep of deps) {
      const depDest = path.join(nextModules, dep);

      if (!fs.existsSync(depDest) && !copiedSet.has(dep)) {
        const depSrc = resolveDependencyPath(dep, originalPkgPath || pkgPath);
        if (depSrc) {
          count += copyPackageWithDeps(depSrc, depDest, copiedSet, depSrc);
        }
      }
    }
  }

  return count;
}

function main() {
  if (!fs.existsSync(nextModules)) {
    console.log("[resolve-next-symlinks] No .next/node_modules — skip.");
    return;
  }

  const entries = fs.readdirSync(nextModules);
  let resolved = 0;
  const copiedSet = new Set();

  for (const name of entries) {
    const linkPath = path.join(nextModules, name);
    const stat = fs.lstatSync(linkPath);

    if (stat.isSymbolicLink()) {
      const target = fs.realpathSync(linkPath);
      fs.rmSync(linkPath);
      copyPackageWithDeps(target, linkPath, copiedSet, target);
      resolved += 1;
    }
  }

  console.log(`[resolve-next-symlinks] Resolved ${resolved} symlink(s).`);
}

main();
