import React, { useState } from 'react';
import { BookOpen, Download, X } from 'lucide-react';
import { APP_VERSION, FEATURE_FLAGS } from '../../config/featureFlags';
import { RELEASE_NOTES } from '../../config/releaseNotes';
import { useGameStore } from '../../stores/useGameStore';

type GuideTab = 'guide' | 'faq' | 'feedback' | 'updates';

export const PlayerGuideHub: React.FC = () => {
  const isGuideOpen = useGameStore((s) => s.isGuideOpen);
  const setGuideOpen = useGameStore((s) => s.setGuideOpen);

  const [activeTab, setActiveTab] = useState<GuideTab>('guide');
  const [feedbackCategory, setFeedbackCategory] = useState('Góp ý trải nghiệm');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState('');

  if (!FEATURE_FLAGS.playerGuide || !isGuideOpen) return null;

  const closeGuide = () => {
    setGuideOpen(false);
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
                  ? 'border-b-2 border-amber-400 bg-slate-800/80 text-amber-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="overflow-y-auto p-4 text-xs leading-relaxed">
          {activeTab === 'guide' && (
            <div className="space-y-3">
              <GuideCard title="1. Di chuyển trong khoang xe">
                Sử dụng các phím <kbd className="rounded bg-slate-800 px-1 py-0.5 text-amber-300">W</kbd>{' '}
                <kbd className="rounded bg-slate-800 px-1 py-0.5 text-amber-300">A</kbd>{' '}
                <kbd className="rounded bg-slate-800 px-1 py-0.5 text-amber-300">S</kbd>{' '}
                <kbd className="rounded bg-slate-800 px-1 py-0.5 text-amber-300">D</kbd> để đi lại dọc lối đi.
                Giữ <kbd className="rounded bg-slate-800 px-1 py-0.5 text-amber-300">Shift</kbd> để đi nhanh hơn.
              </GuideCard>
              <GuideCard title="2. Tương tác ghế và hành khách">
                Nhấp chuột vào bất kỳ ghế trống nào để ngồi xuống. Khi đang ngồi, nhấn{' '}
                <kbd className="rounded bg-slate-800 px-1 py-0.5 text-amber-300">Space</kbd> để đứng dậy.
                Khi đến gần hành khách khác, nhấn <kbd className="rounded bg-slate-800 px-1 py-0.5 text-amber-300">E</kbd>{' '}
                hoặc nhấp chuột vào hành khách để mở menu tương tác.
              </GuideCard>
              <GuideCard title="3. Đổi góc nhìn & thời gian">
                Nhấn <kbd className="rounded bg-slate-800 px-1 py-0.5 text-amber-300">1</kbd> để nhìn trong cabin,{' '}
                <kbd className="rounded bg-slate-800 px-1 py-0.5 text-amber-300">2</kbd> góc nhìn toàn cảnh trên cao,{' '}
                <kbd className="rounded bg-slate-800 px-1 py-0.5 text-amber-300">3</kbd> góc nhìn bám đuôi xe.
                Nhấp nút Ngày/Đêm trên thanh công cụ để chuyển đổi ánh sáng.
              </GuideCard>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-3">
              <GuideCard title="Game có bị lag không?">
                Game được tối ưu render InstancedMesh và tự động hạ cấu hình nếu thiết bị yếu. Bạn có thể chủ động bấm nút
                đồ họa trên góc phải để đổi giữa High / Medium / Low.
              </GuideCard>
              <GuideCard title="Chế độ nhiều người chơi hoạt động ra sao?">
                Nhấp vào nút <span className="text-amber-300 font-semibold">Multiplayer</span> ở góc trên bên trái để tạo hoặc nhập mã phòng.
                Mọi người cùng phòng sẽ thấy nhau đi lại, chat bong bóng và tương tác thời gian thực.
              </GuideCard>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block font-semibold text-slate-300">Chủ đề góp ý</label>
                <select
                  value={feedbackCategory}
                  onChange={(e) => setFeedbackCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100"
                >
                  <option value="Góp ý trải nghiệm">Góp ý trải nghiệm</option>
                  <option value="Báo lỗi đồ họa">Báo lỗi đồ họa / mô hình</option>
                  <option value="Đề xuất tính năng">Đề xuất tính năng mới</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-300">Chi tiết phản hồi</label>
                <textarea
                  rows={4}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Mô tả cụ thể trải nghiệm hoặc ý kiến của bạn…"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-xs text-slate-100 placeholder-slate-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={downloadFeedback}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-slate-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  Lưu bản góp ý
                </button>
                {feedbackStatus && (
                  <span className="text-[11px] text-emerald-400">{feedbackStatus}</span>
                )}
              </div>
            </div>
          )}

          {activeTab === 'updates' && (
            <div className="space-y-3">
              {RELEASE_NOTES.map((item, index) => (
                <div key={index} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-200">
                    <span>{item.title}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-300">{item.details}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {activeTab === 'guide' && (
          <footer className="flex items-center justify-end border-t border-slate-800 bg-slate-900/60 px-4 py-2.5">
            <button
              type="button"
              onClick={closeGuide}
              className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
            >
              Đã hiểu & Bắt đầu
            </button>
          </footer>
        )}
      </section>
    </div>
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
