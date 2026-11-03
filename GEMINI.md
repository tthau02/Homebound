# Virtual Bus 3D — Gemini / Antigravity Workspace Rules

This project uses the Antigravity Customization System (`.agents/`) and hierarchical rules (`AGENTS.md`).

## Core Directives

1. Read and follow all architectural, coordinate, and performance rules in [AGENTS.md](./AGENTS.md).
2. When working inside `src/game/`, adhere to the 3D scene graph and `useFrame` rules in [src/game/AGENTS.md](./src/game/AGENTS.md).
3. Activate specialized workspace skills in `.agents/skills/` when performing 3D modeling, camera/animation updates, environment expansion, or QA checks:
   - `r3f-3d-modeling`: Creating/editing bus components or integrating `.glb` assets.
   - `camera-and-animation`: Modifying camera presets, transitions, or delta-time animations.
   - `environment-scenery`: Adding roadside Vietnamese scenery with `InstancedMesh` and parallax.
   - `quality-assurance`: Running TypeScript, build, and acceptance verification.
4. Always run `npm run lint` and `npm run build` after code changes to verify zero TypeScript and bundle errors.

