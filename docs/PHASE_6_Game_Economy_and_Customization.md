# ROAD MATE — PHASE 6
## Game Economy & Customization

**Mục tiêu:** Cho phép người chơi cá nhân hóa avatar và trải nghiệm bằng tiền ảo/vật phẩm trong game, với kinh tế cân bằng, minh bạch và không pay-to-win.

> **Kiến trúc hiện tại:** Dự án chạy hoàn toàn ở frontend. Multiplayer dùng PeerJS/WebRTC; host của room kiểm tra giao dịch và phát state cho các peer. Đây là authority trong phiên chơi, không phải ranh giới bảo mật như backend tin cậy. Ví và kho đồ tài khoản demo lưu trong localStorage của từng trình duyệt.

### Phạm vi MVP đã triển khai
- Catalog cosmetic tĩnh gồm các avatar và màu áo, định giá bằng coin nội bộ.
- Host kiểm tra item, số dư và quyền sở hữu trước khi mua/trang bị/tháo.
- Số dư, inventory và cosmetic hiện tại được đồng bộ trong room; giao diện có ví và shop.
- Tài khoản demo lưu ví và inventory trên localStorage của trình duyệt.

### Chưa có trong MVP
- Wallet ledger/lịch sử giao dịch, reward nhiệm vụ, admin catalog, persistence giữa thiết bị và chống gian lận đáng tin cậy.
- Giao dịch an toàn trước host độc hại, giao dịch đồng thời nhiều room, idempotency bền vững hoặc quản trị catalog từ xa.
- Cosmetic 3D đầy đủ; MVP chỉ thay avatar hồ sơ và màu áo nhân vật.

## 1. Phạm vi

### Trong phạm vi
- Ví tiền ảo và lịch sử giao dịch.
- Phần thưởng từ hoạt động/nhiệm vụ.
- Cửa hàng vật phẩm.
- Kho đồ (inventory).
- Trang phục, tóc, phụ kiện và emote.
- Trang trí hồ sơ/ghế nếu phù hợp.
- Trang bị/tháo vật phẩm.
- Công cụ quản trị catalog và cấp/thu hồi vật phẩm.
- Kiểm soát gian lận giao dịch.

### Chưa làm
- Giao dịch vật phẩm giữa người chơi.
- Marketplace tự do.
- NFT/blockchain.
- Đổi tiền ảo thành tiền thật.
- Loot box trả phí hoặc cơ chế may rủi trả tiền.
- Thanh toán thật trước khi có chính sách pháp lý và vận hành rõ ràng.

## 2. Nguyên tắc kinh tế

- Tiền ảo không được tạo hoặc trừ ở client.
- Trong room, host P2P kiểm tra và thực thi giao dịch; mọi peer đều phải hiểu host có thể bị sửa đổi.
- Không xem localStorage hay host peer là kho dữ liệu tin cậy hoặc có thể kiểm toán.
- Không cho số dư âm.
- Mỗi thao tác mua phải từ catalog dùng chung và không nhận giá do client gửi.
- Phòng hiện tại không có ledger/idempotency key bền vững; retry sau khi host thay đổi có thể tạo trạng thái không đồng nhất.
- Không bán vật phẩm tạo lợi thế cạnh tranh trong ghép cặp hoặc gameplay xã hội.
- Hiển thị rõ giá, điều kiện và nội dung vật phẩm.

## 3. Chức năng

### 3.1 Wallet
- Số dư coin.
- Lịch sử nhận/trừ.
- Mã giao dịch.
- Lý do giao dịch.
- Thời gian.
- Phân loại: reward, purchase, admin adjustment, refund.

### 3.2 Reward
- Thưởng tham gia chuyến.
- Thưởng nhiệm vụ đơn giản.
- Thưởng hoạt động xã hội hợp lệ.
- Giới hạn theo ngày và chống farm.
- Không thưởng chỉ vì gửi spam chat hoặc kết bạn hàng loạt.

### 3.3 Catalog & Shop
Mỗi item:
- ID, tên, mô tả.
- Loại item.
- Giá coin.
- Asset reference.
- Rarity/categorization nếu cần.
- Trạng thái đang bán.
- Giới hạn hoặc điều kiện sở hữu.

Danh mục MVP:
- Áo/quần.
- Kiểu tóc.
- Kính/mũ.
- Phụ kiện.
- Emote.
- Một số màu hoặc kiểu trang trí.

### 3.4 Inventory & Equipment
- Xem vật phẩm đã sở hữu.
- Lọc theo loại.
- Trang bị/tháo.
- Kiểm tra tương thích slot.
- Lưu loadout.
- Đồng bộ trang phục với người chơi khác.
- Nếu asset chưa tải, hiển thị fallback an toàn.

### 3.5 Admin Tools
- Tạo/sửa/ẩn item.
- Cập nhật giá có audit log.
- Cấp/thu hồi item.
- Điều chỉnh coin có lý do và quyền hạn.
- Xem lịch sử giao dịch.
- Không cho admin thao tác nhạy cảm mà không ghi log.

## 4. Data model gợi ý

