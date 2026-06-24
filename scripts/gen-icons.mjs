// Generates the raster favicons from app/icon.svg.
// One-off dev script — run when the icon changes:
//   npm i sharp png-to-ico --no-save && node scripts/gen-icons.mjs
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const svg = readFileSync("app/icon.svg");

// Apple touch icon: full-bleed (flatten fills the rounded corners with ink so
// iOS can apply its own mask cleanly — no transparent corners).
await sharp(svg, { density: 384 })
  .resize(180, 180)
  .flatten({ background: "#14161A" })
  .png()
  .toFile("app/apple-icon.png");

// favicon.ico (multi-size, keeps the rounded transparent corners)
const sizes = [16, 32, 48];
const buffers = await Promise.all(
  sizes.map((s) => sharp(svg, { density: 384 }).resize(s, s).png().toBuffer())
);
writeFileSync("app/favicon.ico", await pngToIco(buffers));

console.log("Generated app/apple-icon.png and app/favicon.ico");
