# ROAD MATE — PHASE 5
## Social & Dating System

**Mục tiêu:** Biến Roadmate thành không gian giao lưu có chủ đích: gặp người mới, kết bạn, trò chuyện riêng và ghép cặp tự nguyện. An toàn, quyền riêng tư và quyền từ chối là yêu cầu cốt lõi.

## 1. Phạm vi

### Trong phạm vi
- Hồ sơ người chơi và tùy chọn hiển thị.
- Danh sách bạn bè, lời mời kết bạn.
- Chat riêng 1-1.
- Ghép cặp ngẫu nhiên/tự nguyện.
- Tùy chọn sở thích và tiêu chí ghép cặp.
- Lời mời ngồi cạnh hoặc tham gia hoạt động.
- Chặn, bỏ qua, báo cáo và kiểm duyệt.
- Quyền riêng tư và trạng thái online.

### Chưa làm
- Video call.
- Chia sẻ vị trí đời thực.
- Hẹn hò ngoài đời hoặc xác minh danh tính nâng cao.
- Thuật toán ghép cặp phức tạp dựa trên AI.
- Tự động tiết lộ thông tin cá nhân.

## 2. Nguyên tắc sản phẩm và an toàn

- Ghép cặp phải opt-in: người chơi chủ động bật chế độ tìm bạn.
- Có thể từ chối, bỏ qua, rời ghép cặp hoặc chặn bất cứ lúc nào.
- Không tiết lộ email, số điện thoại, vị trí chính xác hoặc dữ liệu nhạy cảm.
- Có giới hạn tuổi phù hợp với định hướng phát hành; nếu định vị là dating cho người trưởng thành, cần cơ chế age-gating và quy trình xử lý người chưa đủ tuổi.
- Không ghép người trưởng thành với người chưa thành niên trong chế độ hẹn hò.
- Có báo cáo, chặn, mute và xử lý vi phạm.
- Không dùng ảnh đại diện hoặc nội dung của người khác khi chưa có quyền.

## 3. Chức năng chi tiết

### 3.1 Player Profile
- Display name.
- Avatar/nhân vật.
- Bio ngắn.
- Sở thích do người chơi tự chọn.
- Ngôn ngữ.
- Trạng thái online/ẩn.
- Cài đặt ai được xem hồ sơ.
- Cài đặt ai được gửi tin nhắn/lời mời.

Không yêu cầu người chơi công khai thông tin đời thực.

### 3.2 Friends
- Gửi, chấp nhận, từ chối lời mời.
- Hủy lời mời đang chờ.
- Xóa bạn.
- Xem trạng thái online nếu người kia cho phép.
- Mời bạn vào cùng phòng/chuyến nếu còn chỗ.
- Chặn người dùng.

### 3.3 Private Chat
- Chat 1-1.
- Trạng thái gửi/đã nhận/đã đọc nếu phù hợp.
- Mute và block.
- Rate limit, giới hạn độ dài và chống spam.
- Báo cáo một tin nhắn.
- Lưu lịch sử theo chính sách retention rõ ràng.
- Chỉ hai bên được phép truy cập hội thoại, ngoài công cụ kiểm duyệt có kiểm soát theo chính sách.

### 3.4 Matchmaking
Luồng:
1. Người chơi bật “Tìm bạn đồng hành”.
2. Chọn mục đích: trò chuyện, kết bạn, cùng chơi.
3. Chọn sở thích chung và tùy chọn phù hợp.
4. Server đưa vào hàng chờ.
5. Ghép hai người thỏa điều kiện.
6. Hiển thị lời mời; cả hai phải chấp nhận.
7. Tạo phiên trò chuyện/phòng ghế cạnh nhau.
8. Có thể kết thúc, bỏ qua hoặc báo cáo.

Không ghép dựa trên thuộc tính nhạy cảm. Không hiển thị lý do từ chối cho bên còn lại ngoài thông báo chung.

### 3.5 Social Activities
- Mời ngồi cạnh.
- Mời đi dạo tại trạm.
- Gửi emote/quà miễn phí giới hạn.
- Chụp ảnh avatar nhóm.
- Mời nghe cùng playlist được cấp phép.

Mọi lời mời cần có nút chấp nhận/từ chối.

### 3.6 Safety & Moderation
- Block: ngăn chat, lời mời và ghép cặp.
- Mute: ẩn nội dung của người chơi.
- Report: chọn lý do và gửi bằng chứng cần thiết.
- Rate limit chat và lời mời.
- Bộ lọc spam/liên kết nguy hiểm.
- Công cụ moderator: xem report, xử lý cảnh cáo, timeout, ban.
- Audit log cho hành động quản trị.
- Cơ chế khiếu nại và chính sách xử lý rõ ràng.

