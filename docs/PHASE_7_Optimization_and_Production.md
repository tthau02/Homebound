# ROAD MATE — PHASE 7
## Optimization & Production Readiness

**Mục tiêu:** Chuẩn bị frontend Virtual Bus 3D cho phát hành tĩnh, tối ưu tải/render và multiplayer P2P, có CI kiểm tra lặp lại được và mô tả đúng giới hạn vận hành.

> **Kiến trúc:** Không có backend, database hay Socket.IO. Room authority là host peer trong phiên; tài khoản lưu cục bộ. CI hiện chỉ kiểm tra type và production build. Không có server-side security, durable room recovery, monitoring tập trung hoặc backup dữ liệu người chơi.

## 1. Phạm vi

- Tối ưu render 3D và tải tài nguyên.
- Tối ưu mạng realtime.
- Đo hiệu năng trình duyệt và tải tài nguyên.
- Tối ưu mạng realtime P2P.
- Validate các action ở host và giới hạn payload/tần suất.
- CI cho type-check và production build; deploy static host được cấu hình riêng.
- Error reporting tuân thủ quyền riêng tư nếu được bổ sung.
- Kiểm thử trình duyệt, thiết bị và khả năng truy cập.
- Quy trình release và rollback.

## 2. Performance 3D

### Kiểm tra và tối ưu
- Đo FPS, frame time, draw calls, memory và thời gian tải.
- Dùng InstancedMesh cho vật thể lặp.
- Dùng LOD và frustum culling.
- Nén model/texture phù hợp (ví dụ glTF compression, KTX2 khi pipeline hỗ trợ).
- Lazy-load asset theo khu vực/camera.
- Giải phóng geometry, material, texture khi không còn sử dụng.
- Giới hạn shadow và post-processing theo cấu hình chất lượng.
- Có preset Low/Medium/High.
- Hỗ trợ giảm chất lượng trên thiết bị yếu.

### Mục tiêu kiểm thử đề xuất
- Khởi động game và vào phòng trong thời gian hợp lý trên mạng phổ thông.
- Duy trì frame time ổn định trên cấu hình mục tiêu.
- Không tăng bộ nhớ vô hạn khi đổi phòng/tuyến nhiều lần.
- Không tải asset của tất cả bản đồ cùng lúc.

Các ngưỡng FPS, dung lượng và thời gian tải phải được đo trên thiết bị mục tiêu rồi mới chốt thành SLO.

## 3. Network & Multiplayer Performance
- Đo số event/giây/người chơi.
- Gộp hoặc giới hạn update vị trí.
- Chỉ phát trạng thái cho thành viên cùng phòng.
- Nội suy/extrapolation có giới hạn.
- Kiểm soát kích thước payload.
- Backpressure và giới hạn tần suất.
- Reconnect có exponential backoff.
- Room state chỉ còn sống trên host peer; reconnect/room recovery từ server không áp dụng.
- Kiểm tra mất gói, latency và jitter.
- Không ghi vị trí từng frame vào PostgreSQL.

## 4. Client storage & P2P trust boundary
- Không thêm database, REST API, Socket.IO, backend, health endpoint hay backup server.
- localStorage dùng cho tài khoản demo và dữ liệu cục bộ; người dùng có thể sửa/xóa dữ liệu.
- Host peer kiểm tra thao tác trong room nhưng có thể bị sửa đổi; không dùng cho coin có giá trị thật hay dữ liệu nhạy cảm.
- Chỉ đưa public config vào build; không đặt secrets hoặc thông tin riêng tư trong frontend bundle.
- Trình duyệt cần dùng HTTPS trên static hosting để WebRTC và các browser API hoạt động đầy đủ.

## 5. Security
- Không có xác thực server-side. Tài khoản local chỉ phục vụ demo.
- Validate dữ liệu tại action boundary của host P2P.
- Giới hạn tần suất theo peer/room khi action có nguy cơ spam.
- Chống spam, payload quá lớn và event flooding.
- CORS/cookie không áp dụng khi không có API riêng.
- Bảo vệ XSS, injection và upload file độc hại.
- Kiểm tra quyền đọc private chat/profile.
- Không coi quyền trong client/host peer là quyền admin an toàn.
- Không ghi token, mật khẩu hoặc nội dung riêng tư vào log.
- Dependency scanning và cập nhật thư viện.
- Quy trình xử lý lỗ hổng và sự cố.

## 6. Testing Strategy

### Unit tests
- Seat allocation.
- Journey state machine.
- Permission rules.
- Wallet transaction.
- Matchmaking eligibility.
- Moderation/block rules.

