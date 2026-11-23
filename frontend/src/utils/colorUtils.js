const COLOR_NAME_MAP = {
  white: "#ffffff",
  "off white": "#f8f6f0",
  "off-white": "#f8f6f0",
  "warm white": "#faf7f2",
  black: "#000000",
  "jet black": "#0a0a0a",
  navy: "#162b56",
  "dark navy": "#102347",
  "navy blue": "#162b56",
  beige: "#d9c5a0",
  cream: "#f3ead8",
  sand: "#d6c29f",
  sandstone: "#c9b394",
  oat: "#dfd3c3",
  oatmeal: "#d9cbb8",
  ecru: "#e6dcc8",
  champagne: "#e8d5b7",
  khaki: "#c3b091",
  camel: "#c19a6b",
  taupe: "#8b7d6b",
  mocha: "#7b5e4b",
  coffee: "#6f4e37",
  chocolate: "#4a2c2a",
  espresso: "#3b2314",
  terracotta: "#c66b4e",
  rust: "#a64b2a",
  red: "#ff3b30",
  crimson: "#dc143c",
  scarlet: "#e03c31",
  wine: "#722f37",
  maroon: "#800000",
  burgundy: "#800020",
  blue: "#007aff",
  "light blue": "#89cff0",
  "sky blue": "#87ceeb",
  "baby blue": "#a2cffe",
  "royal blue": "#2563eb",
  cobalt: "#0047ab",
  denim: "#4f6d8a",
  "steel blue": "#4682b4",
  green: "#34c759",
  "dark green": "#1b4d3e",
  "forest green": "#22543d",
  "hunter green": "#2a4d3c",
  emerald: "#047857",
  "emerald green": "#047857",
  sage: "#9caf88",
  "sage green": "#9caf88",
  moss: "#6b7b53",
  mint: "#98e2c6",
  "mint green": "#98e2c6",
  olive: "#808000",
  "olive green": "#6b7040",
  lime: "#84cc16",
  yellow: "#ffcc00",
  mustard: "#d4a017",
  ochre: "#cc7722",
  amber: "#d97706",
  orange: "#ff9500",
  "burnt orange": "#cc5500",
  coral: "#ff7f50",
  peach: "#f6b89e",
  salmon: "#fa8072",
  pink: "#ff2d55",
  blush: "#e8b4b8",
  rose: "#d98695",
  "dusty rose": "#c98b93",
  "dusty pink": "#d49ba7",
  "baby pink": "#f4c2c2",
  "hot pink": "#ff4f9a",
  purple: "#af52de",
  plum: "#6d3b5b",
  mauve: "#b784a7",
  lilac: "#c8a2c8",
  lavender: "#e6e6fa",
  indigo: "#4b0082",
  violet: "#ee82ee",
  magenta: "#ff00ff",
  teal: "#008080",
  cyan: "#00ffff",
  grey: "#8e8e93",
  gray: "#8e8e93",
  "light grey": "#d1d5db",
  "light gray": "#d1d5db",
  "dark grey": "#4b5563",
  "dark gray": "#4b5563",
  "heather grey": "#a1a1aa",
  "heather gray": "#a1a1aa",
  ash: "#b2b5b8",
  stone: "#a8a29e",
  slate: "#64748b",
  charcoal: "#36454f",
  brown: "#a2845e",
  gold: "#ffd700",
  bronze: "#b08d57",
  copper: "#b87333",
  silver: "#c0c0c0",
  ivory: "#fffff0",
  tan: "#d2b48c",
};

const HEX_COLOR_RE = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const EMBEDDED_HEX_RE = /#([0-9a-f]{6}|[0-9a-f]{3})\b/i;
const CSS_FUNC_COLOR_RE = /^(rgba?|hsla?)\([^()]+\)$/i;

const extractRawColor = (color) => {
  if (!color) return "";
  if (typeof color === "object") {
    return String(color.hex || color.color || color.value || "").trim();
  }
  return typeof color === "string" ? color.trim() : "";
};

const expandShortHex = (hex) => {
  const clean = hex.trim();
  if (/^#[0-9a-f]{6}$/i.test(clean)) return clean.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(clean)) {
    const [, r, g, b] = clean;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
};

const rgbStringToHex = (rgbStr) => {
  const match = rgbStr.match(/^rgba?\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})/i);
  if (!match) return null;
  const toByte = (n) => Math.max(0, Math.min(255, Number(n))).toString(16).padStart(2, "0");
  return `#${toByte(match[1])}${toByte(match[2])}${toByte(match[3])}`;
};

/**
 * Returns true if the input string is an explicit CSS color value
 * (hex, rgb/rgba, or hsl/hsla).
 */
export const isExplicitColorCode = (value) => {
  const raw = extractRawColor(value);
  if (!raw) return false;
  const normalized = raw.replace(/^tone\s+/i, "").trim();
  return HEX_COLOR_RE.test(normalized) || CSS_FUNC_COLOR_RE.test(normalized);
};

/**
 * Converts a CSS color string (hex, rgb/rgba, or known named color) into a
 * 7-character `#rrggbb` hex string suitable for `<input type="color">`.
 * Returns null if the input cannot be converted to a known hex color.
 */
export const toHexColor = (color) => {
  const raw = extractRawColor(color);
  if (!raw) return null;

  const normalized = raw.toLowerCase().replace(/^tone\s+/, "").trim();
  if (HEX_COLOR_RE.test(normalized)) {
    return expandShortHex(normalized) || normalized.slice(0, 7);
  }
  if (CSS_FUNC_COLOR_RE.test(normalized) && normalized.startsWith("rgb")) {
    return rgbStringToHex(normalized);
  }
  if (COLOR_NAME_MAP[normalized]) {
    return COLOR_NAME_MAP[normalized];
  }
  const embeddedHex = normalized.match(EMBEDDED_HEX_RE);
  if (embeddedHex) {
    return expandShortHex(embeddedHex[0]);
  }
  return null;
};

/**
 * Resolves a stored color name (including "TONE <NAME>" labels), hex string,
 * or CSS rgb/rgba/hsl/hsla value into a valid CSS color value for swatch
 * rendering and variant matching.
 */
export const getDisplayColor = (color) => {
  const raw = extractRawColor(color);
  if (!raw) return "#e5e5e5";

  const trimmed = raw.toLowerCase();
  const normalized = trimmed.replace(/^tone\s+/, "").trim();

  if (HEX_COLOR_RE.test(normalized)) {
    return normalized;
  }

  if (CSS_FUNC_COLOR_RE.test(normalized)) {
    return normalized;
  }

  if (COLOR_NAME_MAP[normalized]) {
    return COLOR_NAME_MAP[normalized];
  }

  const embeddedHex = normalized.match(EMBEDDED_HEX_RE);
  if (embeddedHex) {
    return embeddedHex[0];
  }

  if (/^[a-z]+$/.test(normalized)) {
    if (typeof CSS === "undefined" || typeof CSS.supports !== "function" || CSS.supports("color", normalized)) {
      return normalized;
    }
  }

  return "#e5e5e5";
};
