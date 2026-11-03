import React, { useCallback } from 'react';
import { Html } from '@react-three/drei';
import { useSeatStore } from '../../stores/useSeatStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useInteractionStore } from '../../stores/useInteractionStore';
import { BusSeat } from '../bus/BusSeat';

export const SeatManager: React.FC = () => {
  const seats = useSeatStore((state) => state.seats);
  const seatOrder = useSeatStore((state) => state.seatOrder);
  const hoveredSeatId = useSeatStore((state) => state.hoveredSeatId);
  const setHoveredSeatId = useSeatStore((state) => state.setHoveredSeatId);

  const playerTargetSeatId = useCharacterStore(
    (state) => state.characters[state.playerId]?.targetSeatId ?? null
  );

  const handleSeatClick = useCallback((seatId: string) => {
    const seatStore = useSeatStore.getState();
    const charStore = useCharacterStore.getState();
    const interStore = useInteractionStore.getState();

    const seat = seatStore.getSeatById(seatId);
    if (!seat) return;

    const playerId = charStore.playerId;

    // Prevent occupying a seat that already has another passenger
    if (seat.occupied && seat.occupantId !== playerId) {
      const occupant = seat.occupantId
        ? charStore.characters[seat.occupantId]
        : null;
      interStore.showStatusToast(
        occupant
          ? `Ghế ${seatId} đã có ${occupant.name} ngồi! Hãy chọn ghế trống khác.`
          : `Ghế ${seatId} đã có người ngồi!`
      );
      if (occupant) {
        interStore.openCharacterInteraction(occupant.id, 'menu');
      }
      return;
    }

    if (seat.occupantId === playerId) {
      interStore.showStatusToast(
        `Bạn đang ngồi tại ghế ${seatId}. Nhấn phím Space để đứng dậy.`
      );
      return;
    }

    const started = charStore.commandMoveToSeat(playerId, seatId);
    if (started) {
      interStore.showStatusToast(`Đang di chuyển tới ghế ${seatId}...`);
    }
  }, []);

  const hoveredSeat = hoveredSeatId ? seats[hoveredSeatId] : null;

  return (
    <group name="SeatManager">
      {seatOrder.map((seatId) => {
        const seat = seats[seatId];
        if (!seat) return null;

        return (
          <BusSeat
            key={seatId}
            seatId={seatId}
            position={seat.position}
            occupied={seat.occupied}
            isHovered={hoveredSeatId === seatId}
            isTargetSeat={playerTargetSeatId === seatId}
            onSeatClick={handleSeatClick}
            onSeatHover={setHoveredSeatId}
          />
        );
      })}

      {/* Floating Tooltip for Hovered Seat */}
      {hoveredSeat && (
        <Html
          position={[
            hoveredSeat.position[0],
            hoveredSeat.position[1] + 0.95,
            hoveredSeat.position[2],
          ]}
          center
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap border shadow-lg backdrop-blur-md ${
              hoveredSeat.occupied
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/40'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
            }`}
          >
            Ghế {hoveredSeat.seatId} •{' '}
            {hoveredSeat.occupied ? 'Đã có khách' : 'Trống (Click để ngồi)'}
          </div>
        </Html>
      )}
    </group>
  );
};

