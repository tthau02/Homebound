import React from 'react';
import { Bus, Globe, Sparkles } from 'lucide-react';
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
    <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 transition-all hover:border-amber-500/30">
      {/* Luxury Brand Emblem */}
      <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-amber-500 via-rose-600 to-red-600 text-white shadow-md shadow-red-950/60 shrink-0">
        <Bus className="w-4 h-4" />
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
      </div>

      {/* Brand & Route Title */}
      <div className="flex flex-col pr-1">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="text-xs sm:text-sm font-black tracking-wider text-white uppercase bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">
            Virtual Bus
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hidden sm:inline-flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5" />
            VIP 3D
          </span>
        </div>
        <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate max-w-[110px] sm:max-w-[170px] hidden xs:block">
          {tripName}
        </p>
      </div>

      {/* Sleek Multiplayer Trigger */}
      <button
        type="button"
        onClick={() => setLobbyModalOpen(true)}
        title={isOnlineMode ? 'Quản lý phòng chơi mạng' : 'Kết nối phòng chơi nhiều người'}
        className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold border transition-all shadow-md shrink-0 ${
          isOnlineMode
            ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/30'
            : 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 hover:from-amber-400 hover:to-rose-400 border-amber-300/80 shadow-amber-950/30'
        }`}
      >
        <Globe className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">
          {isOnlineMode
            ? user?.displayName ?? 'Online'
            : 'Multiplayer'}
        </span>
      </button>
    </div>
  );
};
