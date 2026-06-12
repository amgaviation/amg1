// @ts-nocheck
const fs = require("fs");
const path = require("path");
const nodeCrypto = require("crypto");

const root = process.cwd();
const manifestPath = path.join(root, "lib/media/manifest.ts");
const manifest = fs.readFileSync(manifestPath, "utf8");

const idMatches = [...manifest.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
const pathMatches = [...manifest.matchAll(/(?:fallbackAsset|sourcePath|mobileSourcePath|posterSourcePath):\s*"([^"]+)"/g)]
  .map((m) => m[1])
  .filter(Boolean);

const errors = [];
const seenIds = new Set();
for (const id of idMatches) {
  if (seenIds.has(id)) errors.push(`Duplicate media id: ${id}`);
  seenIds.add(id);
}

const seenPaths = new Map();
for (const assetPath of pathMatches) {
  if (!assetPath.startsWith("/")) continue;
  const filePath = path.join(root, "public", assetPath);
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing media file: ${assetPath}`);
    continue;
  }
  const previous = seenPaths.get(assetPath);
  if (previous) errors.push(`Repeated manifest media path: ${assetPath}`);
  seenPaths.set(assetPath, true);
}

const files = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    if (entry.isFile() && /\.(png|jpe?g|webp|avif|mp4|webm)$/i.test(entry.name)) files.push(full);
  }
}
walk(path.join(root, "public/images"));
walk(path.join(root, "public/videos"));
walk(path.join(root, "public/media"));

const hashes = new Map();
for (const file of files) {
  const hash = nodeCrypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  const rel = `/${path.relative(path.join(root, "public"), file)}`;
  const existing = hashes.get(hash);
  if (existing && existing !== rel) errors.push(`Identical media files: ${existing} and ${rel}`);
  hashes.set(hash, rel);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Media audit passed: ${idMatches.length} manifest IDs, ${pathMatches.length} manifest paths, ${files.length} public media files.`);
