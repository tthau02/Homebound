# Virtual Bus 3D

Trò chơi mô phỏng xe khách đường dài 3D trên trình duyệt. Toàn bộ ứng dụng chạy ở frontend bằng React, TypeScript, Three.js, React Three Fiber và Zustand. Multiplayer kết nối ngang hàng bằng PeerJS/WebRTC; không có backend riêng trong repository.

## Tính năng hiện có

- Xe khách 3D với nội thất, 28 ghế, nhân vật tương tác và ba camera.
- Cảnh đường quê Việt Nam chuyển động, ngày/đêm, chất lượng đồ họa.
- Hai tuyến mẫu: TP.HCM–Cần Thơ và TP.HCM–Đà Lạt, có danh sách trạm.
- Phòng multiplayer P2P, đồng bộ nhân vật/ghế/chat/chuyến xe/nhạc.
- Hồ sơ người chơi với giới thiệu/sở thích và tùy chọn ẩn, lời mời kết bạn trong room.
- Private chat gửi riêng cho hai bên, block/report, và matchmaking opt-in yêu cầu cả hai chấp nhận.
- Tại trạm: hành khách có thể xuống xe, đi bộ trong khu vực giới hạn, check-in ở khung ảnh và quay lại xe.
- Host P2P quản lý trạng thái phòng, điểm dừng, thời tiết và các thao tác multiplayer.
- Shop cosmetic P2P với coin demo, inventory, mua/trang bị/tháo avatar hoặc màu áo; host kiểm tra giao dịch trong room.
- Hướng dẫn người chơi, FAQ, release notes và xuất tệp góp ý không gửi dữ liệu tự động.

## Chạy ứng dụng

```bash
npm install
npm run dev
```

Mở URL Vite trên trình duyệt. Để thử P2P, đăng nhập ở hai cửa sổ/trình duyệt, tham gia cùng mã phòng và chia sẻ mã đó với người chơi khác. Không cần PostgreSQL, Docker hay tiến trình backend.

## Kiểm tra

```bash
npm run lint
npm run build
```

GitHub Actions chạy lint/type-check và production build trên mỗi push/pull request qua `.github/workflows/frontend-ci.yml`.

## Cấu trúc

- `src/game/`: scene 3D, xe, nhân vật, camera, môi trường và trạm dừng.
- `src/components/`: HUD và các bảng tương tác multiplayer.
- `src/stores/`: trạng thái game, nhân vật, ghế, chat và kết nối P2P.
- `src/services/p2pBusNetwork.ts`: tài khoản demo phía trình duyệt, PeerJS/WebRTC, host room và đồng bộ P2P.
- `packages/shared/`: kiểu dữ liệu, tuyến mẫu và cấu hình dùng chung giữa các module frontend.
- `docs/PHASE_4_World_and_Gameplay_Expansion.md` đến `docs/PHASE_8_Launch_and_Live_Operations.md`: phạm vi, triển khai và giới hạn theo từng phase.
- [Hướng dẫn người chơi](docs/PLAYER_GUIDE.md) · [Release notes](docs/RELEASE_NOTES.md).

## Multiplayer P2P

Một peer giữ vai trò host và xử lý trạng thái chuyến xe; các peer khác gửi thao tác và nhận state snapshot. PeerJS cung cấp signaling để thiết lập kết nối WebRTC, còn BroadcastChannel hỗ trợ các tab cùng trình duyệt. Mã phòng cần được chia sẻ trực tiếp để người chơi ở thiết bị khác tham gia.

Tài khoản demo được tạo trong localStorage của trình duyệt. Dữ liệu tài khoản và phòng không phải dịch vụ tài khoản hay lưu trữ dùng chung giữa các thiết bị; trạng thái authoritative của room nằm trên peer host đang chạy.

Bạn bè, block và hồ sơ lưu ở localStorage theo tài khoản trình duyệt. Lời mời kết bạn và matchmaking chỉ hoạt động giữa người cùng room; report metadata chỉ tồn tại trong bộ nhớ host của phiên hiện tại. Host rời phòng sẽ kết thúc room và các lời mời đang chờ.

Ví coin demo và inventory cosmetic cũng lưu trong localStorage trên trình duyệt hiện tại, không đồng bộ giữa thiết bị. Host xác nhận giao dịch trong room nhưng không phải authority bảo mật như backend tin cậy; không có ledger giao dịch hay thanh toán tiền thật.
