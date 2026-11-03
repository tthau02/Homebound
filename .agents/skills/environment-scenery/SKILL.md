---
name: environment-scenery
description: >-
  Procedure for adding or customizing moving roadside scenery, Vietnamese
  countryside landmarks, rest stops, and Day/Night lighting effects using
  InstancedMesh and multi-layer parallax. Use this skill when expanding the
  external world, adding traffic, or tuning environmental lighting.
---

# Environment Scenery & Parallax Optimization Skill

Use this workflow when adding new roadside objects, landmarks, or lighting to `src/game/environment/`.

## 1. Key Files

- Environment & Lighting Config: [`src/game/config/environmentConfig.ts`](../../../src/game/config/environmentConfig.ts)
- Road & Lane Markings: [`src/game/environment/RoadSystem.tsx`](../../../src/game/environment/RoadSystem.tsx)
- Highway Street Lamps: [`src/game/environment/StreetLights.tsx`](../../../src/game/environment/StreetLights.tsx)
- Countryside Scenery & Rest Stop: [`src/game/environment/CountrysideScenery.tsx`](../../../src/game/environment/CountrysideScenery.tsx)
- Sky, Fog & Celestial Lighting: [`src/game/environment/SkyAndLighting.tsx`](../../../src/game/environment/SkyAndLighting.tsx)

## 2. Step-by-Step Procedure for Adding Scenery

1. **Choose the Appropriate Depth Layer & Speed Factor**:
   - **Road & Immediate Curb (`|x| = 4.6m–7.0m`)**: `speedFactor = 1.0` (moves at exact road speed `speedMs * delta` toward `+Z`).
   - **Near Roadside (`|x| = 7.5m–15m`)**: `speedFactor = 0.92–0.97` (trees, utility poles).
   - **Midground Countryside (`|x| = 15m–45m`)**: `speedFactor = 0.75–0.90` (rural houses, rice paddy plots, rest stops).
   - **Far Horizon (`|x| > 60m`)**: `speedFactor = 0.25–0.32` (distant mountains, horizon silhouettes).

2. **Use `<instancedMesh>` for Repeated Objects**:
   - Store per-instance data (`x`, `z`, `scale`, `speedFactor`) in a `useRef` array initialized in `useMemo`.
   - Reuse a single `dummyRef = useRef(new THREE.Object3D())` inside `useFrame` to update each instance matrix:
     ```ts
     item.z += baseDz * item.speedFactor;
     if (item.z > ENVIRONMENT_CONFIG.zMax) {
       item.z -= ENVIRONMENT_CONFIG.loopSpan;
     }
     ```
   - Set `meshRef.current.instanceMatrix.needsUpdate = true` once after the loop.

3. **Support Both Day & Night Modes**:
   - Read `timeOfDay` from `useGameStore`.
   - For buildings, signs, or lamps, configure `emissive` and `emissiveIntensity` so windows and signboards glow warmly at night.

## 3. Validation Steps

1. Run `npm run lint` and `npm run build`.
2. Check that new scenery wraps seamlessly from `zMax (+40)` back to `zMin (-160)` without popping inside the Rear Chase Camera frustum.

