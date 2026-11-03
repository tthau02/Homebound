import React from 'react';
import * as THREE from 'three';
import { BUS_DIMENSIONS } from '../config/busConfig';

interface BusWheelsProps {
  wheelRefs: React.MutableRefObject<(THREE.Group | null)[]>;
}

const WHEEL_POSITIONS: Array<{
  pos: [number, number, number];
  side: 'left' | 'right';
}> = [
  {
    pos: [-BUS_DIMENSIONS.wheelTrackX, BUS_DIMENSIONS.wheelRadius, BUS_DIMENSIONS.frontAxleZ],
    side: 'left',
  },
  {
    pos: [BUS_DIMENSIONS.wheelTrackX, BUS_DIMENSIONS.wheelRadius, BUS_DIMENSIONS.frontAxleZ],
    side: 'right',
  },
  {
    pos: [-BUS_DIMENSIONS.wheelTrackX, BUS_DIMENSIONS.wheelRadius, BUS_DIMENSIONS.rearAxleZ],
    side: 'left',
  },
  {
    pos: [BUS_DIMENSIONS.wheelTrackX, BUS_DIMENSIONS.wheelRadius, BUS_DIMENSIONS.rearAxleZ],
    side: 'right',
  },
];

export const BusWheels: React.FC<BusWheelsProps> = ({ wheelRefs }) => {
  const r = BUS_DIMENSIONS.wheelRadius;
  const w = BUS_DIMENSIONS.wheelWidth;

  return (
    <group name="BusWheels">
      {WHEEL_POSITIONS.map((wheel, index) => {
        const hubX = wheel.side === 'left' ? -w * 0.45 : w * 0.45;
        return (
          <group
            key={`wheel-${index}`}
            position={wheel.pos}
            ref={(el) => {
              wheelRefs.current[index] = el;
            }}
          >
            {/* Rubber Tire Cylinder (aligned along X axis via Z rotation = PI/2) */}
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
              <cylinderGeometry args={[r, r, w, 24]} />
              <meshStandardMaterial color="#18181b" roughness={0.85} metalness={0.1} />
            </mesh>

            {/* Alloy Rim Cylinder */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[r * 0.62, r * 0.62, w + 0.015, 16]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.22} />
            </mesh>

            {/* Center Hubcap */}
            <mesh position={[hubX, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[r * 0.25, r * 0.25, 0.05, 12]} />
              <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
            </mesh>

            {/* Visual Spoke Bars so wheel rotation is clearly visible */}
            {[0, 1, 2].map((spokeIdx) => (
              <mesh
                key={`spoke-${spokeIdx}`}
                position={[hubX, 0, 0]}
                rotation={[(spokeIdx * Math.PI) / 3, 0, 0]}
              >
                <boxGeometry args={[0.025, r * 1.15, 0.06]} />
                <meshStandardMaterial color="#64748b" metalness={0.75} roughness={0.25} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
};

