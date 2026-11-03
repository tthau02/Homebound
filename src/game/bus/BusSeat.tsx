import React from 'react';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { BUS_COLORS } from '../config/busConfig';

interface BusSeatProps {
  seatId: string;
  position: [number, number, number];
  occupied: boolean;
  isHovered: boolean;
  isTargetSeat: boolean;
  onSeatClick: (seatId: string) => void;
  onSeatHover: (seatId: string | null) => void;
}

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
      {/* Dual Steel Pedestal Legs */}
      <mesh position={[-0.12, 0.14, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 0.28, 0.34]} />
        <meshStandardMaterial
          color={BUS_COLORS.seatFrameDark}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0.12, 0.14, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 0.28, 0.34]} />
        <meshStandardMaterial
          color={BUS_COLORS.seatFrameDark}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      {/* Seat Cushion Base */}
      <mesh position={[0, 0.31, -0.02]} castShadow receiveShadow>
        <boxGeometry args={[0.41, 0.1, 0.44]} />
        <meshStandardMaterial
          color={BUS_COLORS.seatLeatherCushion}
          roughness={0.42}
          metalness={0.05}
          emissive={highlightColor}
          emissiveIntensity={highlightIntensity}
        />
      </mesh>

      {/* Subtle Seat Status Indicator Ring on Cushion for Empty Hovered / Target Seats */}
      {(!occupied && (isHovered || isTargetSeat)) && (
        <mesh position={[0, 0.365, -0.03]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.1, 0.15, 20]} />
          <meshBasicMaterial
            color={isTargetSeat ? '#fbbf24' : '#34d399'}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Front Thigh Bolster */}
      <mesh
        position={[0, 0.33, -0.22]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.05, 0.05, 0.4, 12]} />
        <meshStandardMaterial
          color={BUS_COLORS.seatLeatherMain}
          roughness={0.38}
          metalness={0.05}
          emissive={highlightColor}
          emissiveIntensity={highlightIntensity}
        />
      </mesh>

      {/* Reclined Backrest Group (tilted slightly backward towards +Z) */}
      <group position={[0, 0.35, 0.17]} rotation={[-0.14, 0, 0]}>
        {/* Main Leather Backrest */}
        <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.39, 0.64, 0.09]} />
          <meshStandardMaterial
            color={BUS_COLORS.seatLeatherMain}
            roughness={0.38}
            metalness={0.06}
            emissive={highlightColor}
            emissiveIntensity={highlightIntensity * 0.8}
          />
        </mesh>

        {/* Side Bolsters on Backrest */}
        <mesh position={[-0.18, 0.34, -0.02]} castShadow>
          <boxGeometry args={[0.05, 0.58, 0.11]} />
          <meshStandardMaterial
            color={BUS_COLORS.seatLeatherCushion}
            roughness={0.4}
            metalness={0.05}
          />
        </mesh>
        <mesh position={[0.18, 0.34, -0.02]} castShadow>
          <boxGeometry args={[0.05, 0.58, 0.11]} />
          <meshStandardMaterial
            color={BUS_COLORS.seatLeatherCushion}
            roughness={0.4}
            metalness={0.05}
          />
        </mesh>

        {/* Ergonomic Headrest Cushion */}
        <mesh position={[0, 0.73, -0.015]} castShadow>
          <boxGeometry args={[0.31, 0.18, 0.1]} />
          <meshStandardMaterial
            color={occupied ? '#dc2626' : BUS_COLORS.seatHeadrest}
            roughness={0.35}
            metalness={0.05}
          />
        </mesh>

        {/* Rear Metallic Grab Handle on Top of Backrest */}
        <mesh position={[0, 0.67, 0.055]}>
          <boxGeometry args={[0.24, 0.025, 0.025]} />
          <meshStandardMaterial
            color={BUS_COLORS.metalHandrail}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Left & Right Armrests */}
      <mesh position={[-0.205, 0.49, 0.02]} castShadow>
        <boxGeometry args={[0.035, 0.04, 0.34]} />
        <meshStandardMaterial
          color={BUS_COLORS.seatFrameDark}
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>
      <mesh position={[0.205, 0.49, 0.02]} castShadow>
        <boxGeometry args={[0.035, 0.04, 0.34]} />
        <meshStandardMaterial
          color={BUS_COLORS.seatFrameDark}
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>
    </group>
  );
};
