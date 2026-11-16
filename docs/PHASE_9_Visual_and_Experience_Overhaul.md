# Phase 9 — Nâng cấp hình ảnh & trải nghiệm (Visual & Experience Overhaul)

> Trạng thái: **Đã triển khai (bản procedural)** · Phiên bản: `0.4.0` · Xem mục 7 để biết chi tiết và phần còn lại.
> Phạm vi: đồ họa, HUD, cốt truyện, nhân vật, camera 360°, mở rộng bản đồ.

## 0. Hiện trạng (đánh giá từ code)

| Hạng mục | Hiện trạng | Vấn đề chính |
|---|---|---|
| Đồ họa | Toàn bộ mô hình dựng bằng primitive (`boxGeometry`, `cylinderGeometry`…) với `meshStandardMaterial` màu phẳng (~150 material trong `src/game/bus/*`). Không có texture, GLTF, environment map hay post-processing. Bầu trời là `<color attach="background">` một màu. | Nhìn "nhựa", thiếu chi tiết bề mặt, thiếu phản xạ, ánh sáng phẳng. |
| HUD | `GameHud.tsx` hiển thị cùng lúc ~6 panel ở 4 góc màn hình. Nhiều chữ `text-[10px]`, nền `slate-950/80`, gradient + badge + animation ping. `MultiplayerSocialHub.tsx` dài hơn 1000 dòng. | Rối, chữ nhỏ, độ tương phản thấp, không có thứ bậc thông tin. |
| Cốt truyện | Chỉ có 2 tuyến (`DEFAULT_ROUTES`) với danh sách trạm, cộng 3 daily quest trong `useEconomyLedgerStore`. | Không có mục tiêu, nhân vật chính, hay lý do để chơi tiếp. |
| Nhân vật | `CharacterModel.tsx` ghép khoảng 40 mesh primitive, giới tính đoán từ tên (`name.includes('Mai')`). Animation procedural chỉ xoay khớp. | Tỉ lệ cứng, mặt đơn giản, chuyển động robot. |
| Camera | `CameraManager.tsx`: yaw giới hạn ±0.55 rad, pitch ±0.25 rad (`cameraConfig.ts`). Chỉ rê chuột (không kéo) cũng làm lệch view. Mỗi frame lerp cả vị trí lẫn target. | Không xoay 360° được. View trôi theo chuột gây cảm giác giật/lắc. |
| Bản đồ | `environmentConfig.ts`: vòng lặp 200 m (`zMin -160` → `zMax 40`). 44 cây, 22 nhà, 14 núi đặt theo `i % 2`, `i % 3`. Trạm dừng lặp mỗi 240 m. | Cảnh lặp lại khoảng 10 giây một lần (ở 70 km/h). Cảnh không đổi dù tuyến đi Cần Thơ hay Đà Lạt. |

---

## 1. Quyết định cần chốt trước khi làm

1. **Phong cách hình ảnh** — đề xuất **Stylized (toon/hoạt hình ấm, kiểu Ghibli)** thay vì realistic.
   - Lý do: chạy tốt trên trình duyệt và mobile, giấu được hạn chế về asset, hợp với chủ đề "chuyến xe về quê".
2. **Nguồn asset 3D** — đề xuất: tự dựng bằng Blender, kết hợp asset CC0 (Quaternius, Kenney, Poly Haven, ambientCG). Animation nhân vật lấy từ Mixamo (cần kiểm tra license trước khi phát hành).
3. **Cốt truyện** — chốt tone (ấm áp / lãng mạn / hài) và có hay không có lồng tiếng. Đề xuất ở mục 4.
4. **Ngân sách hiệu năng** — mục tiêu: 60 FPS desktop tầm trung ở `high`, 30+ FPS mobile ở `low`. Bundle tải lần đầu < 15 MB (asset nặng thì lazy-load).

---

## 2. Thứ tự triển khai đề xuất

| Bước | Hạng mục | Độ lớn | Lý do thứ tự |
|---|---|---|---|
| 9.1 | Camera 360° mượt | S | Ít phụ thuộc, cải thiện cảm giác ngay |
| 9.2 | Nền tảng đồ họa (lighting, sky, post-processing, texture) | M | Mọi asset mới đều dựa trên nền này |
| 9.3 | HUD mới | M | Độc lập với 3D, làm song song với 9.2 được |
| 9.4 | Bản đồ mở rộng theo chunk/biome | L | Cần nền đồ họa từ 9.2 |
| 9.5 | Nhân vật mới (GLTF + skeletal animation) | L | Cần pipeline asset từ 9.2 |
| 9.6 | Cốt truyện & hệ thống nhiệm vụ | L | Cần HUD (dialog) và bản đồ (landmark, trạm) |

