import { COMMUNITY_REACTIONS, type CommunityReactionType } from '../constants/communityReactions';

export type ReactionPickerLayout = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export const REACTION_PICKER_WIDTH = 272;
export const REACTION_PICKER_HEIGHT = 56;

export function hitTestReactionPicker(
  x: number,
  y: number,
  layouts: Map<CommunityReactionType, ReactionPickerLayout>,
): CommunityReactionType | null {
  const padX = 14;
  const padY = 48;

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
