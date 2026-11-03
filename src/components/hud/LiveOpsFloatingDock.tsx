import React from 'react';
import {
  Activity,
  AlertTriangle,
  Megaphone,
  Rocket,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useEconomyLedgerStore } from '../../stores/useEconomyLedgerStore';
import { useTelemetryStore } from '../../stores/useTelemetryStore';
import { useLiveOpsStore } from '../../stores/useLiveOpsStore';
import { EconomyAndCustomizationModal } from './EconomyAndCustomizationModal';
import { DiagnosticsPanelModal } from './DiagnosticsPanelModal';
import { LaunchAndLiveOpsModal } from './LaunchAndLiveOpsModal';

export const LiveOpsFloatingDock: React.FC = () => {
  const coinBalance = useEconomyLedgerStore((s) => s.coinBalance);
  const setEconomyOpen = useEconomyLedgerStore((s) => s.setModalOpen);

  const fps = useTelemetryStore((s) => s.fps);
  const setDiagnosticsOpen = useTelemetryStore((s) => s.setDiagnosticsOpen);

  const announcementBanner = useLiveOpsStore((s) => s.announcementBanner);
  const dismissAnnouncementBanner = useLiveOpsStore(
    (s) => s.dismissAnnouncementBanner
  );
  const setLiveOpsOpen = useLiveOpsStore((s) => s.setModalOpen);
  const maintenanceMode = useLiveOpsStore(
    (s) => s.featureFlags.maintenanceMode
  );
  const toggleFeatureFlag = useLiveOpsStore((s) => s.toggleFeatureFlag);

  return (
    <>
      {/* In-Game LiveOps Announcement Banner */}
      {announcementBanner && (
        <div className="pointer-events-auto mx-auto max-w-2xl px-3.5 py-2 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-amber-500/40 shadow-lg flex items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="leading-snug">{announcementBanner}</span>
          </div>
          <button
            type="button"
            onClick={dismissAnnouncementBanner}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
            title="Ẩn thông báo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quick Action Pill Bar for Phase 6, Phase 7 & Phase 8 */}
      <div className="pointer-events-auto flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setEconomyOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-slate-950/85 hover:bg-slate-900 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Ví & Loadout ({coinBalance} Coin)</span>
        </button>

        <button
          type="button"
          onClick={() => setDiagnosticsOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-slate-950/85 hover:bg-slate-900 border border-sky-500/40 text-sky-300 text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Hiệu Năng & Test ({fps} FPS)</span>
        </button>

        <button
          type="button"
          onClick={() => setLiveOpsOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all"
        >
          <Rocket className="w-3.5 h-3.5" />
          <span>Tân Thủ • Sự Kiện • Hỗ Trợ</span>
        </button>
      </div>

      {/* Maintenance Mode Gate Overlay (Phase 8 Feature Flag) */}
      {maintenanceMode && (
        <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-slate-950/90 backdrop-blur-lg p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-amber-500/50 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">
              Hệ Thống Đang Bảo Trì Định Kỳ (Maintenance Mode)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bến xe RoadMate / Virtual Bus 3D đang tạm dừng tiếp nhận chuyến mới để nâng cấp định kỳ. Bạn có thể tắt cờ <code className="text-amber-300">maintenanceMode</code> để quay lại ngay.
            </p>
            <button
              type="button"
              onClick={() => toggleFeatureFlag('maintenanceMode')}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              Tắt Chế Độ Bảo Trì & Tiếp Tục Chơi
            </button>
          </div>
        </div>
      )}

      {/* Phase 6, 7, 8 Modals */}
      <EconomyAndCustomizationModal />
      <DiagnosticsPanelModal />
      <LaunchAndLiveOpsModal />
    </>
  );
};

