import { useStoryStore } from '../../stores/useStoryStore';
import { useGameStore } from '../../stores/useGameStore';
import { useJourneyStore } from '../../stores/useJourneyStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useChatStore } from '../../stores/useChatStore';
import { useInteractionStore } from '../../stores/useInteractionStore';
import { useEconomyLedgerStore } from '../../stores/useEconomyLedgerStore';
import { cameraRig } from '../camera/cameraRig';
import { sceneryLive } from '../environment/scenery/sceneryLive';
import { CHAPTER_1 } from './chapter1';
import type {
  DialogueChoice,
  DialogueNode,
  StoryAction,
  StoryChapter,
  StoryContext,
} from './storyTypes';

/**
 * Imperative story runtime. All state lives in `useStoryStore`; these helpers read the
 * other game stores to build a StoryContext and apply StoryActions.
 */

export function getActiveChapter(): StoryChapter {
  return CHAPTER_1;
}

let cinematicTimer: ReturnType<typeof setTimeout> | null = null;

export function buildStoryContext(): StoryContext {
  const story = useStoryStore.getState();
  const journey = useJourneyStore.getState();
  const charStore = useCharacterStore.getState();
  const player = charStore.characters[charStore.playerId];
  return {
    km: useGameStore.getState().distanceTraveledKm,
    stage: journey.stage,
    stopIndex: journey.currentStopIndex,
    playerSitting: player?.state === 'sitting',
    playerOutside: journey.isPlayerDisembarked || (player ? player.position[0] > 1.35 : false),
    visitedStall: journey.hasVisitedStalls,
    landmarkNear: sceneryLive.landmarkNear,
    flags: story.flags,
    activeObjectives: story.activeObjectives,
    completedObjectives: story.completedObjectives,
  };
}

function toast(text: string): void {
  useInteractionStore.getState().showStatusToast(text);
}

export function addObjective(id: string): void {
  const chapter = getActiveChapter();
  const objective = chapter.objectives[id];
  const s = useStoryStore.getState();
  if (!objective) return;
  if (
    s.activeObjectives.includes(id) ||
    s.completedObjectives.includes(id) ||
    s.failedObjectives.includes(id)
  ) {
    return;
  }
  s.patch({ activeObjectives: [...s.activeObjectives, id] });
  toast(`${objective.optional ? 'Nhiệm vụ phụ' : 'Nhiệm vụ mới'}: ${objective.title}`);
}

export function completeObjective(id: string): void {
  const chapter = getActiveChapter();
  const objective = chapter.objectives[id];
  const s = useStoryStore.getState();
  if (!objective || !s.activeObjectives.includes(id)) return;
  s.patch({
    activeObjectives: s.activeObjectives.filter((o) => o !== id),
    completedObjectives: [...s.completedObjectives, id],
  });
  toast(`Hoàn thành: ${objective.title}`);
  if (objective.onComplete) runActions(objective.onComplete);
}

export function failObjective(id: string): void {
  const chapter = getActiveChapter();
  const objective = chapter.objectives[id];
  const s = useStoryStore.getState();
  if (!objective || !s.activeObjectives.includes(id)) return;
  s.patch({
    activeObjectives: s.activeObjectives.filter((o) => o !== id),
    failedObjectives: [...s.failedObjectives, id],
  });
  if (objective.onFail) runActions(objective.onFail);
}

export function startDialogue(dialogueId: string): void {
  const chapter = getActiveChapter();
  const dialogue = chapter.dialogues[dialogueId];
  const s = useStoryStore.getState();
  if (!dialogue) return;
  if (s.dialogue) {
    if (s.dialogue.dialogueId !== dialogueId && !s.dialogueQueue.includes(dialogueId)) {
      s.setDialogueQueue([...s.dialogueQueue, dialogueId]);
    }
    return;
  }
  useInteractionStore.getState().closeCharacterInteraction();
  s.setDialogue({ dialogueId, nodeId: dialogue.start });
  const node = dialogue.nodes[dialogue.start];
  if (node?.effects) runActions(node.effects);
}

export function getCurrentDialogueNode(): DialogueNode | null {
  const s = useStoryStore.getState();
  if (!s.dialogue) return null;
  return getActiveChapter().dialogues[s.dialogue.dialogueId]?.nodes[s.dialogue.nodeId] ?? null;
}

export function getVisibleChoices(node: DialogueNode, ctx: StoryContext): DialogueChoice[] {
  return (node.choices ?? []).filter((c) => !c.requires || c.requires(ctx));
}

/** Advance the open dialogue. `choiceIndex` indexes into the visible choices. */
export function advanceDialogue(choiceIndex?: number): void {
  const s = useStoryStore.getState();
  if (!s.dialogue) return;
  const dialogue = getActiveChapter().dialogues[s.dialogue.dialogueId];
  const node = dialogue?.nodes[s.dialogue.nodeId];
  if (!dialogue || !node) {
    s.setDialogue(null);
    return;
  }

  let next: string | null | undefined;
  const choices = getVisibleChoices(node, buildStoryContext());
  if (choices.length > 0) {
    if (choiceIndex === undefined || !choices[choiceIndex]) return;
    const choice = choices[choiceIndex];
    if (choice.effects) runActions(choice.effects);
    next = choice.next;
  } else {
    next = node.next;
  }

  if (next && dialogue.nodes[next]) {
    s.setDialogue({ dialogueId: dialogue.id, nodeId: next });
    const nextNode = dialogue.nodes[next];
    if (nextNode.effects) runActions(nextNode.effects);
    return;
  }

  // Dialogue finished
  s.setDialogue(null);
  if (dialogue.onEnd) runActions(dialogue.onEnd);

  const after = useStoryStore.getState();
  if (!after.dialogue && after.dialogueQueue.length > 0) {
    const [head, ...rest] = after.dialogueQueue;
    after.setDialogueQueue(rest);
    startDialogue(head);
  }
}