---

## 3. Chi tiết từng hạng mục

### 9.1 Camera xoay 360° bằng chuột, mượt, không giật

**Nguyên nhân giật hiện tại**
- `pointermove` khi *không kéo* vẫn lerp `targetLookOffset` theo vị trí chuột, nên view trôi liên tục.
- Yaw/pitch bị clamp nên chạm biên là khựng.
- Hệ số damping `1 - exp(-k·delta)` được dùng cho cả vị trí lẫn target. Khi player di chuyển, hai giá trị lệch pha nên camera bị "bập bềnh".

**Giải pháp**
- Viết lại `CameraManager` theo mô hình **orbit cầu (spherical)** quanh một pivot:
  - `yaw` không giới hạn (0–2π, wrap), `pitch` clamp trong khoảng [-80°, +80°], `distance` chỉnh bằng con lăn chuột.
  - Pivot tuỳ mode: đầu nhân vật (interior/3rd-person), tâm xe (chase), tâm cabin (top-down).
- Input:
  - Chỉ xoay khi **giữ chuột phải** hoặc kéo chuột trái vượt ngưỡng 4 px, để click chọn ghế/nhân vật vẫn hoạt động.
  - Dùng `PointerEvent.movementX/Y` và `setPointerCapture`.
  - Tuỳ chọn Pointer Lock (phím `V`) cho chế độ nhìn tự do.
  - Bỏ hẳn hiệu ứng "rê chuột là lệch view".
  - Touch: kéo 1 ngón để xoay, pinch để zoom.
- Làm mượt:
  - Damp riêng yaw/pitch bằng `THREE.MathUtils.damp`, với yaw tính theo **shortest angle**.
  - Pivot bám theo nhân vật bằng damp nhanh hơn, tránh lệch pha.
- Va chạm trong cabin: raycast từ pivot tới camera vào một mesh collider đơn giản (vách xe, trần). Khi trúng thì kéo camera vào gần, để camera không xuyên tường.
- Di chuyển **WASD tương đối theo hướng camera** (`CharacterController.tsx`): hướng W = yaw camera chiếu xuống mặt phẳng XZ.
- Đưa độ nhạy chuột và đảo trục Y vào phần cài đặt (`useGameStore`).
- Tuân thủ quy tắc trong `AGENTS.md`: cấp phát sẵn `Vector3`/`Spherical` trong `useRef`, gỡ listener trong cleanup.

**Tiêu chí hoàn thành:** xoay đủ 360° ở cả 3 mode. Không còn trôi view khi chỉ rê chuột. Camera không xuyên vách xe. Click ghế/nhân vật vẫn hoạt động.

### 9.2 Nền tảng đồ họa

1. **Color & tone mapping**
   - Chuyển từ `ACESFilmic` exposure 1.25 sang `AgXToneMapping` hoặc `NeutralToneMapping` (có từ three r170).
   - Rà lại bảng màu: hiện đang dùng nhiều màu Tailwind bão hoà như `#38bdf8`, `#84cc16`.
2. **Bầu trời & ánh sáng**
   - Thay màu nền bằng `<Sky>` của drei (mô phỏng khí quyển), vị trí mặt trời liên kết với `timeOfDay`.
   - Thêm giờ vàng / hoàng hôn, không chỉ day/night.
   - Environment map: một HDRI nhỏ (1k, Poly Haven CC0) đặt trong `public/`, **không tải từ CDN lúc chạy**. Dùng cho phản xạ kính xe, thân xe, kim loại.
   - Bóng đổ: dùng `CascadedShadowMaps` hoặc cho shadow camera bám theo xe. Thêm `<ContactShadows>` dưới xe.
3. **Post-processing** (`@react-three/postprocessing`, phân theo `graphicsQuality`)
   - `low`: không dùng.
   - `medium`: SMAA + Bloom nhẹ (đèn đường, đèn xe ban đêm) + Vignette.
   - `high`: thêm N8AO (ambient occlusion) và DOF nhẹ khi focus nhân vật.
