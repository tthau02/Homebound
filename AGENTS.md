# Virtual Bus 3D — AI Agent Guidelines (`AGENTS.md`)

Welcome to **Virtual Bus 3D**, an interactive 3D long-distance coach simulation web game built with **React 18**, **TypeScript**, **Three.js**, **@react-three/fiber (R3F)**, **@react-three/drei**, **Zustand**, and **Tailwind CSS**.

All AI coding agents working in this repository MUST follow the architectural, coordinate, and performance rules defined below.

---

## 1. Tech Stack & Commands

- **Framework**: React 18 + Vite 6 + TypeScript (`strict: true`)
- **3D Engine**: `three` + `@react-three/fiber` + `@react-three/drei`
- **State Management**: `zustand` (`src/stores/useGameStore.ts`)
- **Styling & Icons**: Tailwind CSS 3 + `lucide-react`

### Essential Commands

- `npm run dev` — Start Vite development server (`http://localhost:5173`)
- `npm run lint` — Run TypeScript type-checking for app + Vite config (`tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit`)
- `npm run build` — Run full type-check and production build (`tsc -b && vite build`)

> **Mandatory Verification Rule**: After creating or modifying any code file, you MUST run `npm run lint` (and `npm run build` before finishing a task) and fix all TypeScript or build errors before reporting completion.

---

## 2. Project Architecture

Keep modules strictly separated by responsibility:

```text
src/
  app/
    App.tsx                      # Root layout combining GameCanvas & GameHud
  game/
    core/
      GameCanvas.tsx             # R3F <Canvas>, DPR, and Shadow configuration
      GameWorld.tsx              # Unified single 3D scene root
      PostEffects.tsx            # Per-quality renderer settings + post-processing stack
    bus/
      BusModel.tsx               # Root bus container (Suspended Body + Rotating Wheels)
      BusExterior.tsx            # Exterior shell, livery, windows, doors, lights, cutaway roof
      BusInterior.tsx            # Cabin floor, aisle, red ceiling, interior lights, handrails
      BusSeat.tsx                # Interactive leather seat mesh (hover/click delegation)
      DriverCabin.tsx            # Dashboard, gauges, steering wheel, driver figure, partitions
      BusWheels.tsx              # 4 wheel assemblies rotating with vehicle speed
    character/
      characterTypes.ts          # Character, AnimationState, Emote and appearance definitions
      characterAssets.ts         # Shared toon materials/geometries + deterministic appearance
      CharacterModel.tsx         # Stylized articulated rig (blink, talk, look-at) + click/hover events
      AnimationController.ts     # Delta-time procedural skeletal animation controller
      CharacterController.tsx    # WASD/Shift movement, aisle collision bounds, Space/E, seat pathing
      CharacterManager.tsx       # Renders Player + NPCs and triggers ambient NPC behaviors
    seat/
      seatTypes.ts               # SeatData interface (1A-7D)
      SeatManager.tsx            # Manages 28 interactive seats and occupancy tooltips
    chat/
      ChatBubble.tsx             # 3D Billboard chat bubble & emote badge above character heads
    camera/
      CameraManager.tsx          # Spherical-orbit 360° controller (3 modes, zoom, pointer lock, cinematic)
      cameraRig.ts               # Shared mutable camera yaw/pitch + cinematic override
    environment/
      EnvironmentManager.tsx     # Environment root container
      SkyAndLighting.tsx         # Day/Night sky, fog, sun/moon/stars, directional & ambient lights
      RoadSystem.tsx             # Highway surface, shoulders, instanced lane dashes & milestones
      StreetLights.tsx           # Instanced street lamps & pooled night point lights
      scenery/
        RouteScenery.tsx         # Chunk-streamed, biome-driven instanced scenery + ground
        RouteLandmark.tsx        # One-off landmarks (river bridge, toll plaza, gantries, skyline)
        sceneryAssets.ts         # Procedural low-poly asset library (+ wind shader)
        sceneryLive.ts           # Mutable scenery telemetry (traveledM, biome, landmarkNear)
    materials/
      proceduralTextures.ts      # Runtime CanvasTextures (asphalt, grass, dirt, water, signs)
    story/
      storyTypes.ts / chapter1.ts  # Data-driven chapters: dialogues, objectives, beats, endings
      storyEngine.ts             # Story runtime (context, actions, dialogue advance)
      StoryDirector.tsx          # Headless driver mounted in App (offline only)
    animation/
      useBusAnimation.ts         # Delta-time bus suspension & wheel rotation hook
    config/
      busConfig.ts               # Bus dimensions, color palette, seat coordinates, passengers
      cameraConfig.ts            # Camera preset positions, targets, FOV, and cutaway flags
      environmentConfig.ts       # Loop bounds, lighting presets, QUALITY_PROFILES
      biomeConfig.ts             # Biomes, route biome timeline, landmarks, chunk length
  components/
    hud/                         # Minimal HUD (TopBar, TripStatus, ActionDock, StoryHud, GameMenu) + feature modals
    ui/                          # Design-system primitives (Panel, Button, IconButton, Segmented, ToggleRow)
  stores/
    useGameStore.ts              # Global Zustand store
    useStoryStore.ts             # Story progress (objectives, flags, dialogue, journal)
    useHudStore.ts               # HUD menu state
  styles/
    index.css                    # Tailwind CSS entry & base resets
```