function startCinematic(
  position: [number, number, number],
  target: [number, number, number],
  durationSec: number,
  caption?: string
): void {
  cameraRig.cinematic.position = position;
  cameraRig.cinematic.target = target;
  cameraRig.cinematic.active = true;
  useStoryStore.getState().setCinematic({ caption: caption ?? null });
  if (cinematicTimer) clearTimeout(cinematicTimer);
  cinematicTimer = setTimeout(() => endCinematic(), durationSec * 1000);
}

export function endCinematic(): void {
  if (cinematicTimer) clearTimeout(cinematicTimer);
  cinematicTimer = null;
  cameraRig.cinematic.active = false;
  useStoryStore.getState().setCinematic(null);
}

export function runActions(actions: StoryAction[]): void {
  for (const action of actions) {
    const s = useStoryStore.getState();
    switch (action.type) {
      case 'dialogue':
        startDialogue(action.id);
        break;
      case 'addObjective':
        addObjective(action.id);
        break;
      case 'completeObjective':
        completeObjective(action.id);
        break;
      case 'failObjective':
        failObjective(action.id);
        break;
      case 'setFlag':
        s.patch({ flags: { ...s.flags, [action.flag]: action.value ?? true } });
        break;
      case 'addFlag':
        s.patch({
          flags: { ...s.flags, [action.flag]: Number(s.flags[action.flag] ?? 0) + action.delta },
        });
        break;
      case 'relationship':
        s.patch({
          relationships: {
            ...s.relationships,
            [action.npcId]: (s.relationships[action.npcId] ?? 0) + action.delta,
          },
        });
        break;
      case 'reward': {
        const granted = useEconomyLedgerStore.getState().grantReward(action.key, action.coins, action.reason);
        if (granted) toast(`+${action.coins} xu · ${action.reason.replace('Cốt truyện: ', '')}`);
        break;
      }
      case 'cinematic':
        startCinematic(action.position, action.target, action.durationSec, action.caption);
        break;
      case 'toast':
        toast(action.text);
        break;
      case 'npcSay':
        useChatStore.getState().sendChatBubble(action.npcId, action.speaker, action.text, 5200);
        break;
      case 'emote':
        useCharacterStore.getState().triggerCharacterEmote(action.npcId, action.emote);
        break;
      case 'journal':
        s.patch({
          journal: [...s.journal, { km: useGameStore.getState().distanceTraveledKm, text: action.text }],
        });
        break;
      case 'ending': {
        const chapter = getActiveChapter();
        const ending = chapter.resolveEnding(buildStoryContext());
        completeObjective('arrive');
        s.patch({ endingId: ending.id });
        useStoryStore.getState().unlockEnding(`${chapter.id}:${ending.id}`);
        runActions([
          { type: 'journal', text: `Kết thúc chương: ${ending.title}` },
          { type: 'reward', key: `story-${chapter.id}-complete`, coins: 150, reason: `Cốt truyện: Hoàn thành ${chapter.title}` },
          { type: 'dialogue', id: ending.dialogueId },
        ]);
        break;
      }
    }
  }
}

/** Evaluate beats and objective conditions once. Called on a fixed interval. */
export function tickStory(): void {
  const s = useStoryStore.getState();
  if (!s.enabled || !s.chapterId) return;
  const chapter = getActiveChapter();
  const ctx = buildStoryContext();

  for (const beat of chapter.beats) {
    if (s.firedBeats.includes(beat.id)) continue;
    if (beat.when(ctx)) {
      useStoryStore.getState().patch({
        firedBeats: [...useStoryStore.getState().firedBeats, beat.id],
      });
      runActions(beat.actions);
    }
  }

  const fresh = buildStoryContext();
  for (const id of useStoryStore.getState().activeObjectives) {
    const objective = chapter.objectives[id];
    if (!objective) continue;
    if (objective.completeWhen?.(fresh)) completeObjective(id);
    else if (objective.failWhen?.(fresh)) failObjective(id);
  }
}

/** NPC ids that an active "talk" objective points at. */
export function getTalkTargetNpcIds(activeObjectives: string[]): string[] {
  const chapter = getActiveChapter();
  const ids: string[] = [];
  for (const id of activeObjectives) {
    const target = chapter.objectives[id]?.target;
    if (target?.type === 'talk') ids.push(target.npcId);
  }
  return ids;
}

/** If the NPC is the target of an active talk objective, start its dialogue and return true. */
export function tryStartTalkObjective(npcId: string): boolean {
  const s = useStoryStore.getState();
  if (!s.enabled) return false;
  const chapter = getActiveChapter();
  for (const id of s.activeObjectives) {
    const target = chapter.objectives[id]?.target;
    if (target?.type === 'talk' && target.npcId === npcId) {
      startDialogue(target.dialogueId);
      return true;
    }
  }
  return false;
}
