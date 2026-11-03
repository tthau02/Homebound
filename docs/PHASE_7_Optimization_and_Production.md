# ROAD MATE — PHASE 7
## Optimization & Production Readiness

**Mục tiêu:** Đưa Roadmate từ beta thành hệ thống có thể phát hành ổn định: hiệu năng tốt trên trình duyệt, backend an toàn, có kiểm thử, triển khai lặp lại được và có giám sát.

## 1. Phạm vi

- Tối ưu render 3D và tải tài nguyên.
- Tối ưu mạng realtime.
- Kiểm thử tải backend/socket.
- Bảo mật API, Socket.IO và dữ liệu.
- CI/CD và môi trường staging/production.
- Logging, metrics, error tracking.
- Backup/restore và kế hoạch khôi phục.
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
- Phục hồi room state từ server.
- Kiểm tra mất gói, latency và jitter.
- Không ghi vị trí từng frame vào PostgreSQL.

## 4. Backend & Database
- Index cho truy vấn phòng, thành viên, hội thoại và giao dịch.
- Pagination cho danh sách và lịch sử.
- Connection pooling.
- Kiểm tra slow query.
- Transaction cho thao tác ghế, vé và ví.
- Giới hạn request và Socket event.
- Health/readiness endpoints.
- Tách cấu hình development/staging/production.
- Secrets chỉ lưu trong secret manager hoặc biến môi trường an toàn.

## 5. Security
- Xác thực và phân quyền server-side.
- Validate input ở mọi REST/Socket boundary.
- Rate limit theo IP/user/room phù hợp.
- Chống spam, payload quá lớn và event flooding.
- CORS và cookie/token policy đúng cấu hình.
- Bảo vệ XSS, injection và upload file độc hại.
- Kiểm tra quyền đọc private chat/profile.
- Kiểm tra quyền admin và audit log.
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
- REST + database.
- Socket room isolation.
- Reconnect/disconnect.
- Concurrent seat selection.
- Concurrent purchase.
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
2. Lint.
3. Typecheck.
4. Unit/integration tests.
5. Build frontend/backend.
6. Security/dependency checks.
7. Deploy staging.
8. Smoke test.
9. Manual approval hoặc release gate.
10. Deploy production.
11. Health check và rollback nếu lỗi.

Dùng Docker cho backend và dịch vụ phụ trợ. Frontend có thể deploy lên static hosting/CDN. Database migration phải có kế hoạch backup, tương thích ngược và rollback phù hợp.

## 8. Observability & Operations
- Centralized structured logs.
- Error tracking.
- Metrics CPU/RAM, latency, error rate, active rooms, connected sockets.
- Dashboard theo dõi.
- Alert khi lỗi tăng, server quá tải hoặc database mất kết nối.
- Health check.
- Backup tự động và kiểm tra restore định kỳ.
- Runbook cho sự cố phổ biến.
- Không thu thập dữ liệu cá nhân quá mức.

## 9. Cấu trúc hạ tầng gợi ý

```text
infra/
  docker/
  ci/
  monitoring/
  dashboards/
  alerts/
  scripts/
  runbooks/
docs/
  architecture/
  security/
  deployment/
  incident-response/
```

## 10. Thứ tự triển khai

1. Định nghĩa thiết bị và mức tải mục tiêu.
2. Thiết lập baseline performance.
3. Tối ưu 3D và asset pipeline.
4. Tối ưu Socket/network.
5. Tối ưu database.
6. Hoàn thiện security review.
7. Bổ sung unit/integration/E2E tests.
8. Thiết lập load test và chạy thử.
9. Thiết lập CI/CD staging.
10. Thiết lập monitoring, alert và backup.
11. Diễn tập restore/rollback.
12. Chạy production readiness review.

## 11. Tiêu chí nghiệm thu

- [ ] Có baseline và báo cáo hiệu năng trên thiết bị mục tiêu.
- [ ] Không có memory leak nghiêm trọng qua kiểm thử dài.
- [ ] Asset tải theo nhu cầu và có fallback.
- [ ] Socket event có giới hạn và room isolation.
- [ ] Các luồng ghế, ví, vé và quyền truy cập có test.
- [ ] Load test có báo cáo số phòng/người chơi và bottleneck.
- [ ] CI chạy lint, typecheck, test và build.
- [ ] Có staging và production config riêng.
- [ ] Secrets không nằm trong repository.
- [ ] Có logging, metrics, error tracking và alert.
- [ ] Backup và restore đã được diễn tập.
- [ ] Có runbook, quy trình rollback và người chịu trách nhiệm.
- [ ] Không còn lỗi mức nghiêm trọng/cao chưa có phương án xử lý.

## 12. Prompt giao cho AI code

Hãy thực hiện Phase 7 trên codebase Roadmate hiện tại. Không tối ưu theo cảm tính: trước tiên đo baseline và xác định bottleneck bằng công cụ phù hợp.

Kiểm tra frontend 3D, asset loading, Socket.IO, NestJS, PostgreSQL và Redis (nếu đã dùng). Ưu tiên sửa vấn đề có bằng chứng đo được. Bổ sung test cho các luồng quan trọng và load test có thể lặp lại.

Thiết lập CI/CD, staging, production configuration, health checks, logging, metrics, error tracking, backup và runbook. Không đưa secrets vào code hoặc log. Không chạy migration phá hủy dữ liệu production.

Sau mỗi thay đổi chạy test, typecheck và build. Cung cấp báo cáo trước/sau, thiết bị và điều kiện đo, kết quả load test, giới hạn còn lại và checklist production readiness. Không tuyên bố hệ thống sẵn sàng phát hành nếu còn lỗi nghiêm trọng chưa xử lý.
