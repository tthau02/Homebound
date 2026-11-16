import React, { useMemo } from 'react';
import * as THREE from 'three';
import {
  BODY_MATERIAL,
  CharacterAppearance,
  CharacterColors,
  RIG,
  getBodyGeometries,
} from './characterAssets';
import type { CharacterRigRefs } from './AnimationController';

export interface CharacterRigHandles extends CharacterRigRefs {
  eyes: THREE.Mesh | null;
  mouth: THREE.Mesh | null;
}

export function createRigHandles(): CharacterRigHandles {
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
    eyes: null,
    mouth: null,
  };
}

interface CharacterRigProps {
  look: CharacterAppearance;
  colors: CharacterColors;
  /** Filled with the joint groups; animate them with `updateCharacterProceduralRig`. */
  handles: React.MutableRefObject<CharacterRigHandles>;
  /** Start in the seated posture (avoids a one-frame pop for characters that spawn sitting). */
  startSeated?: boolean;
  castShadow?: boolean;
}

const SIDES = [-1, 1] as const;
const WAIST_POS: [number, number, number] = [0, RIG.waistY, 0];
const NECK_POS: [number, number, number] = [0, RIG.neckY, 0];
const EYE_POS: [number, number, number] = [0, RIG.eyeY, 0];
const MOUTH_POS: [number, number, number] = [0, RIG.mouthY, 0];
const ELBOW_POS: [number, number, number] = [0, -RIG.upperArmLength, 0];
const KNEE_POS: [number, number, number] = [0, -RIG.thighLength, 0];
const ANKLE_POS: [number, number, number] = [0, -RIG.shinLength, 0];
const HIP_POS: Record<-1 | 1, [number, number, number]> = {
  [-1]: [-RIG.hipX, RIG.hipY, 0],
  1: [RIG.hipX, RIG.hipY, 0],
};

/**
 * Visual-only articulated human: 15 joints, one merged vertex-coloured mesh per joint.
 * Used by bus passengers / players (CharacterModel) and by station bystanders.
 * The pelvis height is owned by the animation controller, so it is only initialised once.
 */
export const CharacterRig: React.FC<CharacterRigProps> = React.memo(function CharacterRig({
  look,
  colors,
  handles,
  startSeated = false,
  castShadow = true,
}) {
  const geo = useMemo(
    () => getBodyGeometries(look, colors),
    // Colours are plain strings; depend on their values so a new object does not rebuild
    [look, colors.shirt, colors.pants, colors.hair]
  );
  const shoulderX = RIG.shoulderX[look.bodyType];
  const shoulderPos = useMemo<Record<-1 | 1, [number, number, number]>>(
    () => ({ [-1]: [-shoulderX, RIG.shoulderY, 0], 1: [shoulderX, RIG.shoulderY, 0] }),
    [shoulderX]
  );
  const h = handles.current;
  const m = BODY_MATERIAL;

  return (
    <group scale={look.heightScale}>
      <group
        ref={(el) => {
          h.pelvis = el;
          if (el && !el.userData.rigInitialised) {
            el.userData.rigInitialised = true;
            el.position.y = startSeated ? RIG.sitPelvisY : RIG.standPelvisY;
          }
        }}
      >
        <mesh geometry={geo.pelvis} material={m} castShadow={castShadow} />

        <group
          position={WAIST_POS}
          ref={(el) => {
            h.torso = el;
          }}
        >
          <mesh geometry={geo.torso} material={m} castShadow={castShadow} />

          <group
            position={NECK_POS}
            ref={(el) => {
              h.head = el;
            }}
          >
            <mesh geometry={geo.head} material={m} castShadow={castShadow} />
            <mesh
              geometry={geo.eyes}
              material={m}
              position={EYE_POS}
              ref={(el) => {
                h.eyes = el;
              }}
            />
            <mesh
              geometry={geo.mouth}
              material={m}
              position={MOUTH_POS}
              ref={(el) => {
                h.mouth = el;
              }}
            />
          </group>

          {SIDES.map((side) => (
            <group
              key={side}
              position={shoulderPos[side]}
              ref={(el) => {
                if (side < 0) h.leftArm = el;
                else h.rightArm = el;
              }}
            >
              <mesh geometry={geo.upperArm} material={m} castShadow={castShadow} />
              <group
                position={ELBOW_POS}
                ref={(el) => {
                  if (side < 0) h.leftForearm = el;
                  else h.rightForearm = el;
                }}
              >
                <mesh geometry={geo.forearm} material={m} castShadow={castShadow} />
              </group>
            </group>
          ))}
        </group>

        {SIDES.map((side) => (
          <group
            key={side}
            position={HIP_POS[side]}
            ref={(el) => {
              if (side < 0) h.leftThigh = el;
              else h.rightThigh = el;
            }}
          >
            <mesh geometry={geo.thigh} material={m} castShadow={castShadow} />
            <group
              position={KNEE_POS}
              ref={(el) => {
                if (side < 0) h.leftCalf = el;
                else h.rightCalf = el;
              }}
            >
              <mesh geometry={geo.shin} material={m} castShadow={castShadow} />
              <group
                position={ANKLE_POS}
                ref={(el) => {
                  if (side < 0) h.leftFoot = el;
                  else h.rightFoot = el;
                }}
              >
                <mesh geometry={geo.foot} material={m} castShadow={castShadow} />
              </group>
            </group>
          </group>
        ))}
      </group>
    </group>
  );
});
