/**
 * Copies stable-path brand PNGs into the web export so +html.tsx and OG URLs resolve:
 *   /assets/images/social-preview.png
 *   /assets/images/icon.png
 *   /assets/images/favicon.png
 *
 * Run after: npx expo export --platform web
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const srcDir = path.join(root, 'assets/images');
const destDir = path.join(dist, 'assets/images');
const files = ['social-preview.png', 'icon.png', 'favicon.png'];

if (!fs.existsSync(dist)) {
  console.error('copy-web-brand-assets: dist/ missing. Run: npx expo export --platform web');
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
for (const f of files) {
  const from = path.join(srcDir, f);
  if (!fs.existsSync(from)) {
    console.error('copy-web-brand-assets: missing', from);
    process.exit(1);
  }
  fs.copyFileSync(from, path.join(destDir, f));
}
console.log('copy-web-brand-assets: copied', files.join(', '), '→ dist/assets/images/');
