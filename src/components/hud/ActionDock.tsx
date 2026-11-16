import React, { useState } from 'react';
import { ArrowUpFromLine, Camera, Coffee, DoorOpen, Info, LogIn, MessageCircle, Send, Smile, Star } from 'lucide-react';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useChatStore } from '../../stores/useChatStore';
import { useInteractionStore } from '../../stores/useInteractionStore';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';
import { getDockedStationLayout, useJourneyStore } from '../../stores/useJourneyStore';
import { useStoryStore } from '../../stores/useStoryStore';
import { EMOTE_DEFINITIONS, EmoteType } from '../../game/character/characterTypes';
import { PLATFORM_EDGE_X, StationInteractableKind, findStationInteractable } from '../../game/config/stationConfig';
import { getTalkTargetNpcIds } from '../../game/story/storyEngine';
import { Button, IconButton, Panel } from '../ui/primitives';

const EMOTE_KEYS: EmoteType[] = ['Wave', 'Smile', 'Nod', 'Laugh', 'Clap', 'Sleep'];

const STATION_INTERACT_ICON: Record<StationInteractableKind, React.ReactNode> = {
  stall: <Coffee className="h-4 w-4" />,
  photo: <Camera className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
};

interface Prompt {
  id: string;
  label: string;
  kbd?: string;
  icon: React.ReactNode;
  primary?: boolean;
  onClick: () => void;
}

