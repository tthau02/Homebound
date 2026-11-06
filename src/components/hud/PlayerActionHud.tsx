import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpFromLine,
  Coffee,
  DoorOpen,
  LogOut,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useChatStore } from '../../stores/useChatStore';
import { useInteractionStore } from '../../stores/useInteractionStore';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';
import { useGameStore } from '../../stores/useGameStore';
import { useJourneyStore } from '../../stores/useJourneyStore';
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

  const doorOpen = useJourneyStore((state) => state.doorOpen);
  const isPlayerDisembarked = useJourneyStore((state) => state.isPlayerDisembarked);
  const boardPlayer = useJourneyStore((state) => state.boardPlayer);
  const disembarkPlayer = useJourneyStore((state) => state.disembarkPlayer);
  const interactWithStationStall = useJourneyStore((state) => state.interactWithStationStall);

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
  const isOutside = isPlayerDisembarked || player.position[0] > 1.35;
  const isNearStall = isOutside && Math.hypot(player.position[0] - 4.6, player.position[2] - (-1.8)) < 3.2;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 px-1">
      {/* Dynamic Interaction & Mobile Movement Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {statusToast && (
          <div className="pointer-events-auto px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-amber-500/40 text-amber-200 text-[11px] sm:text-xs font-medium shadow-xl backdrop-blur-xl animate-fade-in flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>{statusToast}</span>
          </div>
        )}

        {/* Mobile Walk Controls (Visible on touch/mobile when player is on foot) */}
        {isStanding && (
          <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-white/10 shadow-2xl sm:hidden">
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
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 border-amber-300 scale-95 shadow-lg'
                  : 'bg-slate-900/90 text-slate-200 border-white/10'
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
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
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 border-amber-300 scale-95 shadow-lg'
                  : 'bg-slate-900/90 text-slate-200 border-white/10'
              }`}
            >
              <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
              <span>Lùi</span>
            </button>
          </div>
        )}

        {/* Stand Up Prompt */}
        {player.state === 'sitting' && (
          <button
            type="button"
            onClick={handleStandUp}
            className="pointer-events-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white text-xs font-bold shadow-xl shadow-amber-500/20 border border-amber-300/40 transition-all hover:scale-105"
          >
            <ArrowUpFromLine className="w-3.5 h-3.5" />
            <span>Rời ghế {player.seatId} [Space]</span>
          </button>
        )}

        {/* Station Sugarcane Stall Interaction */}
        {isNearStall && (
          <button
            type="button"
            onClick={interactWithStationStall}
            className="pointer-events-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-xl shadow-emerald-500/20 border border-emerald-300 transition-all hover:scale-105 animate-bounce"
          >
            <Coffee className="w-4 h-4 text-emerald-950" />
            <span>Uống ly nước mía mát lạnh [E]</span>
          </button>
        )}

        {/* Board Bus Prompt when outside */}
        {isOutside && (
          <button
            type="button"
            onClick={boardPlayer}
            className="pointer-events-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-bold shadow-xl border border-amber-300 transition-all hover:scale-105"
          >
            <LogOut className="w-3.5 h-3.5 rotate-180" />
            <span>Bước lên lại xe</span>
          </button>
        )}

        {/* Disembark Bus Prompt when at station and door open */}
        {!isOutside && doorOpen && player.state !== 'sitting' && (
          <button
            type="button"
            onClick={disembarkPlayer}
            className="pointer-events-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-sky-500/25 hover:bg-sky-500/35 border border-sky-400/50 text-sky-200 text-xs font-semibold shadow-xl backdrop-blur-xl transition-all hover:scale-105 animate-pulse"
          >
            <DoorOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>Cửa xe đang mở • Xuống trạm tham quan</span>
          </button>
        )}

        {/* Talk with nearest NPC Prompt */}
        {nearestNpc && !isNearStall && (
          <button
            type="button"
            onClick={() => openCharacterInteraction(nearestNpc.id, 'menu')}
            className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 text-xs font-semibold shadow-xl backdrop-blur-xl transition-all hover:scale-105"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-300" />
            <span>Trò chuyện với {nearestNpc.name} [E]</span>
          </button>
        )}
      </div>

      {/* Social Bar: Keybinds + Chat + Quick Emotes */}
      <div className="pointer-events-auto w-full px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/60 flex items-center justify-between gap-2">
        {/* Desktop Keyboard Hints */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
          <kbd className="px-1.5 py-0.5 rounded-md bg-white/5 text-amber-300 font-mono text-[10px] border border-white/10">WASD</kbd>
          <span>Đi</span>
          <span className="text-slate-600">•</span>
          <kbd className="px-1.5 py-0.5 rounded-md bg-white/5 text-amber-300 font-mono text-[10px] border border-white/10">E</kbd>
          <span>Tương tác</span>
          <span className="text-slate-600">•</span>
          <kbd className="px-1.5 py-0.5 rounded-md bg-white/5 text-amber-300 font-mono text-[10px] border border-white/10">Space</kbd>
          <span>Ghế</span>
        </div>

        {/* Chat Input Field */}
        <form
          onSubmit={handleSendChat}
          className="flex-1 min-w-[120px] max-w-md flex items-center gap-1.5"
        >
          <div className="relative flex-1 flex items-center">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              maxLength={110}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Nhập tin nhắn trò chuyện..."
              className="w-full pl-8 pr-2.5 py-1 sm:py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-[11px] sm:text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/40 transition-all"
            />
          </div>
          <button
            type="submit"
            title="Gửi tin nhắn"
            className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-bold text-xs flex items-center gap-1 shadow-lg shadow-amber-500/20 border border-amber-300/30 transition-all shrink-0 hover:scale-105 active:scale-95"
          >
            <Send className="w-3 h-3" />
            <span className="hidden sm:inline">Gửi</span>
          </button>
        </form>

        {/* Reaction Emotes */}
        <div className="flex items-center gap-1 shrink-0 overflow-x-auto max-w-[160px] sm:max-w-none scrollbar-none">
          {EMOTE_KEYS.map((emoteKey) => {
            const def = EMOTE_DEFINITIONS[emoteKey];
            const isActive = player.activeEmote === emoteKey;
            return (
              <button
                key={emoteKey}
                type="button"
                onClick={() => handleTriggerEmote(emoteKey)}
                title={def.label}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs sm:text-sm flex items-center justify-center border transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 border-amber-300 scale-110 shadow-lg shadow-amber-500/30'
                    : 'bg-white/5 hover:bg-white/10 text-white border-white/10 hover:border-white/20 hover:scale-105'
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
