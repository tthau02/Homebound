import { create } from 'zustand';
import { useMultiplayerStore } from './useMultiplayerStore';
import { useInteractionStore } from './useInteractionStore';

export type LedgerTransactionType =
  | 'reward'
  | 'purchase'
  | 'refund'
  | 'admin_adjustment';

export interface WalletTransactionRecord {
  id: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  type: LedgerTransactionType;
  reason: string;
  referenceId?: string;
  idempotencyKey: string;
  createdAt: string;
}

export type LoadoutCategory = 'top' | 'bottom' | 'hair' | 'accessory' | 'emote';

export interface ExtendedCatalogItem {
  id: string;
  name: string;
  description: string;
  category: LoadoutCategory;
  priceCoins: number;
  assetKey: string;
  previewBadge: string;
  colorHex?: string;
  rarity: 'Common' | 'Rare' | 'Epic';
  active: boolean;
}

export interface AvatarLoadoutState {
  top: string | null;
  bottom: string | null;
  hair: string | null;
  accessory: string | null;
  emote: string | null;
}

export interface DailyQuestReward {
  id: string;
  title: string;
  description: string;
  rewardCoins: number;
  dailyLimit: number;
  claimedToday: number;
  cooldownSec: number;
  lastClaimedMs: number;
}

const LEDGER_STORAGE_KEY = 'virtual_bus_economy_ledger_v1';

export const EXTENDED_CATALOG_ITEMS: ExtendedCatalogItem[] = [
  {
    id: 'top-mekong-sunset',
    name: 'Áo Khoác Hoàng Hôn Mekong',
    description: 'Áo khoác gió màu cam hoàng hôn ấm áp cho hành trình miền Tây.',
    category: 'top',
    priceCoins: 120,
    assetKey: 'mesh_top_sunset',
    previewBadge: '🧥',
    colorHex: '#f97316',
    rarity: 'Common',
    active: true,
  },
  {
    id: 'top-river-teal',
    name: 'Áo Sơ Mi Sóng Nước Cửu Long',
    description: 'Sơ mi du lịch màu xanh ngọc mát mẻ, chống nhăn.',
    category: 'top',
    priceCoins: 150,
    assetKey: 'mesh_top_teal',
    previewBadge: '👕',
    colorHex: '#0f766e',
    rarity: 'Rare',
    active: true,
  },
  {
    id: 'bottom-cargo-slate',
    name: 'Quần Cargo Phượt Quốc Lộ',
    description: 'Quần dài nhiều túi tiện lợi cho hành khách đường dài.',
    category: 'bottom',
    priceCoins: 110,
    assetKey: 'mesh_bottom_cargo',
    previewBadge: '👖',
    colorHex: '#334155',
    rarity: 'Common',
    active: true,
  },
  {
    id: 'hair-breeze-undercut',
    name: 'Tóc Phong Lữ Cao Nguyên',
    description: 'Kiểu tóc gọn gàng trẻ trung hợp với những chuyến xe đêm Đà Lạt.',
    category: 'hair',
    priceCoins: 95,
    assetKey: 'mesh_hair_breeze',
    previewBadge: '💇',
    colorHex: '#1e1b4b',
    rarity: 'Common',
    active: true,
  },
  {
    id: 'acc-non-la-charm',
    name: 'Nón Lá Miền Tây Cách Điệu',
    description: 'Phụ kiện nón lá truyền thống kèm dây lụa đỏ.',
    category: 'accessory',
    priceCoins: 180,
    assetKey: 'mesh_acc_nonla',
    previewBadge: '👒',
    colorHex: '#eab308',
    rarity: 'Epic',
    active: true,
  },
  {
    id: 'acc-retro-sunglasses',
    name: 'Kính Râm Retro Quốc Lộ 1A',
    description: 'Kính mát chống chói khi ngồi ghế cửa sổ ban ngày.',
    category: 'accessory',
    priceCoins: 140,
    assetKey: 'mesh_acc_glasses',
    previewBadge: '🕶️',
    colorHex: '#0284c7',
    rarity: 'Rare',
    active: true,
  },
  {
    id: 'emote-lantern-cheer',
    name: 'Biểu Cảm Vẫy Đèn Lồng Đêm',
    description: 'Hiệu ứng cổ vũ vui nhộn trên chuyến xe lễ hội.',
    category: 'emote',
    priceCoins: 130,
    assetKey: 'anim_emote_lantern',
    previewBadge: '🏮',
    rarity: 'Rare',
    active: true,
  },
];

