export interface ReleaseNoteEntry {
  title: string;
  details: string;
}

export const RELEASE_NOTES: ReleaseNoteEntry[] = [
  {
    title: 'Phase 9: Hình ảnh & trải nghiệm mới',
    details:
      'Camera 360°, bầu trời và hậu kỳ mới, bản đồ đổi cảnh theo tuyến, nhân vật stylized, HUD tối giản với menu Esc và Chương 1 "Lên phố".',
  },
  {
    title: 'Chuyến đi và multiplayer P2P',
    details:
      'Tạo phòng PeerJS/WebRTC, đồng bộ hành khách, chat, ghế, tuyến và hoạt động tại trạm dừng.',
  },
  {
    title: 'Công cụ xã hội và an toàn',
    details:
      'Hồ sơ riêng tư, chat riêng, chặn/báo cáo và matchmaking opt-in trong cùng room.',
  },
  {
    title: 'Cá nhân hóa và trải nghiệm',
    details:
      'Shop cosmetic coin demo, giao diện hướng dẫn, FAQ và gửi góp ý bằng tệp tải xuống.',
  },
];
