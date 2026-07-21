import { ComponentProps } from 'react';
import { ColorValue } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export type AppIconName =
  | 'feed'
  | 'feed-filled'
  | 'library'
  | 'library-filled'
  | 'audio'
  | 'audio-filled'
  | 'video'
  | 'video-filled'
  | 'favorites'
  | 'favorites-filled'
  | 'profile'
  | 'profile-filled'
  | 'search'
  | 'play'
  | 'pause'
  | 'close'
  | 'radio'
  | 'music'
  | 'empty-library'
  | 'empty-video'
  | 'empty-favorites'
  | 'not-found'
  | 'maintenance'
  | 'offline'
  | 'unavailable'
  | 'home'
  | 'back'
  | 'eye'
  | 'eye-off'
  | 'chat'
  | 'send'
  | 'compose'
  | 'share'
  | 'download'
  | 'settings'
  | 'settings-filled'
  | 'document'
  | 'study'
  | 'list'
  | 'forward'
  | 'people'
  | 'copy'
  | 'flag'
  | 'more'
  | 'check-done'
  | 'time'
  | 'folder'
  | 'folder-add'
  | 'highlight'
  | 'sync'
  | 'camera'
  | 'gallery'
  | 'trash'
  | 'crop'
  | 'volume-mute';

type IconFamily = 'ionicons' | 'material';

const iconMap: Record<AppIconName, { family: IconFamily; name: string }> = {
  feed: { family: 'ionicons', name: 'newspaper-outline' },
  'feed-filled': { family: 'ionicons', name: 'newspaper' },
  library: { family: 'ionicons', name: 'library-outline' },
  'library-filled': { family: 'ionicons', name: 'library' },
  audio: { family: 'ionicons', name: 'musical-notes-outline' },
  'audio-filled': { family: 'ionicons', name: 'musical-notes' },
  video: { family: 'ionicons', name: 'videocam-outline' },
  'video-filled': { family: 'ionicons', name: 'videocam' },
  favorites: { family: 'ionicons', name: 'heart-outline' },
  'favorites-filled': { family: 'ionicons', name: 'heart' },
  profile: { family: 'ionicons', name: 'person-outline' },
  'profile-filled': { family: 'ionicons', name: 'person' },
  search: { family: 'ionicons', name: 'search' },
  play: { family: 'ionicons', name: 'play' },
  pause: { family: 'ionicons', name: 'pause' },
  close: { family: 'ionicons', name: 'close' },
  radio: { family: 'material', name: 'radio' },
  music: { family: 'ionicons', name: 'musical-note' },
  'empty-library': { family: 'ionicons', name: 'library-outline' },
  'empty-video': { family: 'ionicons', name: 'videocam-outline' },
  'empty-favorites': { family: 'ionicons', name: 'heart-outline' },
  'not-found': { family: 'ionicons', name: 'map-outline' },
  maintenance: { family: 'material', name: 'wrench' },
  offline: { family: 'ionicons', name: 'cloud-offline-outline' },
  unavailable: { family: 'ionicons', name: 'alert-circle-outline' },
  home: { family: 'ionicons', name: 'home-outline' },
  back: { family: 'ionicons', name: 'chevron-back' },
  eye: { family: 'ionicons', name: 'eye-outline' },
  'eye-off': { family: 'ionicons', name: 'eye-off-outline' },
  chat: { family: 'ionicons', name: 'chatbubble-outline' },
  send: { family: 'ionicons', name: 'send' },
  compose: { family: 'ionicons', name: 'create-outline' },
  share: { family: 'ionicons', name: 'share-social-outline' },
  download: { family: 'ionicons', name: 'download-outline' },
  settings: { family: 'ionicons', name: 'settings-outline' },
  'settings-filled': { family: 'ionicons', name: 'settings' },
  document: { family: 'ionicons', name: 'document-text-outline' },
  study: { family: 'ionicons', name: 'school-outline' },
  list: { family: 'ionicons', name: 'list-outline' },
  forward: { family: 'ionicons', name: 'chevron-forward' },
  people: { family: 'ionicons', name: 'people-outline' },
  copy: { family: 'ionicons', name: 'copy-outline' },
  flag: { family: 'ionicons', name: 'flag-outline' },
  more: { family: 'ionicons', name: 'ellipsis-horizontal' },
  'check-done': { family: 'ionicons', name: 'checkmark-circle' },
  time: { family: 'ionicons', name: 'time-outline' },
  folder: { family: 'ionicons', name: 'folder-outline' },
  'folder-add': { family: 'material', name: 'folder-plus-outline' },
  highlight: { family: 'ionicons', name: 'color-wand-outline' },
  sync: { family: 'ionicons', name: 'cloud-upload-outline' },
  camera: { family: 'ionicons', name: 'camera-outline' },
  gallery: { family: 'ionicons', name: 'images-outline' },
  trash: { family: 'ionicons', name: 'trash-outline' },
  crop: { family: 'ionicons', name: 'crop-outline' },
  'volume-mute': { family: 'ionicons', name: 'volume-mute' },
};

export interface AppIconProps {
  readonly name: AppIconName;
  readonly size?: number;
  readonly color?: ColorValue;
  readonly style?: ComponentProps<typeof Ionicons>['style'];
}

export function AppIcon({ name, size = 24, color = '#000', style }: AppIconProps) {
  const icon = iconMap[name];

  if (icon.family === 'material') {
    return (
      <MaterialCommunityIcons
        name={icon.name as ComponentProps<typeof MaterialCommunityIcons>['name']}
        size={size}
        color={color}
        style={style}
      />
    );
  }

  return (
    <Ionicons
      name={icon.name as ComponentProps<typeof Ionicons>['name']}
      size={size}
      color={color}
      style={style}
    />
  );
}
