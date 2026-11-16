import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { StationLayout, StationPerson } from '../../config/stationConfig';
import { GaitState, advanceGait, updateCharacterProceduralRig } from '../../character/AnimationController';
import { hashString, resolveAmbientColors, resolveAppearance } from '../../character/characterAssets';
import { CharacterRig, createRigHandles } from '../../character/CharacterRig';
import type { CharacterAnimationType } from '../../character/characterTypes';

const TWO_PI = Math.PI * 2;
/** Benches and stools are a little higher than a coach seat cushion. */
const SEAT_LIFT = 0.05;
const WALK_SPEED = 1.25;

interface AmbientPersonProps {
  person: StationPerson;
  /** Namespaces the look so the same spot shows different people at different stops. */
  stopId: string;
}

/**
 * One bystander: same articulated rig as the passengers, driven by a tiny local state
 * machine (stand / sit / chat / wave / stroll between two points). Purely decorative, so
 * nothing is written to the stores.
 */
const AmbientPerson: React.FC<AmbientPersonProps> = ({ person, stopId }) => {
  const rootRef = useRef<THREE.Group | null>(null);
  const handlesRef = useRef(createRigHandles());
  const uid = `${stopId}:${person.id}`;
  const seed = useMemo(() => (hashString(uid) % 1000) / 37, [uid]);
  const look = useMemo(
    () =>
      resolveAppearance({
        id: uid,
        bodyType: person.bodyType,
        accessories: person.accessory ? [person.accessory] : [],
      }),
    [uid, person.bodyType, person.accessory]
  );
  const colors = useMemo(() => resolveAmbientColors(uid, person.shirt), [uid, person.shirt]);
  const gaitRef = useRef<GaitState>({ phase: seed, weight: 0, run: 0 });
  const walkRef = useRef({ toEnd: true, pause: 1 + (seed % 3), x: person.x, z: person.z, yaw: person.rotY });
  const blinkRef = useRef(2 + (seed % 3));

  const sitting = person.pose === 'sit';

  useFrame((state, rawDelta) => {
    const root = rootRef.current;
    if (!root) return;
    const delta = Math.min(rawDelta, 0.1);
    const t = state.clock.elapsedTime;
    let animation: CharacterAnimationType = 'Idle';
    let speed = 0;

    if (person.pose === 'walk' && person.walkTo) {
      const walk = walkRef.current;
      if (walk.pause > 0) {
        walk.pause -= delta;
      } else {
        const targetX = walk.toEnd ? person.walkTo[0] : person.x;
        const targetZ = walk.toEnd ? person.walkTo[1] : person.z;
        const dx = targetX - walk.x;
        const dz = targetZ - walk.z;
        const dist = Math.hypot(dx, dz);
        const step = WALK_SPEED * delta;
        if (dist <= step) {
          walk.x = targetX;
          walk.z = targetZ;
          walk.toEnd = !walk.toEnd;
          walk.pause = 2 + ((seed * 3 + t) % 4);
        } else {
          walk.x += (dx / dist) * step;
          walk.z += (dz / dist) * step;
          speed = WALK_SPEED;
          const wantYaw = Math.atan2(-dx, -dz);
          let diff = wantYaw - walk.yaw;
          diff -= TWO_PI * Math.floor((diff + Math.PI) / TWO_PI);
          walk.yaw += diff * (1 - Math.exp(-8 * delta));
        }
      }
      root.position.x = walk.x;
      root.position.z = walk.z;
      root.rotation.y = walk.yaw;
      animation = speed > 0 ? 'Walking' : 'Idle';
    } else if (person.pose === 'sit') {
      animation = 'Sitting';
    } else if (person.pose === 'talk') {
      // Take turns: talk for a few seconds, then listen
      animation = Math.sin(t * 0.45 + seed) > -0.1 ? 'Talking' : 'Nodding';
    } else if (person.pose === 'wave') {
      animation = Math.sin(t * 0.6 + seed) > 0.25 ? 'Waving' : 'Idle';
    }

    advanceGait(gaitRef.current, speed, delta);
    updateCharacterProceduralRig(handlesRef.current, animation, t, delta, seed, 0, gaitRef.current);

    const eyes = handlesRef.current.eyes;
    if (eyes) {
      blinkRef.current -= delta;
      eyes.scale.y = blinkRef.current < 0.12 ? 0.12 : 1;
      if (blinkRef.current < 0) blinkRef.current = 2.4 + ((seed + t) % 3);
    }
    const mouth = handlesRef.current.mouth;
    if (mouth) mouth.scale.y = animation === 'Talking' ? 1.2 + Math.abs(Math.sin(t * 12 + seed)) * 2 : 1;
  });

  return (
    <group ref={rootRef} position={[person.x, sitting ? SEAT_LIFT : 0, person.z]} rotation={[0, person.rotY, 0]}>
      <CharacterRig look={look} colors={colors} handles={handlesRef} startSeated={sitting} />
    </group>
  );
};

/** The crowd of a station layout. Mounted only while the station is close to the bus. */
export const StationPeople: React.FC<{ layout: StationLayout; stopId: string }> = ({ layout, stopId }) => (
  <group name="StationPeople">
    {layout.people.map((person) => (
      <AmbientPerson key={person.id} person={person} stopId={stopId} />
    ))}
  </group>
);