## 4. Data model gợi ý

```ts
interface PlayerProfile {
  userId: string;
  displayName: string;
  bio?: string;
  interests: string[];
  visibility: "public" | "friends" | "private";
  onlineStatusVisible: boolean;
}

interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
}

interface MatchPreference {
  userId: string;
  enabled: boolean;
  intent: "chat" | "friendship" | "play";
  interests: string[];
}

interface UserBlock {
  blockerId: string;
  blockedId: string;
  createdAt: string;
}
```

Thiết kế schema thực tế cần unique constraints, indexes và kiểm tra quyền truy cập phía server.

## 5. API và Socket events gợi ý

REST:
- `GET/PATCH /profile`
- `POST /friends/requests`
- `POST /friends/requests/:id/accept`
- `DELETE /friends/:userId`
- `GET /friends`
- `POST /users/:id/block`
- `POST /reports`

Socket:
- `private-chat:send`
- `private-chat:message`
- `matchmaking:join`
- `matchmaking:leave`
- `matchmaking:offer`
- `matchmaking:accept`
- `matchmaking:decline`
- `social:invite`
- `social:invite-response`

Server phải kiểm tra danh tính, block list, quyền truy cập hội thoại và trạng thái ghép cặp.

## 6. UI/UX
- Profile drawer/page.
- Friends panel.
- Chat inbox.
- Private chat window.
- Matchmaking preferences.
- Match found screen có Accept/Decline.
- Block/Report menu dễ tìm.
- Privacy settings.
- Safety center và quy tắc cộng đồng.

## 7. Cấu trúc code gợi ý

```text
apps/
  web/src/features/
    profile/
    friends/
    private-chat/
    matchmaking/
    social-invites/
    safety/
  server/src/
    profiles/
    friends/
    conversations/
    matchmaking/
    blocks/
    reports/
    moderation/
```

## 8. Thứ tự triển khai

1. Chốt đối tượng người chơi, độ tuổi mục tiêu và quy tắc cộng đồng.
2. Xây hồ sơ và cài đặt quyền riêng tư.
3. Xây block/mute/report trước khi mở dating.
4. Xây friend request và danh sách bạn.
5. Xây private chat và kiểm soát truy cập.
6. Xây matchmaking opt-in với hàng chờ đơn giản.
7. Thêm lời mời và xác nhận hai chiều.
8. Thêm hoạt động xã hội trong chuyến xe/trạm nghỉ.
9. Xây công cụ moderator và audit log.
10. Kiểm thử lạm dụng, spam, block và reconnect.

## 9. Tiêu chí nghiệm thu

- [ ] Người chơi sửa hồ sơ và quyền hiển thị.
- [ ] Gửi/chấp nhận/từ chối lời mời kết bạn.
- [ ] Chat riêng chỉ người có quyền truy cập xem được.
- [ ] Ghép cặp chỉ chạy khi người chơi chủ động bật.
- [ ] Cả hai bên phải chấp nhận lời mời ghép.
- [ ] Có thể từ chối/rời ghép cặp bất cứ lúc nào.
- [ ] Block ngăn chat và lời mời theo đúng chính sách.
- [ ] Có mute và report.
- [ ] Có rate limit và chống spam cơ bản.
- [ ] Moderator có thể xử lý report và có audit log.
- [ ] Không lộ dữ liệu cá nhân không cần thiết.
- [ ] Có kiểm thử quyền riêng tư và phân quyền.

## 10. Prompt giao cho AI code

Hãy triển khai Phase 5 của Roadmate dựa trên tài liệu này và codebase Phase 1–4 hiện tại. Trước khi code, kiểm tra mô hình User, PlayerProfile, Room, Chat và các module đã tồn tại; tái sử dụng thay vì tạo bản sao.

Ưu tiên privacy, consent và safety. Xây profile, friends, block/report trước; sau đó private chat; cuối cùng mới matchmaking opt-in. Mọi quyền truy cập phải được xác thực ở backend, không tin trạng thái do client gửi.

Không ghép cặp người dùng nếu họ chưa bật tìm bạn. Hai bên phải xác nhận trước khi tạo kết nối. Thêm test cho block, quyền xem hội thoại, spam và trường hợp disconnect.

Triển khai từng module, chạy migration, typecheck, test và build. Không đánh dấu hoàn thành nếu chưa kiểm thử. Cập nhật README, API/event documentation và báo cáo phần còn thiếu.
