/** Degradado corto bajo el título del header. */
export const HEADER_FADE_HEIGHT = 18;

/** Degradado sobre el tab bar (no ocupa toda la pantalla). */
export const BOTTOM_FADE_HEIGHT = 28;

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const value = hex.replace('#', '');
  if (value.length !== 6) return null;
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b };
}

/** Mismo color de fondo con alpha — evita bandas distintas a `transparent`. */
export function withBackgroundAlpha(background: string, alpha: number): string {
  const rgb = parseHex(background);
  if (!rgb) return background;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/** Degradado bajo el título: sólido → transparente en pocos px. */
export function headerBottomFade(background: string) {
  return {
    colors: [
      background,
      withBackgroundAlpha(background, 0.82),
      withBackgroundAlpha(background, 0),
    ] as const,
    locations: [0, 0.55, 1] as const,
  };
}

/** Franja justo encima del tab bar. */
export function bottomChromeFade(background: string) {
  return {
    colors: [
      withBackgroundAlpha(background, 0),
      withBackgroundAlpha(background, 0.75),
      background,
    ] as const,
    locations: [0, 0.62, 1] as const,
  };
}

/** @deprecated Usar HEADER_FADE_HEIGHT */
export const CHROME_FADE_HEIGHT = HEADER_FADE_HEIGHT;