---

## 3. 3D Coordinate System Invariants

Every 3D object, camera, and animation MUST respect this right-handed coordinate system:

- **Origin `(0, 0, 0)`**: Asphalt road surface (`y = 0`) directly beneath the center of the bus.
- **Forward Direction (`-Z`)**:
  - Front nose of the bus is at `z = -6.2` (`-BUS_DIMENSIONS.length / 2`).
  - Rear tail of the bus is at `z = +6.2` (`+BUS_DIMENSIONS.length / 2`).
- **Lateral Axis (`X`)**:
  - Left side (Driver side) is `-X` (`x = -1.38`).
  - Right side (Passenger entry door side) is `+X` (`x = +1.38`).
  - Central aisle spans `x ∈ [-0.34, +0.34]`.
- **Vertical Axis (`Y`)**:
  - Road surface: `y = 0`
  - Wheel center: `y = 0.52` (`BUS_DIMENSIONS.wheelRadius`)
  - Cabin floor: `y = 0.72` (`BUS_DIMENSIONS.floorY`)
  - Interior red ceiling: `y = 2.88` (`BUS_DIMENSIONS.ceilingY`)
- **Relative Scenery Motion**:
  - Because the bus travels forward toward `-Z`, all road markings, trees, houses, and street lights move in the **`+Z` direction**.
  - Lane dashes, km posts and street lights loop from `zMin (-160)` to `zMax (+40)` (`loopSpan 200`).
  - Roadside scenery does **not** loop: `RouteScenery` streams `CHUNK_LENGTH` (100 m) chunks generated from a seed and the biome at the current route km. Instances live in one container whose `position.z` follows `sceneryLive.traveledM`; matrices are rebuilt only when the chunk window changes. Keep x ≥ 13 on the right side (+X) free for the station platform.
- **Wheel Rotation**:
  - Wheels rotate around their local X-axis via `wheel.rotation.x -= (speedMs / wheelRadius) * delta`.

---

## 4. Coding & Performance Rules

1. **Single 3D Scene**: All cameras (`interior`, `top-down`, `chase`) MUST observe the same `GameWorld`. Never instantiate multiple `<Canvas>` or duplicate scenes.
2. **Zero Per-Frame Allocations in `useFrame`**:
   - NEVER call `new THREE.Vector3()`, `new THREE.Matrix4()`, `new THREE.Color()`, or `new THREE.Object3D()` inside `useFrame`.
   - Always pre-allocate reusable math objects in `useRef` outside the frame loop.
3. **Frame-Rate Independence**:
   - Always multiply animations and movement by `const delta = Math.min(rawDelta, 0.1)` in `useFrame((_, rawDelta) => ...)`.
4. **Avoid React Re-renders at 60 FPS**:
   - Inside `useFrame`, read Zustand state via `useGameStore.getState()` and mutate Three.js object refs (`meshRef.current.position`, `instanceMatrix`) directly. Do not call `useState` setters on every frame.
5. **Camera & Input**:
   - Camera yaw is shared via `cameraRig`; player movement is camera-relative. While a story dialogue is open (`isStoryDialogueOpen()`), gameplay keys (WASD, Space, E, 1–3) must be ignored.
6. **HUD Design System**:
   - Use `src/components/ui/primitives.tsx` and the `ink`/`accent` Tailwind tokens. Minimum text size is `text-xs` (12px); no gradient text or ping badges. New feature screens go into the Esc `GameMenu`, not as new always-visible panels.
7. **Cutaway Roof Compatibility**:
   - Any upper roof, ceiling, or overhead rack geometry added to the bus MUST respect the `cutawayRoof` prop (`visible={!cutawayRoof}`) so Camera 2 (`top-down`) always has an unobstructed view of the cabin interior.
8. **Use `InstancedMesh` for Repeated Scenery**:
   - Repeated roadside items must use `<instancedMesh>`. Add new roadside assets to `sceneryAssets.ts` and spawn them through biome rules in `biomeConfig.ts`.
9. **TypeScript & Clean Cleanup**:
   - Maintain strict typing (`noExplicitAny`). Always remove `window` / `domElement` event listeners in `useEffect` cleanup functions.

