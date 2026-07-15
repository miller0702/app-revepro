import { create } from 'zustand';

type TabBarScrollState = {
  /** 0 = expandido, 1 = compacto */
  collapse: number;
  setCollapse: (value: number) => void;
  expand: () => void;
};

export const useTabBarScrollStore = create<TabBarScrollState>((set) => ({
  collapse: 0,
  setCollapse: (collapse) => set({ collapse: Math.max(0, Math.min(1, collapse)) }),
  expand: () => set({ collapse: 0 }),
}));
