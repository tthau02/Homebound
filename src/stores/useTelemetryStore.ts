import { create } from 'zustand';
import { useGameStore } from './useGameStore';

export interface TelemetrySnapshot {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  jsHeapMb: number | null;
  autoQualityGuardEnabled: boolean;
  lastAutoDowngradeReason: string | null;
  lowFpsStreakCount: number;
}

interface TelemetryStoreState extends TelemetrySnapshot {
  isDiagnosticsOpen: boolean;
  setDiagnosticsOpen: (open: boolean) => void;
  setAutoQualityGuardEnabled: (enabled: boolean) => void;
  recordSample: (sample: {
    fps: number;
    frameTimeMs: number;
    drawCalls: number;
    triangles: number;
    geometries: number;
    textures: number;
    jsHeapMb: number | null;
  }) => void;
}

export const useTelemetryStore = create<TelemetryStoreState>((set, get) => ({
  isDiagnosticsOpen: false,
  fps: 60,
  frameTimeMs: 16.6,
  drawCalls: 42,
  triangles: 14800,
  geometries: 38,
  textures: 8,
  jsHeapMb: null,
  autoQualityGuardEnabled: true,
  lastAutoDowngradeReason: null,
  lowFpsStreakCount: 0,

  setDiagnosticsOpen: (open) => set({ isDiagnosticsOpen: open }),

  setAutoQualityGuardEnabled: (enabled) =>
    set({ autoQualityGuardEnabled: enabled }),

  recordSample: (sample) => {
    const state = get();
    let nextLowStreak = state.lowFpsStreakCount;
    let nextDowngradeReason = state.lastAutoDowngradeReason;

    if (state.autoQualityGuardEnabled) {
      if (sample.fps < 32) {
        nextLowStreak += 1;
      } else {
        nextLowStreak = 0;
      }

      // If sustained low FPS (<32 FPS for 6 consecutive 500ms windows = 3 seconds), downgrade quality preset
      if (nextLowStreak >= 6) {
        const currentQuality = useGameStore.getState().graphicsQuality;
        if (currentQuality === 'high') {
          useGameStore.getState().setGraphicsQuality('medium');
          nextDowngradeReason = `Tự động hạ chất lượng High → Medium do FPS thấp (${sample.fps} FPS)`;
          nextLowStreak = 0;
        } else if (currentQuality === 'medium') {
          useGameStore.getState().setGraphicsQuality('low');
          nextDowngradeReason = `Tự động hạ chất lượng Medium → Low để duy trì độ mượt (${sample.fps} FPS)`;
          nextLowStreak = 0;
        }
      }
    }

    set({
      fps: sample.fps,
      frameTimeMs: sample.frameTimeMs,
      drawCalls: sample.drawCalls,
      triangles: sample.triangles,
      geometries: sample.geometries,
      textures: sample.textures,
      jsHeapMb: sample.jsHeapMb,
      lowFpsStreakCount: nextLowStreak,
      lastAutoDowngradeReason: nextDowngradeReason,
    });
  },
}));

