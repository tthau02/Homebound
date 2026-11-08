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
  const distanceToNextStopKm = useJourneyStore(
    (state) => state.distanceToNextStopKm
  );
  const stationTimerSec = useJourneyStore((state) => state.stationTimerSec);
  const isPlayerDisembarked = useJourneyStore(
    (state) => state.isPlayerDisembarked
  );
  const departNextStop = useJourneyStore((state) => state.departNextStop);
  const disembarkPlayer = useJourneyStore((state) => state.disembarkPlayer);
  const boardPlayer = useJourneyStore((state) => state.boardPlayer);
  const fastForwardToNextStop = useJourneyStore(
    (state) => state.fastForwardToNextStop
  );

  const seats = useSeatStore((state) => state.seats);
  const seatOrder = useSeatStore((state) => state.seatOrder);

  const totalSeats = seatOrder.length;
  const occupiedSeats = seatOrder.reduce(
    (acc, id) => (seats[id]?.occupied ? acc + 1 : acc),
    0
  );

  const currentStop = JOURNEY_STOPS[currentStopIndex] ?? JOURNEY_STOPS[0];
  const nextStop = JOURNEY_STOPS[currentStopIndex + 1] ?? null;
  const displaySpeed = isPaused ? 0 : Math.round(busSpeedKmh);
  const isAutoSpeedLocked = stage === 'approaching' || stage === 'at_station';

  const totalRouteKm = JOURNEY_STOPS[JOURNEY_STOPS.length - 1]?.km ?? 72;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((distanceTraveledKm / totalRouteKm) * 100))
  );

  return (
    <div className="pointer-events-auto w-auto max-w-[54vw] sm:max-w-[330px] lg:w-[440px] xl:w-[485px] flex flex-col items-start gap-1.5">
      {/* ==================== A. COMPACT MOBILE / TABLET TELEMETRY CARD (< lg) ==================== */}
      <div className="flex lg:hidden flex-col gap-1 w-full px-2.5 py-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-white/10 shadow-2xl text-[11px]">
        {/* Row 1: Compact Station / Next Stop Status */}
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          {stage === 'in_transit' && (
            <>
              <div className="flex items-center gap-1 text-slate-200 min-w-0">
                <Navigation className="w-3 h-3 text-sky-400 shrink-0" />
                <span className="truncate font-semibold text-white">
                  {nextStop?.shortName ?? 'BX Mỹ Đình'}
                </span>
                <span className="text-[10px] font-mono tabular-nums text-amber-300/90 hidden sm:inline shrink-0">
                  ({distanceToNextStopKm.toFixed(0)}km)
                </span>
              </div>
              <button
                type="button"
                onClick={fastForwardToNextStop}
                title="Tua nhanh đến trạm kế"
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-sky-500/25 border border-sky-400/40 text-sky-200 font-bold text-[10px] shrink-0"
              >
                <FastForward className="w-3 h-3" />
                <span className="hidden sm:inline">Đến ngay</span>
              </button>
            </>
          )}

          {stage === 'approaching' && (
            <div className="flex items-center gap-1 text-amber-200 font-bold animate-pulse min-w-0">
              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">
                Vào bến {nextStop?.shortName}...
              </span>
            </div>
          )}

          {stage === 'at_station' && (
            <div className="flex items-center justify-between gap-1 w-full min-w-0">
              <span className="flex items-center gap-1 text-emerald-300 font-bold truncate tabular-nums">
                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{currentStop.shortName}</span>
                <span className="shrink-0">({Math.ceil(stationTimerSec)}s)</span>
              </span>

              <div className="flex items-center gap-1 shrink-0">
                {!isPlayerDisembarked ? (
                  <button
                    type="button"
                    onClick={disembarkPlayer}
                    className="px-1.5 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-[10px] whitespace-nowrap"
                  >
                    Xuống
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={boardPlayer}
                    className="px-1.5 py-0.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[10px] whitespace-nowrap"
                  >
                    Lên xe
                  </button>
                )}
                <button
                  type="button"
                  onClick={departNextStop}
                  title="Khởi hành chặng tiếp"
                  className="p-1 rounded-lg bg-slate-800 text-amber-300 border border-slate-700"
                >
                  <PlayCircle className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {stage === 'completed' && (
            <div className="text-amber-300 font-bold truncate">
              🎉 Đã tới BX Mỹ Đình!
            </div>
          )}
        </div>

        {/* Row 2: Compact Speed + Pause + Occupancy + Route % */}
        <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={togglePause}
              title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
              className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/5 border border-white/10 shrink-0"
            >
              {isPaused ? (
                <Play className="w-3 h-3 text-emerald-400 fill-emerald-400/30" />
              ) : (
                <Pause className="w-3 h-3 text-amber-400 fill-amber-400/30" />
              )}
            </button>
            <div className="flex items-baseline gap-0.5">
              <span className="inline-block min-w-[2.6ch] text-right text-sm font-black tabular-nums text-white">
                {displaySpeed}
              </span>
              <span className="text-[9px] font-semibold text-amber-300/80">
                km/h
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-300 shrink-0">
            <span className="flex items-center gap-0.5 tabular-nums font-semibold">
              <Users className="w-3 h-3 text-sky-400" />
              {occupiedSeats}/{totalSeats}
            </span>
            <span className="text-amber-300 font-mono font-bold tabular-nums">
              {progressPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* ==================== B. DESKTOP LEFT-DOCKED TELEMETRY & ROUTE (lg+) ==================== */}
      <div className="hidden lg:flex flex-col gap-1.5 w-full">
        {/* Pill 1: Route Milestone Dots + Live Station Controls */}
        <div className="w-full px-3 py-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-white/10 shadow-xl flex items-center justify-between gap-2 text-xs">
          {/* Compact 5-Stop Milestone Stepper */}
          <div className="flex items-center gap-1 shrink-0">
            {JOURNEY_STOPS.map((stop, idx) => {
              const isDockedOrDone =
                stage === 'at_station' || stage === 'completed';
              const isPassed = isDockedOrDone
                ? idx < currentStopIndex
                : idx <= currentStopIndex;
              const isCurrent = isDockedOrDone
                ? idx === currentStopIndex
                : idx === currentStopIndex + 1;

              return (
                <div key={stop.id} className="flex items-center gap-1">
                  <div
                    title={`${idx + 1}. ${stop.name} (${stop.km} km)`}
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
                  {idx < JOURNEY_STOPS.length - 1 && (
                    <span
                      className={`w-2 h-0.5 ${
                        isPassed ? 'bg-emerald-500/60' : 'bg-slate-700/80'
                      }`}
                    />
                  )}
                </div>
              );
            })}
            <span className="ml-1 text-[10px] font-mono font-bold tabular-nums text-amber-300">
              {progressPercent}%
            </span>
          </div>

          <span className="h-3.5 w-px bg-white/10 shrink-0" />

          {/* Active Station / Next Stop Controls */}
          <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
            {stage === 'in_transit' && (
              <>
                <div className="flex items-center gap-1 text-slate-200 min-w-0">
                  <Navigation className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate text-[11px]">
                    <strong className="text-white">
                      {nextStop?.shortName ?? 'BX Mỹ Đình'}
                    </strong>{' '}
                    <span className="text-amber-300/90 font-mono tabular-nums">
                      ({distanceToNextStopKm.toFixed(1)}km)
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={fastForwardToNextStop}
                  title="Tua nhanh đến trạm dừng tiếp theo"
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 font-bold text-[10px] transition-all hover:scale-105 shrink-0 whitespace-nowrap"
                >
                  <FastForward className="w-3 h-3" />
                  <span>Đến ngay</span>
                </button>
              </>
            )}

            {stage === 'approaching' && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-200 text-[11px] font-bold animate-pulse min-w-0">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">
                  Đang cập bến {nextStop?.shortName}...
                </span>
              </div>
            )}

            {stage === 'at_station' && (
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold min-w-0">
                  <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate tabular-nums">
                    {currentStop.shortName} ({Math.ceil(stationTimerSec)}s)
                  </span>
                </div>

                {!isPlayerDisembarked ? (
                  <button
                    type="button"
                    onClick={disembarkPlayer}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold text-[11px] border border-amber-300 transition-all shrink-0 whitespace-nowrap"
                  >
                    <DoorOpen className="w-3 h-3 shrink-0" />
                    <span>Xuống</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={boardPlayer}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-[11px] border border-emerald-300 transition-all shrink-0 whitespace-nowrap"
                  >
                    <LogOut className="w-3 h-3 rotate-180 shrink-0" />
                    <span>Lên xe</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={departNextStop}
                  title="Khởi hành xe đi chặng tiếp theo"
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-bold border border-slate-700 transition-all shrink-0 whitespace-nowrap"
                >
                  <PlayCircle className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="hidden xl:inline">Đi tiếp</span>
                </button>
              </div>
            )}

            {stage === 'completed' && (
              <div className="px-2.5 py-0.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-[11px] border border-amber-300 truncate">
                🎉 Đã tới BX Mỹ Đình!
              </div>
            )}
          </div>
        </div>

        {/* Pill 2: Speedometer, Odometer, Pause/Slider & Occupancy */}
        <div className="w-full px-3.5 py-2 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/60 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-amber-400 shadow-md shrink-0">
              <Gauge className="w-4 h-4 text-amber-400" />
              <span className="absolute inset-0 rounded-xl border border-amber-400/20 animate-pulse pointer-events-none" />
            </div>

            <div className="flex items-baseline gap-1">
              <span className="inline-block min-w-[3ch] text-right text-lg font-black tabular-nums tracking-tight text-white">
                {displaySpeed}
              </span>
              <span className="text-[11px] font-semibold text-amber-300/80">
                km/h
              </span>
            </div>

            <span className="text-slate-600">•</span>

            <span className="inline-block min-w-[6.2ch] text-right text-xs text-slate-300 font-mono tabular-nums">
              {distanceTraveledKm.toFixed(1)} km
            </span>
          </div>

          <div className="flex items-center gap-2 pl-2.5 border-l border-white/10">
            <button
              type="button"
              onClick={togglePause}
              title={isPaused ? 'Tiếp tục hành trình' : 'Tạm dừng xe'}
              className="flex items-center justify-center w-7 h-7 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 transition-all hover:scale-105 active:scale-95 shrink-0"
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
              min={0}
              max={100}
              step={1}
              disabled={isAutoSpeedLocked}
              value={displaySpeed}
              onChange={(e) => setBusSpeedKmh(Number(e.target.value))}
              title={
                isAutoSpeedLocked
                  ? `Tốc độ tự động khi vào/đỗ bến (${displaySpeed} km/h)`
                  : `Điều chỉnh tốc độ (${displaySpeed} km/h)`
              }
              className="w-20 xl:w-24 h-1.5 accent-amber-500 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-200 shrink-0 shadow-inner">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span className="tabular-nums font-bold text-xs">
              {occupiedSeats}/{totalSeats}
            </span>
            <span className="text-[10px] text-slate-400 hidden xl:inline">
              khách
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
