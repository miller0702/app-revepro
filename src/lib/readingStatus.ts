export type ReadingStatus = 'unread' | 'reading' | 'read' | 'studying';

export const READ_COMPLETE_THRESHOLD = 100;

export interface ReadingStatusMeta {
  status: ReadingStatus;
  label: string;
  percentage: number;
}

export function resolveReadingStatus(input: {
  percentage: number;
  hasStudyActivity: boolean;
}): ReadingStatus {
  if (input.percentage >= READ_COMPLETE_THRESHOLD) return 'read';
  if (input.hasStudyActivity) return 'studying';
  if (input.percentage > 0) return 'reading';
  return 'unread';
}

export function getReadingStatusLabel(status: ReadingStatus): string | null {
  switch (status) {
    case 'read':
      return 'Leído';
    case 'reading':
      return 'Leyendo';
    case 'studying':
      return 'Analizando';
    default:
      return null;
  }
}

export function buildReadingStatusMeta(
  percentage: number,
  hasStudyActivity: boolean,
): ReadingStatusMeta {
  const status = resolveReadingStatus({ percentage, hasStudyActivity });
  return {
    status,
    label: getReadingStatusLabel(status) ?? '',
    percentage,
  };
}
