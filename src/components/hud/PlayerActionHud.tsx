import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpFromLine,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useChatStore } from '../../stores/useChatStore';
import { useInteractionStore } from '../../stores/useInteractionStore';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';
import { useGameStore } from '../../stores/useGameStore';
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
  const setMobileMoveDir = useGameStore((state) => state.setMobileMoveDir);
  const mobileMoveDir = useGameStore((state) => state.mobileMoveDir);

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
    showStatusToast('Đã đứng dậy (Dùng WASD hoặc phím trên màn hình để đi lại)');
  };

  const isStanding = player.state !== 'sitting';

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-1.5 mb-1 sm:mb-2 px-1">
      {/* Dynamic Interaction & Mobile Movement Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {statusToast && (
          <div className="pointer-events-auto px-3 py-1 rounded-full bg-slate-900/90 border border-amber-500/50 text-amber-200 text-[11px] sm:text-xs font-medium shadow-lg backdrop-blur-md animate-fade-in">
            {statusToast}
          </div>
        )}

        {/* Mobile Walk Controls (Visible on touch/mobile when player is on foot) */}
        {isStanding && (
          <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80 shadow-lg sm:hidden">
            <button
              type="button"
              onTouchStart={(e) => {
                e.preventDefault();
                setMobileMoveDir('forward');
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                setMobileMoveDir(null);
              }}
              onMouseDown={() => setMobileMoveDir('forward')}
              onMouseUp={() => setMobileMoveDir(null)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                mobileMoveDir === 'forward'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 scale-95 shadow-md'
                  : 'bg-slate-900/90 text-slate-200 border-slate-700'
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Tiến</span>
            </button>

            <button
              type="button"
              onTouchStart={(e) => {
                e.preventDefault();
                setMobileMoveDir('backward');
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                setMobileMoveDir(null);
              }}
              onMouseDown={() => setMobileMoveDir('backward')}
              onMouseUp={() => setMobileMoveDir(null)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                mobileMoveDir === 'backward'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 scale-95 shadow-md'
                  : 'bg-slate-900/90 text-slate-200 border-slate-700'
              }`}
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Lùi</span>
            </button>
          </div>
        )}

        {player.state === 'sitting' && (
          <button
            type="button"
            onClick={handleStandUp}
            className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg transition-all animate-bounce"
          >
            <ArrowUpFromLine className="w-3.5 h-3.5" />
            <span>Rời ghế {player.seatId} (Space)</span>
          </button>
        )}

        {nearestNpc && (
          <button
            type="button"
            onClick={() => openCharacterInteraction(nearestNpc.id, 'menu')}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/25 hover:bg-sky-500/35 border border-sky-400/50 text-sky-200 text-xs font-semibold shadow-lg backdrop-blur-md transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Trò chuyện ({nearestNpc.name})</span>
          </button>
        )}
      </div>

      {/* Social Bar: Keybinds + Chat + Quick Emotes */}
      <div className="pointer-events-auto w-full px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl bg-slate-950/75 backdrop-blur-md border border-slate-800/80 shadow-xl flex items-center justify-between gap-2">
        {/* Desktop Keyboard Hints */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800/90 text-amber-300 font-mono text-[10px] border border-slate-700">WASD</kbd>
          <span>Đi</span>
          <span className="text-slate-600">•</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800/90 text-amber-300 font-mono text-[10px] border border-slate-700">E</kbd>
          <span>Tương tác</span>
          <span className="text-slate-600">•</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800/90 text-amber-300 font-mono text-[10px] border border-slate-700">Space</kbd>
          <span>Ghế</span>
        </div>

        {/* Chat Input Field */}
        <form
          onSubmit={handleSendChat}
          className="flex-1 min-w-[120px] max-w-md flex items-center gap-1.5"
        >
          <div className="relative flex-1 flex items-center">
            <MessageSquare className="w-3 h-3 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              maxLength={110}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="w-full pl-7 pr-2.5 py-1 sm:py-1.5 rounded-xl bg-slate-900/85 border border-slate-700/80 text-[11px] sm:text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/80 transition-colors"
            />
          </div>
          <button
            type="submit"
            title="Gửi tin nhắn"
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md transition-all shrink-0"
          >
            <Send className="w-3 h-3" />
            <span className="hidden sm:inline">Gửi</span>
          </button>
        </form>

        {/* Reaction Emotes */}
        <div className="flex items-center gap-1 shrink-0 overflow-x-auto max-w-[150px] sm:max-w-none">
          {EMOTE_KEYS.map((emoteKey) => {
            const def = EMOTE_DEFINITIONS[emoteKey];
            const isActive = player.activeEmote === emoteKey;
            return (
              <button
                key={emoteKey}
                type="button"
                onClick={() => handleTriggerEmote(emoteKey)}
                title={def.label}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl text-xs sm:text-sm flex items-center justify-center border transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 border-amber-300 scale-105 shadow-md'
                    : 'bg-slate-900/85 hover:bg-slate-800 text-white border-slate-800 hover:border-slate-700'
                }`}
              >
                {def.emoji}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
