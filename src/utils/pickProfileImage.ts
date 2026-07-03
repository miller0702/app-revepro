import * as ImagePicker from 'expo-image-picker';
import { toast } from './toast';

export type PickedImage = {
  uri: string;
  mimeType: string;
  fileName: string;
  width?: number;
};

type PickOptions = {
  squareCrop?: boolean;
  quality?: number;
};

async function ensurePermission(source: 'camera' | 'library'): Promise<boolean> {
  const result =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!result.granted) {
    toast.error('Activa el permiso en los ajustes del dispositivo.', 'Permiso requerido');
    return false;
  }
  return true;
}

export async function pickProfileImage(
  source: 'camera' | 'library',
  options: PickOptions = {},
): Promise<PickedImage | null> {
  const allowed = await ensurePermission(source);
  if (!allowed) return null;

  const launcher =
    source === 'camera' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;

  const result = await launcher({
    mediaTypes: ['images'],
    allowsEditing: options.squareCrop ?? false,
    aspect: options.squareCrop ? [1, 1] : undefined,
    quality: options.quality ?? (options.squareCrop ? 0.85 : 1),
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
    fileName: asset.fileName ?? (source === 'camera' ? 'photo.jpg' : 'image.jpg'),
    width: asset.width,
  };
}
