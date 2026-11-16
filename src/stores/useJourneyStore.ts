import { create } from 'zustand';
import { useGameStore } from './useGameStore';
import { useCharacterStore } from './useCharacterStore';
import { useChatStore } from './useChatStore';
import { useInteractionStore } from './useInteractionStore';
import { useMultiplayerStore } from './useMultiplayerStore';
import { BUS_DIMENSIONS } from '../game/config/busConfig';
import {
  DOOR_EXIT_SPOT,
  PLATFORM_Y,
  STATION_LAYOUTS,
  StationInteractable,
  StationLayout,
  StationLayoutId,
} from '../game/config/stationConfig';
import { sceneryLive } from '../game/environment/scenery/sceneryLive';

/**
 * `boarding`: parked at the first stop before departure (door open, passengers getting on).
 * `in_transit` -> `approaching` (braking into the next stop) -> `at_station` -> ... -> `completed`.
 */
export type JourneyStage = 'boarding' | 'in_transit' | 'approaching' | 'at_station' | 'completed';

export interface StationStop {
  id: string;
  name: string;
  shortName: string;
  province: string;
  type: 'terminal' | 'bus_stop' | 'rest_stop';
  /** Which 3D station set piece is shown at this stop. */
  layout: StationLayoutId;
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
    layout: 'townStop',
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
    layout: 'restStop',
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
    layout: 'cityStop',
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
    layout: 'cityStop',
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
    layout: 'terminal',
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
  /** False while the title screen is up; nothing ticks until the player starts the trip. */
  hasStarted: boolean;
  currentStopIndex: number;
  stage: JourneyStage;
  doorOpen: boolean;
  distanceToNextStopKm: number;
  stationTimerSec: number;
  isPlayerDisembarked: boolean;
  hasVisitedStalls: boolean;
  isCompletionModalOpen: boolean;

  // Actions
  beginBoarding: () => void;
  tickJourney: (deltaSec: number) => void;
  departNextStop: () => void;
  disembarkPlayer: () => void;
  boardPlayer: () => void;
  interactWithStation: (interactable: StationInteractable) => void;
  fastForwardToNextStop: () => void;
  restartJourney: () => void;
  closeCompletionModal: () => void;
}

// Accelerated simulated distance: a segment takes ~1–2.5 minutes of real driving so the
// route-driven scenery (biomes, landmarks) and story beats have room to play out.
const KM_PER_REAL_SECOND = 0.16;
export const CRUISE_SPEED_KMH = 68;
/** Visual metres the world scrolls per simulated km (both scale linearly with bus speed). */
const VISUAL_M_PER_SIM_KM = CRUISE_SPEED_KMH / 3.6 / KM_PER_REAL_SECOND;
/** Braking starts this many simulated km / visual metres before the stop line. */
const APPROACH_SIM_KM = 1.2;
const APPROACH_M = 260;
/** The next station is placed in the world once it is this close (simulated km). */
const STATION_SHOW_SIM_KM = 4.2;
const COMFORT_DECEL_MS2 = 0.7;
const ACCEL_KMH_PER_SEC = 5.5;
const DOOR_CLOSE_HOLD_SEC = 1.8;
const BOARDING_WAIT_SEC = 90;
const SEATED_DEPART_SEC = 6;

function getSegmentSimulatedKm(stopIndex: number): number {
  const currStop = JOURNEY_STOPS[stopIndex];
  const nextStop = JOURNEY_STOPS[stopIndex + 1];
  const segmentKm =
    currStop && nextStop ? nextStop.km - currStop.km : 25;
  return Math.min(30.0, Math.max(10.0, segmentKm * 0.55));
}

const INITIAL_SEGMENT_SIM_KM = getSegmentSimulatedKm(0);

/**
 * High-frequency mutable telemetry read directly by 3D `useFrame` loops
 * (RouteStation, RouteScenery, TrafficSystem) without triggering 60 FPS React re-renders.
 */
export const liveJourneyTelemetry = {
  distanceToNextStopKm: INITIAL_SEGMENT_SIM_KM,
  approachEntrySpeedKmh: CRUISE_SPEED_KMH,
  /**
   * Along-route position (same metres as `sceneryLive.traveledM`) of the station currently
   * placed in the world, NaN when there is none. The station is drawn at
   * `z = sceneryLive.traveledM - stationAnchorS`, so it stays locked to the ground.
   */
  stationAnchorS: 0,
  /** Index into JOURNEY_STOPS of the station at `stationAnchorS`. */
  stationStopIndex: 0,
};

