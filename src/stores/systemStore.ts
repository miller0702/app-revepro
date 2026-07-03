import { create } from 'zustand';

interface SystemState {
  isOffline: boolean;
  setOffline: (value: boolean) => void;
}

export const useSystemStore = create<SystemState>((set) => ({
  isOffline: false,
  setOffline: (isOffline) => set({ isOffline }),
}));
