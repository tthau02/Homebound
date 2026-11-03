import React, { useState } from 'react';
import { BookOpen, Download, HelpCircle, X } from 'lucide-react';
import { APP_VERSION, FEATURE_FLAGS } from '../../config/featureFlags';
import { RELEASE_NOTES } from '../../config/releaseNotes';

type GuideTab = 'guide' | 'faq' | 'feedback' | 'updates';
const GUIDE_SEEN_KEY = 'virtual_bus_guide_seen_v1';

function hasSeenGuide(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(GUIDE_SEEN_KEY) === 'true';
  } catch {
    return true;
  }
}

export const PlayerGuideHub: React.FC = () => {
  const [isOpen, setIsOpen] = useState(() => !hasSeenGuide());
  const [activeTab, setActiveTab] = useState<GuideTab>('guide');
  const [feedbackCategory, setFeedbackCategory] = useState('Góp ý trải nghiệm');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState('');

  if (!FEATURE_FLAGS.playerGuide) return null;

  const closeGuide = () => {
    setIsOpen(false);
    try {
      window.localStorage.setItem(GUIDE_SEEN_KEY, 'true');
    } catch {
      // The guide remains available through the help button for this session.
    }
  };

  const downloadFeedback = () => {
    const message = feedbackText.trim();
    if (!message) {
      setFeedbackStatus('Hãy nhập nội dung trước khi tải góp ý.');
      return;
    }

    const content = [
      'Virtual Bus 3D — Góp ý người chơi',
      `Phiên bản: ${APP_VERSION}`,
      `Loại góp ý: ${feedbackCategory}`,
      `Thời gian: ${new Date().toISOString()}`,
      '',
      message,
      '',
      'Ghi chú: tệp này được tạo trên thiết bị của bạn và chưa được gửi đi.',
    ].join('\n');
    const blobUrl = URL.createObjectURL(
      new Blob([content], { type: 'text/plain;charset=utf-8' })
    );
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `virtual-bus-feedback-${Date.now()}.txt`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    setFeedbackStatus('Đã tải tệp góp ý. Bạn có thể đính kèm tệp khi liên hệ đội phát triển.');
  };

  const tabs: Array<{ id: GuideTab; label: string }> = [
    { id: 'guide', label: 'Bắt đầu' },
    { id: 'faq', label: 'FAQ' },
    ...(FEATURE_FLAGS.feedbackExport
      ? [{ id: 'feedback' as const, label: 'Góp ý' }]
      : []),
    ...(FEATURE_FLAGS.releaseNotes
      ? [{ id: 'updates' as const, label: 'Cập nhật' }]
      : []),
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Mở hướng dẫn và trợ giúp"
        className="pointer-events-auto fixed bottom-20 right-4 z-20 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/90 px-3 py-2 text-xs font-bold text-slate-100 shadow-xl hover:border-amber-400/60 hover:text-amber-200"
      >
        <HelpCircle className="h-4 w-4" />
        Trợ giúp
      </button>

      {isOpen && (
        <div className="pointer-events-auto fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="player-guide-title"
            className="flex max-h-[min(82vh,46rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-slate-100 shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div>
                <h2 id="player-guide-title" className="flex items-center gap-2 font-bold">
                  <BookOpen className="h-4 w-4 text-amber-400" />
                  Hướng dẫn Virtual Bus
                </h2>
                <p className="mt-0.5 text-[10px] text-slate-400">Phiên bản {APP_VERSION}</p>
              </div>
              <button
                type="button"
                aria-label="Đóng hướng dẫn"
                onClick={closeGuide}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <nav className="grid grid-cols-4 border-b border-slate-800 bg-slate-900/70">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2 py-2.5 text-xs font-semibold ${
                    activeTab === tab.id
                      ? 'border-b-2 border-amber-400 text-amber-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 text-sm leading-relaxed">
              {activeTab === 'guide' && (
                <>
                  <p className="text-slate-300">
                    Chào mừng bạn lên xe. Bạn có thể khám phá nội thất, ngồi ghế và tham gia chuyến đi cùng người khác.
                  </p>
                  <GuideCard title="Điều khiển">
                    <ul className="list-inside list-disc space-y-1 text-slate-300">
                      <li><kbd>W A S D</kbd> di chuyển; giữ <kbd>Shift</kbd> để đi nhanh.</li>
                      <li><kbd>Space</kbd> đứng dậy khỏi ghế; <kbd>E</kbd> tương tác với hành khách gần bạn.</li>
                      <li>Chọn một trong ba nút camera để đổi góc nhìn.</li>
                    </ul>
                  </GuideCard>
                  <GuideCard title="Vào chuyến P2P">
                    Mở “Bến Xe Multiplayer”, đăng nhập hoặc tạo tài khoản demo, rồi tạo phòng hoặc nhập mã phòng. Chia sẻ mã với bạn bè qua kênh riêng của bạn.
                  </GuideCard>
                  <GuideCard title="Trong chuyến đi">
                    Chọn ghế bằng cách nhấp vào ghế trống. Dùng Chat để trò chuyện; ở tab Trạm dừng, hành khách có thể xuống xe và quay lại khi chuyến đang dừng.
                  </GuideCard>
                  <p className="rounded-xl border border-sky-900/70 bg-sky-950/40 p-3 text-xs text-sky-200">
                    Multiplayer kết nối trực tiếp qua PeerJS/WebRTC. Room chỉ hoạt động khi host còn kết nối; dữ liệu tài khoản demo được lưu trên trình duyệt này.
                  </p>
                </>
              )}

              {activeTab === 'faq' && (
                <>
                  <GuideCard title="Bạn bè của tôi không vào được phòng?">
                    Hãy gửi đúng mã phòng và kiểm tra cả hai thiết bị có thể kết nối Internet/WebRTC. Host cần giữ tab đang chạy; room không được lưu trên máy chủ để khôi phục sau khi host rời.
                  </GuideCard>
                  <GuideCard title="Tài khoản có đồng bộ sang máy khác không?">
                    Không. Đây là tài khoản demo lưu trong localStorage của trình duyệt hiện tại. Xóa dữ liệu trình duyệt có thể làm mất tài khoản, coin và vật phẩm.
                  </GuideCard>
                  <GuideCard title="Shop dùng tiền thật không?">
                    Không. Coin chỉ là số liệu demo và cosmetic không có giá trị tiền mặt. Host room xác nhận giao dịch trong phiên nhưng không phải server chống gian lận.
                  </GuideCard>
                  <GuideCard title="Tôi có thể tắt hoặc đổi chất lượng đồ họa không?">
                    Dùng nút chất lượng Low/Medium/High ở góc trên bên phải. Low giảm độ phân giải render và tắt bóng.
                  </GuideCard>
                </>
              )}

              {activeTab === 'feedback' && FEATURE_FLAGS.feedbackExport && (
                <div className="space-y-3">
                  <p className="rounded-xl border border-amber-900/60 bg-amber-950/30 p-3 text-xs text-amber-100">
                    Góp ý được đóng gói thành tệp trên thiết bị của bạn. Tệp chưa được gửi tự động; đừng ghi mật khẩu hoặc thông tin nhạy cảm.
                  </p>
                  <label className="block space-y-1 text-xs text-slate-300">
                    Loại góp ý
                    <select
                      value={feedbackCategory}
                      onChange={(event) => setFeedbackCategory(event.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                    >
                      <option>Góp ý trải nghiệm</option>
                      <option>Báo lỗi kỹ thuật</option>
                      <option>An toàn và kiểm duyệt</option>
                    </select>
                  </label>
                  <label className="block space-y-1 text-xs text-slate-300">
                    Nội dung
                    <textarea
                      value={feedbackText}
                      onChange={(event) => setFeedbackText(event.target.value.slice(0, 2000))}
                      rows={5}
                      maxLength={2000}
                      placeholder="Mô tả điều đã xảy ra hoặc ý tưởng của bạn…"
                      className="w-full resize-y rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                    />
                  </label>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] text-slate-500">{feedbackText.length}/2000</span>
                    <button
                      type="button"
                      onClick={downloadFeedback}
                      className="flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Tải tệp góp ý
                    </button>
                  </div>
                  {feedbackStatus && <p role="status" className="text-xs text-emerald-300">{feedbackStatus}</p>}
                </div>
              )}

              {activeTab === 'updates' && FEATURE_FLAGS.releaseNotes && (
                <>
                  <p className="text-xs text-slate-400">Có trong phiên bản {APP_VERSION}</p>
                  {RELEASE_NOTES.map((entry) => (
                    <GuideCard key={entry.title} title={entry.title}>
                      {entry.details}
                    </GuideCard>
                  ))}
                </>
              )}
            </div>

            {activeTab === 'guide' && (
              <footer className="border-t border-slate-800 p-3 text-right">
                <button
                  type="button"
                  onClick={closeGuide}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
                >
                  Bắt đầu chuyến đi
                </button>
              </footer>
            )}
          </section>
        </div>
      )}
    </>
  );
};

const GuideCard: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <section className="space-y-1 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
    <h3 className="text-xs font-bold text-amber-200">{title}</h3>
    <div className="text-xs text-slate-300">{children}</div>
  </section>
);
