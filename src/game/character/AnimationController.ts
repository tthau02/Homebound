import * as THREE from 'three';
import { CharacterAnimationType } from './characterTypes';
import { RIG } from './characterAssets';

export interface CharacterRigRefs {
  pelvis: THREE.Group | null;
  torso: THREE.Group | null;
  head: THREE.Group | null;
  leftArm: THREE.Group | null;
  rightArm: THREE.Group | null;
  leftForearm: THREE.Group | null;
  rightForearm: THREE.Group | null;
  leftThigh: THREE.Group | null;
  leftCalf: THREE.Group | null;
  rightThigh: THREE.Group | null;
  rightCalf: THREE.Group | null;
  leftFoot: THREE.Group | null;
  rightFoot: THREE.Group | null;
}

export function createRigRefs(): CharacterRigRefs {
  return {
    pelvis: null,
    torso: null,
    head: null,
    leftArm: null,
    rightArm: null,
    leftForearm: null,
    rightForearm: null,
    leftThigh: null,
    leftCalf: null,
    rightThigh: null,
    rightCalf: null,
    leftFoot: null,
    rightFoot: null,
  };
}

/**
 * Locomotion state of one character, advanced by its owner from the distance it actually
 * covered (so feet never slide): `phase` grows by 2π per full stride, `weight` blends
 * between the standing pose (0) and the gait (1), `run` blends walk (0) → jog (1).
 */
export interface GaitState {
  phase: number;
  weight: number;
  run: number;
}

const NO_GAIT: GaitState = { phase: 0, weight: 0, run: 0 };

/** Metres covered per full gait cycle (two steps). */
export const STRIDE_WALK_M = 1.35;
export const STRIDE_RUN_M = 2.3;

/** Advance a gait from the horizontal speed (m/s) measured this frame. */
export function advanceGait(gait: GaitState, speed: number, delta: number): void {
  const targetWeight = THREE.MathUtils.clamp((speed - 0.08) / 0.5, 0, 1);
  const targetRun = THREE.MathUtils.clamp((speed - 2.1) / 1.0, 0, 1);
  const k = 1 - Math.exp(-9 * delta);
  gait.weight += (targetWeight - gait.weight) * k;
  gait.run += (targetRun - gait.run) * k;
  const stride = THREE.MathUtils.lerp(STRIDE_WALK_M, STRIDE_RUN_M, gait.run);
  // Keep the legs cycling slowly while blending out so the stop does not freeze mid-step
  const cadenceSpeed = Math.max(speed, gait.weight * 0.5);
  gait.phase = (gait.phase + (cadenceSpeed / stride) * Math.PI * 2 * delta) % (Math.PI * 2);
}

const HALF_PI = Math.PI / 2;
const SEATED_THIGH = HALF_PI - 0.1;
const SEATED_KNEE = -(HALF_PI - 0.1) + 0.3;
const SEATED_FOOT = -0.3;
/** Pelvis below this height means the rig is (still) in a seated posture. */
const SEATED_PELVIS_THRESHOLD = (RIG.standPelvisY + RIG.sitPelvisY) / 2;

const lerp = THREE.MathUtils.lerp;

/**
 * Frame-rate independent procedural animation for the 15-joint character rig.
 * Base poses: Idle, Sitting, Standing, Talking, Waving, Laughing, Nodding, Clapping, Sleeping.
 * Locomotion is layered on top through `gait`, whatever the base pose is.
 *
 * Sign conventions (rotation.x): thigh / upper arm > 0 swings forward (-Z), knee < 0 bends,
 * forearm > 0 bends the elbow, torso > 0 leans back.
 */
