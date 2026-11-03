import React, { Suspense, lazy } from 'react';
import { GameHud } from '../components/hud/GameHud';

const GameCanvas = lazy(() => import('../game/core/GameCanvas').then((module) => ({
  default: module.GameCanvas,
})));

export const App: React.FC = () => {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      <Suspense
        fallback={
          <div className="absolute inset-0 grid place-items-center bg-slate-950 text-sm text-slate-300">
            Đang tải thế giới 3D…
          </div>
        }
      >
        <GameCanvas />
      </Suspense>
      <GameHud />
    </main>
  );
};
