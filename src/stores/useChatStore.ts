import { create } from 'zustand';

export interface ActiveChatBubble {
  id: string;
  characterId: string;
  characterName: string;
  text: string;
  createdAt: number;
  expiresAt: number;
}

interface ChatStoreState {
  activeBubbles: Record<string, ActiveChatBubble>;
  recentMessages: ActiveChatBubble[];

  // Actions
  sendChatBubble: (
    characterId: string,
    characterName: string,
    rawText: string,
    durationMs?: number
  ) => void;
  clearChatBubble: (characterId: string) => void;
}

const bubbleTimers = new Map<string, ReturnType<typeof setTimeout>>();
const MAX_CHAT_LENGTH = 110;
const DEFAULT_BUBBLE_DURATION_MS = 5000;

export const useChatStore = create<ChatStoreState>((set, get) => ({
  activeBubbles: {},
  recentMessages: [
    {
      id: 'init-1',
      characterId: 'p1',
      characterName: 'Minh Anh',
      text: 'Chuyến xe về miền Tây hôm nay êm quá mọi người nhỉ! 🌿🚌',
      createdAt: Date.now() - 12000,
      expiresAt: Date.now() + 4000,
    },
  ],

  sendChatBubble: (
    characterId,
    characterName,
    rawText,
    durationMs = DEFAULT_BUBBLE_DURATION_MS
  ) => {
    const trimmed = rawText.trim().slice(0, MAX_CHAT_LENGTH);
    if (!trimmed) return;

    const existingTimer = bubbleTimers.get(characterId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const now = Date.now();
    const bubble: ActiveChatBubble = {
      id: `${characterId}-${now}`,
      characterId,
      characterName,
      text: trimmed,
      createdAt: now,
      expiresAt: now + durationMs,
    };

    set((state) => ({
      activeBubbles: {
        ...state.activeBubbles,
        [characterId]: bubble,
      },
      recentMessages: [...state.recentMessages.slice(-14), bubble],
    }));

    const timer = setTimeout(() => {
      get().clearChatBubble(characterId);
    }, durationMs);
    bubbleTimers.set(characterId, timer);
  },

  clearChatBubble: (characterId) => {
    const existingTimer = bubbleTimers.get(characterId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      bubbleTimers.delete(characterId);
    }

    set((state) => {
      if (!state.activeBubbles[characterId]) return state;
      const next = { ...state.activeBubbles };
      delete next[characterId];
      return { activeBubbles: next };
    });
  },
}));

