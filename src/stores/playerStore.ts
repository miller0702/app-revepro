import { create } from 'zustand';
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from 'expo-audio';
import type { EventSubscription } from 'expo-modules-core';

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

    const player = createAudioPlayer(track.url, { updateInterval: 500 });

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
