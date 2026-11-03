import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTelemetryStore } from '../../stores/useTelemetryStore';

interface ChromePerformanceMemory {
  usedJSHeapSize: number;
}

/**
 * Zero-allocation 3D WebGL Performance Probe (Phase 7).
 * Accumulates frame count and delta time in mutable refs and commits a telemetry
 * snapshot once every 500ms so React never re-renders at 60 FPS.
 */
export const PerformanceProbe3D: React.FC = () => {
  const gl = useThree((state) => state.gl);
  const frameCountRef = useRef<number>(0);
  const elapsedSecRef = useRef<number>(0);

  useFrame((_, rawDelta) => {
    frameCountRef.current += 1;
    elapsedSecRef.current += Math.min(rawDelta, 0.25);

    if (elapsedSecRef.current >= 0.5) {
      const elapsed = elapsedSecRef.current;
      const frames = frameCountRef.current;
      const fps = Math.min(144, Math.max(1, Math.round(frames / elapsed)));
      const frameTimeMs = Number(((elapsed / frames) * 1000).toFixed(1));

      frameCountRef.current = 0;
      elapsedSecRef.current = 0;

      const perfWithMem = performance as unknown as {
        memory?: ChromePerformanceMemory;
      };
      const jsHeapMb = perfWithMem.memory?.usedJSHeapSize
        ? Number((perfWithMem.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1))
        : null;

      useTelemetryStore.getState().recordSample({
        fps,
        frameTimeMs,
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        jsHeapMb,
      });
    }
  });

  return null;
};