4. **Vật liệu & texture**
   - Texture CC0 cho mặt đường, lề, cỏ, da ghế, vải trần xe, kính.
   - Nén KTX2 qua `useKTX2`, tạo hàm vật liệu dùng chung trong `src/game/materials/`.
   - Kính xe dùng `meshPhysicalMaterial` (transmission/clearcoat) ở `high`.
5. **Mô hình xe**: dựng lại xe bằng Blender rồi export `.glb` (Draco/Meshopt). Phải giữ nguyên hệ toạ độ và các mốc trong `busConfig.ts` (`floorY`, `ceilingY`, toạ độ ghế). Tách node `Roof` để giữ tương thích `cutawayRoof`.
6. **Gió & sự sống**: cây, lúa đung đưa bằng vertex shader (`onBeforeCompile`, chạy trên GPU, không tốn CPU). Thêm chim, khói bếp, bụi đường dạng particle.

**Tiêu chí hoàn thành:** ảnh chụp so sánh trước/sau ở 3 mức chất lượng. FPS không giảm quá 10% so với hiện tại ở `medium`.

### 9.3 HUD mới

**Nguyên tắc**
- **Tối giản mặc định**: khi đang đi xe chỉ hiện những gì cần ngay. Mọi thứ khác nằm sau menu.
- Chữ tối thiểu 12px (mobile 13px), độ tương phản WCAG AA, dùng font hỗ trợ tiếng Việt tốt (đề xuất **Be Vietnam Pro**, đặt font trong `public/`).
- Một design system duy nhất: token màu, bo góc, spacing trong `tailwind.config.js`, kèm primitive trong `src/components/ui/` (`Panel`, `Button`, `IconButton`, `Tabs`, `Dialog`, `Toast`, `ProgressBar`).
- Bỏ gradient chữ, badge ping, viền phát sáng. Chuyển từ glassmorphism đậm sang panel đặc, bán trong suốt nhẹ.

**Bố cục mới**

```
┌───────────────────────────────────────────────┐
│ [≡ Menu]      ── Tiến trình tuyến ──●──── 🏁   │  ← thanh hành trình (trạm kế, km còn lại)
│                                               │
│                                     [Nhiệm vụ]│  ← tracker nhiệm vụ gọn (thu gọn được)
│                                               │
│             (khung 3D để trống)               │
│                                               │
│ 72 km/h · 14:35 · ☀            [E] Ngồi ghế 3B│  ← chỉ báo ngữ cảnh + gợi ý phím
│ [💬 Chat]                         [1][2][3] 📷 │
└───────────────────────────────────────────────┘
```

- **Menu (Esc / ≡)**: một màn hình nhiều tab, gồm Hành khách · Bạn bè & Chat · Cửa hàng · Nhiệm vụ · Cài đặt · Hướng dẫn · Live-ops. Gom các modal hiện có (`MultiplayerSocialHub`, `EconomyAndCustomizationModal`, `LaunchAndLiveOpsModal`, `PlayerGuideHub`, `DiagnosticsPanelModal`) vào đây.
- **Hội thoại**: khung dialog kiểu visual novel ở đáy màn hình (tên, chân dung, lựa chọn), dùng cho cốt truyện ở 9.6.
- **Chỉ báo ngữ cảnh**: thay `PlayerActionHud` bằng một prompt duy nhất theo vật thể đang nhìn hoặc đứng gần.
- Tách `MultiplayerSocialHub.tsx` (hơn 1000 dòng) thành các component nhỏ theo tab.
- Mobile: thanh dưới cố định, joystick ảo thay `MobileArrowPad`, menu toàn màn hình.

**Tiêu chí hoàn thành:** mặc định chiếm dưới 15% diện tích màn hình. Mọi chữ ≥ 12px. Đi được hết các chức năng bằng bàn phím.

### 9.4 Mở rộng bản đồ, chống lặp cảnh

**Ý tưởng chính:** cảnh vật **gắn với quãng đường thực của tuyến**, không lặp theo vòng 200 m nữa. Xe vẫn đứng ở gốc toạ độ, thế giới trôi về `+Z` (giữ invariant trong `AGENTS.md`).

1. **Chunk streaming**
   - Chia tuyến thành các chunk 100 m. Mỗi chunk được sinh bằng **seeded random** từ `(routeId, chunkIndex)`, nên các peer P2P thấy cùng một cảnh mà không cần đồng bộ dữ liệu.
   - Giữ khoảng 6 chunk phía trước và 2 chunk phía sau. Chunk ra khỏi tầm thì trả instance về pool.
