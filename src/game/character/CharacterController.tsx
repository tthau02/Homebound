import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useInteractionStore } from '../../stores/useInteractionStore';
import { useChatStore } from '../../stores/useChatStore';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';
import { getDockedStationLayout, useJourneyStore } from '../../stores/useJourneyStore';
import { BUS_DIMENSIONS } from '../config/busConfig';
import {
  DOOR_HALF_WIDTH,
  DOOR_Z,
  PLATFORM_EDGE_X,
  PLATFORM_Y,
  StationLayout,
  findStationInteractable,
  isStationWalkable,
} from '../config/stationConfig';
import { EMOTE_DEFINITIONS } from './characterTypes';
import { rotateInputByCameraYaw } from '../camera/cameraRig';
import { isStoryDialogueOpen } from '../../stores/useStoryStore';
import { playerInput } from './playerInput';

/** Top speeds in m/s. Inside the cabin people move more carefully than on the pavement. */
const SPEED = {
  cabinWalk: 1.45,
  cabinFast: 2.3,
  streetWalk: 1.75,
  streetRun: 3.7,
  autoWalk: 1.9,
} as const;
const ACCEL_RATE = 9;
const BRAKE_RATE = 13;
const TURN_RATE = 12;
const TWO_PI = Math.PI * 2;

// Walkable cabin floor: the central aisle plus the vestibule between the door and row 1
const AISLE = { halfWidth: 0.24, minZ: -5.3, maxZ: 5.2 } as const;
const VESTIBULE_CLOSED_MAX_X = 0.95;
/** Fallback outdoor area used in online rooms (StopArea), where no offline station is docked. */
const ONLINE_STOP_BOUNDS = { minX: PLATFORM_EDGE_X, maxX: 14.5, minZ: -13.5, maxZ: 13.5 } as const;

function isInsideCabin(x: number, z: number, doorOpen: boolean): boolean {
  if (Math.abs(x) <= AISLE.halfWidth && z >= AISLE.minZ && z <= AISLE.maxZ) return true;
  const maxX = doorOpen ? PLATFORM_EDGE_X : VESTIBULE_CLOSED_MAX_X;
  return x >= -AISLE.halfWidth && x <= maxX && Math.abs(z - DOOR_Z) <= DOOR_HALF_WIDTH - 0.05;
}

function canStandAt(
  x: number,
  z: number,
  doorOpen: boolean,
  station: StationLayout | null,
  allowLegacyOutside: boolean
): boolean {
  if (x < PLATFORM_EDGE_X) return isInsideCabin(x, z, doorOpen);
  if (station) return isStationWalkable(station, x, z);
  if (allowLegacyOutside) {
    const b = ONLINE_STOP_BOUNDS;
    return x <= b.maxX && z >= b.minZ && z <= b.maxZ;
  }
  return false;
}

/** Floor height under a character: cabin floor, door steps, or the pavement. */
function groundYAt(x: number): number {
  if (x <= 0.3) return BUS_DIMENSIONS.floorY;
  if (x >= 1.4) return PLATFORM_Y;
  return THREE.MathUtils.lerp(BUS_DIMENSIONS.floorY, PLATFORM_Y, (x - 0.3) / 1.1);
}

function wrapAngle(a: number): number {
  return a - TWO_PI * Math.floor((a + Math.PI) / TWO_PI);
}

/**
 * Local player movement: analog, camera-relative input (WASD / arrows / touch joystick),
 * velocity with acceleration and braking, smooth turning, sliding along obstacles, and
 * auto-walk along waypoints to a clicked seat (including boarding through the door).
 */
