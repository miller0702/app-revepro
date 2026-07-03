/** Porcentaje según capítulos realmente terminados (no solo abiertos). */
export function computeBookReadPercentage(
  completedChapterCount: number,
  totalChapters: number,
): number {
  if (totalChapters <= 0) return 0;
  const clamped = Math.min(completedChapterCount, totalChapters);
  return Math.round((clamped / totalChapters) * 100);
}

export function isBookFullyRead(completedChapterCount: number, totalChapters: number): boolean {
  return totalChapters > 0 && completedChapterCount >= totalChapters;
}
