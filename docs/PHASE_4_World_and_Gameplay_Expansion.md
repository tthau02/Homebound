# ROAD MATE — PHASE 4
## World & Gameplay Expansion

**Mục tiêu:** Mở rộng prototype xe bus thành thế giới có nhiều tuyến đường, trạm dừng và hoạt động có thể tham gia. Ưu tiên một tuyến mẫu hoàn chỉnh trước khi xây nhiều bản đồ.

## 1. Phạm vi

### Trong phạm vi
- Hệ thống bản đồ và tuyến đường.
- Các đoạn đường có thể ghép nối, cảnh quan hai bên đường.
- Trạm đón/trả khách và trạm nghỉ.
- Trạng thái hành trình: chuẩn bị, khởi hành, đang chạy, dừng trạm, kết thúc.
- Hoạt động tại trạm: xuống xe, đi lại trong khu vực, trò chuyện, chụp ảnh.
- Chu kỳ ngày/đêm và thời tiết cơ bản.
- UI hiển thị tuyến, trạm kế tiếp và tiến trình hành trình.

### Chưa làm
- Thế giới mở không giới hạn.
- Lái xe vật lý phức tạp.
- Nhiều phương tiện giao thông AI.
- Bản đồ địa lý Việt Nam chính xác.
- Hoạt động kinh tế hoặc nhiệm vụ phức tạp.

## 2. Trải nghiệm người chơi

1. Người chơi tham gia một phòng/chuyến xe.
2. Xe khởi hành từ bến.
3. Người chơi xem tên tuyến và trạm tiếp theo.
4. Xe di chuyển qua cảnh quan.
5. Khi đến trạm, xe dừng và phát thông báo.
6. Người chơi được phép xuống xe trong khu vực trạm.
7. Người chơi có thể trò chuyện, khám phá một số điểm tương tác.
8. Đến giờ, người chơi lên xe và hành trình tiếp tục.

## 3. Các module

### 3.1 Route & Map
- Route có ID, tên, điểm đầu, điểm cuối và danh sách stop theo thứ tự.
- Mỗi route tham chiếu các map segment hoặc scene asset.
- Dùng tọa độ/waypoint thống nhất giữa xe, camera và điểm dừng.
- Tách dữ liệu tuyến khỏi code để có thể thêm tuyến mới bằng cấu hình.

Ví dụ kiểu dữ liệu:
```ts
interface RouteDefinition {
  id: string;
  name: string;
  originStopId: string;
  destinationStopId: string;
  stopIds: string[];
  segmentIds: string[];
}

interface RouteStop {
  id: string;
  name: string;
  order: number;
  waypointId: string;
  dwellSeconds: number;
}
```

### 3.2 Journey State (P2P)
- Peer host của phòng là nguồn dữ liệu chuẩn cho trạng thái chuyến xe; các peer khác không tự quyết định xe đã đến trạm.
- Host kiểm tra vai trò tài xế/phụ xe, cập nhật trạm hiện tại và phát room snapshot qua PeerJS/WebRTC.
- Đồng bộ trạng thái hành trình, thời tiết và thời điểm cập nhật trong snapshot.
- Nếu host rời phòng, cần thông báo rõ trạng thái kết nối; không giả vờ có backend để khôi phục room authoritative.

### 3.3 Environment
- Tạo các đoạn đường tái sử dụng.
- Cảnh quan theo chủ đề: ngoại ô, làng quê, thị trấn, đồng ruộng.
- Dùng LOD, instancing và texture tối ưu cho vật thể lặp.
- Tạo điểm mốc dễ nhận biết tại mỗi trạm.
- Cảnh quan chuyển động phải nhất quán với hướng và tốc độ hành trình.

### 3.4 Stop Area
- Mỗi trạm có vùng lên/xuống xe.
- Khi xe dừng, mở trạng thái cho phép xuống xe.
- Khi chuẩn bị chạy, cảnh báo người chơi quay lại xe.
- Có vùng giới hạn di chuyển và điểm spawn an toàn.
- Xử lý người chơi đang ở ngoài xe khi chuyến tiếp tục: nhắc quay lại, chờ trong thời gian quy định hoặc đưa về vị trí an toàn theo luật game.

### 3.5 Activities
MVP chỉ chọn 2–3 hoạt động:
- Đi bộ quanh trạm.
- Ngồi tại quán/cửa hàng dựng sẵn và trò chuyện.
- Chụp ảnh nhóm hoặc pose/emote.

Hoạt động phải có tương tác rõ ràng, không chỉ là vật thể trang trí.

