export const FONT_SIZE_DEFAULT = 16;
export const FONT_SIZE_MIN = 14;
export const FONT_SIZE_MAX = 22;

export const FONT_SIZE_PRESETS = [
  { key: 'small', value: 14 },
  { key: 'normal', value: 16 },
  { key: 'large', value: 18 },
  { key: 'xlarge', value: 20 },
] as const;

export function clampFontSize(size: number): number {
  return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, size));
}

export function fontScaleMultiplier(size: number): number {
  return clampFontSize(size) / FONT_SIZE_DEFAULT;
}

export function scaleFontSize(baseSize: number, userFontSize: number): number {
  return Math.round(baseSize * fontScaleMultiplier(userFontSize));
}
