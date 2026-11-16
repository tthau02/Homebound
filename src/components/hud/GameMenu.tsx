import React, { useEffect } from 'react';
import {
  BookOpen,
  Coins,
  Globe,
  HelpCircle,
  Map as MapIcon,
  Settings,
  ShoppingBag,
  Users,
  X,
} from 'lucide-react';
import { GraphicsQuality, useGameStore } from '../../stores/useGameStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useInteractionStore } from '../../stores/useInteractionStore';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';
import { useEconomyLedgerStore } from '../../stores/useEconomyLedgerStore';
import { useLiveOpsStore } from '../../stores/useLiveOpsStore';
import { useTelemetryStore } from '../../stores/useTelemetryStore';
import { useStoryStore } from '../../stores/useStoryStore';
import { MenuTab, useHudStore } from '../../stores/useHudStore';
import { useJourneyStore } from '../../stores/useJourneyStore';
import { getActiveChapter } from '../../game/story/storyEngine';
import { Button, Kbd, SectionTitle, Segmented, ToggleRow } from '../ui/primitives';
import { useEnvironmentControls } from './useEnvironmentControls';

const TABS: { id: MenuTab; label: string; icon: React.ReactNode }[] = [
  { id: 'journey', label: 'Hành trình', icon: <MapIcon className="h-4 w-4" /> },
  { id: 'passengers', label: 'Hành khách', icon: <Users className="h-4 w-4" /> },
  { id: 'community', label: 'Cộng đồng', icon: <Globe className="h-4 w-4" /> },
  { id: 'shop', label: 'Cửa hàng', icon: <ShoppingBag className="h-4 w-4" /> },
  { id: 'settings', label: 'Cài đặt', icon: <Settings className="h-4 w-4" /> },
  { id: 'help', label: 'Trợ giúp', icon: <HelpCircle className="h-4 w-4" /> },
];

/** Unified pause menu (Esc). Hosts settings natively and launches the existing feature modals. */
export const GameMenu: React.FC = () => {
  const menuOpen = useHudStore((s) => s.menuOpen);
  const menuTab = useHudStore((s) => s.menuTab);
  const setMenuTab = useHudStore((s) => s.setMenuTab);
  const closeMenu = useHudStore((s) => s.closeMenu);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Escape') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        (e.target as HTMLElement).blur();
        return;
      }
      if (!useJourneyStore.getState().hasStarted || useStoryStore.getState().dialogue) return;
      // Esc first closes a passenger popup, then toggles the menu
      if (useInteractionStore.getState().selectedCharacterId) {
        useInteractionStore.getState().closeCharacterInteraction();
        return;
      }
      useHudStore.getState().toggleMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!menuOpen) return null;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-3 backdrop-blur-sm sm:p-6"
      onClick={closeMenu}
    >
      <div
        role="dialog"
        aria-label="Menu trò chơi"
        onClick={(e) => e.stopPropagation()}
        className="flex h-[min(640px,92dvh)] w-full max-w-4xl animate-slide-up flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-900 text-ink-100 shadow-hud sm:flex-row"
      >
        <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/[0.06] bg-ink-950/50 p-2 sm:w-52 sm:flex-col sm:border-b-0 sm:border-r sm:p-3">
          <p className="hidden px-2 pb-3 pt-1 text-sm font-bold text-white sm:block">Virtual Bus</p>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMenuTab(tab.id)}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${menuTab === tab.id ? 'bg-ink-700 text-white' : 'text-ink-300 hover:bg-white/[0.05] hover:text-white'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
          <div className="mt-auto hidden sm:block">
            <Button tone="accent" className="w-full" onClick={closeMenu} kbd="Esc">
              Tiếp tục
            </Button>
          </div>
        </nav>

        <section className="relative min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
          <button
            type="button"
            onClick={closeMenu}
            aria-label="Đóng menu"
            className="absolute right-3 top-3 rounded-lg p-2 text-ink-400 hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          {menuTab === 'journey' && <JourneyTab />}
          {menuTab === 'passengers' && <PassengersTab />}
          {menuTab === 'community' && <CommunityTab />}
          {menuTab === 'shop' && <ShopTab />}
          {menuTab === 'settings' && <SettingsTab />}
          {menuTab === 'help' && <HelpTab />}
        </section>
      </div>
    </div>
  );
};

const TabHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <header className="mb-5 pr-10">
    <h2 className="text-xl font-bold text-white">{title}</h2>
    {subtitle && <p className="mt-1 text-sm text-ink-300">{subtitle}</p>}
  </header>
);

