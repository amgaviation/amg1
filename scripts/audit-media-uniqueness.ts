// @ts-nocheck
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = process.cwd();
const exemptPaths = new Set([
  "/images/logo-blue.png",
  "/images/logo-navy.png",
  "/images/logo-original.png",
  "/images/logo-white.png",
]);
const excludedFiles = new Set([
  "components/site/portal-login.tsx",
  "components/site/portal-dashboard.tsx",
  "components/site/higgsfield-motion-showcase.tsx",
  "components/site/media/media-placeholder.tsx",
]);
const sourceRoots = ["app/(public)", "components/site", "lib/content.ts"];
const publicRequiredRoutes = [
  "/",
  "/about",
  "/services",
  "/aircraft",
  "/plans",
  "/pilot-network",
  "/team",
  "/contact",
  "/privacy-policy",
  "/terms",
  "/operational-disclaimer",
  "/mission-acceptance",
  "/credential-submission",
];

function walk(entry, files = []) {
  const full = path.join(root, entry);
  if (!fs.existsSync(full)) return files;
  const stat = fs.statSync(full);
  if (stat.isFile()) {
    files.push(entry);
    return files;
  }
  for (const child of fs.readdirSync(full)) {
    walk(path.join(entry, child), files);
  }
  return files;
}

const sourceFiles = sourceRoots
  .flatMap((entry) => walk(entry))
  .filter((file) => /\.(tsx?|jsx?)$/.test(file))
  .filter((file) => !excludedFiles.has(file))
  .filter((file) => !file.includes("app/(public)/login/"))
  .filter((file) => !file.includes("app/(public)/forgot-password/"))
  .filter((file) => !file.includes("app/(public)/reset-password/"))
  .filter((file) => !file.includes("app/(public)/signup/"))
  .filter((file) => !file.includes("app/(public)/pending-approval/"))
  .filter((file) => !file.includes("app/(public)/access-denied/"))
  .filter((file) => !file.includes("app/(public)/motion-assets/"));

const refs = new Map();
const missing = [];
const mediaPattern = /\/(?:images|videos)\/[A-Za-z0-9/_.,@() -]+\.(?:png|jpe?g|webp|avif|mp4|webm)/g;

for (const file of sourceFiles) {
  const body = fs.readFileSync(path.join(root, file), "utf8");
  const matches = body.match(mediaPattern) || [];
  for (const ref of matches) {
    if (exemptPaths.has(ref)) continue;
    const diskPath = path.join(root, "public", ref);
    if (!fs.existsSync(diskPath)) {
      missing.push(`${ref} referenced by ${file}`);
      continue;
    }
    const locations = refs.get(ref) || [];
    locations.push(file);
    refs.set(ref, locations);
  }
}

const duplicateRefs = [...refs.entries()]
  .filter(([, locations]) => new Set(locations).size > 1)
  .map(([ref, locations]) => `${ref}\n  ${[...new Set(locations)].join("\n  ")}`);

const publicMedia = [];
function walkMedia(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkMedia(full);
    if (entry.isFile() && /\.(png|jpe?g|webp|avif)$/i.test(entry.name)) publicMedia.push(full);
  }
}
walkMedia(path.join(root, "public/images"));

const hashes = new Map();
const duplicateFiles = [];
for (const file of publicMedia) {
  const rel = `/${path.relative(path.join(root, "public"), file)}`;
  if (exemptPaths.has(rel)) continue;
  const hash = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  const previous = hashes.get(hash);
  if (previous && previous !== rel) duplicateFiles.push(`${previous} and ${rel}`);
  hashes.set(hash, rel);
}

const errors = [];
if (missing.length) errors.push(`Missing public media:\n${missing.join("\n")}`);
if (duplicateRefs.length) errors.push(`Repeated non-exempt public media references:\n${duplicateRefs.join("\n")}`);
if (duplicateFiles.length) errors.push(`Identical public media files:\n${duplicateFiles.join("\n")}`);

if (errors.length) {
  console.error(errors.join("\n\n"));
  process.exit(1);
}

console.log(
  `Media audit passed: ${refs.size} non-exempt media references across ${sourceFiles.length} source files and ${publicRequiredRoutes.length} required public routes.`
);
