# VIRTUAL BUS — PHASE 8
## Launch & Live Operations

**Mục tiêu:** Phát hành Roadmate có kiểm soát, thu hút nhóm người chơi đầu tiên, vận hành cộng đồng an toàn và cập nhật nội dung dựa trên dữ liệu thực tế.

> **Phạm vi frontend-only hiện tại:** Không có backend, helpdesk, tài khoản tập trung, moderation team, analytics service hay live-ops server. Phase này cung cấp hướng dẫn/FAQ trong game, tệp góp ý do người chơi tự tải, feature flags build-time, release notes và checklist. Đây chưa phải quy trình vận hành alpha/beta đầy đủ.

### Đã có trong bản frontend
- Bảng hướng dẫn tự mở lần đầu, điều khiển, FAQ và nút trợ giúp mở lại.
- Góp ý được xuất thành tệp cục bộ; không upload hoặc gửi tự động.
- Release notes hiển thị trong game và có bản Markdown trong `docs/RELEASE_NOTES.md`.
- Các cờ tính năng frontend tập trung tại `src/config/featureFlags.ts`.
- Thông báo hành trình trong room đã được host phát tới các peer; không có global announcement service.

## 1. Phạm vi

- Closed alpha, open beta và launch.
- Landing page, onboarding và hướng dẫn.
- Chính sách, điều khoản và quy tắc cộng đồng.
- Hỗ trợ người chơi và xử lý báo cáo.
- Lịch sự kiện và cập nhật nội dung.
- Analytics sản phẩm có tôn trọng quyền riêng tư.
- Quản lý phiên bản, thông báo bảo trì.
- Quy trình phản hồi và roadmap sau phát hành.

## 2. Launch strategy

### Stage A — Internal test
- Nhóm phát triển kiểm tra luồng chính.
- Dùng tài khoản test và dữ liệu test.
- Xác nhận backup, monitoring và rollback.
- Kiểm tra report/block/moderation.

### Stage B — Closed Alpha
- Mời nhóm nhỏ người chơi.
- Giới hạn số phòng và thời gian thử.
- Có kênh nhận feedback.
- Thu thập feedback thủ công; telemetry tập trung chưa được bật.
- Ưu tiên sửa lỗi và cải thiện trải nghiệm cốt lõi.

### Stage C — Open Beta
- Chỉ mở rộng sau khi xác nhận giới hạn static host, signaling và WebRTC trên mạng mục tiêu.
- Công bố rõ đây là beta và các giới hạn.
- Có lịch bảo trì và trạng thái dịch vụ.
- Thử nghiệm sự kiện nhẹ.
- Điều chỉnh tutorial, matchmaking và quy tắc cộng đồng.

### Stage D — Version 1.0
- Chốt phạm vi tính năng ổn định.
- Hoàn thiện nội dung giới thiệu.
- Kiểm tra pháp lý/chính sách cần thiết theo thị trường phát hành.
- Có lịch hỗ trợ và trực sự cố.
- Phát hành theo đợt, theo dõi chỉ số sau release.

## 3. Onboarding & retention
- Trang giới thiệu game và hướng dẫn điều khiển.
- Tạo avatar nhanh.
- Giải thích cách vào chuyến xe và chọn ghế.
- Hướng dẫn chat, block và report.
- Gợi ý chuyến phù hợp nhưng không ép ghép cặp.
- Nhiệm vụ hướng dẫn ngắn, không gây áp lực.
- Thông báo có thể tùy chỉnh và tắt.

## 4. Community & moderation
- Quy tắc cộng đồng dễ tìm.
- Quy trình tiếp nhận report.
- Hàng đợi kiểm duyệt.
- Phân loại mức độ vi phạm.
- Cảnh cáo, mute, timeout, ban theo chính sách.
- Quy trình khiếu nại.
- Hướng dẫn moderator.
- Cơ chế khẩn cấp khi có đe dọa hoặc hành vi gây hại.
- Không để moderator tự ý xem dữ liệu riêng tư ngoài phạm vi cần thiết.

## 5. Live events & content calendar

Ý tưởng sự kiện:
- Chuyến xe cuối tuần.
- Chuyến ngắm cảnh đêm.
- Sự kiện Tết/Trung thu.
- Ngày hội kết bạn.
- Tuyến xe giới hạn theo mùa.
- Cuộc thi ảnh tại trạm nghỉ.

Mỗi event cần:
- Thời gian bắt đầu/kết thúc.
- Nội dung và phần thưởng.
- Điều kiện tham gia.
- Giới hạn chống farm.
- Thông báo trong game.
- Kế hoạch kiểm thử và rollback.

## 6. Analytics & KPIs

Chỉ thu thập dữ liệu cần thiết, minh bạch và theo chính sách quyền riêng tư.

Chỉ số gợi ý (chỉ bật nếu có consent, chính sách và nơi xử lý phù hợp):
- New registrations.
- Activation: tỷ lệ người mới vào được chuyến và hoàn thành hành động đầu tiên.
- Daily/weekly active users.
- Average session duration.
- Average players per room.
- Matchmaking acceptance rate.
- Chat/report/block rates.
- Crash-free sessions.
- Reconnect rate.
- Retention D1/D7/D30.

