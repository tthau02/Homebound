import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useJourneyStore } from '../../stores/useJourneyStore';
import { useGameStore } from '../../stores/useGameStore';

export const StationPlatform: React.FC = () => {
  const groupRef = useRef<THREE.Group | null>(null);
  const timeOfDay = useGameStore((state) => state.timeOfDay);
  const isNight = timeOfDay === 'night';

  useFrame((_, rawDelta) => {
    if (!groupRef.current) return;
    const delta = Math.min(rawDelta, 0.1);
    const journey = useJourneyStore.getState();

    // In station or completed: perfectly docked at z = 0
    if (journey.stage === 'at_station' || journey.stage === 'completed') {
      groupRef.current.position.z = THREE.MathUtils.lerp(
        groupRef.current.position.z,
        0,
        1 - Math.exp(-8 * delta)
      );
      groupRef.current.visible = true;
    } else if (journey.stage === 'approaching') {
      // Gliding into boarding position as bus decelerates
      const targetZ = -journey.distanceToNextStopKm * 28;
      groupRef.current.position.z = THREE.MathUtils.lerp(
        groupRef.current.position.z,
        targetZ,
        1 - Math.exp(-5 * delta)
      );
      groupRef.current.visible = true;
    } else {
      // In transit on highway: station stays far ahead or gently loops out of immediate view
      groupRef.current.position.z = -120;
      groupRef.current.visible = journey.distanceToNextStopKm < 4.0;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -120]} name="StationPlatform">
      {/* ==================== 1. CONCRETE PASSENGER PLATFORM ==================== */}
      {/* Raised sidewalk curb & pavement */}
      <mesh position={[8.2, 0.1, 0]} receiveShadow>
        <boxGeometry args={[13.2, 0.22, 28]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.7} />
      </mesh>

      {/* Safety Yellow Boarding Line along curb edge */}
      <mesh position={[1.65, 0.215, 0]}>
        <boxGeometry args={[0.22, 0.01, 27.8]} />
        <meshStandardMaterial
          color="#facc15"
          roughness={0.4}
          emissive="#eab308"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Yellow Bus Stop Bay Demarcation Box on Road */}
      <mesh position={[0.7, 0.015, -4.75]}>
        <boxGeometry args={[1.6, 0.005, 11]} />
        <meshStandardMaterial color="#facc15" roughness={0.5} />
      </mesh>

      {/* Tactile Paver Warning Strip */}
      <mesh position={[2.2, 0.214, 0]}>
        <boxGeometry args={[0.4, 0.008, 27.5]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.8} />
      </mesh>

      {/* ==================== 2. MAIN WAITING TERMINAL CANOPY ==================== */}
      <group position={[8.5, 0.2, 0]}>
        {/* Steel Support Pillars */}
        {[-8, -2.5, 2.5, 8].map((zP, idx) => (
          <group key={`plat-pillar-${idx}`} position={[0, 0, zP]}>
            <mesh position={[-3.2, 1.8, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.1, 3.6, 12]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[3.2, 1.8, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.1, 3.6, 12]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        ))}

        {/* Curved Glass / Polycarbonate Modern Canopy Roof */}
        <mesh position={[0, 3.65, 0]} castShadow>
          <boxGeometry args={[7.8, 0.18, 18.5]} />
          <meshStandardMaterial color="#0284c7" roughness={0.25} metalness={0.3} />
        </mesh>
        <mesh position={[0, 3.75, 0]} castShadow>
          <boxGeometry args={[7.4, 0.12, 18.1]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.15} metalness={0.5} />
        </mesh>

        {/* Illuminated Station Name Signboard */}
        <group position={[-3.6, 3.2, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.22, 0.8, 10.5]} />
            <meshStandardMaterial
              color="#dc2626"
              emissive="#b91c1c"
              emissiveIntensity={isNight ? 1.5 : 0.4}
            />
          </mesh>
          <mesh position={[-0.12, 0, 0]}>
            <boxGeometry args={[0.02, 0.65, 10.1]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#facc15"
              emissiveIntensity={isNight ? 2.4 : 0.8}
            />
          </mesh>
        </group>

        {/* Waiting Benches for Passengers */}
        {[-4.5, 4.5].map((zB, idx) => (
          <group key={`plat-bench-${idx}`} position={[-1.2, 0, zB]}>
            {/* Bench Seat Surface */}
            <mesh position={[0, 0.45, 0]} castShadow>
              <boxGeometry args={[0.7, 0.08, 2.6]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Backrest */}
            <mesh position={[0.32, 0.75, 0]} castShadow>
              <boxGeometry args={[0.06, 0.45, 2.6]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Legs */}
            <mesh position={[-0.25, 0.22, -1.0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.44, 8]} />
              <meshStandardMaterial color="#475569" metalness={0.8} />
            </mesh>
            <mesh position={[-0.25, 0.22, 1.0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.44, 8]} />
              <meshStandardMaterial color="#475569" metalness={0.8} />
            </mesh>
          </group>
        ))}

        {/* Waiting NPC Passenger Figure sitting at Station */}
        <group position={[-1.2, 0.48, -4.5]} rotation={[0, Math.PI / 2, 0]}>
          {/* Sitting Torso */}
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[0.26, 0.36, 0.18]} />
            <meshStandardMaterial color="#0284c7" roughness={0.6} />
          </mesh>
          {/* Head & Hair */}
          <mesh position={[0, 0.52, 0]} castShadow>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial color="#fed7aa" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.56, 0.02]}>
            <sphereGeometry args={[0.105, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial color="#18181b" roughness={0.7} />
          </mesh>
          {/* Resting Legs */}
          <mesh position={[-0.06, -0.05, 0.12]}>
            <boxGeometry args={[0.08, 0.24, 0.1]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0.06, -0.05, 0.12]}>
            <boxGeometry args={[0.08, 0.24, 0.1]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      </group>

      {/* ==================== 3. QUÁN NƯỚC MÍA & TRÀ ĐÁ MIỀN TÂY ==================== */}
      <group position={[4.6, 0.2, -1.8]}>
        {/* Sugarcane Cart Base */}
        <mesh position={[0, 0.52, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.85, 2.2]} />
          <meshStandardMaterial color="#059669" roughness={0.4} />
        </mesh>
        {/* Stainless Steel Counter Top */}
        <mesh position={[0, 0.96, 0]} castShadow>
          <boxGeometry args={[1.58, 0.06, 2.28]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Sugarcane Press Roller Machine (Máy ép mía inox) */}
        <group position={[0.2, 1.25, 0.4]}>
          <mesh castShadow>
            <boxGeometry args={[0.45, 0.52, 0.5]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 0.1, 16]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>
        </group>

        {/* Fresh Green Sugarcane Stalks in Basket (Bó mía lau) */}
        <group position={[-0.4, 1.35, -0.6]} rotation={[0.1, 0, 0.15]}>
          {[-0.08, 0, 0.08].map((xStalk, idx) => (
            <mesh key={`cane-${idx}`} position={[xStalk, 0, 0]} castShadow>
              <cylinderGeometry args={[0.03, 0.032, 1.1, 8]} />
              <meshStandardMaterial color="#84cc16" roughness={0.6} />
            </mesh>
          ))}
        </group>

        {/* Authentic Striped Beach Umbrella (Dù che bạt đỏ vàng) */}
        <group position={[0.2, 0, -0.2]}>
          <mesh position={[0, 1.45, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, 2.9, 10]} />
            <meshStandardMaterial color="#64748b" metalness={0.7} />
          </mesh>
          <mesh position={[0, 2.95, 0]} castShadow>
            <coneGeometry args={[1.65, 0.65, 12]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.6} />
          </mesh>
          <mesh position={[0, 2.96, 0]}>
            <coneGeometry args={[1.5, 0.62, 6]} />
            <meshStandardMaterial color="#dc2626" roughness={0.6} />
          </mesh>
        </group>

        {/* Colorful Vietnamese Red Plastic Stools (Ghế nhựa Duy Tân) */}
        {[-0.8, 0.8].map((zChair, idx) => (
          <mesh key={`chair-${idx}`} position={[-1.2, 0.22, zChair]} castShadow>
            <boxGeometry args={[0.42, 0.44, 0.42]} />
            <meshStandardMaterial color="#dc2626" roughness={0.5} />
          </mesh>
        ))}

        {/* Quán Nước Signboard: "NƯỚC MÍA SIÊU SẠCH" */}
        <group position={[0, 1.85, 1.15]}>
          <mesh>
            <boxGeometry args={[1.4, 0.45, 0.08]} />
            <meshStandardMaterial
              color="#0284c7"
              emissive="#0369a1"
              emissiveIntensity={isNight ? 1.4 : 0.3}
            />
          </mesh>
          <mesh position={[0, 0, 0.05]}>
            <boxGeometry args={[1.3, 0.35, 0.01]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#facc15"
              emissiveIntensity={isNight ? 2.2 : 0.6}
            />
          </mesh>
        </group>
      </group>

      {/* ==================== 4. QUẦY BÁN VÉ BẾN XE (TICKET BOOTH) ==================== */}
      <group position={[11.5, 0.2, -4.5]}>
        <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.8, 2.7, 3.4]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
        {/* Ticket Glass Window Counter */}
        <mesh position={[-1.42, 1.4, 0]}>
          <boxGeometry args={[0.06, 1.2, 2.2]} />
          <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.35} roughness={0.1} />
        </mesh>
        {/* Canopy Header */}
        <mesh position={[0, 2.75, 0]} castShadow>
          <boxGeometry args={[3.2, 0.22, 3.8]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
        {/* Signboard: "PHÒNG VÉ / TICKETS" */}
        <mesh position={[-1.48, 2.3, 0]}>
          <boxGeometry args={[0.04, 0.45, 2.4]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#facc15"
            emissiveIntensity={isNight ? 2.0 : 0.5}
          />
        </mesh>
      </group>

      {/* ==================== 5. VIETNAMESE BUS STOP SIGNPOST ==================== */}
      <group position={[2.2, 0.2, -7.5]}>
        {/* Steel Pole */}
        <mesh position={[0, 1.3, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 2.6, 10]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        {/* Yellow-Blue Vietnamese Standard Bus Stop Plate */}
        <mesh position={[0, 2.4, 0]}>
          <boxGeometry args={[0.05, 0.68, 0.48]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>
        <mesh position={[-0.03, 2.4, 0]}>
          <boxGeometry args={[0.01, 0.62, 0.42]} />
          <meshStandardMaterial
            color="#facc15"
            emissive="#eab308"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>

      {/* ==================== 6. ORNAMENTAL PALM TREES & PLANTER BOXES ==================== */}
      {[-10, 10].map((zTree, idx) => (
        <group key={`plat-tree-${idx}`} position={[13.2, 0.2, zTree]}>
          {/* Planter Box */}
          <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.5, 0.7, 1.5]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.71, 0]}>
            <boxGeometry args={[1.35, 0.04, 1.35]} />
            <meshStandardMaterial color="#3f6212" roughness={0.9} />
          </mesh>
          {/* Palm Trunk */}
          <mesh position={[0, 1.9, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.16, 2.5, 8]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>
          {/* Lush Palm Foliage Fronds */}
          <mesh position={[0, 3.2, 0]} castShadow>
            <dodecahedronGeometry args={[1.1, 1]} />
            <meshStandardMaterial color="#16a34a" roughness={0.6} />
          </mesh>
          <mesh position={[0, 3.7, 0]} castShadow>
            <icosahedronGeometry args={[0.85, 1]} />
            <meshStandardMaterial color="#4ade80" roughness={0.55} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
