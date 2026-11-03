import * as THREE from 'three';
import { CharacterAnimationType } from './characterTypes';

export interface CharacterRigRefs {
  pelvis: THREE.Group | null;
  torso: THREE.Group | null;
  head: THREE.Group | null;
  leftArm: THREE.Group | null;
  rightArm: THREE.Group | null;
  leftThigh: THREE.Group | null;
  leftCalf: THREE.Group | null;
  rightThigh: THREE.Group | null;
  rightCalf: THREE.Group | null;
}

/**
 * Frame-rate independent procedural animation controller for 3D character rigs.
 * Supports: Idle, Walking, Sitting, Standing, Talking, Waving, Laughing, Nodding, Clapping, Sleeping.
 */
export function updateCharacterProceduralRig(
  rig: CharacterRigRefs,
  animation: CharacterAnimationType,
  clockTime: number,
  delta: number,
  seedOffset: number
): void {
  const {
    pelvis,
    torso,
    head,
    leftArm,
    rightArm,
    leftThigh,
    leftCalf,
    rightThigh,
    rightCalf,
  } = rig;

  if (
    !pelvis ||
    !torso ||
    !head ||
    !leftArm ||
    !rightArm ||
    !leftThigh ||
    !leftCalf ||
    !rightThigh ||
    !rightCalf
  ) {
    return;
  }

  const t = clockTime + seedOffset;
  const lerpFactor = 1 - Math.exp(-12 * delta);

  // Default standing/idle baseline targets
  let pelvisY = 0.72;
  let pelvisZ = 0;
  let torsoRotX = 0;
  let torsoRotY = 0;
  let torsoRotZ = 0;

  let headRotX = 0;
  let headRotY = 0;
  let headRotZ = 0;

  let lArmRotX = 0;
  let lArmRotZ = 0.08;
  let rArmRotX = 0;
  let rArmRotZ = -0.08;

  let lThighRotX = 0;
  let lCalfRotX = 0;
  let rThighRotX = 0;
  let rCalfRotX = 0;

  const isSeatedPose =
    animation === 'Sitting' ||
    animation === 'Sleeping' ||
    // Keep seated posture if character is sitting while performing upper-body emotes
    pelvis.position.y < 0.56;

  switch (animation) {
    case 'Walking': {
      const walkCycle = t * 9.5;
      pelvisY = 0.72 + Math.abs(Math.sin(walkCycle)) * 0.032;
      torsoRotX = -0.06;
      torsoRotY = Math.sin(walkCycle) * 0.08;

      lThighRotX = Math.sin(walkCycle) * 0.55;
      rThighRotX = -Math.sin(walkCycle) * 0.55;

      lCalfRotX = Math.max(0, -Math.cos(walkCycle) * 0.45);
      rCalfRotX = Math.max(0, Math.cos(walkCycle) * 0.45);

      lArmRotX = -Math.sin(walkCycle) * 0.42;
      rArmRotX = Math.sin(walkCycle) * 0.42;
      headRotY = Math.sin(t * 2.0) * 0.06;
      break;
    }

    case 'Sitting': {
      pelvisY = 0.43;
      pelvisZ = 0.02;
      torsoRotX = 0.12; // Slight recline against backrest (+Z)
      headRotY = Math.sin(t * 0.9) * 0.14;
      headRotX = Math.sin(t * 1.3) * 0.04;

      // Thighs raised forward (-Z) horizontally
      lThighRotX = Math.PI / 2 - 0.08;
      rThighRotX = Math.PI / 2 - 0.08;
      // Calves bent down toward floor
      lCalfRotX = -Math.PI / 2 + 0.18;
      rCalfRotX = -Math.PI / 2 + 0.18;

      // Forearms resting comfortably on armrests
      lArmRotX = 0.45;
      lArmRotZ = 0.12;
      rArmRotX = 0.45;
      rArmRotZ = -0.12;
      break;
    }

    case 'Standing': {
      pelvisY = 0.68;
      torsoRotX = -0.12;
      lArmRotX = 0.25;
      rArmRotX = 0.25;
      break;
    }

    case 'Waving': {
      if (isSeatedPose) {
        pelvisY = 0.43;
        pelvisZ = 0.02;
        torsoRotX = 0.08;
        lThighRotX = Math.PI / 2 - 0.08;
        rThighRotX = Math.PI / 2 - 0.08;
        lCalfRotX = -Math.PI / 2 + 0.18;
        rCalfRotX = -Math.PI / 2 + 0.18;
        lArmRotX = 0.42;
      } else {
        pelvisY = 0.72 + Math.sin(t * 2.5) * 0.01;
      }
      // Raise right arm and wave side-to-side
      rArmRotX = 2.45;
      rArmRotZ = -0.35 + Math.sin(t * 11.0) * 0.32;
      headRotZ = Math.sin(t * 5.5) * 0.08;
      break;
    }

    case 'Talking': {
      if (isSeatedPose) {
        pelvisY = 0.43;
        pelvisZ = 0.02;
        torsoRotX = 0.08;
        lThighRotX = Math.PI / 2 - 0.08;
        rThighRotX = Math.PI / 2 - 0.08;
        lCalfRotX = -Math.PI / 2 + 0.18;
        rCalfRotX = -Math.PI / 2 + 0.18;
      }
      headRotX = Math.sin(t * 6.5) * 0.09;
      headRotY = Math.sin(t * 2.8) * 0.18;
      lArmRotX = 0.65 + Math.sin(t * 5.2) * 0.22;
      rArmRotX = 0.65 + Math.cos(t * 4.8) * 0.22;
      break;
    }

    case 'Laughing': {
      if (isSeatedPose) {
        pelvisY = 0.43;
        pelvisZ = 0.02;
        lThighRotX = Math.PI / 2 - 0.08;
        rThighRotX = Math.PI / 2 - 0.08;
        lCalfRotX = -Math.PI / 2 + 0.18;
        rCalfRotX = -Math.PI / 2 + 0.18;
      }
      torsoRotX = 0.1 + Math.sin(t * 12.0) * 0.06;
      headRotX = -0.15 + Math.sin(t * 12.0) * 0.1;
      lArmRotX = 0.85 + Math.sin(t * 10.0) * 0.15;
      rArmRotX = 0.85 + Math.sin(t * 10.0) * 0.15;
      break;
    }

    case 'Nodding': {
      if (isSeatedPose) {
        pelvisY = 0.43;
        pelvisZ = 0.02;
        torsoRotX = 0.1;
        lThighRotX = Math.PI / 2 - 0.08;
        rThighRotX = Math.PI / 2 - 0.08;
        lCalfRotX = -Math.PI / 2 + 0.18;
        rCalfRotX = -Math.PI / 2 + 0.18;
      }
      headRotX = Math.sin(t * 9.0) * 0.24;
      break;
    }

    case 'Clapping': {
      if (isSeatedPose) {
        pelvisY = 0.43;
        pelvisZ = 0.02;
        torsoRotX = 0.08;
        lThighRotX = Math.PI / 2 - 0.08;
        rThighRotX = Math.PI / 2 - 0.08;
        lCalfRotX = -Math.PI / 2 + 0.18;
        rCalfRotX = -Math.PI / 2 + 0.18;
      }
      lArmRotX = 1.15;
      rArmRotX = 1.15;
      const clapWave = Math.abs(Math.sin(t * 11.0)) * 0.28;
      lArmRotZ = -0.22 + clapWave;
      rArmRotZ = 0.22 - clapWave;
      headRotX = Math.sin(t * 5.5) * 0.06;
      break;
    }

    case 'Sleeping': {
      pelvisY = isSeatedPose ? 0.43 : 0.71;
      pelvisZ = isSeatedPose ? 0.02 : 0;
      if (isSeatedPose) {
        lThighRotX = Math.PI / 2 - 0.08;
        rThighRotX = Math.PI / 2 - 0.08;
        lCalfRotX = -Math.PI / 2 + 0.18;
        rCalfRotX = -Math.PI / 2 + 0.18;
      }
      torsoRotX = 0.16 + Math.sin(t * 1.4) * 0.02;
      headRotX = -0.28;
      headRotZ = 0.22;
      lArmRotX = 0.4;
      rArmRotX = 0.4;
      break;
    }

    case 'Idle':
    default: {
      pelvisY = 0.72 + Math.sin(t * 2.2) * 0.008;
      torsoRotX = Math.sin(t * 2.2) * 0.015;
      headRotY = Math.sin(t * 1.1) * 0.12;
      lArmRotZ = 0.08 + Math.sin(t * 2.0) * 0.02;
      rArmRotZ = -0.08 - Math.sin(t * 2.0) * 0.02;
      break;
    }
  }

  // Smoothly interpolate all bone transforms
  pelvis.position.y = THREE.MathUtils.lerp(pelvis.position.y, pelvisY, lerpFactor);
  pelvis.position.z = THREE.MathUtils.lerp(pelvis.position.z, pelvisZ, lerpFactor);

  torso.rotation.x = THREE.MathUtils.lerp(torso.rotation.x, torsoRotX, lerpFactor);
  torso.rotation.y = THREE.MathUtils.lerp(torso.rotation.y, torsoRotY, lerpFactor);
  torso.rotation.z = THREE.MathUtils.lerp(torso.rotation.z, torsoRotZ, lerpFactor);

  head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, headRotX, lerpFactor);
  head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, headRotY, lerpFactor);
  head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, headRotZ, lerpFactor);

  leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, lArmRotX, lerpFactor);
  leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, lArmRotZ, lerpFactor);
  rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, rArmRotX, lerpFactor);
  rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, rArmRotZ, lerpFactor);

  leftThigh.rotation.x = THREE.MathUtils.lerp(leftThigh.rotation.x, lThighRotX, lerpFactor);
  leftCalf.rotation.x = THREE.MathUtils.lerp(leftCalf.rotation.x, lCalfRotX, lerpFactor);
  rightThigh.rotation.x = THREE.MathUtils.lerp(rightThigh.rotation.x, rThighRotX, lerpFactor);
  rightCalf.rotation.x = THREE.MathUtils.lerp(rightCalf.rotation.x, rCalfRotX, lerpFactor);
}

