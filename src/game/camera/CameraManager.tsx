import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraMode, useGameStore } from '../../stores/useGameStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import {
  CAMERA_PRESETS,
  CAMERA_TRANSITION_CONFIG,
} from '../config/cameraConfig';
import { busLiveOffset } from '../animation/useBusAnimation';

export const CameraManager: React.FC = () => {
  const { camera, gl } = useThree();
  const cameraMode = useGameStore((state) => state.cameraMode);
  const setCameraMode = useGameStore((state) => state.setCameraMode);

  // Pre-allocated vectors in refs to avoid per-frame allocations
  const currentPosRef = useRef(
    new THREE.Vector3(...CAMERA_PRESETS.interior.position)
  );
  const currentTargetRef = useRef(
    new THREE.Vector3(...CAMERA_PRESETS.interior.target)
  );
  const desiredPosRef = useRef(
    new THREE.Vector3(...CAMERA_PRESETS.interior.position)
  );
  const desiredTargetRef = useRef(
    new THREE.Vector3(...CAMERA_PRESETS.interior.target)
  );

  // Subtle interactive look offset (drag or pointer movement)
  const isDraggingRef = useRef(false);
  const dragPrevRef = useRef({ x: 0, y: 0 });
  const targetLookOffsetRef = useRef({ yaw: 0, pitch: 0 });
  const currentLookOffsetRef = useRef({ yaw: 0, pitch: 0 });

  // Reset look offset when switching camera modes
  useEffect(() => {
    targetLookOffsetRef.current.yaw = 0;
    targetLookOffsetRef.current.pitch = 0;
  }, [cameraMode]);

  // Keyboard shortcuts: 1 (Interior), 2 (Top-down), 3 (Rear Chase)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const modeMap: Record<string, CameraMode> = {
        '1': 'interior',
        Numpad1: 'interior',
        '2': 'top-down',
        Numpad2: 'top-down',
        '3': 'chase',
        Numpad3: 'chase',
      };

      const nextMode = modeMap[event.key] || modeMap[event.code];
      if (nextMode) {
        useCharacterStore.getState().setFocusedCharacterId(null);
        setCameraMode(nextMode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setCameraMode]);

  // Pointer drag / subtle mouse look adjustment
  useEffect(() => {
    const domElement = gl.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      dragPrevRef.current.x = e.clientX;
      dragPrevRef.current.y = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (isDraggingRef.current) {
        const dx = (e.clientX - dragPrevRef.current.x) * 0.0035;
        const dy = (e.clientY - dragPrevRef.current.y) * 0.0025;
        dragPrevRef.current.x = e.clientX;
        dragPrevRef.current.y = e.clientY;

        targetLookOffsetRef.current.yaw = THREE.MathUtils.clamp(
          targetLookOffsetRef.current.yaw - dx,
          -CAMERA_TRANSITION_CONFIG.interiorMaxYaw,
          CAMERA_TRANSITION_CONFIG.interiorMaxYaw
        );
        targetLookOffsetRef.current.pitch = THREE.MathUtils.clamp(
          targetLookOffsetRef.current.pitch - dy,
          -CAMERA_TRANSITION_CONFIG.interiorMaxPitch,
          CAMERA_TRANSITION_CONFIG.interiorMaxPitch
        );
      } else {
        const normX = (e.clientX / window.innerWidth) * 2 - 1;
        const normY = (e.clientY / window.innerHeight) * 2 - 1;
        targetLookOffsetRef.current.yaw = THREE.MathUtils.lerp(
          targetLookOffsetRef.current.yaw,
          -normX * 0.16,
          0.08
        );
        targetLookOffsetRef.current.pitch = THREE.MathUtils.lerp(
          targetLookOffsetRef.current.pitch,
          -normY * 0.08,
          0.08
        );
      }
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [gl.domElement]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const activeMode = useGameStore.getState().cameraMode;
    const preset = CAMERA_PRESETS[activeMode];

    const charStore = useCharacterStore.getState();
    const focusedId = charStore.focusedCharacterId;
    const focusedChar = focusedId ? charStore.characters[focusedId] : null;
    const playerChar = charStore.characters[charStore.playerId];

    // Smooth exponential damping factor (~0.45s - 0.7s visual settle time)
    const dampFactor = 1 - Math.exp(-7.5 * delta);
    const lookDampFactor = 1 - Math.exp(-10.0 * delta);

    currentLookOffsetRef.current.yaw = THREE.MathUtils.lerp(
      currentLookOffsetRef.current.yaw,
      targetLookOffsetRef.current.yaw,
      lookDampFactor
    );
    currentLookOffsetRef.current.pitch = THREE.MathUtils.lerp(
      currentLookOffsetRef.current.pitch,
      targetLookOffsetRef.current.pitch,
      lookDampFactor
    );

    const yaw = currentLookOffsetRef.current.yaw;
    const pitch = currentLookOffsetRef.current.pitch;

    if (activeMode === 'interior') {
      if (focusedChar) {
        // Focus camera inside the aisle looking cleanly at the selected passenger
        const camZ = Math.min(5.2, Math.max(-1.2, focusedChar.position[2] + 2.35));
        desiredPosRef.current.set(
          busLiveOffset.xSway + yaw * 0.15,
          2.12 + busLiveOffset.y * 0.85,
          camZ
        );
        desiredTargetRef.current.set(
          focusedChar.position[0] * 0.65 + busLiveOffset.xSway - yaw * 2.5,
          1.62 + busLiveOffset.y * 0.65 + pitch * 1.8,
          focusedChar.position[2] - 0.4
        );
      } else {
        // Follow player softly along the aisle while keeping cabin view clear
        const followZ = playerChar
          ? Math.min(5.15, Math.max(-0.6, playerChar.position[2] + 2.6))
          : preset.position[2];
        desiredPosRef.current.set(
          preset.position[0] + busLiveOffset.xSway + yaw * 0.18,
          preset.position[1] + busLiveOffset.y * 0.85,
          followZ
        );
        desiredTargetRef.current.set(
          preset.target[0] + busLiveOffset.xSway - yaw * 4.5,
          preset.target[1] + busLiveOffset.y * 0.65 + pitch * 2.4,
          preset.target[2]
        );
      }
    } else if (activeMode === 'top-down') {
      if (focusedChar) {
        desiredPosRef.current.set(
          focusedChar.position[0] * 0.35 + busLiveOffset.xSway * 0.3,
          12.4,
          focusedChar.position[2] + 0.3
        );
        desiredTargetRef.current.set(
          focusedChar.position[0] * 0.5 + busLiveOffset.xSway * 0.3,
          1.2,
          focusedChar.position[2]
        );
      } else {
        desiredPosRef.current.set(
          preset.position[0] + busLiveOffset.xSway * 0.3 - yaw * 0.8,
          preset.position[1],
          preset.position[2] + pitch * 0.8
        );
        desiredTargetRef.current.set(
          preset.target[0] + busLiveOffset.xSway * 0.3,
          preset.target[1],
          preset.target[2]
        );
      }
    } else {
      // Rear Chase camera: smoothly follow behind the bus with dampened sway
      desiredPosRef.current.set(
        preset.position[0] + busLiveOffset.xSway * 0.55 - yaw * 1.6,
        preset.position[1] + busLiveOffset.y * 0.35 - pitch * 0.8,
        preset.position[2]
      );
      desiredTargetRef.current.set(
        preset.target[0] + busLiveOffset.xSway * 0.4 + yaw * 2.5,
        preset.target[1] + busLiveOffset.y * 0.25 + pitch * 1.6,
        preset.target[2]
      );
    }

    currentPosRef.current.lerp(desiredPosRef.current, dampFactor);
    currentTargetRef.current.lerp(desiredTargetRef.current, dampFactor);

    camera.position.copy(currentPosRef.current);
    camera.lookAt(currentTargetRef.current);

    if (camera instanceof THREE.PerspectiveCamera) {
      if (Math.abs(camera.fov - preset.fov) > 0.05) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, preset.fov, dampFactor);
        camera.updateProjectionMatrix();
      }
    }
  });

  return null;
};
