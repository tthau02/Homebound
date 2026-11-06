import React from 'react';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

interface BusSeatProps {
  seatId: string;
  position: [number, number, number];
  occupied: boolean;
  isHovered: boolean;
  isTargetSeat: boolean;
  onSeatClick: (seatId: string) => void;
  onSeatHover: (seatId: string | null) => void;
}

const LUXURY_PALETTE = {
  leatherPrimary: '#9a5626',      // Rich cognac saddle leather
  leatherCushion: '#7c3f18',      // Quilted darker inset leather
  pipingIvory: '#fef3c7',         // Contrast cream edge piping
  headrestCloth: '#f8fafc',       // Clean white embroidered headrest cover
  seatShellDark: '#1c1917',       // Molded composite seat shell
  metalFrame: '#475569',          // Brushed titanium/steel frame
  metalChrome: '#94a3b8',         // Polished chrome accents
  screenBezel: '#09090b',         // Glossy black LCD frame
  screenDisplay: '#0f172a',       // Active LCD panel
  meshPocket: '#292524',          // Magazine netting
} as const;

export const BusSeat: React.FC<BusSeatProps> = ({
  seatId,
  position,
  occupied,
  isHovered,
  isTargetSeat,
  onSeatClick,
  onSeatHover,
}) => {
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSeatClick(seatId);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onSeatHover(seatId);
    document.body.style.cursor = occupied ? 'not-allowed' : 'pointer';
  };

  const handlePointerOut = () => {
    onSeatHover(null);
    document.body.style.cursor = 'auto';
  };

  const highlightColor = isTargetSeat
    ? '#f59e0b'
    : isHovered
      ? occupied
        ? '#ef4444'
        : '#10b981'
      : '#000000';

  const highlightIntensity = isTargetSeat || isHovered ? 0.35 : 0;

  return (
    <group
      position={position}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Dual Sculpted Metallic Pedestal Legs */}
      <mesh position={[-0.13, 0.14, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.035, 0.28, 0.32]} />
        <meshStandardMaterial
          color={LUXURY_PALETTE.metalFrame}
          metalness={0.7}
          roughness={0.35}
        />
      </mesh>
      <mesh position={[0.13, 0.14, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.035, 0.28, 0.32]} />
        <meshStandardMaterial
          color={LUXURY_PALETTE.metalFrame}
          metalness={0.7}
          roughness={0.35}
        />
      </mesh>

      {/* Under-seat Footrest Rail */}
      <mesh position={[0, 0.08, -0.16]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.34, 10]} />
        <meshStandardMaterial color={LUXURY_PALETTE.metalChrome} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Seat Base Shell */}
      <mesh position={[0, 0.27, -0.01]} castShadow receiveShadow>
        <boxGeometry args={[0.43, 0.05, 0.46]} />
        <meshStandardMaterial color={LUXURY_PALETTE.seatShellDark} roughness={0.6} />
      </mesh>

      {/* Thick Ergonomic Seat Cushion */}
      <mesh position={[0, 0.32, -0.01]} castShadow receiveShadow>
        <boxGeometry args={[0.41, 0.085, 0.44]} />
        <meshStandardMaterial
          color={LUXURY_PALETTE.leatherPrimary}
          roughness={0.42}
          metalness={0.06}
          emissive={highlightColor}
          emissiveIntensity={highlightIntensity}
        />
      </mesh>

      {/* Quilted Center Seat Inset */}
      <mesh position={[0, 0.335, -0.01]}>
        <boxGeometry args={[0.27, 0.06, 0.4]} />
        <meshStandardMaterial
          color={LUXURY_PALETTE.leatherCushion}
          roughness={0.55}
          metalness={0.04}
        />
      </mesh>

      {/* Front Thigh Support Bolster */}
      <mesh position={[0, 0.33, -0.22]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.39, 12]} />
        <meshStandardMaterial
          color={LUXURY_PALETTE.leatherPrimary}
          roughness={0.4}
          metalness={0.05}
        />
      </mesh>

      {/* Subtle Target Seat Indicator Ring */}
      {(!occupied && (isHovered || isTargetSeat)) && (
        <mesh position={[0, 0.37, -0.02]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.09, 0.14, 24]} />
          <meshBasicMaterial
            color={isTargetSeat ? '#fbbf24' : '#34d399'}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* ==================== RECLINED BACKREST ==================== */}
      <group position={[0, 0.35, 0.17]} rotation={[-0.13, 0, 0]}>
        {/* Molded Outer Back Shell */}
        <mesh position={[0, 0.35, 0.02]} castShadow receiveShadow>
          <boxGeometry args={[0.43, 0.68, 0.07]} />
          <meshStandardMaterial color={LUXURY_PALETTE.seatShellDark} roughness={0.5} />
        </mesh>

        {/* Main Leather Back Cushion */}
        <mesh position={[0, 0.34, -0.02]} castShadow receiveShadow>
          <boxGeometry args={[0.39, 0.64, 0.07]} />
          <meshStandardMaterial
            color={LUXURY_PALETTE.leatherPrimary}
            roughness={0.42}
            metalness={0.05}
            emissive={highlightColor}
            emissiveIntensity={highlightIntensity * 0.7}
          />
        </mesh>

        {/* Quilted Center Backrest Spine */}
        <mesh position={[0, 0.34, -0.035]}>
          <boxGeometry args={[0.25, 0.6, 0.05]} />
          <meshStandardMaterial
            color={LUXURY_PALETTE.leatherCushion}
            roughness={0.55}
          />
        </mesh>

        {/* Ergonomic Lateral Wing Bolsters (Left & Right) */}
        <mesh position={[-0.185, 0.34, -0.035]} castShadow>
          <boxGeometry args={[0.045, 0.58, 0.08]} />
          <meshStandardMaterial color={LUXURY_PALETTE.leatherPrimary} roughness={0.4} />
        </mesh>
        <mesh position={[0.185, 0.34, -0.035]} castShadow>
          <boxGeometry args={[0.045, 0.58, 0.08]} />
          <meshStandardMaterial color={LUXURY_PALETTE.leatherPrimary} roughness={0.4} />
        </mesh>

        {/* ==================== LUXURY HEADREST ==================== */}
        <group position={[0, 0.73, -0.02]}>
          {/* Curved Headrest Leather Core */}
          <mesh castShadow>
            <boxGeometry args={[0.32, 0.18, 0.09]} />
            <meshStandardMaterial color={LUXURY_PALETTE.leatherPrimary} roughness={0.38} />
          </mesh>
          {/* Headrest Lateral Wing Pillows */}
          <mesh position={[-0.155, 0, -0.02]}>
            <boxGeometry args={[0.04, 0.16, 0.06]} />
            <meshStandardMaterial color={LUXURY_PALETTE.leatherCushion} roughness={0.45} />
          </mesh>
          <mesh position={[0.155, 0, -0.02]}>
            <boxGeometry args={[0.04, 0.16, 0.06]} />
            <meshStandardMaterial color={LUXURY_PALETTE.leatherCushion} roughness={0.45} />
          </mesh>
          {/* Embroidered Hygienic Antimacassar Cover (White Fabric) */}
          <mesh position={[0, 0.01, -0.05]}>
            <boxGeometry args={[0.25, 0.15, 0.015]} />
            <meshStandardMaterial color={LUXURY_PALETTE.headrestCloth} roughness={0.85} />
          </mesh>
          {/* Embroidered Gold Crest Accent on Cloth */}
          <mesh position={[0, 0.02, -0.059]}>
            <planeGeometry args={[0.08, 0.04]} />
            <meshStandardMaterial color="#d97706" roughness={0.3} metalness={0.6} />
          </mesh>
        </group>

        {/* ==================== SEATBACK ENTERTAINMENT & DETAILS ==================== */}
        {/* Seen clearly by passengers sitting in the row behind! */}
        {/* In-Seat LCD Touchscreen Monitor */}
        <mesh position={[0, 0.48, 0.06]}>
          <boxGeometry args={[0.26, 0.16, 0.02]} />
          <meshStandardMaterial color={LUXURY_PALETTE.screenBezel} roughness={0.2} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.48, 0.071]}>
          <planeGeometry args={[0.24, 0.14]} />
          <meshStandardMaterial
            color="#0284c7"
            emissive="#0369a1"
            emissiveIntensity={0.65}
            roughness={0.25}
          />
        </mesh>

        {/* Fold-down Food/Laptop Tray Table */}
        <mesh position={[0, 0.28, 0.06]}>
          <boxGeometry args={[0.34, 0.18, 0.025]} />
          <meshStandardMaterial color="#1e293b" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.36, 0.072]}>
          <cylinderGeometry args={[0.012, 0.012, 0.03, 10]} />
          <meshStandardMaterial color={LUXURY_PALETTE.metalChrome} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Mesh Magazine / Snack Pocket */}
        <mesh position={[0, 0.09, 0.065]}>
          <boxGeometry args={[0.32, 0.14, 0.02]} />
          <meshStandardMaterial color={LUXURY_PALETTE.meshPocket} roughness={0.9} />
        </mesh>

        {/* USB Charging Port with subtle cyan glow */}
        <mesh position={[-0.13, 0.38, 0.065]}>
          <boxGeometry args={[0.025, 0.018, 0.01]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.8} />
        </mesh>

        {/* Top Metallic Grab Handle */}
        <mesh position={[0, 0.69, 0.06]}>
          <boxGeometry args={[0.24, 0.025, 0.025]} />
          <meshStandardMaterial color={LUXURY_PALETTE.metalChrome} metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Padded Left & Right Armrests with Recline Latch */}
      <group position={[-0.21, 0.49, 0.02]}>
        <mesh castShadow>
          <boxGeometry args={[0.04, 0.045, 0.34]} />
          <meshStandardMaterial color={LUXURY_PALETTE.seatShellDark} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.025, 0]}>
          <boxGeometry args={[0.036, 0.015, 0.32]} />
          <meshStandardMaterial color={LUXURY_PALETTE.leatherPrimary} roughness={0.5} />
        </mesh>
      </group>

      <group position={[0.21, 0.49, 0.02]}>
        <mesh castShadow>
          <boxGeometry args={[0.04, 0.045, 0.34]} />
          <meshStandardMaterial color={LUXURY_PALETTE.seatShellDark} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.025, 0]}>
          <boxGeometry args={[0.036, 0.015, 0.32]} />
          <meshStandardMaterial color={LUXURY_PALETTE.leatherPrimary} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
};
