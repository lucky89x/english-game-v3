# ENGLISH QUEST V3 — ASSET PRODUCTION HANDOFF

**Ngày lập:** 03/11/2026  
**Mục đích:** chuyển **ảnh tham chiếu** người dùng lựa chọn thành **mô hình 3D GLB chất lượng cao**, có thể import vào **Godot 4** và chỉnh sửa bằng Blender.

## Cần hiểu đúng
- Gói này **không bao gồm mô hình `.glb` thành phẩm**. Ảnh PNG chỉ là mẫu thiết kế; không đổi đuôi PNG thành GLB.
- Bộ `.glb` low-poly thủ tục tạo trước đó **không đạt chất lượng mỹ thuật** và **không được dùng làm sản phẩm cuối**.
- Các file ảnh AI tham chiếu có thể có các góc nhìn không hoàn toàn nhất quán. Nghệ sĩ 3D cần thống nhất hình khối, kiểm chứng 360° và duyệt bản xám trước khi hoàn thiện texture.
- Khách hàng sử dụng **ChatGPT cho thiết kế/đặc tả/duyệt**, **Codex cho lập trình, tự động hóa, Blender scripting nếu phù hợp, tích hợp và kiểm thử**. Các bước điêu khắc, rig/skin và chỉnh sửa mỹ thuật chất lượng cao cần công cụ/nhân sự 3D chuyên dụng; Codex không tự bảo đảm tạo được chất lượng như concept.

## Bàn giao gồm
- `01_SPECS/ART_DIRECTION.md`: quy chuẩn mỹ thuật và kỹ thuật GLB/Godot.
- `01_SPECS/CHARACTERS.md`: 1 nữ chính + 6 NPC và các biến thể tương lai.
- `01_SPECS/BUILDINGS_BRIDGES_INTERIORS.md`: nhà, trường, chợ, tháp, cầu, nội thất.
- `01_SPECS/TERRAIN_WATER_FOLIAGE.md`: nền đất, nước, bờ, vách, cây, đường.
- `01_SPECS/WEAPONS_TOOLS.md`: vũ khí, công cụ, điểm gắn tay.
- `02_CODEX/CODEX_MASTER_PROMPT.md`: prompt tổng thể copy vào Codex.
- `02_CODEX/BATCH_01_PROMPT.md`: prompt triển khai **lô đầu tiên** không lan man.
- `03_MANIFEST/ASSET_MANIFEST.csv`, `.json`: danh sách asset định danh, độ ưu tiên, thư mục, chuẩn kỹ thuật.
- `05_QA/ACCEPTANCE_CHECKLIST.md`: tiêu chí kiểm tra từng file và toàn scene.
- `04_REFERENCES/`: **ảnh người dùng đưa vào**, giữ nguyên làm chuẩn kiểu dáng (PNG, không phải 3D).

## Đặt tài liệu vào thư mục dự án
Sao chép thư mục `EnglishQuestV3_Asset_Spec_Codex_2026-11-03` vào `D:/EnglishQuestV3/docs/asset_production/` (nếu dự án thực tế ở đường dẫn khác, dùng thư mục có `project.godot`). Các file `.glb` thành phẩm trong tương lai được Codex lưu tại:

```
res://assets/original_3d/characters/
res://assets/original_3d/npcs/
res://assets/original_3d/buildings/
res://assets/original_3d/bridges/
res://assets/original_3d/terrain/
res://assets/original_3d/vegetation/
res://assets/original_3d/water/
res://assets/original_3d/weapons/
res://assets/original_3d/props/
```

Lưu các `.blend` và texture nguồn (nếu tạo) trong `art_source/` riêng, không cần đưa toàn bộ bản gốc nặng vào cảnh game.

## Quy trình
1. Codex đọc `AGENTS.md`, 2 skill thuộc `.agents` và hồ sơ này; kiểm kê nội dung hiện có.
2. Tạo bản **asset pilot**: nhân vật nữ chính + 1 NPC Tom + 1 nhà trưởng làng có nội thất + 1 cầu + 1 mảng ground blend.
3. Ghi rõ khả năng dựng từng asset. **Không báo đã hoàn thành GLB chất lượng cao chỉ vì đã tạo khối cơ bản.**
4. Sau khi người dùng nghiệm thu hình ảnh F5 từ nhiều góc mới nhân rộng các asset còn lại.
5. Mỗi đợt chạy checklist nhập Godot, collision, rig, hoạt ảnh, FPS và không làm mất gameplay cũ.
