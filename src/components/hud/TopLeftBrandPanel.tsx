import React from 'react';
import { Bus, Globe } from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';

export const TopLeftBrandPanel: React.FC = () => {
  const tripName = useGameStore((state) => state.tripName);

  const isOnlineMode = useMultiplayerStore((state) => state.isOnlineMode);
  const user = useMultiplayerStore((state) => state.user);
  const setLobbyModalOpen = useMultiplayerStore(
    (state) => state.setLobbyModalOpen
  );

  return (
    <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-slate-950/75 backdrop-blur-md border border-slate-800/80 shadow-xl">
      {/* Brand Icon */}
      <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-red-600 to-amber-500 text-white shadow-md shadow-red-900/40 shrink-0">
        <Bus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>

      {/* Brand & Route Title */}
      <div className="flex flex-col pr-0.5">
        <div className="flex items-center gap-1 leading-none">
          <span className="text-xs font-bold tracking-wider text-white uppercase">
            Virtual Bus
          </span>
          <span className="text-[10px] text-amber-400 font-semibold hidden sm:inline">
            3D
          </span>
        </div>
        <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium mt-0.5 truncate max-w-[100px] sm:max-w-[160px] hidden xs:block">
          {tripName}
        </p>
      </div>

      {/* Sleek Multiplayer Trigger */}
      <button
        type="button"
        onClick={() => setLobbyModalOpen(true)}
        title={isOnlineMode ? 'Quản lý phòng chơi mạng' : 'Kết nối phòng chơi nhiều người'}
        className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold border transition-all shadow-sm shrink-0 ${
          isOnlineMode
            ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/30'
            : 'bg-slate-900/85 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:text-amber-300'
        }`}
      >
        <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
        <span className="hidden sm:inline">
          {isOnlineMode
            ? user?.displayName ?? 'Online'
            : 'Multiplayer'}
        </span>
      </button>
    </div>
  );
};