let internalStationTimerSec = BOARDING_WAIT_SEC;
/** Un-rounded bus speed used for kinematics; the store only receives coarse updates. */
let liveSpeedKmh = 0;
/** > 0 while the bus is accelerating back to cruising speed after a stop. */
let cruiseTargetKmh = 0;
let departHoldSec = 0;
let approachDecelMs2 = COMFORT_DECEL_MS2;

function commitSpeed(speedKmh: number, force = false): void {
  liveSpeedKmh = speedKmh;
  const game = useGameStore.getState();
  if (force || Math.abs(game.busSpeedKmh - speedKmh) >= 0.5 || (speedKmh === 0 && game.busSpeedKmh !== 0)) {
    game.setBusSpeedKmh(speedKmh);
  }
}

export function getStationLayoutForStop(stopIndex: number): StationLayout {
  const stop = JOURNEY_STOPS[Math.max(0, Math.min(JOURNEY_STOPS.length - 1, stopIndex))];
  return STATION_LAYOUTS[stop.layout];
}

/** Layout of the station the bus is currently docked at (offline), or null while driving. */
export function getDockedStationLayout(): StationLayout | null {
  const s = useJourneyStore.getState();
  if (s.stage === 'boarding' || s.stage === 'at_station' || s.stage === 'completed') {
    return getStationLayoutForStop(s.currentStopIndex);
  }
  return null;
}

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

/** Put the player on the pavement of the first stop, facing the bus. */
function placePlayerAtOriginStop(): void {
  const charStore = useCharacterStore.getState();
  const playerId = charStore.playerId;
  const player = charStore.characters[playerId];
  if (!player) return;
  if (player.state === 'sitting') charStore.standUpFromSeat(playerId);
  const [sx, sz] = getStationLayoutForStop(0).spawn;
  useCharacterStore.setState((s) => ({
    characters: {
      ...s.characters,
      [playerId]: {
        ...s.characters[playerId],
        position: [sx, PLATFORM_Y, sz],
        rotationY: Math.PI / 2,
        state: 'idle',
        currentAnimation: 'Idle',
        seatId: null,
        targetSeatId: null,
        waypoints: [],
        activityLabel: 'Đang chờ xe ở điểm đón',
      },
    },
  }));
}

function beginApproach(set: (partial: Partial<JourneyStoreState>) => void, stopIndex: number): void {
  const nextIndex = stopIndex + 1;
  const traveled = sceneryLive.traveledM;
  const live = liveJourneyTelemetry;
  if (!Number.isFinite(live.stationAnchorS) || live.stationStopIndex !== nextIndex) {
    live.stationAnchorS = traveled + APPROACH_M;
    live.stationStopIndex = nextIndex;
  }
  const remainingM = Math.max(1, live.stationAnchorS - traveled);
  const entryKmh = Math.max(24, liveSpeedKmh);
  const entryMs = entryKmh / 3.6;
  live.approachEntrySpeedKmh = entryKmh;
  approachDecelMs2 = Math.max(COMFORT_DECEL_MS2, (entryMs * entryMs) / (2 * remainingM));
  cruiseTargetKmh = 0;
  departHoldSec = 0;
  live.distanceToNextStopKm = APPROACH_SIM_KM;
  syncRouteOdometerKm(stopIndex, APPROACH_SIM_KM);

  const nextStop = JOURNEY_STOPS[nextIndex];
  if (nextStop) {
    useInteractionStore.getState().showStatusToast(`Sắp tới ${nextStop.shortName}. Xe đang giảm tốc…`);
  }
  set({ stage: 'approaching', distanceToNextStopKm: APPROACH_SIM_KM });
}

