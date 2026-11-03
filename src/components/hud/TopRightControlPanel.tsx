import React from 'react';
import {
  Camera,
  Eye,
  Layers,
  Lightbulb,
  Moon,
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
    if (mode === 'interior') return <Eye className="w-4 h-4" />;
    if (mode === 'top-down') return <Layers className="w-4 h-4" />;
    return <Video className="w-4 h-4" />;
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
    <div className="pointer-events-auto flex flex-col items-end gap-2.5">
      {/* Main Camera Selector Card */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950/75 backdrop-blur-md border border-slate-800/80 shadow-xl">
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 text-xs font-medium text-slate-400">
          <Camera className="w-3.5 h-3.5 text-amber-400" />
          <span>Góc nhìn:</span>
        </div>

        {CAMERA_ORDER.map((mode) => {
          const preset = CAMERA_PRESETS[mode];
          const isActive = cameraMode === mode;

          return (
            <button
              key={mode}
              type="button"
              onClick={() => setCameraMode(mode)}
              title={`${preset.label} (Phím ${preset.keyTrigger})`}
              className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md shadow-red-950/50 scale-[1.02]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              {renderCameraIcon(mode)}
              <span>{preset.shortLabel}</span>
              <kbd
                className={`px-1.5 py-0.5 text-[10px] rounded font-mono ${
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

      {/* Environment & Graphics Row */}
      <div className="flex items-center gap-2">
        {/* Day / Night Mode Toggle */}
        <button
          type="button"
          onClick={handleTimeToggle}
          disabled={!canChangeEnvironment}
          title={
            isOnlineMode && !canChangeEnvironment
              ? 'Chỉ chủ phòng, tài xế hoặc phụ xe được đổi thời gian'
              : 'Đổi thời gian của chuyến xe'
          }
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold backdrop-blur-md border transition-all shadow-lg ${
            timeOfDay === 'day'
              ? 'bg-sky-950/75 border-sky-700/60 text-sky-200 hover:bg-sky-900/80'
              : 'bg-indigo-950/80 border-indigo-700/60 text-amber-300 hover:bg-indigo-900/80'
          }`}
        >
          {timeOfDay === 'day' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Ban ngày (Day)</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-amber-300" />
              <span>Ban đêm (Night)</span>
            </>
          )}
        </button>

        {/* Interior Cabin Light Toggle */}
        <button
          type="button"
          onClick={toggleInteriorLights}
          title="Bật/Tắt đèn trần nội thất"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium backdrop-blur-md border transition-all shadow-lg ${
            interiorLightsOn
              ? 'bg-amber-950/75 border-amber-700/60 text-amber-200 hover:bg-amber-900/70'
              : 'bg-slate-950/75 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Đèn trần</span>
        </button>

        {/* Graphics Quality Selector */}
        <button
          type="button"
          onClick={cycleQuality}
          title="Chuyển đổi chất lượng đồ họa (Low / Medium / High)"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-950/75 backdrop-blur-md border border-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-900/80 transition-all shadow-lg"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="uppercase">{graphicsQuality}</span>
        </button>
      </div>
    </div>
  );
};

