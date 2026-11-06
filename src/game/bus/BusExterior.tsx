import React from 'react';
import { BUS_COLORS, BUS_DIMENSIONS } from '../config/busConfig';
import { useGameStore } from '../../stores/useGameStore';
import { useJourneyStore } from '../../stores/useJourneyStore';

interface BusExteriorProps {
  cutawayRoof: boolean;
}

export const BusExterior: React.FC<BusExteriorProps> = ({ cutawayRoof }) => {
  const timeOfDay = useGameStore((state) => state.timeOfDay);
  const headlightsOn = useGameStore((state) => state.headlightsOn);
  const doorOpen = useJourneyStore((state) => state.doorOpen);

  const halfW = BUS_DIMENSIONS.width / 2;
  const halfL = BUS_DIMENSIONS.length / 2;
  const isNight = timeOfDay === 'night' || headlightsOn;

  return (
    <group name="BusExterior">
      {/* Underbody Chassis Frame */}
      <mesh position={[0, 0.58, 0]} castShadow receiveShadow>
        <boxGeometry args={[BUS_DIMENSIONS.width - 0.08, 0.2, BUS_DIMENSIONS.length - 0.16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} metalness={0.3} />
      </mesh>

      {/* ==================== LEFT EXTERIOR SIDE WALL ==================== */}
      <group position={[-halfW + 0.02, 0, 0]}>
        {/* Lower Body Panel */}
        <mesh position={[0, 1.02, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.04, 0.88, BUS_DIMENSIONS.length - 0.12]} />
          <meshStandardMaterial
            color={BUS_COLORS.exteriorBodyPrimary}
            roughness={0.28}
            metalness={0.15}
          />
        </mesh>
        {/* Red Livery Stripe */}
        <mesh position={[-0.022, 1.24, 0]}>
          <boxGeometry args={[0.008, 0.22, BUS_DIMENSIONS.length - 0.1]} />
          <meshStandardMaterial
            color={BUS_COLORS.exteriorStripePrimary}
            roughness={0.3}
            metalness={0.2}
          />
        </mesh>
        {/* Gold Accent Stripe */}
        <mesh position={[-0.023, 1.08, 0]}>
          <boxGeometry args={[0.008, 0.06, BUS_DIMENSIONS.length - 0.1]} />
          <meshStandardMaterial
            color={BUS_COLORS.exteriorStripeAccent}
            roughness={0.3}
            metalness={0.3}
          />
        </mesh>
        {/* Panoramic Left Side Glass Window */}
        <mesh position={[0, 2.0, 0.1]}>
          <boxGeometry args={[0.018, 1.08, 11.4]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            transparent
            opacity={0.22}
            roughness={0.08}
            metalness={0.1}
          />
        </mesh>
      </group>

      {/* ==================== RIGHT EXTERIOR SIDE WALL & ENTRY DOOR ==================== */}
      <group position={[halfW - 0.02, 0, 0]}>
        {/* Lower Body Panel (Behind Entry Door: z = -4.1 to +6.1) */}
        <mesh position={[0, 1.02, 1.0]} castShadow receiveShadow>
          <boxGeometry args={[0.04, 0.88, 10.2]} />
          <meshStandardMaterial
            color={BUS_COLORS.exteriorBodyPrimary}
            roughness={0.28}
            metalness={0.15}
          />
        </mesh>
        {/* Front Right Corner Pillar ahead of Door (z = -6.1 to -5.35) */}
        <mesh position={[0, 1.65, -5.72]} castShadow>
          <boxGeometry args={[0.04, 2.15, 0.72]} />
          <meshStandardMaterial
            color={BUS_COLORS.exteriorBodyPrimary}
            roughness={0.28}
            metalness={0.15}
          />
        </mesh>
        {/* Red Livery Stripe (Right Side) */}
        <mesh position={[0.022, 1.24, 1.0]}>
          <boxGeometry args={[0.008, 0.22, 10.2]} />
          <meshStandardMaterial
            color={BUS_COLORS.exteriorStripePrimary}
            roughness={0.3}
            metalness={0.2}
          />
        </mesh>
        {/* Gold Accent Stripe (Right Side) */}
        <mesh position={[0.023, 1.08, 1.0]}>
          <boxGeometry args={[0.008, 0.06, 10.2]} />
          <meshStandardMaterial
            color={BUS_COLORS.exteriorStripeAccent}
            roughness={0.3}
            metalness={0.3}
          />
        </mesh>
        {/* Panoramic Right Side Glass Window */}
        <mesh position={[0, 2.0, 1.0]}>
          <boxGeometry args={[0.018, 1.08, 10.2]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            transparent
            opacity={0.22}
            roughness={0.08}
            metalness={0.1}
          />
        </mesh>

        {/* Passenger Entry Doorway (z = -5.35 to -4.15) */}
        <group position={[0, 0, -4.75]}>
          {/* Door Frame Pillars */}
          <mesh position={[0, 1.62, -0.58]}>
            <boxGeometry args={[0.06, 2.18, 0.06]} />
            <meshStandardMaterial color={BUS_COLORS.windowFrameMetal} metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 1.62, 0.58]}>
            <boxGeometry args={[0.06, 2.18, 0.06]} />
            <meshStandardMaterial color={BUS_COLORS.windowFrameMetal} metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Glass Entry Door Leaf (Animated Sliding Open/Close) */}
          <group position={[0.01, 1.62, doorOpen ? 1.05 : 0]}>
            <mesh>
              <boxGeometry args={[0.022, 2.1, 1.1]} />
              <meshPhysicalMaterial
                color="#7dd3fc"
                transparent
                opacity={0.32}
                roughness={0.1}
                metalness={0.15}
              />
            </mesh>
            {/* Door Metallic Horizontal Handle Bar */}
            <mesh position={[-0.03, -0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.016, 0.016, 0.96, 10]} />
              <meshStandardMaterial
                color={BUS_COLORS.metalHandrail}
                metalness={0.85}
                roughness={0.2}
              />
            </mesh>
          </group>
          {/* Entry Stairwell Steps */}
          <mesh position={[-0.22, 0.52, 0]} receiveShadow>
            <boxGeometry args={[0.44, 0.06, 1.12]} />
            <meshStandardMaterial color="#334155" roughness={0.7} />
          </mesh>
          <mesh position={[-0.36, 0.62, 0]} receiveShadow>
            <boxGeometry args={[0.28, 0.06, 1.12]} />
            <meshStandardMaterial color="#475569" roughness={0.7} />
          </mesh>
        </group>
      </group>

      {/* ==================== FRONT NOSE, WINDSHIELD & HEADLIGHTS ==================== */}
      <group position={[0, 0, -halfL]}>
        {/* Lower Front Nose & Bumper */}
        <mesh position={[0, 0.96, 0.08]} castShadow receiveShadow>
          <boxGeometry args={[BUS_DIMENSIONS.width - 0.04, 0.88, 0.22]} />
          <meshStandardMaterial
            color={BUS_COLORS.exteriorBodyPrimary}
            roughness={0.25}
            metalness={0.15}
          />
        </mesh>
        {/* Front Red Accent Band */}
        <mesh position={[0, 1.24, -0.02]}>
          <boxGeometry args={[BUS_DIMENSIONS.width - 0.02, 0.22, 0.04]} />
          <meshStandardMaterial color={BUS_COLORS.exteriorStripePrimary} roughness={0.3} />
        </mesh>
        {/* Dark Lower Spoiler Bumper & Grille */}
        <mesh position={[0, 0.62, -0.02]} castShadow>
          <boxGeometry args={[BUS_DIMENSIONS.width, 0.28, 0.16]} />
          <meshStandardMaterial color={BUS_COLORS.exteriorBumper} roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Front License Plate */}
        <mesh position={[0, 0.62, -0.105]}>
          <boxGeometry args={[0.52, 0.13, 0.015]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>

        {/* Front Corner A-Pillars */}
        <mesh position={[-halfW + 0.06, 2.04, 0.12]} rotation={[0.08, 0, 0]} castShadow>
          <boxGeometry args={[0.12, 1.32, 0.12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.5} />
        </mesh>
        <mesh position={[halfW - 0.06, 2.04, 0.12]} rotation={[0.08, 0, 0]} castShadow>
          <boxGeometry args={[0.12, 1.32, 0.12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.5} />
        </mesh>

        {/* Panoramic Front Windshield Glass */}
        <mesh position={[0, 2.02, 0.11]} rotation={[0.06, 0, 0]}>
          <boxGeometry args={[BUS_DIMENSIONS.width - 0.2, 1.26, 0.025]} />
          <meshPhysicalMaterial
            color="#bae6fd"
            transparent
            opacity={0.22}
            roughness={0.06}
            metalness={0.1}
          />
        </mesh>

        {/* Dual Windshield Wipers */}
        <mesh position={[-0.55, 1.44, 0.05]} rotation={[0, 0, -0.18]}>
          <boxGeometry args={[0.72, 0.025, 0.02]} />
          <meshStandardMaterial color="#09090b" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[0.45, 1.44, 0.05]} rotation={[0, 0, -0.18]}>
          <boxGeometry args={[0.72, 0.025, 0.02]} />
          <meshStandardMaterial color="#09090b" roughness={0.4} metalness={0.6} />
        </mesh>

        {/* Aerodynamic Coach Side Mirrors (Left & Right) */}
        <group position={[-halfW - 0.16, 2.15, 0.25]}>
          <mesh position={[0.1, 0.12, -0.12]} rotation={[0, 0, -0.4]}>
            <cylinderGeometry args={[0.02, 0.02, 0.32, 8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.05, -0.18]} castShadow>
            <boxGeometry args={[0.12, 0.34, 0.1]} />
            <meshStandardMaterial color={BUS_COLORS.exteriorStripePrimary} roughness={0.3} />
          </mesh>
        </group>
        <group position={[halfW + 0.16, 2.15, 0.25]}>
          <mesh position={[-0.1, 0.12, -0.12]} rotation={[0, 0, 0.4]}>
            <cylinderGeometry args={[0.02, 0.02, 0.32, 8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.05, -0.18]} castShadow>
            <boxGeometry args={[0.12, 0.34, 0.1]} />
            <meshStandardMaterial color={BUS_COLORS.exteriorStripePrimary} roughness={0.3} />
          </mesh>
        </group>

        {/* Left & Right LED Headlight Clusters */}
        {[-1.02, 1.02].map((xPos, idx) => (
          <group key={`headlight-${idx}`} position={[xPos, 0.92, -0.03]}>
            <mesh>
              <boxGeometry args={[0.46, 0.2, 0.04]} />
              <meshStandardMaterial
                color="#fef9c3"
                emissive="#fef08a"
                emissiveIntensity={isNight ? 3.5 : 0.6}
              />
            </mesh>
            {/* Lower Fog Lamp */}
            <mesh position={[0, -0.22, -0.05]}>
              <boxGeometry args={[0.24, 0.09, 0.03]} />
              <meshStandardMaterial
                color="#fde047"
                emissive="#facc15"
                emissiveIntensity={isNight ? 2.5 : 0.3}
              />
            </mesh>
          </group>
        ))}

        {/* Night Mode Headlight Illumination & Volumetric Light Cones */}
        {isNight && (
          <group position={[0, 0.9, -0.1]}>
            <pointLight
              position={[0, 0.2, -3.5]}
              intensity={3.2}
              distance={28}
              decay={1.5}
              color="#fef9c3"
            />
            <mesh position={[-1.0, -0.35, -7.5]} rotation={[Math.PI / 2 + 0.04, 0, 0]}>
              <coneGeometry args={[2.1, 14.5, 20, 1, true]} />
              <meshBasicMaterial
                color="#fef08a"
                transparent
                opacity={0.09}
                depthWrite={false}
              />
            </mesh>
            <mesh position={[1.0, -0.35, -7.5]} rotation={[Math.PI / 2 + 0.04, 0, 0]}>
              <coneGeometry args={[2.1, 14.5, 20, 1, true]} />
              <meshBasicMaterial
                color="#fef08a"
                transparent
                opacity={0.09}
                depthWrite={false}
              />
            </mesh>
          </group>
        )}
      </group>

      {/* ==================== REAR TAIL, TAILLIGHTS & ENGINE BAY ==================== */}
      <group position={[0, 0, halfL]}>
        {/* Lower & Middle Rear Body */}
        <mesh position={[0, 1.18, -0.08]} castShadow receiveShadow>
          <boxGeometry args={[BUS_DIMENSIONS.width - 0.04, 1.32, 0.16]} />
          <meshStandardMaterial
            color={BUS_COLORS.exteriorBodyPrimary}
            roughness={0.28}
            metalness={0.15}
          />
        </mesh>
        {/* Rear Red Livery Band */}
        <mesh position={[0, 1.48, 0.01]}>
          <boxGeometry args={[BUS_DIMENSIONS.width - 0.02, 0.28, 0.02]} />
          <meshStandardMaterial color={BUS_COLORS.exteriorStripePrimary} roughness={0.3} />
        </mesh>
        {/* Engine Ventilation Grille */}
        <mesh position={[0, 1.02, 0.01]}>
          <boxGeometry args={[1.45, 0.42, 0.03]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.4} />
        </mesh>
        {/* Rear Dark Bumper */}
        <mesh position={[0, 0.6, 0.03]} castShadow>
          <boxGeometry args={[BUS_DIMENSIONS.width, 0.26, 0.14]} />
          <meshStandardMaterial color={BUS_COLORS.exteriorBumper} roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Rear License Plate */}
        <mesh position={[0, 0.62, 0.105]}>
          <boxGeometry args={[0.52, 0.13, 0.015]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#fef08a"
            emissiveIntensity={isNight ? 0.5 : 0.1}
          />
        </mesh>
        {/* Rear Upper Pillars */}
        <mesh position={[-halfW + 0.12, 2.2, -0.08]} castShadow>
          <boxGeometry args={[0.24, 0.82, 0.16]} />
          <meshStandardMaterial color={BUS_COLORS.exteriorBodyPrimary} roughness={0.3} />
        </mesh>
        <mesh position={[halfW - 0.12, 2.2, -0.08]} castShadow>
          <boxGeometry args={[0.24, 0.82, 0.16]} />
          <meshStandardMaterial color={BUS_COLORS.exteriorBodyPrimary} roughness={0.3} />
        </mesh>
        {/* Rear Window Glass */}
        <mesh position={[0, 2.2, -0.05]}>
          <boxGeometry args={[BUS_DIMENSIONS.width - 0.48, 0.72, 0.02]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            transparent
            opacity={0.25}
            roughness={0.1}
          />
        </mesh>

        {/* Left & Right Rear Taillight Clusters (Red Brake + Amber Indicator) */}
        {[-1.08, 1.08].map((xPos, idx) => (
          <group key={`taillight-${idx}`} position={[xPos, 1.12, 0.015]}>
            {/* Main Red LED Brake/Tail Lamp */}
            <mesh position={[0, 0.08, 0]}>
              <boxGeometry args={[0.38, 0.24, 0.03]} />
              <meshStandardMaterial
                color="#ef4444"
                emissive="#dc2626"
                emissiveIntensity={isNight ? 3.2 : 1.2}
              />
            </mesh>
            {/* Amber Turn Signal Bar */}
            <mesh position={[0, -0.12, 0]}>
              <boxGeometry args={[0.38, 0.1, 0.03]} />
              <meshStandardMaterial
                color="#f59e0b"
                emissive="#d97706"
                emissiveIntensity={isNight ? 2.0 : 0.7}
              />
            </mesh>
          </group>
        ))}

        {/* Rear Taillight Glow at Night */}
        {isNight && (
          <pointLight
            position={[0, 1.1, 0.85]}
            intensity={1.1}
            distance={6.5}
            decay={2}
            color="#ef4444"
          />
        )}
      </group>

      {/* ==================== CUTAWAY-AWARE EXTERIOR ROOF & CANT RAILS ==================== */}
      <group name="BusExteriorRoof" visible={!cutawayRoof}>
        {/* Upper Side Cant Rails above Windows */}
        <mesh position={[-halfW + 0.03, 2.72, 0]} castShadow>
          <boxGeometry args={[0.06, 0.36, BUS_DIMENSIONS.length - 0.08]} />
          <meshStandardMaterial color={BUS_COLORS.exteriorBodyPrimary} roughness={0.28} />
        </mesh>
        <mesh position={[halfW - 0.03, 2.72, 0]} castShadow>
          <boxGeometry args={[0.06, 0.36, BUS_DIMENSIONS.length - 0.08]} />
          <meshStandardMaterial color={BUS_COLORS.exteriorBodyPrimary} roughness={0.28} />
        </mesh>

        {/* Front Upper Forehead Cap & LED Destination Signboard */}
        <mesh position={[0, 2.78, -halfL + 0.12]} castShadow>
          <boxGeometry args={[BUS_DIMENSIONS.width - 0.04, 0.36, 0.24]} />
          <meshStandardMaterial color={BUS_COLORS.exteriorBodyPrimary} roughness={0.28} />
        </mesh>
        {/* Glowing Front Destination LED Matrix */}
        <mesh position={[0, 2.76, -halfL - 0.005]}>
          <boxGeometry args={[1.55, 0.2, 0.02]} />
          <meshStandardMaterial
            color="#1e293b"
            emissive="#f59e0b"
            emissiveIntensity={1.6}
          />
        </mesh>

        {/* Rear Upper Roof Spoiler Cap */}
        <mesh position={[0, 2.78, halfL - 0.1]} castShadow>
          <boxGeometry args={[BUS_DIMENSIONS.width - 0.04, 0.36, 0.24]} />
          <meshStandardMaterial color={BUS_COLORS.exteriorStripePrimary} roughness={0.3} />
        </mesh>
        {/* High-Mount Third Brake Light Bar */}
        <mesh position={[0, 2.86, halfL + 0.025]}>
          <boxGeometry args={[0.95, 0.05, 0.02]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#dc2626"
            emissiveIntensity={2.8}
          />
        </mesh>

        {/* Main Exterior Roof Crown */}
        <mesh position={[0, 2.98, 0]} castShadow receiveShadow>
          <boxGeometry args={[BUS_DIMENSIONS.width - 0.12, 0.14, BUS_DIMENSIONS.length - 0.16]} />
          <meshStandardMaterial
            color={BUS_COLORS.exteriorBodyPrimary}
            roughness={0.32}
            metalness={0.12}
          />
        </mesh>

        {/* Rooftop HVAC Air Conditioning Pod */}
        <mesh position={[0, 3.12, -0.3]} castShadow receiveShadow>
          <boxGeometry args={[1.65, 0.18, 3.8]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.35} metalness={0.2} />
        </mesh>
      </group>
    </group>
  );
};

