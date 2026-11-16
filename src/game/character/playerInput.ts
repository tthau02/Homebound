/**
 * Mutable analog movement input written by the on-screen joystick and read by
 * CharacterController inside useFrame (no React re-renders at 60 FPS).
 * Axes are camera-relative: x > 0 is right, z > 0 is toward the camera (backwards).
 * The vector length is 0..1; pushing the stick to its rim (> 0.92) jogs.
 */
export const playerInput = {
  moveX: 0,
  moveZ: 0,
};

export function clearPlayerInput(): void {
  playerInput.moveX = 0;
  playerInput.moveZ = 0;
}
