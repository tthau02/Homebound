import React from 'react';
import {
  Gauge,
  MapPin,
  Pause,
  Play,
  Users,
} from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';
import { useSeatStore } from '../../stores/useSeatStore';

export const BottomTelemetryBar: React.FC = () => {
  const busSpeedKmh = useGameStore((state) => state.busSpeedKmh);
  const setBusSpeedKmh = useGameStore((state) => state.setBusSpeedKmh);
  const isPaused = useGameStore((state) => state.isPaused);
  const togglePause = useGameStore((state) => state.togglePause);
  const routeName = useGameStore((state) => state.routeName);
  const distanceTraveledKm = useGameStore((state) => state.distanceTraveledKm);

  const seats = useSeatStore((state) => state.seats);
  const seatOrder = useSeatStore((state) => state.seatOrder);

  const totalSeats = seatOrder.length;
  const occupiedSeats = seatOrder.reduce(
    (acc, id) => (seats[id]?.occupied ? acc + 1 : acc),
    0
  );

  return (
    <div className="pointer-events-auto w-full max-w-5xl mx-auto px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-slate-950/75 backdrop-blur-md border border-slate-800/80 shadow-xl flex items-center justify-between gap-2">
      {/* Left: Speed, Odometer & Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="flex items-baseline gap-0.5 sm:gap-1">
            <span className="text-sm sm:text-base font-bold tabular-nums text-white">
              {isPaused ? 0 : busSpeedKmh}
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-400">km/h</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-[11px] text-slate-400 tabular-nums hidden sm:inline">
            {distanceTraveledKm.toFixed(1)} km
          </span>
        </div>

        {/* Speed Adjustment & Play/Pause */}
        <div className="flex items-center gap-1.5 pl-1.5 sm:pl-2 border-l border-slate-800">
          <button
            type="button"
            onClick={togglePause}
            title={isPaused ? 'Tiếp tục hành trình' : 'Tạm dừng mô phỏng'}
            className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            {isPaused ? (
              <Play className="w-3 h-3 text-emerald-400" />
            ) : (
              <Pause className="w-3 h-3 text-amber-400" />
            )}
          </button>
          <input
            id="bus-speed-range"
            type="range"
            min={20}
            max={100}
            step={2}
            value={busSpeedKmh}
            onChange={(e) => setBusSpeedKmh(Number(e.target.value))}
            title={`Điều chỉnh tốc độ (${busSpeedKmh} km/h)`}
            className="w-16 sm:w-20 h-1.5 accent-amber-500 bg-slate-800 rounded-lg cursor-pointer hidden sm:block"
          />
        </div>
      </div>

      {/* Center: Clean Route Badge */}
      <div className="flex items-center gap-1.5 min-w-0">
        <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 shrink-0">
          <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </div>
        <p className="text-[11px] sm:text-xs font-medium text-slate-200 truncate max-w-[110px] sm:max-w-none">
          {routeName}
        </p>
      </div>

      {/* Right: Seat Occupancy */}
      <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-900/80 border border-slate-800/80 text-slate-300 shrink-0">
        <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400" />
        <span className="tabular-nums font-medium text-[10px] sm:text-[11px]">
          {occupiedSeats}/{totalSeats}
        </span>
      </div>
    </div>
  );
};
