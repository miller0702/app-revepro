export const COMMUNITY_REACTIONS = [
  { type: 'AMEN', label: 'Amén', emoji: '🙏' },
  { type: 'INSPIRED', label: 'Inspirador', emoji: '✨' },
  { type: 'INSIGHT', label: 'Reflexión', emoji: '💡' },
  { type: 'PRAY', label: 'Oración', emoji: '🕊️' },
  { type: 'READ', label: 'Leeré', emoji: '📖' },
] as const;

export type CommunityReactionType = (typeof COMMUNITY_REACTIONS)[number]['type'];

export type ReactionCounts = Record<CommunityReactionType, number>;

export function emptyReactionCounts(): ReactionCounts {
  return { AMEN: 0, INSPIRED: 0, INSIGHT: 0, PRAY: 0, READ: 0 };
}

export function getReactionMeta(type: CommunityReactionType) {
  return COMMUNITY_REACTIONS.find((r) => r.type === type)!;
}

export function totalReactionCount(counts: ReactionCounts): number {
  return COMMUNITY_REACTIONS.reduce((sum, r) => sum + (counts[r.type] ?? 0), 0);
}

export function activeReactionTypes(counts: ReactionCounts): CommunityReactionType[] {
  return COMMUNITY_REACTIONS.filter((r) => (counts[r.type] ?? 0) > 0).map((r) => r.type);
}

export function normalizeReactionCounts(
  raw?: Partial<ReactionCounts> | null,
  legacyLikeCount?: number,
): ReactionCounts {
  const base = emptyReactionCounts();
  if (raw) {
    for (const item of COMMUNITY_REACTIONS) {
      base[item.type] = Math.max(0, raw[item.type] ?? 0);
    }
  }
  if (legacyLikeCount && !Object.values(base).some((n) => n > 0)) {
    base.AMEN = legacyLikeCount;
  }
  return base;
}
