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

  // Deterministic phase seed per character so idle animations don't move in robotic unison
  const seedOffset = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < character.id.length; i++) {
      sum += character.id.charCodeAt(i) * 1.37;
    }
    return sum;
  }, [character.id]);

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
      seedOffset
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
          <ringGeometry args={[0.21, 0.27, 24]} />
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

      {/* Articulated Pelvis Root */}
      <group
        position={[0, character.state === 'sitting' ? 0.43 : 0.72, 0]}
        ref={(el) => {
          rigRefs.current.pelvis = el;
        }}
      >
        {/* Pelvis / Hips Mesh */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.29, 0.13, 0.19]} />
          <meshStandardMaterial color={character.pantsColor} roughness={0.7} />
        </mesh>

        {/* ==================== TORSO & HEAD ==================== */}
        <group
          position={[0, 0.06, 0]}
          ref={(el) => {
            rigRefs.current.torso = el;
          }}
        >
          {/* Upper Body Shirt / Jacket */}
          <mesh position={[0, 0.23, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.31, 0.44, 0.19]} />
            <meshStandardMaterial
              color={character.shirtColor}
              roughness={0.55}
              emissive={hovered ? character.shirtColor : '#000000'}
              emissiveIntensity={hovered ? 0.22 : 0}
            />
          </mesh>

          {/* Collar / Neck Accent */}
          <mesh position={[0, 0.47, 0]}>
            <cylinderGeometry args={[0.045, 0.052, 0.08, 10]} />
            <meshStandardMaterial color="#f1c27d" roughness={0.5} />
          </mesh>

          {/* Articulated Head Group (Facing -Z forward) */}
          <group
            position={[0, 0.59, 0]}
            ref={(el) => {
              rigRefs.current.head = el;
            }}
          >
            {/* Head Sphere */}
            <mesh castShadow>
              <sphereGeometry args={[0.118, 18, 18]} />
              <meshStandardMaterial color="#f1c27d" roughness={0.45} />
            </mesh>

            {/* Styled Hair Cap */}
            <mesh position={[0, 0.035, 0.015]} castShadow>
              <sphereGeometry
                args={[0.122, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62]}
              />
              <meshStandardMaterial color={character.hairColor} roughness={0.8} />
            </mesh>

            {/* Eyes on Front Face (-Z) */}
            <mesh position={[-0.04, 0.015, -0.106]}>
              <sphereGeometry args={[0.014, 8, 8]} />
              <meshBasicMaterial color="#0f172a" />
            </mesh>
            <mesh position={[0.04, 0.015, -0.106]}>
              <sphereGeometry args={[0.014, 8, 8]} />
              <meshBasicMaterial color="#0f172a" />
            </mesh>

            {/* Friendly Smile Mouth on Front Face (-Z) */}
            <mesh position={[0, -0.032, -0.108]}>
              <boxGeometry args={[0.042, 0.009, 0.01]} />
              <meshBasicMaterial color="#991b1b" />
            </mesh>
          </group>

          {/* ==================== LEFT & RIGHT ARMS ==================== */}
          {/* Left Arm Pivot at Left Shoulder (-X) */}
          <group
            position={[-0.195, 0.4, 0]}
            ref={(el) => {
              rigRefs.current.leftArm = el;
            }}
          >
            <mesh position={[0, -0.15, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.035, 0.32, 10]} />
              <meshStandardMaterial color={character.shirtColor} roughness={0.6} />
            </mesh>
            {/* Left Hand */}
            <mesh position={[0, -0.33, 0]}>
              <sphereGeometry args={[0.036, 10, 10]} />
              <meshStandardMaterial color="#f1c27d" roughness={0.5} />
            </mesh>
          </group>

          {/* Right Arm Pivot at Right Shoulder (+X) */}
          <group
            position={[0.195, 0.4, 0]}
            ref={(el) => {
              rigRefs.current.rightArm = el;
            }}
          >
            <mesh position={[0, -0.15, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.035, 0.32, 10]} />
              <meshStandardMaterial color={character.shirtColor} roughness={0.6} />
            </mesh>
            {/* Right Hand */}
            <mesh position={[0, -0.33, 0]}>
              <sphereGeometry args={[0.036, 10, 10]} />
              <meshStandardMaterial color="#f1c27d" roughness={0.5} />
            </mesh>
          </group>
        </group>

        {/* ==================== LEFT & RIGHT LEGS ==================== */}
        {/* Left Thigh Pivot */}
        <group
          position={[-0.085, -0.04, 0]}
          ref={(el) => {
            rigRefs.current.leftThigh = el;
          }}
        >
          <mesh position={[0, -0.17, 0]} castShadow>
            <cylinderGeometry args={[0.056, 0.048, 0.34, 10]} />
            <meshStandardMaterial color={character.pantsColor} roughness={0.7} />
          </mesh>

          {/* Left Knee / Calf Pivot */}
          <group
            position={[0, -0.34, 0]}
            ref={(el) => {
              rigRefs.current.leftCalf = el;
            }}
          >
            <mesh position={[0, -0.16, 0]} castShadow>
              <cylinderGeometry args={[0.046, 0.038, 0.32, 10]} />
              <meshStandardMaterial color={character.pantsColor} roughness={0.7} />
            </mesh>
            {/* Left Shoe (pointing -Z) */}
            <mesh position={[0, -0.32, -0.035]}>
              <boxGeometry args={[0.085, 0.055, 0.16]} />
              <meshStandardMaterial color="#0f172a" roughness={0.6} />
            </mesh>
          </group>
        </group>

        {/* Right Thigh Pivot */}
        <group
          position={[0.085, -0.04, 0]}
          ref={(el) => {
            rigRefs.current.rightThigh = el;
          }}
        >
          <mesh position={[0, -0.17, 0]} castShadow>
            <cylinderGeometry args={[0.056, 0.048, 0.34, 10]} />
            <meshStandardMaterial color={character.pantsColor} roughness={0.7} />
          </mesh>

          {/* Right Knee / Calf Pivot */}
          <group
            position={[0, -0.34, 0]}
            ref={(el) => {
              rigRefs.current.rightCalf = el;
            }}
          >
            <mesh position={[0, -0.16, 0]} castShadow>
              <cylinderGeometry args={[0.046, 0.038, 0.32, 10]} />
              <meshStandardMaterial color={character.pantsColor} roughness={0.7} />
            </mesh>
            {/* Right Shoe (pointing -Z) */}
            <mesh position={[0, -0.32, -0.035]}>
              <boxGeometry args={[0.085, 0.055, 0.16]} />
              <meshStandardMaterial color="#0f172a" roughness={0.6} />
            </mesh>
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

