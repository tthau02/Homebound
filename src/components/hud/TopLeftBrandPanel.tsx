import React from 'react';
import { Bus, Globe, Radio } from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';
import { HudBadge } from '../ui/HudBadge';

export const TopLeftBrandPanel: React.FC = () => {
  const tripName = useGameStore((state) => state.tripName);
  const journeyStatus = useGameStore((state) => state.journeyStatus);
  const isPaused = useGameStore((state) => state.isPaused);

  const isOnlineMode = useMultiplayerStore((state) => state.isOnlineMode);
  const user = useMultiplayerStore((state) => state.user);
  const setLobbyModalOpen = useMultiplayerStore(
    (state) => state.setLobbyModalOpen
  );

  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-3.5 px-4 py-3 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80 shadow-xl">
      {/* Brand Logo Emblem */}
      <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 to-amber-500 text-white shadow-lg shadow-red-900/30">
        <Bus className="w-6 h-6" />
      </div>

      {/* Trip Title & Journey Status */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold tracking-wide text-white uppercase">
            Virtual Bus
          </h1>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
            PHASE 3
          </span>
        </div>

        <p className="text-xs font-medium text-slate-300 mt-0.5">{tripName}</p>

        <div className="mt-1.5 flex items-center gap-2">
          <HudBadge variant={isPaused ? 'amber' : 'emerald'}>
            <Radio className="w-3 h-3 animate-pulse" />
            <span>{journeyStatus}</span>
          </HudBadge>
        </div>
      </div>

      {/* Multiplayer Lobby Button */}
      <button
        type="button"
        onClick={() => setLobbyModalOpen(true)}
        className={`ml-1 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all shadow-md ${
          isOnlineMode
            ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/30'
            : 'bg-gradient-to-r from-amber-500 to-red-500 text-slate-950 border-amber-300 hover:from-amber-400 hover:to-red-400'
        }`}
      >
        <Globe className="w-3.5 h-3.5" />
        <span>
          {isOnlineMode
            ? `Online (${user?.displayName ?? 'Đã kết nối'})`
            : 'Bến Xe Multiplayer'}
        </span>
      </button>
    </div>
  );
};
