import React, { useEffect, useRef } from 'react';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { clearPlayerInput, playerInput } from '../../game/character/playerInput';

const BASE_SIZE = 132;
const KNOB_SIZE = 56;
const MAX_TRAVEL = (BASE_SIZE - KNOB_SIZE) / 2 + 6;

/**
 * Analog thumb-stick for touch screens. Writes straight into the mutable `playerInput`
 * (no React state per move) and is only rendered on coarse-pointer devices while the
 * player is on their feet. Push to the rim to jog.
 */
export const TouchJoystick: React.FC = () => {
  const isStanding = useCharacterStore((s) => {
    const player = s.characters[s.playerId];
    return Boolean(player && player.state !== 'sitting');
  });
  const baseRef = useRef<HTMLDivElement | null>(null);
  const knobRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  const reset = () => {
    pointerIdRef.current = null;
    clearPlayerInput();
    if (knobRef.current) knobRef.current.style.transform = 'translate(0px, 0px)';
    if (baseRef.current) baseRef.current.dataset.active = 'false';
  };

  useEffect(() => {
    if (!isStanding) reset();
    return reset;
  }, [isStanding]);

  if (!isStanding) return null;

  const update = (e: React.PointerEvent<HTMLDivElement>) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    let dx = e.clientX - (rect.left + rect.width / 2);
    let dy = e.clientY - (rect.top + rect.height / 2);
    const dist = Math.hypot(dx, dy);
    if (dist > MAX_TRAVEL) {
      dx = (dx / dist) * MAX_TRAVEL;
      dy = (dy / dist) * MAX_TRAVEL;
    }
    if (knobRef.current) knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    // Screen up = walk away from the camera (-Z in camera space)
    playerInput.moveX = dx / MAX_TRAVEL;
    playerInput.moveZ = dy / MAX_TRAVEL;
  };

  return (
    <div
      ref={baseRef}
      role="application"
      aria-label="Cần điều khiển di chuyển"
      data-active="false"
      className="pointer-events-auto relative hidden touch-none select-none rounded-full border border-white/15 bg-ink-950/45 shadow-hud backdrop-blur-sm transition-colors data-[active=true]:border-accent/60 data-[active=true]:bg-ink-950/60 touch:block"
      style={{ width: BASE_SIZE, height: BASE_SIZE }}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        e.preventDefault();
        pointerIdRef.current = e.pointerId;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Synthetic events may not support capture
        }
        e.currentTarget.dataset.active = 'true';
        update(e);
      }}
      onPointerMove={(e) => {
        if (pointerIdRef.current === e.pointerId) update(e);
      }}
      onPointerUp={reset}
      onPointerCancel={reset}
      onLostPointerCapture={reset}
    >
      <div className="absolute inset-[18%] rounded-full border border-white/10" />
      <div
        ref={knobRef}
        className="absolute rounded-full border border-white/25 bg-ink-100/90 shadow-lg"
        style={{
          width: KNOB_SIZE,
          height: KNOB_SIZE,
          left: (BASE_SIZE - KNOB_SIZE) / 2,
          top: (BASE_SIZE - KNOB_SIZE) / 2,
        }}
      />
    </div>
  );
};
