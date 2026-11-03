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
}

export const useGameStore = create<GameState>((set) => ({
  cameraMode: 'interior',
  timeOfDay: 'day',
  weather: 'sunny',
  graphicsQuality: 'high',
  busSpeedKmh: 68,
  isPaused: false,
  interiorLightsOn: true,
  headlightsOn: true,
  tripName: 'VB-2026 • Chuyến Xe Miền Tây',
  routeName: 'TP. Hồ Chí Minh → Tiền Giang → Cần Thơ (QL1A)',
  journeyStatus: 'Đang di chuyển ổn định',
  distanceTraveledKm: 42.8,

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

  setBusSpeedKmh: (speed) =>
    set({
      busSpeedKmh: Math.max(0, Math.min(100, speed)),
      journeyStatus: speed > 0 ? 'Đang di chuyển ổn định' : 'Đang tạm dừng',
    }),

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
}));