export function updateCharacterProceduralRig(
  rig: CharacterRigRefs,
  animation: CharacterAnimationType,
  clockTime: number,
  delta: number,
  seedOffset: number,
  /** Extra head yaw (radians) used to glance at a nearby character. */
  lookYaw = 0,
  gait: GaitState = NO_GAIT
): void {
  const {
    pelvis,
    torso,
    head,
    leftArm,
    rightArm,
    leftForearm,
    rightForearm,
    leftThigh,
    leftCalf,
    rightThigh,
    rightCalf,
    leftFoot,
    rightFoot,
  } = rig;

  if (
    !pelvis ||
    !torso ||
    !head ||
    !leftArm ||
    !rightArm ||
    !leftForearm ||
    !rightForearm ||
    !leftThigh ||
    !leftCalf ||
    !rightThigh ||
    !rightCalf ||
    !leftFoot ||
    !rightFoot
  ) {
    return;
  }

  const t = clockTime + seedOffset;

  // ---- Base pose (standing, relaxed) ----
  const breath = Math.sin(t * 1.6);
  const sway = Math.sin(t * 0.37 + seedOffset);
  let pelvisY: number = RIG.standPelvisY;
  let pelvisX = sway * 0.012;
  let pelvisZ = 0;
  let pelvisRotY = 0;
  let pelvisRotZ = sway * 0.018;

  let torsoRotX = breath * 0.01;
  let torsoRotY = 0;
  let torsoRotZ = -sway * 0.02;

  let headRotX = 0;
  let headRotY = Math.sin(t * 0.47) * 0.16;
  let headRotZ = 0;

  let lArmRotX = 0.02;
  let lArmRotZ = -0.09 - breath * 0.008;
  let rArmRotX = 0.02;
  let rArmRotZ = 0.09 + breath * 0.008;
  let lElbow = 0.16;
  let rElbow = 0.16;

  let lThighRotX = 0.03 + sway * 0.015;
  let rThighRotX = 0.03 - sway * 0.015;
  let lKnee = -0.05;
  let rKnee = -0.05;
  let lFootRot = 0.02;
  let rFootRot = 0.02;

  const isSeatedPose =
    animation === 'Sitting' ||
    animation === 'Sleeping' ||
    // Keep seated posture if character is sitting while performing upper-body emotes
    (animation !== 'Standing' && animation !== 'Idle' && animation !== 'Walking' && pelvis.position.y < SEATED_PELVIS_THRESHOLD);

  if (isSeatedPose) {
    pelvisY = RIG.sitPelvisY;
    pelvisX = 0;
    pelvisZ = 0.02;
    pelvisRotZ = 0;
    torsoRotX = 0.12 + breath * 0.012;
    torsoRotZ = 0;
    lThighRotX = SEATED_THIGH;
    rThighRotX = SEATED_THIGH;
    lKnee = SEATED_KNEE;
    rKnee = SEATED_KNEE;
    lFootRot = SEATED_FOOT;
    rFootRot = SEATED_FOOT;
    // Hands resting on the thighs
    lArmRotX = 0.3;
    rArmRotX = 0.3;
    lArmRotZ = 0.08;
    rArmRotZ = -0.08;
    lElbow = 0.85;
    rElbow = 0.85;
  }

  switch (animation) {
    case 'Sitting': {
      // Occasionally gaze out of the window, otherwise drift gently
      headRotY =
        Math.sin(t * 0.23) > 0.55 ? Math.sign(Math.sin(seedOffset)) * 0.55 : Math.sin(t * 0.9) * 0.14;
      headRotX = Math.sin(t * 1.3) * 0.04;
      break;
    }

    case 'Standing': {
      // Rising from the seat: slight crouch, hands pushing off
      pelvisY = RIG.standPelvisY - 0.07;
      torsoRotX = -0.16;
      lThighRotX = 0.3;
      rThighRotX = 0.3;
      lKnee = -0.5;
      rKnee = -0.5;
      lFootRot = 0.2;
      rFootRot = 0.2;
      lArmRotX = 0.3;
      rArmRotX = 0.3;
      break;
    }

    case 'Waving': {
      // Raise the right arm and wave side to side
      rArmRotX = 2.5;
      rArmRotZ = -0.3 + Math.sin(t * 10.0) * 0.3;
      rElbow = 0.35 + Math.sin(t * 10.0 + 0.6) * 0.2;
      headRotY = 0;
      headRotZ = Math.sin(t * 5.0) * 0.07;
      torsoRotZ += 0.04;
      break;
    }

    case 'Talking': {
      headRotX = Math.sin(t * 6.5) * 0.07;
      headRotY = Math.sin(t * 2.8) * 0.16;
      lArmRotX = 0.3 + Math.sin(t * 2.6) * 0.1;
      rArmRotX = 0.34 + Math.cos(t * 2.2) * 0.1;
      lElbow = 1.15 + Math.sin(t * 5.2) * 0.3;
      rElbow = 1.2 + Math.cos(t * 4.6) * 0.32;
      lArmRotZ = 0.1;
      rArmRotZ = -0.1;
      break;
    }

    case 'Laughing': {
      torsoRotX += Math.sin(t * 12.0) * 0.05 + 0.04;
      headRotX = -0.16 + Math.sin(t * 12.0) * 0.08;
      headRotY = 0;
      lArmRotX = 0.4;
      rArmRotX = 0.4;
      lElbow = 1.5 + Math.sin(t * 10.0) * 0.12;
      rElbow = 1.5 + Math.sin(t * 10.0) * 0.12;
      lArmRotZ = 0.22;
      rArmRotZ = -0.22;
      break;
    }

    case 'Nodding': {
      headRotX = Math.sin(t * 8.0) * 0.22 + 0.04;
      headRotY = 0;
      break;
    }

    case 'Clapping': {
      const clap = Math.abs(Math.sin(t * 10.0));
      lArmRotX = 0.75;
      rArmRotX = 0.75;
      lElbow = 1.25;
      rElbow = 1.25;
      lArmRotZ = 0.12 + clap * 0.26;
      rArmRotZ = -0.12 - clap * 0.26;
      headRotX = Math.sin(t * 5.0) * 0.05;
      headRotY = 0;
      break;
    }

    case 'Sleeping': {
      torsoRotX = (isSeatedPose ? 0.17 : 0.02) + Math.sin(t * 1.2) * 0.02;
      headRotX = -0.3;
      headRotY = 0;
      headRotZ = 0.24;
      break;
    }

    default:
      break;
  }

  // ---- Locomotion layer ----
  const w = isSeatedPose ? 0 : gait.weight;
  if (w > 0.001) {
    const run = gait.run;
    const s = Math.sin(gait.phase);
    const c = Math.cos(gait.phase);
    const swing = lerp(0.46, 0.8, run);
    const kneeLift = lerp(0.95, 1.55, run);
    const lean = lerp(0.05, 0.2, run);

    // Left leg leads at sin > 0; knees fold during the forward swing, straight at heel strike
    const wLThigh = swing * s + 0.07 + run * 0.12;
    const wRThigh = -swing * s + 0.07 + run * 0.12;
    const wLKnee = -(0.07 + kneeLift * Math.max(0, Math.cos(gait.phase + 0.5)));
    const wRKnee = -(0.07 + kneeLift * Math.max(0, -Math.cos(gait.phase + 0.5)));
    const wLFoot = THREE.MathUtils.clamp(-(wLThigh + wLKnee) * 0.6, -0.55, 0.6);
    const wRFoot = THREE.MathUtils.clamp(-(wRThigh + wRKnee) * 0.6, -0.55, 0.6);

    pelvisY = lerp(pelvisY, RIG.standPelvisY - (0.02 + 0.03 * run) - (0.022 + 0.02 * run) * s * s, w);
    pelvisX = lerp(pelvisX, c * 0.016, w);
    pelvisRotY = lerp(pelvisRotY, -0.075 * s, w);
    pelvisRotZ = lerp(pelvisRotZ, c * 0.03, w);
    torsoRotX = lerp(torsoRotX, -lean, w);
    torsoRotY = lerp(torsoRotY, (0.15 + 0.08 * run) * s, w);
    torsoRotZ = lerp(torsoRotZ, -c * 0.025, w);

    lThighRotX = lerp(lThighRotX, wLThigh, w);
    rThighRotX = lerp(rThighRotX, wRThigh, w);
    lKnee = lerp(lKnee, wLKnee, w);
    rKnee = lerp(rKnee, wRKnee, w);
    lFootRot = lerp(lFootRot, wLFoot, w);
    rFootRot = lerp(rFootRot, wRFoot, w);

    // Arms swing opposite to the legs unless an upper-body emote owns them
    const armsFree = animation === 'Walking' || animation === 'Idle' || animation === 'Standing';
    if (armsFree) {
      const armSwing = lerp(0.42, 0.8, run);
      const elbowBase = lerp(0.24, 1.4, run);
      lArmRotX = lerp(lArmRotX, -armSwing * s + 0.04, w);
      rArmRotX = lerp(rArmRotX, armSwing * s + 0.04, w);
      lElbow = lerp(lElbow, elbowBase + 0.28 * Math.max(0, -s), w);
      rElbow = lerp(rElbow, elbowBase + 0.28 * Math.max(0, s), w);
      lArmRotZ = lerp(lArmRotZ, -0.1, w);
      rArmRotZ = lerp(rArmRotZ, 0.1, w);
      headRotY = lerp(headRotY, -0.06 * s, w);
      headRotX = lerp(headRotX, lean * 0.6, w);
    }
  }

  // ---- Smoothly drive every joint toward its target ----
  const k = 1 - Math.exp(-lerp(11, 22, w) * delta);
  const slowK = 1 - Math.exp(-9 * delta);

  pelvis.position.x = lerp(pelvis.position.x, pelvisX, k);
  // Sitting down / standing up eases more slowly than the gait bob
  pelvis.position.y = lerp(pelvis.position.y, pelvisY, w > 0.3 ? k : slowK);
  pelvis.position.z = lerp(pelvis.position.z, pelvisZ, slowK);
  pelvis.rotation.y = lerp(pelvis.rotation.y, pelvisRotY, k);
  pelvis.rotation.z = lerp(pelvis.rotation.z, pelvisRotZ, k);

  torso.rotation.x = lerp(torso.rotation.x, torsoRotX, k);
  torso.rotation.y = lerp(torso.rotation.y, torsoRotY, k);
  torso.rotation.z = lerp(torso.rotation.z, torsoRotZ, k);

  head.rotation.x = lerp(head.rotation.x, headRotX, k);
  // Looking at someone overrides the idle head drift, with a softer blend
  const lookBlend = Math.min(1, Math.abs(lookYaw) * 4);
  const finalHeadYaw = lerp(headRotY, lookYaw, lookBlend);
  head.rotation.y = lerp(head.rotation.y, finalHeadYaw, k * 0.6);
  head.rotation.z = lerp(head.rotation.z, headRotZ, k);

  leftArm.rotation.x = lerp(leftArm.rotation.x, lArmRotX, k);
  leftArm.rotation.z = lerp(leftArm.rotation.z, lArmRotZ, k);
  rightArm.rotation.x = lerp(rightArm.rotation.x, rArmRotX, k);
  rightArm.rotation.z = lerp(rightArm.rotation.z, rArmRotZ, k);
  leftForearm.rotation.x = lerp(leftForearm.rotation.x, lElbow, k);
  rightForearm.rotation.x = lerp(rightForearm.rotation.x, rElbow, k);

  leftThigh.rotation.x = lerp(leftThigh.rotation.x, lThighRotX, k);
  rightThigh.rotation.x = lerp(rightThigh.rotation.x, rThighRotX, k);
  leftCalf.rotation.x = lerp(leftCalf.rotation.x, lKnee, k);
  rightCalf.rotation.x = lerp(rightCalf.rotation.x, rKnee, k);
  leftFoot.rotation.x = lerp(leftFoot.rotation.x, lFootRot, k);
  rightFoot.rotation.x = lerp(rightFoot.rotation.x, rFootRot, k);
}
