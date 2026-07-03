import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import {
  IMAGE_UPLOAD_LIMITS,
  type ImageUploadPurpose,
} from '../config/imageUpload';

export interface PreparedImage {
  uri: string;
  mimeType: string;
  fileName: string;
}

const COMPRESS_STEPS = [0.88, 0.76, 0.64, 0.52, 0.4] as const;
const SIZE_SAFETY_RATIO = 0.92;

async function getFileSize(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) return 0;
  return 'size' in info && typeof info.size === 'number' ? info.size : 0;
}

function toJpegFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '') || 'image';
  return `${base}.jpg`;
}

function initialWidth(
  purpose: ImageUploadPurpose,
  sourceWidth?: number,
): number {
  const { maxWidth } = IMAGE_UPLOAD_LIMITS[purpose];
  if (!sourceWidth || sourceWidth <= 0) return maxWidth;
  return Math.min(sourceWidth, maxWidth);
}

/**
 * Redimensiona y comprime una imagen local hasta cumplir el límite de la API.
 * El usuario no necesita preocuparse por el tamaño del archivo original.
 */
export async function prepareImageForUpload(
  uri: string,
  fileName: string,
  _mimeType: string,
  purpose: ImageUploadPurpose,
  sourceWidth?: number,
): Promise<PreparedImage> {
  const { maxBytes } = IMAGE_UPLOAD_LIMITS[purpose];
  const targetMaxBytes = Math.floor(maxBytes * SIZE_SAFETY_RATIO);
  let workUri = uri;
  let width = initialWidth(purpose, sourceWidth);

  while (width >= 320) {
    for (const compress of COMPRESS_STEPS) {
      const actions =
        width > 0
          ? [{ resize: { width } as const }]
          : [];

      const result = await manipulateAsync(workUri, actions, {
        compress,
        format: SaveFormat.JPEG,
      });

      const size = await getFileSize(result.uri);
      if (size > 0 && size <= targetMaxBytes) {
        return {
          uri: result.uri,
          mimeType: 'image/jpeg',
          fileName: toJpegFileName(fileName),
        };
      }

      workUri = result.uri;
    }

    width = Math.floor(width * 0.82);
  }

  throw new Error('IMAGE_PREPARE_FAILED');
}

export async function prepareImagesForUpload(
  items: Array<{ uri: string; fileName: string; mimeType: string; width?: number }>,
  purpose: ImageUploadPurpose,
): Promise<PreparedImage[]> {
  const prepared: PreparedImage[] = [];
  for (const item of items) {
    prepared.push(
      await prepareImageForUpload(
        item.uri,
        item.fileName,
        item.mimeType,
        purpose,
        item.width,
      ),
    );
  }
  return prepared;
}
