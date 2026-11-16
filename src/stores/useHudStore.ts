import { create } from 'zustand';

export type MenuTab = 'journey' | 'passengers' | 'settings' | 'community' | 'shop' | 'help';

interface HudStoreState {
  menuOpen: boolean;
  menuTab: MenuTab;
  objectivesCollapsed: boolean;
  openMenu: (tab?: MenuTab) => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  setMenuTab: (tab: MenuTab) => void;
  toggleObjectivesCollapsed: () => void;
}

export const useHudStore = create<HudStoreState>((set) => ({
  menuOpen: false,
  menuTab: 'journey',
  objectivesCollapsed: false,
  openMenu: (tab) => set((s) => ({ menuOpen: true, menuTab: tab ?? s.menuTab })),
  closeMenu: () => set({ menuOpen: false }),
  toggleMenu: () => set((s) => ({ menuOpen: !s.menuOpen })),
  setMenuTab: (tab) => set({ menuTab: tab }),
  toggleObjectivesCollapsed: () => set((s) => ({ objectivesCollapsed: !s.objectivesCollapsed })),
}));
