import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  Bloom,
  EffectComposer,
  N8AO,
  SMAA,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useGameStore } from '../../stores/useGameStore';
import { QUALITY_PROFILES } from '../config/environmentConfig';

/**
 * Applies per-quality renderer settings (camera far plane, tone mapping) and mounts the
 * post-processing stack. `low` renders straight to screen with renderer tone mapping;
 * `medium`/`high` render through an EffectComposer with a final ToneMapping pass.
 */
export const PostEffects: React.FC = () => {
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);
  const { gl, camera } = useThree();
  const profile = QUALITY_PROFILES[graphicsQuality];
  const usesComposer = graphicsQuality !== 'low';

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.far = profile.cameraFar;
      camera.updateProjectionMatrix();
    }
  }, [camera, profile.cameraFar]);

  useEffect(() => {
    // With a composer the ToneMapping effect handles it; avoid double tone mapping.
    gl.toneMapping = usesComposer ? THREE.NoToneMapping : THREE.NeutralToneMapping;
    gl.toneMappingExposure = 1;
  }, [gl, usesComposer]);

  if (graphicsQuality === 'high') {
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <N8AO aoRadius={0.55} distanceFalloff={0.6} intensity={1.6} quality="performance" halfRes />
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.75} />
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        <SMAA />
        <Vignette offset={0.32} darkness={0.42} />
      </EffectComposer>
    );
  }

  if (graphicsQuality === 'medium') {
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.6} />
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        <SMAA />
        <Vignette offset={0.32} darkness={0.38} />
      </EffectComposer>
    );
  }

  return null;
};
