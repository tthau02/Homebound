import React, { useState } from 'react';
import {
  ArrowUpFromLine,
  Keyboard,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useChatStore } from '../../stores/useChatStore';
import { useInteractionStore } from '../../stores/useInteractionStore';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';
import {
  EMOTE_DEFINITIONS,
  EmoteType,
} from '../../game/character/characterTypes';

const EMOTE_KEYS: EmoteType[] = [
  'Wave',
  'Smile',
  'Nod',
  'Laugh',
  'Clap',
  'Sleep',
];

export const PlayerActionHud: React.FC = () => {
  const [chatInput, setChatInput] = useState('');

  const playerId = useCharacterStore((state) => state.playerId);
  const player = useCharacterStore((state) => state.characters[state.playerId]);
  const triggerCharacterEmote = useCharacterStore(
    (state) => state.triggerCharacterEmote
  );
  const standUpFromSeat = useCharacterStore((state) => state.standUpFromSeat);

  const sendChatBubble = useChatStore((state) => state.sendChatBubble);

  const nearestNpcId = useInteractionStore(
    (state) => state.nearestInteractableNpcId
  );
  const nearestNpc = useCharacterStore((state) =>
    nearestNpcId ? state.characters[nearestNpcId] : null
  );
  const openCharacterInteraction = useInteractionStore(
    (state) => state.openCharacterInteraction
  );
  const statusToast = useInteractionStore((state) => state.statusToast);
  const showStatusToast = useInteractionStore((state) => state.showStatusToast);

  if (!player) return null;

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const mpStore = useMultiplayerStore.getState();
    if (mpStore.isOnlineMode) {
      mpStore.emitChatMessage(trimmed, null);
      mpStore.emitEmote('Smile');
    } else {
      sendChatBubble(playerId, player.name, trimmed, 5200);
      triggerCharacterEmote(playerId, 'Smile');
    }
    setChatInput('');
  };

  const handleTriggerEmote = (emote: EmoteType) => {
    const def = EMOTE_DEFINITIONS[emote];
    const mpStore = useMultiplayerStore.getState();
    if (mpStore.isOnlineMode) {
      mpStore.emitEmote(emote);
      mpStore.emitChatMessage(def.defaultChatText, null);
    } else {
      triggerCharacterEmote(playerId, emote);
      sendChatBubble(playerId, player.name, def.defaultChatText, 4600);
    }
  };

  const handleStandUp = () => {
    standUpFromSeat(playerId);
    useMultiplayerStore.getState().emitStand();
    showStatusToast('Bạn đã đứng dậy khỏi ghế (Dùng WASD để di chuyển)');
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-2 mb-2.5">
      {/* Live Status Toast & Proximity Interaction Prompt */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {statusToast && (
          <div className="pointer-events-auto px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/50 text-amber-200 text-xs font-medium shadow-lg backdrop-blur-md">
            {statusToast}
          </div>
        )}

        {player.state === 'sitting' && (
          <button
            type="button"
            onClick={handleStandUp}
            className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg transition-all"
          >
            <ArrowUpFromLine className="w-3.5 h-3.5" />
            <span>Đứng dậy khỏi ghế {player.seatId} (Phím Space)</span>
          </button>
        )}

        {nearestNpc && (
          <button
            type="button"
            onClick={() => openCharacterInteraction(nearestNpc.id, 'menu')}
            className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-200 text-xs font-semibold shadow-lg backdrop-blur-md transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>
              Tương tác với {nearestNpc.name} (Phím E hoặc Click)
            </span>
          </button>
        )}
      </div>

      {/* Chat & Emote Control Bar */}
      <div className="pointer-events-auto w-full px-3.5 py-2.5 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Left: Keyboard Movement Hints */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-300">
          <Keyboard className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="text-white">WASD</strong>: Đi lại •{' '}
            <strong className="text-white">Shift</strong>: Đi nhanh •{' '}
            <strong className="text-white">Space</strong>: Đứng dậy •{' '}
            <strong className="text-white">Click ghế trống</strong>: Ngồi
          </span>
        </div>

        {/* Center: Local Chat Input */}
        <form
          onSubmit={handleSendChat}
          className="flex-1 min-w-[220px] max-w-md flex items-center gap-1.5"
        >
          <div className="relative flex-1 flex items-center">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              maxLength={110}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Trò chuyện trên xe (hỗ trợ tiếng Việt & emoji)..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            title="Hiển thị bong bóng chat"
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chat</span>
          </button>
        </form>

        {/* Right: 6 Emote Buttons */}
        <div className="flex items-center gap-1">
          {EMOTE_KEYS.map((emoteKey) => {
            const def = EMOTE_DEFINITIONS[emoteKey];
            const isActive = player.activeEmote === emoteKey;
            return (
              <button
                key={emoteKey}
                type="button"
                onClick={() => handleTriggerEmote(emoteKey)}
                title={def.label}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 border-amber-300 scale-105 shadow-md'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-800'
                }`}
              >
                <span>{def.emoji}</span>
                <span className="hidden xl:inline text-[11px]">{emoteKey}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

