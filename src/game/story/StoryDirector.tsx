import React, { useEffect } from 'react';
import { useStoryStore } from '../../stores/useStoryStore';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';
import { useJourneyStore } from '../../stores/useJourneyStore';
import { useInteractionStore } from '../../stores/useInteractionStore';
import {
  endCinematic,
  getActiveChapter,
  tickStory,
  tryStartTalkObjective,
} from './storyEngine';

const TICK_MS = 300;

/**
 * Headless component that drives the story runtime:
 * - starts / resets the chapter (offline single-player only),
 * - evaluates beats & objectives on a fixed interval,
 * - turns NPC interactions into story dialogue when an objective targets that NPC.
 */
export const StoryDirector: React.FC = () => {
  const enabled = useStoryStore((s) => s.enabled);
  const isOnlineMode = useMultiplayerStore((s) => s.isOnlineMode);
  const active = enabled && !isOnlineMode;

  // Start the chapter when the story becomes active
  useEffect(() => {
    if (!active) {
      endCinematic();
      return;
    }
    const chapter = getActiveChapter();
    if (useStoryStore.getState().chapterId !== chapter.id) {
      useStoryStore.getState().resetChapter(chapter.id, chapter.initialFlags);
    }
  }, [active]);

  // Fixed-rate evaluation loop
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(tickStory, TICK_MS);
    return () => window.clearInterval(id);
  }, [active]);

  // Restart the chapter when the journey restarts after completion
  useEffect(() => {
    if (!active) return;
    return useJourneyStore.subscribe((state, prev) => {
      const restarted =
        prev.stage === 'completed' && state.stage === 'in_transit' && state.currentStopIndex === 0;
      if (restarted) {
        const chapter = getActiveChapter();
        endCinematic();
        useStoryStore.getState().resetChapter(chapter.id, chapter.initialFlags);
      }
    });
  }, [active]);

  // Talking to an objective's target NPC opens the story dialogue instead of the generic menu
  useEffect(() => {
    if (!active) return;
    return useInteractionStore.subscribe((state, prev) => {
      const npcId = state.selectedCharacterId;
      if (npcId && npcId !== prev.selectedCharacterId) {
        tryStartTalkObjective(npcId);
      }
    });
  }, [active]);

  useEffect(() => () => endCinematic(), []);

  return null;
};
