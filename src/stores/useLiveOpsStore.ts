import { create } from 'zustand';
import { useGameStore } from './useGameStore';
import { useInteractionStore } from './useInteractionStore';

export interface OnboardingStepItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface LiveEventItem {
  id: string;
  title: string;
  seasonTag: string;
  windowLabel: string;
  description: string;
  condition: string;
  rewardLabel: string;
  presetTimeOfDay: 'day' | 'night';
  presetWeather: 'sunny' | 'rain' | 'fog';
  presetTripName: string;
}

export interface SupportTicketItem {
  ticketId: string;
  category: 'Technical' | 'Account' | 'Safety_Moderation' | 'Feedback';
  priority: 'P1 - Khẩn cấp (An toàn)' | 'P2 - Cao' | 'P3 - Thông thường';
  slaLabel: string;
  summary: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
  createdAt: string;
}

export interface ModerationCaseItem {
  caseId: string;
  targetName: string;
  violationLevel: 'Nhắc nhở (Warning)' | 'Tạm khóa chat (Mute 10p)' | 'Cấm phòng (Room Ban)';
  reason: string;
  appealStatus: 'NONE' | 'PENDING_APPEAL' | 'APPROVED';
  createdAt: string;
}

export interface FeatureFlagsState {
  enableP2PMultiplayer: boolean;
  enableCosmeticShop: boolean;
  enableMatchmaking: boolean;
  enableWeatherEffects: boolean;
  enableAutoQualityGuard: boolean;
  maintenanceMode: boolean;
}

export interface ProductAnalyticsKpis {
  consentGranted: boolean;
  sessionsCount: number;
  onboardingCompletedCount: number;
  seatSelectionsCount: number;
  p2pRoomsJoinedCount: number;
  crashFreeRatePercent: number;
}

const LIVEOPS_STORAGE_KEY = 'virtual_bus_liveops_v1';

interface LiveOpsStoreState {
  isModalOpen: boolean;
  activeTab:
  | 'onboarding'
  | 'events'
  | 'support'
  | 'moderation'
  | 'release'
  | 'legal';
  announcementBanner: string | null;
  onboardingSteps: OnboardingStepItem[];
  events: LiveEventItem[];
  activeEventId: string | null;
  supportTickets: SupportTicketItem[];
  moderationCases: ModerationCaseItem[];
  featureFlags: FeatureFlagsState;
  analytics: ProductAnalyticsKpis;

  setModalOpen: (open: boolean) => void;
  setActiveTab: (
    tab:
      | 'onboarding'
      | 'events'
      | 'support'
      | 'moderation'
      | 'release'
      | 'legal'
  ) => void;
  dismissAnnouncementBanner: () => void;
  completeOnboardingStep: (stepId: string) => void;
  activateLiveEvent: (eventId: string) => void;
  submitSupportTicket: (
    category: SupportTicketItem['category'],
    summary: string
  ) => SupportTicketItem | null;
  submitModerationAppeal: (caseId: string, note: string) => void;
  toggleFeatureFlag: (key: keyof FeatureFlagsState) => void;
  setAnalyticsConsent: (granted: boolean) => void;
  trackSafeEvent: (
    eventType: 'seat_select' | 'p2p_join' | 'onboarding_complete'
  ) => void;
}

