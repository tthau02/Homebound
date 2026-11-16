/**
 * Shared, mutable camera rig state. Mutated by CameraManager input handlers and read
 * inside other useFrame loops (e.g. camera-relative WASD in CharacterController)
 * without causing React re-renders.
 */
export const cameraRig = {
  /** Current (damped) yaw in radians, unbounded. */
  yaw: 0,
  /** Current (damped) pitch in radians. */
  pitch: 0,
  /** Whether the user is actively dragging the camera this frame. */
  isRotating: false,
  /**
   * One-shot request to swing the orbit to this yaw (radians). CameraManager consumes it
   * and resets it to null. Used to frame the bus when the player spawns on the kerb.
   */
  pendingYaw: null as number | null,
  /**
   * Optional cinematic override (used by story cutscenes). When active, the camera
   * damps toward `position` while looking at `target`, ignoring orbit input.
   */
  cinematic: {
    active: false,
    position: [0, 0, 0] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
  },
};

/** Rotate a local movement input (x = right, z = back) into world space using camera yaw. */
export function rotateInputByCameraYaw(
  inputX: number,
  inputZ: number,
  out: { x: number; z: number }
): void {
  const c = Math.cos(cameraRig.yaw);
  const s = Math.sin(cameraRig.yaw);
  out.x = inputX * c + inputZ * s;
  out.z = -inputX * s + inputZ * c;
}
