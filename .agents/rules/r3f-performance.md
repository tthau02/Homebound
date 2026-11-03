# React Three Fiber (R3F) & Three.js Performance Rules

1. **Draw Call & Geometry Optimization**:
   - Target 50–60 FPS on mid-range desktop Chrome.
   - Use `<instancedMesh>` for any roadside or interior element repeated more than 8 times with identical geometry and material.
2. **Zero Garbage Collection Spikes**:
   - Never instantiate `THREE.Vector3`, `THREE.Euler`, `THREE.Quaternion`, `THREE.Matrix4`, or `THREE.Color` inside `useFrame`.
   - Store working vectors in `useRef` and mutate them with `.set()`, `.copy()`, and `.lerp()`.
3. **Smooth Camera Transitions**:
   - Camera transitions between `interior` (Key 1), `top-down` (Key 2), and `chase` (Key 3) must use exponential damping (`1 - Math.exp(-lambda * delta)`) in `CameraManager.tsx` to complete smoothly within `0.4–0.8s` without camera clipping or screen flicker.
4. **Parallax Depth**:
   - Roadside objects must scale their Z-axis movement speed by lateral distance (`speedFactor < 1.0` for midground houses/paddies and `~0.28` for distant mountains) to preserve realistic depth perception.

