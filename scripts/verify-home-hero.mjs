import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const pagePath = join(root, "app/(public)/page.tsx");
const imagePath = join(root, "public/images/amg-custom/home-hero-amg-hangar-night-ramp.png");

const source = readFileSync(pagePath, "utf8");
const image = existsSync(imagePath) ? readFileSync(imagePath) : undefined;
const imageWidth = image?.readUInt32BE(16);
const imageHeight = image?.readUInt32BE(20);

const checks = [
  ["hero image exists locally", existsSync(imagePath)],
  ["hero image matches supplied dimensions", imageWidth === 1672 && imageHeight === 941],
  ["hero uses the local image", source.includes('src="/images/amg-custom/home-hero-amg-hangar-night-ramp.png"')],
  ["primary CTA label is preserved", source.includes("Request Aircraft Support")],
  ["secondary CTA label is preserved", source.includes("Explore Services")],
  ["primary CTA route is preserved", source.includes('href="/booking-request"')],
  ["secondary CTA route is preserved", source.includes('href="/services"')],
  ["current hero headline remains visible", source.includes("Global Aviation. Driven by Excellence.") && !source.includes("md:sr-only")],
  ["dark navy background fallback is present", source.includes("bg-[#050B14]")],
  ["left-to-right navy overlay is present", source.includes("linear-gradient(90deg")],
  ["bottom fade is present", source.includes("bottom-0") && source.includes("from-transparent") && source.includes("to-[#050B14]")],
];

const failures = checks.filter(([, passed]) => !passed);

if (failures.length > 0) {
  console.error("Home hero verification failed:");
  for (const [label] of failures) {
    console.error(`- ${label}`);
  }
  process.exit(1);
}

console.log("Home hero verification passed.");
