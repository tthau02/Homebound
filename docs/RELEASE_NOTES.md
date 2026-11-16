# Release notes

## Virtual Bus 3D 0.4.0 — Phase 9

- **Camera 360°**: xoay tự do quanh nhân vật/xe bằng kéo chuột, chuột phải, pointer-lock (`V`) hoặc cảm ứng; zoom bằng con lăn/pinch; camera trong xe không xuyên vách; WASD đi theo hướng camera.
- **Đồ hoạ mới**: bầu trời khí quyển, environment map dựng trong scene (không tải HDRI), tone mapping Neutral, hậu kỳ theo mức chất lượng (SMAA, Bloom, N8AO, Vignette), texture đường/cỏ/sỏi procedural cuộn theo tốc độ, gió lay cây.
- **Bản đồ theo tuyến**: cảnh sinh theo chunk 100 m bằng seed, đổi vùng theo km thật của tuyến Bình Lục → Mỹ Đình (làng quê, Phủ Lý, cao tốc Pháp Vân – Cầu Giẽ, ngoại thành, nội đô); địa danh: cầu sông Đáy, biển cao tốc, trạm thu phí Đại Xuyên, đường chân trời Hà Nội; tầm nhìn tới ~600 m.
- **Nhân vật stylized**: cel-shading, tóc theo kiểu, phụ kiện (nón lá, kính, mũ, balo), chớp mắt, miệng khi nói, quay đầu nhìn người chơi; material dùng chung giúp giảm draw call.
- **HUD mới**: bố cục tối giản, thanh tiến trình tuyến, menu hợp nhất (`Esc`), font Be Vietnam Pro, chữ tối thiểu 12px.
- **Cốt truyện**: Chương 1 "Lên phố" với hội thoại có lựa chọn, nhiệm vụ chính/phụ, cảnh quay, nhật ký và 3 kết thúc; thưởng xu một lần cho mỗi cột mốc.
- Hành trình offline dài hơn (~5,5 phút lái + thời gian dừng trạm) để cảnh và cốt truyện có thời gian thể hiện.

### Giới hạn đã biết

- Xe và nhân vật vẫn dựng bằng hình khối procedural; chưa có mô hình `.glb` dựng bằng Blender hay texture ảnh chụp.
- Cốt truyện chỉ chạy ở chế độ chơi đơn; trong phòng P2P bị tắt.
- Cảnh vật sinh theo seed cục bộ nên các peer có thể thấy bố cục khác nhau đôi chút.
- Tuyến online (TP.HCM – Cần Thơ / Đà Lạt) dùng vòng biome chung thay vì cảnh riêng.

## Virtual Bus 3D 0.3.0

- Chuyến xe đường dài 3D với ba camera, nội thất tương tác và các tuyến mẫu.
- Multiplayer PeerJS/WebRTC với host room, đồng bộ ghế, di chuyển, chat, hành trình và nhạc.
- Trạm dừng có hoạt động xuống xe và quay lại.
- Công cụ hồ sơ, chat riêng, block/report và matchmaking opt-in trong room.
- Shop cosmetic coin demo, inventory và trang bị avatar/màu áo.
- Hướng dẫn người chơi, FAQ và xuất tệp góp ý cục bộ.
- Tải scene 3D theo chunk riêng; CI kiểm tra lint/type-check và production build.

### Giới hạn đã biết

- Tài khoản và dữ liệu local không được lưu trên server hay đồng bộ giữa thiết bị.
- Host rời phòng sẽ kết thúc room; chưa có reconnect vào state bền vững.
- Báo cáo moderation và matchmaking không có dịch vụ vận hành tập trung.
- Tệp góp ý không được gửi tự động.
- Coin chỉ là dữ liệu demo; không có thanh toán hoặc bảo đảm chống gian lận.
