# 3D Game Engine Rules (`src/game/AGENTS.md`)

These rules apply to all files inside `src/game/`:

## 1. Scene Graph & Cutaway Discipline
- `GameWorld.tsx` is the single source of truth for the 3D world.
- `BusModel.tsx` separates `BusSuspendedBody` (which receives suspension bounce/roll/pitch from `useBusAnimation`) from `BusWheels` (which stay planted on `y = wheelRadius` and spin around `X`).
- Both `BusExterior` and `BusInterior` receive `cutawayRoof: boolean`. Any mesh above `y = 2.45` that could block the overhead view MUST be placed inside a group with `visible={!cutawayRoof}`.

## 2. `useFrame` & Memory Discipline
- Clamp `rawDelta`: `const delta = Math.min(rawDelta, 0.1);` to prevent physics/scenery teleportation when the browser tab regains focus.
- Pre-allocate `THREE.Vector3` and `THREE.Object3D` in `useRef` (e.g., `dummyRef = useRef(new THREE.Object3D())`).
- When updating an `<instancedMesh>`, set `meshRef.current.instanceMatrix.needsUpdate = true` only once after the loop completes.

## 3. Lighting & Shadow Budget
- Do not attach `castShadow` to small decorative meshes or every instance of distant scenery.
- Use pooled `<pointLight>` instances (like in `StreetLights.tsx` and `BusInterior.tsx`) rather than spawning dozens of dynamic lights.
- Respect `graphicsQuality` (`low` | `medium` | `high`) from `useGameStore` when configuring shadow map resolutions or particle counts.

