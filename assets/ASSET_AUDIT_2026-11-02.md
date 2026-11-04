# Kiểm định asset 3D — 2026-11-02

## Phạm vi

- Không mở rộng bản đồ.
- PNG trong `assets/assets/reference_art` chỉ là concept art, không phải model 3D.
- Ưu tiên glTF của Quaternius để tránh nhập trùng các bản FBX/OBJ cùng model.

## Chuẩn mỹ thuật từ reference art

- Stylized fantasy 3D, màu sáng và ấm, silhouette tròn/chắc, chi tiết lớn dễ đọc từ camera chéo.
- Nhà gỗ–vữa–đá, mái ngói đỏ/xanh/nâu, cửa sổ ánh sáng ấm.
- Cây tán dày, đá bo cạnh, hoa và cỏ màu rực; đạo cụ có tỉ lệ hơi phóng đại.
- Nhân vật mục tiêu là chibi stylized, không phải hình người realistic và không dùng PNG billboard thay model.

## Kiểm kê định dạng

- `.gltf`: 374 file.
- `.fbx`: 469 file, phần lớn là bản định dạng thay thế/trùng nội dung với glTF.
- `.glb`: chưa có.

### Các nhóm glTF Quaternius

- `assets/glTF`: 68 model Stylized Nature Standard — cây, pine, đá, hoa, cỏ, nấm, pebble và đường đá.
- `assets/Exports/glTF`: 94 model Fantasy Props — quầy, rương, thùng, bàn ghế, đèn, sách, công cụ và đạo cụ nội thất.
- `assets/Medieval Village MegaKit[Standard]/glTF`: 176 module — tường, mái, cửa, cửa sổ, cầu thang, hàng rào, wagon và chi tiết kiến trúc.
- `assets/Ultimate Stylized Nature - May 2022-20261102T070539Z-1-001/Ultimate Stylized Nature - May 2022/glTF`: 36 model thiên nhiên bổ sung — maple, birch, pine, palm, bụi, cỏ, hoa và đá.

## Skeleton và animation

- Không tìm thấy nhân vật hoặc NPC humanoid có `Skeleton3D`.
- Không tìm thấy animation `Idle`, `Walk` hoặc `Run`.
- Model duy nhất có skin/animation là `assets/Exports/glTF/Chest_Wood.gltf`.
- Rig của rương chỉ điều khiển nắp, với các clip `Chest_Open`, `Chest_Opened`, `Chest_Close`, `Chest_Closed`; đây không phải skeleton nhân vật.

## Asset đã xác nhận dùng được trong scene kiểm thử

- `world/buildings/fantasy_house.tscn`: công trình ghép từ module Medieval Village, vật liệu hoạt động.
- `MapleTree_1.gltf`: cây stylized, scale kiểm thử `0.72`.
- `Rock_Medium_1.gltf`: đá stylized, scale kiểm thử `0.8`.
- `Chest_Wood.gltf`: vật liệu, skin cơ khí và animation hoạt động ở scale `1.0`.

Scene kiểm thử: `res://tests/model_import_validation.tscn`.

## Đã tích hợp vào game chính (F5)

- `Chest_Wood.gltf` được đóng gói thành `res://world/props/animated_chest.tscn`.
- Rương nằm gần điểm spawn tại khu làng chính, có collision và vùng tương tác.
- Phím `E` phát clip thật `Chest_Open` hoặc `Chest_Close`; HUD hiển thị lời nhắc khi người chơi đến gần.
- Smoke test tải trực tiếp `res://world/main_world.tscn` và xác nhận animation bắt đầu khi nhận thao tác tương tác.

## Asset bắt buộc cần bổ sung

### Nhân vật chính

- Một model chibi stylized `.glb` hoặc `.gltf` có skinned mesh và humanoid skeleton.
- Clip tối thiểu: `Idle`, `Walk`, `Run`.
- Khuyến nghị thêm: `Interact`, `Talk`, `Wave`, `Jump` và `Land`.
- Hướng nhìn thống nhất với controller, chiều cao sau import khoảng `1.5–1.8 m`, animation in-place hoặc ghi rõ root motion.
- Đặt tại `assets/characters/models/`.

### NPC cụ già

- Một model cụ già chibi stylized có skeleton tương thích.
- Clip tối thiểu: `Idle`, `Talk`; nên có `Walk` và một gesture chào.
- Đặt tại `assets/npc/models/`.

Capsule hiện tại chỉ là placeholder collision/debug và không được tính là nhân vật hoàn thiện.
