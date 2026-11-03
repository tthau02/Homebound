---
name: r3f-3d-modeling
description: >-
  Guide and workflow for creating, modifying, or replacing 3D bus components
  (BusExterior, BusInterior, BusSeat, DriverCabin, BusWheels) and integrating
  Blender GLB/GLTF models in React Three Fiber. Use this skill whenever the user
  asks to customize the bus appearance, add interior details, add passenger
  models, or import 3D assets.
---

# R3F 3D Bus Modeling & Asset Integration Skill

Follow this workflow when adding or modifying 3D models on the Virtual Bus.

## 1. Coordinate & Dimension Reference

Before placing any mesh, consult:
- [`src/game/config/busConfig.ts`](../../../src/game/config/busConfig.ts) for canonical constants (`BUS_DIMENSIONS`, `BUS_COLORS`, `SEAT_ROWS_Z`, `SEAT_COLUMNS_X`).
- [references/bus-coordinates.md](./references/bus-coordinates.md) for the exact bounding boxes of the chassis, cabin floor, windows, aisle, and roof.

## 2. Step-by-Step Procedure

1. **Determine Target Subcomponent**:
   - Exterior body, bumpers, windows, doors, or headlights/taillights → [`src/game/bus/BusExterior.tsx`](../../../src/game/bus/BusExterior.tsx)
   - Cabin floor, central aisle, red ceiling, handrails, or dome lights → [`src/game/bus/BusInterior.tsx`](../../../src/game/bus/BusInterior.tsx)
   - Individual seat or seated passenger figure → [`src/game/bus/BusSeat.tsx`](../../../src/game/bus/BusSeat.tsx)
   - Cockpit dashboard, steering wheel, or driver figure → [`src/game/bus/DriverCabin.tsx`](../../../src/game/bus/DriverCabin.tsx)
   - Tires, rims, or axles → [`src/game/bus/BusWheels.tsx`](../../../src/game/bus/BusWheels.tsx)

2. **Enforce Cutaway Mode (`cutawayRoof`)**:
   - Any mesh placed above `y = 2.45` (ceiling panels, roof AC pods, overhead luggage racks, upper cant rails) **MUST** be wrapped in a `<group visible={!cutawayRoof}>` so Camera 2 (`top-down`) remains unobstructed.

3. **Prevent Overlapping Geometry (Z-Fighting)**:
   - Offset thin surface layers (such as livery stripes, aisle carpets, LED strips, or license plates) by at least `0.004m–0.015m` from their parent surface.

4. **Replacing Primitives with Blender `.glb` Assets (When Available)**:
   - Place `.glb` files in `public/models/`.
   - Load with `useGLTF('/models/bus.glb')` from `@react-three/drei` inside a `<Suspense>` boundary.
   - Keep `BusSuspendedBody` and `BusWheels` in separate groups so `useBusAnimation` continues to animate suspension bounce and wheel rotation independently.

## 3. Validation Steps

1. Run `npm run lint` to ensure all R3F JSX props (`args`, `position`, `rotation`, material properties) pass TypeScript checks.
2. Verify that switching to Camera 2 (`top-down`) cleanly hides any new overhead geometry via `cutawayRoof`.
3. Verify that switching to Night mode properly illuminates new interior or exterior materials.

