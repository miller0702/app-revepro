export type CoverFocus = {
  x: number;
  y: number;
};

export const DEFAULT_COVER_FOCUS: CoverFocus = { x: 50, y: 50 };

export function clampCoverFocus(value: number): number {
  'worklet';
  return Math.min(100, Math.max(0, value));
}

export function toCoverContentPosition(focus: CoverFocus) {
  return {
    left: `${clampCoverFocus(focus.x)}%`,
    top: `${clampCoverFocus(focus.y)}%`,
  } as const;
}
