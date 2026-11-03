# Release notes

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