### 3.6 Weather & Time
- Day/night theo thời gian của chuyến hoặc cấu hình phòng.
- Thời tiết MVP: nắng, nhiều mây, mưa nhẹ.
- Thời tiết ảnh hưởng ánh sáng/âm thanh/hiệu ứng, không làm giảm hiệu năng quá mức.
- Host chọn trạng thái thời tiết và phát trong room snapshot để mọi peer nhìn thấy giống nhau.

## 4. UI/UX
- Route progress: điểm đi, trạm hiện tại, trạm kế tiếp, điểm đến.
- Thông báo khi sắp đến trạm.
- Nút xuống xe khi đủ điều kiện.
- Đồng hồ đếm thời gian dừng.
- Nút quay lại xe.
- Hướng dẫn ngắn cho người chơi lần đầu.

## 5. Kiến trúc và cấu trúc code gợi ý

```text
src/
  game/
    environment/StopArea.tsx
    environment/WeatherEffects.tsx
    config/environmentConfig.ts
  stores/useMultiplayerStore.ts
  services/p2pBusNetwork.ts
packages/shared/src/index.ts
```

## 6. API và realtime events gợi ý

Room data lấy từ cấu hình tuyến frontend. Các peer gửi action packet qua PeerJS/WebRTC; host kiểm tra quyền và điều kiện chuyến xe rồi broadcast room snapshot. BroadcastChannel chỉ hỗ trợ các tab cùng origin, không thay signaling/WebRTC giữa các thiết bị.

Action packet tối thiểu: `JOURNEY` (start/pause/next-stop/weather), `DISEMBARK`, `RETURN_TO_BUS`, `MOVE` và `CHAT`. Host chỉ chấp nhận xuống xe khi journey ở trạng thái `AT_STOP`; khi chuyến chạy lại, host đưa người chơi còn ở trạm về xe.

## 7. Thứ tự triển khai

1. Kiểm tra lại route/journey/room hiện có ở Phase 3.
2. Chuẩn hóa mô hình Route, Stop, Journey trong shared frontend package.
3. Dùng route mẫu hiện có với các trạm và room state P2P.
4. Xây waypoint và chuyển động giữa các đoạn đường.
5. Xây một scene trạm nghỉ có thể xuống xe.
6. Đồng bộ trạng thái trạm qua PeerJS/WebRTC, với host room làm nguồn chuẩn.
7. Thêm hoạt động đi bộ và check-in tại trạm.
8. Thêm route HUD và thông báo.
9. Thêm ngày/đêm và thời tiết cơ bản.
10. Tối ưu tải asset và kiểm thử nhiều người chơi.

## 8. Tiêu chí nghiệm thu

- [ ] Có ít nhất một tuyến hoàn chỉnh với 3–4 trạm.
- [ ] Trạng thái chuyến xe được host P2P quản lý.
- [ ] Tất cả client trong phòng thấy cùng trạm và trạng thái hành trình.
- [ ] Xe dừng đúng waypoint và tiếp tục đúng thứ tự.
- [ ] Người chơi có thể xuống xe và quay lại xe.
- [ ] Không thể xuống xe khi xe đang chạy.
- [ ] Có ít nhất hai hoạt động tại trạm.
- [ ] HUD hiển thị trạm hiện tại và trạm kế tiếp.
- [ ] Có chế độ ngày/đêm và ít nhất một hiệu ứng thời tiết.
- [ ] Không phát sinh lỗi nghiêm trọng khi người chơi disconnect ở trạm.
- [ ] Production build thành công.

## 9. Prompt giao cho AI code

Bạn là Senior Game Developer. Hãy triển khai Phase 4 của Roadmate theo tài liệu này trong workspace hiện tại.

Trước tiên kiểm tra code Phase 1–3, xác định module nào đã có và đề xuất kế hoạch tích hợp. Không tạo lại dự án, không thay thế công nghệ hiện tại nếu không có lý do kỹ thuật rõ ràng.

Triển khai từng task nhỏ trên frontend hiện tại, dùng tuyến mẫu có các trạm và khu vực dừng có thể xuống xe. Peer host phải là nguồn dữ liệu chuẩn cho trạng thái hành trình và quyền lên/xuống xe. Không thêm backend hoặc Socket.IO; không làm nhiều bản đồ trước khi tuyến mẫu hoạt động ổn định.

Sau mỗi task, chạy typecheck, test phù hợp và build; sửa lỗi trước khi tiếp tục. Không đánh dấu tiêu chí nghiệm thu là hoàn thành nếu chưa kiểm thử được. Cập nhật README và báo cáo file đã thay đổi, cách chạy và phần còn thiếu.
