import { create } from 'zustand';
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from 'expo-audio';
import type { EventSubscription } from 'expo-modules-core';
import * as SecureStore from 'expo-secure-store';
import { isApiHostedMediaUrl, resolveApiMediaUrl } from '../utils/mediaUrl';

export type PlayerKind = 'podcast' | 'radio' | 'audiobook';

export interface PlayerTrack {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  kind: PlayerKind;
}

interface PlayerState {
  track: PlayerTrack | null;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  player: AudioPlayer | null;
  statusSubscription: EventSubscription | null;
  play: (track: PlayerTrack) => Promise<void>;
  toggle: () => Promise<void>;
  stop: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
}

function releasePlayer(player: AudioPlayer | null, subscription: EventSubscription | null) {
  subscription?.remove();
  if (!player) return;
  try {
    player.pause();
    player.remove();
  } catch {
    /* already released */
  }
}

async function resolvePlayableSource(url: string) {
  const resolved = resolveApiMediaUrl(url) ?? url;
  if (!isApiHostedMediaUrl(resolved)) return resolved;
  const token = await SecureStore.getItemAsync('accessToken');
  if (!token) return resolved;
  return { uri: resolved, headers: { Authorization: `Bearer ${token}` } };
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  track: null,
  isPlaying: false,
  positionMs: 0,
  durationMs: 0,
  player: null,
  statusSubscription: null,

  play: async (track) => {
    const { player: current, statusSubscription, track: currentTrack } = get();
    if (current && currentTrack?.id === track.id) {
      current.play();
      set({ isPlaying: true });
      return;
    }

    releasePlayer(current, statusSubscription);

    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'duckOthers',
    });

    const source = await resolvePlayableSource(track.url);
    const player = createAudioPlayer(source, { updateInterval: 500 });

    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      set({
        isPlaying: status.playing,
        positionMs: status.currentTime * 1000,
        durationMs: (status.duration ?? 0) * 1000,
      });
      if (status.didJustFinish && (track.kind === 'podcast' || track.kind === 'audiobook')) {
        void get().stop();
      }
    });

    player.play();
    set({ track, player, statusSubscription: subscription, isPlaying: true });
  },

  toggle: async () => {
    const { player, isPlaying } = get();
    if (!player) return;
    if (isPlaying) {
      player.pause();
      set({ isPlaying: false });
    } else {
      player.play();
      set({ isPlaying: true });
    }
  },

  stop: async () => {
    const { player, statusSubscription } = get();
    releasePlayer(player, statusSubscription);
    set({
      track: null,
      player: null,
      statusSubscription: null,
      isPlaying: false,
      positionMs: 0,
      durationMs: 0,
    });
  },

  seek: async (positionMs) => {
    const { player } = get();
    if (!player) return;
    await player.seekTo(positionMs / 1000);
    set({ positionMs });
  },
}));
