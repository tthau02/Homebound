import React from 'react';
import {
  Compass,
  Gauge,
  MapPin,
  Pause,
  Play,
  Users,
} from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';
import { useSeatStore } from '../../stores/useSeatStore';
import { CAMERA_PRESETS } from '../../game/config/cameraConfig';

export const BottomTelemetryBar: React.FC = () => {
  const busSpeedKmh = useGameStore((state) => state.busSpeedKmh);
  const setBusSpeedKmh = useGameStore((state) => state.setBusSpeedKmh);
  const isPaused = useGameStore((state) => state.isPaused);
  const togglePause = useGameStore((state) => state.togglePause);
  const routeName = useGameStore((state) => state.routeName);
  const distanceTraveledKm = useGameStore((state) => state.distanceTraveledKm);
  const cameraMode = useGameStore((state) => state.cameraMode);

  const seats = useSeatStore((state) => state.seats);
  const seatOrder = useSeatStore((state) => state.seatOrder);

  const activeCameraPreset = CAMERA_PRESETS[cameraMode];
  const totalSeats = seatOrder.length;
  const occupiedSeats = seatOrder.reduce(
    (acc, id) => (seats[id]?.occupied ? acc + 1 : acc),
    0
  );

  return (
    <div className="pointer-events-auto w-full max-w-5xl mx-auto px-4 py-2.5 rounded-2xl bg-slate-950/75 backdrop-blur-md border border-slate-800/80 shadow-2xl flex flex-wrap items-center justify-between gap-4">
      {/* Left: Vehicle Speed & Odometer */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold tabular-nums text-white">
                {isPaused ? 0 : busSpeedKmh}
              </span>
              <span className="text-xs font-medium text-slate-400">km/h</span>
            </div>
            <p className="text-[11px] text-slate-400 tabular-nums">
              Hành trình: {distanceTraveledKm.toFixed(1)} km
            </p>
          </div>
        </div>

        {/* Speed Slider & Pause Button */}
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-800">
          <button
            type="button"
            onClick={togglePause}
            title={isPaused ? 'Tiếp tục hành trình' : 'Tạm dừng mô phỏng'}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            {isPaused ? (
              <Play className="w-4 h-4 text-emerald-400" />
            ) : (
              <Pause className="w-4 h-4 text-amber-400" />
            )}
          </button>
          <div className="flex flex-col">
            <label
              htmlFor="bus-speed-range"
              className="text-[10px] text-slate-400 font-medium"
            >
              Tốc độ xe
            </label>
            <input
              id="bus-speed-range"
              type="range"
              min={20}
              max={100}
              step={2}
              value={busSpeedKmh}
              onChange={(e) => setBusSpeedKmh(Number(e.target.value))}
              className="w-24 h-1.5 accent-amber-500 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Center: Route Information */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400">
          <MapPin className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-100">{routeName}</p>
          <p className="text-[11px] text-slate-400">
            {activeCameraPreset.description}
          </p>
        </div>
      </div>

      {/* Right: Live Seat Occupancy & Active Camera */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
          <Users className="w-3.5 h-3.5 text-sky-400" />
          <span className="tabular-nums font-medium">
            {occupiedSeats}/{totalSeats} ghế có khách
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span>{activeCameraPreset.label}</span>
        </div>
      </div>
    </div>
  );
};