2. **Biome theo tuyến** (dữ liệu khai báo trong `packages/shared`, gắn với `distanceKm` của trạm):
   - *TP.HCM → Cần Thơ:* ngoại ô và khu công nghiệp → đồng lúa → kênh rạch, cầu → vườn dừa, chợ nổi → thành phố Cần Thơ.
   - *TP.HCM → Đà Lạt:* ngoại ô → đồi cao su, cà phê → đèo dốc, rừng thông (đường cong) → sương mù → Đà Lạt.
   - Mỗi biome có bảng asset, mật độ, màu sương, ánh sáng riêng. Giữa hai biome có vùng chuyển tiếp.
3. **Landmark & sự kiện đường**: cầu (Mỹ Thuận / Cần Thơ), trạm thu phí, cây xăng, chợ ven đường, đường tàu, làng hoa. Đặt theo km cố định để người chơi nhận ra mình đang ở đâu.
4. **Đường cong & địa hình**: giả lập đường cong bằng shader bẻ cong thế giới theo `curvature(distance)` (rẻ, không cần đổi vật lý). Thêm đồi, núi, ruộng bậc thang bằng heightmap theo biome.
5. **Đa dạng hoá**: mỗi loại cây, nhà có 3–5 biến thể mesh. Ngẫu nhiên xoay, scale, tint màu. Dùng impostor billboard cho cây xa.
6. **Tầm nhìn**: tăng `far` camera và fog lên khoảng 400–600 m ở `high`. Thêm skyline núi xa dạng layer parallax.
7. **Trạm dừng**: mỗi trạm thật trong `DEFAULT_ROUTES` có khu vực riêng (thay `StationPlatform`/`StopArea` dùng chung), để đi bộ, check-in, gặp NPC cốt truyện.

**Tiêu chí hoàn thành:** chạy 10 phút liên tục không thấy cụm cảnh lặp y hệt. Hai tuyến có cảnh khác nhau rõ rệt. Draw call không vượt mức hiện tại quá 30%.

### 9.5 Nhân vật mới

1. **Mô hình**: chuyển từ rig primitive sang **GLTF có skeleton** (stylized, khoảng 5–8k tris mỗi nhân vật).
   - Một base mesh nam và một nữ, cùng skeleton, mặc định chia sẻ animation.
   - Thân, tóc, áo, quần, phụ kiện là các mesh tách rời, bật/tắt và đổi màu được. Liên kết với cosmetic trong `useEconomyLedgerStore`.
   - Bỏ việc đoán giới tính từ tên. Thêm trường `bodyType` vào `CharacterData` và kiểu dữ liệu shared, đồng bộ qua P2P.
2. **Animation**: `useAnimations` của drei với clip idle, walk, run, sit, sit-idle (ngủ gật, nhìn điện thoại, nhìn ra cửa sổ), wave, cười, nói chuyện, ăn uống, emote. Blend mượt bằng `crossFadeTo`. Giữ `AnimationController.ts` làm lớp ánh xạ `AnimationState` sang clip.
3. **Khuôn mặt**: mắt chớp, biểu cảm bằng morph target hoặc texture swap. Khi nói chuyện, đầu xoay nhìn người đối diện (look-at IK đơn giản).
4. **Shading**: toon shader / rim light nhẹ cho đúng phong cách stylized. Có outline khi hover/chọn thay cho vòng tròn dưới chân.
5. **Hiệu năng**: chia sẻ geometry/material giữa các nhân vật (`SkeletonUtils.clone`). Ở `low` thì giảm LOD, tắt bóng cho NPC xa.
6. **Tạo nhân vật**: màn hình chọn ngoại hình (body, tóc, màu da, trang phục) khi tạo tài khoản demo.

**Tiêu chí hoàn thành:** 28 hành khách cùng lúc vẫn đạt mục tiêu FPS ở mục 1, ý 4. Chuyển trạng thái ngồi/đi không giật.

### 9.6 Cốt truyện & nhiệm vụ

**Đề xuất cốt truyện: "Homebound — Chuyến xe về quê"**

