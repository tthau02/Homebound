import React from 'react';
import { Html } from '@react-three/drei';
import { EMOTE_DEFINITIONS, EmoteType } from '../character/characterTypes';
import { ActiveChatBubble } from '../../stores/useChatStore';

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
  // Keep vertical height well below the cabin red ceiling (y = 2.88m, floorY = 0.72m -> max local Y < 1.95m)
  // so Interior Camera never has the chat bubble blocked by the roof!
  const bubbleY = isSeated ? 1.34 : 1.68;
  const emoteDef = activeEmote ? EMOTE_DEFINITIONS[activeEmote] : null;

  const shouldRenderOverlay =
    Boolean(chatBubble) || Boolean(emoteDef) || isPlayer || isSelectedOrFocused;

  if (!shouldRenderOverlay) {
    return null;
  }

  return (
    <Html
      position={[0, bubbleY, 0]}
      center
      distanceFactor={7.5}
      zIndexRange={[30, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <div className="flex flex-col items-center select-none pointer-events-none">
        {/* Chat Message Bubble */}
        {chatBubble && (
          <div className="mb-1.5 w-max max-w-[210px] px-3 py-2 rounded-2xl bg-slate-950/92 text-slate-100 border border-amber-400/50 shadow-xl backdrop-blur-md animate-fade-in">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs">{avatar}</span>
              <span className="text-[10px] font-bold text-amber-400 truncate max-w-[140px]">
                {characterName}
              </span>
            </div>
            <p className="text-xs leading-snug text-white break-words whitespace-pre-wrap">
              {chatBubble.text}
            </p>
          </div>
        )}

        {/* Active Emote Badge */}
        {emoteDef && !chatBubble && (
          <div className="mb-1 px-2.5 py-1 rounded-full bg-amber-500/90 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-1 animate-bounce">
            <span className="text-sm">{emoteDef.emoji}</span>
            <span>{emoteDef.id}</span>
          </div>
        )}

        {/* Compact Name Tag for Player or Selected Passenger */}
        {(isPlayer || isSelectedOrFocused) && !chatBubble && (
          <div
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shadow-md whitespace-nowrap flex items-center gap-1 ${
              isPlayer
                ? 'bg-amber-500/90 text-slate-950 border-amber-300'
                : 'bg-slate-900/85 text-sky-200 border-sky-400/50'
            }`}
          >
            <span>{avatar}</span>
            <span>{isPlayer ? 'Bạn (WASD)' : characterName}</span>
          </div>
        )}
      </div>
    </Html>
  );
};

