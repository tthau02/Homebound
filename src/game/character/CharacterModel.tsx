import React, { useMemo, useRef, useState } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CharacterData } from './characterTypes';
import { GaitState, advanceGait, updateCharacterProceduralRig } from './AnimationController';
import { CHAR_GEO, CharacterAppearance, CharacterColors, RIG, resolveAppearance } from './characterAssets';
import { CharacterRig, createRigHandles } from './CharacterRig';
import { ChatBubble } from '../chat/ChatBubble';
import { useChatStore } from '../../stores/useChatStore';
import { useInteractionStore } from '../../stores/useInteractionStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useStoryStore } from '../../stores/useStoryStore';
import { getTalkTargetNpcIds } from '../story/storyEngine';

interface CharacterModelProps {
  character: CharacterData;
}

const LOOK_RADIUS = 2.6;
const TWO_PI = Math.PI * 2;
/** A jump larger than this is a teleport (seat snap, boarding), not something to walk through. */
const TELEPORT_DISTANCE = 2.6;

/**
 * A passenger / player: realistic-proportion articulated rig (see CharacterRig) driven by
 * store state. The root follows the authoritative position with damping; the walk cycle is
 * advanced from the distance the root actually moved, so local and remote characters both
 * step in time with their real speed.
 */
export const CharacterModel: React.FC<CharacterModelProps> = React.memo(function CharacterModel({ character }) {
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const storyMarkerRef = useRef<THREE.Mesh | null>(null);
  const handlesRef = useRef(createRigHandles());
  const blinkRef = useRef({ next: 1 + Math.random() * 3, closing: 0 });
  const gaitRef = useRef<GaitState>({ phase: Math.random() * TWO_PI, weight: 0, run: 0 });
  const speedRef = useRef(0);
  const [hovered, setHovered] = useState(false);

  const activeBubble = useChatStore((state) => state.activeBubbles[character.id]);
  const selectedCharacterId = useInteractionStore((state) => state.selectedCharacterId);
  const openCharacterInteraction = useInteractionStore((state) => state.openCharacterInteraction);
  const focusedCharacterId = useCharacterStore((state) => state.focusedCharacterId);
  const isStoryTarget = useStoryStore(
    (state) => state.enabled && getTalkTargetNpcIds(state.activeObjectives).includes(character.id)
  );

  const isSelectedOrFocused = selectedCharacterId === character.id || focusedCharacterId === character.id;

  const look: CharacterAppearance = useMemo(
    () => resolveAppearance(character),
    // Appearance only depends on identity & declared style fields
    [character.id, character.bodyType, character.hairStyle, character.accessories]
  );
  const colors: CharacterColors = useMemo(
    () => ({ shirt: character.shirtColor, pants: character.pantsColor, hair: character.hairColor }),
    [character.shirtColor, character.pantsColor, character.hairColor]
  );
  const isTalking = Boolean(activeBubble);
  const seed = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < character.id.length; i++) sum += character.id.charCodeAt(i) * 1.37;
    return sum;
  }, [character.id]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const store = useCharacterStore.getState();
    const liveChar = store.characters[character.id] ?? character;
    const root = rootGroupRef.current;
    const handles = handlesRef.current;

    if (root) {
      const tx = liveChar.position[0];
      const ty = liveChar.position[1];
      const tz = liveChar.position[2];
      const jump = Math.hypot(tx - root.position.x, tz - root.position.z);
      const prevX = root.position.x;
      const prevZ = root.position.z;

      if (jump > TELEPORT_DISTANCE) {
        root.position.set(tx, ty, tz);
        root.rotation.y = liveChar.rotationY;
        speedRef.current = 0;
      } else {
        const posFactor = 1 - Math.exp(-16 * delta);
        root.position.x = THREE.MathUtils.lerp(root.position.x, tx, posFactor);
        root.position.y = THREE.MathUtils.lerp(root.position.y, ty, 1 - Math.exp(-10 * delta));
        root.position.z = THREE.MathUtils.lerp(root.position.z, tz, posFactor);

        let angleDiff = liveChar.rotationY - root.rotation.y;
        angleDiff -= TWO_PI * Math.floor((angleDiff + Math.PI) / TWO_PI);
        root.rotation.y += angleDiff * (1 - Math.exp(-14 * delta));

        const moved = Math.hypot(root.position.x - prevX, root.position.z - prevZ);
        const instantSpeed = delta > 0 ? moved / delta : 0;
        speedRef.current += (instantSpeed - speedRef.current) * (1 - Math.exp(-12 * delta));
      }
    }

    // Seated characters slide sideways into their seat; that is not a walk
    const walkingSpeed = liveChar.state === 'sitting' ? 0 : speedRef.current;
    advanceGait(gaitRef.current, walkingSpeed, delta);

    // Glance at the player when they come close (NPCs only)
    let lookYaw = 0;
    if (!liveChar.isPlayer && root) {
      const player = store.characters[store.playerId];
      if (player) {
        const dx = player.position[0] - root.position.x;
        const dz = player.position[2] - root.position.z;
        const distSq = dx * dx + dz * dz;
        if (distSq < LOOK_RADIUS * LOOK_RADIUS && distSq > 0.04) {
          let rel = Math.atan2(-dx, -dz) - root.rotation.y;
          rel -= TWO_PI * Math.floor((rel + Math.PI) / TWO_PI);
          // Only turn if the player is roughly in front / to the side
          if (Math.abs(rel) < 1.9) lookYaw = THREE.MathUtils.clamp(rel, -0.95, 0.95);
        }
      }
    }

    updateCharacterProceduralRig(
      handles,
      liveChar.currentAnimation,
      state.clock.elapsedTime,
      delta,
      seed,
      lookYaw,
      gaitRef.current
    );

    // Blinking
    const t = state.clock.elapsedTime;
    const blink = blinkRef.current;
    if (t > blink.next) {
      blink.closing = 0.13;
      blink.next = t + 2.2 + ((seed * 7.31 + t) % 3.5);
    }
    if (handles.eyes) {
      const sleeping = liveChar.currentAnimation === 'Sleeping';
      blink.closing = Math.max(0, blink.closing - delta);
      handles.eyes.scale.y = sleeping ? 0.1 : blink.closing > 0 ? 0.12 : 1;
    }

    // Talking mouth
    if (handles.mouth) {
      const open = isTalking ? 1.2 + Math.abs(Math.sin(t * 13 + seed)) * 2.4 : 1;
      handles.mouth.scale.y = THREE.MathUtils.lerp(handles.mouth.scale.y, open, 1 - Math.exp(-30 * delta));
    }

    if (storyMarkerRef.current) {
      const top = (liveChar.state === 'sitting' ? RIG.sitHeight : RIG.standHeight) * look.heightScale;
      storyMarkerRef.current.position.y = top + 0.26 + Math.sin(t * 3) * 0.05;
      storyMarkerRef.current.rotation.y = t * 1.6;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (character.isPlayer) return;
    openCharacterInteraction(character.id, 'menu');
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (character.isPlayer) return;
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  const ringColor = character.isPlayer ? '#f5a524' : isSelectedOrFocused ? '#60b4f0' : '#fde68a';
  const isSeated = character.state === 'sitting';

  return (
    <group
      // Position / yaw are owned by useFrame (damped follow). Passing them as props would
      // snap the root on every store update and hide the motion the gait is measured from.
      ref={(el) => {
        rootGroupRef.current = el;
        if (el && !el.userData.placed) {
          el.userData.placed = true;
          el.position.set(character.position[0], character.position[1], character.position[2]);
          el.rotation.y = character.rotationY;
        }
      }}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Story objective marker */}
      {isStoryTarget && (
        <mesh ref={storyMarkerRef} position={[0, 2.0, 0]} geometry={CHAR_GEO.storyMarker}>
          <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={2.4} toneMapped={false} />
        </mesh>
      )}

      {/* Selection / player ring */}
      {(character.isPlayer || isSelectedOrFocused || hovered) && (
        <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={CHAR_GEO.selectionRing}>
          <meshBasicMaterial color={ringColor} transparent opacity={0.8} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}

      <CharacterRig look={look} colors={colors} handles={handlesRef} startSeated={isSeated} />

      <ChatBubble
        characterName={character.name}
        avatar={character.avatar}
        isPlayer={character.isPlayer}
        isSeated={isSeated}
        isSelectedOrFocused={isSelectedOrFocused}
        activeEmote={character.activeEmote}
        chatBubble={activeBubble}
      />
    </group>
  );
});
