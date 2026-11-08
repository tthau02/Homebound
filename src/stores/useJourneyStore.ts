import { create } from 'zustand';
import { useGameStore } from './useGameStore';
import { useCharacterStore } from './useCharacterStore';
import { useChatStore } from './useChatStore';
import { useInteractionStore } from './useInteractionStore';
import { useMultiplayerStore } from './useMultiplayerStore';
import { BUS_DIMENSIONS } from '../game/config/busConfig';

export type JourneyStage = 'in_transit' | 'approaching' | 'at_station' | 'completed';

export interface StationStop {
  id: string;
  name: string;
  shortName: string;
  province: string;
  type: 'terminal' | 'bus_stop' | 'rest_stop';
  km: number;
  description: string;
  facilities: string[];
  durationSec: number;
  arrivalAnnouncement: string;
  departureAnnouncement: string;
}

export const JOURNEY_STOPS: StationStop[] = [
  {
    id: 'stop-0',
    name: 'Bánh mì 168 – Ngã tư 168 Bình Lục (QL21B, Đồn Xá – Bình Mỹ, Hà Nam)',
    shortName: 'Bánh mì 168 Bình Lục',
    province: 'Hà Nam',
    type: 'terminal',
    km: 0,
    description:
      'Điểm mốc giao thông & hẹn đón khách nổi tiếng tại Ngã tư 168 (thôn Tiên Lý, xã Đồn Xá – giáp TT. Bình Mỹ, trục QL21B, huyện Bình Lục, Hà Nam).',
    facilities: [
      'Điểm hẹn Bánh mì 168',
      'Quán trà đá & bánh mì nóng',
      'Điểm gom khách QL21B',
      'Nhận gửi hàng đi Hà Nội',
    ],
    durationSec: 45,
    arrivalAnnouncement:
      'Chào mừng quý khách tại điểm đón Bánh mì 168 – Ngã tư 168 Bình Lục! Xe chuẩn bị xuất phát đi Bến xe Mỹ Đình.',
    departureAnnouncement:
      'Xe rời điểm Bánh mì 168 Bình Lục hướng ra Phủ Lý – Liêm Tuyền, chúc quý khách thượng lộ bình an!',
  },
  {
    id: 'stop-1',
    name: 'Nút giao Liêm Tuyền – Trạm dừng Km227 (TP. Phủ Lý, Hà Nam)',
    shortName: 'Nút giao Liêm Tuyền',
    province: 'Hà Nam',
    type: 'rest_stop',
    km: 13,
    description:
      'Cửa ngõ TP. Phủ Lý & Trạm dừng nghỉ Km227 trước khi nhập làn Cao tốc Cầu Giẽ – Pháp Vân (ĐCT01). Đón thêm khách Phủ Lý và nghỉ giải lao.',
    facilities: [
      'Văn phòng đón khách Liêm Tuyền',
      'Trạm dừng nghỉ Km227',
      'Đặc sản bánh đa Kiện Khê & chuối Ngự',
      'Quầy nước mía & trà đá',
    ],
    durationSec: 50,
    arrivalAnnouncement:
      'Xe đã tới Nút giao Liêm Tuyền – Trạm dừng Km227 (Phủ Lý). Mời quý khách nghỉ ngơi 50 giây trước khi lên cao tốc Pháp Vân!',
    departureAnnouncement:
      'Bác tài thông báo: Xe nhập làn Cao tốc Cầu Giẽ – Pháp Vân (ĐCT01) thẳng tiến về Thủ đô Hà Nội!',
  },
  {
    id: 'stop-2',
    name: 'Nút giao Pháp Vân – Cửa ngõ Nước Ngầm (Hoàng Mai, Hà Nội)',
    shortName: 'Nút giao Pháp Vân',
    province: 'Hà Nội',
    type: 'bus_stop',
    km: 56,
    description:
      'Điểm cuối Cao tốc Pháp Vân – Cầu Giẽ (phường Hoàng Liệt, Q. Hoàng Mai), trả khách đi Bến xe Nước Ngầm, Giải Phóng và khu Bệnh viện Bạch Mai – Việt Đức.',
    facilities: [
      'Điểm trung chuyển Pháp Vân',
      'Lối rẽ BX Nước Ngầm & Giải Phóng',
      'Kết nối xe buýt nội đô Hà Nội',
    ],
    durationSec: 40,
    arrivalAnnouncement:
      'Đã hết cao tốc Pháp Vân! Quý khách nào xuống Nước Ngầm, Giải Phóng, Viện Bạch Mai chuẩn bị hành lý nhé.',
    departureAnnouncement:
      'Xe tiếp tục di chuyển theo trục Vành đai 3 hướng về Khuất Duy Tiến – Phạm Hùng!',
  },
  {
    id: 'stop-3',
    name: '168 Khuất Duy Tiến – Big C Thăng Long (Thanh Xuân, Hà Nội)',
    shortName: 'Big C – Khuất Duy Tiến',
    province: 'Hà Nội',
    type: 'bus_stop',
    km: 65,
    description:
      'Điểm trả khách sầm uất tại Cổng Nhà văn hóa Quận Thanh Xuân (168 Khuất Duy Tiến), Ngã tư Nguyễn Trãi và đối diện Big C Thăng Long – Trung tâm Hội nghị Quốc gia.',
    facilities: [
      'Điểm đón trả 168 Khuất Duy Tiến',
      'Đối diện Big C Thăng Long (Trần Duy Hưng)',
      'Trạm chờ xe buýt & tuyến Metro',
    ],
    durationSec: 45,
    arrivalAnnouncement:
      'Xe đang dừng trả khách tại 168 Khuất Duy Tiến – Big C Thăng Long (Trần Duy Hưng). Quý khách kiểm tra kỹ tư trang!',
    departureAnnouncement:
      'Xe bắt đầu chặng cuối dọc đường Phạm Hùng tiến vào Bến xe Mỹ Đình!',
  },
  {
    id: 'stop-4',
    name: 'Bến xe Mỹ Đình (Số 20 Phạm Hùng, Nam Từ Liêm, Hà Nội)',
    shortName: 'BX Mỹ Đình',
    province: 'Hà Nội',
    type: 'terminal',
    km: 72,
    description:
      'Bến xe khách lớn phía Tây Thủ đô tại Số 20 đường Phạm Hùng, phường Mỹ Đình 2, quận Nam Từ Liêm, Hà Nội (gần Cầu Mai Dịch & ĐH Thương Mại).',
    facilities: [
      'Sảnh trả khách Bến xe Mỹ Đình (20 Phạm Hùng)',
      'Nhà chờ trung tâm & quầy vé liên tỉnh',
      'Bến xe buýt kết nối Cầu Giấy – Nội Bài',
    ],
    durationSec: 90,
    arrivalAnnouncement:
      'Chuyến xe từ Bánh mì 168 Bình Lục đã cập bến an toàn tại Bến xe Mỹ Đình – 20 Phạm Hùng! Cảm ơn quý khách đã đồng hành!',
    departureAnnouncement:
      'Hành trình Bình Lục – Mỹ Đình hoàn tất trọn vẹn. Hẹn gặp lại quý khách trên những chuyến xe tiếp theo!',
  },
];