Hiện tại không có analytics instrumentation; không gửi event hoặc nội dung người chơi ra ngoài trình duyệt. Không tối ưu chỉ số bằng cách gây nghiện, ép tương tác hoặc làm khó người dùng rời game.

## 7. Release & content operations
- Versioning và release notes.
- Feature flags cho tính năng mới.
- Maintenance mode.
- In-game announcements.
- Lịch cập nhật.
- Quy trình hotfix.
- Kiểm thử tương thích dữ liệu trước/sau update.
- Rollback khi release gây lỗi.
- Lưu lại quyết định thay đổi quan trọng.

## 8. Support process
- FAQ và hướng dẫn.
- Tệp feedback người chơi tự tải xuống và gửi qua kênh hỗ trợ được công bố riêng.
- Mã ticket chỉ có thể cấp khi tổ chức chọn helpdesk bên ngoài.
- Phân loại lỗi kỹ thuật, tài khoản, thanh toán (nếu có), an toàn.
- SLA nội bộ theo mức độ ưu tiên.
- Thông báo tiến độ xử lý.
- Không yêu cầu người chơi gửi mật khẩu hoặc mã xác thực.

## 9. Tài liệu cần phát hành

- Landing page.
- User guide.
- FAQ.
- Terms of Service.
- Privacy Policy.
- Community Guidelines.
- Moderation Policy.
- Support/Contact page.
- Release notes.
- Status page hoặc kênh thông báo sự cố.

Hướng dẫn và release notes hiện đã có trong ứng dụng/docs. Các trang pháp lý, liên hệ hỗ trợ và status page chưa được tạo hoặc công bố vì cần chủ sở hữu, kênh liên hệ và review phù hợp.

Các tài liệu pháp lý cần được rà soát phù hợp với quốc gia và thị trường phát hành; không dùng mẫu chung mà không kiểm tra.

## 10. Thứ tự triển khai

1. Chốt đối tượng và thị trường phát hành.
2. Hoàn thiện landing page và onboarding.
3. Hoàn thiện điều khoản, privacy và community guidelines.
4. Chuẩn bị support và moderation.
5. Chạy internal test.
6. Mở closed alpha.
7. Tổng hợp feedback và sửa lỗi.
8. Mở open beta có giới hạn.
9. Theo dõi analytics và điều chỉnh.
10. Chuẩn bị release 1.0.
11. Phát hành theo đợt và theo dõi.
12. Thiết lập lịch live events và nội dung định kỳ.

## 11. Tiêu chí nghiệm thu

- [ ] Có website landing page công khai.
- [x] Có hướng dẫn bắt đầu và FAQ trong game.
- [ ] Onboarding được kiểm chứng với người chơi mới trên browser/device mục tiêu.
- [ ] Có Terms, Privacy Policy và Community Guidelines phù hợp.
- [ ] Có kênh support và quy trình xử lý ticket do chủ dự án cung cấp.
- [ ] Có moderator và quy trình report/appeal vận hành ngoài ứng dụng.
- [ ] Closed alpha đã được kiểm thử và tổng hợp feedback.
- [ ] Open beta có giới hạn vận hành và kênh thông báo.
- [x] Không có analytics tracking mặc định; hiện không thu thập product analytics.
- [x] Có release notes và feature flags build-time; deployment rollback chưa cấu hình.
- [ ] Có lịch nội dung/sự kiện ban đầu.
- [ ] Có quy trình xử lý sự cố và thông báo bảo trì.
- [ ] Có báo cáo sau launch và backlog cải tiến.

## 12. Prompt giao cho AI code

Hãy triển khai Phase 8 của Virtual Bus trên kiến trúc frontend-only/P2P; không giả định có backend hay hạ tầng moderation/support.

Tập trung vào onboarding, FAQ, thông báo trong room, feedback flow có consent, feature flags frontend, release notes và checklist launch. Không tự thêm analytics hoặc upload feedback. Landing page/support channel cần xác nhận tên miền/kênh liên hệ trước khi triển khai thật.

Không tự ý viết hoặc tuyên bố các tài liệu pháp lý đã được tư vấn pháp lý. Tạo bản nháp Terms, Privacy và Community Guidelines nếu được yêu cầu, đồng thời đánh dấu cần rà soát chuyên môn trước khi công bố.

Không thêm tracking xâm phạm quyền riêng tư. Chỉ ghi nhận event cần thiết, không đưa nội dung chat riêng hoặc thông tin nhạy cảm vào analytics.

Chuẩn bị checklist internal test, closed alpha, open beta và release 1.0. Kiểm tra feature flag và thông báo trong room; ghi rõ maintenance mode, telemetry, global announcements, moderation, ticket support, hosting và rollback cần dịch vụ/chủ sở hữu bên ngoài. Cập nhật README/runbook và báo cáo các việc con người phải thực hiện trước khi mở alpha.
