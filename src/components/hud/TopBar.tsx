import React from 'react';
import { Coins, Eye, Globe, Layers, Menu, Video } from 'lucide-react';
import { CameraMode, useGameStore } from '../../stores/useGameStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useEconomyLedgerStore } from '../../stores/useEconomyLedgerStore';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';
import { useHudStore } from '../../stores/useHudStore';
import { IconButton, Segmented } from '../ui/primitives';
import { JourneyProgress } from './JourneyProgress';

const CAMERA_OPTIONS: { value: CameraMode; label: string; icon: React.ReactNode; hint: string }[] = [
  { value: 'interior', label: 'Trong xe', icon: <Eye className="h-4 w-4" />, hint: 'Trong xe (phím 1)' },
  { value: 'top-down', label: 'Trên cao', icon: <Layers className="h-4 w-4" />, hint: 'Nhìn từ trên (phím 2)' },
  { value: 'chase', label: 'Sau xe', icon: <Video className="h-4 w-4" />, hint: 'Bám đuôi xe (phím 3)' },
];

/** Top HUD row: menu & multiplayer (left) · route progress (centre) · camera & coins (right). */
export const TopBar: React.FC = () => {
  const cameraMode = useGameStore((s) => s.cameraMode);
  const setCameraMode = useGameStore((s) => s.setCameraMode);
  const coinBalance = useEconomyLedgerStore((s) => s.coinBalance);
  const isOnlineMode = useMultiplayerStore((s) => s.isOnlineMode);
  const setLobbyModalOpen = useMultiplayerStore((s) => s.setLobbyModalOpen);
  const openMenu = useHudStore((s) => s.openMenu);

  const changeCamera = (mode: CameraMode) => {
    useCharacterStore.getState().setFocusedCharacterId(null);
    setCameraMode(mode);
  };

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="pointer-events-auto hud-panel flex shrink-0 items-center gap-0.5 p-1">
        <IconButton label="Menu (Esc)" onClick={() => openMenu()}>
          <Menu className="h-5 w-5" />
        </IconButton>
        <IconButton
          label={isOnlineMode ? 'Phòng chơi mạng' : 'Chơi cùng bạn bè'}
          onClick={() => setLobbyModalOpen(true)}
          className={isOnlineMode ? 'text-ok' : ''}
        >
          <Globe className="h-5 w-5" />
        </IconButton>
      </div>

      <div className="hidden min-w-0 flex-1 justify-center md:flex">
        <JourneyProgress />
      </div>

      <div className="pointer-events-auto flex shrink-0 flex-col items-end gap-2">
        <div className="hud-panel p-1">
          <div className="hidden lg:block">
            <Segmented ariaLabel="Góc camera" value={cameraMode} options={CAMERA_OPTIONS} onChange={changeCamera} />
          </div>
          <div className="lg:hidden">
            <Segmented ariaLabel="Góc camera" value={cameraMode} options={CAMERA_OPTIONS} onChange={changeCamera} compact />
          </div>
        </div>
        <button
          type="button"
          onClick={() => openMenu('shop')}
          className="hud-panel inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-accent-soft hover:text-accent"
          title="Ví xu & cửa hàng"
        >
          <Coins className="h-4 w-4" />
          <span className="tabular-nums">{coinBalance.toLocaleString('vi-VN')}</span>
        </button>
      </div>
    </div>
  );
};

/** Route progress shown below the top bar on narrow screens. */
export const MobileJourneyProgress: React.FC = () => (
  <div className="flex justify-center md:hidden">
    <JourneyProgress />
  </div>
);
