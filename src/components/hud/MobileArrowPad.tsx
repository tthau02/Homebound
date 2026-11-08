import React, { useEffect } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { MobileMoveDir, useGameStore } from '../../stores/useGameStore';
import { useCharacterStore } from '../../stores/useCharacterStore';

interface ArrowButtonProps {
  dir: Exclude<MobileMoveDir, null>;
  activeDir: MobileMoveDir;
  label: string;
  onChangeDir: (dir: MobileMoveDir) => void;
  children: React.ReactNode;
}

const ArrowButton: React.FC<ArrowButtonProps> = ({
  dir,
  activeDir,
  label,
  onChangeDir,
  children,
}) => {
  const isActive = activeDir === dir;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onPointerDown={(e) => {
        e.preventDefault();
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Ignore pointer capture errors on synthetic events
        }
        onChangeDir(dir);
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        onChangeDir(null);
      }}
      onPointerCancel={() => onChangeDir(null)}
      onLostPointerCapture={() => onChangeDir(null)}
      className={`flex items-center justify-center w-9 h-8 sm:w-10 sm:h-9 rounded-xl border transition-all select-none touch-none ${
        isActive
          ? 'bg-gradient-to-br from-amber-500 to-rose-500 text-slate-950 border-amber-300 scale-95 shadow-lg shadow-amber-500/30'
          : 'bg-slate-900/90 hover:bg-slate-800 text-amber-200 border-white/15 active:scale-95 shadow-md'
      }`}
    >
      {children}
    </button>
  );
};

export const MobileArrowPad: React.FC = () => {
  const player = useCharacterStore((state) => state.characters[state.playerId]);
  const mobileMoveDir = useGameStore((state) => state.mobileMoveDir);
  const setMobileMoveDir = useGameStore((state) => state.setMobileMoveDir);

  const isStanding = Boolean(player && player.state !== 'sitting');

  useEffect(() => {
    if (!isStanding) {
      setMobileMoveDir(null);
    }
    return () => {
      setMobileMoveDir(null);
    };
  }, [isStanding, setMobileMoveDir]);

  if (!isStanding) return null;

  return (
    <div
      className="pointer-events-auto lg:hidden p-1.5 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-white/10 shadow-2xl select-none touch-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="grid grid-cols-3 gap-1">
        <div />
        <ArrowButton
          dir="forward"
          activeDir={mobileMoveDir}
          label="Đi tiến"
          onChangeDir={setMobileMoveDir}
        >
          <ArrowUp className="w-4 h-4 stroke-[2.5]" />
        </ArrowButton>
        <div />

        <ArrowButton
          dir="left"
          activeDir={mobileMoveDir}
          label="Sang trái"
          onChangeDir={setMobileMoveDir}
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
        </ArrowButton>
        <ArrowButton
          dir="backward"
          activeDir={mobileMoveDir}
          label="Đi lùi"
          onChangeDir={setMobileMoveDir}
        >
          <ArrowDown className="w-4 h-4 stroke-[2.5]" />
        </ArrowButton>
        <ArrowButton
          dir="right"
          activeDir={mobileMoveDir}
          label="Sang phải"
          onChangeDir={setMobileMoveDir}
        >
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </ArrowButton>
      </div>
    </div>
  );
};

