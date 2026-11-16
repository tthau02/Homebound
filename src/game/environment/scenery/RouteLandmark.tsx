import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROAD_LAYOUT } from '../../config/environmentConfig';
import { getSignTexture, getWaterTexture } from '../../materials/proceduralTextures';
import type { ActiveLandmark } from './RouteScenery';
import { sceneryLive } from './sceneryLive';

const ROAD_LEFT = ROAD_LAYOUT.leftPavedX;
const ROAD_RIGHT = ROAD_LAYOUT.rightPavedX;
const ROAD_CENTER = (ROAD_LEFT + ROAD_RIGHT) / 2;
const ROAD_SPAN = ROAD_RIGHT - ROAD_LEFT;

/** One-off recognisable landmark that scrolls past with the world. */
export const RouteLandmark: React.FC<{ landmark: ActiveLandmark }> = ({ landmark }) => {
  const groupRef = useRef<THREE.Group | null>(null);

  useEffect(
    () => () => {
      if (sceneryLive.landmarkNear === landmark.def.id) sceneryLive.landmarkNear = null;
    },
    [landmark.def.id]
  );

  useFrame(() => {
    const z = sceneryLive.traveledM - landmark.s;
    if (groupRef.current) {
      groupRef.current.position.z = z;
    }
    // Report when this landmark is passing the bus (story triggers, HUD captions)
    const isNear = z > -90 && z < 40;
    if (isNear) {
      sceneryLive.landmarkNear = landmark.def.id;
    } else if (sceneryLive.landmarkNear === landmark.def.id) {
      sceneryLive.landmarkNear = null;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -1000]} name={`Landmark-${landmark.def.id}`}>
      {landmark.def.kind === 'riverBridge' && <RiverBridge lines={landmark.def.lines ?? []} />}
      {landmark.def.kind === 'tollPlaza' && <TollPlaza lines={landmark.def.lines ?? []} />}
      {landmark.def.kind === 'signGantry' && <SignGantry lines={landmark.def.lines ?? []} />}
      {landmark.def.kind === 'skylineTower' && <Skyline />}
    </group>
  );
};

