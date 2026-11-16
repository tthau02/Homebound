import { create } from 'zustand';
import { JourneyWeather } from '@virtual-bus/shared';

export type CameraMode = 'interior' | 'top-down' | 'chase';
export type TimeOfDay = 'day' | 'night';
export type WeatherMode = Lowercase<JourneyWeather>;
export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface PassengerSeatInfo {
  id: string;
  seatLabel: string;
  name: string;
  row: number;
  side: 'left' | 'right';
  col: 'window' | 'aisle';
  occupied: boolean;
  shirtColor: string;
}

interface GameState {
  cameraMode: CameraMode;
  timeOfDay: TimeOfDay;
  weather: WeatherMode;
  graphicsQuality: GraphicsQuality;
  busSpeedKmh: number;
  isPaused: boolean;
  interiorLightsOn: boolean;
  headlightsOn: boolean;
  tripName: string;
  routeName: string;
  journeyStatus: string;
  distanceTraveledKm: number;
  isGuideOpen: boolean;
  /** Camera rotation sensitivity multiplier (0.3 – 2.5) */
  mouseSensitivity: number;
  invertCameraY: boolean;

  // Actions
  setCameraMode: (mode: CameraMode) => void;
  toggleTimeOfDay: () => void;
  setTimeOfDay: (time: TimeOfDay) => void;
  setWeather: (weather: WeatherMode) => void;
  setGraphicsQuality: (quality: GraphicsQuality) => void;
  setBusSpeedKmh: (speed: number) => void;
  togglePause: () => void;
  toggleInteriorLights: () => void;
  addDistance: (kmDelta: number) => void;
  setGuideOpen: (open: boolean) => void;
  setMouseSensitivity: (value: number) => void;
  toggleInvertCameraY: () => void;
}

/** Optional URL overrides for debugging / sharing views, e.g. `?camera=chase&time=night&quality=medium`. */
function readUrlParam<T extends string>(name: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = new URLSearchParams(window.location.search).get(name);
    return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}

export const useGameStore = create<GameState>((set) => ({
  cameraMode: readUrlParam<CameraMode>('camera', ['interior', 'top-down', 'chase'], 'interior'),
  timeOfDay: readUrlParam<TimeOfDay>('time', ['day', 'night'], 'day'),
  weather: 'sunny',
  graphicsQuality: readUrlParam<GraphicsQuality>('quality', ['low', 'medium', 'high'], 'high'),
  // The trip starts parked at the first stop; useJourneyStore drives the speed from there
  busSpeedKmh: 0,
  isPaused: false,
  interiorLightsOn: true,
  headlightsOn: true,
  tripName: 'VB-168 • Bình Lục → BX Mỹ Đình',
  routeName: 'Bánh mì 168 Bình Lục (Hà Nam) → Cao tốc Pháp Vân → BX Mỹ Đình (Hà Nội)',
  journeyStatus: 'Đang đón khách',
  distanceTraveledKm: 0,
  isGuideOpen: false,
  mouseSensitivity: 1,
  invertCameraY: false,

  setCameraMode: (mode) => set({ cameraMode: mode }),

  toggleTimeOfDay: () =>
    set((state) => {
      const nextTime: TimeOfDay = state.timeOfDay === 'day' ? 'night' : 'day';
      return {
        timeOfDay: nextTime,
        interiorLightsOn: true,
        headlightsOn: nextTime === 'night' ? true : state.headlightsOn,
      };
    }),

  setTimeOfDay: (time) =>
    set({
      timeOfDay: time,
      headlightsOn: time === 'night',
    }),

  setWeather: (weather) => set({ weather }),

  setGraphicsQuality: (quality) => set({ graphicsQuality: quality }),

  setBusSpeedKmh: (speed) => {
    const clamped = Math.max(0, Math.min(100, Math.round(speed * 10) / 10));
    set({
      busSpeedKmh: clamped,
      journeyStatus: clamped > 0 ? 'Đang di chuyển ổn định' : 'Đang tạm dừng',
    });
  },

  togglePause: () =>
    set((state) => {
      const nextPaused = !state.isPaused;
      return {
        isPaused: nextPaused,
        journeyStatus: nextPaused ? 'Tạm dừng mô phỏng' : 'Đang di chuyển ổn định',
      };
    }),

  toggleInteriorLights: () =>
    set((state) => ({ interiorLightsOn: !state.interiorLightsOn })),

  addDistance: (kmDelta) =>
    set((state) => ({
      distanceTraveledKm: state.distanceTraveledKm + kmDelta,
    })),

  setGuideOpen: (open) => set({ isGuideOpen: open }),

  setMouseSensitivity: (value) =>
    set({ mouseSensitivity: Math.max(0.3, Math.min(2.5, value)) }),

  toggleInvertCameraY: () =>
    set((state) => ({ invertCameraY: !state.invertCameraY })),
}));
