# ROAD MATE — PHASE 6
## Game Economy & Customization

**Mục tiêu:** Cho phép người chơi cá nhân hóa avatar và trải nghiệm bằng tiền ảo/vật phẩm trong game, với kinh tế cân bằng, minh bạch và không pay-to-win.

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
- Mọi giao dịch phải được server xác thực.
- Dùng ledger bất biến hoặc lịch sử giao dịch có thể kiểm toán.
- Không cho số dư âm.
- Mỗi request mua phải có idempotency key để tránh trừ tiền hai lần.
- Giá và nội dung vật phẩm lấy từ catalog server.
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

Trong database cần unique constraint cho idempotency key theo user, foreign keys và transaction DB khi mua vật phẩm.

## 5. API gợi ý

- `GET /wallet`
- `GET /wallet/transactions`
- `GET /shop/items`
- `POST /shop/purchase`
- `GET /inventory`
- `POST /inventory/equip`
- `POST /inventory/unequip`
- `GET /profile/loadout`
- `PUT /profile/loadout`

Endpoint purchase phải đọc giá từ database, kiểm tra số dư, tạo giao dịch và ghi inventory trong một transaction.

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

## 8. Cấu trúc code gợi ý

```text
apps/
  web/src/features/
    wallet/
    shop/
    inventory/
    customization/
    rewards/
  server/src/
    economy/
    wallet/
    catalog/
    purchases/
    inventory/
    rewards/
    admin-catalog/
```

## 9. Thứ tự triển khai

1. Chốt loại tiền ảo và nguồn phát hành coin.
2. Xây wallet ledger và lịch sử giao dịch.
3. Xây catalog item.
4. Xây inventory.
5. Xây mua vật phẩm bằng transaction an toàn.
6. Xây preview và trang bị avatar.
7. Đồng bộ loadout cho người chơi khác.
8. Xây reward giới hạn và chống farm.
9. Xây công cụ admin có audit log.
10. Kiểm thử race condition, retry, double purchase và số dư.

## 10. Tiêu chí nghiệm thu

- [ ] Có ví và lịch sử giao dịch.
- [ ] Coin chỉ thay đổi từ server.
- [ ] Mua hàng không thể trừ tiền hai lần khi retry.
- [ ] Không thể mua khi thiếu tiền hoặc item không còn bán.
- [ ] Mua thành công tạo inventory đúng một lần.
- [ ] Trang bị/tháo item hoạt động.
- [ ] Người chơi khác nhìn thấy loadout đã đồng bộ.
- [ ] Asset có fallback và không làm crash scene.
- [ ] Reward có giới hạn và chống farm cơ bản.
- [ ] Admin action có phân quyền và audit log.
- [ ] Có test cho giao dịch đồng thời và lỗi database.

## 11. Prompt giao cho AI code

Hãy triển khai Phase 6 của Roadmate dựa trên codebase hiện tại. Trước khi code, kiểm tra hệ thống profile, avatar, database và asset pipeline; tái sử dụng các module có sẵn.

Bắt đầu bằng wallet ledger, catalog, inventory và mua vật phẩm bằng coin nội bộ. Tất cả giá, số dư và giao dịch phải do server quyết định. Dùng transaction database và idempotency key để chống double purchase. Không tin giá hoặc số dư do client gửi.

Sau đó tích hợp preview/trang bị trang phục 3D và đồng bộ loadout. Chỉ thêm phần thưởng có giới hạn, có chống farm. Chưa tích hợp thanh toán tiền thật, marketplace hay loot box.

Viết test cho mua đồng thời, retry, thiếu tiền, item ngừng bán và asset lỗi. Chạy migration, typecheck, test và build sau từng module. Cập nhật README và báo cáo.