interface JourneyStoreState {
  currentStopIndex: number;
  stage: JourneyStage;
  doorOpen: boolean;
  distanceToNextStopKm: number;
  stationTimerSec: number;
  isPlayerDisembarked: boolean;
  hasVisitedStalls: boolean;
  isCompletionModalOpen: boolean;

  // Actions
  tickJourney: (deltaSec: number) => void;
  departNextStop: () => void;
  disembarkPlayer: () => void;
  boardPlayer: () => void;
  interactWithStationStall: () => void;
  fastForwardToNextStop: () => void;
  restartJourney: () => void;
  closeCompletionModal: () => void;
}

const KM_PER_REAL_SECOND = 0.55; // Accelerated simulated distance so a stop takes ~45-60 seconds of real driving

function getSegmentSimulatedKm(stopIndex: number): number {
  const currStop = JOURNEY_STOPS[stopIndex];
  const nextStop = JOURNEY_STOPS[stopIndex + 1];
  const segmentKm =
    currStop && nextStop ? nextStop.km - currStop.km : 25;
  return Math.min(24.0, Math.max(12.0, segmentKm * 0.4));
}

const INITIAL_SEGMENT_SIM_KM = getSegmentSimulatedKm(0);

/**
 * High-frequency mutable telemetry read directly by 3D `useFrame` loops
 * (e.g. StationPlatform) without triggering 60 FPS React HUD re-renders.
 */
export const liveJourneyTelemetry = {
  distanceToNextStopKm: INITIAL_SEGMENT_SIM_KM,
  approachEntrySpeedKmh: 68,
};

let internalStationTimerSec = 0;

function syncRouteOdometerKm(stopIndex: number, remainingSimKm: number): void {
  const currStop = JOURNEY_STOPS[stopIndex];
  const nextStop = JOURNEY_STOPS[stopIndex + 1];
  if (!currStop || !nextStop) return;

  const totalSimKm = getSegmentSimulatedKm(stopIndex);
  const segRatio = Math.min(1, Math.max(0, 1 - remainingSimKm / totalSimKm));
  const mappedRouteKm = currStop.km + (nextStop.km - currStop.km) * segRatio;
  const roundedKm = Math.round(mappedRouteKm * 10) / 10;

  if (roundedKm !== useGameStore.getState().distanceTraveledKm) {
    useGameStore.setState({ distanceTraveledKm: roundedKm });
  }
}

