import type { JourneyStage } from '../../stores/useJourneyStore';
import type { EmoteType } from '../character/characterTypes';

export type FlagValue = boolean | number;
export type StoryFlags = Record<string, FlagValue>;

/** Snapshot of the world the story conditions are evaluated against. */
export interface StoryContext {
  km: number;
  stage: JourneyStage;
  stopIndex: number;
  playerSitting: boolean;
  playerOutside: boolean;
  visitedStall: boolean;
  /** Landmark id currently passing the bus (see sceneryLive.landmarkNear). */
  landmarkNear: string | null;
  flags: StoryFlags;
  activeObjectives: string[];
  completedObjectives: string[];
}

export type StoryAction =
  | { type: 'dialogue'; id: string }
  | { type: 'addObjective'; id: string }
  | { type: 'completeObjective'; id: string }
  | { type: 'failObjective'; id: string }
  | { type: 'setFlag'; flag: string; value?: FlagValue }
  | { type: 'addFlag'; flag: string; delta: number }
  | { type: 'relationship'; npcId: string; delta: number }
  | { type: 'reward'; key: string; coins: number; reason: string }
  | {
      type: 'cinematic';
      position: [number, number, number];
      target: [number, number, number];
      durationSec: number;
      caption?: string;
    }
  | { type: 'toast'; text: string }
  | { type: 'npcSay'; npcId: string; speaker: string; text: string }
  | { type: 'emote'; npcId: string; emote: EmoteType }
  | { type: 'journal'; text: string }
  | { type: 'ending' };

export interface DialogueChoice {
  label: string;
  next: string | null;
  effects?: StoryAction[];
  /** Hide the choice unless this returns true. */
  requires?: (ctx: StoryContext) => boolean;
}

export interface DialogueNode {
  speaker: string;
  /** Emoji portrait shown next to the speaker name. */
  portrait: string;
  text: string;
  /** Effects applied when this node is shown. */
  effects?: StoryAction[];
  choices?: DialogueChoice[];
  /** Next node when there are no choices; null/undefined ends the dialogue. */
  next?: string | null;
}

export interface Dialogue {
  id: string;
  start: string;
  nodes: Record<string, DialogueNode>;
  /** Effects applied when the dialogue closes. */
  onEnd?: StoryAction[];
}

export type ObjectiveTarget =
  | { type: 'talk'; npcId: string; dialogueId: string }
  | { type: 'condition' };

export interface Objective {
  id: string;
  title: string;
  detail: string;
  optional?: boolean;
  target: ObjectiveTarget;
  completeWhen?: (ctx: StoryContext) => boolean;
  failWhen?: (ctx: StoryContext) => boolean;
  onComplete?: StoryAction[];
  onFail?: StoryAction[];
}

export interface StoryBeat {
  id: string;
  when: (ctx: StoryContext) => boolean;
  actions: StoryAction[];
}

export interface StoryEnding {
  id: string;
  title: string;
  dialogueId: string;
}

export interface StoryChapter {
  id: string;
  title: string;
  subtitle: string;
  synopsis: string;
  initialFlags: StoryFlags;
  dialogues: Record<string, Dialogue>;
  objectives: Record<string, Objective>;
  beats: StoryBeat[];
  /** Picks the ending from the final context. */
  resolveEnding: (ctx: StoryContext) => StoryEnding;
}
