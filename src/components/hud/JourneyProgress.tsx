import React, { useEffect, useState } from 'react';
import { Bus, FastForward, Play } from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';
import { JOURNEY_STOPS, useJourneyStore } from '../../stores/useJourneyStore';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';
import { BIOMES } from '../../game/config/biomeConfig';
import { sceneryLive } from '../../game/environment/scenery/sceneryLive';

/** Polls the non-reactive scenery telemetry so the HUD can show the current region. */
function useBiomeLabel(): string {
  const [label, setLabel] = useState(BIOMES[sceneryLive.biome].label);
  useEffect(() => {
    const id = window.setInterval(() => {
      const next = BIOMES[sceneryLive.biome].label;
      setLabel((prev) => (prev === next ? prev : next));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);
  return label;
}

/** Top-centre route progress: stop dots, live bus marker, next-stop status. */
export const JourneyProgress: React.FC = () => {
  const km = useGameStore((s) => s.distanceTraveledKm);
  const stage = useJourneyStore((s) => s.stage);
  const stopIndex = useJourneyStore((s) => s.currentStopIndex);
  const stationTimerSec = useJourneyStore((s) => s.stationTimerSec);
  const fastForward = useJourneyStore((s) => s.fastForwardToNextStop);
  const departNextStop = useJourneyStore((s) => s.departNextStop);
  const isOnlineMode = useMultiplayerStore((s) => s.isOnlineMode);
  const biomeLabel = useBiomeLabel();

  const totalKm = JOURNEY_STOPS[JOURNEY_STOPS.length - 1]?.km ?? 72;
  const progress = Math.min(1, Math.max(0, km / totalKm));
  const currentStop = JOURNEY_STOPS[stopIndex] ?? JOURNEY_STOPS[0];
  const nextStop = JOURNEY_STOPS[stopIndex + 1] ?? null;
  const remainingKm = nextStop ? Math.max(0, nextStop.km - km) : 0;

  let status: React.ReactNode;
    if (stage === 'boarding' || stage === 'at_station') {
      status = (
        <>
          <span className="text-ok">{stage === 'boarding' ? 'Đang đón khách' : 'Đang dừng'}</span>
          <span className="truncate font-semibold text-white">{currentStop.shortName}</span>
          <span className="tabular-nums text-ink-300">· {Math.ceil(stationTimerSec)}s</span>
        </>
      );
    } else if (stage === 'approaching') {
      status = (
        <>
          <span className="text-accent">Đang vào trạm</span>
          <span className="truncate font-semibold text-white">{nextStop?.shortName}</span>
        </>
      );
    } else if (stage === 'completed') {
      status = <span className="font-semibold text-ok">Đã đến {currentStop.shortName}</span>;
    } else {
      status = (
        <>
          <span className="text-ink-400">Trạm kế</span>
          <span className="truncate font-semibold text-white">{nextStop?.shortName ?? '—'}</span>
          <span className="tabular-nums text-ink-300">· {remainingKm.toFixed(1)} km</span>
        </>
      );
    }

    return (
      <div className="pointer-events-auto hud-panel w-full max-w-[560px] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">{status}</div>
          {!isOnlineMode && stage === 'in_transit' && (
            <button
              type="button"
              onClick={fastForward}
              title="Tua nhanh đến trạm kế"
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-ink-300 hover:bg-white/[0.06] hover:text-white"
            >
              <FastForward className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tua</span>
            </button>
          )}
            {!isOnlineMode && (stage === 'boarding' || stage === 'at_station') && (
          <button
            type="button"
            onClick={departNextStop}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-accent px-2.5 py-1 text-xs font-semibold text-ink-950 hover:bg-accent-soft"
          >
            <Play className="h-3.5 w-3.5" />
            Khởi hành
          </button>
        )}
        </div>

        {/* Route line with stop dots and the live bus position */}
        <div className="relative mt-2.5 h-4" aria-label={`Đã đi ${km.toFixed(1)} trên ${totalKm} km`}>
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-ink-700" />
          <div
            className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-accent transition-[width] duration-700"
            style={{ width: `${progress * 100}%` }}
          />
          {JOURNEY_STOPS.map((stop, i) => {
            const passed = i <= stopIndex;
            return (
              <span
                key={stop.id}
                title={`${stop.shortName} · km ${stop.km}`}
                className={`absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${passed ? 'border-accent bg-accent' : 'border-ink-400 bg-ink-900'
                  }`}
                style={{ left: `${(stop.km / totalKm) * 100}%` }}
              />
            );
          })}
          <span
            className="absolute top-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink-950 shadow transition-[left] duration-700"
            style={{ left: `${progress * 100}%` }}
          >
            <Bus className="h-3 w-3" />
          </span>
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-ink-400">
          <span className="truncate">{biomeLabel}</span>
          <span className="shrink-0 tabular-nums">
            {km.toFixed(1)} / {totalKm} km
          </span>
        </div>
      </div>
    );
  };
