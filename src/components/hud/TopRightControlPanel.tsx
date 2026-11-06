import React from 'react';
import {
  Eye,
  HelpCircle,
  Layers,
  Lightbulb,
  Moon,
  ShoppingBag,
  Sparkles,
  Sun,
  Video,
} from 'lucide-react';
import {
  CameraMode,
  GraphicsQuality,
  useGameStore,
} from '../../stores/useGameStore';
import { CAMERA_PRESETS } from '../../game/config/cameraConfig';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';
import { useEconomyLedgerStore } from '../../stores/useEconomyLedgerStore';

const CAMERA_ORDER: CameraMode[] = ['interior', 'top-down', 'chase'];

export const TopRightControlPanel: React.FC = () => {
  const cameraMode = useGameStore((state) => state.cameraMode);
  const setCameraMode = useGameStore((state) => state.setCameraMode);
  const timeOfDay = useGameStore((state) => state.timeOfDay);
  const toggleTimeOfDay = useGameStore((state) => state.toggleTimeOfDay);
  const interiorLightsOn = useGameStore((state) => state.interiorLightsOn);
  const toggleInteriorLights = useGameStore(
    (state) => state.toggleInteriorLights
  );
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);
  const setGraphicsQuality = useGameStore((state) => state.setGraphicsQuality);
  const setGuideOpen = useGameStore((state) => state.setGuideOpen);

  const coinBalance = useEconomyLedgerStore((s) => s.coinBalance);
  const setEconomyOpen = useEconomyLedgerStore((s) => s.setModalOpen);

  const isOnlineMode = useMultiplayerStore((state) => state.isOnlineMode);
  const currentRoom = useMultiplayerStore((state) => state.currentRoom);
  const user = useMultiplayerStore((state) => state.user);
  const emitJourneyControl = useMultiplayerStore(
    (state) => state.emitJourneyControl
  );
  const role = user ? currentRoom?.players[user.id]?.role : undefined;
  const canChangeEnvironment =
    !isOnlineMode || role === 'OWNER' || role === 'DRIVER' || role === 'ASSISTANT';

  const handleTimeToggle = () => {
    if (!canChangeEnvironment) return;
    if (isOnlineMode) {
      emitJourneyControl(
        'SET_TIME',
        undefined,
        undefined,
        timeOfDay === 'day' ? 'NIGHT' : 'DAY'
      );
      return;
    }
    toggleTimeOfDay();
  };

  const renderCameraIcon = (mode: CameraMode) => {
    if (mode === 'interior') return <Eye className="w-3.5 h-3.5" />;
    if (mode === 'top-down') return <Layers className="w-3.5 h-3.5" />;
    return <Video className="w-3.5 h-3.5" />;
  };

  const cycleQuality = () => {
    const nextMap: Record<GraphicsQuality, GraphicsQuality> = {
      low: 'medium',
      medium: 'high',
      high: 'low',
    };
    setGraphicsQuality(nextMap[graphicsQuality]);
  };

  return (
    <div className="pointer-events-auto flex flex-col items-end gap-1.5 sm:gap-2">
      {/* Camera Mode Selector */}
      <div className="flex items-center gap-1 p-0.5 sm:p-1 rounded-2xl bg-slate-950/75 backdrop-blur-md border border-slate-800/80 shadow-xl">
        {CAMERA_ORDER.map((mode) => {
          const preset = CAMERA_PRESETS[mode];
          const isActive = cameraMode === mode;

          return (
            <button
              key={mode}
              type="button"
              onClick={() => setCameraMode(mode)}
              title={`${preset.label} (Phím ${preset.keyTrigger})`}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md shadow-red-950/40 scale-[1.02]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              {renderCameraIcon(mode)}
              <span className="hidden sm:inline">{preset.shortLabel}</span>
              <kbd
                className={`px-1 py-0.2 text-[9px] rounded font-mono ${
                  isActive
                    ? 'bg-black/30 text-amber-200 border border-white/20'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {preset.keyTrigger}
              </kbd>
            </button>
          );
        })}
      </div>

      {/* Compact Quick Utilities Toolbar */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Day / Night Mode Toggle */}
        <button
          type="button"
          onClick={handleTimeToggle}
          disabled={!canChangeEnvironment}
          title={
            isOnlineMode && !canChangeEnvironment
              ? 'Chỉ chủ phòng/tài xế được đổi thời gian'
              : 'Đổi thời gian (Ngày / Đêm)'
          }
          className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-xs font-medium backdrop-blur-md border transition-all shadow-md ${
            timeOfDay === 'day'
              ? 'bg-sky-950/75 border-sky-700/60 text-sky-200 hover:bg-sky-900/80'
              : 'bg-indigo-950/80 border-indigo-700/60 text-amber-300 hover:bg-indigo-900/80'
          }`}
        >
          {timeOfDay === 'day' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Ngày</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Đêm</span>
            </>
          )}
        </button>

        {/* Interior Cabin Light Toggle */}
        <button
          type="button"
          onClick={toggleInteriorLights}
          title="Bật/Tắt đèn trần xe"
          className={`flex items-center justify-center w-7 h-7 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium backdrop-blur-md border transition-all shadow-md ${
            interiorLightsOn
              ? 'bg-amber-950/75 border-amber-700/60 text-amber-200 hover:bg-amber-900/70'
              : 'bg-slate-950/75 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span className="hidden sm:inline ml-1">Đèn</span>
        </button>

        {/* Graphics Quality */}
        <button
          type="button"
          onClick={cycleQuality}
          title="Chất lượng đồ họa (Low / Medium / High)"
          className="flex items-center justify-center w-7 h-7 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium bg-slate-950/75 backdrop-blur-md border border-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-900/80 transition-all shadow-md"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="uppercase text-[10px] hidden sm:inline ml-1">{graphicsQuality}</span>
        </button>

        {/* Wardrobe / Cosmetic Loadout */}
        <button
          type="button"
          onClick={() => setEconomyOpen(true)}
          title={`Tủ đồ & Phụ kiện (${coinBalance} Xu)`}
          className="flex items-center justify-center w-7 h-7 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium bg-slate-950/75 backdrop-blur-md border border-slate-800/80 text-amber-300 hover:text-amber-200 hover:bg-slate-900/80 transition-all shadow-md"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span className="text-[10px] font-semibold hidden sm:inline ml-1">{coinBalance}</span>
        </button>

        {/* Help / Guide Trigger */}
        <button
          type="button"
          onClick={() => setGuideOpen(true)}
          title="Hướng dẫn & Trợ giúp"
          className="flex items-center justify-center w-7 h-7 rounded-xl bg-slate-950/75 backdrop-blur-md border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-900/80 transition-all shadow-md"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
