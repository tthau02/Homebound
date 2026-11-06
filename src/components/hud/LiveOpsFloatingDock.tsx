import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTelemetryStore } from '../../stores/useTelemetryStore';
import { useLiveOpsStore } from '../../stores/useLiveOpsStore';
import { EconomyAndCustomizationModal } from './EconomyAndCustomizationModal';
import { DiagnosticsPanelModal } from './DiagnosticsPanelModal';
import { LaunchAndLiveOpsModal } from './LaunchAndLiveOpsModal';

export const LiveOpsFloatingDock: React.FC = () => {
  const setDiagnosticsOpen = useTelemetryStore((s) => s.setDiagnosticsOpen);
  const maintenanceMode = useLiveOpsStore(
    (s) => s.featureFlags.maintenanceMode
  );
  const toggleFeatureFlag = useLiveOpsStore((s) => s.toggleFeatureFlag);

  // Hidden dev shortcut: F3 toggles the Diagnostics modal without cluttering the gameplay HUD
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        const current = useTelemetryStore.getState().isDiagnosticsOpen;
        setDiagnosticsOpen(!current);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setDiagnosticsOpen]);

  return (
    <>
      {/* Maintenance Mode Gate Overlay */}
      {maintenanceMode && (
        <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-slate-950/90 backdrop-blur-lg p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-amber-500/50 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">
              Hệ Thống Đang Bảo Trì Định Kỳ
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

      {/* Background Modals (Open on demand without polluting the main HUD) */}
      <EconomyAndCustomizationModal />
      <DiagnosticsPanelModal />
      <LaunchAndLiveOpsModal />
    </>
  );
};