### Integration tests
- P2P room isolation.
- Reconnect/disconnect.
- Concurrent seat selection.
- Purchase validation within a single host session.
- Private chat authorization.

### E2E tests
- Đăng nhập → vào phòng → chọn ghế → chat.
- Xuống trạm → quay lại xe.
- Kết bạn → nhắn riêng → block.
- Mua item → trang bị avatar.

### Load tests
- Tăng dần số phòng và số người chơi.
- Đo CPU, RAM, network, event latency và database connections.
- Xác định bottleneck trước khi scale.
- Không công bố sức chứa dựa trên ước lượng chưa kiểm thử.

## 7. Deployment & CI/CD

Môi trường:
- Local development.
- Staging.
- Production.

Pipeline:
1. Install dependencies.
2. Lint/type-check.
3. Build frontend.
4. Review dependency changes.
5. Deploy artifact lên static hosting qua workflow riêng.
6. Smoke test và rollback theo khả năng của nhà cung cấp static hosting.

Workflow `.github/workflows/frontend-ci.yml` hiện chạy `npm ci`, `npm run lint` và `npm run build` khi push/pull request. Chưa cấu hình nhà cung cấp deploy, staging, secret, release gate hay rollback tự động.

## 8. Observability & Operations
- CI log chỉ hiển thị kết quả build; runtime telemetry chưa được bật.
- Có thể theo dõi lỗi phía browser sau khi chọn provider và chính sách consent.
- Active rooms/peers hiện chỉ quan sát trong client; không có dashboard tập trung.
- Dữ liệu localStorage không có backup hoặc restore tự động.
- Runbook phải bao gồm signaling/WebRTC connectivity và cách báo lỗi từ client.
- Không thu thập dữ liệu cá nhân quá mức.

## 9. Cấu trúc phát hành gợi ý

```text
.github/workflows/frontend-ci.yml
dist/                         # static build artifact
docs/PHASE_7_Optimization_and_Production.md
```

## 10. Thứ tự triển khai

1. Định nghĩa thiết bị và mức tải mục tiêu.
2. Thiết lập baseline performance.
3. Tối ưu 3D và asset pipeline.
4. Tối ưu P2P/network theo profile đo được.
5. Rà soát trust boundary, input validation, privacy và dependency.
6. Cấu hình static host và deploy workflow sau khi chọn nhà cung cấp.
7. Chuẩn bị browser error reporting/telemetry nếu có consent và chính sách rõ ràng.
8. Chạy production readiness review cho đúng phạm vi frontend-only.

## 11. Tiêu chí nghiệm thu

- [ ] Có baseline và báo cáo hiệu năng trên thiết bị mục tiêu.
- [ ] Không có memory leak nghiêm trọng qua kiểm thử dài.
- [ ] Asset tải theo nhu cầu và có fallback.
- [x] P2P movement có throttle và host xử lý action trong phạm vi room.
- [ ] Các luồng ghế, ví, vé và quyền truy cập có test.
- [ ] Load test có báo cáo số phòng/người chơi và bottleneck.
- [x] CI chạy lint/type-check và build frontend.
- [ ] Có staging và production deploy config riêng.
- [ ] Secrets không nằm trong repository.
- [ ] Có runtime logging, metrics, error tracking và alert.
- [ ] Có backup/restore cho dữ liệu bền vững (hiện tại không có server data store).
- [ ] Có runbook, quy trình rollback và người chịu trách nhiệm.
- [ ] Không còn lỗi mức nghiêm trọng/cao chưa có phương án xử lý.

## 12. Prompt giao cho AI code

Hãy thực hiện Phase 7 trên codebase Virtual Bus frontend-only. Không giả định backend, database hay Socket.IO tồn tại. Không tối ưu theo cảm tính: trước tiên đo baseline trên browser/device mục tiêu và xác định bottleneck bằng công cụ phù hợp.

Kiểm tra frontend 3D, asset loading, PeerJS/WebRTC và local storage. Ưu tiên sửa vấn đề có bằng chứng đo được. Không đưa secrets vào bundle và không quảng bá host peer như server an toàn.

Thiết lập CI cho lint/build và cấu hình static deployment chỉ sau khi biết nhà cung cấp. Ghi rõ phần nào như server monitoring, health checks và backup không áp dụng với kiến trúc hiện tại.

Sau mỗi thay đổi chạy lint và build. Cung cấp báo cáo trước/sau, thiết bị và điều kiện đo, giới hạn còn lại và checklist production readiness. Không tuyên bố hệ thống sẵn sàng phát hành nếu chưa kiểm tra trên browser/device mục tiêu.
