export type ModerationReportTargetType = 'POST' | 'USER' | 'COMMENT' | 'POST_IMAGE';

export type ModerationReportReason =
  | 'SPAM'
  | 'HARASSMENT'
  | 'HATE_SPEECH'
  | 'VIOLENCE'
  | 'NUDITY'
  | 'MISINFORMATION'
  | 'IMPERSONATION'
  | 'OTHER';

export const REPORT_REASONS: { code: ModerationReportReason; label: string }[] = [
  { code: 'SPAM', label: 'Spam o engañoso' },
  { code: 'HARASSMENT', label: 'Acoso o bullying' },
  { code: 'HATE_SPEECH', label: 'Discurso de odio' },
  { code: 'VIOLENCE', label: 'Violencia' },
  { code: 'NUDITY', label: 'Desnudos o contenido sexual' },
  { code: 'MISINFORMATION', label: 'Información falsa' },
  { code: 'IMPERSONATION', label: 'Suplantación de identidad' },
  { code: 'OTHER', label: 'Otro' },
];

export const REPORT_TARGET_LABELS: Record<ModerationReportTargetType, string> = {
  POST: 'publicación',
  USER: 'usuario',
  COMMENT: 'comentario',
  POST_IMAGE: 'imagen',
};
