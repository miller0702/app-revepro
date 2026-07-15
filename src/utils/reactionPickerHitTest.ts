import { COMMUNITY_REACTIONS, type CommunityReactionType } from '../constants/communityReactions';

export const REACTION_SLOT_COUNT = COMMUNITY_REACTIONS.length;
export const REACTION_SLOT_WIDTH = 52;
export const REACTION_PICKER_PAD_X = 10;
export const REACTION_PICKER_WIDTH =
  REACTION_SLOT_COUNT * REACTION_SLOT_WIDTH + REACTION_PICKER_PAD_X * 2;
/** Altura visual (label + emoji + padding). */
export const REACTION_PICKER_HEIGHT = 96;

export type ReactionPickerLayout = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

/** Índice de reacción según X relativa al pill (coordenada local). */
export function reactionIndexFromLocalX(localX: number): number | null {
  const x = localX - REACTION_PICKER_PAD_X;
  if (x < -8 || x > REACTION_SLOT_COUNT * REACTION_SLOT_WIDTH + 8) return null;
  const index = Math.floor(Math.max(0, Math.min(x, REACTION_SLOT_COUNT * REACTION_SLOT_WIDTH - 1)) / REACTION_SLOT_WIDTH);
  return index;
}

export function reactionTypeFromLocalX(localX: number): CommunityReactionType | null {
  const index = reactionIndexFromLocalX(localX);
  if (index == null) return null;
  return COMMUNITY_REACTIONS[index]?.type ?? null;
}

export function hitTestReactionPicker(
  x: number,
  y: number,
  layouts: Map<CommunityReactionType, ReactionPickerLayout>,
): CommunityReactionType | null {
  const padX = 10;
  const padY = 40;

  for (const reaction of COMMUNITY_REACTIONS) {
    const box = layouts.get(reaction.type);
    if (!box) continue;
    if (
      x >= box.left - padX &&
      x <= box.right + padX &&
      y >= box.top - padY &&
      y <= box.bottom + padY
    ) {
      return reaction.type;
    }
  }
  return null;
}
