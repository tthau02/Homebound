import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Crosshair,
  Footprints,
  Armchair,
  Users,
  XCircle,
} from 'lucide-react';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useInteractionStore } from '../../stores/useInteractionStore';
import { useGameStore } from '../../stores/useGameStore';

export const PassengerListDrawer: React.FC = () => {
  // Collapsed by default so screen stays clean and immersive
  const [isOpen, setIsOpen] = useState(false);

  const characterOrder = useCharacterStore((state) => state.characterOrder);
  const characters = useCharacterStore((state) => state.characters);
  const focusedCharacterId = useCharacterStore(
    (state) => state.focusedCharacterId
  );
  const setFocusedCharacterId = useCharacterStore(
    (state) => state.setFocusedCharacterId
  );

  const openCharacterInteraction = useInteractionStore(
    (state) => state.openCharacterInteraction
  );
  const cameraMode = useGameStore((state) => state.cameraMode);
  const setCameraMode = useGameStore((state) => state.setCameraMode);

  const handleSelectPassenger = (charId: string) => {
    setFocusedCharacterId(charId);
    openCharacterInteraction(charId, 'menu');
    // If currently in exterior chase camera, switch to interior camera so the user sees the passenger clearly
    if (cameraMode === 'chase') {
      setCameraMode('interior');
    }
  };

  return (
    <div className="pointer-events-auto flex flex-col items-start">
      {/* Collapsed Pill Button */}
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/75 hover:bg-slate-900/90 backdrop-blur-md border border-slate-800/80 text-xs font-medium text-slate-300 hover:text-white shadow-lg transition-all"
        >
          <Users className="w-3.5 h-3.5 text-amber-400" />
          <span>Hành khách ({characterOrder.length})</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
      ) : (
        /* Expanded Drawer Card */
        <aside className="w-72 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-800/80 shadow-2xl overflow-hidden transition-all">
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/85 border-b border-slate-800/80">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 text-xs font-bold text-slate-100 hover:text-amber-300 transition-colors"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Hành khách ({characterOrder.length})</span>
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {focusedCharacterId && (
              <button
                type="button"
                onClick={() => setFocusedCharacterId(null)}
                title="Bỏ tập trung camera vào nhân vật"
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-semibold hover:bg-sky-500/30"
              >
                <XCircle className="w-3 h-3" />
                <span>Bỏ ghim</span>
              </button>
            )}
          </div>

          {/* Scrollable Passenger List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60 p-1.5 space-y-1">
            {characterOrder.map((id) => {
              const char = characters[id];
              if (!char) return null;

              const isFocused = focusedCharacterId === id;
              const isSeated = char.state === 'sitting';

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelectPassenger(id)}
                  className={`w-full flex items-center justify-between gap-2 p-2 rounded-xl text-left transition-all ${
                    isFocused
                      ? 'bg-sky-950/80 border border-sky-500/50 shadow-sm'
                      : 'hover:bg-slate-900/90 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800/90 border border-slate-700 text-sm shrink-0">
                      {char.avatar}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {char.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {char.activityLabel}
                      </p>
                    </div>
                  </div>

                  {/* Seat Badge & Status Icon */}
                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                        isSeated
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {isSeated ? (
                        <>
                          <Armchair className="w-2.5 h-2.5" />
                          <span>{char.seatId}</span>
                        </>
                      ) : (
                        <>
                          <Footprints className="w-2.5 h-2.5" />
                          <span>
                            {char.state === 'walking' ? 'Đi' : 'Lối đi'}
                          </span>
                        </>
                      )}
                    </span>

                    {isFocused && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] text-sky-400 font-medium">
                        <Crosshair className="w-2.5 h-2.5" />
                        Ghim
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      )}
    </div>
  );
};
