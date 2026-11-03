import React, { useMemo } from 'react';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../stores/useGameStore';
import { LIGHTING_CONFIG } from '../config/environmentConfig';

export const SkyAndLighting: React.FC = () => {
  const timeOfDay = useGameStore((state) => state.timeOfDay);
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);
  const weather = useGameStore((state) => state.weather);

  const lighting = LIGHTING_CONFIG[timeOfDay];
  const isNight = timeOfDay === 'night';
  const isOvercast = weather !== 'sunny';

  const skyColor = useMemo(() => new THREE.Color(lighting.skyBg), [lighting.skyBg]);
  const fogColor = useMemo(() => new THREE.Color(lighting.fogColor), [lighting.fogColor]);

  const shadowMapSize =
    graphicsQuality === 'high' ? 2048 : graphicsQuality === 'medium' ? 1024 : 512;

  return (
    <group name="SkyAndLighting">
      <color attach="background" args={[isOvercast ? '#8796a3' : skyColor]} />
      <fog
        attach="fog"
        args={[
          isOvercast ? '#8796a3' : fogColor,
          isOvercast ? lighting.fogNear * 0.72 : lighting.fogNear,
          isOvercast ? lighting.fogFar * 0.78 : lighting.fogFar,
        ]}
      />

      {/* Ambient & Hemisphere Base Illumination */}
      <ambientLight
        intensity={lighting.ambientIntensity * (isOvercast ? 0.78 : 1)}
        color={isOvercast ? '#cbd5e1' : lighting.ambientColor}
      />
      <hemisphereLight
        args={[lighting.hemiSkyColor, lighting.hemiGroundColor, lighting.hemiIntensity]}
      />

      {/* Primary Directional Light (Sun in Day / Moon in Night) */}
      <directionalLight
        position={lighting.sunPosition}
        intensity={lighting.sunIntensity * (isOvercast ? 0.48 : 1)}
        color={lighting.sunColor}
        castShadow={graphicsQuality !== 'low'}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-near={1}
        shadow-camera-far={110}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-bias={-0.0005}
      />

      {/* Celestial Visuals: Sun in Day Mode / Stars & Moon in Night Mode */}
      {isNight ? (
        <>
          <Stars
            radius={110}
            depth={45}
            count={graphicsQuality === 'low' ? 800 : 2200}
            factor={4}
            saturation={0}
            fade
            speed={0.4}
          />
          {/* Glowing Full Moon */}
          <mesh position={[-38, 52, -110]}>
            <sphereGeometry args={[4.2, 24, 24]} />
            <meshBasicMaterial color="#fef9c3" />
          </mesh>
        </>
      ) : (
        /* Daytime Sun Disc */
        <mesh position={[45, 62, -115]}>
          <sphereGeometry args={[5.5, 24, 24]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
      )}
    </group>
  );
};