export const useLiveOpsStore = create<LiveOpsStoreState>((set, get) => ({
  isModalOpen: false,
  activeTab: 'onboarding',
  announcementBanner:
    '🎉 Chào mừng đến với RoadMate / Virtual Bus 3D v1.0 (Open Beta P2P)! Tham gia sự kiện "Chuyến Xe Đêm Cao Nguyên" hoặc mở bảng Hướng Dẫn Tân Thủ để nhận Coin.',

  onboardingSteps: [
    {
      id: 'step-camera',
      title: '1. Làm quen 3 góc nhìn Camera (Phím 1 / 2 / 3)',
      description:
        'Chuyển đổi giữa Camera Nội Thất (1), Cắt Trần Từ Trên Xuống (2) và Camera Đuôi Xe (3).',
      completed: false,
    },
    {
      id: 'step-move-seat',
      title: '2. Di chuyển (WASD) & Chọn ghế ngồi (1A–7D)',
      description:
        'Đi dọc lối đi hoặc click vào một chiếc ghế trống bất kỳ để nhân vật tự tìm đường ngồi xuống.',
      completed: false,
    },
    {
      id: 'step-chat-emote',
      title: '3. Trò chuyện & Biểu cảm cùng hành khách',
      description:
        'Gửi một câu chào tiếng Việt hoặc bấm biểu cảm Vẫy tay / Mỉm cười trên thanh HUD phía dưới.',
      completed: false,
    },
    {
      id: 'step-p2p-room',
      title: '4. Khám phá Bến Xe P2P hoặc Cửa Hàng Trang Phục',
      description:
        'Mở Bến Xe P2P để nhập Mã Chuyến Xe cùng bạn bè hoặc mở Shop cá nhân hóa nhân vật.',
      completed: false,
    },
  ],

  events: [
    {
      id: 'evt-weekend-mientay',
      title: 'Chuyến Xe Cuối Tuần — Về Miền Tây Mùa Nước Nổi',
      seasonTag: 'Sự kiện hàng tuần',
      windowLabel: 'Thứ 7 & Chủ Nhật (06:00 – 23:00)',
      description:
        'Trải nghiệm hành trình nắng sớm qua cầu Mỹ Thuận, giao lưu cùng hành khách miền Tây.',
      condition: 'Không giới hạn cấp độ • Chống farm tối đa 1 lần/ngày',
      rewardLabel: '+80 Coin & Huy hiệu Phù Sa',
      presetTimeOfDay: 'day',
      presetWeather: 'sunny',
      presetTripName: '[Sự Kiện] Chuyến Xe Cuối Tuần Miền Tây #VB-WK',
    },
    {
      id: 'evt-night-dalat',
      title: 'Hành Trình Ngắm Sao Đêm — Đèo Bảo Lộc Đà Lạt',
      seasonTag: 'Sự kiện giới hạn',
      windowLabel: 'Hàng đêm (19:00 – 05:00)',
      description:
        'Chuyến xe đêm xuyên sương mù cao nguyên kết hợp nghe nhạc Acoustic Lo-Fi đồng bộ.',
      condition: 'Bật chế độ Đêm + Thời tiết Sương Mù',
      rewardLabel: '+100 Coin & Áo Đêm Cao Nguyên (Preview)',
      presetTimeOfDay: 'night',
      presetWeather: 'fog',
      presetTripName: '[Sự Kiện] Chuyến Xe Đêm Đà Lạt Sương Mù #VB-DL',
    },
    {
      id: 'evt-tet-homebound',
      title: 'Chuyến Xe Đoàn Viên — Tết Sum Vầy',
      seasonTag: 'Lễ hội theo mùa',
      windowLabel: 'Sự kiện đặc biệt',
      description:
        'Cùng những người bạn mới trên khắp mọi miền đất nước trò chuyện trên chuyến xe về quê ăn Tết.',
      condition: 'Tham gia phòng xe P2P hoặc gửi lời chúc tốt đẹp',
      rewardLabel: '+120 Coin & Đèn Lồng Lễ Hội',
      presetTimeOfDay: 'night',
      presetWeather: 'sunny',
      presetTripName: '[Lễ Hội] Chuyến Xe Tết Đoàn Viên #VB-TET',
    },
  ],

  activeEventId: null,

  supportTickets: [
    {
      ticketId: '#SUP-2026-1001',
      category: 'Feedback',
      priority: 'P3 - Thông thường',
      slaLabel: 'SLA: Phản hồi trong 24h',
      summary: 'Đề xuất thêm tuyến xe Hà Nội – Sa Pa vào bản cập nhật tới.',
      status: 'RESOLVED',
      createdAt: new Date().toISOString(),
    },
  ],

  moderationCases: [
    {
      caseId: 'MOD-801',
      targetName: 'Khách Ẩn Danh (Mẫu kiểm duyệt)',
      violationLevel: 'Nhắc nhở (Warning)',
      reason: 'Gửi tin nhắn lặp lại quá nhanh trên kênh chat chung.',
      appealStatus: 'NONE',
      createdAt: new Date().toISOString(),
    },
  ],

  featureFlags: {
    enableP2PMultiplayer: true,
    enableCosmeticShop: true,
    enableMatchmaking: true,
    enableWeatherEffects: true,
    enableAutoQualityGuard: true,
    maintenanceMode: false,
  },

  analytics: {
    consentGranted: true,
    sessionsCount: 1,
    onboardingCompletedCount: 0,
    seatSelectionsCount: 0,
    p2pRoomsJoinedCount: 0,
    crashFreeRatePercent: 100,
  },

  setModalOpen: (open) => set({ isModalOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab, isModalOpen: true }),
  dismissAnnouncementBanner: () => set({ announcementBanner: null }),

  completeOnboardingStep: (stepId) => {
    const state = get();
    const nextSteps = state.onboardingSteps.map((s) =>
      s.id === stepId ? { ...s, completed: true } : s
    );
    const allDone = nextSteps.every((s) => s.completed);
    set({
      onboardingSteps: nextSteps,
      analytics: {
        ...state.analytics,
        onboardingCompletedCount: allDone
          ? Math.max(1, state.analytics.onboardingCompletedCount)
          : state.analytics.onboardingCompletedCount,
      },
    });
    if (allDone) {
      useInteractionStore
        .getState()
        .showStatusToast(
          '🎉 Chúc mừng bạn đã hoàn thành 100% Hướng Dẫn Tân Thủ RoadMate!'
        );
    }
  },

  activateLiveEvent: (eventId) => {
    const state = get();
    const evt = state.events.find((e) => e.id === eventId);
    if (!evt) return;

    const gameStore = useGameStore.getState();
    gameStore.setTimeOfDay(evt.presetTimeOfDay);
    const weather =
      evt.presetWeather === 'rain'
        ? 'rainy'
        : evt.presetWeather === 'fog'
          ? 'cloudy'
          : 'sunny';
    gameStore.setWeather(weather);
    useGameStore.setState({
      tripName: evt.presetTripName,
      journeyStatus: `Đang tham gia: ${evt.title}`,
    });

    set({ activeEventId: eventId });
    useInteractionStore
      .getState()
      .showStatusToast(`🌟 Đã kích hoạt sự kiện: "${evt.title}"!`);
  },

  submitSupportTicket: (category, summary) => {
    const trimmed = summary.trim();
    if (!trimmed) return null;

    const priority: SupportTicketItem['priority'] =
      category === 'Safety_Moderation'
        ? 'P1 - Khẩn cấp (An toàn)'
        : category === 'Technical'
          ? 'P2 - Cao'
          : 'P3 - Thông thường';

    const slaLabel =
      category === 'Safety_Moderation'
        ? 'SLA: Xử lý khẩn cấp < 2h'
        : category === 'Technical'
          ? 'SLA: Phản hồi < 8h'
          : 'SLA: Phản hồi < 24h';

    const ticket: SupportTicketItem = {
      ticketId: `#SUP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      category,
      priority,
      slaLabel,
      summary: trimmed,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };

    const nextTickets = [ticket, ...get().supportTickets].slice(0, 25);
    set({ supportTickets: nextTickets });
    try {
      window.localStorage.setItem(
        LIVEOPS_STORAGE_KEY,
        JSON.stringify({ supportTickets: nextTickets })
      );
    } catch {
      // Ignore storage error
    }
    return ticket;
  },

  submitModerationAppeal: (caseId, note) => {
    if (!note.trim()) return;
    set((state) => ({
      moderationCases: state.moderationCases.map((c) =>
        c.caseId === caseId ? { ...c, appealStatus: 'PENDING_APPEAL' } : c
      ),
    }));
    useInteractionStore
      .getState()
      .showStatusToast(
        `Đã gửi yêu cầu khiếu nại cho mã #${caseId}. Đội ngũ kiểm duyệt sẽ phản hồi.`
      );
  },

  toggleFeatureFlag: (key) => {
    set((state) => ({
      featureFlags: {
        ...state.featureFlags,
        [key]: !state.featureFlags[key],
      },
    }));
  },

  setAnalyticsConsent: (granted) => {
    set((state) => ({
      analytics: {
        ...state.analytics,
        consentGranted: granted,
      },
    }));
  },

  trackSafeEvent: (eventType) => {
    const state = get();
    if (!state.analytics.consentGranted) return;

    if (eventType === 'seat_select') {
      set({
        analytics: {
          ...state.analytics,
          seatSelectionsCount: state.analytics.seatSelectionsCount + 1,
        },
      });
    } else if (eventType === 'p2p_join') {
      set({
        analytics: {
          ...state.analytics,
          p2pRoomsJoinedCount: state.analytics.p2pRoomsJoinedCount + 1,
        },
      });
    } else if (eventType === 'onboarding_complete') {
      set({
        analytics: {
          ...state.analytics,
          onboardingCompletedCount:
            state.analytics.onboardingCompletedCount + 1,
        },
      });
    }
  },
}));