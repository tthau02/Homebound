import React, { useState } from 'react';
import {
  Hand,
  Info,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useInteractionStore } from '../../stores/useInteractionStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useChatStore } from '../../stores/useChatStore';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';

const NPC_REPLY_POOL = [
  'Chào bạn nhé! Rất vui được đi cùng chuyến xe miền Tây hôm nay! 😊🚌',
  'Xin chào! Ngồi ghế da xe này êm quá ha! 👋✨',
  'Chào bạn! Bạn cũng về Cần Thơ dịp này hả? 🌾😄',
  'Rất vui được làm quen với bạn trên hành trình này nhé! 🤝😊',
];

export const CharacterInteractionMenu: React.FC = () => {
  const selectedCharacterId = useInteractionStore(
    (state) => state.selectedCharacterId
  );
  const subView = useInteractionStore((state) => state.subView);
  const setSubView = useInteractionStore((state) => state.setSubView);
  const closeCharacterInteraction = useInteractionStore(
    (state) => state.closeCharacterInteraction
  );
  const showStatusToast = useInteractionStore((state) => state.showStatusToast);

  const characters = useCharacterStore((state) => state.characters);
  const playerId = useCharacterStore((state) => state.playerId);
  const triggerCharacterEmote = useCharacterStore(
    (state) => state.triggerCharacterEmote
  );
  const setFocusedCharacterId = useCharacterStore(
    (state) => state.setFocusedCharacterId
  );

  const sendChatBubble = useChatStore((state) => state.sendChatBubble);

  const [customMessage, setCustomMessage] = useState('');

  if (!selectedCharacterId) return null;
  const targetChar = characters[selectedCharacterId];
  const playerChar = characters[playerId];
  if (!targetChar || !playerChar) return null;

  const triggerNpcReply = (replyText: string) => {
    if (targetChar.isPlayer) return;
    setTimeout(() => {
      useCharacterStore.getState().triggerCharacterEmote(targetChar.id, 'Smile');
      useChatStore
        .getState()
        .sendChatBubble(targetChar.id, targetChar.name, replyText, 5200);
    }, 850);
  };

  const handleGreet = () => {
    triggerCharacterEmote(playerChar.id, 'Smile');
    sendChatBubble(
      playerChar.id,
      playerChar.name,
      targetChar.isPlayer
        ? 'Chúc mọi người một chuyến đi thượng lộ bình an! 😊'
        : `Xin chào ${targetChar.name}! Rất vui được gặp bạn trên chuyến xe 😊`,
      5000
    );

    if (!targetChar.isPlayer) {
      const randomReply =
        NPC_REPLY_POOL[Math.floor(Math.random() * NPC_REPLY_POOL.length)];
      triggerNpcReply(randomReply);
    }
    showStatusToast(`Đã gửi lời chào tới ${targetChar.name}`);
  };

  const handleWave = () => {
    triggerCharacterEmote(playerChar.id, 'Wave');
    sendChatBubble(
      playerChar.id,
      playerChar.name,
      targetChar.isPlayer
        ? 'Xin chào cả nhà nhé! 👋'
        : `Chào ${targetChar.name} nha! 👋✨`,
      4800
    );

    if (!targetChar.isPlayer) {
      setTimeout(() => {
        useCharacterStore
          .getState()
          .triggerCharacterEmote(targetChar.id, 'Wave');
        useChatStore
          .getState()
          .sendChatBubble(
            targetChar.id,
            targetChar.name,
            `Chào bạn nha! 👋😊`,
            4800
          );
      }, 700);
    }
    showStatusToast(`Đã vẫy tay với ${targetChar.name}`);
  };

  const handleSendDirectMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customMessage.trim();
    if (!trimmed) return;

    const mpStore = useMultiplayerStore.getState();
    if (mpStore.isOnlineMode && !targetChar.isPlayer) {
      mpStore.emitChatMessage(trimmed, targetChar.id);
      mpStore.emitEmote('Smile');
    } else {
      triggerCharacterEmote(playerChar.id, 'Smile');
      sendChatBubble(playerChar.id, playerChar.name, trimmed, 5500);
      if (!targetChar.isPlayer) {
        triggerNpcReply(
          `Cảm ơn tin nhắn của bạn nha! Mình ở ${targetChar.hometown} nè 😊💬`
        );
      }
    }
    setCustomMessage('');
    showStatusToast(`Đã gửi lời nhắn riêng tới ${targetChar.name}`);
  };

  const statusBadgeText =
    targetChar.state === 'sitting'
      ? `Đang ngồi • Ghế ${targetChar.seatId ?? 'N/A'}`
      : targetChar.state === 'walking'
        ? 'Đang di chuyển trên lối đi'
        : 'Đang đứng ở lối đi';

  return (
    <div className="pointer-events-auto fixed right-4 md:right-6 top-28 z-30 w-80 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl overflow-hidden text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-xl">
            {targetChar.avatar}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white">
                {targetChar.name}
              </h3>
              {targetChar.isPlayer && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  BẠN
                </span>
              )}
            </div>
            <p className="text-[11px] text-emerald-400 font-medium">
              {statusBadgeText}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setFocusedCharacterId(null);
            closeCharacterInteraction();
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Đóng menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="p-3.5 space-y-3">
        {subView === 'info' && (
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                Quê quán / Điểm đến:
              </span>
              <span className="font-semibold text-slate-200">
                {targetChar.hometown}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                Hoạt động:
              </span>
              <span className="font-medium text-sky-300">
                {targetChar.activityLabel}
              </span>
            </div>
            <div className="pt-1.5 border-t border-slate-800 text-slate-300 leading-relaxed">
              {targetChar.bio}
            </div>
            <button
              type="button"
              onClick={() => setSubView('menu')}
              className="w-full mt-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
            >
              ← Quay lại menu tương tác
            </button>
          </div>
        )}

        {subView === 'message' && (
          <form onSubmit={handleSendDirectMessage} className="space-y-2.5">
            <label
              htmlFor="direct-char-msg"
              className="block text-xs font-medium text-slate-300"
            >
              Gửi lời nhắn tới {targetChar.name}:
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="direct-char-msg"
                type="text"
                maxLength={110}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Nhập lời nhắn tiếng Việt, emoji..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                autoFocus
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSubView('menu')}
              className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition-colors"
            >
              ← Quay lại menu tương tác
            </button>
          </form>
        )}

        {subView === 'menu' && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setFocusedCharacterId(targetChar.id);
                setSubView('info');
              }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 transition-all"
            >
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Xem thông tin</span>
            </button>

            <button
              type="button"
              onClick={handleGreet}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 transition-all"
            >
              <User className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Chào hỏi</span>
            </button>

            <button
              type="button"
              onClick={handleWave}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 transition-all"
            >
              <Hand className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Vẫy tay 👋</span>
            </button>

            <button
              type="button"
              onClick={() => setSubView('message')}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 transition-all"
            >
              <MessageCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Gửi lời nhắn</span>
            </button>
          </div>
        )}

        {/* Footer Close Button */}
        <button
          type="button"
          onClick={() => {
            setFocusedCharacterId(null);
            closeCharacterInteraction();
          }}
          className="w-full py-2 rounded-xl bg-slate-900/80 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-700/50 text-xs font-semibold text-slate-300 hover:text-rose-200 transition-colors"
        >
          Đóng menu
        </button>
      </div>
    </div>
  );
};

