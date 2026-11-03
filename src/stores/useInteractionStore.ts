import { create } from 'zustand';

export type InteractionSubView = 'menu' | 'info' | 'message';

interface InteractionStoreState {
  selectedCharacterId: string | null;
  subView: InteractionSubView;
  nearestInteractableNpcId: string | null;
  statusToast: string | null;

  // Actions
  openCharacterInteraction: (characterId: string, initialView?: InteractionSubView) => void;
  setSubView: (view: InteractionSubView) => void;
  closeCharacterInteraction: () => void;
  setNearestInteractableNpcId: (npcId: string | null) => void;
  showStatusToast: (msg: string) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useInteractionStore = create<InteractionStoreState>((set) => ({
  selectedCharacterId: null,
  subView: 'menu',
  nearestInteractableNpcId: null,
  statusToast: null,

  openCharacterInteraction: (characterId, initialView = 'menu') =>
    set({
      selectedCharacterId: characterId,
      subView: initialView,
    }),

  setSubView: (view) => set({ subView: view }),

  closeCharacterInteraction: () =>
    set({
      selectedCharacterId: null,
      subView: 'menu',
    }),

  setNearestInteractableNpcId: (npcId) =>
    set((state) =>
      state.nearestInteractableNpcId === npcId
        ? state
        : { nearestInteractableNpcId: npcId }
    ),

  showStatusToast: (msg) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ statusToast: msg });
    toastTimer = setTimeout(() => {
      set({ statusToast: null });
    }, 3200);
  },
}));