interface EconomyLedgerStoreState {
  isModalOpen: boolean;
  coinBalance: number;
  transactions: WalletTransactionRecord[];
  processedIdempotencyKeys: string[];
  ownedItemIds: string[];
  equippedLoadout: AvatarLoadoutState;
  quests: DailyQuestReward[];
  auditLogs: string[];

  setModalOpen: (open: boolean) => void;
  purchaseItemWithIdempotency: (
    itemId: string,
    idempotencyKey: string
  ) => { ok: boolean; message: string };
  equipLoadoutItem: (itemId: string) => void;
  unequipLoadoutSlot: (slot: LoadoutCategory) => void;
  claimQuestReward: (questId: string) => { ok: boolean; message: string };
  adminAdjustCoins: (
    delta: number,
    reason: string
  ) => { ok: boolean; message: string };
  adminToggleCatalogActive: (itemId: string, reason: string) => void;
  catalog: ExtendedCatalogItem[];
}

function loadPersistedLedger(): {
  coinBalance: number;
  transactions: WalletTransactionRecord[];
  processedIdempotencyKeys: string[];
  ownedItemIds: string[];
  equippedLoadout: AvatarLoadoutState;
  auditLogs: string[];
} {
  const fallback = {
    coinBalance: 600,
    transactions: [
      {
        id: 'tx-welcome-001',
        userId: 'local-player',
        amount: 600,
        balanceAfter: 600,
        type: 'reward' as const,
        reason: 'Quà khởi hành tân thủ RoadMate (Phase 6)',
        idempotencyKey: 'init-seed-welcome-001',
        createdAt: new Date().toISOString(),
      },
    ],
    processedIdempotencyKeys: ['init-seed-welcome-001'],
    ownedItemIds: ['top-mekong-sunset'],
    equippedLoadout: {
      top: 'top-mekong-sunset',
      bottom: null,
      hair: null,
      accessory: null,
      emote: null,
    },
    auditLogs: [
      `[${new Date().toISOString()}] SYSTEM: Khởi tạo sổ cái giao dịch (Immutable Wallet Ledger) với 600 Coin.`,
    ],
  };

  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(LEDGER_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      coinBalance:
        typeof parsed.coinBalance === 'number' && parsed.coinBalance >= 0
          ? parsed.coinBalance
          : fallback.coinBalance,
      transactions: Array.isArray(parsed.transactions)
        ? parsed.transactions
        : fallback.transactions,
      processedIdempotencyKeys: Array.isArray(parsed.processedIdempotencyKeys)
        ? parsed.processedIdempotencyKeys
        : fallback.processedIdempotencyKeys,
      ownedItemIds: Array.isArray(parsed.ownedItemIds)
        ? parsed.ownedItemIds
        : fallback.ownedItemIds,
      equippedLoadout: parsed.equippedLoadout ?? fallback.equippedLoadout,
      auditLogs: Array.isArray(parsed.auditLogs)
        ? parsed.auditLogs
        : fallback.auditLogs,
    };
  } catch {
    return fallback;
  }
}

function persistLedgerState(state: {
  coinBalance: number;
  transactions: WalletTransactionRecord[];
  processedIdempotencyKeys: string[];
  ownedItemIds: string[];
  equippedLoadout: AvatarLoadoutState;
  auditLogs: string[];
}): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors
  }
}