export const useJourneyStore = create<JourneyStoreState>((set, get) => ({
  currentStopIndex: 0,
  stage: 'in_transit',
  doorOpen: false,
  distanceToNextStopKm: INITIAL_SEGMENT_SIM_KM,
  stationTimerSec: 0,
  isPlayerDisembarked: false,
  hasVisitedStalls: false,
  isCompletionModalOpen: false,

  tickJourney: (deltaSec: number) => {
    // Do not override authoritative P2P room state when in Online Multiplayer mode
    if (useMultiplayerStore.getState().isOnlineMode) return;

    const state = get();
    const gameStore = useGameStore.getState();
    if (gameStore.isPaused) return;

    if (state.stage === 'in_transit') {
      const speedKmh = gameStore.busSpeedKmh;
      if (speedKmh <= 0) return;

      const deltaKm = (speedKmh / 68) * KM_PER_REAL_SECOND * deltaSec;
      const nextDist = Math.max(
        0,
        liveJourneyTelemetry.distanceToNextStopKm - deltaKm
      );
      liveJourneyTelemetry.distanceToNextStopKm = nextDist;
      syncRouteOdometerKm(state.currentStopIndex, nextDist);

      if (nextDist <= 1.2) {
        // Approaching station!
        liveJourneyTelemetry.approachEntrySpeedKmh = Math.max(
          24,
          gameStore.busSpeedKmh
        );
        const nextStop = JOURNEY_STOPS[state.currentStopIndex + 1];
        if (nextStop) {
          useInteractionStore
            .getState()
            .showStatusToast(
              `Chuẩn bị cập ${nextStop.name}! Xe đang giảm tốc...`
            );
        }
        set({
          stage: 'approaching',
          distanceToNextStopKm: Math.round(nextDist * 10) / 10,
        });
      } else {
        const roundedDist = Math.round(nextDist * 10) / 10;
        if (roundedDist !== state.distanceToNextStopKm) {
          set({ distanceToNextStopKm: roundedDist });
        }
      }
    } else if (state.stage === 'approaching') {
      // Coupled smooth deceleration tied directly to remaining approach distance (1.2 km -> 0 km)
      const nextDist = Math.max(
        0,
        liveJourneyTelemetry.distanceToNextStopKm - 0.38 * deltaSec
      );
      liveJourneyTelemetry.distanceToNextStopKm = nextDist;
      syncRouteOdometerKm(state.currentStopIndex, nextDist);

      const approachRatio = Math.max(0, Math.min(1, nextDist / 1.2));
      const targetSpeed = Math.max(
        5,
        Math.round(
          liveJourneyTelemetry.approachEntrySpeedKmh *
            Math.pow(approachRatio, 0.85)
        )
      );

      if (Math.round(gameStore.busSpeedKmh) !== targetSpeed) {
        gameStore.setBusSpeedKmh(targetSpeed);
      }

      const roundedDist = Math.round(nextDist * 10) / 10;
      if (roundedDist !== state.distanceToNextStopKm) {
        set({ distanceToNextStopKm: roundedDist });
      }

      if (nextDist <= 0.02) {
        // Arrived at station!
        liveJourneyTelemetry.distanceToNextStopKm = 0;
        gameStore.setBusSpeedKmh(0);
        const nextIndex = Math.min(
          JOURNEY_STOPS.length - 1,
          state.currentStopIndex + 1
        );
        const stop = JOURNEY_STOPS[nextIndex];
        const isFinalStop = nextIndex === JOURNEY_STOPS.length - 1;

        useGameStore.setState({ distanceTraveledKm: stop.km });
        internalStationTimerSec = stop.durationSec;

        useChatStore
          .getState()
          .sendChatBubble('driver', 'Bác tài', stop.arrivalAnnouncement, 7000);

        useInteractionStore
          .getState()
          .showStatusToast(
            `Xe đã cập bến ${stop.name}. Cửa xe đã mở! Quý khách có thể xuống xe.`
          );

        set({
          currentStopIndex: nextIndex,
          stage: isFinalStop ? 'completed' : 'at_station',
          doorOpen: true,
          stationTimerSec: stop.durationSec,
          distanceToNextStopKm: 0,
          isCompletionModalOpen: isFinalStop,
        });
      }
    } else if (state.stage === 'at_station') {
      // Countdown station stop timer (only commit to React state when integer second changes)
      internalStationTimerSec = Math.max(0, internalStationTimerSec - deltaSec);
      const ceilSec = Math.ceil(internalStationTimerSec);
      if (ceilSec !== Math.ceil(state.stationTimerSec)) {
        set({ stationTimerSec: ceilSec });
      }

      if (internalStationTimerSec <= 0) {
        get().departNextStop();
      }
    }
  },

  departNextStop: () => {
    const state = get();
    if (state.currentStopIndex >= JOURNEY_STOPS.length - 1) {
      set({ stage: 'completed', isCompletionModalOpen: true });
      return;
    }

    // If player is outside at station, safely return them inside the bus
    if (state.isPlayerDisembarked) {
      get().boardPlayer();
    }

    const currentStop = JOURNEY_STOPS[state.currentStopIndex];
    useChatStore
      .getState()
      .sendChatBubble(
        'driver',
        'Bác tài',
        currentStop.departureAnnouncement,
        5500
      );

    useInteractionStore
      .getState()
      .showStatusToast(`Cửa xe đóng lại. Xe khởi hành tiếp chặng kế!`);

    // Close door and accelerate bus back to normal highway cruising speed
    useGameStore.getState().setBusSpeedKmh(68);

    const simulatedDist = getSegmentSimulatedKm(state.currentStopIndex);
    liveJourneyTelemetry.distanceToNextStopKm = simulatedDist;
    internalStationTimerSec = 0;

    set({
      doorOpen: false,
      stage: 'in_transit',
      distanceToNextStopKm: simulatedDist,
      stationTimerSec: 0,
      hasVisitedStalls: false,
    });
  },

  disembarkPlayer: () => {
    const charStore = useCharacterStore.getState();
    const playerId = charStore.playerId;
    const player = charStore.characters[playerId];
    if (!player) return;

    // Place character just outside the front passenger entry door on the station platform
    const platformX = 2.4;
    const platformY = 0.22; // platform surface height
    const platformZ = -4.75; // right outside the entry door

    charStore.updateCharacterTransform(playerId, [platformX, platformY, platformZ], Math.PI / 2);
    set({ isPlayerDisembarked: true });

    useInteractionStore
      .getState()
      .showStatusToast('Bạn đã bước xuống trạm dừng! Dùng WASD hoặc phím ảo để tự do tham quan.');
  },

  boardPlayer: () => {
    const charStore = useCharacterStore.getState();
    const playerId = charStore.playerId;
    const player = charStore.characters[playerId];
    if (!player) return;

    // Step player back into the central aisle inside the bus
    const aisleX = 0;
    const aisleY = BUS_DIMENSIONS.floorY;
    const aisleZ = -3.6;

    charStore.updateCharacterTransform(playerId, [aisleX, aisleY, aisleZ], 0);
    set({ isPlayerDisembarked: false });

    useInteractionStore
      .getState()
      .showStatusToast('Đã bước lên xe an toàn.');
  },

  interactWithStationStall: () => {
    set({ hasVisitedStalls: true });
    useChatStore
      .getState()
      .sendChatBubble(
        'player',
        'Bạn',
        'Cho con 1 ly nước mía siêu sạch nhiều đá nha cô ơi! Ngon và mát lành quá! 🥤✨',
        4800
      );
    useInteractionStore
      .getState()
      .showStatusToast('Đã thưởng thức ly nước mía siêu sạch mát lạnh ven đường (+10 năng lượng)!');
  },

  fastForwardToNextStop: () => {
    const state = get();
    if (state.stage === 'in_transit') {
      liveJourneyTelemetry.distanceToNextStopKm = 1.0;
      liveJourneyTelemetry.approachEntrySpeedKmh = Math.max(
        24,
        useGameStore.getState().busSpeedKmh
      );
      syncRouteOdometerKm(state.currentStopIndex, 1.0);
      set({ distanceToNextStopKm: 1.0, stage: 'approaching' });
      useInteractionStore
        .getState()
        .showStatusToast('Đã tua nhanh đến trạm dừng tiếp theo!');
    }
  },

  restartJourney: () => {
    useGameStore.getState().setBusSpeedKmh(68);
    useGameStore.setState({ distanceTraveledKm: 0 });
    get().boardPlayer();
    const initialSimDist = getSegmentSimulatedKm(0);
    liveJourneyTelemetry.distanceToNextStopKm = initialSimDist;
    liveJourneyTelemetry.approachEntrySpeedKmh = 68;
    internalStationTimerSec = 0;

    set({
      currentStopIndex: 0,
      stage: 'in_transit',
      doorOpen: false,
      distanceToNextStopKm: initialSimDist,
      stationTimerSec: 0,
      isPlayerDisembarked: false,
      hasVisitedStalls: false,
      isCompletionModalOpen: false,
    });

    useInteractionStore
      .getState()
      .showStatusToast(
        'Đã bắt đầu lại chuyến xe từ Bánh mì 168 Bình Lục đi Bến xe Mỹ Đình!'
      );
  },

  closeCompletionModal: () => {
    set({ isCompletionModalOpen: false });
  },
}));
