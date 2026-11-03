# TypeScript & React Coding Standards

1. **Strict TypeScript**:
   - Do not use `any` or `@ts-ignore`. Define explicit interfaces/types in component files or `src/stores/useGameStore.ts`.
   - Use `as const` for static configuration objects in `src/game/config/`.
2. **Component Modularity**:
   - Keep `src/app/App.tsx` minimal (only layout composition of `GameCanvas` and `GameHud`).
   - Separate 3D R3F components (`src/game/`) from 2D HTML/Tailwind HUD components (`src/components/`).
   - Never render raw HTML inside `<Canvas>` unless using `@react-three/drei`'s `<Html>` explicitly, and never render R3F meshes outside `<Canvas>`.
3. **Zustand Store Usage**:
   - In React UI components (`src/components/hud/`), subscribe to individual slices (`useGameStore((s) => s.cameraMode)`) to avoid unnecessary re-renders.
   - In R3F `useFrame` loops, use `useGameStore.getState()` for synchronous zero-overhead reads.
4. **HUD Overlay Interaction**:
   - The root HUD container (`GameHud.tsx`) must maintain `pointer-events-none` so pointer drag events reach the 3D canvas, while interactive HUD cards/buttons use `pointer-events-auto`.

