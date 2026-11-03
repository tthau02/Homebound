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
4. Host đưa người chơi vào hàng chờ của room.
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

Trong bản frontend-only, profile cục bộ lưu trong localStorage; profile đặt private phải được host loại khỏi room snapshot. Block list lưu cục bộ và đồng bộ tới host khi người chơi vào room. Host chỉ giữ report metadata trong bộ nhớ của phiên.

## 5. P2P actions

Các peer gửi action qua `CLIENT_ACTION`; host kiểm tra room membership, block list và trạng thái ghép cặp trước khi gửi kết quả tới các peer liên quan.

- `PROFILE`: cập nhật bio, interests và visibility; host bỏ bio/interests khỏi snapshot khi profile đặt private.
- `FRIEND_REQUEST` / `FRIEND_RESPONSE`: lời mời kết bạn trong room hiện tại, cả hai bên phải xác nhận.
- `BLOCK` / `UNBLOCK`: host từ chối private chat và lời mời giữa hai bên đã block.
- `REPORT`: lưu lý do và ID người báo cáo/đối tượng trong bộ nhớ host; không đính kèm nội dung private chat.
- `CHAT`: public message gửi cả room; private message gửi riêng cho sender và recipient, không thêm vào room chat history.
- `MATCHMAKING`: peer phải bật opt-in; host chỉ ghép hai người cùng room đã bật và cả hai phải accept.

Không dùng REST hoặc Socket.IO. Dữ liệu friend, block, report và matchmaking không có đồng bộ toàn cục giữa các room.

## 6. UI/UX
- Profile editor trong social hub.
- Friend requests trong room.
- Chat inbox.
- Private chat window.
- Matchmaking preferences.
- Match found screen có Accept/Decline.
- Block/Report menu dễ tìm.
- Privacy settings.
- Report queue chỉ có trên host trong phiên hiện tại.

## 7. Cấu trúc code gợi ý

```text
src/
  components/hud/MultiplayerSocialHub.tsx
  services/p2pBusNetwork.ts
  stores/useMultiplayerStore.ts
packages/shared/src/index.ts
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

- [x] Người chơi sửa bio, sở thích và quyền hiển thị public/private.
- [x] Gửi/chấp nhận/từ chối lời mời kết bạn trong room.
- [x] Private chat chỉ gửi qua kết nối host tới sender/recipient, không vào room history.
- [x] Ghép cặp chỉ chạy khi người chơi chủ động bật.
- [x] Cả hai bên phải chấp nhận lời mời ghép.
- [x] Có thể từ chối lời mời; có thể tắt opt-in khi đang chờ.
- [x] Block ngăn private chat, lời mời kết bạn và matchmaking.
- [x] Có block/mute local, report metadata và giới hạn tần suất chat.
- [ ] Moderator có thể xử lý report và có audit log đầy đủ.
- [x] Snapshot không phát bio/sở thích của profile private; private chat không nằm trong room snapshot.
- [ ] Có kiểm thử quyền riêng tư và phân quyền.

Giới hạn của bản P2P: friend requests và matchmaking chỉ hoạt động khi hai người cùng room; report queue mất khi host rời; không có age-gate, audit log lâu dài hay kiểm duyệt xuyên room. Đây là social MVP cho prototype, chưa bao gồm vận hành dating/public community.

## 10. Prompt giao cho AI code

Hãy triển khai Phase 5 của Roadmate dựa trên tài liệu này và codebase Phase 1–4 hiện tại. Trước khi code, kiểm tra mô hình User, PlayerProfile, Room, Chat và các module đã tồn tại; tái sử dụng thay vì tạo bản sao.

Ưu tiên privacy, consent và safety trong kiến trúc frontend-only. Dùng host peer làm nguồn chuẩn trong room. Không thêm backend hay Socket.IO. Private message chỉ gửi cho hai bên; block phải được host áp dụng; matchmaking chỉ chạy khi cả hai tự opt-in và accept. Báo cáo chỉ giữ metadata trong phiên host và không chuyển private chat content.

Không ghép cặp người dùng nếu họ chưa bật tìm bạn. Hai bên phải xác nhận trước khi tạo kết nối. Thêm test cho block, quyền xem hội thoại, spam và trường hợp disconnect.

Triển khai từng module, chạy typecheck và build. Không thêm backend/migration. Cập nhật README, P2P action documentation và báo cáo rõ giới hạn về host trust, persistence, age-gating, moderation và kiểm thử.
