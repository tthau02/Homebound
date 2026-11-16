import React from 'react';
import { useStoryStore } from '../../stores/useStoryStore';
import { useJourneyStore } from '../../stores/useJourneyStore';
import { CharacterInteractionMenu } from './CharacterInteractionMenu';
import { MultiplayerLobbyModal } from './MultiplayerLobbyModal';
import { MultiplayerSocialHub } from './MultiplayerSocialHub';
import { PlayerGuideHub } from './PlayerGuideHub';
import { LiveOpsFloatingDock } from './LiveOpsFloatingDock';
import { JourneyCompletionModal } from './JourneyCompletionModal';
import { TouchJoystick } from './TouchJoystick';
import { StartScreen } from './StartScreen';
import { MobileJourneyProgress, TopBar } from './TopBar';
import { TripStatus } from './TripStatus';
import { ActionDock } from './ActionDock';
import { GameMenu } from './GameMenu';
import { CinematicOverlay, ObjectiveTracker, StoryDialog, ToastLayer } from './StoryHud';

/**
 * Phase 9 HUD layout — minimal by default:
 *  top: menu · route progress · camera/coins
 *  right: story objectives (+ social hub when online)
 *  bottom-left: touch joystick (mobile) + trip status · bottom-right: context prompts, emotes, chat
 * Everything else lives in the Esc menu (GameMenu).
 */
export const GameHud: React.FC = () => {
  const hasStarted = useJourneyStore((s) => s.hasStarted);
  const inCinematic = useStoryStore((s) => s.cinematic !== null);
  const inDialogue = useStoryStore((s) => s.dialogue !== null);
  const hideChrome = !hasStarted || inCinematic;
  const hideDocks = hideChrome || inDialogue;

  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      <CinematicOverlay />

      {!hideChrome && (
        <>
          <div className="absolute inset-x-0 top-0 space-y-2 p-3 transition-opacity duration-300 sm:p-4">
            <TopBar />
            <MobileJourneyProgress />
            <ToastLayer />
          </div>

          <div className="absolute right-3 top-[112px] flex flex-col items-end gap-2 transition-opacity duration-300 sm:right-4 md:top-[124px]">
            <ObjectiveTracker />
            <MultiplayerSocialHub />
          </div>
        </>
      )}

      {hasStarted && (
        <>
          <div
            className={`absolute bottom-3 left-3 flex flex-col items-start gap-2 transition-opacity duration-300 sm:bottom-4 sm:left-4 ${hideDocks ? 'pointer-events-none opacity-0' : 'opacity-100'
              }`}
          >
            <TouchJoystick />
            <TripStatus />
          </div>

          <div
            className={`absolute bottom-3 right-3 transition-opacity duration-300 sm:bottom-4 sm:right-4 ${hideDocks ? 'pointer-events-none opacity-0' : 'opacity-100'
              }`}
          >
            <ActionDock />
          </div>
        </>
      )}

      <StartScreen />
      <CharacterInteractionMenu />
      <StoryDialog />
      <MultiplayerLobbyModal />
      <PlayerGuideHub />
      <JourneyCompletionModal />
      <LiveOpsFloatingDock />
      <GameMenu />
    </div>
  );
};
