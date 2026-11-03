import React, { useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../stores/useGameStore';
import { CAMERA_PRESETS } from '../config/cameraConfig';
import { BusExterior } from './BusExterior';
import { BusInterior } from './BusInterior';
import { BusWheels } from './BusWheels';
import { CharacterManager } from '../character/CharacterManager';
import { useBusAnimation } from '../animation/useBusAnimation';

export const BusModel: React.FC = () => {
  const cameraMode = useGameStore((state) => state.cameraMode);
  const cutawayRoof = CAMERA_PRESETS[cameraMode].cutawayRoof;

  const bodyGroupRef = useRef<THREE.Group | null>(null);
  const wheelRefs = useRef<(THREE.Group | null)[]>([]);

  useBusAnimation({
    bodyGroupRef,
    wheelRefs,
  });

  return (
    <group name="VirtualBusRoot">
      {/* Suspended Coach Body (Exterior + Interior + Characters) */}
      <group ref={bodyGroupRef} name="BusSuspendedBody">
        <BusExterior cutawayRoof={cutawayRoof} />
        <BusInterior cutawayRoof={cutawayRoof} />
        <CharacterManager />
      </group>

      {/* Road-Contacting Rotating Wheels */}
      <BusWheels wheelRefs={wheelRefs} />
    </group>
  );
};
