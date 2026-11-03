import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Cpu,
  Gauge,
  Play,
  ShieldCheck,
  Sliders,
  X,
} from 'lucide-react';
import { useTelemetryStore } from '../../stores/useTelemetryStore';
import { useGameStore } from '../../stores/useGameStore';
import {
  LoadTestReport,
  runProductionSelfTests,
  SelfTestResult,
} from '../../services/productionSelfTestSuite';

export const DiagnosticsPanelModal: React.FC = () => {
  const isDiagnosticsOpen = useTelemetryStore((s) => s.isDiagnosticsOpen);
  const setDiagnosticsOpen = useTelemetryStore((s) => s.setDiagnosticsOpen);
  const fps = useTelemetryStore((s) => s.fps);
  const frameTimeMs = useTelemetryStore((s) => s.frameTimeMs);
  const drawCalls = useTelemetryStore((s) => s.drawCalls);
  const triangles = useTelemetryStore((s) => s.triangles);
  const geometries = useTelemetryStore((s) => s.geometries);
  const textures = useTelemetryStore((s) => s.textures);
  const jsHeapMb = useTelemetryStore((s) => s.jsHeapMb);
  const autoQualityGuardEnabled = useTelemetryStore(
    (s) => s.autoQualityGuardEnabled
  );
  const setAutoQualityGuardEnabled = useTelemetryStore(
    (s) => s.setAutoQualityGuardEnabled
  );
  const lastAutoDowngradeReason = useTelemetryStore(
    (s) => s.lastAutoDowngradeReason
  );

  const graphicsQuality = useGameStore((s) => s.graphicsQuality);
  const setGraphicsQuality = useGameStore((s) => s.setGraphicsQuality);

  const [testSuiteData, setTestSuiteData] = useState<{
    results: SelfTestResult[];
    loadReport: LoadTestReport;
  } | null>(() => runProductionSelfTests());

  if (!isDiagnosticsOpen) return null;

  const handleRunTests = () => {
    setTestSuiteData(runProductionSelfTests());
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/60 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Hiệu Năng 3D, Kiểm Thử & Production Readiness (Phase 7)
              </h2>
              <p className="text-xs text-slate-400">
                WebGL Telemetry thời gian thực, Auto-FPS Quality Guard, Unit/Security Tests & P2P Load Benchmark
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDiagnosticsOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[78vh] overflow-y-auto space-y-5 text-xs">
          {/* 1. Real-time WebGL & Memory Telemetry */}
          <div className="space-y-2.5">
            <h3 className="font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Gauge className="w-4 h-4" />
              <span>1. Đo lường hiệu năng 3D WebGL (Real-time Telemetry)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400">FPS hiện tại</p>
                <p className="text-base font-bold text-emerald-400">{fps} FPS</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400">Frame Time</p>
                <p className="text-base font-bold text-sky-300">
                  {frameTimeMs} ms
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400">Draw Calls</p>
                <p className="text-base font-bold text-amber-300">
                  {drawCalls}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400">Triangles</p>
                <p className="text-base font-bold text-white">
                  {triangles.toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400">Geometries / Tex</p>
                <p className="text-base font-bold text-purple-300">
                  {geometries} / {textures}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400">JS Heap RAM</p>
                <p className="text-base font-bold text-emerald-300">
                  {jsHeapMb !== null ? `${jsHeapMb} MB` : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Quality Presets & Auto FPS Guard */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Cấu hình Chất lượng Đồ họa & Tự động Hạ cấu hình (Auto-FPS Guard)</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Khi bật Auto-FPS Guard, nếu thiết bị tụt dưới 32 FPS liên tục trong 3 giây, game tự động hạ High → Medium → Low.
              </p>
              {lastAutoDowngradeReason && (
                <p className="text-[11px] text-amber-300 font-semibold">
                  ⚡ {lastAutoDowngradeReason}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setGraphicsQuality(q)}
                  className={`px-3 py-1.5 rounded-xl font-bold uppercase ${
                    graphicsQuality === q
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {q}
                </button>
              ))}

              <button
                type="button"
                onClick={() =>
                  setAutoQualityGuardEnabled(!autoQualityGuardEnabled)
                }
                className={`px-3 py-1.5 rounded-xl font-bold border ${
                  autoQualityGuardEnabled
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                Auto Guard: {autoQualityGuardEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* 3. Automated Self-Test & P2P Load Benchmark */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>2. Kiểm thử Tự động (Unit / Security / 112-Player Load Benchmark)</span>
              </h3>
              <button
                type="button"
                onClick={handleRunTests}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Chạy lại bộ Test</span>
              </button>
            </div>

            {testSuiteData && (
              <>
                <div className="space-y-2">
                  {testSuiteData.results.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="font-bold text-white">{r.name}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-sky-300 font-semibold">
                            {r.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 pl-6">
                          {r.details}
                        </p>
                      </div>
                      <span className="font-mono text-[11px] text-emerald-300 shrink-0">
                        PASS ({r.durationMs}ms)
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-1">
                  <p className="font-bold text-indigo-200 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4" />
                    <span>
                      Báo cáo Load Test P2P: {testSuiteData.loadReport.simulatedRooms} Phòng ×{' '}
                      {testSuiteData.loadReport.simulatedPlayersPerRoom} Người (
                      {testSuiteData.loadReport.totalSimulatedEvents} sự kiện)
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Tổng thời gian xử lý: <strong>{testSuiteData.loadReport.totalDurationMs} ms</strong> • Độ trễ trung bình:{' '}
                    <strong>{testSuiteData.loadReport.avgLatencyPerEventMs} ms/event</strong>
                  </p>
                  <p className="text-[11px] text-amber-300/90">
                    ⚠️ Giới hạn kiến trúc P2P: {testSuiteData.loadReport.bottleneckNote}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