const initialLedger = loadPersistedLedger();

export const useEconomyLedgerStore = create<EconomyLedgerStoreState>(
  (set, get) => ({
    isModalOpen: false,
    coinBalance: initialLedger.coinBalance,
    transactions: initialLedger.transactions,
    processedIdempotencyKeys: initialLedger.processedIdempotencyKeys,
    ownedItemIds: initialLedger.ownedItemIds,
    equippedLoadout: initialLedger.equippedLoadout,
    catalog: EXTENDED_CATALOG_ITEMS,
    auditLogs: initialLedger.auditLogs,

    quests: [
      {
        id: 'quest-board-bus',
        title: 'Điểm danh lên chuyến xe',
        description: 'Tham gia một chuyến xe khách và kiểm tra ghế ngồi.',
        rewardCoins: 80,
        dailyLimit: 2,
        claimedToday: 0,
        cooldownSec: 15,
        lastClaimedMs: 0,
      },
      {
        id: 'quest-polite-social',
        title: 'Giao lưu văn minh trên xe',
        description: 'Chào hỏi hoặc gửi biểu cảm thân thiện với hành khách cùng xe (Chống spam).',
        rewardCoins: 65,
        dailyLimit: 3,
        claimedToday: 0,
        cooldownSec: 20,
        lastClaimedMs: 0,
      },
      {
        id: 'quest-rest-stop',
        title: 'Khám phá trạm dừng nghỉ',
        description: 'Trải nghiệm trạm dừng chân miền Tây hoặc cao nguyên Đà Lạt.',
        rewardCoins: 100,
        dailyLimit: 1,
        claimedToday: 0,
        cooldownSec: 30,
        lastClaimedMs: 0,
      },
    ],

    setModalOpen: (open) => set({ isModalOpen: open }),

    purchaseItemWithIdempotency: (itemId, idempotencyKey) => {
      const state = get();
      if (!idempotencyKey.trim()) {
        return { ok: false, message: 'Thiếu Idempotency Key cho giao dịch.' };
      }

      // 1. Idempotency check: prevent double charge on retry
      if (state.processedIdempotencyKeys.includes(idempotencyKey)) {
        return {
          ok: false,
          message: 'Giao dịch trùng lặp (Idempotency Key đã được xử lý). Không trừ tiền 2 lần.',
        };
      }

      // 2. Read authoritative price & availability from catalog
      const item = state.catalog.find((c) => c.id === itemId);
      if (!item || !item.active) {
        return {
          ok: false,
          message: 'Vật phẩm không tồn tại hoặc đã ngừng bán trong Catalog.',
        };
      }

      if (state.ownedItemIds.includes(item.id)) {
        return {
          ok: false,
          message: 'Bạn đã sở hữu vật phẩm này trong kho đồ (Inventory).',
        };
      }

      // 3. Prevent negative balance
      if (state.coinBalance < item.priceCoins) {
        return {
          ok: false,
          message: `Số dư không đủ (${state.coinBalance}/${item.priceCoins} Coin).`,
        };
      }

      const nextBalance = state.coinBalance - item.priceCoins;
      const userId = useMultiplayerStore.getState().user?.id ?? 'local-player';
      const tx: WalletTransactionRecord = {
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId,
        amount: -item.priceCoins,
        balanceAfter: nextBalance,
        type: 'purchase',
        reason: `Mua vật phẩm: ${item.name}`,
        referenceId: item.id,
        idempotencyKey,
        createdAt: new Date().toISOString(),
      };

      const nextTransactions = [tx, ...state.transactions].slice(0, 60);
      const nextKeys = [...state.processedIdempotencyKeys, idempotencyKey];
      const nextOwned = [...state.ownedItemIds, item.id];
      const nextAudit = [
        `[${tx.createdAt}] PURCHASE: User=${userId} mua ${item.id} (-${item.priceCoins} Coin, Key=${idempotencyKey})`,
        ...state.auditLogs,
      ].slice(0, 50);

      set({
        coinBalance: nextBalance,
        transactions: nextTransactions,
        processedIdempotencyKeys: nextKeys,
        ownedItemIds: nextOwned,
        auditLogs: nextAudit,
      });

      persistLedgerState({
        coinBalance: nextBalance,
        transactions: nextTransactions,
        processedIdempotencyKeys: nextKeys,
        ownedItemIds: nextOwned,
        equippedLoadout: state.equippedLoadout,
        auditLogs: nextAudit,
      });

      return {
        ok: true,
        message: `Đã mua thành công "${item.name}" (-${item.priceCoins} Coin)!`,
      };
    },

    equipLoadoutItem: (itemId) => {
      const state = get();
      if (!state.ownedItemIds.includes(itemId)) return;
      const item = state.catalog.find((c) => c.id === itemId);
      if (!item) return;

      const nextLoadout: AvatarLoadoutState = {
        ...state.equippedLoadout,
        [item.category]: item.id,
      };

      set({ equippedLoadout: nextLoadout });
      persistLedgerState({
        coinBalance: state.coinBalance,
        transactions: state.transactions,
        processedIdempotencyKeys: state.processedIdempotencyKeys,
        ownedItemIds: state.ownedItemIds,
        equippedLoadout: nextLoadout,
        auditLogs: state.auditLogs,
      });

      useInteractionStore
        .getState()
        .showStatusToast(`Đã trang bị "${item.name}" vào slot ${item.category.toUpperCase()}!`);
    },

    unequipLoadoutSlot: (slot) => {
      const state = get();
      const nextLoadout: AvatarLoadoutState = {
        ...state.equippedLoadout,
        [slot]: null,
      };
      set({ equippedLoadout: nextLoadout });
      persistLedgerState({
        coinBalance: state.coinBalance,
        transactions: state.transactions,
        processedIdempotencyKeys: state.processedIdempotencyKeys,
        ownedItemIds: state.ownedItemIds,
        equippedLoadout: nextLoadout,
        auditLogs: state.auditLogs,
      });
    },

    claimQuestReward: (questId) => {
      const state = get();
      const quest = state.quests.find((q) => q.id === questId);
      if (!quest) {
        return { ok: false, message: 'Nhiệm vụ không tồn tại.' };
      }

      if (quest.claimedToday >= quest.dailyLimit) {
        return {
          ok: false,
          message: `Đã đạt giới hạn nhận thưởng trong ngày (${quest.dailyLimit}/${quest.dailyLimit}) — Chống farm coin.`,
        };
      }

      const now = Date.now();
      const elapsedSec = (now - quest.lastClaimedMs) / 1000;
      if (quest.lastClaimedMs > 0 && elapsedSec < quest.cooldownSec) {
        const waitSec = Math.ceil(quest.cooldownSec - elapsedSec);
        return {
          ok: false,
          message: `Vui lòng đợi ${waitSec}s trước khi nhận tiếp (Chống spam/farm).`,
        };
      }

      const idempotencyKey = `reward-${questId}-${quest.claimedToday + 1}-${ new Date().toISOString().slice(0, 10)}`;
      if (state.processedIdempotencyKeys.includes(idempotencyKey)) {
        return { ok: false, message: 'Phần thưởng này đã được nhận hôm nay.' };
      }

      const nextBalance = state.coinBalance + quest.rewardCoins;
      const userId = useMultiplayerStore.getState().user?.id ?? 'local-player';
      const tx: WalletTransactionRecord = {
        id: `tx-rew-${now}`,
        userId,
        amount: quest.rewardCoins,
        balanceAfter: nextBalance,
        type: 'reward',
        reason: `Thưởng hoạt động: ${quest.title}`,
        referenceId: quest.id,
        idempotencyKey,
        createdAt: new Date().toISOString(),
      };

      const nextQuests = state.quests.map((q) =>
        q.id === questId
          ? {
              ...q,
              claimedToday: q.claimedToday + 1,
              lastClaimedMs: now,
            }
          : q
      );

      const nextTransactions = [tx, ...state.transactions].slice(0, 60);
      const nextKeys = [...state.processedIdempotencyKeys, idempotencyKey];
      const nextAudit = [
        `[${tx.createdAt}] REWARD: User=${userId} nhận +${quest.rewardCoins} Coin từ ${quest.id}`,
        ...state.auditLogs,
      ].slice(0, 50);

      set({
        coinBalance: nextBalance,
        quests: nextQuests,
        transactions: nextTransactions,
        processedIdempotencyKeys: nextKeys,
        auditLogs: nextAudit,
      });

      persistLedgerState({
        coinBalance: nextBalance,
        transactions: nextTransactions,
        processedIdempotencyKeys: nextKeys,
        ownedItemIds: state.ownedItemIds,
        equippedLoadout: state.equippedLoadout,
        auditLogs: nextAudit,
      });

      return {
        ok: true,
        message: `Nhận thưởng thành công +${quest.rewardCoins} Coin (${quest.title})!`,
      };
    },

    adminAdjustCoins: (delta, reason) => {
      const state = get();
      if (!reason.trim()) {
        return {
          ok: false,
          message: 'Bắt buộc phải nhập lý do Audit Log khi điều chỉnh Coin.',
        };
      }
      const nextBalance = state.coinBalance + delta;
      if (nextBalance < 0) {
        return {
          ok: false,
          message: 'Không cho phép điều chỉnh làm số dư ví bị âm (< 0).',
        };
      }

      const nowIso = new Date().toISOString();
      const idempotencyKey = `admin-${nowIso}`;
      const tx: WalletTransactionRecord = {
        id: `tx-adm-${Date.now()}`,
        userId: 'admin-local',
        amount: delta,
        balanceAfter: nextBalance,
        type: 'admin_adjustment',
        reason: `[Admin Audit] ${reason.trim()}`,
        idempotencyKey,
        createdAt: nowIso,
      };

      const nextTransactions = [tx, ...state.transactions].slice(0, 60);
      const nextAudit = [
        `[${nowIso}] ADMIN_ADJUST: Delta=${delta >= 0 ? `+${delta}` : delta} Coin • Lý do: "${reason.trim()}"`,
        ...state.auditLogs,
      ].slice(0, 50);

      set({
        coinBalance: nextBalance,
        transactions: nextTransactions,
        auditLogs: nextAudit,
      });

      persistLedgerState({
        coinBalance: nextBalance,
        transactions: nextTransactions,
        processedIdempotencyKeys: state.processedIdempotencyKeys,
        ownedItemIds: state.ownedItemIds,
        equippedLoadout: state.equippedLoadout,
        auditLogs: nextAudit,
      });

      return {
        ok: true,
        message: `Đã điều chỉnh ${delta >= 0 ? `+${delta}` : delta} Coin và ghi nhận vào Audit Log.`,
      };
    },

    adminToggleCatalogActive: (itemId, reason) => {
      const state = get();
      const target = state.catalog.find((c) => c.id === itemId);
      if (!target) return;
      const nextActive = !target.active;
      const nowIso = new Date().toISOString();
      const nextCatalog = state.catalog.map((c) =>
        c.id === itemId ? { ...c, active: nextActive } : c
      );
      const nextAudit = [
        `[${nowIso}] ADMIN_CATALOG: Item=${itemId} -> ${nextActive ? 'ĐANG BÁN' : 'TẠM ẨN'} (${reason || 'Cập nhật trạng thái catalog'})`,
        ...state.auditLogs,
      ].slice(0, 50);

      set({
        catalog: nextCatalog,
        auditLogs: nextAudit,
      });
    },
  })
);

