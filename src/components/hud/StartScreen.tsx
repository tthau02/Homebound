import React, { useEffect } from 'react';
import { Bus, Globe, Play } from 'lucide-react';
import { GraphicsQuality, useGameStore } from '../../stores/useGameStore';
import { JOURNEY_STOPS, useJourneyStore } from '../../stores/useJourneyStore';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';
import { cameraRig } from '../../game/camera/cameraRig';
import { getActiveChapter } from '../../game/story/storyEngine';
import { APP_VERSION } from '../../config/featureFlags';
import { Button, Kbd, Segmented } from '../ui/primitives';

const QUALITY_OPTIONS: { value: GraphicsQuality; label: string }[] = [
  { value: 'low', label: 'Thấp' },
  { value: 'medium', label: 'Vừa' },
  { value: 'high', label: 'Cao' },
];

/**
 * Title screen shown before the trip starts. Behind it the bus waits at the first stop with
 * its door open while a slow establishing shot drifts around it; pressing start hands the
 * camera to the player standing on the kerb.
 */
export const StartScreen: React.FC = () => {
  const hasStarted = useJourneyStore((s) => s.hasStarted);
  const beginBoarding = useJourneyStore((s) => s.beginBoarding);
  const isLobbyOpen = useMultiplayerStore((s) => s.isLobbyModalOpen);
  const setLobbyModalOpen = useMultiplayerStore((s) => s.setLobbyModalOpen);
  const graphicsQuality = useGameStore((s) => s.graphicsQuality);
  const setGraphicsQuality = useGameStore((s) => s.setGraphicsQuality);

  // Establishing shot: drift slowly on the far side of the road, looking over the bus
  useEffect(() => {
    if (hasStarted) return;
    let frame = 0;
    const startMs = performance.now();
    const loop = () => {
      const t = (performance.now() - startMs) / 1000;
      const cine = cameraRig.cinematic;
      cine.position[0] = -8.2 + Math.sin(t * 0.11) * 1.6;
      cine.position[1] = 4.6 + Math.sin(t * 0.07) * 0.5;
      cine.position[2] = 6.5 - Math.cos(t * 0.08) * 7.5;
      cine.target[0] = 4;
      cine.target[1] = 1.5;
      cine.target[2] = -3.5;
      cine.active = true;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      cameraRig.cinematic.active = false;
      // Hand over behind the player, looking at the waiting bus
      cameraRig.pendingYaw = Math.PI / 2;
    };
  }, [hasStarted]);

  useEffect(() => {
    if (hasStarted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (useMultiplayerStore.getState().isLobbyModalOpen) return;
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        beginBoarding();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasStarted, beginBoarding]);

  if (hasStarted) return null;
  const chapter = getActiveChapter();
  const origin = JOURNEY_STOPS[0];
  const destination = JOURNEY_STOPS[JOURNEY_STOPS.length - 1];

  return (
    <div
      className={`pointer-events-auto fixed inset-0 z-40 flex items-end bg-gradient-to-t from-ink-950/95 via-ink-950/45 to-ink-950/10 transition-opacity duration-300 sm:items-center sm:bg-gradient-to-r ${
        isLobbyOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="safe-px safe-pb w-full max-w-xl animate-slide-up p-5 sm:p-10 short:p-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent-soft">
          <Bus className="h-4 w-4" /> Virtual Bus 3D · v{APP_VERSION}
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight text-white sm:text-5xl short:text-2xl">{chapter.title}</h1>
        <p className="mt-1.5 text-sm font-medium text-ink-200 sm:text-base">
          {origin.shortName} → {destination.shortName} · {destination.km} km · {JOURNEY_STOPS.length} điểm dừng
        </p>
        <p className="mt-4 text-sm leading-relaxed text-ink-200 sm:text-base short:hidden">{chapter.synopsis}</p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row short:mt-3">
          <Button tone="accent" size="lg" icon={<Play className="h-5 w-5" />} onClick={beginBoarding} kbd="Enter">
            Bắt đầu chuyến đi
          </Button>
          <Button size="lg" icon={<Globe className="h-5 w-5" />} onClick={() => setLobbyModalOpen(true)}>
            Chơi cùng bạn bè
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 short:mt-3">
          <span className="text-xs font-medium text-ink-300">Đồ hoạ</span>
          <Segmented ariaLabel="Chất lượng đồ hoạ" value={graphicsQuality} options={QUALITY_OPTIONS} onChange={setGraphicsQuality} />
        </div>

        {/* Controls primer, tailored to the input device */}
        <p className="mt-5 hidden text-xs leading-relaxed text-ink-300 touch:block short:mt-2">
          Kéo cần ở góc trái để đi, đẩy hết cỡ để chạy. Vuốt màn hình để xoay camera, chụm hai ngón để phóng to. Chạm vào ghế trống để ngồi.
        </p>
        <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-300 touch:hidden">
          <span className="inline-flex items-center gap-1.5"><Kbd>W A S D</Kbd> đi lại</span>
          <span className="inline-flex items-center gap-1.5"><Kbd>Shift</Kbd> chạy</span>
          <span className="inline-flex items-center gap-1.5"><Kbd>Kéo chuột</Kbd> xoay camera</span>
          <span className="inline-flex items-center gap-1.5"><Kbd>E</Kbd> tương tác</span>
          <span className="inline-flex items-center gap-1.5"><Kbd>Esc</Kbd> menu</span>
        </p>
      </div>
    </div>
  );
};
