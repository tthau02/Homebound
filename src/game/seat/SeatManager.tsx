import React, { useCallback } from 'react';
import { Html } from '@react-three/drei';
import { useSeatStore } from '../../stores/useSeatStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useInteractionStore } from '../../stores/useInteractionStore';
import { BusSeat } from '../bus/BusSeat';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';
import { useGameStore } from '../../stores/useGameStore';
import { useJourneyStore } from '../../stores/useJourneyStore';
import { useEconomyLedgerStore } from '../../stores/useEconomyLedgerStore';
import { useLiveOpsStore } from '../../stores/useLiveOpsStore';
import { useTelemetryStore } from '../../stores/useTelemetryStore';
import { PLATFORM_EDGE_X } from '../config/stationConfig';

export const SeatManager: React.FC = () => {
  const seats = useSeatStore((state) => state.seats);
  const seatOrder = useSeatStore((state) => state.seatOrder);
  const hoveredSeatId = useSeatStore((state) => state.hoveredSeatId);
  const setHoveredSeatId = useSeatStore((state) => state.setHoveredSeatId);

  const playerTargetSeatId = useCharacterStore(
    (state) => state.characters[state.playerId]?.targetSeatId ?? null
  );

  // Call every Zustand hook unconditionally to strictly obey React Rules of Hooks
  const hasStarted = useJourneyStore((s) => s.hasStarted);
  const isGuideOpen = useGameStore((s) => s.isGuideOpen);
  const isLobbyOpen = useMultiplayerStore((s) => s.isLobbyModalOpen);
  const isEconomyOpen = useEconomyLedgerStore((s) => s.isModalOpen);
  const isCompletionOpen = useJourneyStore((s) => s.isCompletionModalOpen);
  const isInteractionOpen = useInteractionStore(
    (s) => s.selectedCharacterId !== null
  );
  const isLiveOpsOpen = useLiveOpsStore((s) => s.isModalOpen);
  const isDiagnosticsOpen = useTelemetryStore((s) => s.isDiagnosticsOpen);

  const isAnyModalOpen =
    !hasStarted ||
    isGuideOpen ||
    isLobbyOpen ||
    isEconomyOpen ||
    isCompletionOpen ||
    isInteractionOpen ||
    isLiveOpsOpen ||
    isDiagnosticsOpen;

  const handleSeatClick = useCallback((seatId: string) => {
    const seatStore = useSeatStore.getState();
    seatStore.setHoveredSeatId(null);
    const charStore = useCharacterStore.getState();
    const interStore = useInteractionStore.getState();

    const seat = seatStore.getSeatById(seatId);
    if (!seat) return;

    const playerId = charStore.playerId;
    const room = useMultiplayerStore.getState().currentRoom;
    if (room?.players[playerId]?.isDisembarked) {
      interStore.showStatusToast('Bạn đang ở khu vực trạm. Hãy quay lại xe để chọn ghế.');
      return;
    }

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

    // From the pavement the only way in is the open door
    const player = charStore.characters[playerId];
    if (player && player.position[0] >= PLATFORM_EDGE_X - 0.05 && !useJourneyStore.getState().doorOpen) {
      interStore.showStatusToast('Cửa xe đang đóng, chưa lên xe được.');
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

      {/* Floating Tooltip for Hovered Seat (fixed screen scale so close seats never appear oversized) */}
      {hoveredSeat && !isAnyModalOpen && (
        <Html
          position={[
            hoveredSeat.position[0],
            hoveredSeat.position[1] + 0.95,
            hoveredSeat.position[2],
          ]}
          center
          zIndexRange={[5, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border shadow-lg select-none pointer-events-none ${
              hoveredSeat.occupied
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/40'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
            }`}
          >
            Ghế {hoveredSeat.seatId} •{' '}
            {hoveredSeat.occupied ? 'Đã có khách' : 'Trống · bấm để ngồi'}
          </div>
        </Html>
      )}
    </group>
  );
};

