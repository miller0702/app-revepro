import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { Share, Platform } from 'react-native';
import { getAuthImageHeaders } from '../lib/accessTokenCache';
import { resolveApiMediaUrl } from './mediaUrl';

function ensureFileUri(uri: string): string {
  if (uri.startsWith('file://')) return uri;
  return `file://${uri.replace(/^\/+/, '')}`;
}

export async function downloadAuthenticatedImage(url: string): Promise<string> {
  const absolute = resolveApiMediaUrl(url);
  if (!absolute) throw new Error('INVALID_URL');
  const headers = getAuthImageHeaders();
  const dest = `${FileSystem.cacheDirectory}egw-image-${Date.now()}.jpg`;
  const result = await FileSystem.downloadAsync(absolute, dest, headers ? { headers } : undefined);
  return result.uri;
}

export async function saveImageToGallery(url: string): Promise<void> {
  const MediaLibrary = await import('expo-media-library');
  const permission = await MediaLibrary.requestPermissionsAsync();
  if (!permission.granted) throw new Error('PERMISSION_DENIED');
  const localUri = await downloadAuthenticatedImage(url);
  await MediaLibrary.saveToLibraryAsync(localUri);
}

export async function copyTextToClipboard(text: string): Promise<void> {
  await Clipboard.setStringAsync(text);
}

export async function copyImageLink(url: string): Promise<string> {
  const absolute = resolveApiMediaUrl(url);
  if (!absolute) throw new Error('INVALID_URL');
  await copyTextToClipboard(absolute);
  return absolute;
}

export async function shareImageFile(url: string): Promise<void> {
  const localUri = ensureFileUri(await downloadAuthenticatedImage(url));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(localUri, {
      mimeType: 'image/jpeg',
      dialogTitle: 'Compartir imagen',
      UTI: 'public.jpeg',
    });
    return;
  }

  if (Platform.OS === 'ios') {
    await Share.share({ url: localUri });
    return;
  }

  await Share.share({ message: localUri, title: 'Imagen RESVEPRO' });
}

export async function shareImageLink(url: string): Promise<void> {
  const absolute = resolveApiMediaUrl(url);
  if (!absolute) throw new Error('INVALID_URL');

  if (Platform.OS === 'ios') {
    await Share.share({ message: absolute, url: absolute, title: 'Imagen RESVEPRO' });
    return;
  }

  await Share.share({ message: absolute, title: 'Imagen RESVEPRO' });
}

export function buildPostDeepLink(postId: string): string {
  return Linking.createURL(`/post/${postId}`);
}

export async function sharePostLink(postId: string, excerpt?: string): Promise<void> {
  const link = buildPostDeepLink(postId);
  const message = excerpt?.trim()
    ? `${excerpt.trim().slice(0, 200)}\n\n${link}`
    : `Mira esta publicación en RESVEPRO:\n${link}`;

  if (Platform.OS === 'ios') {
    await Share.share({ message, url: link, title: 'Publicación RESVEPRO' });
    return;
  }

  await Share.share({ message, title: 'Publicación RESVEPRO' });
}