export const useJourneyStore = create<JourneyStoreState>((set, get) => ({
  hasStarted: (() => {
    try {
      return new URLSearchParams(window.location.search).has('autostart');
    } catch {
      return false;
    }
  })(),
  currentStopIndex: 0,
  stage: 'boarding',
  doorOpen: true,
  distanceToNextStopKm: INITIAL_SEGMENT_SIM_KM,
  stationTimerSec: BOARDING_WAIT_SEC,
  isPlayerDisembarked: true,
  hasVisitedStalls: false,
  isCompletionModalOpen: false,

  beginBoarding: () => {
    if (get().hasStarted) return;
    set({ hasStarted: true });
    useInteractionStore
      .getState()
      .showStatusToast('Xe đang đón khách. Đi tới cửa xe để lên, rồi chọn một ghế trống.');
  },

  tickJourney: (deltaSec: number) => {
    // Do not override authoritative P2P room state when in Online Multiplayer mode
    if (useMultiplayerStore.getState().isOnlineMode) return;

    const state = get();
    const gameStore = useGameStore.getState();
    if (gameStore.isPaused || !state.hasStarted) return;
    const live = liveJourneyTelemetry;
    const traveled = sceneryLive.traveledM;

    if (state.stage === 'boarding' || state.stage === 'at_station') {
      // Once the player has taken a seat at the first stop there is no reason to keep waiting
      if (state.stage === 'boarding' && internalStationTimerSec > SEATED_DEPART_SEC) {
        const charStore = useCharacterStore.getState();
        if (charStore.characters[charStore.playerId]?.state === 'sitting') {
          internalStationTimerSec = SEATED_DEPART_SEC;
        }
      }
      // Countdown (only commit to React state when the integer second changes)
      internalStationTimerSec = Math.max(0, internalStationTimerSec - deltaSec);
      const ceilSec = Math.ceil(internalStationTimerSec);
      if (ceilSec !== Math.ceil(state.stationTimerSec)) {
        set({ stationTimerSec: ceilSec });
      }
      if (internalStationTimerSec <= 0) {
        get().departNextStop();
      }
      return;
    }

    if (state.stage === 'in_transit') {
      // Doors are closing: hold for a moment before pulling away
      if (departHoldSec > 0) {
        departHoldSec -= deltaSec;
        return;
      }
      if (cruiseTargetKmh > 0) {
        const next = Math.min(cruiseTargetKmh, liveSpeedKmh + ACCEL_KMH_PER_SEC * deltaSec);
        const reached = next >= cruiseTargetKmh;
        commitSpeed(next, reached);
        if (reached) cruiseTargetKmh = 0;
      } else {
        // Cruising: the speed slider in settings may change the store directly
        liveSpeedKmh = gameStore.busSpeedKmh;
      }
      const speedKmh = liveSpeedKmh;
      if (speedKmh <= 0) return;

      const deltaKm = (speedKmh / CRUISE_SPEED_KMH) * KM_PER_REAL_SECOND * deltaSec;
      const nextDist = Math.max(0, live.distanceToNextStopKm - deltaKm);
      live.distanceToNextStopKm = nextDist;
      syncRouteOdometerKm(state.currentStopIndex, nextDist);

      const nextIndex = state.currentStopIndex + 1;
      // The stop we just left has scrolled out of sight behind the bus
      if (
        Number.isFinite(live.stationAnchorS) &&
        live.stationStopIndex === state.currentStopIndex &&
        traveled - live.stationAnchorS > 110
      ) {
        live.stationAnchorS = Number.NaN;
      }
      // Place the upcoming stop on the horizon; from here on it is locked to the ground
      if (!Number.isFinite(live.stationAnchorS) && nextDist <= STATION_SHOW_SIM_KM) {
        live.stationAnchorS =
          traveled + APPROACH_M + Math.max(0, nextDist - APPROACH_SIM_KM) * VISUAL_M_PER_SIM_KM;
        live.stationStopIndex = nextIndex;
      }
      const remainingM =
        Number.isFinite(live.stationAnchorS) && live.stationStopIndex === nextIndex
          ? live.stationAnchorS - traveled
          : Infinity;

      if (remainingM <= APPROACH_M || nextDist <= APPROACH_SIM_KM) {
        beginApproach(set, state.currentStopIndex);
      } else {
        const roundedDist = Math.round(nextDist * 10) / 10;
        if (roundedDist !== state.distanceToNextStopKm) {
          set({ distanceToNextStopKm: roundedDist });
        }
      }
      return;
    }

    if (state.stage === 'approaching') {
      // Brake along v² = 2·a·d so the bus stops exactly at the ground-locked station
      const remainingM = Math.max(0, live.stationAnchorS - traveled);
      const entryMs = live.approachEntrySpeedKmh / 3.6;
      const arrived = remainingM <= 0.25;
      const targetMs = arrived
        ? 0
        : Math.max(1.0, Math.min(entryMs, Math.sqrt(2 * approachDecelMs2 * remainingM)));
      commitSpeed(targetMs * 3.6, arrived);

      const nextDist = APPROACH_SIM_KM * Math.min(1, remainingM / APPROACH_M);
      live.distanceToNextStopKm = nextDist;
      syncRouteOdometerKm(state.currentStopIndex, nextDist);
      const roundedDist = Math.round(nextDist * 10) / 10;
      if (roundedDist !== state.distanceToNextStopKm) {
        set({ distanceToNextStopKm: roundedDist });
      }

      if (arrived) {
        live.distanceToNextStopKm = 0;
        live.stationAnchorS = traveled;
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
            `Xe đã tới ${stop.shortName}. Cửa xe đã mở, bạn có thể xuống xe.`
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
    }
  },

  departNextStop: () => {
    const state = get();
    if (state.stage !== 'boarding' && state.stage !== 'at_station') return;
    if (state.currentStopIndex >= JOURNEY_STOPS.length - 1) {
      set({ stage: 'completed', isCompletionModalOpen: true });
      return;
    }

    // If player is outside at station, safely return them inside the bus
    const charStore = useCharacterStore.getState();
    const player = charStore.characters[charStore.playerId];
    if (state.isPlayerDisembarked || (player && player.position[0] > 1.35)) {
      get().boardPlayer();
      useInteractionStore.getState().showStatusToast('Bác tài gọi lên xe: xe chuẩn bị chạy!');
    } else {
      useInteractionStore.getState().showStatusToast('Cửa xe đóng lại. Xe bắt đầu lăn bánh!');
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

    // Close the door, then accelerate smoothly back to cruising speed
    commitSpeed(0, true);
    cruiseTargetKmh = CRUISE_SPEED_KMH;
    departHoldSec = DOOR_CLOSE_HOLD_SEC;

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
    if (player.state === 'sitting') charStore.standUpFromSeat(playerId);

    // Place character just outside the front passenger entry door on the station platform
    charStore.updateCharacterTransform(playerId, [...DOOR_EXIT_SPOT], -Math.PI / 2);
    set({ isPlayerDisembarked: true });

    useInteractionStore
      .getState()
      .showStatusToast('Bạn đã xuống trạm. Đi dạo một vòng, nhớ lên xe trước giờ chạy nhé!');
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

    if (player.waypoints.length > 0) charStore.cancelAutoWalk(playerId);
    charStore.updateCharacterTransform(playerId, [aisleX, aisleY, aisleZ], Math.PI);
    set({ isPlayerDisembarked: false });
  },

  interactWithStation: (interactable) => {
    if (interactable.kind === 'stall') set({ hasVisitedStalls: true });
    const charStore = useCharacterStore.getState();
    if (interactable.kind === 'photo') charStore.triggerCharacterEmote(charStore.playerId, 'Wave');
    useChatStore
      .getState()
      .sendChatBubble(charStore.playerId, 'Bạn', interactable.playerLine, 4800);
    useInteractionStore.getState().showStatusToast(interactable.toast);
  },

  fastForwardToNextStop: () => {
    const state = get();
    if (state.stage !== 'in_transit') return;
    if (liveSpeedKmh < 30) commitSpeed(Math.max(30, useGameStore.getState().busSpeedKmh), true);
    departHoldSec = 0;
    beginApproach(set, state.currentStopIndex);
    useInteractionStore
      .getState()
      .showStatusToast('Đã tua nhanh đến trạm dừng tiếp theo!');
  },

  restartJourney: () => {
    resetToOriginStop();
    useInteractionStore
      .getState()
      .showStatusToast(
        'Chuyến mới: xe đang đón khách tại Bánh mì 168 Bình Lục.'
      );
  },

  closeCompletionModal: () => {
    set({ isCompletionModalOpen: false });
  },
}));

/** Park the bus at the first stop with the door open and the player waiting on the kerb. */
function resetToOriginStop(): void {
  commitSpeed(0, true);
  cruiseTargetKmh = 0;
  departHoldSec = 0;
  useGameStore.setState({ distanceTraveledKm: 0 });
  placePlayerAtOriginStop();
  const initialSimDist = getSegmentSimulatedKm(0);
  liveJourneyTelemetry.distanceToNextStopKm = initialSimDist;
  liveJourneyTelemetry.approachEntrySpeedKmh = CRUISE_SPEED_KMH;
  liveJourneyTelemetry.stationAnchorS = sceneryLive.traveledM;
  liveJourneyTelemetry.stationStopIndex = 0;
  internalStationTimerSec = BOARDING_WAIT_SEC;

  useJourneyStore.setState({
    currentStopIndex: 0,
    stage: 'boarding',
    doorOpen: true,
    distanceToNextStopKm: initialSimDist,
    stationTimerSec: BOARDING_WAIT_SEC,
    isPlayerDisembarked: true,
    hasVisitedStalls: false,
    isCompletionModalOpen: false,
  });
}

// Online rooms are host-authoritative: hide the offline station and keep the player inside.
// Leaving a room restores the offline scene and restarts the trip from the first stop.
useMultiplayerStore.subscribe((state, prev) => {
  if (state.isOnlineMode === prev.isOnlineMode) return;
  if (state.isOnlineMode) {
    liveJourneyTelemetry.stationAnchorS = Number.NaN;
    cruiseTargetKmh = 0;
    departHoldSec = 0;
    useJourneyStore.setState({
      hasStarted: true,
      stage: 'in_transit',
      doorOpen: false,
      isPlayerDisembarked: false,
      isCompletionModalOpen: false,
    });
  } else {
    resetToOriginStop();
  }
});
