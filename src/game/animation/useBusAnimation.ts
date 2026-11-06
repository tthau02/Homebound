import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../stores/useGameStore';
import { useJourneyStore } from '../../stores/useJourneyStore';
import { BUS_DIMENSIONS } from '../config/busConfig';

interface UseBusAnimationParams {
  bodyGroupRef: React.RefObject<THREE.Group | null>;
  wheelRefs: React.MutableRefObject<(THREE.Group | null)[]>;
}

/**
 * Shared live telemetry ref so CameraManager can gently track the bus suspension
 * without triggering React re-renders or allocating new Vector3 instances.
 */
export const busLiveOffset = {
  y: 0,
  pitch: 0,
  roll: 0,
  xSway: 0,
};

export const useBusAnimation = ({ bodyGroupRef, wheelRefs }: UseBusAnimationParams) => {
  const phaseRef = useRef(0);
  const distanceAccumulatorRef = useRef(0);

  useFrame((_, rawDelta) => {
    const state = useGameStore.getState();
    if (state.isPaused) return;

    // Clamp delta to prevent large jumps when switching browser tabs
    const delta = Math.min(rawDelta, 0.1);
    const speedMs = (state.busSpeedKmh * 1000) / 3600;
    const speedFactor = Math.min(1.2, state.busSpeedKmh / 65);

    // Update journey progress & stations
    useJourneyStore.getState().tickJourney(delta);

    phaseRef.current += delta * (1.8 + speedFactor * 2.4);
    const t = phaseRef.current;

    // Update odometer in store roughly every 0.05 km to avoid per-frame store updates
    const kmStep = (speedMs * delta) / 1000;
    distanceAccumulatorRef.current += kmStep;
    if (distanceAccumulatorRef.current >= 0.05) {
      state.addDistance(distanceAccumulatorRef.current);
      distanceAccumulatorRef.current = 0;
    }

    // Gentle suspension bounce, pitch, and roll proportional to speed
    const bounceY =
      (Math.sin(t * 2.1) * 0.014 + Math.sin(t * 5.3) * 0.004) * speedFactor;
    const rollZ = Math.sin(t * 1.15) * 0.0055 * speedFactor;
    const pitchX = Math.cos(t * 1.75) * 0.0035 * speedFactor;
    const swayX = Math.sin(t * 0.72) * 0.025 * speedFactor;

    busLiveOffset.y = bounceY;
    busLiveOffset.roll = rollZ;
    busLiveOffset.pitch = pitchX;
    busLiveOffset.xSway = swayX;

    if (bodyGroupRef.current) {
      bodyGroupRef.current.position.y = bounceY;
      bodyGroupRef.current.position.x = swayX;
      bodyGroupRef.current.rotation.z = rollZ;
      bodyGroupRef.current.rotation.x = pitchX;
    }

    // Rotate all 4 wheels using delta time and wheel radius
    const angularVelocity = speedMs / BUS_DIMENSIONS.wheelRadius;
    const wheelDeltaAngle = angularVelocity * delta;

    for (let i = 0; i < wheelRefs.current.length; i++) {
      const wheel = wheelRefs.current[i];
      if (wheel) {
        wheel.position.x =
          (i % 2 === 0 ? -BUS_DIMENSIONS.wheelTrackX : BUS_DIMENSIONS.wheelTrackX) + swayX;
        wheel.rotation.x -= wheelDeltaAngle;
      }
    }
  });
};