const JourneyTab: React.FC = () => {
  const chapter = getActiveChapter();
  const enabled = useStoryStore((s) => s.enabled);
  const setEnabled = useStoryStore((s) => s.setEnabled);
  const journal = useStoryStore((s) => s.journal);
  const completed = useStoryStore((s) => s.completedObjectives);
  const active = useStoryStore((s) => s.activeObjectives);
  const unlockedEndings = useStoryStore((s) => s.unlockedEndings);
  const isOnlineMode = useMultiplayerStore((s) => s.isOnlineMode);

  return (
    <div>
      <TabHeader title={chapter.title} subtitle={chapter.subtitle} />
      <p className="text-sm leading-relaxed text-ink-200">{chapter.synopsis}</p>

      <div className="mt-5 rounded-xl border border-white/[0.06] bg-ink-950/40 px-4">
        <ToggleRow
          label="Chế độ cốt truyện"
          description={isOnlineMode ? 'Chỉ có ở chế độ chơi đơn.' : 'Hiện hội thoại, nhiệm vụ và cảnh quay đặc biệt.'}
          checked={enabled}
          onChange={setEnabled}
          disabled={isOnlineMode}
        />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <SectionTitle>Nhiệm vụ</SectionTitle>
          <ul className="mt-2 space-y-1.5 text-sm">
            {active.map((id) => (
              <li key={id} className="flex items-center gap-2 text-white">
                <span className="h-2 w-2 rotate-45 bg-accent" /> {chapter.objectives[id]?.title}
              </li>
            ))}
            {completed.map((id) => (
              <li key={id} className="flex items-center gap-2 text-ink-400 line-through">
                <span className="h-2 w-2 rotate-45 bg-ink-600" /> {chapter.objectives[id]?.title}
              </li>
            ))}
            {active.length + completed.length === 0 && <li className="text-ink-400">Chưa có nhiệm vụ.</li>}
          </ul>
        </div>
        <div>
          <SectionTitle>Nhật ký chuyến đi</SectionTitle>
          <ol className="mt-2 space-y-2 text-sm">
            {journal.map((entry, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-12 shrink-0 tabular-nums text-ink-400">km {entry.km.toFixed(0)}</span>
                <span className="text-ink-200">{entry.text}</span>
              </li>
            ))}
            {journal.length === 0 && <li className="text-ink-400">Nhật ký còn trống.</li>}
          </ol>
        </div>
      </div>

      <div className="mt-6">
        <SectionTitle>Kết thúc đã mở khoá</SectionTitle>
        <p className="mt-2 text-sm text-ink-300">
          {unlockedEndings.filter((e) => e.startsWith(chapter.id)).length} / 3 kết thúc của chương này
        </p>
      </div>
    </div>
  );
};

