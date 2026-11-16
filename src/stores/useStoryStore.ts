import { create } from 'zustand';
import type { StoryFlags } from '../game/story/storyTypes';

const STORY_STORAGE_KEY = 'virtual_bus_story_v1';

export interface ActiveDialogue {
  dialogueId: string;
  nodeId: string;
}

export interface StoryJournalEntry {
  km: number;
  text: string;
}

export interface StoryCinematicState {
  caption: string | null;
}

interface PersistedStory {
  enabled: boolean;
  unlockedEndings: string[];
}

function loadPersisted(): PersistedStory {
  try {
    const raw = window.localStorage.getItem(STORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedStory>;
      return {
        enabled: parsed.enabled !== false,
        unlockedEndings: Array.isArray(parsed.unlockedEndings) ? parsed.unlockedEndings : [],
      };
    }
  } catch {
    // Storage unavailable (private mode) – fall back to defaults
  }
  return { enabled: true, unlockedEndings: [] };
}

function persist(data: PersistedStory): void {
  try {
    window.localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

interface StoryStoreState {
  enabled: boolean;
  chapterId: string | null;
  flags: StoryFlags;
  activeObjectives: string[];
  completedObjectives: string[];
  failedObjectives: string[];
  firedBeats: string[];
  relationships: Record<string, number>;
  journal: StoryJournalEntry[];
  dialogue: ActiveDialogue | null;
  dialogueQueue: string[];
  cinematic: StoryCinematicState | null;
  endingId: string | null;
  unlockedEndings: string[];

  setEnabled: (enabled: boolean) => void;
  resetChapter: (chapterId: string, initialFlags: StoryFlags) => void;
  setDialogue: (dialogue: ActiveDialogue | null) => void;
  setDialogueQueue: (queue: string[]) => void;
  setCinematic: (cinematic: StoryCinematicState | null) => void;
  patch: (partial: Partial<StoryStoreState>) => void;
  unlockEnding: (endingId: string) => void;
}

const initialPersisted = loadPersisted();

export const useStoryStore = create<StoryStoreState>((set, get) => ({
  enabled: initialPersisted.enabled,
  chapterId: null,
  flags: {},
  activeObjectives: [],
  completedObjectives: [],
  failedObjectives: [],
  firedBeats: [],
  relationships: {},
  journal: [],
  dialogue: null,
  dialogueQueue: [],
  cinematic: null,
  endingId: null,
  unlockedEndings: initialPersisted.unlockedEndings,

  setEnabled: (enabled) => {
    set({ enabled, ...(enabled ? {} : { dialogue: null, dialogueQueue: [], cinematic: null }) });
    persist({ enabled, unlockedEndings: get().unlockedEndings });
  },

  resetChapter: (chapterId, initialFlags) =>
    set({
      chapterId,
      flags: { ...initialFlags },
      activeObjectives: [],
      completedObjectives: [],
      failedObjectives: [],
      firedBeats: [],
      relationships: {},
      journal: [],
      dialogue: null,
      dialogueQueue: [],
      cinematic: null,
      endingId: null,
    }),

  setDialogue: (dialogue) => set({ dialogue }),
  setDialogueQueue: (queue) => set({ dialogueQueue: queue }),
  setCinematic: (cinematic) => set({ cinematic }),
  patch: (partial) => set(partial),

  unlockEnding: (endingId) => {
    const current = get().unlockedEndings;
    if (current.includes(endingId)) return;
    const next = [...current, endingId];
    set({ unlockedEndings: next });
    persist({ enabled: get().enabled, unlockedEndings: next });
  },
}));

/** True while a story dialogue is on screen (gameplay input should pause). */
export function isStoryDialogueOpen(): boolean {
  return useStoryStore.getState().dialogue !== null;
}
