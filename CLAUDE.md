# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server (http://localhost:5173)
- `npm run lint` — type-check only (`tsconfig.app.json` + `tsconfig.node.json`); there is no ESLint
- `npm run build` — `tsc -b && vite build` (tsconfig has `noUnusedLocals`/`noUnusedParameters`, so unused vars fail the build)
- `npm run preview` — serve the production build

There is no test runner. URL params help when checking visuals: `?camera=chase|top-down|interior&time=day|night&quality=low|medium|high` (read once at store creation in `useGameStore`; defaults are `interior`/`day`/`high`). "Tests" are an in-app self-test suite (`src/services/productionSelfTestSuite.ts`, `runProductionSelfTests()`) surfaced through the Diagnostics / LiveOps HUD modals. CI (`.github/workflows/frontend-ci.yml`) runs `npm ci`, lint and build on Node 20.

To try multiplayer locally, log in with demo accounts in two tabs/browsers and join the same room code; nothing else needs to run.

`AGENTS.md` requires running `npm run lint` after any code change and `npm run build` before finishing a task. The root `AGENTS.md` and `src/game/AGENTS.md` hold the mandatory 3D rules (coordinate system, `useFrame` discipline, cutaway roof, instancing) — read them before touching `src/game/`. Key points: forward is `-Z`, scenery moves `+Z`; no allocations in `useFrame`; clamp `delta` to 0.1; read Zustand via `getState()` in frames; roof/overhead geometry must honor `cutawayRoof`; one `<Canvas>`/`GameWorld` shared by all three cameras.

## Architecture

Frontend-only app (React 18 + R3F + Zustand + Tailwind); **no backend**. Docs/UI text are largely Vietnamese.

### Shared package
`packages/shared/src/index.ts` is imported as `@virtual-bus/shared` (aliased in both `vite.config.ts` and `tsconfig.app.json`, not a real workspace install). It holds cross-module types, `DEFAULT_ROUTES`, `VALID_SEAT_IDS`, `SERVER_CABIN_BOUNDS` and other constants used by both stores and the network layer.

### Multiplayer (P2P, host-authoritative)
- `src/services/p2pBusNetwork.ts` (~2k lines, singleton `p2pBusNetwork`) does everything network-related: demo accounts (localStorage), PeerJS/WebRTC signaling, BroadcastChannel for same-browser tabs, and the `P2PPacket` union protocol. One peer is **host** and owns room state (journey, stops, weather, seat/wallet validation, moderation reports); others send actions and receive snapshots. Host leaving ends the room.
- It talks to the app through `P2PCallbacks`, wired into `src/stores/useMultiplayerStore.ts`, which in turn feeds the other stores. When adding a multiplayer feature, extend `P2PPacket`, handle it in both host and client paths in the service, and expose it via the multiplayer store.
- Friends, blocks, profiles, coins and inventory live in localStorage per browser; the host is not a security authority (see README caveats).

### State (Zustand, `src/stores/`)
Persistence is hand-rolled localStorage (no Zustand `persist` middleware) under versioned `virtual_bus_*_v1` keys (story, economy ledger, live-ops, P2P accounts/rooms, per-user friends/blocks); bump or migrate the key when changing a persisted shape.

Separate stores per domain: `useGameStore` (camera, time of day, graphics quality, speed, mouse sensitivity), `useStoryStore` (chapter progress), `useHudStore` (Esc menu), `useCharacterStore`, `useSeatStore`, `useChatStore`, `useInteractionStore`, `useJourneyStore` (route/stop state machine, stop-walking mode), `useEconomyLedgerStore` (wallet/shop/inventory, idempotent transactions), `useLiveOpsStore`, `useTelemetryStore`, `useMultiplayerStore`. Remote state must be applied through these stores so the 3D scene and HUD stay consistent.

Two route sources exist: the offline single-player journey (Bình Lục → BX Mỹ Đình) has its stops defined inside `useJourneyStore`, and the biome timeline, landmarks and story chapter are keyed to that route's km; multiplayer rooms use `DEFAULT_ROUTES` from the shared package. The README's feature list still names older sample routes.

### 3D scene (`src/game/`)
`core/GameCanvas` → `core/GameWorld` composes bus, characters, seats, environment, camera; `core/PostEffects` applies per-quality renderer settings and the post-processing stack (`QUALITY_PROFILES` in `environmentConfig.ts`). Folder-per-concern layout (bus, character, seat, camera, environment, chat, animation, config) is described in `AGENTS.md`; tunables (dimensions, seat coordinates, camera presets, environment loop bounds) live in `src/game/config/*`. Bus, characters and seats are driven by store state both for the local player and for remote players.

- **Camera**: `CameraManager` is a spherical orbit (unbounded yaw) per mode; `camera/cameraRig.ts` exposes yaw for camera-relative WASD and a `cinematic` override used by story cutscenes.
- **Scenery**: `environment/scenery/RouteScenery` streams 100 m chunks generated from a seed + the biome at the current route km (`config/biomeConfig.ts`); landmarks spawn on the horizon near their km. Offline route km advances much faster than visual metres (`KM_PER_REAL_SECOND` in `useJourneyStore`), so biomes change every ~minute. No binary assets: textures come from `materials/proceduralTextures.ts`. Chunks are seeded from local travelled distance, so peers do not see identical scenery — don't build synced gameplay on scenery positions. Keep x ≥ 13 on the +X side clear for the station platform.
- **Characters**: `CharacterModel` is a procedural toon rig; appearance comes from optional `bodyType`/`hairStyle`/`accessories` on `CharacterData` (else derived from id). Keep joint positions compatible with `AnimationController` seat poses.

### Story (`src/game/story/`)
Data-driven chapters (`chapter1.ts`: dialogues, objectives, beats, endings) run by `storyEngine.ts`, driven every 300 ms by the headless `StoryDirector` (mounted in `App`; active only when the story is enabled and `useMultiplayerStore.isOnlineMode` is false — there are no story packets in the P2P protocol). The chapter resets when a completed journey restarts. While a dialogue is open (`isStoryDialogueOpen()`), gameplay keys (WASD, Space, E, 1–3) must be ignored. Talking to an NPC targeted by a `talk` objective opens its dialogue instead of the passenger menu. Rewards go through `useEconomyLedgerStore.grantReward` with a one-time idempotency key.

### UI (`src/components/`)
`hud/GameHud.tsx` lays out a minimal HUD (TopBar with route progress, TripStatus, ActionDock, ObjectiveTracker/StoryDialog) and mounts the feature modals; `GameMenu` (Esc) hosts settings natively and launches the modals (lobby, social hub, economy, guide, live-ops, diagnostics). Use primitives in `components/ui/primitives.tsx` and the `ink`/`accent` Tailwind tokens; minimum text size is `text-xs`, no gradient text or ping badges, and new feature screens go into the Esc `GameMenu` rather than new always-visible panels. Build-time flags and version are in `src/config/featureFlags.ts`; release notes in `src/config/releaseNotes.ts`. A version bump touches `package.json`, `APP_VERSION`, `releaseNotes.ts` and `docs/RELEASE_NOTES.md`.

### Docs
`docs/PHASE_4…PHASE_9_*.md` record scope and known limitations per development phase; check them before reworking social, economy, or launch features. Section 7 of `PHASE_9_Visual_and_Experience_Overhaul.md` lists what the 0.4.0 visual/story overhaul shipped versus what is still planned (GLTF bus and characters, photo textures, road curvature, character creator, story over P2P) — the earlier sections of that doc are the original plan, not the current state. `.agents/` contains additional agent rules/skills (R3F performance, coding standards, bus coordinates).
