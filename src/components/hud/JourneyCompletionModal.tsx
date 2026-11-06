import React from 'react';
import {
  Award,
  CheckCircle2,
  Coins,
  MapPin,
  RefreshCw,
  X,
} from 'lucide-react';
import { useJourneyStore, JOURNEY_STOPS } from '../../stores/useJourneyStore';
import { useGameStore } from '../../stores/useGameStore';

export const JourneyCompletionModal: React.FC = () => {
  const isCompletionModalOpen = useJourneyStore((state) => state.isCompletionModalOpen);
  const closeCompletionModal = useJourneyStore((state) => state.closeCompletionModal);
  const restartJourney = useJourneyStore((state) => state.restartJourney);
  const distanceTraveledKm = useGameStore((state) => state.distanceTraveledKm);

  if (!isCompletionModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-950/95 border border-amber-500/40 p-5 sm:p-6 shadow-2xl shadow-amber-950/50 flex flex-col items-center text-center">
        {/* Close button */}
        <button
          type="button"
          onClick={closeCompletionModal}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Trophy Badge */}
        <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 via-rose-500 to-red-600 shadow-xl shadow-amber-500/30 text-white mb-3">
          <Award className="w-9 h-9 sm:w-11 sm:h-11" />
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500" />
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-yellow-200">
          HOÀN THÀNH XUẤT SẮC HÀNH TRÌNH!
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-sm">
          Chuyến xe Virtual Bus đã cập bến an toàn tại{' '}
          <strong className="text-amber-300">Bến xe Trung tâm Cần Thơ</strong>.
        </p>

        {/* Journey Statistics Box */}
        <div className="w-full my-4 p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-around gap-2">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              Tổng Quãng Đường
            </span>
            <span className="text-base sm:text-lg font-black text-white font-mono mt-0.5">
              {distanceTraveledKm.toFixed(1)} km
            </span>
          </div>

          <div className="w-px h-8 bg-white/10" />

          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              Số Trạm Đã Dừng
            </span>
            <span className="text-base sm:text-lg font-black text-emerald-400 font-mono mt-0.5">
              {JOURNEY_STOPS.length} / {JOURNEY_STOPS.length}
            </span>
          </div>

          <div className="w-px h-8 bg-white/10" />

          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              Thưởng Hoàn Thành
            </span>
            <div className="flex items-center gap-1 text-amber-400 font-black text-base sm:text-lg mt-0.5">
              <Coins className="w-4 h-4" />
              <span>+500</span>
            </div>
          </div>
        </div>

        {/* Visited Stops Milestone List */}
        <div className="w-full flex flex-col gap-1.5 mb-5 text-left text-xs bg-slate-900/60 p-3 rounded-2xl border border-white/5">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Các Điểm Dừng & Bến Xe:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
            {JOURNEY_STOPS.map((stop) => (
              <div
                key={stop.id}
                className="flex items-center gap-1.5 text-slate-200 text-[11px]"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{stop.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={restartJourney}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 border border-amber-300 transition-all hover:scale-105 flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Chạy Lại Tuyến Mới</span>
          </button>

          <button
            type="button"
            onClick={closeCompletionModal}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/10 transition-all hover:scale-105 flex items-center justify-center gap-1.5"
          >
            <MapPin className="w-4 h-4 text-sky-400" />
            <span>Tự Do Tham Quan Bến</span>
          </button>
        </div>
      </div>
    </div>
  );
};
