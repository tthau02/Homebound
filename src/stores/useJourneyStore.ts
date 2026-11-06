import { create } from 'zustand';
import { useGameStore } from './useGameStore';
import { useCharacterStore } from './useCharacterStore';
import { useChatStore } from './useChatStore';
import { useInteractionStore } from './useInteractionStore';
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
    name: 'Bến xe Miền Tây (TP. Hồ Chí Minh)',
    shortName: 'BX Miền Tây',
    province: 'TP. Hồ Chí Minh',
    type: 'terminal',
    km: 0,
    description: 'Bến xe khởi hành trung tâm TP.HCM đi các tỉnh Đồng bằng Sông Cửu Long.',
    facilities: ['Phòng vé máy lạnh', 'Sảnh chờ VIP', 'Cà phê vỉa hè', 'Cửa hàng tiện lợi'],
    durationSec: 45,
    arrivalAnnouncement: 'Chào mừng quý khách đến với Bến xe Miền Tây! Chuyến xe chuẩn bị xuất phát.',
    departureAnnouncement: 'Xe xuất bến đi Cần Thơ, kính chúc quý khách thượng lộ bình an!',
  },
  {
    id: 'stop-1',
    name: 'Trạm Tân An (Long An)',
    shortName: 'Trạm Tân An',
    province: 'Long An',
    type: 'bus_stop',
    km: 45,
    description: 'Điểm dừng đón trả khách cửa ngõ Đồng bằng Sông Cửu Long.',
    facilities: ['Nhà chờ có mái che', 'Quầy nước mía siêu sạch', 'Ghế đá nghỉ ngơi'],
    durationSec: 40,
    arrivalAnnouncement: 'Xe đã cập trạm Tân An (Long An). Xe dừng 40 giây đón trả khách.',
    departureAnnouncement: 'Xe tiếp tục hành trình hướng về Tiền Giang!',
  },
  {
    id: 'stop-2',
    name: 'Trạm Dừng Nghỉ Tiền Giang (Mỹ Tho)',
    shortName: 'Trạm Nghỉ Tiền Giang',
    province: 'Tiền Giang',
    type: 'rest_stop',
    km: 72,
    description: 'Trạm dừng chân nổi tiếng: đặc sản hủ tiếu Mỹ Tho, nem Lai Vung, nước mía & dừa xiêm.',
    facilities: ['Khu ẩm thực Miền Tây', 'Quán nước mía & cà phê đá', 'Đặc sản quà quê', 'Khu vệ sinh sạch'],
    durationSec: 60,
    arrivalAnnouncement: 'Đã đến Trạm Dừng Nghỉ Tiền Giang! Mời quý khách xuống xe ăn uống, nghỉ ngơi 60 giây.',
    departureAnnouncement: 'Bác tài thông báo: Hết giờ nghỉ, xe tiếp tục lăn bánh qua cầu Mỹ Thuận!',
  },
  {
    id: 'stop-3',
    name: 'Trạm Cầu Mỹ Thuận (Vĩnh Long)',
    shortName: 'Trạm Cầu Mỹ Thuận',
    province: 'Vĩnh Long',
    type: 'bus_stop',
    km: 125,
    description: 'Trạm trung chuyển cạnh bờ sông Tiền, ngắm toàn cảnh cầu dây văng Mỹ Thuận.',
    facilities: ['Điểm ngắm cảnh sông Tiền', 'Quán trà đá giải khát', 'Quầy thông tin'],
    durationSec: 45,
    arrivalAnnouncement: 'Xe đã cập trạm ngắm cảnh Cầu Mỹ Thuận (Vĩnh Long). Xe dừng đón khách.',
    departureAnnouncement: 'Xe bắt đầu chặng cuối về thủ phủ Cần Thơ!',
  },
  {
    id: 'stop-4',
    name: 'Bến xe Trung tâm Cần Thơ (Bến Cuối)',
    shortName: 'BX Cần Thơ',
    province: 'Cần Thơ',
    type: 'terminal',
    km: 168,
    description: 'Bến cuối hành trình tại thủ phủ Tây Đô Cần Thơ.',
    facilities: ['Sảnh trả khách trung tâm', 'Bãi đỗ xe khách', 'Quầy vé du lịch miền Tây'],
    durationSec: 90,
    arrivalAnnouncement: 'Chuyến xe đã cập bến an toàn tại Bến xe Trung tâm Cần Thơ! Kính chúc quý khách vạn sự như ý!',
    departureAnnouncement: 'Hành trình trọn vẹn kết thúc. Cảm ơn quý khách đã đồng hành cùng Virtual Bus!',
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

export const useJourneyStore = create<JourneyStoreState>((set, get) => ({
  currentStopIndex: 0,
  stage: 'in_transit',
  doorOpen: false,
  distanceToNextStopKm: 18.0,
  stationTimerSec: 0,
  isPlayerDisembarked: false,
  hasVisitedStalls: false,
  isCompletionModalOpen: false,

  tickJourney: (deltaSec: number) => {
    const state = get();
    const gameStore = useGameStore.getState();
    if (gameStore.isPaused) return;

    if (state.stage === 'in_transit') {
      const speedKmh = gameStore.busSpeedKmh;
      if (speedKmh <= 0) return;

      const deltaKm = (speedKmh / 68) * KM_PER_REAL_SECOND * deltaSec;
      gameStore.addDistance(deltaKm);

      const nextDist = Math.max(0, state.distanceToNextStopKm - deltaKm);

      if (nextDist <= 1.2) {
        // Approaching station!
        const nextStop = JOURNEY_STOPS[state.currentStopIndex + 1];
        if (nextStop) {
          useInteractionStore
            .getState()
            .showStatusToast(`Chuẩn bị cập ${nextStop.name}! Xe đang giảm tốc...`);
        }
        set({ stage: 'approaching', distanceToNextStopKm: nextDist });
      } else {
        set({ distanceToNextStopKm: nextDist });
      }
    } else if (state.stage === 'approaching') {
      // Smoothly decelerate bus
      const currentSpeed = gameStore.busSpeedKmh;
      const newSpeed = Math.max(0, currentSpeed - 22 * deltaSec);
      gameStore.setBusSpeedKmh(newSpeed);

      const nextDist = Math.max(0, state.distanceToNextStopKm - 0.4 * deltaSec);
      set({ distanceToNextStopKm: nextDist });

      if (newSpeed <= 0.1 && nextDist <= 0.05) {
        // Arrived at station!
        gameStore.setBusSpeedKmh(0);
        const nextIndex = Math.min(JOURNEY_STOPS.length - 1, state.currentStopIndex + 1);
        const stop = JOURNEY_STOPS[nextIndex];
        const isFinalStop = nextIndex === JOURNEY_STOPS.length - 1;

        useChatStore
          .getState()
          .sendChatBubble('driver', 'Bác tài', stop.arrivalAnnouncement, 7000);

        useInteractionStore
          .getState()
          .showStatusToast(`Xe đã cập bến ${stop.name}. Cửa xe đã mở! Quý khách có thể xuống xe.`);

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
      // Countdown station stop timer
      const nextTimer = Math.max(0, state.stationTimerSec - deltaSec);
      set({ stationTimerSec: nextTimer });

      if (nextTimer <= 0) {
        // Auto depart if time expires
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
      .sendChatBubble('driver', 'Bác tài', currentStop.departureAnnouncement, 5500);

    useInteractionStore
      .getState()
      .showStatusToast(`Cửa xe đóng lại. Xe khởi hành tiếp chặng kế!`);

    // Close door and accelerate bus back to normal highway cruising speed
    useGameStore.getState().setBusSpeedKmh(68);

    const nextStop = JOURNEY_STOPS[state.currentStopIndex + 1];
    const segmentKm = nextStop ? nextStop.km - currentStop.km : 25;

    set({
      doorOpen: false,
      stage: 'in_transit',
      distanceToNextStopKm: Math.min(24.0, segmentKm * 0.4), // normalized game distance
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

    set({
      currentStopIndex: 0,
      stage: 'in_transit',
      doorOpen: false,
      distanceToNextStopKm: 20.0,
      stationTimerSec: 0,
      isPlayerDisembarked: false,
      hasVisitedStalls: false,
      isCompletionModalOpen: false,
    });

    useInteractionStore
      .getState()
      .showStatusToast('Đã bắt đầu lại hành trình từ Bến xe Miền Tây!');
  },

  closeCompletionModal: () => {
    set({ isCompletionModalOpen: false });
  },
}));
