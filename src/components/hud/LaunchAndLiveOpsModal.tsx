import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Compass,
  FileText,
  Flag,
  HelpCircle,
  Rocket,
  Shield,
  Sparkles,
  X,
} from 'lucide-react';
import {
  SupportTicketItem,
  useLiveOpsStore,
} from '../../stores/useLiveOpsStore';
import { useInteractionStore } from '../../stores/useInteractionStore';

export const LaunchAndLiveOpsModal: React.FC = () => {
  const isModalOpen = useLiveOpsStore((s) => s.isModalOpen);
  const setModalOpen = useLiveOpsStore((s) => s.setModalOpen);
  const activeTab = useLiveOpsStore((s) => s.activeTab);
  const setActiveTab = useLiveOpsStore((s) => s.setActiveTab);

  const onboardingSteps = useLiveOpsStore((s) => s.onboardingSteps);
  const completeOnboardingStep = useLiveOpsStore(
    (s) => s.completeOnboardingStep
  );
  const events = useLiveOpsStore((s) => s.events);
  const activeEventId = useLiveOpsStore((s) => s.activeEventId);
  const activateLiveEvent = useLiveOpsStore((s) => s.activateLiveEvent);

  const supportTickets = useLiveOpsStore((s) => s.supportTickets);
  const submitSupportTicket = useLiveOpsStore((s) => s.submitSupportTicket);

  const moderationCases = useLiveOpsStore((s) => s.moderationCases);
  const submitModerationAppeal = useLiveOpsStore(
    (s) => s.submitModerationAppeal
  );

  const featureFlags = useLiveOpsStore((s) => s.featureFlags);
  const toggleFeatureFlag = useLiveOpsStore((s) => s.toggleFeatureFlag);

  const analytics = useLiveOpsStore((s) => s.analytics);
  const setAnalyticsConsent = useLiveOpsStore((s) => s.setAnalyticsConsent);

  const [ticketCategory, setTicketCategory] =
    useState<SupportTicketItem['category']>('Technical');
  const [ticketSummary, setTicketSummary] = useState('');
  const [appealNote, setAppealNote] = useState('');

  if (!isModalOpen) return null;

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const created = submitSupportTicket(ticketCategory, ticketSummary);
    if (created) {
      setTicketSummary('');
      useInteractionStore
        .getState()
        .showStatusToast(
          `Đã tạo phiếu hỗ trợ ${created.ticketId} (${created.priority})!`
        );
    }
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-amber-950/60 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 shadow-md">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  RoadMate LiveOps, Tân Thủ & Cộng Đồng (Phase 8 — v1.0)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Open Beta → v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Onboarding Tân thủ, Lịch sự kiện theo mùa, Hỗ trợ Ticket SLA, Kiểm duyệt & Kháng nghị, Feature Flags & Chính sách
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
            onClick={() => setActiveTab('onboarding')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${
              activeTab === 'onboarding'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Tân Thủ (Onboarding)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${
              activeTab === 'events'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Sự Kiện (Live Events)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('support')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${
              activeTab === 'support'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Hỗ Trợ & FAQ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('moderation')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${
              activeTab === 'moderation'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>An Toàn & Kháng Nghị</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('release')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${
              activeTab === 'release'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Feature Flags & KPI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('legal')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${
              activeTab === 'legal'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Điều Khoản & Quy Tắc</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[74vh] overflow-y-auto space-y-4 text-xs">
          {/* Tab 1: Onboarding */}
          {activeTab === 'onboarding' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-950 border border-emerald-500/30 space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Chào mừng lên chuyến xe RoadMate / Virtual Bus 3D!</span>
                </h3>
                <p className="text-slate-300">
                  Hoàn thành 4 bước làm quen ngắn gọn dưới đây để nắm vững cách điều khiển, chọn ghế và kết nối P2P cùng bạn bè:
                </p>
              </div>

              <div className="space-y-2.5">
                {onboardingSteps.map((st) => (
                  <div
                    key={st.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                      st.completed
                        ? 'bg-emerald-950/30 border-emerald-500/40'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-white">{st.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {st.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => completeOnboardingStep(st.id)}
                      className={`px-3.5 py-1.5 rounded-xl font-bold shrink-0 flex items-center gap-1 ${
                        st.completed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {st.completed ? 'Đã hoàn thành' : 'Đánh dấu xong'}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Live Events */}
          {activeTab === 'events' && (
            <div className="space-y-3">
              <p className="text-slate-400">
                Lịch sự kiện trực tuyến & theo mùa (Bấm <strong>Tham gia sự kiện</strong> để áp dụng ngay bối cảnh thời tiết, ngày/đêm và lộ trình chuyến xe):
              </p>
              {events.map((ev) => {
                const isActive = activeEventId === ev.id;
                return (
                  <div
                    key={ev.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="space-y-1 max-w-lg">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {ev.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                          {ev.seasonTag}
                        </span>
                      </div>
                      <p className="text-slate-300">{ev.description}</p>
                      <p className="text-[11px] text-slate-400">
                        ⏰ Khung giờ: <strong>{ev.windowLabel}</strong> • 🎁 Phần thưởng:{' '}
                        <strong className="text-emerald-300">
                          {ev.rewardLabel}
                        </strong>
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Điều kiện: {ev.condition}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => activateLiveEvent(ev.id)}
                      className={`px-4 py-2 rounded-xl font-bold ${
                        isActive
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950'
                      }`}
                    >
                      {isActive ? 'Đang tham gia' : 'Tham gia sự kiện →'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 3: Support & FAQ */}
          {activeTab === 'support' && (
            <div className="space-y-4">
              <form
                onSubmit={handleCreateTicket}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
              >
                <h4 className="font-bold text-amber-400 uppercase">
                  Gửi Báo Lỗi / Góp Ý / Yêu Cầu Hỗ Trợ (Tự động cấp Mã Ticket & SLA)
                </h4>
                <p className="text-[11px] text-slate-400">
                  🔒 Lưu ý an toàn: Đội ngũ hỗ trợ KHÔNG BAO GIỜ yêu cầu bạn cung cấp mật khẩu hay mã xác thực.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <select
                    value={ticketCategory}
                    onChange={(e) =>
                      setTicketCategory(
                        e.target.value as SupportTicketItem['category']
                      )
                    }
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="Technical">Lỗi kỹ thuật / 3D / P2P</option>
                    <option value="Safety_Moderation">
                      Báo cáo an toàn / Quấy rối (Khẩn cấp P1)
                    </option>
                    <option value="Account">Hồ sơ & Kho đồ</option>
                    <option value="Feedback">Góp ý tính năng mới</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={ticketSummary}
                    onChange={(e) => setTicketSummary(e.target.value)}
                    placeholder="Mô tả chi tiết vấn đề hoặc góp ý của bạn..."
                    className="sm:col-span-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                >
                  Gửi Ticket Hỗ Trợ
                </button>
              </form>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-300 uppercase">
                  Danh sách Ticket Hỗ trợ của bạn ({supportTickets.length})
                </h4>
                {supportTickets.map((t) => (
                  <div
                    key={t.ticketId}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-bold text-white">
                        {t.ticketId} — {t.summary}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Phân loại: {t.category} • Ưu tiên: {t.priority} •{' '}
                        {t.slaLabel}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Moderation & Appeals */}
          {activeTab === 'moderation' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-amber-400 uppercase">
                  Quy trình Kiểm duyệt & Kháng nghị Minh bạch
                </h4>
                <p className="text-slate-300">
                  Mọi báo cáo vi phạm được phân loại theo 3 cấp độ: <strong>Nhắc nhở (Warning)</strong> → <strong>Tạm khóa chat (Mute)</strong> → <strong>Cấm phòng (Room Ban)</strong>. Người kiểm duyệt chỉ xem nội dung bị báo cáo, tuyệt đối không tự ý truy cập dữ liệu riêng tư ngoài phạm vi.
                </p>
              </div>

              {moderationCases.map((mc) => (
                <div
                  key={mc.caseId}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">
                      Mã hồ sơ #{mc.caseId} • {mc.targetName}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                      {mc.violationLevel}
                    </span>
                  </div>
                  <p className="text-slate-400">Lý do: {mc.reason}</p>
                  <p className="text-[11px] text-sky-300">
                    Trạng thái khiếu nại: <strong>{mc.appealStatus}</strong>
                  </p>
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={appealNote}
                      onChange={(e) => setAppealNote(e.target.value)}
                      placeholder="Nhập nội dung giải trình / khiếu nại..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        submitModerationAppeal(mc.caseId, appealNote);
                        setAppealNote('');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold"
                    >
                      Gửi Khiếu Nại
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 5: Release Stages, Feature Flags & Privacy-Safe KPIs */}
          {activeTab === 'release' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <h4 className="font-bold text-emerald-400 uppercase">
                  Feature Flags & Chế độ Bảo trì (Live Release Gates)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(
                    Object.keys(featureFlags) as Array<keyof typeof featureFlags>
                  ).map((flagKey) => (
                    <div
                      key={flagKey}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800"
                    >
                      <span className="font-mono text-[11px] text-slate-200">
                        {flagKey}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleFeatureFlag(flagKey)}
                        className={`px-3 py-1 rounded-lg font-bold text-[10px] ${
                          featureFlags[flagKey]
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {featureFlags[flagKey] ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sky-400 uppercase">
                    Analytics Tôn Trọng Quyền Riêng Tư (Opt-in Consent)
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      setAnalyticsConsent(!analytics.consentGranted)
                    }
                    className={`px-3 py-1 rounded-lg font-bold text-[10px] ${
                      analytics.consentGranted
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    Consent: {analytics.consentGranted ? 'ĐỒNG Ý' : 'ĐÃ TẮT'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Không bao giờ ghi nhận nội dung chat riêng tư hay mật khẩu. Chỉ đếm sự kiện kích hoạt cơ bản khi bạn đồng ý:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-[10px] text-slate-400">Phiên Crash-Free</p>
                    <p className="text-sm font-bold text-emerald-400">
                      {analytics.crashFreeRatePercent}%
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-[10px] text-slate-400">Hoàn thành Tân thủ</p>
                    <p className="text-sm font-bold text-amber-300">
                      {onboardingSteps.filter((s) => s.completed).length}/
                      {onboardingSteps.length}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-[10px] text-slate-400">Lượt chọn ghế</p>
                    <p className="text-sm font-bold text-sky-300">
                      {analytics.seatSelectionsCount}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-[10px] text-slate-400">Phòng P2P tham gia</p>
                    <p className="text-sm font-bold text-purple-300">
                      {analytics.p2pRoomsJoinedCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Draft Legal, Privacy & Community Guidelines */}
          {activeTab === 'legal' && (
            <div className="space-y-3 text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-[11px]">
                ⚠️ <strong>Lưu ý Pháp lý (Legal Review Notice):</strong> Các tài liệu Điều khoản Sử dụng (Terms of Service), Chính sách Quyền riêng tư (Privacy Policy) và Quy tắc Cộng đồng dưới đây là <strong>bản dự thảo vận hành trong game (Draft)</strong> và cần được chuyên gia pháp lý rà soát theo thị trường phát hành trước khi thương mại hóa chính thức.
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <h4 className="font-bold text-white">
                  1. Quy tắc Cộng đồng (Community Guidelines)
                </h4>
                <p className="text-[11px] text-slate-400">
                  • Tôn trọng tất cả hành khách, tài xế và phụ xe trên chuyến đi. Nghiêm cấm ngôn từ kích động thù địch, quấy rối hoặc spam chat.
                  <br />• Sử dụng nút Chặn (Block) hoặc Báo cáo (Report) ngay trên menu tương tác nhân vật khi gặp hành vi không phù hợp.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <h4 className="font-bold text-white">
                  2. Chính sách Quyền riêng tư (Privacy Policy — Bản nháp P2P)
                </h4>
                <p className="text-[11px] text-slate-400">
                  • Ở chế độ P2P WebRTC (PeerJS), trình duyệt của bạn kết nối trực tiếp với các thành viên cùng Mã Chuyến Xe (địa chỉ IP có thể hiển thị giữa các peer WebRTC theo giao thức chuẩn).
                  <br />• Dữ liệu hồ sơ demo, kho đồ và cài đặt được lưu cục bộ trên `localStorage` của trình duyệt và bạn có thể xóa bất cứ lúc nào.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <h4 className="font-bold text-white">
                  3. Điều khoản Dịch vụ (Terms of Service — Bản nháp)
                </h4>
                <p className="text-[11px] text-slate-400">
                  • Coin và vật phẩm trang trí trong game là tiền ảo mô phỏng phục vụ trải nghiệm giải trí, không có giá trị quy đổi thành tiền mặt và không mang lại lợi thế thắng thua (No Pay-to-Win).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

