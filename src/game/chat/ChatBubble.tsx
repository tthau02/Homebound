import React from 'react';
import { Html } from '@react-three/drei';
import { EMOTE_DEFINITIONS, EmoteType } from '../character/characterTypes';
import { ActiveChatBubble } from '../../stores/useChatStore';
import { useEconomyLedgerStore } from '../../stores/useEconomyLedgerStore';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';
import { useGameStore } from '../../stores/useGameStore';
import { useInteractionStore } from '../../stores/useInteractionStore';
import { useLiveOpsStore } from '../../stores/useLiveOpsStore';

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
  // Check if any HUD modal is currently open. If open, suppress in-world bubbles so they NEVER overlay modals
  const isEconomyOpen = useEconomyLedgerStore((s) => s.isModalOpen);
  const isLobbyOpen = useMultiplayerStore((s) => s.isLobbyModalOpen);
  const isGuideOpen = useGameStore((s) => s.isGuideOpen);
  const isInteractionOpen = useInteractionStore(
    (s) => s.selectedCharacterId !== null
  );
  const isLiveOpsOpen = useLiveOpsStore((s) => s.isModalOpen);

  if (
    isEconomyOpen ||
    isLobbyOpen ||
    isGuideOpen ||
    isInteractionOpen ||
    isLiveOpsOpen
  ) {
    return null;
  }

  // Keep vertical height well below the cabin ceiling (ceilingY = 2.88m, floorY = 0.72m)
  const bubbleY = isSeated ? 1.28 : 1.62;
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
          <div className="mb-1 w-max max-w-[170px] sm:max-w-[210px] px-2.5 py-1.5 rounded-xl bg-slate-950/95 text-slate-100 border border-amber-400/50 shadow-xl backdrop-blur-md animate-fade-in pointer-events-none">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs">{avatar}</span>
              <span className="text-[10px] font-bold text-amber-400 truncate max-w-[120px]">
                {characterName}
              </span>
            </div>
            <p className="text-[11px] leading-snug text-white break-words">
              {chatBubble.text}
            </p>
          </div>
        )}

        {/* Compact Active Emote Badge */}
        {emoteDef && !chatBubble && (
          <div className="mb-0.5 px-2 py-0.5 rounded-full bg-amber-500/95 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-1 animate-bounce">
            <span className="text-sm">{emoteDef.emoji}</span>
          </div>
        )}

        {/* Compact Name Tag ONLY for Selected / Focused NPC */}
        {isSelectedOrFocused && !isPlayer && !chatBubble && !emoteDef && (
          <div className="px-2 py-0.5 rounded-full text-[10px] font-semibold border shadow-md whitespace-nowrap flex items-center gap-1 bg-slate-900/90 text-sky-200 border-sky-400/50 backdrop-blur-md">
            <span>{avatar}</span>
            <span>{characterName}</span>
          </div>
        )}
      </div>
    </Html>
  );
};