export const CharacterController: React.FC = () => {
  const keysPressedRef = useRef({ w: false, a: false, s: false, d: false, shift: false });
  const worldInputRef = useRef({ x: 0, z: 0 });
  const velocityRef = useRef({ x: 0, z: 0 });

  useEffect(() => {
    const isTypingInInput = (target: EventTarget | null) =>
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingInInput(e.target)) return;
      // Story dialogue owns Space / E / digits while it is open
      if (isStoryDialogueOpen()) return;
      if (!useJourneyStore.getState().hasStarted) return;

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

      // Space: Stand up when sitting
      if (code === 'Space') {
        e.preventDefault();
        const charStore = useCharacterStore.getState();
        const player = charStore.characters[charStore.playerId];
        if (player && player.state === 'sitting') {
          charStore.standUpFromSeat(player.id);
          useMultiplayerStore.getState().emitStand();
          useInteractionStore
            .getState()
            .showStatusToast('Đã đứng dậy. Dùng WASD hoặc cần điều khiển để đi lại.');
        }
      }

      // E: Interact with a station stall or the nearest passenger
      if (code === 'KeyE' || key === 'e') {
        e.preventDefault();
        const charStore = useCharacterStore.getState();
        const player = charStore.characters[charStore.playerId];
        if (!player) return;

        const station = getDockedStationLayout();
        if (station && player.position[0] >= PLATFORM_EDGE_X) {
          const target = findStationInteractable(station, player.position[0], player.position[2]);
          if (target) {
            useJourneyStore.getState().interactWithStation(target);
            return;
          }
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
            'Hãy lại gần hành khách hoặc quầy hàng để tương tác!'
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

    // Releasing keys while the window is unfocused would otherwise leave them stuck
    const handleBlur = () => {
      const keys = keysPressedRef.current;
      keys.w = keys.a = keys.s = keys.d = keys.shift = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const charStore = useCharacterStore.getState();
    const player = charStore.characters[charStore.playerId];
    if (!player) return;

    const journey = useJourneyStore.getState();
    const isOnline = useMultiplayerStore.getState().isOnlineMode;
    const px = player.position[0];
    const pz = player.position[2];
    const isOutside = px >= PLATFORM_EDGE_X - 0.05;
    const velocity = velocityRef.current;

    // 1. Proximity detection for the nearest passenger (only meaningful inside the cabin)
    let closestNpcId: string | null = null;
    if (!isOutside) {
      let minDistSq = 2.35 * 2.35;
      for (const id of charStore.characterOrder) {
        if (id === player.id) continue;
        const npc = charStore.characters[id];
        if (!npc) continue;
        const dx = npc.position[0] - px;
        const dz = npc.position[2] - pz;
        const dSq = dx * dx + dz * dz;
        if (dSq < minDistSq) {
          minDistSq = dSq;
          closestNpcId = id;
        }
      }
    }
    useInteractionStore.getState().setNearestInteractableNpcId(closestNpcId);

    // Keep the "outside" flag in sync with where the player actually stands (offline)
    if (!isOnline && journey.isPlayerDisembarked !== isOutside) {
      useJourneyStore.setState({ isPlayerDisembarked: isOutside });
    }

    // 2. Read input (keyboard + analog joystick), camera-relative
    const keys = keysPressedRef.current;
    let inputX = (keys.d ? 1 : 0) - (keys.a ? 1 : 0) + playerInput.moveX;
    let inputZ = (keys.s ? 1 : 0) - (keys.w ? 1 : 0) + playerInput.moveZ;
    let magnitude = Math.hypot(inputX, inputZ);
    if (magnitude > 1) {
      inputX /= magnitude;
      inputZ /= magnitude;
      magnitude = 1;
    }
    if (isStoryDialogueOpen() || !journey.hasStarted || magnitude < 0.12) {
      inputX = 0;
      inputZ = 0;
      magnitude = 0;
    }
    const hasManualInput = magnitude > 0;

    // 3. Seated passengers do not move
    if (player.state === 'sitting') {
      velocity.x = 0;
      velocity.z = 0;
      return;
    }

    // 4. Pressing a direction cancels auto-walk to a seat
    if (hasManualInput && player.waypoints.length > 0) {
      charStore.cancelAutoWalk(player.id);
    }

    // 5. Auto-walk along waypoints to a clicked empty seat
    if (!hasManualInput && player.waypoints.length > 0 && player.targetSeatId) {
      velocity.x = 0;
      velocity.z = 0;
      const targetWp = player.waypoints[0];
      const dx = targetWp[0] - px;
      const dz = targetWp[2] - pz;
      const dist = Math.hypot(dx, dz);
      const step = SPEED.autoWalk * delta;

      if (dist <= step + 0.03) {
        const remaining = player.waypoints.slice(1);
        if (remaining.length === 0) {
          // Reached the target seat -> sit down!
          const sat = charStore.completeSitDownAtSeat(player.id, player.targetSeatId);
          if (sat) {
            useMultiplayerStore.getState().emitSit(player.targetSeatId);
          }
        } else {
          useCharacterStore.setState((s) => ({
            characters: {
              ...s.characters,
              [player.id]: {
                ...s.characters[player.id],
                position: [targetWp[0], groundYAt(targetWp[0]), targetWp[2]],
                waypoints: remaining,
              },
            },
          }));
        }
      } else {
        const nx = dx / dist;
        const nz = dz / dist;
        const nextX = px + nx * step;
        const nextZ = pz + nz * step;
        const wantYaw = Math.atan2(-nx, -nz);
        const yaw = player.rotationY + wrapAngle(wantYaw - player.rotationY) * (1 - Math.exp(-TURN_RATE * delta));
        const nextPos: [number, number, number] = [nextX, groundYAt(nextX), nextZ];

        charStore.updateCharacterTransform(player.id, nextPos, yaw);
        useMultiplayerStore.getState().emitMoveThrottled(nextPos, yaw, 'walking', 'Walking');
      }
      return;
    }

    // 6. Manual movement: accelerate toward the desired velocity, brake when released
    const station = isOnline ? null : getDockedStationLayout();
    const fast = keys.shift || magnitude > 0.92;
    const topSpeed = isOutside
      ? fast
        ? SPEED.streetRun
        : SPEED.streetWalk
      : fast
        ? SPEED.cabinFast
        : SPEED.cabinWalk;

    const worldInput = worldInputRef.current;
    rotateInputByCameraYaw(inputX, inputZ, worldInput);
    // A full stick deflection only adds speed when jogging; otherwise it is plain walking
    const analog = fast ? 1 : Math.min(1, magnitude / 0.92);
    const scale = magnitude > 0 ? (topSpeed * analog) / magnitude : 0;
    const targetVx = worldInput.x * scale;
    const targetVz = worldInput.z * scale;
    const blend = 1 - Math.exp(-(hasManualInput ? ACCEL_RATE : BRAKE_RATE) * delta);
    velocity.x += (targetVx - velocity.x) * blend;
    velocity.z += (targetVz - velocity.z) * blend;

    let speed = Math.hypot(velocity.x, velocity.z);
    if (!hasManualInput && speed < 0.06) {
      velocity.x = 0;
      velocity.z = 0;
      speed = 0;
    }

    if (speed > 0) {
      const doorOpen = journey.doorOpen;
      let nextX = px + velocity.x * delta;
      let nextZ = pz + velocity.z * delta;

      // Slide along walls and obstacles instead of stopping dead
      if (!canStandAt(nextX, nextZ, doorOpen, station, isOutside)) {
        if (canStandAt(nextX, pz, doorOpen, station, isOutside)) {
          nextZ = pz;
          velocity.z = 0;
        } else if (canStandAt(px, nextZ, doorOpen, station, isOutside)) {
          nextX = px;
          velocity.x = 0;
        } else {
          nextX = px;
          nextZ = pz;
          velocity.x = 0;
          velocity.z = 0;
        }
      }

      // Caught on the door steps as the door closes: step back into the cabin
      if (!doorOpen && nextX > VESTIBULE_CLOSED_MAX_X && nextX < PLATFORM_EDGE_X) {
        nextX = VESTIBULE_CLOSED_MAX_X;
      }

      const moved = Math.hypot(nextX - px, nextZ - pz);
      const wantYaw = moved > 0.0005 ? Math.atan2(-velocity.x, -velocity.z) : player.rotationY;
      const yaw = player.rotationY + wrapAngle(wantYaw - player.rotationY) * (1 - Math.exp(-TURN_RATE * delta));
      const nextPos: [number, number, number] = [nextX, groundYAt(nextX), nextZ];
      const nowOutside = nextX >= PLATFORM_EDGE_X - 0.05;

      charStore.updateCharacterTransform(player.id, nextPos, yaw);
      charStore.setCharacterStateAndAnimation(
        player.id,
        'walking',
        'Walking',
        nowOutside ? (fast ? 'Đang chạy bộ ở trạm' : 'Đang đi dạo ở trạm') : 'Đang đi dọc lối đi'
      );
      useMultiplayerStore.getState().emitMoveThrottled(nextPos, yaw, 'walking', 'Walking');
    } else if (player.state === 'walking') {
      // Stopped moving -> return to Idle (or active emote animation)
      const idleAnim = player.activeEmote
        ? EMOTE_DEFINITIONS[player.activeEmote].animation
        : 'Idle';
      charStore.setCharacterStateAndAnimation(
        player.id,
        'idle',
        idleAnim,
        isOutside ? 'Đang đứng ở trạm dừng' : 'Đang đứng ở lối đi giữa xe'
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
