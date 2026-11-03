---
name: quality-assurance
description: >-
  Standard verification, TypeScript linting, production build, and runtime
  performance audit workflow for Virtual Bus 3D. Use this skill after completing
  any coding task or when the user asks to test, debug, optimize, or audit the
  project.
---

# Quality Assurance & Performance Audit Skill

Run this verification checklist before marking any feature or bugfix complete.

## 1. Automated Build & Type Checks

1. **TypeScript Strict Check**:
   ```bash
   npm run lint
   ```
   Must exit with code `0` and zero diagnostics.

2. **Production Bundle Verification**:
   ```bash
   npm run build
   ```
   Must compile both `tsc -b` and `vite build` cleanly with chunks properly split (`three`, `r3f`, `vendor`).

## 2. 3D Scene & Runtime Audit Checklist

Inspect all modified files in `src/game/` against these criteria:

- [ ] **No Per-Frame Allocations**: Search `useFrame` callbacks to ensure zero occurrences of `new THREE.` or array `.map()` / `.filter()` allocations inside the render loop.
- [ ] **Delta Time Clamping**: Every `useFrame` uses `Math.min(rawDelta, 0.1)` and respects `useGameStore.getState().isPaused`.
- [ ] **Cutaway Integrity**: Switching to `top-down` camera (`Key 2`) hides the bus roof and ceiling (`cutawayRoof === true`) so all 28 seats and passengers are clearly visible.
- [ ] **Event Listener Cleanup**: Every `addEventListener` in `useEffect` has a matching `removeEventListener` in its cleanup return function.
- [ ] **Day/Night Parity**: Materials and lights look balanced in both `day` and `night` modes, and `graphicsQuality` (`low` / `medium` / `high`) scales DPR and shadows properly.

