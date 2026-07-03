/** Límites alineados con resvepro-api (community + users). */
export const IMAGE_UPLOAD_LIMITS = {
  post: { maxBytes: 2 * 1024 * 1024, maxWidth: 1920 },
  avatar: { maxBytes: 2 * 1024 * 1024, maxWidth: 1024 },
  cover: { maxBytes: 5 * 1024 * 1024, maxWidth: 2048 },
} as const;

export type ImageUploadPurpose = keyof typeof IMAGE_UPLOAD_LIMITS;
