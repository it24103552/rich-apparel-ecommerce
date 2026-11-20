const COLOR_NAME_MAP = {
  white: "#ffffff",
  black: "#000000",
  navy: "#162b56",
  "dark navy": "#102347",
  "navy blue": "#162b56",
  beige: "#d9c5a0",
  cream: "#f3ead8",
  sand: "#d6c29f",
  khaki: "#c3b091",
  red: "#ff3b30",
  blue: "#007aff",
  green: "#34c759",
  yellow: "#ffcc00",
  orange: "#ff9500",
  pink: "#ff2d55",
  purple: "#af52de",
  grey: "#8e8e93",
  gray: "#8e8e93",
  brown: "#a2845e",
  maroon: "#800000",
  burgundy: "#800020",
  olive: "#808000",
  teal: "#008080",
  indigo: "#4b0082",
  violet: "#ee82ee",
  magenta: "#ff00ff",
  cyan: "#00ffff",
  lavender: "#e6e6fa",
  gold: "#ffd700",
  silver: "#c0c0c0",
  charcoal: "#36454f",
  ivory: "#fffff0",
  tan: "#d2b48c",
};

/**
 * Resolves a stored color name (including "TONE <NAME>" labels) or hex string
 * into a valid CSS color value for swatch rendering and variant matching.
 */
export const getDisplayColor = (color) => {
  if (!color || typeof color !== "string") return "#e5e5e5";

  const trimmed = color.trim().toLowerCase();
  if (!trimmed) return "#e5e5e5";

  const normalized = trimmed.replace(/^tone\s+/, "").trim();
  if (normalized.startsWith("#")) return normalized;

  if (COLOR_NAME_MAP[normalized]) {
    return COLOR_NAME_MAP[normalized];
  }

  return /^[a-z]+$/.test(normalized) ? normalized : "#e5e5e5";
};