```ts
interface CatalogItem {
  id: string;
  name: string;
  category: "top" | "bottom" | "hair" | "accessory" | "emote";
  priceCoins: number;
  assetKey: string;
  active: boolean;
}

interface Wallet {
  userId: string;
  balance: number;
}

interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: "reward" | "purchase" | "refund" | "admin_adjustment";
  referenceId?: string;
  idempotencyKey: string;
  createdAt: string;
}

interface InventoryItem {
  userId: string;
  itemId: string;
  acquiredAt: string;
}
```

Các constraint database chỉ áp dụng nếu về sau dự án bổ sung backend; chúng không mô tả kiến trúc hiện tại.

## 5. Đồng bộ P2P (thay cho API backend)

- Catalog nằm trong `packages/shared`; client chỉ gửi `SHOP_PURCHASE { itemId }` hoặc `SHOP_EQUIP { itemId }`.
- Host đọc giá từ catalog, kiểm tra số dư/quyền sở hữu, cập nhật wallet và inventory trong state room rồi broadcast snapshot.
- Snapshot room chứa số dư và danh sách item đã sở hữu/trang bị để peer render cùng appearance.
- Khi rời room, tài khoản demo lưu số dư và inventory vào localStorage trên trình duyệt đó. Đây là lưu cục bộ, không đồng bộ tài khoản giữa thiết bị.

## 6. Asset pipeline 3D

- Chuẩn hóa skeleton/rig cho trang phục.
- Đặt quy ước tên file và asset key.
- Kiểm tra scale, pivot, material và texture.
- Dùng GLB/texture tối ưu.
- Có thumbnail cho shop.
- Có fallback khi tải asset lỗi.
- Không tải toàn bộ catalog vào scene ngay từ đầu.
- Chỉ tải item đang preview hoặc đang trang bị.

## 7. UI/UX
- Shop theo danh mục.
- Item detail: preview, giá, trạng thái sở hữu.
- Nút mua có xác nhận.
- Wallet balance.
- Inventory.
- Avatar customization preview.
- Save/cancel loadout.
- Thông báo mua thành công/thất bại rõ ràng.

## 8. Cấu trúc code hiện tại

```text
packages/shared/src/index.ts       # catalog và DTO đồng bộ
src/services/p2pBusNetwork.ts      # xử lý SHOP_PURCHASE/SHOP_EQUIP tại host
src/stores/useMultiplayerStore.ts  # nối room state, ví và action UI
src/components/hud/MultiplayerSocialHub.tsx # ví và giao diện shop
```

## 9. Thứ tự triển khai

1. Chốt rõ đây là coin demo cục bộ, không có giá trị tiền mặt.
2. Xây catalog dùng chung và action mua/trang bị/tháo.
3. Để host kiểm tra giá, số dư và quyền sở hữu trong room.
4. Đồng bộ wallet, inventory và appearance cho các peer.
5. Lưu số dư/inventory về localStorage sau khi nhận room snapshot.
6. Các tính năng ledger, reward, admin và chống gian lận chỉ triển khai nếu sau này có authority tin cậy hoặc thiết kế phù hợp P2P.

## 10. Tiêu chí nghiệm thu

- [x] Có ví và catalog shop trong room.
- [ ] Có lịch sử giao dịch/ledger.
- [ ] Coin được kiểm tra bởi authority tin cậy (hiện tại host P2P chỉ là authority theo phiên).
- [ ] Mua hàng có idempotency bền vững khi retry hoặc đổi host.
- [x] Không thể mua khi thiếu tiền hoặc item đã sở hữu; catalog hiện tại là tĩnh.
- [x] Mua thành công thêm item vào inventory trong state room.
- [x] Trang bị/tháo avatar hoặc màu áo hoạt động.
- [x] Người chơi khác nhìn thấy appearance đã đồng bộ.
- [ ] Asset có fallback và không làm crash scene.
- [ ] Reward có giới hạn và chống farm cơ bản.
- [ ] Admin action có phân quyền và audit log.
- [ ] Có kiểm thử giao dịch đồng thời/retry khi bổ sung persistence tin cậy.

## 11. Prompt giao cho AI code

Đối với phần mở rộng Phase 6 của Virtual Bus, trước tiên kiểm tra profile, avatar, asset pipeline và kiến trúc frontend-only hiện có; không tạo backend hoặc Socket.IO.

Tiếp tục từ MVP shop P2P: catalog tĩnh dùng chung, host xác thực giá/số dư/quyền sở hữu trong room, đồng bộ inventory và appearance. Ghi rõ host không phải authority bảo mật, localStorage không chia sẻ giữa thiết bị, và chưa có ledger/idempotency bền vững.

Sau đó mới mở rộng preview/trang bị 3D nếu asset pipeline hỗ trợ. Không thêm phần thưởng có thể farm hoặc giả lập bảo mật server. Không tích hợp thanh toán tiền thật, marketplace hay loot box.

Chạy lint và build theo hướng dẫn repository, cập nhật README và báo cáo giới hạn P2P. Chỉ thêm test khi được yêu cầu.