- **Bối cảnh:** những ngày cận Tết. Người chơi là một người trẻ làm việc ở Sài Gòn, đã nhiều năm chưa về quê. Mỗi tuyến là một "chương" của hành trình về nhà.
- **Mạch chính:** trên đường đi, người chơi gặp các hành khách có câu chuyện riêng. Giúp họ, trò chuyện với họ, hay chỉ ngắm cảnh qua mỗi trạm đều mở dần ký ức của nhân vật chính (flashback ngắn khi đi qua landmark).
- **NPC chủ chốt (ví dụ):** bác tài xế lâu năm (người dẫn chuyện), cô sinh viên về quê lần đầu, ông cụ mang theo chậu mai, cặp vợ chồng trẻ với em bé, anh phụ xe vui tính.
- **Kết:** đến trạm cuối, đoàn tụ gia đình (cutscene). Lựa chọn trong hành trình ảnh hưởng tới lời thoại và kết thúc (2–3 biến thể).

**Hệ thống cần xây**
- `src/game/story/`: định nghĩa chương, cảnh, nhiệm vụ dạng dữ liệu (JSON/TS), không hard-code trong component.
- `useStoryStore`: chương hiện tại, cờ (flags), nhiệm vụ đang làm, quan hệ (thiện cảm) với NPC.
- **Dialog engine**: cây hội thoại có lựa chọn, điều kiện theo flags, hiển thị qua khung dialog ở 9.3.
- **Trigger**: theo km/trạm (`useJourneyStore`), theo tương tác (click NPC, ngồi ghế), theo thời gian trong ngày.
- **Nhiệm vụ**: mở rộng `DailyQuestReward` thành hệ thống nhiệm vụ chung (chính / phụ / hằng ngày), thưởng coin hoặc cosmetic.
- **Cutscene**: camera rail đơn giản cùng letterbox, tái sử dụng `CameraManager` với chế độ `cinematic`.
- **Multiplayer:** cốt truyện chính chạy *per-player* (lưu localStorage). Trong room, host chỉ đồng bộ các sự kiện chung (ví dụ xe hỏng, mưa lớn, dừng ăn trưa) dưới dạng packet `P2PPacket` mới.

**Tiêu chí hoàn thành:** chơi trọn tuyến TP.HCM → Cần Thơ mất 20–30 phút, có ít nhất 1 chương hoàn chỉnh, 5 NPC có hội thoại và 1 cutscene kết.

---

## 4. Thay đổi kỹ thuật & phụ thuộc mới

| Gói | Mục đích | Ghi chú |
|---|---|---|
| `@react-three/postprocessing` + `postprocessing` | Bloom, SMAA, AO, Vignette | Chỉ bật ở `medium`/`high` |
| (đã có) `@react-three/drei` | `Sky`, `Environment`, `useGLTF`, `useAnimations`, `useKTX2`, `ContactShadows` | |
| `gltfjsx` (dev, CLI) | Sinh component typed từ `.glb` | |
| `gltf-transform` (dev, CLI) | Nén Draco/Meshopt/KTX2 | Thêm script `npm run assets` |

- Asset đặt trong `public/assets/{models,textures,hdri,fonts}`. Không tải asset từ CDN lúc chạy.
- Lazy-load theo tuyến (biome) và preload ở màn hình lobby, kèm progress bar (`useProgress`).
- Cập nhật `manualChunks` trong `vite.config.ts` cho `postprocessing`.
- Cập nhật `AGENTS.md` và `CLAUDE.md` khi đổi kiến trúc camera, chunk streaming, pipeline asset.

## 5. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| FPS giảm trên mobile | Mọi tính năng mới phải có nhánh `low`. Dùng `PerformanceProbe3D` để tự hạ chất lượng khi FPS < 30. |
| Bundle và thời gian tải tăng | Nén KTX2/Draco, lazy-load theo tuyến, giới hạn budget từng asset. |
| Lệch trạng thái P2P khi đổi `CharacterData` / thêm story events | Thêm version vào packet. Cảnh sinh bằng seed nên không cần đồng bộ. |
| Phá vỡ toạ độ, cutaway khi thay xe GLTF | Giữ mốc trong `busConfig.ts`, có checklist so sánh vị trí ghế trước/sau. |
| License asset / animation | Chỉ dùng CC0 hoặc asset tự làm. Ghi nguồn trong `docs/ASSET_CREDITS.md`. |
| Khối lượng nội dung cốt truyện lớn | Làm 1 chương (tuyến Cần Thơ) hoàn chỉnh trước, chương Đà Lạt sau. |

