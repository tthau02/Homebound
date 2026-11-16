import { useGameStore } from '../../stores/useGameStore';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';

/**
 * Shared permission-aware environment controls (time of day) used by the settings menu.
 * In an online room only OWNER / DRIVER / ASSISTANT may change the environment and the
 * change is sent through the host instead of being applied locally.
 */
export function useEnvironmentControls() {
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const toggleTimeOfDay = useGameStore((s) => s.toggleTimeOfDay);
  const isOnlineMode = useMultiplayerStore((s) => s.isOnlineMode);
  const currentRoom = useMultiplayerStore((s) => s.currentRoom);
  const user = useMultiplayerStore((s) => s.user);
  const emitJourneyControl = useMultiplayerStore((s) => s.emitJourneyControl);

  const role = user ? currentRoom?.players[user.id]?.role : undefined;
  const canChangeEnvironment =
    !isOnlineMode || role === 'OWNER' || role === 'DRIVER' || role === 'ASSISTANT';

  const setTime = (next: 'day' | 'night') => {
    if (!canChangeEnvironment || next === timeOfDay) return;
    if (isOnlineMode) {
      emitJourneyControl('SET_TIME', undefined, undefined, next === 'day' ? 'DAY' : 'NIGHT');
      return;
    }
    toggleTimeOfDay();
  };

  return { timeOfDay, setTime, canChangeEnvironment, isOnlineMode };
}
