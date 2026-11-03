import React, { useEffect } from 'react';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useChatStore } from '../../stores/useChatStore';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';
import { CharacterModel } from './CharacterModel';
import { CharacterController } from './CharacterController';
import { EmoteType } from './characterTypes';

const AMBIENT_NPC_LINES: Array<{
  npcId: string;
  text: string;
  emote: EmoteType;
}> = [
  {
    npcId: 'p1',
    text: 'Cảnh đồng lúa miền Tây hai bên đường đẹp quá! 🌾✨',
    emote: 'Smile',
  },
  {
    npcId: 'p4',
    text: 'Xe chạy êm thiệt, ngồi ghế da này thoải mái ghê 👍',
    emote: 'Nod',
  },
  {
    npcId: 'p7',
    text: 'Chào bạn nha! Bạn ngồi ghế nào thế? 👋😊',
    emote: 'Wave',
  },
  {
    npcId: 'p8',
    text: 'Haha bác tài mở nhạc miền Tây nghe vui tai quá! 😄🎶',
    emote: 'Laugh',
  },
  {
    npcId: 'p3',
    text: 'Sắp tới trạm dừng nghỉ rồi đó mọi người ơi! 👏',
    emote: 'Clap',
  },
  {
    npcId: 'p5',
    text: 'Mình tranh thủ chợp mắt một lát nhé... 😴💤',
    emote: 'Sleep',
  },
];

export const CharacterManager: React.FC = () => {
  const characterOrder = useCharacterStore((state) => state.characterOrder);
  const characters = useCharacterStore((state) => state.characters);

  // Periodic ambient NPC life (only in Offline Simulation mode)
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      if (useMultiplayerStore.getState().isOnlineMode) return;
      const item = AMBIENT_NPC_LINES[idx % AMBIENT_NPC_LINES.length];
      idx += 1;

      const charStore = useCharacterStore.getState();
      const npc = charStore.characters[item.npcId];
      if (npc) {
        charStore.triggerCharacterEmote(npc.id, item.emote);
        useChatStore
          .getState()
          .sendChatBubble(npc.id, npc.name, item.text, 5000);
      }
    }, 9500);

    return () => clearInterval(interval);
  }, []);

  return (
    <group name="CharacterManager">
      <CharacterController />
      {characterOrder.map((id) => {
        const char = characters[id];
        if (!char) return null;
        return <CharacterModel key={id} character={char} />;
      })}
    </group>
  );
};

