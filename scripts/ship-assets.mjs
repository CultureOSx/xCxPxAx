/**
 * Generates store- and web-ready raster assets from existing brand PNGs.
 * Requires: cd server && npm install (Sharp lives in server/node_modules).
 *
 *   node scripts/ship-assets.mjs
 *
 * Outputs:
 *   assets/images/social-preview.png — 1200×630 Open Graph / Twitter large card
 *   assets/images/favicon.png          — 192×192 web favicon (reasonable weight)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require(path.join(root, 'server/node_modules/sharp'));
} catch {
  console.error('Missing sharp. Run: cd server && npm install');
  process.exit(1);
}

const logoPath = path.join(root, 'assets/images/culturepass-logo.png');
const iconPath = path.join(root, 'assets/images/icon.png');
const outSocial = path.join(root, 'assets/images/social-preview.png');
const outFavicon = path.join(root, 'assets/images/favicon.png');

const OG_W = 1200;
const OG_H = 630;
const FAV = 192;

/** Brand midnight → indigo gradient (matches app shell). */
async function ogBackground() {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${OG_W}" height="${OG_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0B14"/>
      <stop offset="55%" stop-color="#1a1a2e"/>
      <stop offset="100%" stop-color="#0066CC"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function main() {
  if (!fs.existsSync(logoPath)) {
    console.error('Missing', logoPath);
    process.exit(1);
  }
  if (!fs.existsSync(iconPath)) {
    console.error('Missing', iconPath);
    process.exit(1);
  }

  const bgBuf = await ogBackground();
  const logoBuf = await sharp(logoPath)
    .resize({ width: 520, height: 280, fit: 'inside' })
    .png()
    .toBuffer();

  const lm = await sharp(logoBuf).metadata();
  const lw = lm.width ?? 400;
  const lh = lm.height ?? 120;
  const lx = Math.round((OG_W - lw) / 2);
  const ly = Math.round((OG_H - lh) / 2);

  await sharp(bgBuf)
    .composite([{ input: logoBuf, left: lx, top: ly }])
    .png({ compressionLevel: 9 })
    .toFile(outSocial);

  await sharp(iconPath)
    .resize(FAV, FAV, { fit: 'cover' })
    .png()
    .toFile(outFavicon);

  console.log('Wrote', path.relative(root, outSocial), `${OG_W}×${OG_H}`);
  console.log('Wrote', path.relative(root, outFavicon), `${FAV}×${FAV}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
