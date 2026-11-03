import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Coins,
  History,
  Layers,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import {
  LoadoutCategory,
  useEconomyLedgerStore,
} from '../../stores/useEconomyLedgerStore';
import { useInteractionStore } from '../../stores/useInteractionStore';

export const EconomyAndCustomizationModal: React.FC = () => {
  const isModalOpen = useEconomyLedgerStore((s) => s.isModalOpen);
  const setModalOpen = useEconomyLedgerStore((s) => s.setModalOpen);
  const coinBalance = useEconomyLedgerStore((s) => s.coinBalance);
  const transactions = useEconomyLedgerStore((s) => s.transactions);
  const catalog = useEconomyLedgerStore((s) => s.catalog);
  const ownedItemIds = useEconomyLedgerStore((s) => s.ownedItemIds);
  const equippedLoadout = useEconomyLedgerStore((s) => s.equippedLoadout);
  const quests = useEconomyLedgerStore((s) => s.quests);
  const auditLogs = useEconomyLedgerStore((s) => s.auditLogs);

  const purchaseItemWithIdempotency = useEconomyLedgerStore(
    (s) => s.purchaseItemWithIdempotency
  );
  const equipLoadoutItem = useEconomyLedgerStore((s) => s.equipLoadoutItem);
  const unequipLoadoutSlot = useEconomyLedgerStore((s) => s.unequipLoadoutSlot);
  const claimQuestReward = useEconomyLedgerStore((s) => s.claimQuestReward);
  const adminAdjustCoins = useEconomyLedgerStore((s) => s.adminAdjustCoins);
  const adminToggleCatalogActive = useEconomyLedgerStore(
    (s) => s.adminToggleCatalogActive
  );

  const [tab, setTab] = useState<'shop' | 'loadout' | 'ledger' | 'quests' | 'admin'>('shop');
  const [selectedCategory, setSelectedCategory] = useState<LoadoutCategory | 'all'>('all');
  const [adminDelta, setAdminDelta] = useState<number>(100);
  const [adminReason, setAdminReason] = useState<string>('');

  if (!isModalOpen) return null;

  const filteredCatalog = catalog.filter((item) =>
    selectedCategory === 'all' ? true : item.category === selectedCategory
  );

  const handleBuy = (itemId: string) => {
    const idempotencyKey = `buy-${itemId}-${Date.now()}`;
    const res = purchaseItemWithIdempotency(itemId, idempotencyKey);
    useInteractionStore.getState().showStatusToast(res.message);
  };

  const handleClaimQuest = (questId: string) => {
    const res = claimQuestReward(questId);
    useInteractionStore.getState().showStatusToast(res.message);
  };

  const handleAdminAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    const res = adminAdjustCoins(adminDelta, adminReason);
    useInteractionStore.getState().showStatusToast(res.message);
    if (res.ok) setAdminReason('');
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-950/80 via-slate-900 to-emerald-950/60 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Kinh Tế & Tùy Chỉnh Nhân Vật (Phase 6 — Economy Ledger)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{coinBalance.toLocaleString('vi-VN')} Coin</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sổ cái giao dịch Idempotency, Cửa hàng 5 Slot (Áo, Quần, Tóc, Phụ kiện, Emote), Nhiệm vụ chống farm & Admin Audit
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 px-6 py-2.5 bg-slate-950/80 border-b border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTab('shop')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 ${
              tab === 'shop'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Shop & Catalog</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('loadout')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 ${
              tab === 'loadout'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Kho Đồ & Loadout ({ownedItemIds.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('quests')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 ${
              tab === 'quests'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Nhiệm Vụ & Thưởng</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('ledger')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 ${
              tab === 'ledger'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Lịch Sử Ví ({transactions.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('admin')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 ${
              tab === 'admin'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Admin Audit</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-4">
          {tab === 'shop' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'top', 'bottom', 'hair', 'accessory', 'emote'] as const).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                        selectedCategory === cat
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {cat.toUpperCase()}
                    </button>
                  )
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredCatalog.map((item) => {
                  const isOwned = ownedItemIds.includes(item.id);
                  const isEquipped =
                    equippedLoadout[item.category] === item.id;
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl border border-slate-700 shrink-0"
                          style={{
                            backgroundColor: item.colorHex
                              ? `${item.colorHex}33`
                              : '#1e293b',
                          }}
                        >
                          {item.previewBadge}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">
                              {item.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-semibold">
                              {item.rarity}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {item.description}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1 font-mono">
                            Slot: {item.category.toUpperCase()} • Asset:{' '}
                            {item.assetKey}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <span className="text-xs font-bold text-amber-400">
                          {item.priceCoins} Coin
                        </span>
                        {isOwned ? (
                          <button
                            type="button"
                            onClick={() => equipLoadoutItem(item.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                              isEquipped
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            }`}
                          >
                            {isEquipped ? 'Đang trang bị' : 'Trang bị ngay'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!item.active}
                            onClick={() => handleBuy(item.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${
                              item.active
                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {item.active ? 'Mua vật phẩm' : 'Ngừng bán'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'loadout' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <h3 className="text-xs font-bold uppercase text-amber-400 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Các Slot Trang Bị Hiện Tại (Fallback 3D An Toàn)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  {(['top', 'bottom', 'hair', 'accessory', 'emote'] as const).map(
                    (slot) => {
                      const equippedId = equippedLoadout[slot];
                      const item = catalog.find((c) => c.id === equippedId);
                      return (
                        <div
                          key={slot}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-2 text-xs"
                        >
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">
                              Slot: {slot}
                            </p>
                            <p className="font-semibold text-white mt-1">
                              {item
                                ? `${item.previewBadge} ${item.name}`
                                : 'Mặc định (Fallback)'}
                            </p>
                          </div>
                          {item && (
                            <button
                              type="button"
                              onClick={() => unequipLoadoutSlot(slot)}
                              className="px-2 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-200 text-[11px] font-semibold"
                            >
                              Tháo trang bị
                            </button>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'quests' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Hệ thống phần thưởng có giới hạn theo ngày và thời gian chờ (Cooldown) để chống spam/farm coin:
              </p>
              {quests.map((q) => {
                const isMaxed = q.claimedToday >= q.dailyLimit;
                return (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {q.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                          +{q.rewardCoins} Coin
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {q.description}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Đã nhận hôm nay: {q.claimedToday}/{q.dailyLimit} • Cooldown:{' '}
                        {q.cooldownSec}s
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isMaxed}
                      onClick={() => handleClaimQuest(q.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                        isMaxed
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isMaxed ? 'Đã hết lượt ngày' : 'Nhận thưởng'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'ledger' && (
            <div className="space-y-2.5">
              <p className="text-xs text-slate-400">
                Sổ cái giao dịch bất biến (Immutable Wallet Ledger) kèm mã Idempotency chống trừ tiền 2 lần:
              </p>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-white">{tx.reason}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        ID: {tx.id} • Key: {tx.idempotencyKey} • Loại: {tx.type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} Coin
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Số dư: {tx.balanceAfter} Coin
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'admin' && (
            <div className="space-y-4 text-xs">
              <form
                onSubmit={handleAdminAdjust}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
              >
                <h4 className="font-bold text-amber-400 uppercase">
                  Công cụ Admin điều chỉnh Coin (Bắt buộc ghi Audit Log)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="number"
                    value={adminDelta}
                    onChange={(e) => setAdminDelta(Number(e.target.value))}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    placeholder="Số lượng Coin (+/-)"
                  />
                  <input
                    type="text"
                    required
                    value={adminReason}
                    onChange={(e) => setAdminReason(e.target.value)}
                    className="sm:col-span-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    placeholder="Nhập lý do điều chỉnh (Bắt buộc lưu vào Audit Log)..."
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Thực thi & Ghi Audit Log
                </button>
              </form>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-sky-400 uppercase">
                  Quản trị trạng thái bán Catalog
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {catalog.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800"
                    >
                      <span>
                        {c.previewBadge} {c.name}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          adminToggleCatalogActive(
                            c.id,
                            'Admin bật/tắt trạng thái bán'
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          c.active
                            ? 'bg-emerald-600/30 text-emerald-300'
                            : 'bg-rose-600/30 text-rose-300'
                        }`}
                      >
                        {c.active ? 'Đang bán' : 'Đã ẩn'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-slate-300 uppercase">
                  Nhật ký Kiểm toán (Admin Audit Log)
                </h4>
                <div className="max-h-36 overflow-y-auto font-mono text-[10px] text-slate-400 space-y-1">
                  {auditLogs.map((log, i) => (
                    <p key={i}>{log}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

