import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useInteractionStore } from '../../stores/useInteractionStore';
import { useChatStore } from '../../stores/useChatStore';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';
import { useGameStore } from '../../stores/useGameStore';
import { useJourneyStore } from '../../stores/useJourneyStore';
import { BUS_DIMENSIONS } from '../config/busConfig';
import { EMOTE_DEFINITIONS } from './characterTypes';

const WALK_SPEED = 1.6;
const FAST_WALK_SPEED = 2.6;
const AUTO_WALK_SPEED = 1.95;

// Walkable central aisle bounds inside the coach bus
const AISLE_BOUNDS = {
  minX: -0.22,
  maxX: 0.22,
  minZ: -3.65,
  maxZ: 5.2,
} as const;

export const CharacterController: React.FC = () => {
  const keysPressedRef = useRef<{
    w: boolean;
    a: boolean;
    s: boolean;
    d: boolean;
    shift: boolean;
  }>({
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
  });

  useEffect(() => {
    const isTypingInInput = (target: EventTarget | null) =>
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingInInput(e.target)) return;

      const code = e.code;
      const key = e.key.toLowerCase();

      if (code === 'KeyW' || key === 'w' || code === 'ArrowUp') {
        keysPressedRef.current.w = true;
      }
      if (code === 'KeyS' || key === 's' || code === 'ArrowDown') {
        keysPressedRef.current.s = true;
      }
      if (code === 'KeyA' || key === 'a' || code === 'ArrowLeft') {
        keysPressedRef.current.a = true;
      }
      if (code === 'KeyD' || key === 'd' || code === 'ArrowRight') {
        keysPressedRef.current.d = true;
      }
      if (e.shiftKey || code === 'ShiftLeft' || code === 'ShiftRight') {
        keysPressedRef.current.shift = true;
      }

      // Space: Stand up when sitting, or Board bus when near door
      if (code === 'Space') {
        e.preventDefault();
        const charStore = useCharacterStore.getState();
        const player = charStore.characters[charStore.playerId];
        if (player && player.state === 'sitting') {
          charStore.standUpFromSeat(player.id);
          useMultiplayerStore.getState().emitStand();
          useInteractionStore
            .getState()
            .showStatusToast('Đã đứng dậy (Dùng WASD hoặc phím trên màn hình để đi lại)');
        }
      }

      // E: Interact with nearest passenger or station stall
      if (code === 'KeyE' || key === 'e') {
        e.preventDefault();
        const charStore = useCharacterStore.getState();
        const player = charStore.characters[charStore.playerId];
        if (!player) return;

        // Check if player is near sugarcane juice cart at station (x ~ 4.6, z ~ -1.8)
        const distToStall = Math.hypot(player.position[0] - 4.6, player.position[2] - (-1.8));
        if (distToStall < 2.8) {
          useJourneyStore.getState().interactWithStationStall();
          return;
        }

        const interStore = useInteractionStore.getState();
        const nearestId = interStore.nearestInteractableNpcId;

        if (nearestId && charStore.characters[nearestId]) {
          const npc = charStore.characters[nearestId];
          interStore.openCharacterInteraction(nearestId, 'menu');
          charStore.triggerCharacterEmote(charStore.playerId, 'Wave');
          useChatStore
            .getState()
            .sendChatBubble(
              charStore.playerId,
              'Bạn',
              `Chào bạn ${npc.name} nhé! 👋`
            );
        } else {
          interStore.showStatusToast(
            'Hãy lại gần hành khách hoặc quán nước để tương tác!'
          );
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key.toLowerCase();

      if (code === 'KeyW' || key === 'w' || code === 'ArrowUp') {
        keysPressedRef.current.w = false;
      }
      if (code === 'KeyS' || key === 's' || code === 'ArrowDown') {
        keysPressedRef.current.s = false;
      }
      if (code === 'KeyA' || key === 'a' || code === 'ArrowLeft') {
        keysPressedRef.current.a = false;
      }
      if (code === 'KeyD' || key === 'd' || code === 'ArrowRight') {
        keysPressedRef.current.d = false;
      }
      if (!e.shiftKey) {
        keysPressedRef.current.shift = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const charStore = useCharacterStore.getState();
    const player = charStore.characters[charStore.playerId];
    if (!player) return;

    // 1. Proximity detection for nearest passenger (within 2.35m radius)
    let closestNpcId: string | null = null;
    let minDistSq = 2.35 * 2.35;
    for (const id of charStore.characterOrder) {
      if (id === player.id) continue;
      const npc = charStore.characters[id];
      if (!npc) continue;
      const dx = npc.position[0] - player.position[0];
      const dz = npc.position[2] - player.position[2];
      const dSq = dx * dx + dz * dz;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        closestNpcId = id;
      }
    }
    useInteractionStore.getState().setNearestInteractableNpcId(closestNpcId);

    const keys = keysPressedRef.current;
    const mobileDir = useGameStore.getState().mobileMoveDir;
    let moveZInput = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
    if (mobileDir === 'forward') moveZInput -= 1;
    if (mobileDir === 'backward') moveZInput += 1;
    const moveXInput = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    const hasManualInput = moveXInput !== 0 || moveZInput !== 0;

    // 2. Do not allow movement while sitting
    if (player.state === 'sitting') {
      return;
    }

    // 3. If user presses movement while auto-walking to a seat, cancel auto-walk
    if (hasManualInput && player.waypoints.length > 0) {
      charStore.cancelAutoWalk(player.id);
    }

    // 4. Handle Auto-Walk Waypoints to a clicked empty seat
    if (player.waypoints.length > 0 && player.targetSeatId) {
      const targetWp = player.waypoints[0];
      const dx = targetWp[0] - player.position[0];
      const dz = targetWp[2] - player.position[2];
      const dist = Math.hypot(dx, dz);
      const step = AUTO_WALK_SPEED * delta;

      if (dist <= step + 0.03) {
        const remaining = player.waypoints.slice(1);
        if (remaining.length === 0) {
          // Reached the target seat -> sit down!
          const sat = charStore.completeSitDownAtSeat(
            player.id,
            player.targetSeatId
          );
          if (sat) {
            useMultiplayerStore.getState().emitSit(player.targetSeatId);
          }
        } else {
          useCharacterStore.setState((s) => ({
            characters: {
              ...s.characters,
              [player.id]: {
                ...s.characters[player.id],
                position: [targetWp[0], BUS_DIMENSIONS.floorY, targetWp[2]],
                waypoints: remaining,
              },
            },
          }));
        }
      } else {
        const nx = dx / dist;
        const nz = dz / dist;
        const nextX = player.position[0] + nx * step;
        const nextZ = player.position[2] + nz * step;
        const targetYaw = Math.atan2(-nx, -nz);

        charStore.updateCharacterTransform(
          player.id,
          [nextX, BUS_DIMENSIONS.floorY, nextZ],
          targetYaw
        );
        useMultiplayerStore
          .getState()
          .emitMoveThrottled(
            [nextX, BUS_DIMENSIONS.floorY, nextZ],
            targetYaw,
            'walking',
            'Walking'
          );
      }
      return;
    }

    // 5. Handle Manual Keyboard / Mobile Movement inside Bus or Outside at Station
    if (hasManualInput) {
      const len = Math.hypot(moveXInput, moveZInput);
      const dirX = moveXInput / len;
      const dirZ = moveZInput / len;
      const speed = keys.shift ? FAST_WALK_SPEED : WALK_SPEED;

      const rawNextX = player.position[0] + dirX * speed * delta;
      const rawNextZ = player.position[2] + dirZ * speed * delta;

      const journey = useJourneyStore.getState();
      const isDisembarked = journey.isPlayerDisembarked || player.position[0] > 1.35;
      const isDoorOpen = journey.doorOpen;

      let nextX = player.position[0];
      let nextY: number = BUS_DIMENSIONS.floorY;
      let nextZ = player.position[2];

      if (isDisembarked) {
        // Player is outside on the station platform
        const nearDoorZ = rawNextZ >= -5.35 && rawNextZ <= -4.15;
        // Step back through the open bus door
        if (nearDoorZ && rawNextX < 1.45 && isDoorOpen) {
          nextX = rawNextX;
          nextZ = rawNextZ;
          const stairT = Math.max(0, Math.min(1, (1.45 - rawNextX) / 1.15));
          nextY = THREE.MathUtils.lerp(0.22, BUS_DIMENSIONS.floorY, stairT);

          if (rawNextX <= 0.22) {
            useJourneyStore.setState({ isPlayerDisembarked: false });
            nextX = Math.max(AISLE_BOUNDS.minX, Math.min(AISLE_BOUNDS.maxX, rawNextX));
            nextY = BUS_DIMENSIONS.floorY;
          }
        } else {
          // Walking freely around the station platform
          nextX = Math.max(1.45, Math.min(14.5, rawNextX));
          nextZ = Math.max(-13.5, Math.min(13.5, rawNextZ));
          nextY = 0.22;
        }
      } else {
        // Player is inside the bus
        const nearDoorZ = rawNextZ >= -5.35 && rawNextZ <= -4.15;
        // If bus door is open and player is walking toward the door on the right
        if (nearDoorZ && isDoorOpen && rawNextX > 0.15) {
          nextX = rawNextX;
          nextZ = rawNextZ;
          if (nextX > 0.3) {
            const stairT = Math.max(0, Math.min(1, (nextX - 0.3) / 1.1));
            nextY = THREE.MathUtils.lerp(BUS_DIMENSIONS.floorY, 0.22, stairT);
          }
          if (nextX >= 1.4) {
            useJourneyStore.setState({ isPlayerDisembarked: true });
            nextY = 0.22;
          }
        } else {
          // Inside standard central aisle bounds
          nextX = Math.max(AISLE_BOUNDS.minX, Math.min(AISLE_BOUNDS.maxX, rawNextX));
          nextZ = Math.max(AISLE_BOUNDS.minZ, Math.min(AISLE_BOUNDS.maxZ, rawNextZ));
          nextY = BUS_DIMENSIONS.floorY;
        }
      }

      const targetYaw = Math.atan2(-dirX, -dirZ);

      charStore.updateCharacterTransform(
        player.id,
        [nextX, nextY, nextZ],
        targetYaw
      );
      charStore.setCharacterStateAndAnimation(
        player.id,
        'walking',
        'Walking',
        isDisembarked
          ? 'Đang đi dạo trên sân ga bến xe'
          : keys.shift
            ? 'Đang đi nhanh trên lối đi'
            : 'Đang đi dọc lối đi'
      );
      useMultiplayerStore
        .getState()
        .emitMoveThrottled(
          [nextX, nextY, nextZ],
          targetYaw,
          'walking',
          'Walking'
        );
    } else if (player.state === 'walking') {
      // Stopped moving -> return to Idle (or active emote animation)
      const idleAnim = player.activeEmote
        ? EMOTE_DEFINITIONS[player.activeEmote].animation
        : 'Idle';
      const isDisembarked = useJourneyStore.getState().isPlayerDisembarked || player.position[0] > 1.35;
      charStore.setCharacterStateAndAnimation(
        player.id,
        'idle',
        idleAnim,
        isDisembarked
          ? 'Đang đứng tại sảnh trạm dừng xe'
          : 'Đang đứng ở lối đi giữa xe'
      );
      useMultiplayerStore
        .getState()
        .emitMoveThrottled(
          player.position,
          player.rotationY,
          'idle',
          idleAnim
        );
    }
  });

  return null;
};
