export interface ReleaseNoteEntry {
  title: string;
  details: string;
}

export const RELEASE_NOTES: ReleaseNoteEntry[] = [
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
