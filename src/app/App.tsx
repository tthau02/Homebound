import React from 'react';
import { GameCanvas } from '../game/core/GameCanvas';
import { GameHud } from '../components/hud/GameHud';

export const App: React.FC = () => {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      <GameCanvas />
      <GameHud />
    </main>
  );
};