const RiverBridge: React.FC<{ lines: string[] }> = ({ lines }) => {
  const water = useMemo(() => {
    const t = getWaterTexture().clone();
    t.repeat.set(60, 3);
    t.needsUpdate = true;
    return t;
  }, []);
  const sign = getSignTexture(lines, '#1d4ed8', '#ffffff', 4);
  const rails = [ROAD_LEFT - 0.35, ROAD_RIGHT + 0.35];

  return (
    <group>
      {/* River surface crossing the whole valley */}
      <mesh position={[0, -0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[900, 46]} />
        <meshStandardMaterial color="#4d7f96" map={water} roughness={0.08} metalness={0.4} />
      </mesh>
      {/* Muddy banks */}
      {[-25, 25].map((z) => (
        <mesh key={z} position={[0, -0.045, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[900, 5]} />
          <meshStandardMaterial color="#8a7a5a" roughness={1} />
        </mesh>
      ))}
      {/* Bridge deck edges & railings */}
      {rails.map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[0.5, 0.5, 64]} />
            <meshStandardMaterial color="#d6d3cd" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.95, 0]}>
            <boxGeometry args={[0.12, 0.1, 64]} />
            <meshStandardMaterial color="#e5e7eb" metalness={0.5} roughness={0.35} />
          </mesh>
          {Array.from({ length: 17 }, (_, i) => (
            <mesh key={i} position={[0, 0.7, -32 + i * 4]}>
              <boxGeometry args={[0.12, 0.5, 0.12]} />
              <meshStandardMaterial color="#e5e7eb" metalness={0.5} roughness={0.35} />
            </mesh>
          ))}
          {/* Lamp posts */}
          {[-24, 0, 24].map((z) => (
            <group key={z} position={[0, 0, z]}>
              <mesh position={[0, 3.2, 0]}>
                <cylinderGeometry args={[0.07, 0.09, 6, 8]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.35} />
              </mesh>
              <mesh position={[x < 0 ? 0.5 : -0.5, 6.1, 0]}>
                <boxGeometry args={[1.1, 0.14, 0.3]} />
                <meshStandardMaterial color="#fef3c7" emissive="#fde68a" emissiveIntensity={0.6} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      {/* Bridge name sign at the entrance */}
      <group position={[ROAD_RIGHT + 2, 0, 34]}>
        <mesh position={[0, 1.4, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 2.8, 8]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
        <mesh position={[0, 3.0, 0]}>
          <planeGeometry args={[3.2, 0.8]} />
          <meshStandardMaterial map={sign} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Small wooden boats */}
      {[[-40, 8], [55, -12], [-110, -6]].map(([x, z]) => (
        <group key={`${x}-${z}`} position={[x, 0, z]} rotation={[0, 0.4, 0]}>
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[1.4, 0.4, 5]} />
            <meshStandardMaterial color="#7c4a2d" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.55, 0.6]}>
            <cylinderGeometry args={[0.7, 0.7, 2, 10, 1, true, 0, Math.PI]} />
            <meshStandardMaterial color="#a16207" side={THREE.DoubleSide} roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const TollPlaza: React.FC<{ lines: string[] }> = ({ lines }) => {
  const sign = getSignTexture(lines, '#0f766e', '#ffffff', 8);
  // Free-flow (ETC) plaza: islands only on the verges and the median so every lane stays open
  const islands = [ROAD_RIGHT + 0.9, ROAD_LAYOUT.medianX, ROAD_LEFT - 0.9];
  const laneXs = [
    ROAD_LAYOUT.shoulderLaneX,
    ROAD_LAYOUT.busLaneX,
    ROAD_LAYOUT.overtakeLaneX,
    ROAD_LAYOUT.oncomingInnerX,
    ROAD_LAYOUT.oncomingOuterX,
  ];
  const canopyWidth = ROAD_SPAN + 5;
  return (
    <group>
      {/* Canopy */}
      <mesh position={[ROAD_CENTER, 6.6, 0]} castShadow>
        <boxGeometry args={[canopyWidth, 0.6, 12]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.6} />
      </mesh>
      <mesh position={[ROAD_CENTER, 6.6, 6.02]}>
        <planeGeometry args={[canopyWidth, 0.6]} />
        <meshStandardMaterial color="#0f766e" />
      </mesh>
      <mesh position={[ROAD_CENTER, 7.7, 6.1]}>
        <planeGeometry args={[14, 1.75]} />
        <meshStandardMaterial map={sign} emissive="#ffffff" emissiveMap={sign} emissiveIntensity={0.25} />
      </mesh>
      {islands.map((x, i) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[i === 1 ? 0.9 : 1.4, 0.3, 14]} />
            <meshStandardMaterial color="#fbbf24" roughness={0.7} />
          </mesh>
          {i !== 1 && (
            <>
              <mesh position={[0, 1.6, 0]} castShadow>
                <boxGeometry args={[1.2, 2.6, 2.6]} />
                <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
              </mesh>
              <mesh position={[0, 1.9, 1.31]}>
                <planeGeometry args={[0.95, 1.1]} />
                <meshStandardMaterial color="#7dd3fc" metalness={0.3} roughness={0.15} />
              </mesh>
            </>
          )}
          {[-4, 4].map((z) => (
            <mesh key={z} position={[0, 3.3, z]}>
              <cylinderGeometry args={[0.22, 0.22, 6.2, 10]} />
              <meshStandardMaterial color="#cbd5e1" />
            </mesh>
          ))}
        </group>
      ))}
      {/* Green lane lights above every lane */}
      {laneXs.map((x) => (
        <mesh key={x} position={[x, 6.1, 5.8]}>
          <boxGeometry args={[0.5, 0.35, 0.1]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2.2} />
        </mesh>
      ))}
    </group>
  );
};

const SignGantry: React.FC<{ lines: string[] }> = ({ lines }) => {
  const sign = getSignTexture(lines, '#0f6b3f', '#ffffff', 3);
  const posts = [ROAD_LEFT - 1.1, ROAD_RIGHT + 1.1];
  const signX = (ROAD_LAYOUT.busLaneX + ROAD_LAYOUT.overtakeLaneX) / 2;
  return (
    <group>
      {posts.map((x) => (
        <mesh key={x} position={[x, 3.8, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.26, 7.6, 10]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[ROAD_CENTER, 7.3, 0]}>
        <boxGeometry args={[ROAD_SPAN + 2.8, 0.35, 0.35]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[signX, 6.2, 0.25]}>
        <boxGeometry args={[7.2, 2.4, 0.12]} />
        <meshStandardMaterial color="#0f6b3f" />
      </mesh>
      <mesh position={[signX, 6.2, 0.32]}>
        <planeGeometry args={[7.2, 2.4]} />
        <meshStandardMaterial map={sign} emissive="#ffffff" emissiveMap={sign} emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
};

/** Hà Nội skyline: a super-tall landmark tower flanked by twin towers, far on the left. */
const Skyline: React.FC = () => {
  return (
    <group position={[-170, 0, -60]}>
      <mesh position={[0, 110, 0]}>
        <boxGeometry args={[30, 220, 24]} />
        <meshStandardMaterial color="#9fb6c9" metalness={0.65} roughness={0.18} />
      </mesh>
      <mesh position={[0, 224, 0]}>
        <boxGeometry args={[22, 8, 18]} />
        <meshStandardMaterial color="#c7d4de" metalness={0.5} roughness={0.25} />
      </mesh>
      <mesh position={[0, 236, 0]}>
        <cylinderGeometry args={[0.6, 0.8, 18, 8]} />
        <meshStandardMaterial color="#e2e8f0" emissive="#ef4444" emissiveIntensity={0.6} />
      </mesh>
      {[-40, 40].map((x) => (
        <mesh key={x} position={[x, 72, 22]}>
          <boxGeometry args={[20, 144, 20]} />
          <meshStandardMaterial color="#b8c4ce" metalness={0.5} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
};
