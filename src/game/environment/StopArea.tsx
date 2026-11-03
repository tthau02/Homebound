import React from 'react';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useChatStore } from '../../stores/useChatStore';
import { useInteractionStore } from '../../stores/useInteractionStore';

export const StopArea: React.FC = () => {
  const currentRoom = useMultiplayerStore((state) => state.currentRoom);
  const atStop = currentRoom?.journey.status === 'AT_STOP';
  const stop = currentRoom?.route.stops[currentRoom.journey.currentStopOrder];

  const takePhoto = () => {
    const characterStore = useCharacterStore.getState();
    const player = characterStore.characters[characterStore.playerId];
    if (!player) return;
    characterStore.triggerCharacterEmote(player.id, 'Wave');
    useChatStore
      .getState()
      .sendChatBubble(player.id, 'Bạn', `📸 Check-in tại ${stop?.name ?? 'trạm dừng'}!`);
    useInteractionStore
      .getState()
      .showStatusToast('Đã chụp ảnh check-in nhóm tại trạm!');
  };

  if (!atStop) return null;

  return (
    <group name="ActiveStopArea" position={[0, 0, 0]}>
      <mesh position={[8, 0.035, 0]} receiveShadow>
        <boxGeometry args={[12, 0.07, 12]} />
        <meshStandardMaterial color="#b7a38b" roughness={0.94} />
      </mesh>

      {/* Small rest-stop kiosk */}
      <group position={[12.2, 0, -3.2]}>
        <mesh position={[0, 1.05, 0]} castShadow>
          <boxGeometry args={[2.1, 2.1, 2]} />
          <meshStandardMaterial color="#f3d9a4" />
        </mesh>
        <mesh position={[0, 2.22, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[1.72, 0.85, 4]} />
          <meshStandardMaterial color="#a33b32" />
        </mesh>
        <mesh position={[0, 1.35, 1.03]}>
          <planeGeometry args={[1.25, 0.42]} />
          <meshBasicMaterial color="#fff2ca" />
        </mesh>
      </group>

      {/* Rest benches */}
      {[-1.8, 1.8].map((z) => (
        <group key={z} position={[7.2, 0, z]}>
          <mesh position={[0, 0.48, 0]} castShadow>
            <boxGeometry args={[1.8, 0.12, 0.55]} />
            <meshStandardMaterial color="#7c4a2d" />
          </mesh>
          <mesh position={[0, 0.82, -0.22]} castShadow>
            <boxGeometry args={[1.8, 0.55, 0.1]} />
            <meshStandardMaterial color="#8d5635" />
          </mesh>
          {[-0.62, 0.62].map((x) => (
            <mesh key={x} position={[x, 0.24, 0]} castShadow>
              <boxGeometry args={[0.1, 0.48, 0.12]} />
              <meshStandardMaterial color="#45413a" />
            </mesh>
          ))}
        </group>
      ))}

      {/* Clickable group photo spot */}
      <group
        position={[5.2, 0, 3.3]}
        onClick={(event) => {
          event.stopPropagation();
          takePhoto();
        }}
      >
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[2.6, 2.9, 0.18]} />
          <meshStandardMaterial color="#f2b84b" />
        </mesh>
        <mesh position={[0, 1.5, 0.12]}>
          <boxGeometry args={[2.25, 2.5, 0.08]} />
          <meshStandardMaterial color="#286a65" />
        </mesh>
        <mesh position={[0, 3.3, 0]}>
          <boxGeometry args={[3, 0.45, 0.22]} />
          <meshStandardMaterial color="#b33a35" />
        </mesh>
      </group>
    </group>
  );
};
