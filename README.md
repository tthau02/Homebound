# Virtual Bus 3D — Multiplayer & Social Bus Game (Phase 1, 2 & 3)

Trò chơi mô phỏng chuyến xe khách đường dài 3D tương tác nhiều người chơi (Multiplayer) trên trình duyệt, xây dựng bằng **React 18**, **TypeScript**, **Three.js**, **@react-three/fiber**, **@react-three/drei**, **Zustand**, **Tailwind CSS**, **NestJS**, **Socket.IO**, **Prisma ORM**, **PostgreSQL** và **Docker Compose**.

---

## 1. Tổng quan 3 Phase đã hoàn thành

### Phase 1 — Nền tảng Đồ họa 3D, Xe Khách, 3 Camera & Cảnh vật Đường Quê Việt Nam
- **Mô hình xe khách 3D (`BusModel`, `BusExterior`, `BusInterior`, `DriverCabin`, `BusWheels`)**:
  - Trần xe màu đỏ thẫm đặc trưng, dải đèn LED trần ấm áp, 28 ghế bọc da màu cam – nâu nhạt (`1A`–`7D`), lối đi rộng ở giữa, cửa kính lớn hai bên, kệ hành lý và tay vịn kim loại.
- **Hệ thống 3 Camera (`CameraManager`) trên cùng một thế giới 3D**:
  - **Phím `1` (`Interior Camera`)**: Góc nhìn dọc lối đi bên trong xe.
  - **Phím `2` (`Top-down Cutaway Camera`)**: Góc nhìn từ trên xuống với chế độ **Cutaway** tự động ẩn trần xe để nhìn rõ toàn bộ 28 ghế và hành khách.
  - **Phím `3` (`Rear Chase Camera`)**: Camera bám theo đuôi xe mượt mà.
- **Môi trường đường quê Việt Nam chuyển động (`EnvironmentManager`)**:
  - Quốc lộ, vạch kẻ đường, cột cây số QL1A, hàng cây xanh, cánh đồng lúa, nhà dân mái ngói đỏ, đèn đường cao áp và **Trạm Dừng Nghỉ Miền Tây** với hiệu ứng chiều sâu **Parallax** và `InstancedMesh`.
- **Chế độ Ngày / Đêm (`Day / Night Mode`)**: Chuyển đổi trực tiếp trên HUD.

### Phase 2 — Hệ thống Nhân vật, Di chuyển, Ghế ngồi, Chat Bubble & Biểu cảm
- **Character System & Procedural Rig Animation (`CharacterModel`, `AnimationController`)**:
  - Mô hình nhân vật 3D phân cấp khớp xương hỗ trợ: `Idle`, `Walking`, `Sitting`, `Standing`, `Talking`, `Waving`, `Laughing`, `Nodding`, `Clapping`, `Sleeping`.
- **Character Controller (`CharacterController`)**:
  - Điều khiển **`WASD`** di chuyển dọc lối đi, **`Shift`** đi nhanh, **`Space`** đứng dậy khỏi ghế, **`E`** tương tác nhanh, chống đi xuyên ghế và vách xe.
- **Seat System (`SeatManager` & `useSeatStore`)**:
  - Click ghế trống để nhân vật tự tìm đường đi tới ghế và ngồi xuống (`Sitting`); tự giải phóng ghế khi rời đi.
- **3D Billboard Chat Bubble & 6 Emotes (`ChatBubble`, `PlayerActionHud`, `CharacterInteractionMenu`)**:
  - Bong bóng chat hỗ trợ tiếng Việt & emoji hiển thị trên đầu nhân vật (không bị trần xe che), tự ẩn sau ~5 giây, cùng 6 biểu cảm (`Wave`, `Smile`, `Nod`, `Laugh`, `Clap`, `Sleep`).

### Phase 3 — Multiplayer & Social Bus System (NestJS + Socket.IO + Prisma)
- **Kiến trúc Full-stack & Shared Package (`packages/shared`, `backend/`)**:
  - Chia sẻ toàn bộ hằng số `SOCKET_EVENTS`, DTO types, cấu hình tuyến đường và giới hạn tọa độ qua `@virtual-bus/shared`.
