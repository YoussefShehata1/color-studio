// ============================================================
// Color Utility Functions
// ============================================================

// --- HEX <-> RGB ---

export function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length !== 6) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}

// --- RGB <-> HSL ---

export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
  };
}

export function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

export function hexToHsl(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

// --- Validation ---

export function isValidHex(hex) {
  return /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex.trim());
}

export function normalizeHex(hex) {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return '#' + clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }
  return '#' + clean.toUpperCase();
}

// --- Luminance & Contrast (WCAG) ---

export function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map(c =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// --- Color Generation ---

export function randomHsl() {
  return {
    h: Math.floor(Math.random() * 360),
    s: Math.floor(Math.random() * 30 + 55), // 55-85 — vibrant
    l: Math.floor(Math.random() * 30 + 35), // 35-65 — mid tone
  };
}

export function generatePalette(baseHex, size = 5, lockedIndices = [], lockedColors = []) {
  const base = hexToHsl(baseHex) || randomHsl();
  const palette = [];

  // Spread lightness across the palette
  const lightnessSteps = [];
  if (size === 3) lightnessSteps.push(25, 50, 75);
  else if (size === 5) lightnessSteps.push(20, 35, 50, 65, 80);
  else if (size === 6) lightnessSteps.push(15, 28, 42, 56, 70, 84);
  else if (size === 8) lightnessSteps.push(12, 22, 33, 44, 55, 66, 76, 86);
  else {
    const step = 70 / (size - 1);
    for (let i = 0; i < size; i++) lightnessSteps.push(Math.round(15 + step * i));
  }

  // Add slight hue variation per step for richness
  const hueShift = Math.random() * 20 - 10; // ±10 deg shift across palette
  const satVariation = (Math.random() * 20 - 10); // ±10

  for (let i = 0; i < size; i++) {
    if (lockedIndices.includes(i) && lockedColors[i]) {
      palette.push(lockedColors[i]);
    } else {
      const h = (base.h + hueShift * (i / size)) % 360;
      const s = Math.max(10, Math.min(100, base.s + satVariation * (i / size)));
      const l = lightnessSteps[i];
      palette.push(hslToHex((h + 360) % 360, s, l));
    }
  }
  return palette;
}

// --- Harmony Generation ---

export function generateHarmony(baseHex, type) {
  const hsl = hexToHsl(baseHex);
  if (!hsl) return [];
  const { h, s, l } = hsl;

  const makeColor = (hue, sat = s, lig = l) => hslToHex((hue + 360) % 360, Math.max(20, Math.min(95, sat)), Math.max(15, Math.min(85, lig)));

  switch (type) {
    case 'complementary':
      return [
        makeColor(h),
        makeColor(h, s, l - 15),
        makeColor(h + 180),
        makeColor(h + 180, s, l + 15),
        makeColor(h + 180, s - 10, l - 10),
      ];

    case 'analogous':
      return [
        makeColor(h - 40),
        makeColor(h - 20),
        makeColor(h),
        makeColor(h + 20),
        makeColor(h + 40),
      ];

    case 'triadic':
      return [
        makeColor(h),
        makeColor(h, s, l + 15),
        makeColor(h + 120),
        makeColor(h + 120, s, l - 10),
        makeColor(h + 240),
        makeColor(h + 240, s, l + 10),
      ].slice(0, 6);

    case 'splitComplementary':
      return [
        makeColor(h),
        makeColor(h, s, l - 15),
        makeColor(h + 150),
        makeColor(h + 150, s, l + 10),
        makeColor(h + 210),
        makeColor(h + 210, s, l - 10),
      ].slice(0, 5);

    case 'monochromatic':
      return [
        makeColor(h, s, 20),
        makeColor(h, s, 35),
        makeColor(h, s, l),
        makeColor(h, s - 10, 65),
        makeColor(h, s - 20, 80),
      ];

    default:
      return [makeColor(h)];
  }
}

// --- Color Distance (for extractor deduplication) ---

export function colorDistance(hex1, hex2) {
  const a = hexToRgb(hex1);
  const b = hexToRgb(hex2);
  if (!a || !b) return Infinity;
  return Math.sqrt(
    Math.pow(a.r - b.r, 2) +
    Math.pow(a.g - b.g, 2) +
    Math.pow(a.b - b.b, 2)
  );
}

// --- Format conversions ---

export function hexToRgbString(hex) {
  const { r, g, b } = hexToRgb(hex) || {};
  return `rgb(${r}, ${g}, ${b})`;
}

export function hexToHslString(hex) {
  const { h, s, l } = hexToHsl(hex) || {};
  return `hsl(${h}, ${s}%, ${l}%)`;
}

// --- Readable text color (black or white) ---

export function getReadableTextColor(hex) {
  const lum = relativeLuminance(hex);
  return lum > 0.179 ? '#000000' : '#ffffff';
}

// --- Random bright color ---

export function randomVibrantHex() {
  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(Math.random() * 20 + 65); // 65-85
  const l = Math.floor(Math.random() * 20 + 40); // 40-60
  return hslToHex(h, s, l);
}