## 6. Mốc kiểm tra

- **M1 (9.1 + 9.2 cơ bản):** camera 360°, Sky, HDRI, tone mapping mới, post-processing.
- **M2 (9.3):** HUD mới và menu hợp nhất, dialog box sẵn sàng.
- **M3 (9.4):** chunk streaming, 2 bộ biome, landmark.
- **M4 (9.5):** nhân vật GLTF, animation mới, tạo nhân vật.
- **M5 (9.6):** chương 1 "Về miền Tây" chơi được trọn vẹn, cập nhật `RELEASE_NOTES.md`, `PLAYER_GUIDE.md`.

Mỗi mốc phải qua `npm run lint` và `npm run build`, có ảnh/video so sánh và số đo FPS ở 3 mức chất lượng.

---

## 7. Kết quả triển khai (0.4.0)

| Hạng mục | Đã làm | Khác với plan / còn lại |
|---|---|---|
| 9.1 Camera | `CameraManager` viết lại theo orbit cầu: yaw 360°, pitch giới hạn, zoom con lăn/pinch, kéo chuột trái (ngưỡng 4 px) hoặc chuột phải, pointer lock `V`, `C` để đưa camera về sau lưng, giữ camera trong cabin (giới hạn hộp, không dùng raycast), WASD theo hướng camera, độ nhạy/đảo trục trong Cài đặt. | Va chạm camera dùng hộp cabin cố định thay vì raycast mesh. |
| 9.2 Đồ hoạ | Neutral tone mapping, `<Sky>` khí quyển, environment map từ Lightformer (không tải HDRI), hậu kỳ theo chất lượng (SMAA/Bloom/N8AO/Vignette), texture procedural cuộn theo tốc độ, kính xe trong hơn, gió lay cây bằng shader. | **Chưa** dựng lại xe bằng Blender/GLTF; chưa có texture ảnh chụp (CC0) hay KTX2. |
| 9.3 HUD | Design token `ink`/`accent`, font Be Vietnam Pro (gói npm, không CDN), primitive dùng chung, bố cục tối giản, thanh tiến trình tuyến, ActionDock, menu Esc hợp nhất (Hành trình, Hành khách, Cộng đồng, Cửa hàng, Cài đặt, Trợ giúp). | Các modal cũ (social hub, economy, live-ops…) vẫn giữ giao diện cũ, chỉ được mở từ menu. |
| 9.4 Bản đồ | Chunk 100 m sinh bằng seed, 5 biome theo km của tuyến **Bình Lục → Mỹ Đình** (tuyến offline thực tế, không phải tuyến miền Tây), landmark: cầu sông Đáy, biển cao tốc, trạm thu phí Đại Xuyên, đường chân trời Hà Nội; tầm nhìn 300/450/620 m theo chất lượng. | Chưa có đường cong hay địa hình heightmap; seed theo quãng đường cục bộ nên các peer thấy cảnh hơi khác nhau. |
| 9.5 Nhân vật | Rig toon-shaded viết lại (giữ các khớp cũ), 6 kiểu tóc, phụ kiện (nón lá, kính, mũ, balo), chớp mắt, miệng khi nói, quay đầu nhìn người chơi, material dùng chung. Trường `bodyType`/`hairStyle`/`accessories` (tuỳ chọn) trên `CharacterData`. | **Chưa** chuyển sang GLTF có skeleton / Mixamo; chưa có màn hình tạo nhân vật. |
| 9.6 Cốt truyện | Engine dữ liệu (hội thoại có lựa chọn, nhiệm vụ chính/phụ/thất bại, beat theo km/trạm/landmark, cinematic, nhật ký, 3 kết thúc, thưởng xu idempotent). **Chương 1 "Lên phố"**: tân sinh viên rời Bình Lục lên Hà Nội nhập học. | Cốt truyện được điều chỉnh theo tuyến thực tế (lên phố thay vì về quê miền Tây). Chỉ chạy ở chế độ chơi đơn; chưa có packet story cho P2P. |

Thay đổi khác: hành trình offline chậm lại (`KM_PER_REAL_SECOND` 0.55 → 0.16, tổng thời gian lái khoảng 5,5 phút), `npm run lint` giờ thực sự type-check (trước đây `tsconfig.json` có `files: []` nên không kiểm tra file nào), có tham số URL `?camera=&time=&quality=` để kiểm tra nhanh.
