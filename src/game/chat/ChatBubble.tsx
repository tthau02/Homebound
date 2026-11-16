import React from 'react';
import { Html } from '@react-three/drei';
import { EMOTE_DEFINITIONS, EmoteType } from '../character/characterTypes';
import { ActiveChatBubble } from '../../stores/useChatStore';
import { useEconomyLedgerStore } from '../../stores/useEconomyLedgerStore';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';
import { useGameStore } from '../../stores/useGameStore';
import { useInteractionStore } from '../../stores/useInteractionStore';
import { useLiveOpsStore } from '../../stores/useLiveOpsStore';
import { useJourneyStore } from '../../stores/useJourneyStore';
import { useTelemetryStore } from '../../stores/useTelemetryStore';

interface ChatBubbleProps {
  characterName: string;
  avatar: string;
  isPlayer: boolean;
  isSeated: boolean;
  isSelectedOrFocused: boolean;
  activeEmote: EmoteType | null;
  chatBubble?: ActiveChatBubble;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  characterName,
  avatar,
  isPlayer,
  isSeated,
  isSelectedOrFocused,
  activeEmote,
  chatBubble,
}) => {
  // Check if any HUD modal is currently open or title screen is active so bubbles never overlay modals
  const hasStarted = useJourneyStore((s) => s.hasStarted);
  const isEconomyOpen = useEconomyLedgerStore((s) => s.isModalOpen);
  const isLobbyOpen = useMultiplayerStore((s) => s.isLobbyModalOpen);
  const isGuideOpen = useGameStore((s) => s.isGuideOpen);
  const isInteractionOpen = useInteractionStore(
    (s) => s.selectedCharacterId !== null
  );
  const isLiveOpsOpen = useLiveOpsStore((s) => s.isModalOpen);
  const isCompletionOpen = useJourneyStore((s) => s.isCompletionModalOpen);
  const isDiagnosticsOpen = useTelemetryStore((s) => s.isDiagnosticsOpen);

  if (
    !hasStarted ||
    isEconomyOpen ||
    isLobbyOpen ||
    isGuideOpen ||
    isInteractionOpen ||
    isLiveOpsOpen ||
    isCompletionOpen ||
    isDiagnosticsOpen
  ) {
    return null;
  }

  // Keep vertical height well below the cabin ceiling (ceilingY = 2.88m, floorY = 0.72m)
  const bubbleY = isSeated ? 1.5 : 1.9;
  const emoteDef = activeEmote ? EMOTE_DEFINITIONS[activeEmote] : null;

  // Only render overlay if there is an active chat bubble, emote, or the character is a focused NPC (not the player)
  const shouldRenderOverlay =
    Boolean(chatBubble) ||
    Boolean(emoteDef) ||
    (isSelectedOrFocused && !isPlayer);

  if (!shouldRenderOverlay) {
    return null;
  }

  return (
    <Html
      position={[0, bubbleY, 0]}
      center
      // Do NOT set distanceFactor so the bubble never scales up to gigantic billboard size when near the camera!
      zIndexRange={[5, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <div className="flex flex-col items-center select-none pointer-events-none">
        {/* Compact, Crisp Chat Message Bubble */}
        {chatBubble && (
          <div className="mb-1 w-max max-w-[200px] sm:max-w-[240px] px-3 py-2 rounded-xl bg-ink-950/95 text-ink-100 border border-white/15 shadow-hud animate-fade-in pointer-events-none">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs">{avatar}</span>
              <span className="text-xs font-semibold text-accent-soft truncate max-w-[150px]">
                {characterName}
              </span>
            </div>
            <p className="text-[13px] leading-snug text-white break-words">
              {chatBubble.text}
            </p>
          </div>
        )}

        {/* Compact Active Emote Badge */}
        {emoteDef && !chatBubble && (
          <div className="mb-0.5 px-2 py-0.5 rounded-full bg-accent text-ink-950 font-bold text-xs shadow-hud flex items-center gap-1 animate-fade-in">
            <span className="text-sm">{emoteDef.emoji}</span>
          </div>
        )}

        {/* Compact Name Tag ONLY for Selected / Focused NPC */}
        {isSelectedOrFocused && !isPlayer && !chatBubble && !emoteDef && (
          <div className="px-2.5 py-1 rounded-full text-xs font-semibold border shadow-hud whitespace-nowrap flex items-center gap-1 bg-ink-900/95 text-ink-100 border-white/15">
            <span>{avatar}</span>
            <span>{characterName}</span>
          </div>
        )}
      </div>
    </Html>
  );
};
