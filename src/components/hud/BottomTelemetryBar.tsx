import React from 'react';
import {
  Clock,
  DoorOpen,
  FastForward,
  Gauge,
  LogOut,
  MapPin,
  Navigation,
  Pause,
  Play,
  PlayCircle,
  Users,
} from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';
import { useSeatStore } from '../../stores/useSeatStore';
import { JOURNEY_STOPS, useJourneyStore } from '../../stores/useJourneyStore';

export const BottomTelemetryBar: React.FC = () => {
  const busSpeedKmh = useGameStore((state) => state.busSpeedKmh);
  const setBusSpeedKmh = useGameStore((state) => state.setBusSpeedKmh);
  const isPaused = useGameStore((state) => state.isPaused);
  const togglePause = useGameStore((state) => state.togglePause);
  const distanceTraveledKm = useGameStore((state) => state.distanceTraveledKm);

  const currentStopIndex = useJourneyStore((state) => state.currentStopIndex);
  const stage = useJourneyStore((state) => state.stage);
  const distanceToNextStopKm = useJourneyStore((state) => state.distanceToNextStopKm);
  const stationTimerSec = useJourneyStore((state) => state.stationTimerSec);
  const isPlayerDisembarked = useJourneyStore((state) => state.isPlayerDisembarked);
  const departNextStop = useJourneyStore((state) => state.departNextStop);
  const disembarkPlayer = useJourneyStore((state) => state.disembarkPlayer);
  const boardPlayer = useJourneyStore((state) => state.boardPlayer);
  const fastForwardToNextStop = useJourneyStore((state) => state.fastForwardToNextStop);

  const seats = useSeatStore((state) => state.seats);
  const seatOrder = useSeatStore((state) => state.seatOrder);

  const totalSeats = seatOrder.length;
  const occupiedSeats = seatOrder.reduce(
    (acc, id) => (seats[id]?.occupied ? acc + 1 : acc),
    0
  );

  const currentStop = JOURNEY_STOPS[currentStopIndex] ?? JOURNEY_STOPS[0];
  const nextStop = JOURNEY_STOPS[currentStopIndex + 1] ?? null;

  // Calculate overall route percentage (0% to 100%)
  const totalRouteKm = 168;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((distanceTraveledKm / totalRouteKm) * 100))
  );

  return (
    <div className="pointer-events-auto w-full max-w-5xl mx-auto flex flex-col gap-1.5">
      {/* ==================== 1. JOURNEY ROUTE MILESTONE PROGRESS BAR ==================== */}
      <div className="w-full px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-xl border border-white/10 shadow-lg flex items-center justify-between gap-2 text-xs">
        {/* Route Progress Dots */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-1 overflow-x-auto scrollbar-none">
          {JOURNEY_STOPS.map((stop, idx) => {
            const isPassed = idx < currentStopIndex;
            const isCurrent = idx === currentStopIndex;
            return (
              <div
                key={stop.id}
                className="flex items-center gap-1.5 shrink-0"
              >
                <div
                  className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold border transition-all ${
                    isCurrent
                      ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400/40 animate-pulse'
                      : isPassed
                        ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {idx + 1}
                </div>
                <span
                  className={`text-[11px] font-medium hidden md:inline truncate max-w-[110px] ${
                    isCurrent
                      ? 'text-amber-300 font-bold'
                      : isPassed
                        ? 'text-emerald-300'
                        : 'text-slate-400'
                  }`}
                >
                  {stop.shortName}
                </span>
                {idx < JOURNEY_STOPS.length - 1 && (
                  <span className="w-3 sm:w-5 h-0.5 bg-slate-700/80 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Journey Progress Percentage & Status */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-300">
            {progressPercent}%
          </span>
          <div className="w-16 sm:w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ==================== 2. MAIN TELEMETRY & STATION ACTION BAR ==================== */}
      <div className="w-full px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/60 flex items-center justify-between gap-2">
        {/* Left: Speed, Odometer & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-amber-400 shadow-md">
              <Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span className="absolute inset-0 rounded-xl border border-amber-400/20 animate-pulse pointer-events-none" />
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-black tabular-nums tracking-tight text-white">
                {isPaused ? 0 : busSpeedKmh}
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-amber-300/80">
                km/h
              </span>
            </div>

            <span className="text-slate-600 hidden sm:inline">•</span>

            <span className="text-xs text-slate-300 font-mono tabular-nums hidden sm:inline">
              {distanceTraveledKm.toFixed(1)} km
            </span>
          </div>

          {/* Speed Adjustment & Play/Pause */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <button
              type="button"
              onClick={togglePause}
              title={isPaused ? 'Tiếp tục hành trình' : 'Tạm dừng xe'}
              className="flex items-center justify-center w-7 h-7 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 transition-all hover:scale-105 active:scale-95"
            >
              {isPaused ? (
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/30" />
              ) : (
                <Pause className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
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
              className="w-14 sm:w-20 h-1.5 accent-amber-500 bg-slate-800 rounded-lg cursor-pointer hidden lg:block transition-all"
            />
          </div>
        </div>

        {/* Center: Live Station Status & Next Stop ETA */}
        <div className="flex items-center gap-2 min-w-0">
          {stage === 'in_transit' && (
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-200 truncate">
                <Navigation className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">
                  Trạm kế:{' '}
                  <strong className="text-white">
                    {nextStop?.shortName ?? 'Bến cuối Cần Thơ'}
                  </strong>
                </span>
                <span className="text-slate-500 hidden sm:inline">•</span>
                <span className="text-amber-300/90 font-mono text-[11px] hidden sm:inline">
                  còn {distanceToNextStopKm.toFixed(1)} km
                </span>
              </div>
              <button
                type="button"
                onClick={fastForwardToNextStop}
                title="Tua nhanh đến trạm dừng tiếp theo"
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 font-bold text-[10px] transition-all hover:scale-105"
              >
                <FastForward className="w-3 h-3" />
                <span className="hidden sm:inline">Đến ngay</span>
              </button>
            </div>
          )}

          {stage === 'approaching' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-200 text-xs font-bold animate-pulse">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Đang giảm tốc cập bến {nextStop?.shortName}...</span>
            </div>
          )}

          {stage === 'at_station' && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate max-w-[120px] sm:max-w-none">
                  {currentStop.shortName} ({Math.ceil(stationTimerSec)}s)
                </span>
              </div>

              {/* Disembark or Board Button */}
              {!isPlayerDisembarked ? (
                <button
                  type="button"
                  onClick={disembarkPlayer}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold text-xs shadow-md border border-amber-300 transition-all hover:scale-105"
                >
                  <DoorOpen className="w-3.5 h-3.5" />
                  <span>Xuống trạm</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={boardPlayer}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md border border-emerald-300 transition-all hover:scale-105"
                >
                  <LogOut className="w-3.5 h-3.5 rotate-180" />
                  <span>Bước lên xe</span>
                </button>
              )}

              {/* Depart Button */}
              <button
                type="button"
                onClick={departNextStop}
                title="Khởi hành xe đi chặng tiếp theo"
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-slate-700 transition-all hover:scale-105"
              >
                <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Khởi hành</span>
              </button>
            </div>
          )}

          {stage === 'completed' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-xs shadow-md border border-amber-300 animate-bounce">
              <span>🎉 Đã về tới Bến xe Cần Thơ!</span>
            </div>
          )}
        </div>

        {/* Right: Seat Occupancy */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 shrink-0 shadow-inner">
          <Users className="w-3.5 h-3.5 text-sky-400" />
          <span className="tabular-nums font-bold text-[11px] sm:text-xs">
            {occupiedSeats}/{totalSeats}
          </span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">khách</span>
        </div>
      </div>
    </div>
  );
};
