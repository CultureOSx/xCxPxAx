/**
 * Builds native splash PNG: brand background + logo + tagline (raster text via SVG).
 * Requires: cd server && npm install (uses server/node_modules/sharp).
 *
 * Usage: node scripts/generate-native-splash.mjs
 */
// @ts-nocheck

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const require = createRequire(import.meta.url);
const sharpPath = path.join(root, "server/node_modules/sharp");
let sharp;
try {
  sharp = require(sharpPath);
} catch {
  console.error(
    "Missing sharp. Run: cd server && npm install",
  );
  process.exit(1);
}

const W = 1284;
const H = 2778;
const BG = "#0B0B14";
const logoPath = path.join(root, "assets/images/culturepass-logo.png");
const outPath = path.join(root, "assets/images/splash-icon.png");

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function main() {
  if (!fs.existsSync(logoPath)) {
    console.error("Missing", logoPath);
    process.exit(1);
  }

  const logoBuf = await sharp(logoPath)
    .resize({ width: 720, fit: "inside" })
    .png()
    .toBuffer();

  const meta = await sharp(logoBuf).metadata();
  const lw = meta.width ?? 720;
  const lh = meta.height ?? 200;
  const lx = Math.round((W - lw) / 2);
  const ly = Math.round(H * 0.34 - lh / 2);

  const line1 = "Celebrate Your Culture,";
  const line2 = "Connect Your Community";
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tagGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFC857"/>
      <stop offset="55%" stop-color="#FF5E5B"/>
      <stop offset="100%" stop-color="#0066CC"/>
    </linearGradient>
  </defs>
  <text x="${W / 2}" y="${Math.round(H * 0.62)}" text-anchor="middle"
    fill="#D8DCE6" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    font-size="40" font-weight="600" letter-spacing="0.02em">${escapeXml(line1)}</text>
  <text x="${W / 2}" y="${Math.round(H * 0.62) + 56}" text-anchor="middle"
    fill="url(#tagGrad)" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    font-size="40" font-weight="600" letter-spacing="0.02em">${escapeXml(line2)}</text>
</svg>`;

  const textLayer = await sharp(Buffer.from(svg)).png().toBuffer();

  await sharp({
    create: { width: W, height: H, channels: 3, background: BG },
  })
    .composite([
      { input: textLayer, left: 0, top: 0 },
      { input: logoBuf, left: lx, top: ly },
    ])
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  console.log("Wrote", outPath, `${W}×${H}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
