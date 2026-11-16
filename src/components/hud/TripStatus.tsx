import React from 'react';
import { CloudRain, Moon, Pause, Play, Sun, Users } from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';
import { useJourneyStore } from '../../stores/useJourneyStore';
import { useSeatStore } from '../../stores/useSeatStore';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';
import { IconButton } from '../ui/primitives';

/** Bottom-left compact trip card: speed, clock-of-day, weather, occupancy, pause. */
export const TripStatus: React.FC = () => {
  const speed = useGameStore((s) => s.busSpeedKmh);
  const isPaused = useGameStore((s) => s.isPaused);
  const togglePause = useGameStore((s) => s.togglePause);
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const weather = useGameStore((s) => s.weather);
  const stage = useJourneyStore((s) => s.stage);
  const isOnlineMode = useMultiplayerStore((s) => s.isOnlineMode);
  const occupied = useSeatStore((s) => s.seatOrder.reduce((n, id) => (s.seats[id]?.occupied ? n + 1 : n), 0));
  const totalSeats = useSeatStore((s) => s.seatOrder.length);

  const displaySpeed = isPaused ? 0 : Math.round(speed);
  const stageLabel =
  stage === 'boarding'
    ? 'Đang đón khách'
    : stage === 'at_station'
      ? 'Đang dừng'
      : stage === 'approaching'
        ? 'Giảm tốc'
        : stage === 'completed'
          ? 'Đã đến'
          : 'Đang chạy';

  return (
    <div className="pointer-events-auto hud-panel flex items-center gap-3 py-1.5 pl-4 pr-1.5">
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums leading-none text-white">{displaySpeed}</span>
        <span className="text-xs font-medium text-ink-400">km/h</span>
      </div>
      <div className="hidden h-8 w-px bg-white/10 sm:block" />
      <div className="hidden flex-col text-xs sm:flex">
        <span className="font-semibold text-ink-100">{isPaused ? 'Tạm dừng' : stageLabel}</span>
        <span className="flex items-center gap-2 text-ink-400">
          <span className="inline-flex items-center gap-1">
            {timeOfDay === 'night' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            {timeOfDay === 'night' ? 'Đêm' : 'Ngày'}
          </span>
          {weather !== 'sunny' && (
            <span className="inline-flex items-center gap-1">
              <CloudRain className="h-3.5 w-3.5" />
              {weather === 'rainy' ? 'Mưa' : 'Âm u'}
            </span>
          )}
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Users className="h-3.5 w-3.5" />
            {occupied}/{totalSeats}
          </span>
        </span>
      </div>
      {!isOnlineMode && (
        <IconButton label={isPaused ? 'Tiếp tục mô phỏng' : 'Tạm dừng mô phỏng'} onClick={togglePause}>
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </IconButton>
      )}
    </div>
  );
};
