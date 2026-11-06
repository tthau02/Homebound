import React from 'react';
import { BUS_DIMENSIONS } from '../config/busConfig';
import { useGameStore } from '../../stores/useGameStore';
import { DriverCabin } from './DriverCabin';
import { SeatManager } from '../seat/SeatManager';

interface BusInteriorProps {
  cutawayRoof: boolean;
}

const WINDOW_PILLAR_Z = [-3.95, -2.35, -0.75, 0.85, 2.45, 4.05, 5.65] as const;
const CEILING_LIGHT_Z = [-3.5, -1.6, 0.3, 2.2, 4.1] as const;
const SEAT_ROW_AC_Z = [-3.2, -1.9, -0.6, 0.7, 2.0, 3.3, 4.6] as const;

export const BusInterior: React.FC<BusInteriorProps> = ({ cutawayRoof }) => {
  const timeOfDay = useGameStore((state) => state.timeOfDay);
  const interiorLightsOn = useGameStore((state) => state.interiorLightsOn);

  const floorY = BUS_DIMENSIONS.floorY;
  const ceilingY = BUS_DIMENSIONS.ceilingY;
  const halfW = BUS_DIMENSIONS.width / 2;
  const innerWallX = halfW - BUS_DIMENSIONS.wallThickness;

  const lightIntensity = interiorLightsOn
    ? timeOfDay === 'night'
      ? 1.25
      : 0.55
    : 0;

  return (
    <group name="BusInterior">
      {/* Main Luxury Dark Walnut Parquet Floor */}
      <mesh position={[0, floorY - 0.04, 0]} receiveShadow>
        <boxGeometry
          args={[
            BUS_DIMENSIONS.width - 0.12,
            0.08,
            BUS_DIMENSIONS.length - 0.24,
          ]}
        />
        <meshStandardMaterial
          color="#2d1d13"
          roughness={0.42}
          metalness={0.12}
        />
      </mesh>

      {/* Central Wide Luxury Aisle Carpet Runner */}
      <mesh position={[0, floorY + 0.004, 0.35]} receiveShadow>
        <boxGeometry args={[0.7, 0.01, 9.6]} />
        <meshStandardMaterial color="#1e293b" roughness={0.78} />
      </mesh>

      {/* Decorative Gold Inset Piping Lines along Aisle Carpet */}
      <mesh position={[-0.32, floorY + 0.008, 0.35]}>
        <boxGeometry args={[0.018, 0.008, 9.55]} />
        <meshStandardMaterial color="#d97706" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.32, floorY + 0.008, 0.35]}>
        <boxGeometry args={[0.018, 0.008, 9.55]} />
        <meshStandardMaterial color="#d97706" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Warm LED Aisle Guide Strips */}
      <mesh position={[-0.355, floorY + 0.008, 0.35]}>
        <boxGeometry args={[0.016, 0.012, 9.5]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={
            interiorLightsOn ? (timeOfDay === 'night' ? 2.0 : 0.8) : 0.15
          }
        />
      </mesh>
      <mesh position={[0.355, floorY + 0.008, 0.35]}>
        <boxGeometry args={[0.016, 0.012, 9.5]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={
            interiorLightsOn ? (timeOfDay === 'night' ? 2.0 : 0.8) : 0.15
          }
        />
      </mesh>

      {/* Interior Lower Side Wall Trim Panels (Soft Warm Gray Composite) */}
      <mesh position={[-innerWallX + 0.015, 1.09, 0.1]} receiveShadow>
        <boxGeometry args={[0.03, 0.74, 11.6]} />
        <meshStandardMaterial
          color="#e2e8f0"
          roughness={0.5}
        />
      </mesh>
      <mesh position={[innerWallX - 0.015, 1.09, 0.95]} receiveShadow>
        <boxGeometry args={[0.03, 0.74, 9.9]} />
        <meshStandardMaterial
          color="#e2e8f0"
          roughness={0.5}
        />
      </mesh>

      {/* Interior Rear Bulkhead Wall with Warm Ambient LED Accent */}
      <mesh position={[0, 1.8, 5.98]} receiveShadow>
        <boxGeometry args={[BUS_DIMENSIONS.width - 0.14, 2.16, 0.08]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.55}
        />
      </mesh>
      {/* Rear Upper Crimson Accent Panel */}
      <mesh position={[0, 2.52, 5.93]}>
        <boxGeometry args={[2.4, 0.48, 0.04]} />
        <meshStandardMaterial color="#881337" roughness={0.4} />
      </mesh>

      {/* Interior Metallic Window Pillars */}
      {WINDOW_PILLAR_Z.map((zPos, idx) => (
        <group key={`pillar-${idx}`} position={[0, 0, zPos]}>
          <mesh position={[-innerWallX + 0.02, 2.0, 0]} castShadow>
            <boxGeometry args={[0.05, 1.08, 0.09]} />
            <meshStandardMaterial
              color="#334155"
              metalness={0.7}
              roughness={0.28}
            />
          </mesh>
          <mesh position={[innerWallX - 0.02, 2.0, 0]} castShadow>
            <boxGeometry args={[0.05, 1.08, 0.09]} />
            <meshStandardMaterial
              color="#334155"
              metalness={0.7}
              roughness={0.28}
            />
          </mesh>

          {/* Pleated Silk Privacy Curtains tied back next to each pillar */}
          <mesh position={[-innerWallX + 0.045, 1.95, -0.06]}>
            <cylinderGeometry args={[0.038, 0.045, 0.88, 10]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.75} />
          </mesh>
          {/* Gold Tassel Tie Band */}
          <mesh position={[-innerWallX + 0.048, 1.95, -0.06]}>
            <torusGeometry args={[0.042, 0.008, 8, 16]} />
            <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.2} />
          </mesh>

          <mesh position={[innerWallX - 0.045, 1.95, -0.06]}>
            <cylinderGeometry args={[0.038, 0.045, 0.88, 10]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.75} />
          </mesh>
          <mesh position={[innerWallX - 0.048, 1.95, -0.06]}>
            <torusGeometry args={[0.042, 0.008, 8, 16]} />
            <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Continuous Metallic Window Sill Rails */}
      <mesh position={[-innerWallX + 0.03, BUS_DIMENSIONS.windowBottomY, 0.2]}>
        <boxGeometry args={[0.05, 0.04, 11.2]} />
        <meshStandardMaterial
          color="#94a3b8"
          metalness={0.8}
          roughness={0.22}
        />
      </mesh>
      <mesh position={[innerWallX - 0.03, BUS_DIMENSIONS.windowBottomY, 0.9]}>
        <boxGeometry args={[0.05, 0.04, 9.8]} />
        <meshStandardMaterial
          color="#94a3b8"
          metalness={0.8}
          roughness={0.22}
        />
      </mesh>

      {/* Driver Cockpit at the Front */}
      <DriverCabin />

      {/* Front Destination & Clock LED Signboard (Mounted over windshield) */}
      <group position={[0, 2.64, -5.25]}>
        <mesh>
          <boxGeometry args={[1.65, 0.22, 0.08]} />
          <meshStandardMaterial color="#09090b" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.042]}>
          <planeGeometry args={[1.55, 0.17]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#d97706"
            emissiveIntensity={1.3}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Unified Seat System (28 Interactive Luxury Recliner Seats) */}
      <SeatManager />

      {/* Cutaway-aware Luxury Ceiling, Starlight Cove LED & Overhead Racks */}
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
            color="#881337"
            roughness={0.38}
            metalness={0.1}
          />
        </mesh>

        {/* Central Recessed Champagne Gold Valance Panel */}
        <mesh position={[0, ceilingY - 0.035, 0.2]}>
          <boxGeometry args={[1.08, 0.03, 10.6]} />
          <meshStandardMaterial
            color="#1c1917"
            roughness={0.35}
            metalness={0.15}
          />
        </mesh>

        {/* Deep Ruby Side Cove Mouldings */}
        <mesh position={[-0.95, ceilingY - 0.05, 0.2]}>
          <boxGeometry args={[0.68, 0.06, 10.8]} />
          <meshStandardMaterial
            color="#4c0519"
            roughness={0.42}
          />
        </mesh>
        <mesh position={[0.95, ceilingY - 0.05, 0.2]}>
          <boxGeometry args={[0.68, 0.06, 10.8]} />
          <meshStandardMaterial
            color="#4c0519"
            roughness={0.42}
          />
        </mesh>

        {/* Overhead Luggage Racks */}
        <mesh position={[-0.96, 2.48, 0.65]} castShadow>
          <boxGeometry args={[0.58, 0.035, 9.6]} />
          <meshStandardMaterial
            color="#334155"
            roughness={0.45}
            metalness={0.3}
          />
        </mesh>
        <mesh position={[0.96, 2.48, 0.65]} castShadow>
          <boxGeometry args={[0.58, 0.035, 9.6]} />
          <meshStandardMaterial
            color="#334155"
            roughness={0.45}
            metalness={0.3}
          />
        </mesh>

        {/* Brushed Aluminum Handrails along Overhead Racks */}
        <mesh
          position={[-0.64, 2.47, 0.65]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.018, 0.018, 9.6, 12]} />
          <meshStandardMaterial
            color="#cbd5e1"
            metalness={0.85}
            roughness={0.18}
          />
        </mesh>
        <mesh position={[0.64, 2.47, 0.65]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 9.6, 12]} />
          <meshStandardMaterial
            color="#cbd5e1"
            metalness={0.85}
            roughness={0.18}
          />
        </mesh>

        {/* Continuous Starlight Ambient LED Strip Lighting along Cove Edge */}
        <mesh position={[-0.49, ceilingY - 0.052, 0.3]}>
          <boxGeometry args={[0.035, 0.015, 10.2]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#fde047"
            emissiveIntensity={interiorLightsOn ? (timeOfDay === 'night' ? 2.5 : 1.2) : 0.2}
          />
        </mesh>
        <mesh position={[0.49, ceilingY - 0.052, 0.3]}>
          <boxGeometry args={[0.035, 0.015, 10.2]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#fde047"
            emissiveIntensity={interiorLightsOn ? (timeOfDay === 'night' ? 2.5 : 1.2) : 0.2}
          />
        </mesh>

        {/* Flush-Mounted Aerodynamic Ceiling LED Lights */}
        {CEILING_LIGHT_Z.map((zPos, idx) => (
          <group
            key={`dome-light-${idx}`}
            position={[0, ceilingY - 0.055, zPos]}
          >
            {/* Slim Brushed Metallic Outer Bezel */}
            <mesh>
              <boxGeometry args={[0.44, 0.018, 0.68]} />
              <meshStandardMaterial
                color="#e2e8f0"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            {/* Opal White LED Diffuser Surface */}
            <mesh position={[0, -0.007, 0]}>
              <boxGeometry args={[0.38, 0.008, 0.62]} />
              <meshStandardMaterial
                color="#fffbeb"
                emissive="#fef9c3"
                emissiveIntensity={interiorLightsOn ? (timeOfDay === 'night' ? 2.4 : 1.1) : 0.1}
                roughness={0.15}
              />
            </mesh>
          </group>
        ))}

        {/* Individual AC Air Vent Louvers & Reading Spotlights above Each Seat Row */}
        {SEAT_ROW_AC_Z.map((zPos, idx) => (
          <group key={`ac-vent-${idx}`} position={[0, 2.58, zPos]}>
            {/* Left AC Vent Cluster */}
            <mesh position={[-0.82, 0, 0]}>
              <cylinderGeometry args={[0.036, 0.038, 0.02, 12]} />
              <meshStandardMaterial color="#1e293b" roughness={0.4} />
            </mesh>
            <mesh position={[-0.72, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.022, 0.02, 10]} />
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#0284c7"
                emissiveIntensity={interiorLightsOn ? 0.7 : 0}
              />
            </mesh>

            {/* Right AC Vent Cluster */}
            <mesh position={[0.82, 0, 0]}>
              <cylinderGeometry args={[0.036, 0.038, 0.02, 12]} />
              <meshStandardMaterial color="#1e293b" roughness={0.4} />
            </mesh>
            <mesh position={[0.72, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.022, 0.02, 10]} />
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#0284c7"
                emissiveIntensity={interiorLightsOn ? 0.7 : 0}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Interior Warm Ambient Point Lights for Rich Volumetric Interior Lighting */}
      {lightIntensity > 0 &&
        [-3.2, 0.0, 3.2].map((zPos, idx) => (
          <pointLight
            key={`cabin-light-${idx}`}
            position={[0, 2.58, zPos]}
            intensity={lightIntensity * 1.1}
            distance={7.5}
            decay={1.7}
            color="#fffbeb"
          />
        ))}
    </group>
  );
};
