import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraMode, useGameStore } from '../../stores/useGameStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import {
  CAMERA_INPUT_CONFIG,
  CAMERA_PRESETS,
  ORBIT_PRESETS,
} from '../config/cameraConfig';
import { busLiveOffset } from '../animation/useBusAnimation';
import { cameraRig } from './cameraRig';
import { isStoryDialogueOpen } from '../../stores/useStoryStore';

const TWO_PI = Math.PI * 2;

/** Wrap an angle into [-PI, PI]. */
function wrapAngle(a: number): number {
  return a - TWO_PI * Math.floor((a + Math.PI) / TWO_PI);
}

/** Return the equivalent of `target` closest to `reference` (shortest rotation). */
function nearestEquivalentAngle(reference: number, target: number): number {
  return reference + wrapAngle(target - reference);
}

/**
 * Largest t in [0, maxT] for which `origin + dir * t` stays inside the axis-aligned box.
 * Returns maxT when the origin itself is outside the box (no clamping applied).
 */
function clampRayToBox(
  origin: THREE.Vector3,
  dir: THREE.Vector3,
  maxT: number,
  box: typeof CAMERA_INPUT_CONFIG.cabinClamp
): number {
  if (
    origin.x < box.minX || origin.x > box.maxX ||
    origin.y < box.minY || origin.y > box.maxY ||
    origin.z < box.minZ || origin.z > box.maxZ
  ) {
    return maxT;
  }
  let t = maxT;
  if (dir.x > 1e-5) t = Math.min(t, (box.maxX - origin.x) / dir.x);
  else if (dir.x < -1e-5) t = Math.min(t, (box.minX - origin.x) / dir.x);
  if (dir.y > 1e-5) t = Math.min(t, (box.maxY - origin.y) / dir.y);
  else if (dir.y < -1e-5) t = Math.min(t, (box.minY - origin.y) / dir.y);
  if (dir.z > 1e-5) t = Math.min(t, (box.maxZ - origin.z) / dir.z);
  else if (dir.z < -1e-5) t = Math.min(t, (box.minZ - origin.z) / dir.z);
  return Math.max(0.15, t);
}

/**
 * Unified spherical-orbit camera controller.
 * - Full 360° yaw, clamped pitch, wheel / pinch zoom for all three modes.
 * - Right-drag rotates immediately; left-drag rotates after a small threshold so
 *   clicks on seats and passengers still work. `V` toggles pointer-lock free look.
 * - Interior camera is kept inside the cabin volume so it never clips through walls.
 */