- **JWT Authentication (`backend/src/auth/`)**:
  - Đăng ký, đăng nhập, đăng xuất, xác thực Bearer JWT cho cả REST API và Socket.IO handshake.
  - Có sẵn 3 tài khoản mẫu (`taixe`, `phuxe`, `hanhkhach` — mật khẩu `123456`) để kiểm thử nhiều trình duyệt ngay lập tức.
- **Room System & Reconnect Recovery (`backend/src/room/`)**:
  - Tạo phòng, xem danh sách phòng, tham gia/rời phòng, giới hạn tối đa 28 người/phòng, cô lập sự kiện giữa các phòng (`Room Isolation`) và tự động khôi phục trạng thái khi kết nối lại.
- **Server-Authoritative Character & Seat Sync (`backend/src/gateway/bus.gateway.ts`)**:
  - Đồng bộ vị trí, hướng xoay, trạng thái ngồi/đứng và biểu cảm realtime giữa nhiều trình duyệt.
  - Server kiểm tra giới hạn tọa độ trong khoang xe (chống teleport) và khóa ghế nguyên tử (chống 2 người chiếm cùng 1 ghế).
- **Realtime Public & Private Chat**:
  - Chat công khai toàn phòng (kèm bong bóng chat 3D trên đầu và lịch sử chat chuyến xe) và **Chat riêng 1-1 (`Private Chat`)** bảo mật giữa hai người chơi, có rate-limit chống spam.
- **Driver & Assistant System (`Owner`, `Driver`, `Assistant`, `Passenger`)**:
  - **Tài xế (`Driver`)**: Bắt đầu/tiếp tục chuyến xe, tạm dừng, cho xe dừng tại trạm kế tiếp, kết thúc chuyến và phát thông báo loa xe.
  - **Phụ xe (`Assistant`)**: Soát vé từng hành khách hoặc thu tiền & soát vé toàn xe.
- **Bus Journey, Bus Stops & Ticket System**:
  - Quản lý lộ trình các trạm dừng (`Bến xe Miền Tây` → `Tân An` → `Mỹ Tho` → `Cầu Mỹ Thuận` → `Cần Thơ`), đặt vé tự động theo ghế và thanh toán bằng ví tiền ảo trong game.
- **Synchronized Music System (`musicAudioEngine.ts`)**:
  - Trình phát nhạc phòng xe đồng bộ thời gian thực (`Play`, `Pause`, `Next`, `Volume`) theo `startedAtServerMs` của server.

---

## 2. Hướng dẫn cài đặt & Chạy toàn bộ hệ thống

### Bước 1: Cài đặt dependencies

Tại thư mục gốc của dự án:

```bash
npm install
npm --prefix backend install
```

### Bước 2: (Tùy chọn) Khởi chạy PostgreSQL & Redis bằng Docker Compose

```bash
docker compose up -d
npm --prefix backend run prisma:generate
npm --prefix backend run prisma:migrate
```

*(Lưu ý: Nếu máy chưa bật Docker, `PrismaService` trong Backend sẽ tự động chuyển sang chế độ Hybrid In-Memory Authoritative Store để bạn vẫn chạy và test đầy đủ 100% tính năng Multiplayer ngay lập tức).*

### Bước 3: Chạy Backend Server (Cổng `4000`)

Mở Terminal 1:

```bash
npm run dev:backend
```

Backend NestJS + Socket.IO Gateway sẽ chạy tại `http://localhost:4000`.

### Bước 4: Chạy Frontend 3D Web Game (Cổng `5173`)

Mở Terminal 2:

```bash
npm run dev
```

Mở **2 hoặc 3 cửa sổ trình duyệt Chrome** tại `http://localhost:5173`:
1. Nhấn nút **"Bến Xe Multiplayer"** ở góc trên bên trái HUD.
2. Đăng nhập tài khoản **`Bác Tài (taixe / 123456)`** ở Tab 1 và **`Hành Khách (hanhkhach / 123456)`** ở Tab 2 (hoặc đăng ký tài khoản mới).
3. Cùng bấm **"Lên xe ngay"** vào phòng **Xe Khách Phương Trang Miền Tây #01** để thấy nhân vật của nhau di chuyển, ngồi ghế, chat công khai/riêng tư, soát vé và nghe nhạc đồng bộ!

---

## 3. Kiểm tra TypeScript & Production Build

```bash
npm run lint
npm run build:all
```