const PassengersTab: React.FC = () => {
  const characterOrder = useCharacterStore((s) => s.characterOrder);
  const characters = useCharacterStore((s) => s.characters);
  const relationships = useStoryStore((s) => s.relationships);
  const closeMenu = useHudStore((s) => s.closeMenu);

  const focus = (id: string) => {
    useCharacterStore.getState().setFocusedCharacterId(id);
    useInteractionStore.getState().openCharacterInteraction(id, 'menu');
    if (useGameStore.getState().cameraMode === 'chase') useGameStore.getState().setCameraMode('interior');
    closeMenu();
  };

  return (
    <div>
      <TabHeader title="Hành khách" subtitle="Chọn một người để camera hướng tới và mở trò chuyện." />
      <ul className="grid gap-2 sm:grid-cols-2">
        {characterOrder
          .filter((id) => !characters[id]?.isPlayer)
          .map((id) => {
            const c = characters[id];
            if (!c) return null;
            const rel = relationships[id] ?? 0;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => focus(id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-ink-800/60 p-3 text-left transition-colors hover:border-accent/50 hover:bg-ink-800"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-950 text-xl">{c.avatar}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold text-white">
                      {c.name}
                      {c.seatId && <span className="text-xs font-medium text-ink-400">ghế {c.seatId}</span>}
                    </span>
                    <span className="block truncate text-xs text-ink-300">{c.activityLabel}</span>
                  </span>
                  {rel > 0 && (
                    <span className="shrink-0 text-xs font-semibold text-accent-soft" title="Mức thân thiết">
                      {'♥'.repeat(Math.min(3, Math.ceil(rel / 2)))}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
      </ul>
    </div>
  );
};

const CommunityTab: React.FC = () => {
  const isOnlineMode = useMultiplayerStore((s) => s.isOnlineMode);
  const currentRoom = useMultiplayerStore((s) => s.currentRoom);
  const setLobbyModalOpen = useMultiplayerStore((s) => s.setLobbyModalOpen);
  const setSocialPanelOpen = useMultiplayerStore((s) => s.setSocialPanelOpen);
  const closeMenu = useHudStore((s) => s.closeMenu);

  return (
    <div>
      <TabHeader
        title="Cộng đồng"
        subtitle="Đi chung chuyến với bạn bè qua kết nối ngang hàng (P2P). Chia sẻ mã phòng để mời người khác."
      />
      <div className="flex flex-wrap gap-2">
        <Button
          tone="accent"
          icon={<Globe className="h-4 w-4" />}
          onClick={() => {
            setLobbyModalOpen(true);
            closeMenu();
          }}
        >
          {isOnlineMode ? 'Quản lý phòng' : 'Tạo / vào phòng'}
        </Button>
        {isOnlineMode && (
          <Button
            icon={<Users className="h-4 w-4" />}
            onClick={() => {
              setSocialPanelOpen(true);
              closeMenu();
            }}
          >
            Bạn bè & tin nhắn
          </Button>
        )}
      </div>
      {isOnlineMode && currentRoom && (
        <p className="mt-4 text-sm text-ink-300">
          Đang ở phòng <span className="font-semibold text-white">{currentRoom.name}</span> (
          <span className="font-mono">{currentRoom.roomId}</span>) ·{' '}
          {Object.keys(currentRoom.players).length} người chơi
        </p>
      )}
    </div>
  );
};

const ShopTab: React.FC = () => {
  const coinBalance = useEconomyLedgerStore((s) => s.coinBalance);
  const setEconomyOpen = useEconomyLedgerStore((s) => s.setModalOpen);
  const closeMenu = useHudStore((s) => s.closeMenu);
  return (
    <div>
      <TabHeader title="Cửa hàng & túi đồ" subtitle="Xu demo lưu trên trình duyệt này. Hoàn thành nhiệm vụ cốt truyện để nhận thêm xu." />
      <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-ink-950/40 p-4">
        <Coins className="h-6 w-6 text-accent" />
        <span className="text-2xl font-bold tabular-nums text-white">{coinBalance.toLocaleString('vi-VN')}</span>
        <span className="text-sm text-ink-400">xu</span>
      </div>
      <Button
        tone="accent"
        className="mt-4"
        icon={<ShoppingBag className="h-4 w-4" />}
        onClick={() => {
          setEconomyOpen(true);
          closeMenu();
        }}
      >
        Mở cửa hàng, trang phục & nhiệm vụ ngày
      </Button>
    </div>
  );
};

const QUALITY_OPTIONS: { value: GraphicsQuality; label: string; hint: string }[] = [
  { value: 'low', label: 'Thấp', hint: 'Không bóng đổ, không hậu kỳ, tầm nhìn ngắn' },
  { value: 'medium', label: 'Vừa', hint: 'Bóng đổ, bloom, khử răng cưa' },
  { value: 'high', label: 'Cao', hint: 'Thêm AO, tầm nhìn xa, cảnh dày hơn' },
];

const SettingsTab: React.FC = () => {
  const graphicsQuality = useGameStore((s) => s.graphicsQuality);
  const setGraphicsQuality = useGameStore((s) => s.setGraphicsQuality);
  const interiorLightsOn = useGameStore((s) => s.interiorLightsOn);
  const toggleInteriorLights = useGameStore((s) => s.toggleInteriorLights);
  const mouseSensitivity = useGameStore((s) => s.mouseSensitivity);
  const setMouseSensitivity = useGameStore((s) => s.setMouseSensitivity);
  const invertCameraY = useGameStore((s) => s.invertCameraY);
  const toggleInvertCameraY = useGameStore((s) => s.toggleInvertCameraY);
  const busSpeedKmh = useGameStore((s) => s.busSpeedKmh);
  const setBusSpeedKmh = useGameStore((s) => s.setBusSpeedKmh);
  const stage = useJourneyStore((s) => s.stage);
  const { timeOfDay, setTime, canChangeEnvironment, isOnlineMode } = useEnvironmentControls();
  const speedLocked = isOnlineMode || stage !== 'in_transit';

  return (
    <div className="space-y-7">
      <TabHeader title="Cài đặt" />

      <div>
        <SectionTitle>Đồ hoạ</SectionTitle>
        <div className="mt-2">
          <Segmented ariaLabel="Chất lượng đồ hoạ" value={graphicsQuality} options={QUALITY_OPTIONS} onChange={setGraphicsQuality} />
        </div>
        <p className="mt-2 text-xs text-ink-400">{QUALITY_OPTIONS.find((q) => q.value === graphicsQuality)?.hint}</p>
      </div>

      <div>
        <SectionTitle>Môi trường</SectionTitle>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Segmented
            ariaLabel="Thời gian"
            value={timeOfDay}
            options={[
              { value: 'day', label: 'Ban ngày' },
              { value: 'night', label: 'Ban đêm' },
            ]}
            onChange={setTime}
          />
          {!canChangeEnvironment && <span className="text-xs text-ink-400">Chỉ chủ phòng / tài xế được đổi.</span>}
        </div>
        <div className="mt-2 rounded-xl border border-white/[0.06] bg-ink-950/40 px-4">
          <ToggleRow label="Đèn trong xe" checked={interiorLightsOn} onChange={() => toggleInteriorLights()} />
        </div>
      </div>

      <div>
        <SectionTitle>Tốc độ xe</SectionTitle>
        <div className="mt-2 flex items-center gap-4">
          <input
            type="range"
            min={20}
            max={100}
            step={1}
            value={Math.round(busSpeedKmh)}
            disabled={speedLocked}
            onChange={(e) => setBusSpeedKmh(Number(e.target.value))}
            aria-label="Tốc độ xe"
            className="w-full max-w-xs accent-[#f5a524] disabled:opacity-40"
          />
          <span className="w-20 text-sm tabular-nums text-ink-200">{Math.round(busSpeedKmh)} km/h</span>
        </div>
        {speedLocked && <p className="mt-1 text-xs text-ink-400">Tốc độ được điều khiển tự động khi vào trạm hoặc khi chơi mạng.</p>}
      </div>

      <div>
        <SectionTitle>Camera</SectionTitle>
        <div className="mt-2 flex items-center gap-4">
          <input
            type="range"
            min={0.3}
            max={2.5}
            step={0.1}
            value={mouseSensitivity}
            onChange={(e) => setMouseSensitivity(Number(e.target.value))}
            aria-label="Độ nhạy chuột"
            className="w-full max-w-xs accent-[#f5a524]"
          />
          <span className="w-20 text-sm tabular-nums text-ink-200">× {mouseSensitivity.toFixed(1)}</span>
        </div>
        <div className="mt-2 rounded-xl border border-white/[0.06] bg-ink-950/40 px-4">
          <ToggleRow label="Đảo trục dọc" description="Kéo chuột lên để nhìn xuống." checked={invertCameraY} onChange={() => toggleInvertCameraY()} />
        </div>
      </div>
    </div>
  );
};

const CONTROLS: [string, string][] = [
  ['W A S D', 'Đi lại (theo hướng camera)'],
  ['Shift', 'Đi nhanh'],
  ['Kéo chuột / chuột phải', 'Xoay camera 360°'],
  ['Con lăn', 'Phóng to / thu nhỏ'],
  ['V', 'Bật/tắt nhìn tự do (khoá chuột)'],
  ['C', 'Đưa camera về sau lưng'],
  ['1 · 2 · 3', 'Trong xe · Trên cao · Sau xe'],
  ['E', 'Tương tác / trò chuyện'],
  ['Space', 'Rời ghế · tiếp tục hội thoại'],
  ['Esc', 'Mở / đóng menu'],
  ['F3', 'Bảng chẩn đoán hiệu năng'],
];

const HelpTab: React.FC = () => {
  const setGuideOpen = useGameStore((s) => s.setGuideOpen);
  const setLiveOpsOpen = useLiveOpsStore((s) => s.setModalOpen);
  const setDiagnosticsOpen = useTelemetryStore((s) => s.setDiagnosticsOpen);
  const closeMenu = useHudStore((s) => s.closeMenu);
  const open = (fn: () => void) => () => {
    fn();
    closeMenu();
  };
  return (
    <div>
      <TabHeader title="Trợ giúp" />
      <SectionTitle>Điều khiển</SectionTitle>
      <dl className="mt-2 divide-y divide-white/[0.05] rounded-xl border border-white/[0.06] bg-ink-950/40">
        {CONTROLS.map(([key, desc]) => (
          <div key={key} className="flex items-center justify-between gap-4 px-4 py-2.5">
            <dt>
              <Kbd>{key}</Kbd>
            </dt>
            <dd className="text-right text-sm text-ink-200">{desc}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button icon={<BookOpen className="h-4 w-4" />} onClick={open(() => setGuideOpen(true))}>
          Hướng dẫn & góp ý
        </Button>
        <Button tone="ghost" onClick={open(() => setLiveOpsOpen(true))}>
          Vận hành & hỗ trợ
        </Button>
        <Button tone="ghost" onClick={open(() => setDiagnosticsOpen(true))}>
          Chẩn đoán (F3)
        </Button>
      </div>
    </div>
  );
};
