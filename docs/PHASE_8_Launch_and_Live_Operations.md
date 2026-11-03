# ROAD MATE — PHASE 8
## Launch & Live Operations

**Mục tiêu:** Phát hành Roadmate có kiểm soát, thu hút nhóm người chơi đầu tiên, vận hành cộng đồng an toàn và cập nhật nội dung dựa trên dữ liệu thực tế.

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
- Theo dõi crash, latency, tỷ lệ hoàn thành onboarding.
- Ưu tiên sửa lỗi và cải thiện trải nghiệm cốt lõi.

### Stage C — Open Beta
- Mở đăng ký rộng hơn theo năng lực server.
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

Chỉ số gợi ý:
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

Không tối ưu chỉ số bằng cách gây nghiện, ép tương tác hoặc làm khó người dùng rời game. Đặt ngưỡng cảnh báo và mục tiêu sau khi có baseline thực tế.

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
- Form gửi lỗi/feedback.
- Mã ticket hỗ trợ.
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

- [ ] Có landing page và hướng dẫn bắt đầu.
- [ ] Onboarding giúp người mới vào được chuyến xe.
- [ ] Có Terms, Privacy Policy và Community Guidelines phù hợp.
- [ ] Có kênh support và quy trình xử lý ticket.
- [ ] Có moderator và quy trình report/appeal.
- [ ] Closed alpha đã được kiểm thử và tổng hợp feedback.
- [ ] Open beta có giới hạn vận hành và kênh thông báo.
- [ ] Analytics có consent/chính sách phù hợp và không thu thập quá mức.
- [ ] Có release notes, feature flags và rollback plan.
- [ ] Có lịch nội dung/sự kiện ban đầu.
- [ ] Có quy trình xử lý sự cố và thông báo bảo trì.
- [ ] Có báo cáo sau launch và backlog cải tiến.

## 12. Prompt giao cho AI code

Hãy triển khai Phase 8 của Roadmate dựa trên codebase và hạ tầng đã hoàn thiện ở Phase 7.

Tập trung vào các hạng mục sản phẩm có thể triển khai trong codebase: onboarding, landing page, FAQ, in-game announcements, support/feedback flow, feature flags, release notes và analytics events tối thiểu.

Không tự ý viết hoặc tuyên bố các tài liệu pháp lý đã được tư vấn pháp lý. Tạo bản nháp Terms, Privacy và Community Guidelines nếu được yêu cầu, đồng thời đánh dấu cần rà soát chuyên môn trước khi công bố.

Không thêm tracking xâm phạm quyền riêng tư. Chỉ ghi nhận event cần thiết, không đưa nội dung chat riêng hoặc thông tin nhạy cảm vào analytics.

Chuẩn bị các checklist internal test, closed alpha, open beta và release 1.0. Kiểm tra feature flag, maintenance mode, thông báo và rollback. Cập nhật README/runbook và báo cáo những việc cần con người thực hiện ngoài code, như moderation, hỗ trợ người chơi và trực vận hành.
