import React from 'react';
import { BUS_COLORS, BUS_DIMENSIONS } from '../config/busConfig';
import { useGameStore } from '../../stores/useGameStore';
import { DriverCabin } from './DriverCabin';
import { SeatManager } from '../seat/SeatManager';

interface BusInteriorProps {
  cutawayRoof: boolean;
}

const WINDOW_PILLAR_Z = [-3.95, -2.35, -0.75, 0.85, 2.45, 4.05, 5.65] as const;
const CEILING_LIGHT_Z = [-3.5, -1.6, 0.3, 2.2, 4.1] as const;

export const BusInterior: React.FC<BusInteriorProps> = ({ cutawayRoof }) => {
  const timeOfDay = useGameStore((state) => state.timeOfDay);
  const interiorLightsOn = useGameStore((state) => state.interiorLightsOn);

  const floorY = BUS_DIMENSIONS.floorY;
  const ceilingY = BUS_DIMENSIONS.ceilingY;
  const halfW = BUS_DIMENSIONS.width / 2;
  const innerWallX = halfW - BUS_DIMENSIONS.wallThickness;

  const lightIntensity = interiorLightsOn
    ? timeOfDay === 'night'
      ? 1.15
      : 0.45
    : 0;

  return (
    <group name="BusInterior">
      {/* Main Wooden Cabin Floor */}
      <mesh position={[0, floorY - 0.04, 0]} receiveShadow>
        <boxGeometry
          args={[
            BUS_DIMENSIONS.width - 0.12,
            0.08,
            BUS_DIMENSIONS.length - 0.24,
          ]}
        />
        <meshStandardMaterial
          color={BUS_COLORS.floorWood}
          roughness={0.65}
          metalness={0.08}
        />
      </mesh>

      {/* Central Wide Aisle Carpet Runner */}
      <mesh position={[0, floorY + 0.004, 0.35]} receiveShadow>
        <boxGeometry args={[0.68, 0.01, 9.6]} />
        <meshStandardMaterial color={BUS_COLORS.aisleCarpet} roughness={0.85} />
      </mesh>

      {/* Warm LED Aisle Guide Strips (Left & Right of Central Aisle) */}
      <mesh position={[-0.345, floorY + 0.008, 0.35]}>
        <boxGeometry args={[0.018, 0.012, 9.5]} />
        <meshStandardMaterial
          color={BUS_COLORS.aisleTrimLED}
          emissive={BUS_COLORS.aisleTrimLED}
          emissiveIntensity={
            interiorLightsOn ? (timeOfDay === 'night' ? 1.8 : 0.6) : 0.1
          }
        />
      </mesh>
      <mesh position={[0.345, floorY + 0.008, 0.35]}>
        <boxGeometry args={[0.018, 0.012, 9.5]} />
        <meshStandardMaterial
          color={BUS_COLORS.aisleTrimLED}
          emissive={BUS_COLORS.aisleTrimLED}
          emissiveIntensity={
            interiorLightsOn ? (timeOfDay === 'night' ? 1.8 : 0.6) : 0.1
          }
        />
      </mesh>

      {/* Interior Lower Side Wall Trim Panels (Left & Right) */}
      <mesh position={[-innerWallX + 0.015, 1.09, 0.1]} receiveShadow>
        <boxGeometry args={[0.03, 0.74, 11.6]} />
        <meshStandardMaterial
          color={BUS_COLORS.wallLowerPanel}
          roughness={0.55}
        />
      </mesh>
      <mesh position={[innerWallX - 0.015, 1.09, 0.95]} receiveShadow>
        <boxGeometry args={[0.03, 0.74, 9.9]} />
        <meshStandardMaterial
          color={BUS_COLORS.wallLowerPanel}
          roughness={0.55}
        />
      </mesh>

      {/* Interior Rear Bulkhead Wall */}
      <mesh position={[0, 1.8, 5.98]} receiveShadow>
        <boxGeometry args={[BUS_DIMENSIONS.width - 0.14, 2.16, 0.08]} />
        <meshStandardMaterial
          color={BUS_COLORS.wallLowerPanel}
          roughness={0.6}
        />
      </mesh>
      {/* Rear Upper Red Accent Panel */}
      <mesh position={[0, 2.52, 5.93]}>
        <boxGeometry args={[2.4, 0.48, 0.04]} />
        <meshStandardMaterial color={BUS_COLORS.ceilingRed} roughness={0.45} />
      </mesh>

      {/* Interior Metallic Window Pillars & Grab Handles */}
      {WINDOW_PILLAR_Z.map((zPos, idx) => (
        <group key={`pillar-${idx}`} position={[0, 0, zPos]}>
          <mesh position={[-innerWallX + 0.02, 2.0, 0]} castShadow>
            <boxGeometry args={[0.05, 1.08, 0.09]} />
            <meshStandardMaterial
              color={BUS_COLORS.windowFrameMetal}
              metalness={0.65}
              roughness={0.32}
            />
          </mesh>
          <mesh position={[innerWallX - 0.02, 2.0, 0]} castShadow>
            <boxGeometry args={[0.05, 1.08, 0.09]} />
            <meshStandardMaterial
              color={BUS_COLORS.windowFrameMetal}
              metalness={0.65}
              roughness={0.32}
            />
          </mesh>
        </group>
      ))}

      {/* Continuous Metallic Window Sill Rails (Left & Right) */}
      <mesh position={[-innerWallX + 0.03, BUS_DIMENSIONS.windowBottomY, 0.2]}>
        <boxGeometry args={[0.05, 0.04, 11.2]} />
        <meshStandardMaterial
          color={BUS_COLORS.metalHandrail}
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>
      <mesh position={[innerWallX - 0.03, BUS_DIMENSIONS.windowBottomY, 0.9]}>
        <boxGeometry args={[0.05, 0.04, 9.8]} />
        <meshStandardMaterial
          color={BUS_COLORS.metalHandrail}
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>

      {/* Driver Cockpit at the Front */}
      <DriverCabin />

      {/* Unified Seat System (28 Interactive Leather Seats) */}
      <SeatManager />

      {/* Cutaway-aware Red Ceiling, Overhead Luggage Racks, Metallic Handrails & Ceiling Lights */}
      <group name="CeilingAndRacks" visible={!cutawayRoof}>
        {/* Main Crimson Red Interior Ceiling Panel */}
        <mesh position={[0, ceilingY, 0]} receiveShadow>
          <boxGeometry
            args={[
              BUS_DIMENSIONS.width - 0.14,
              0.05,
              BUS_DIMENSIONS.length - 0.3,
            ]}
          />
          <meshStandardMaterial
            color={BUS_COLORS.ceilingRed}
            roughness={0.42}
            metalness={0.08}
          />
        </mesh>

        {/* Central Recessed Red Valance Panel */}
        <mesh position={[0, ceilingY - 0.035, 0.2]}>
          <boxGeometry args={[1.05, 0.03, 10.6]} />
          <meshStandardMaterial
            color={BUS_COLORS.ceilingPanelInner}
            roughness={0.36}
            metalness={0.1}
          />
        </mesh>

        {/* Deep Red Side Cove Mouldings */}
        <mesh position={[-0.95, ceilingY - 0.05, 0.2]}>
          <boxGeometry args={[0.68, 0.06, 10.8]} />
          <meshStandardMaterial
            color={BUS_COLORS.ceilingRedTrim}
            roughness={0.45}
          />
        </mesh>
        <mesh position={[0.95, ceilingY - 0.05, 0.2]}>
          <boxGeometry args={[0.68, 0.06, 10.8]} />
          <meshStandardMaterial
            color={BUS_COLORS.ceilingRedTrim}
            roughness={0.45}
          />
        </mesh>

        {/* Overhead Luggage Racks (Left & Right) */}
        <mesh position={[-0.96, 2.48, 0.65]} castShadow>
          <boxGeometry args={[0.58, 0.035, 9.6]} />
          <meshStandardMaterial
            color="#334155"
            roughness={0.5}
            metalness={0.3}
          />
        </mesh>
        <mesh position={[0.96, 2.48, 0.65]} castShadow>
          <boxGeometry args={[0.58, 0.035, 9.6]} />
          <meshStandardMaterial
            color="#334155"
            roughness={0.5}
            metalness={0.3}
          />
        </mesh>

        {/* Long Brushed Aluminum Handrails along Overhead Racks */}
        <mesh
          position={[-0.64, 2.47, 0.65]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.018, 0.018, 9.6, 12]} />
          <meshStandardMaterial
            color={BUS_COLORS.metalHandrail}
            metalness={0.85}
            roughness={0.18}
          />
        </mesh>
        <mesh position={[0.64, 2.47, 0.65]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 9.6, 12]} />
          <meshStandardMaterial
            color={BUS_COLORS.metalHandrail}
            metalness={0.85}
            roughness={0.18}
          />
        </mesh>

        {/* Continuous Warm LED Ceiling Strips */}
        <mesh position={[-0.48, ceilingY - 0.052, 0.3]}>
          <boxGeometry args={[0.04, 0.015, 10.2]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#facc15"
            emissiveIntensity={interiorLightsOn ? 2.2 : 0.15}
          />
        </mesh>
        <mesh position={[0.48, ceilingY - 0.052, 0.3]}>
          <boxGeometry args={[0.04, 0.015, 10.2]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#facc15"
            emissiveIntensity={interiorLightsOn ? 2.2 : 0.15}
          />
        </mesh>

        {/* Recessed Ceiling Dome Light Fixtures along Center Line */}
        {CEILING_LIGHT_Z.map((zPos, idx) => (
          <group
            key={`dome-light-${idx}`}
            position={[0, ceilingY - 0.055, zPos]}
          >
            <mesh>
              <boxGeometry args={[0.46, 0.02, 0.72]} />
              <meshStandardMaterial
                color="#cbd5e1"
                metalness={0.7}
                roughness={0.25}
              />
            </mesh>
            <mesh position={[0, -0.008, 0]}>
              <boxGeometry args={[0.38, 0.01, 0.64]} />
              <meshStandardMaterial
                color="#fffbeb"
                emissive="#fde68a"
                emissiveIntensity={interiorLightsOn ? 2.4 : 0.1}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Interior Point Lights */}
      {lightIntensity > 0 &&
        [-3.0, 0.2, 3.4].map((zPos, idx) => (
          <pointLight
            key={`cabin-light-${idx}`}
            position={[0, 2.62, zPos]}
            intensity={lightIntensity}
            distance={6.8}
            decay={1.8}
            color="#fde68a"
          />
        ))}
    </group>
  );
};
