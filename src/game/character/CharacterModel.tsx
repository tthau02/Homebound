import React, { useMemo, useRef, useState } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CharacterData } from './characterTypes';
import {
  CharacterRigRefs,
  updateCharacterProceduralRig,
} from './AnimationController';
import { ChatBubble } from '../chat/ChatBubble';
import { useChatStore } from '../../stores/useChatStore';
import { useInteractionStore } from '../../stores/useInteractionStore';
import { useCharacterStore } from '../../stores/useCharacterStore';

interface CharacterModelProps {
  character: CharacterData;
}

// Warm, natural skin tone palette
const SKIN_TONES = [
  '#f8d5b2', // Fair warm
  '#f3c89f', // Natural golden beige
  '#eabf95', // Warm honey
  '#dfb084', // Sun-kissed tan
];

export const CharacterModel: React.FC<CharacterModelProps> = ({ character }) => {
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const [hovered, setHovered] = useState(false);

  const rigRefs = useRef<CharacterRigRefs>({
    pelvis: null,
    torso: null,
    head: null,
    leftArm: null,
    rightArm: null,
    leftThigh: null,
    leftCalf: null,
    rightThigh: null,
    rightCalf: null,
  });

  const activeBubble = useChatStore(
    (state) => state.activeBubbles[character.id]
  );
  const selectedCharacterId = useInteractionStore(
    (state) => state.selectedCharacterId
  );
  const openCharacterInteraction = useInteractionStore(
    (state) => state.openCharacterInteraction
  );
  const focusedCharacterId = useCharacterStore(
    (state) => state.focusedCharacterId
  );

  const isSelectedOrFocused =
    selectedCharacterId === character.id || focusedCharacterId === character.id;

  // Deterministic seed for skin tone and hair variation
  const { skinColor, isFemaleStyle, hairHue } = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < character.id.length; i++) {
      sum += character.id.charCodeAt(i) * 1.37;
    }
    const skin = SKIN_TONES[Math.floor(sum) % SKIN_TONES.length];
    const isFemale =
      character.name.includes('Mai') ||
      character.name.includes('Trúc') ||
      character.name.includes('Anh') ||
      character.name.includes('Hương') ||
      character.name.includes('Yến');
    return { skinColor: skin, isFemaleStyle: isFemale, hairHue: character.hairColor };
  }, [character.id, character.name, character.hairColor]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const liveChar =
      useCharacterStore.getState().characters[character.id] ?? character;

    if (rootGroupRef.current) {
      // Smoothly interpolate root position & rotation
      const posFactor = 1 - Math.exp(-16 * delta);
      rootGroupRef.current.position.x = THREE.MathUtils.lerp(
        rootGroupRef.current.position.x,
        liveChar.position[0],
        posFactor
      );
      rootGroupRef.current.position.y = THREE.MathUtils.lerp(
        rootGroupRef.current.position.y,
        liveChar.position[1],
        posFactor
      );
      rootGroupRef.current.position.z = THREE.MathUtils.lerp(
        rootGroupRef.current.position.z,
        liveChar.position[2],
        posFactor
      );

      // Shortest-angle yaw interpolation
      let angleDiff = liveChar.rotationY - rootGroupRef.current.rotation.y;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      rootGroupRef.current.rotation.y += angleDiff * posFactor;
    }

    updateCharacterProceduralRig(
      rigRefs.current,
      liveChar.currentAnimation,
      state.clock.elapsedTime,
      delta,
      character.id.charCodeAt(0) * 1.5
    );
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    openCharacterInteraction(character.id, 'menu');
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  return (
    <group
      ref={rootGroupRef}
      position={character.position}
      rotation={[0, character.rotationY, 0]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Floor Selection / Player Indicator Ring */}
      {(character.isPlayer || isSelectedOrFocused || hovered) && (
        <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.22, 0.28, 28]} />
          <meshBasicMaterial
            color={
              character.isPlayer
                ? '#f59e0b'
                : isSelectedOrFocused
                  ? '#38bdf8'
                  : '#fef08a'
            }
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* ==================== ARTICULATED PELVIS & HIPS ==================== */}
      <group
        position={[0, character.state === 'sitting' ? 0.43 : 0.72, 0]}
        ref={(el) => {
          rigRefs.current.pelvis = el;
        }}
      >
        {/* Sculpted Hips / Pants Waist */}
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.145, 0.135, 0.14, 16]} />
          <meshStandardMaterial color={character.pantsColor} roughness={0.7} />
        </mesh>

        {/* Leather Belt with Chrome Buckle */}
        <mesh position={[0, 0.065, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.024, 16]} />
          <meshStandardMaterial color="#1c1917" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.065, -0.151]}>
          <boxGeometry args={[0.045, 0.028, 0.01]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* ==================== TORSO & HEAD ==================== */}
        <group
          position={[0, 0.06, 0]}
          ref={(el) => {
            rigRefs.current.torso = el;
          }}
        >
          {/* Main Tapered Human Torso / Jacket */}
          {/* Upper Chest */}
          <mesh position={[0, 0.26, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.165, 0.14, 0.26, 16]} />
            <meshStandardMaterial
              color={character.shirtColor}
              roughness={0.5}
              emissive={hovered ? character.shirtColor : '#000000'}
              emissiveIntensity={hovered ? 0.22 : 0}
            />
          </mesh>

          {/* Lower Waist / Hem of Jacket */}
          <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.14, 0.148, 0.18, 16]} />
            <meshStandardMaterial
              color={character.shirtColor}
              roughness={0.52}
            />
          </mesh>

          {/* Ribbed Bottom Hem of Jacket */}
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.152, 0.152, 0.035, 16]} />
            <meshStandardMaterial
              color={character.shirtColor}
              roughness={0.8}
            />
          </mesh>

          {/* Jacket Zipper / Placket Seam on Front (-Z) */}
          <mesh position={[0, 0.21, -0.155]}>
            <boxGeometry args={[0.022, 0.36, 0.012]} />
            <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.32, -0.16]}>
            <boxGeometry args={[0.014, 0.028, 0.01]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Inner Shirt Collar (V-neck opening) */}
          <mesh position={[0, 0.37, -0.14]}>
            <boxGeometry args={[0.09, 0.08, 0.02]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.6} />
          </mesh>

          {/* Casual Hoodie Hood / Folded Collar on Back (+Z) */}
          {/* Looks gorgeous when the player walks down the aisle viewed from behind! */}
          <mesh position={[0, 0.35, 0.13]} rotation={[-0.2, 0, 0]}>
            <boxGeometry args={[0.22, 0.12, 0.06]} />
            <meshStandardMaterial color={character.shirtColor} roughness={0.65} />
          </mesh>

          {/* Rounded Shoulder Caps (Left & Right) */}
          <mesh position={[-0.175, 0.36, 0]} castShadow>
            <sphereGeometry args={[0.065, 12, 12]} />
            <meshStandardMaterial color={character.shirtColor} roughness={0.5} />
          </mesh>
          <mesh position={[0.175, 0.36, 0]} castShadow>
            <sphereGeometry args={[0.065, 12, 12]} />
            <meshStandardMaterial color={character.shirtColor} roughness={0.5} />
          </mesh>

          {/* Contoured Human Neck */}
          <mesh position={[0, 0.44, 0]}>
            <cylinderGeometry args={[0.046, 0.054, 0.09, 14]} />
            <meshStandardMaterial color={skinColor} roughness={0.52} />
          </mesh>

          {/* ==================== ARTICULATED HEAD & FACE ==================== */}
          <group
            position={[0, 0.58, 0]}
            ref={(el) => {
              rigRefs.current.head = el;
            }}
          >
            {/* Cranium / Upper Head */}
            <mesh position={[0, 0.02, 0]} castShadow>
              <sphereGeometry args={[0.118, 20, 20]} />
              <meshStandardMaterial color={skinColor} roughness={0.5} />
            </mesh>

            {/* Jaw / Chin Contour */}
            <mesh position={[0, -0.045, -0.015]}>
              <cylinderGeometry args={[0.11, 0.065, 0.1, 16]} />
              <meshStandardMaterial color={skinColor} roughness={0.5} />
            </mesh>

            {/* Left & Right Ears */}
            <mesh position={[-0.12, 0.01, 0]}>
              <capsuleGeometry args={[0.018, 0.025, 4, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.55} />
            </mesh>
            <mesh position={[0.12, 0.01, 0]}>
              <capsuleGeometry args={[0.018, 0.025, 4, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.55} />
            </mesh>

            {/* ==================== EXPRESSIVE HUMAN FACIAL FEATURES ==================== */}
            {/* Left Eye (Sclera White + Iris + Glistening Specular Highlight) */}
            <group position={[-0.042, 0.018, -0.112]}>
              {/* White Sclera */}
              <mesh>
                <sphereGeometry args={[0.017, 10, 10]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              {/* Iris (Espresso Brown / Hazel) */}
              <mesh position={[0, 0, -0.009]}>
                <circleGeometry args={[0.011, 12]} />
                <meshBasicMaterial color="#3b2010" />
              </mesh>
              {/* Pupil */}
              <mesh position={[0, 0, -0.01]}>
                <circleGeometry args={[0.006, 10]} />
                <meshBasicMaterial color="#09090b" />
              </mesh>
              {/* Glistening Specular Reflection Highlight */}
              <mesh position={[0.004, 0.004, -0.011]}>
                <circleGeometry args={[0.003, 8]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>

            {/* Right Eye */}
            <group position={[0.042, 0.018, -0.112]}>
              <mesh>
                <sphereGeometry args={[0.017, 10, 10]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh position={[0, 0, -0.009]}>
                <circleGeometry args={[0.011, 12]} />
                <meshBasicMaterial color="#3b2010" />
              </mesh>
              <mesh position={[0, 0, -0.01]}>
                <circleGeometry args={[0.006, 10]} />
                <meshBasicMaterial color="#09090b" />
              </mesh>
              <mesh position={[0.004, 0.004, -0.011]}>
                <circleGeometry args={[0.003, 8]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>

            {/* Eyebrows with Natural Arch */}
            <mesh position={[-0.044, 0.042, -0.11]}>
              <boxGeometry args={[0.038, 0.006, 0.01]} />
              <meshBasicMaterial color={hairHue} />
            </mesh>
            <mesh position={[0.044, 0.042, -0.11]}>
              <boxGeometry args={[0.038, 0.006, 0.01]} />
              <meshBasicMaterial color={hairHue} />
            </mesh>

            {/* Subtle Defined Nose */}
            <mesh position={[0, 0.0, -0.12]}>
              <coneGeometry args={[0.014, 0.03, 5]} />
              <meshStandardMaterial color={skinColor} roughness={0.6} />
            </mesh>

            {/* Natural Lip Contour */}
            <mesh position={[0, -0.032, -0.11]}>
              <capsuleGeometry args={[0.007, 0.024, 4, 8]} />
              <meshStandardMaterial color="#c25e68" roughness={0.6} />
            </mesh>

            {/* ==================== NATURAL LAYERED HUMAN HAIR ==================== */}
            {/* Top Crown Volume */}
            <mesh position={[0, 0.055, 0.015]} castShadow>
              <sphereGeometry args={[0.126, 18, 16, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
              <meshStandardMaterial color={hairHue} roughness={0.7} />
            </mesh>

            {/* Back Hair Flowing Over Nape of Neck (Seen cleanly from rear!) */}
            <mesh position={[0, -0.015, 0.065]} castShadow>
              <sphereGeometry
                args={[
                  0.118,
                  16,
                  12,
                  0,
                  Math.PI * 2,
                  Math.PI * 0.25,
                  isFemaleStyle ? Math.PI * 0.65 : Math.PI * 0.45,
                ]}
              />
              <meshStandardMaterial color={hairHue} roughness={0.75} />
            </mesh>

            {/* Styled Front Bangs / Fringe */}
            <mesh position={[0.02, 0.082, -0.085]} rotation={[0.45, 0, 0.2]}>
              <boxGeometry args={[0.13, 0.045, 0.05]} />
              <meshStandardMaterial color={hairHue} roughness={0.75} />
            </mesh>
            <mesh position={[-0.045, 0.075, -0.082]} rotation={[0.4, 0, -0.25]}>
              <boxGeometry args={[0.08, 0.04, 0.045]} />
              <meshStandardMaterial color={hairHue} roughness={0.75} />
            </mesh>

            {/* Female Hair Extension / Side Bob Lengths */}
            {isFemaleStyle && (
              <>
                <mesh position={[-0.108, -0.04, 0.01]}>
                  <cylinderGeometry args={[0.035, 0.042, 0.16, 8]} />
                  <meshStandardMaterial color={hairHue} roughness={0.75} />
                </mesh>
                <mesh position={[0.108, -0.04, 0.01]}>
                  <cylinderGeometry args={[0.035, 0.042, 0.16, 8]} />
                  <meshStandardMaterial color={hairHue} roughness={0.75} />
                </mesh>
              </>
            )}
          </group>

          {/* ==================== LEFT & RIGHT ARMS & HANDS ==================== */}
          {/* Left Arm Pivot at Left Shoulder (-X) */}
          <group
            position={[-0.19, 0.38, 0]}
            ref={(el) => {
              rigRefs.current.leftArm = el;
            }}
          >
            {/* Upper Arm Sleeve */}
            <mesh position={[0, -0.13, 0]} castShadow>
              <cylinderGeometry args={[0.045, 0.04, 0.24, 12]} />
              <meshStandardMaterial color={character.shirtColor} roughness={0.55} />
            </mesh>
            {/* Forearm */}
            <mesh position={[0, -0.25, 0]} castShadow>
              <cylinderGeometry args={[0.038, 0.033, 0.18, 10]} />
              <meshStandardMaterial color={character.shirtColor} roughness={0.55} />
            </mesh>
            {/* Smartwatch on Left Wrist */}
            <mesh position={[0, -0.32, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 0.02, 12]} />
              <meshStandardMaterial color="#09090b" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, -0.32, -0.036]}>
              <boxGeometry args={[0.024, 0.022, 0.008]} />
              <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.5} />
            </mesh>
            {/* Realistic Human Hand (Palm + Thumb + Curved Relaxed Fingers) */}
            <group position={[0, -0.38, 0]}>
              <mesh>
                <boxGeometry args={[0.045, 0.065, 0.028]} />
                <meshStandardMaterial color={skinColor} roughness={0.5} />
              </mesh>
              {/* Thumb */}
              <mesh position={[0.026, 0.01, -0.008]} rotation={[0, 0, -0.4]}>
                <cylinderGeometry args={[0.009, 0.008, 0.035, 8]} />
                <meshStandardMaterial color={skinColor} roughness={0.5} />
              </mesh>
            </group>
          </group>

          {/* Right Arm Pivot at Right Shoulder (+X) */}
          <group
            position={[0.19, 0.38, 0]}
            ref={(el) => {
              rigRefs.current.rightArm = el;
            }}
          >
            {/* Upper Arm Sleeve */}
            <mesh position={[0, -0.13, 0]} castShadow>
              <cylinderGeometry args={[0.045, 0.04, 0.24, 12]} />
              <meshStandardMaterial color={character.shirtColor} roughness={0.55} />
            </mesh>
            {/* Forearm */}
            <mesh position={[0, -0.25, 0]} castShadow>
              <cylinderGeometry args={[0.038, 0.033, 0.18, 10]} />
              <meshStandardMaterial color={character.shirtColor} roughness={0.55} />
            </mesh>
            {/* Right Hand */}
            <group position={[0, -0.38, 0]}>
              <mesh>
                <boxGeometry args={[0.045, 0.065, 0.028]} />
                <meshStandardMaterial color={skinColor} roughness={0.5} />
              </mesh>
              {/* Thumb */}
              <mesh position={[-0.026, 0.01, -0.008]} rotation={[0, 0, 0.4]}>
                <cylinderGeometry args={[0.009, 0.008, 0.035, 8]} />
                <meshStandardMaterial color={skinColor} roughness={0.5} />
              </mesh>
            </group>
          </group>
        </group>

        {/* ==================== LEGS & MODERN SNEAKERS ==================== */}
        {/* Left Leg */}
        <group
          position={[-0.09, -0.03, 0]}
          ref={(el) => {
            rigRefs.current.leftThigh = el;
          }}
        >
          {/* Thigh */}
          <mesh position={[0, -0.16, 0]} castShadow>
            <cylinderGeometry args={[0.062, 0.052, 0.34, 12]} />
            <meshStandardMaterial color={character.pantsColor} roughness={0.7} />
          </mesh>

          {/* Knee / Calf */}
          <group
            position={[0, -0.34, 0]}
            ref={(el) => {
              rigRefs.current.leftCalf = el;
            }}
          >
            <mesh position={[0, -0.16, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.042, 0.32, 12]} />
              <meshStandardMaterial color={character.pantsColor} roughness={0.7} />
            </mesh>

            {/* Modern Stylish Sneaker */}
            <group position={[0, -0.33, -0.03]}>
              {/* White Rubber Cupsole */}
              <mesh position={[0, 0.014, 0]}>
                <boxGeometry args={[0.082, 0.028, 0.19]} />
                <meshStandardMaterial color="#ffffff" roughness={0.4} />
              </mesh>
              {/* Sneaker Main Upper Body */}
              <mesh position={[0, 0.045, 0]} castShadow>
                <boxGeometry args={[0.08, 0.048, 0.175]} />
                <meshStandardMaterial color="#1e293b" roughness={0.6} />
              </mesh>
              {/* White Toe Cap & Tongue */}
              <mesh position={[0, 0.048, -0.05]}>
                <boxGeometry args={[0.076, 0.04, 0.06]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.5} />
              </mesh>
              {/* White Laces Bar */}
              <mesh position={[0, 0.062, -0.02]}>
                <boxGeometry args={[0.05, 0.012, 0.04]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
          </group>
        </group>

        {/* Right Leg */}
        <group
          position={[0.09, -0.03, 0]}
          ref={(el) => {
            rigRefs.current.rightThigh = el;
          }}
        >
          {/* Thigh */}
          <mesh position={[0, -0.16, 0]} castShadow>
            <cylinderGeometry args={[0.062, 0.052, 0.34, 12]} />
            <meshStandardMaterial color={character.pantsColor} roughness={0.7} />
          </mesh>

          {/* Knee / Calf */}
          <group
            position={[0, -0.34, 0]}
            ref={(el) => {
              rigRefs.current.rightCalf = el;
            }}
          >
            <mesh position={[0, -0.16, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.042, 0.32, 12]} />
              <meshStandardMaterial color={character.pantsColor} roughness={0.7} />
            </mesh>

            {/* Modern Stylish Sneaker */}
            <group position={[0, -0.33, -0.03]}>
              <mesh position={[0, 0.014, 0]}>
                <boxGeometry args={[0.082, 0.028, 0.19]} />
                <meshStandardMaterial color="#ffffff" roughness={0.4} />
              </mesh>
              <mesh position={[0, 0.045, 0]} castShadow>
                <boxGeometry args={[0.08, 0.048, 0.175]} />
                <meshStandardMaterial color="#1e293b" roughness={0.6} />
              </mesh>
              <mesh position={[0, 0.048, -0.05]}>
                <boxGeometry args={[0.076, 0.04, 0.06]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.5} />
              </mesh>
              <mesh position={[0, 0.062, -0.02]}>
                <boxGeometry args={[0.05, 0.012, 0.04]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
          </group>
        </group>
      </group>

      {/* Overhead Billboard Chat Bubble & Emote Display */}
      <ChatBubble
        characterName={character.name}
        avatar={character.avatar}
        isPlayer={character.isPlayer}
        isSeated={character.state === 'sitting'}
        isSelectedOrFocused={isSelectedOrFocused}
        activeEmote={character.activeEmote}
        chatBubble={activeBubble}
      />
    </group>
  );
};
