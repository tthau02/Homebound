---
name: camera-and-animation
description: >-
  Workflow for configuring camera presets, smooth camera transitions, interactive
  pointer look/raycasting, and frame-rate independent delta-time vehicle
  animations. Use this skill when adding new camera angles (such as Passenger
  First-Person Seat View), adjusting camera damping, or modifying bus suspension
  and wheel physics.
---

# Camera & Delta-Time Animation Skill

Use this workflow whenever modifying camera behavior or 3D animations in Virtual Bus.

## 1. Key Files

- Camera Presets & Damping Constants: [`src/game/config/cameraConfig.ts`](../../../src/game/config/cameraConfig.ts)
- Unified Camera Controller: [`src/game/camera/CameraManager.tsx`](../../../src/game/camera/CameraManager.tsx)
- Bus Suspension & Wheel Animation: [`src/game/animation/useBusAnimation.ts`](../../../src/game/animation/useBusAnimation.ts)
- Global State (`cameraMode`, `busSpeedKmh`, `isPaused`): [`src/stores/useGameStore.ts`](../../../src/stores/useGameStore.ts)

## 2. Adding or Updating a Camera Mode

1. **Register the Mode**:
   - Add the new mode key to `CameraMode` union in `src/stores/useGameStore.ts`.
   - Add its preset (`position`, `target`, `fov`, `cutawayRoof`, `keyTrigger`) to `CAMERA_PRESETS` in `src/game/config/cameraConfig.ts`.
2. **Update `CameraManager.tsx`**:
   - Bind its keyboard shortcut inside the `keydown` listener (cleaning up on unmount).
   - Compute `desiredPosRef` and `desiredTargetRef` inside `useFrame` using pre-allocated `THREE.Vector3` refs and `busLiveOffset`.
   - Interpolate with `const dampFactor = 1 - Math.exp(-7.5 * delta)` for a smooth `0.4–0.8s` transition without camera snapping.
3. **Update HUD Selector**:
   - Expose the camera button in [`src/components/hud/TopRightControlPanel.tsx`](../../../src/components/hud/TopRightControlPanel.tsx).

## 3. Writing Frame-Rate Independent Animations

1. Always clamp `rawDelta` at the start of `useFrame`:
   ```ts
   const delta = Math.min(rawDelta, 0.1);
   ```
2. Read store state synchronously via `useGameStore.getState()` and early-return if `state.isPaused` is `true`.
3. Never call `new THREE.Vector3()` inside `useFrame`.

## 4. Validation Steps

1. Run `npm run lint` to confirm all `CameraMode` exhaustive checks pass.
2. Verify that switching between all cameras via keys `1`, `2`, `3` and HUD buttons transitions smoothly without flickering or recreating the scene.

