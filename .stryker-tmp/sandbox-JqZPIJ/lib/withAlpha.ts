// @ts-nocheck
// Robust color alpha utility for CulturePass
// Accepts hex (3/6/8), rgb(a), named colors, returns rgba() or original on error

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  if (c.length === 6) {
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (c.length === 8) {
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    const a = parseInt(c.slice(6, 8), 16) / 255;
    return `rgba(${r},${g},${b},${(a * alpha).toFixed(3)})`;
  }
  return hex; // fallback
}

export function withAlpha(color: string, alpha: number): string {
  if (!color) return color;
  if (color.startsWith('#')) return hexToRgba(color, alpha);
  if (color.startsWith('rgb')) {
    // rgb or rgba
    const parts = color.match(/\d+/g);
    if (!parts) return color;
    const [r, g, b, a] = parts.map(Number);
    if (typeof a === 'number') {
      return `rgba(${r},${g},${b},${(a * alpha).toFixed(3)})`;
    }
    return `rgba(${r},${g},${b},${alpha})`;
  }
  // fallback for named colors or unknown
  return color;
}
