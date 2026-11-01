import { hexToRgb, hexToHsl } from './colorUtils.js';

function sanitizeName(name) {
  return (name || 'palette').replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, '').replace(/\s+/g, '-').toLowerCase() || 'palette';
}

export function generateExport(palette, format, name = 'My Palette') {
  const colors = palette.map((hex, i) => ({
    hex: hex.toUpperCase(),
    rgb: hexToRgb(hex),
    hsl: hexToHsl(hex),
    index: i + 1,
    name: `color-${i + 1}`,
  }));

  switch (format) {
    case 'hex':
      return colors.map(c => c.hex).join('\n');

    case 'rgb':
      return colors.map(c => `rgb(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b})`).join('\n');

    case 'hsl':
      return colors.map(c => `hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)`).join('\n');

    case 'css':
      return `:root {\n${colors.map(c => `  --${c.name}: ${c.hex};`).join('\n')}\n}`;

    case 'json':
      return JSON.stringify({
        name,
        colors: colors.map(c => ({
          name: c.name,
          hex: c.hex,
          rgb: `rgb(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b})`,
          hsl: `hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)`,
        }))
      }, null, 2);

    case 'tailwind': {
      const safeName = sanitizeName(name);
      const tw = {};
      colors.forEach((c, i) => {
        const shade = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900][i] ?? (i + 1) * 100;
        tw[shade] = c.hex;
      });
      return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        '${safeName}': ${JSON.stringify(tw, null, 10).replace(/^/gm, '        ').trim()}\n      }\n    }\n  }\n}`;
    }

    default:
      return '';
  }
}

export function downloadText(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPng(palette, name = 'palette') {
  const w = Math.max(600, palette.length * 120);
  const h = 200;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const sw = w / palette.length;

  palette.forEach((hex, i) => {
    ctx.fillStyle = hex;
    ctx.fillRect(i * sw, 0, sw, h - 36);
    // HEX label
    ctx.fillStyle = getReadableText(hex);
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(hex.toUpperCase(), i * sw + sw / 2, h - 46);
  });

  // Bottom bar
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, h - 36, w, 36);
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, w / 2, h - 13);

  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeName(name)}-palette.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function getReadableText(hex) {
  const { r, g, b } = hexToRgb(hex) || { r: 0, g: 0, b: 0 };
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum > 128 ? '#000000' : '#ffffff';
}