/** Bottom-right dock: one or two context prompts, emotes popover and chat input. */
export const ActionDock: React.FC = () => {
  const [chatInput, setChatInput] = useState('');
  const [panel, setPanel] = useState<'chat' | 'emotes' | null>(null);

  const playerId = useCharacterStore((s) => s.playerId);
  const player = useCharacterStore((s) => s.characters[s.playerId]);
  const triggerCharacterEmote = useCharacterStore((s) => s.triggerCharacterEmote);
  const standUpFromSeat = useCharacterStore((s) => s.standUpFromSeat);

  const stage = useJourneyStore((s) => s.stage);
  const doorOpen = useJourneyStore((s) => s.doorOpen);
  const isPlayerDisembarked = useJourneyStore((s) => s.isPlayerDisembarked);
  const boardPlayer = useJourneyStore((s) => s.boardPlayer);
  const disembarkPlayer = useJourneyStore((s) => s.disembarkPlayer);
  const interactWithStation = useJourneyStore((s) => s.interactWithStation);
  const isOnlineMode = useMultiplayerStore((s) => s.isOnlineMode);

  const sendChatBubble = useChatStore((s) => s.sendChatBubble);
  const nearestNpcId = useInteractionStore((s) => s.nearestInteractableNpcId);
  const nearestNpc = useCharacterStore((s) => (nearestNpcId ? s.characters[nearestNpcId] : null));
  const openCharacterInteraction = useInteractionStore((s) => s.openCharacterInteraction);
  const showStatusToast = useInteractionStore((s) => s.showStatusToast);
  const isStoryTarget = useStoryStore(
    (s) => !!nearestNpcId && s.enabled && getTalkTargetNpcIds(s.activeObjectives).includes(nearestNpcId)
  );

  if (!player) return null;

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    const mp = useMultiplayerStore.getState();
    if (mp.isOnlineMode) {
      mp.emitChatMessage(text, null);
      mp.emitEmote('Smile');
    } else {
      sendChatBubble(playerId, player.name, text, 5200);
      triggerCharacterEmote(playerId, 'Smile');
    }
    setChatInput('');
    setPanel(null);
  };

  const playEmote = (emote: EmoteType) => {
    const def = EMOTE_DEFINITIONS[emote];
    const mp = useMultiplayerStore.getState();
    if (mp.isOnlineMode) {
      mp.emitEmote(emote);
      mp.emitChatMessage(def.defaultChatText, null);
    } else {
      triggerCharacterEmote(playerId, emote);
      sendChatBubble(playerId, player.name, def.defaultChatText, 4600);
    }
    setPanel(null);
  };

  const isOutside = isPlayerDisembarked || player.position[0] >= PLATFORM_EDGE_X - 0.05;
  const stationLayout =
    !isOnlineMode && (stage === 'boarding' || stage === 'at_station' || stage === 'completed')
      ? getDockedStationLayout()
      : null;
  const stationTarget =
    stationLayout && player.position[0] >= PLATFORM_EDGE_X
      ? findStationInteractable(stationLayout, player.position[0], player.position[2])
      : null;

  // Context prompts, most relevant first
  const prompts: Prompt[] = [];
    if (nearestNpc && !stationTarget) {
      prompts.push({
        id: 'talk',
        label: `${isStoryTarget ? '' : 'Trò chuyện: '}${nearestNpc.name}`,
        kbd: 'E',
        icon: isStoryTarget ? <Star className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />,
        primary: isStoryTarget,
        onClick: () => openCharacterInteraction(nearestNpc.id, 'menu'),
      });
    }
      if (stationTarget) {
        prompts.push({
          id: `station-${stationTarget.id}`,
          label: stationTarget.label,
          kbd: 'E',
          icon: STATION_INTERACT_ICON[stationTarget.kind],
          primary: true,
          onClick: () => interactWithStation(stationTarget),
        });
      }
      if (player.state === 'sitting') {
        prompts.push({
          id: 'stand',
          label: `Rời ghế ${player.seatId ?? ''}`,
          kbd: 'Space',
          icon: <ArrowUpFromLine className="h-4 w-4" />,
          onClick: () => {
            standUpFromSeat(playerId);
            useMultiplayerStore.getState().emitStand();
            showStatusToast('Đã đứng dậy. Dùng WASD để đi lại.');
          },
        });
      }
      if (isOutside) {
        prompts.push({
          id: 'board',
          label: 'Lên lại xe',
          icon: <LogIn className="h-4 w-4" />,
          primary: !stationTarget,
          onClick: boardPlayer,
        });
      } else if (doorOpen && player.state !== 'sitting') {
        prompts.push({ id: 'exit', label: 'Xuống trạm', icon: <DoorOpen className="h-4 w-4" />, onClick: disembarkPlayer });
      }

      return (
        <div className="flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-2 sm:max-w-[420px]">
          {prompts.length > 0 && (
            <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
              {prompts.slice(0, 2).map((p) => (
                <Button key={p.id} tone={p.primary ? 'accent' : 'neutral'} icon={p.icon} kbd={p.kbd} onClick={p.onClick} className="shadow-hud">
                  {p.label}
                </Button>
              ))}
            </div>
          )}

          {panel === 'emotes' && (
            <Panel className="pointer-events-auto flex animate-fade-in gap-1 p-1.5">
              {EMOTE_KEYS.map((key) => {
                const def = EMOTE_DEFINITIONS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    title={def.label}
                    aria-label={def.label}
                    onClick={() => playEmote(key)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-colors ${player.activeEmote === key ? 'bg-accent' : 'hover:bg-white/[0.08]'
                      }`}
                  >
                    {def.emoji}
                  </button>
                );
              })}
            </Panel>
          )}

          <Panel className="pointer-events-auto flex w-full items-center gap-1 p-1">
            <IconButton label="Cảm xúc" active={panel === 'emotes'} onClick={() => setPanel(panel === 'emotes' ? null : 'emotes')}>
              <Smile className="h-5 w-5" />
            </IconButton>
            {/* Desktop: inline chat field. Mobile: toggles a compact field. */}
            <form onSubmit={sendChat} className={`${panel === 'chat' ? 'flex' : 'hidden'} min-w-0 flex-1 items-center gap-1 lg:flex`}>
              <input
                type="text"
                maxLength={110}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhắn với mọi người trên xe…"
                aria-label="Tin nhắn"
                className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-ink-950/70 px-3 py-2 text-sm text-white placeholder:text-ink-400 focus:border-accent/70 focus:outline-none"
              />
              <IconButton label="Gửi" type="submit">
                <Send className="h-4 w-4" />
              </IconButton>
            </form>
            <IconButton
              label="Chat"
              active={panel === 'chat'}
              className="lg:hidden"
              onClick={() => setPanel(panel === 'chat' ? null : 'chat')}
            >
              <MessageCircle className="h-5 w-5" />
            </IconButton>
          </Panel>
        </div>
      );
    };
