import React, { useMemo } from 'react';
import { Environment, Lightformer, Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../stores/useGameStore';
import { LIGHTING_CONFIG, QUALITY_PROFILES } from '../config/environmentConfig';

/**
 * Atmosphere & lighting rig.
 * - Day: physically-based procedural <Sky> + warm sun + hazy fog.
 * - Night: deep blue backdrop, stars and moon.
 * - Overcast/rain: flat grey sky and denser fog.
 * - An in-scene Lightformer environment map (rendered once, no HDRI download) provides
 *   reflections for glass, chrome and bus paint.
 */
export const SkyAndLighting: React.FC = () => {
  const timeOfDay = useGameStore((state) => state.timeOfDay);
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);
  const weather = useGameStore((state) => state.weather);

  const lighting = LIGHTING_CONFIG[timeOfDay];
  const profile = QUALITY_PROFILES[graphicsQuality];
  const isNight = timeOfDay === 'night';
  const isOvercast = weather !== 'sunny';

  const background = useMemo(
    () => new THREE.Color(isOvercast ? (isNight ? '#1c2533' : '#8f9ca8') : lighting.skyBg),
    [isOvercast, isNight, lighting.skyBg]
  );
  const fogColor = useMemo(
    () => new THREE.Color(isOvercast ? (isNight ? '#1c2533' : '#9aa6b0') : lighting.fogColor),
    [isOvercast, isNight, lighting.fogColor]
  );

  const fogNear = lighting.fogNear * profile.fogScale * (isOvercast ? 0.55 : 1);
  const fogFar = lighting.fogFar * profile.fogScale * (isOvercast ? 0.6 : 1);
  const sunScale = isOvercast ? 0.45 : 1;

  return (
    <group name="SkyAndLighting">
      <primitive attach="background" object={background} />
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />

      {!isNight && !isOvercast && (
        <Sky
          sunPosition={lighting.sunPosition}
          turbidity={5.5}
          rayleigh={1.4}
          mieCoefficient={0.004}
          mieDirectionalG={0.82}
        />
      )}

      <Environment
        key={`${timeOfDay}-${isOvercast ? 'o' : 'c'}`}
        resolution={64}
        frames={1}
        environmentIntensity={lighting.environmentIntensity * (isOvercast ? 0.8 : 1)}
      >
        {/* Sky dome tint */}
        <Lightformer
          form="rect"
          intensity={isNight ? 0.4 : 1.6}
          color={isNight ? '#1e3a8a' : isOvercast ? '#cbd5e1' : '#bfe0ff'}
          scale={[40, 40, 1]}
          position={[0, 20, 0]}
          rotation-x={Math.PI / 2}
        />
        {/* Sun / moon key reflection */}
        <Lightformer
          form="circle"
          intensity={isNight ? 1.2 : isOvercast ? 1.5 : 6}
          color={isNight ? '#c7d2fe' : '#fff1d6'}
          scale={6}
          position={lighting.sunPosition}
          target={[0, 0, 0]}
        />
        {/* Ground bounce */}
        <Lightformer
          form="rect"
          intensity={isNight ? 0.1 : 0.5}
          color={isNight ? '#0f172a' : '#6b8f3c'}
          scale={[40, 40, 1]}
          position={[0, -8, 0]}
          rotation-x={-Math.PI / 2}
        />
        {/* Horizon strips for long highlights on the bus body */}
        <Lightformer
          form="rect"
          intensity={isNight ? 0.2 : 1}
          color={isNight ? '#312e81' : '#e0f2fe'}
          scale={[30, 3, 1]}
          position={[-18, 3, 0]}
          rotation-y={Math.PI / 2}
        />
        <Lightformer
          form="rect"
          intensity={isNight ? 0.2 : 1}
          color={isNight ? '#312e81' : '#e0f2fe'}
          scale={[30, 3, 1]}
          position={[18, 3, 0]}
          rotation-y={-Math.PI / 2}
        />
      </Environment>

      <ambientLight intensity={lighting.ambientIntensity} color={lighting.ambientColor} />
      <hemisphereLight
        args={[lighting.hemiSkyColor, lighting.hemiGroundColor, lighting.hemiIntensity * (isOvercast ? 1.15 : 1)]}
      />

      {/* Primary directional light (sun by day, moon by night) */}
      <directionalLight
        position={lighting.sunPosition}
        intensity={lighting.sunIntensity * sunScale}
        color={lighting.sunColor}
        castShadow={graphicsQuality !== 'low'}
        shadow-mapSize-width={profile.shadowMapSize}
        shadow-mapSize-height={profile.shadowMapSize}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />

      {isNight && (
        <>
          <Stars
            radius={160}
            depth={60}
            count={graphicsQuality === 'low' ? 900 : 2600}
            factor={4}
            saturation={0}
            fade
            speed={0.3}
          />
          <mesh position={[-60, 85, -180]}>
            <sphereGeometry args={[5, 24, 24]} />
            <meshBasicMaterial color="#fdf6d8" fog={false} toneMapped={false} />
          </mesh>
        </>
      )}
    </group>
  );
};
