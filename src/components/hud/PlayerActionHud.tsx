import React, { useState } from 'react';
import {
  ArrowUpFromLine,
  Coffee,
  DoorOpen,
  LogOut,
  MessageSquare,
  Send,
  Smile,
  Sparkles,
  X,
} from 'lucide-react';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useChatStore } from '../../stores/useChatStore';
import { useInteractionStore } from '../../stores/useInteractionStore';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';
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
  const [mobilePanel, setMobilePanel] = useState<'chat' | 'emotes' | null>(
    null
  );

  const playerId = useCharacterStore((state) => state.playerId);
  const player = useCharacterStore((state) => state.characters[state.playerId]);
  const triggerCharacterEmote = useCharacterStore(
    (state) => state.triggerCharacterEmote
  );
  const standUpFromSeat = useCharacterStore((state) => state.standUpFromSeat);

  const doorOpen = useJourneyStore((state) => state.doorOpen);
  const isPlayerDisembarked = useJourneyStore(
    (state) => state.isPlayerDisembarked
  );
  const boardPlayer = useJourneyStore((state) => state.boardPlayer);
  const disembarkPlayer = useJourneyStore((state) => state.disembarkPlayer);
  const interactWithStationStall = useJourneyStore(
    (state) => state.interactWithStationStall
  );

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
    setMobilePanel(null);
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
    setMobilePanel(null);
  };

  const handleStandUp = () => {
    standUpFromSeat(playerId);
    useMultiplayerStore.getState().emitStand();
    showStatusToast('Đã đứng dậy! Dùng phím mũi tên hoặc WASD để đi lại.');
  };

  const isOutside = isPlayerDisembarked || player.position[0] > 1.35;
  const isNearStall =
    isOutside &&
    Math.hypot(player.position[0] - 4.6, player.position[2] - -1.8) < 3.2;

  return (
    <div className="flex flex-col items-end gap-1.5 max-w-[44vw] sm:max-w-[330px] lg:w-[440px] xl:w-[485px] min-w-0">
      {/* ==================== 1. RIGHT-ALIGNED TOAST & CONTEXT PROMPTS ==================== */}
      {statusToast && (
        <div className="pointer-events-auto max-w-full px-3 py-1 rounded-2xl bg-slate-950/90 border border-amber-500/40 text-amber-200 text-[10px] sm:text-xs font-medium shadow-xl backdrop-blur-xl animate-fade-in flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span className="line-clamp-2 sm:truncate">{statusToast}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-1.5 max-w-full">
        {/* Stand Up Prompt */}
        {player.state === 'sitting' && (
          <button
            type="button"
            onClick={handleStandUp}
            className="pointer-events-auto flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white text-[11px] sm:text-xs font-bold shadow-xl shadow-amber-500/20 border border-amber-300/40 transition-all hover:scale-105 whitespace-nowrap"
          >
            <ArrowUpFromLine className="w-3.5 h-3.5 shrink-0" />
            <span>
              Rời ghế {player.seatId}{' '}
              <span className="hidden lg:inline">[Space]</span>
            </span>
          </button>
        )}

        {/* Station Sugarcane Stall Interaction */}
        {isNearStall && (
          <button
            type="button"
            onClick={interactWithStationStall}
            className="pointer-events-auto flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-[11px] sm:text-xs font-black shadow-xl border border-emerald-300 transition-all hover:scale-105 animate-bounce whitespace-nowrap"
          >
            <Coffee className="w-3.5 h-3.5 text-emerald-950 shrink-0" />
            <span>
              Nước mía <span className="hidden sm:inline">mát lạnh</span>{' '}
              <span className="hidden lg:inline">[E]</span>
            </span>
          </button>
        )}

        {/* Board Bus Prompt when outside */}
        {isOutside && (
          <button
            type="button"
            onClick={boardPlayer}
            className="pointer-events-auto flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-[11px] sm:text-xs font-bold shadow-xl border border-amber-300 transition-all hover:scale-105 whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5 rotate-180 shrink-0" />
            <span>Lên lại xe</span>
          </button>
        )}

        {/* Disembark Bus Prompt when at station and door open (hidden on tiny phones since Left Dock already shows 'Xuống') */}
        {!isOutside && doorOpen && player.state !== 'sitting' && (
          <button
            type="button"
            onClick={disembarkPlayer}
            className="pointer-events-auto hidden sm:flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-sky-500/25 hover:bg-sky-500/35 border border-sky-400/50 text-sky-200 text-[11px] sm:text-xs font-semibold shadow-xl backdrop-blur-xl transition-all hover:scale-105 whitespace-nowrap"
          >
            <DoorOpen className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Xuống trạm tham quan</span>
          </button>
        )}

        {/* Talk with nearest NPC Prompt */}
        {nearestNpc && !isNearStall && (
          <button
            type="button"
            onClick={() => openCharacterInteraction(nearestNpc.id, 'menu')}
            className="pointer-events-auto flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 text-[11px] sm:text-xs font-semibold shadow-xl backdrop-blur-xl transition-all hover:scale-105 max-w-full"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-300 shrink-0" />
            <span className="truncate">
              <span className="hidden sm:inline">Trò chuyện: </span>
              {nearestNpc.name}{' '}
              <span className="hidden lg:inline">[E]</span>
            </span>
          </button>
        )}
      </div>

      {/* ==================== 2A. MOBILE COMPACT SOCIAL & EMOTE DOCK (< lg) ==================== */}
      <div className="pointer-events-auto flex lg:hidden flex-col items-end gap-1.5 max-w-full">
        {/* Popover: Quick Emotes */}
        {mobilePanel === 'emotes' && (
          <div className="p-1.5 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-white/15 shadow-2xl flex items-center gap-1">
            {EMOTE_KEYS.map((emoteKey) => {
              const def = EMOTE_DEFINITIONS[emoteKey];
              const isActive = player.activeEmote === emoteKey;
              return (
                <button
                  key={emoteKey}
                  type="button"
                  onClick={() => handleTriggerEmote(emoteKey)}
                  title={def.label}
                  className={`w-8 h-8 rounded-xl text-sm flex items-center justify-center border transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 border-amber-300 scale-105'
                      : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                  }`}
                >
                  {def.emoji}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setMobilePanel(null)}
              aria-label="Đóng cảm xúc"
              className="w-7 h-8 rounded-xl bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Popover: Compact Chat Form */}
        {mobilePanel === 'chat' && (
          <form
            onSubmit={handleSendChat}
            className="w-[220px] sm:w-[270px] p-1.5 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-white/15 shadow-2xl flex items-center gap-1"
          >
            <input
              type="text"
              autoFocus
              maxLength={110}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Nhắn tin..."
              className="flex-1 min-w-0 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              aria-label="Gửi tin nhắn"
              className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setMobilePanel(null)}
              aria-label="Đóng chat"
              className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Compact Bottom-Right Trigger Pill */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-white/10 shadow-2xl">
          <button
            type="button"
            onClick={() =>
              setMobilePanel(mobilePanel === 'emotes' ? null : 'emotes')
            }
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              mobilePanel === 'emotes'
                ? 'bg-amber-500 text-slate-950 border-amber-300'
                : 'bg-white/5 text-amber-200 border-white/10'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cảm xúc</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setMobilePanel(mobilePanel === 'chat' ? null : 'chat')
            }
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              mobilePanel === 'chat'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white border-amber-300'
                : 'bg-white/5 text-slate-200 border-white/10'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
            <span>Chat</span>
          </button>
        </div>
      </div>

      {/* ==================== 2B. DESKTOP RIGHT-DOCKED SOCIAL & EMOTES (lg+) ==================== */}
      <div className="pointer-events-auto hidden lg:flex flex-col gap-1.5 w-full">
        {/* Pill 1: Keybind Hints + 6 Quick Emotes */}
        <div className="w-full px-3 py-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-white/10 shadow-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
            <kbd className="px-1.5 py-0.5 rounded-md bg-white/5 text-amber-300 font-mono text-[10px] border border-white/10">
              WASD
            </kbd>
            <span>Đi</span>
            <span className="text-slate-600">•</span>
            <kbd className="px-1.5 py-0.5 rounded-md bg-white/5 text-amber-300 font-mono text-[10px] border border-white/10">
              E
            </kbd>
            <span className="hidden xl:inline">Tương tác</span>
            <span className="text-slate-600">•</span>
            <kbd className="px-1.5 py-0.5 rounded-md bg-white/5 text-amber-300 font-mono text-[10px] border border-white/10">
              Space
            </kbd>
            <span>Ghế</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {EMOTE_KEYS.map((emoteKey) => {
              const def = EMOTE_DEFINITIONS[emoteKey];
              const isActive = player.activeEmote === emoteKey;
              return (
                <button
                  key={emoteKey}
                  type="button"
                  onClick={() => handleTriggerEmote(emoteKey)}
                  title={def.label}
                  className={`w-7 h-7 rounded-xl text-xs flex items-center justify-center border transition-all duration-200 ${
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

        {/* Pill 2: Chat Input Field */}
        <form
          onSubmit={handleSendChat}
          className="w-full px-3 py-2 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/60 flex items-center gap-2"
        >
          <div className="relative flex-1 flex items-center">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              maxLength={110}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Nhập tin nhắn trò chuyện..."
              className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/40 transition-all"
            />
          </div>
          <button
            type="submit"
            title="Gửi tin nhắn"
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 border border-amber-300/30 transition-all shrink-0 hover:scale-105 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi</span>
          </button>
        </form>
      </div>
    </div>
  );
};
