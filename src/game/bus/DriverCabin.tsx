import React from 'react';
import { BUS_COLORS, BUS_DIMENSIONS } from '../config/busConfig';

export const DriverCabin: React.FC = () => {
  const floorY = BUS_DIMENSIONS.floorY;

  return (
    <group position={[0, floorY, 0]}>
      {/* Raised Driver Platform */}
      <mesh position={[-0.68, 0.06, -4.95]} receiveShadow>
        <boxGeometry args={[1.18, 0.12, 1.75]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* Wrap-around Front Dashboard Console */}
      <group position={[0, 0, -5.68]}>
        {/* Main Left & Center Dashboard Body */}
        <mesh position={[-0.32, 0.52, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.92, 0.68, 0.58]} />
          <meshStandardMaterial color={BUS_COLORS.dashboardDark} roughness={0.6} metalness={0.2} />
        </mesh>

        {/* Dashboard Upper Hood over Instrument Cluster */}
        <mesh position={[-0.72, 0.91, 0.05]} castShadow>
          <boxGeometry args={[0.72, 0.14, 0.42]} />
          <meshStandardMaterial color="#09090b" roughness={0.5} />
        </mesh>

        {/* Glowing Digital Instrument Cluster (Speedometer & RPM) */}
        <mesh position={[-0.72, 0.87, 0.265]} rotation={[-0.25, 0, 0]}>
          <planeGeometry args={[0.56, 0.16]} />
          <meshStandardMaterial
            color="#0ea5e9"
            emissive="#0284c7"
            emissiveIntensity={1.4}
            roughness={0.2}
          />
        </mesh>

        {/* Central Infotainment / GPS Navigation Screen */}
        <mesh position={[-0.08, 0.92, 0.22]} rotation={[-0.18, 0.15, 0]}>
          <boxGeometry args={[0.38, 0.24, 0.04]} />
          <meshStandardMaterial color="#09090b" roughness={0.3} metalness={0.5} />
        </mesh>
        <mesh position={[-0.08, 0.92, 0.242]} rotation={[-0.18, 0.15, 0]}>
          <planeGeometry args={[0.34, 0.2]} />
          <meshStandardMaterial
            color="#10b981"
            emissive="#059669"
            emissiveIntensity={1.1}
            roughness={0.2}
          />
        </mesh>

        {/* Steering Column & Wheel */}
        <group position={[-0.72, 0.82, 0.36]} rotation={[0.55, 0, 0]}>
          {/* Column Shaft */}
          <mesh position={[0, -0.14, 0]}>
            <cylinderGeometry args={[0.045, 0.055, 0.34, 12]} />
            <meshStandardMaterial color="#27272a" metalness={0.5} roughness={0.4} />
          </mesh>
          {/* Steering Wheel Rim */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.22, 0.024, 12, 28]} />
            <meshStandardMaterial color="#18181b" roughness={0.4} metalness={0.3} />
          </mesh>
          {/* Steering Center Hub */}
          <mesh>
            <cylinderGeometry args={[0.065, 0.065, 0.04, 14]} />
            <meshStandardMaterial color="#27272a" roughness={0.5} />
          </mesh>
        </group>

        {/* Gear Shifter Stalk */}
        <group position={[-0.28, 0.78, 0.34]}>
          <mesh position={[0, 0.1, 0]} rotation={[0.2, 0, -0.1]}>
            <cylinderGeometry args={[0.016, 0.02, 0.24, 8]} />
            <meshStandardMaterial color="#52525b" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[-0.02, 0.22, 0.04]}>
            <sphereGeometry args={[0.038, 12, 12]} />
            <meshStandardMaterial color="#18181b" roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* Driver Seat & Seated Driver Figure */}
      <group position={[-0.72, 0.12, -4.72]}>
        {/* Suspension Pedestal */}
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.12, 0.15, 0.3, 12]} />
          <meshStandardMaterial color="#18181b" roughness={0.6} />
        </mesh>
        {/* Driver Seat Base */}
        <mesh position={[0, 0.32, -0.02]} castShadow>
          <boxGeometry args={[0.46, 0.11, 0.46]} />
          <meshStandardMaterial color="#27272a" roughness={0.45} />
        </mesh>
        {/* Driver Seat Backrest */}
        <mesh position={[0, 0.68, 0.18]} rotation={[-0.1, 0, 0]} castShadow>
          <boxGeometry args={[0.44, 0.68, 0.1]} />
          <meshStandardMaterial color="#27272a" roughness={0.45} />
        </mesh>
        {/* Driver Headrest */}
        <mesh position={[0, 1.08, 0.21]} castShadow>
          <boxGeometry args={[0.28, 0.18, 0.09]} />
          <meshStandardMaterial color={BUS_COLORS.seatLeatherMain} roughness={0.4} />
        </mesh>

        {/* Driver Figure */}
        <group position={[0, 0.37, 0]}>
          {/* Driver Torso (White Uniform Shirt & Tie) */}
          <mesh position={[0, 0.32, 0.03]} castShadow>
            <boxGeometry args={[0.34, 0.46, 0.2]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
          </mesh>
          {/* Driver Head */}
          <mesh position={[0, 0.69, 0.03]} castShadow>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#f1c27d" roughness={0.45} />
          </mesh>
          {/* Driver Hair */}
          <mesh position={[0, 0.73, 0.04]}>
            <sphereGeometry args={[0.123, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* Modesty Partition Wall & Metallic Handrail behind Driver Cabin */}
      <group position={[-0.78, 0, -4.02]}>
        {/* Lower Partition Panel */}
        <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.92, 0.96, 0.05]} />
          <meshStandardMaterial color={BUS_COLORS.wallLowerPanel} roughness={0.5} />
        </mesh>
        {/* Tinted Glass Upper Partition */}
        <mesh position={[0, 1.24, 0]}>
          <boxGeometry args={[0.86, 0.52, 0.025]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            transparent
            opacity={0.28}
            roughness={0.1}
            metalness={0.1}
          />
        </mesh>
        {/* Vertical Metallic Handrail Stanchion */}
        <mesh position={[0.45, 1.05, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.022, 2.1, 12]} />
          <meshStandardMaterial
            color={BUS_COLORS.metalHandrail}
            metalness={0.85}
            roughness={0.18}
          />
        </mesh>
        {/* Horizontal Chrome Guard Rail */}
        <mesh position={[0, 0.98, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.9, 12]} />
          <meshStandardMaterial
            color={BUS_COLORS.metalHandrail}
            metalness={0.85}
            roughness={0.18}
          />
        </mesh>
      </group>

      {/* Front Right Entry Stairwell Guard Rail */}
      <group position={[0.78, 0, -4.02]}>
        <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.92, 0.96, 0.05]} />
          <meshStandardMaterial color={BUS_COLORS.wallLowerPanel} roughness={0.5} />
        </mesh>
        <mesh position={[-0.45, 1.05, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.022, 2.1, 12]} />
          <meshStandardMaterial
            color={BUS_COLORS.metalHandrail}
            metalness={0.85}
            roughness={0.18}
          />
        </mesh>
        <mesh position={[0, 0.98, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.9, 12]} />
          <meshStandardMaterial
            color={BUS_COLORS.metalHandrail}
            metalness={0.85}
            roughness={0.18}
          />
        </mesh>
      </group>
    </group>
  );
};

