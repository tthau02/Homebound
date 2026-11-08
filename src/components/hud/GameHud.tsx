import React from 'react';
import { TopLeftBrandPanel } from './TopLeftBrandPanel';
import { TopRightControlPanel } from './TopRightControlPanel';
import { BottomTelemetryBar } from './BottomTelemetryBar';
import { PassengerListDrawer } from './PassengerListDrawer';
import { CharacterInteractionMenu } from './CharacterInteractionMenu';
import { PlayerActionHud } from './PlayerActionHud';
import { MultiplayerLobbyModal } from './MultiplayerLobbyModal';
import { MultiplayerSocialHub } from './MultiplayerSocialHub';
import { PlayerGuideHub } from './PlayerGuideHub';
import { LiveOpsFloatingDock } from './LiveOpsFloatingDock';
import { JourneyCompletionModal } from './JourneyCompletionModal';
import { MobileArrowPad } from './MobileArrowPad';

export const GameHud: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-2 sm:p-4">
      {/* Top Bar: Left Brand + Passenger Drawer & Right Camera/Environment Controls */}
      <header className="flex items-start justify-between gap-2 w-full">
        <div className="flex flex-col gap-1.5 min-w-0">
          <TopLeftBrandPanel />
          <PassengerListDrawer />
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <TopRightControlPanel />
          <LiveOpsFloatingDock />
          <MultiplayerSocialHub />
        </div>
      </header>

      {/* Character Context Interaction Menu (Right Side Floating Modal) */}
      <CharacterInteractionMenu />

      {/* Multiplayer Auth & Room Lobby Modal */}
      <MultiplayerLobbyModal />
      <PlayerGuideHub />
      <JourneyCompletionModal />

      {/* Bottom Area: Split Left & Right HUD Docks (Center stays completely open) */}
      <footer className="w-full flex items-end justify-between gap-2 sm:gap-4">
        <div className="flex flex-col items-start gap-1.5 min-w-0">
          <MobileArrowPad />
          <BottomTelemetryBar />
        </div>

        <PlayerActionHud />
      </footer>
    </div>
  );
};
