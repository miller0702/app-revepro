import { create } from 'zustand';

interface TutorialStore {
  replayToken: number;
  requestReplay: () => void;
}

export const useTutorialStore = create<TutorialStore>((set) => ({
  replayToken: 0,
  requestReplay: () => set((s) => ({ replayToken: s.replayToken + 1 })),
}));