export const CameraManager: React.FC = () => {
  const { camera, gl, size } = useThree();
  const cameraMode = useGameStore((state) => state.cameraMode);
  const setCameraMode = useGameStore((state) => state.setCameraMode);
  const focusedCharacterId = useCharacterStore((state) => state.focusedCharacterId);

  // Orbit targets (set by input) and damped values (used for rendering)
  const targetRef = useRef({ ...ORBIT_PRESETS.interior });
  const currentRef = useRef({
    yaw: ORBIT_PRESETS.interior.yaw,
    pitch: ORBIT_PRESETS.interior.pitch,
    distance: ORBIT_PRESETS.interior.distance,
  });

  // Pre-allocated math objects (no allocations inside useFrame)
  const pivotDesiredRef = useRef(new THREE.Vector3(0, 2.2, 2));
  const pivotCurrentRef = useRef(new THREE.Vector3(0, 2.2, 2));
  const offsetDirRef = useRef(new THREE.Vector3());
  const camPosRef = useRef(new THREE.Vector3());
  const cinePosRef = useRef(new THREE.Vector3());
  const cineTargetRef = useRef(new THREE.Vector3());
  /** Tracks cabin ↔ pavement transitions so the follow distance adapts once per transition. */
  const wasOutsideRef = useRef<boolean | null>(null);

  /** Apply a preset as the new orbit target, keeping rotation along the shortest path. */
  const applyPreset = (mode: CameraMode, yawOverride?: number, distOverride?: number) => {
    const preset = ORBIT_PRESETS[mode];
    const cur = currentRef.current;
    cur.yaw = wrapAngle(cur.yaw);
    const t = targetRef.current;
    Object.assign(t, preset);
    t.yaw = nearestEquivalentAngle(cur.yaw, yawOverride ?? preset.yaw);
    if (distOverride !== undefined) t.distance = distOverride;
  };

  // Reset orbit when switching camera modes
  useEffect(() => {
    applyPreset(cameraMode);
  }, [cameraMode]);

  // Frame a focused passenger from the aisle side, facing them
  useEffect(() => {
    if (!focusedCharacterId) {
      applyPreset(useGameStore.getState().cameraMode);
      return;
    }
    const focused = useCharacterStore.getState().characters[focusedCharacterId];
    if (!focused) return;
    const mode = useGameStore.getState().cameraMode;
    if (mode === 'interior') {
      const side = Math.sign(focused.position[0]) || 1;
      applyPreset('interior', Math.PI + side * 0.6, 1.6);
    }
  }, [focusedCharacterId]);

  // Keyboard shortcuts: 1/2/3 switch camera, C recenters, V toggles pointer lock
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const modeMap: Record<string, CameraMode> = {
        Digit1: 'interior',
        Numpad1: 'interior',
        Digit2: 'top-down',
        Numpad2: 'top-down',
        Digit3: 'chase',
        Numpad3: 'chase',
      };

      const nextMode = modeMap[event.code];
      // Digits pick dialogue choices while a story dialogue is open
      if (nextMode && !isStoryDialogueOpen()) {
        useCharacterStore.getState().setFocusedCharacterId(null);
        setCameraMode(nextMode);
        return;
      }

      if (event.code === 'KeyC') {
        applyPreset(useGameStore.getState().cameraMode);
      } else if (event.code === 'KeyV') {
        if (document.pointerLockElement === gl.domElement) {
          document.exitPointerLock();
        } else {
          gl.domElement.requestPointerLock();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setCameraMode, gl.domElement]);

  // Pointer, wheel and touch input
  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = 'none';

    const pointers = new Map<number, { x: number; y: number }>();
    let primaryId: number | null = null;
    let rotating = false;
    let pendingLeftDrag = false;
    let dragStart = { x: 0, y: 0 };
    let lastPinchDist = 0;

    const rotateBy = (dx: number, dy: number) => {
      const { mouseSensitivity, invertCameraY } = useGameStore.getState();
      const speed = CAMERA_INPUT_CONFIG.rotateSpeed * mouseSensitivity;
      const t = targetRef.current;
      t.yaw -= dx * speed;
      t.pitch = THREE.MathUtils.clamp(
        t.pitch + dy * speed * (invertCameraY ? -1 : 1),
        t.minPitch,
        t.maxPitch
      );
    };

    const zoomBy = (factor: number) => {
      const t = targetRef.current;
      t.distance = THREE.MathUtils.clamp(t.distance * factor, t.minDistance, t.maxDistance);
    };

    // After a drag, swallow the click that follows so seats/passengers are not selected
    const swallowClick = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
    };
    const armClickSwallow = () => {
      window.addEventListener('click', swallowClick, { capture: true, once: true });
      window.setTimeout(() => {
        window.removeEventListener('click', swallowClick, { capture: true });
      }, 0);
    };

    const handlePointerDown = (e: PointerEvent) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        // Begin pinch: stop rotating
        rotating = false;
        pendingLeftDrag = false;
        const [a, b] = Array.from(pointers.values());
        lastPinchDist = Math.hypot(a.x - b.x, a.y - b.y);
        return;
      }
      primaryId = e.pointerId;
      dragStart = { x: e.clientX, y: e.clientY };
      if (e.button === 2) {
        rotating = true;
        el.setPointerCapture(e.pointerId);
      } else if (e.button === 0) {
        pendingLeftDrag = true;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      // Pointer-lock free look: every mouse move rotates
      if (document.pointerLockElement === el) {
        rotateBy(e.movementX, e.movementY);
        cameraRig.isRotating = true;
        return;
      }

      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      prev.x = e.clientX;
      prev.y = e.clientY;

      if (pointers.size === 2) {
        const [a, b] = Array.from(pointers.values());
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (lastPinchDist > 0 && dist > 0) zoomBy(lastPinchDist / dist);
        lastPinchDist = dist;
        return;
      }

      if (e.pointerId !== primaryId) return;

      if (pendingLeftDrag) {
        const moved = Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y);
        if (moved >= CAMERA_INPUT_CONFIG.dragThresholdPx) {
          pendingLeftDrag = false;
          rotating = true;
          el.setPointerCapture(e.pointerId);
        }
      }

      if (rotating) {
        rotateBy(dx, dy);
        cameraRig.isRotating = true;
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (e.pointerId === primaryId) {
        if (rotating) armClickSwallow();
        rotating = false;
        pendingLeftDrag = false;
        primaryId = null;
        cameraRig.isRotating = false;
      }
      if (pointers.size < 2) lastPinchDist = 0;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const notches = THREE.MathUtils.clamp(e.deltaY / 100, -3, 3);
      zoomBy(1 + notches * CAMERA_INPUT_CONFIG.zoomStep);
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    el.addEventListener('pointerdown', handlePointerDown);
    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerup', handlePointerUp);
    el.addEventListener('pointercancel', handlePointerUp);
    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('contextmenu', handleContextMenu);

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown);
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerup', handlePointerUp);
      el.removeEventListener('pointercancel', handlePointerUp);
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('click', swallowClick, { capture: true });
      if (document.pointerLockElement === el) document.exitPointerLock();
    };
  }, [gl.domElement]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const activeMode = useGameStore.getState().cameraMode;
    const preset = CAMERA_PRESETS[activeMode];

    const aspect = size.width / Math.max(1, size.height);
    const isPortrait = aspect < 1.0;

    // Cinematic override (story cutscenes)
    if (cameraRig.cinematic.active) {
      const k = 1 - Math.exp(-3.5 * delta);
      cinePosRef.current.lerp(camPosRef.current.set(...cameraRig.cinematic.position), k);
      cineTargetRef.current.lerp(offsetDirRef.current.set(...cameraRig.cinematic.target), k);
      camera.position.copy(cinePosRef.current);
      camera.lookAt(cineTargetRef.current);
      return;
    }
    cinePosRef.current.copy(camera.position);
    cineTargetRef.current.copy(pivotCurrentRef.current);

    // ---- 1. Resolve pivot for the active mode ----
    const charStore = useCharacterStore.getState();
    const focusedId = charStore.focusedCharacterId;
    const focusedChar = focusedId ? charStore.characters[focusedId] : null;
    const subject = focusedChar ?? charStore.characters[charStore.playerId] ?? null;
    let insideCabin = false;

    // One-shot yaw requests (e.g. face the bus when spawning on the kerb)
    if (cameraRig.pendingYaw !== null) {
      targetRef.current.yaw = nearestEquivalentAngle(currentRef.current.yaw, cameraRig.pendingYaw);
      cameraRig.pendingYaw = null;
    }

    if (activeMode === 'interior') {
      if (subject) {
        const headHeight = subject.state === 'sitting' ? 1.12 : 1.5;
        const isOutside = subject.position[0] > 1.35;
        insideCabin = !isOutside;
        // Pull back for a third-person view on the pavement, tuck in again inside the cabin
        if (wasOutsideRef.current !== isOutside) {
          const t = targetRef.current;
          if (isOutside) t.distance = Math.max(t.distance, CAMERA_INPUT_CONFIG.outdoorDistance);
          else if (wasOutsideRef.current !== null) t.distance = Math.min(t.distance, ORBIT_PRESETS.interior.distance);
          wasOutsideRef.current = isOutside;
        }
        pivotDesiredRef.current.set(
          subject.position[0] + (isOutside ? 0 : busLiveOffset.xSway),
          subject.position[1] + headHeight + (isOutside ? 0 : busLiveOffset.y * 0.85),
          subject.position[2]
        );
      } else {
        insideCabin = true;
        pivotDesiredRef.current.set(busLiveOffset.xSway, 2.0, 3.5);
      }
    } else if (activeMode === 'top-down') {
      if (focusedChar) {
        pivotDesiredRef.current.set(focusedChar.position[0] * 0.5, 1.2, focusedChar.position[2]);
      } else {
        pivotDesiredRef.current.set(busLiveOffset.xSway * 0.3, 1.2, -0.3);
      }
    } else {
      // Look ahead of the bus so the road in front stays in frame
      pivotDesiredRef.current.set(busLiveOffset.xSway * 0.5, 1.8 + busLiveOffset.y * 0.3, -8);
    }

    // ---- 2. Damp orbit values ----
    const rotK = 1 - Math.exp(-CAMERA_INPUT_CONFIG.rotationDamping * delta);
    const zoomK = 1 - Math.exp(-CAMERA_INPUT_CONFIG.zoomDamping * delta);
    const pivotK = 1 - Math.exp(-CAMERA_INPUT_CONFIG.pivotDamping * delta);

    const cur = currentRef.current;
    const tgt = targetRef.current;
    cur.yaw += (tgt.yaw - cur.yaw) * rotK;
    cur.pitch += (tgt.pitch - cur.pitch) * rotK;
    cur.distance += (tgt.distance - cur.distance) * zoomK;
    pivotCurrentRef.current.lerp(pivotDesiredRef.current, pivotK);

    cameraRig.yaw = cur.yaw;
    cameraRig.pitch = cur.pitch;

    // ---- 3. Spherical offset → camera position ----
    const cosP = Math.cos(cur.pitch);
    const dir = offsetDirRef.current.set(
      Math.sin(cur.yaw) * cosP,
      Math.sin(cur.pitch),
      Math.cos(cur.yaw) * cosP
    );

    let dist = cur.distance * (isPortrait && activeMode !== 'interior' ? 1.25 : 1);
    if (insideCabin) {
      dist = clampRayToBox(pivotCurrentRef.current, dir, dist, CAMERA_INPUT_CONFIG.cabinClamp);
    }

    const camPos = camPosRef.current.copy(pivotCurrentRef.current).addScaledVector(dir, dist);
    // Never go below the ground plane
    if (camPos.y < 0.35) camPos.y = 0.35;

    camera.position.copy(camPos);
    camera.lookAt(pivotCurrentRef.current);

    // ---- 4. Portrait FOV compensation ----
    if (camera instanceof THREE.PerspectiveCamera) {
      const targetFov = isPortrait
        ? THREE.MathUtils.clamp(preset.fov / (aspect * 1.12), preset.fov, 84)
        : preset.fov;

      if (Math.abs(camera.fov - targetFov) > 0.05) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, zoomK);
        camera.updateProjectionMatrix();
      }
    }
  });

  return null;
};
