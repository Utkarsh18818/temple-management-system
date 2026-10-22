// Run after replacing archive photos: node scripts/optimize-mandir-images.mjs
import sharp from "sharp";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve("public/images");
const sources = [
  ["Deep-Ekadashi-1.jpg", "mandir-entrance.webp"],
  ["srms-deepdan.jpg", "mandir-darshan.webp"],
  ["Deep-Ekadashi-12.jpg", "mandir-community.webp"],
  ["srms-janmashtami.jpg", "mandir-janmashtami.webp"],
  ...Array.from({ length: 6 }, (_, index) => [`gallery-deepdan-${index + 2}.jpg`, `gallery-deepdan-${index + 2}.webp`]),
];
let before = 0, after = 0;
for (const [source, target] of sources) {
  before += (await stat(resolve(root, source))).size;
  await sharp(resolve(root, source)).rotate().webp({ quality: 78, effort: 6 }).toFile(resolve(root, target));
  after += (await stat(resolve(root, target))).size;
}
for (let index = 1; index <= 7; index++) {
  await sharp(resolve(root, `gallery-deepdan-${index}.jpg`))
    .resize(120, 90, { fit: "cover" }).webp({ quality: 72 })
    .toFile(resolve(root, `gallery-thumb-${index}.webp`));
}
console.log(JSON.stringify({ sourceBytes: before, webpBytes: after, reductionPercent: Math.round((1 - after / before) * 100) }));
