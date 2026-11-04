# PROMPT TỔNG THỂ — COPY VÀO CODEX (ENGLISH QUEST V3)

Bạn là Senior Godot 4 Developer, Pipeline Engineer, Technical Artist. Nhiệm vụ của bạn là **xây quy trình sản xuất/tích hợp asset GLB chất lượng cao** theo tài liệu đính kèm, không chỉ tạo cảnh 3D thô.

**PHẠM VI**: dự án `EnglishQuestV3` thực tế đang có `project.godot`. Người dùng đã đưa ảnh tham chiếu cho nhân vật nữ chibi, 6 NPC cụ già, nhà làng, trường học, cầu, sông hồ, vách núi, cây và vũ khí. Ảnh nằm trong `docs/asset_production/04_REFERENCES/` (hoặc đường dẫn tương ứng khi tìm thấy). Cần làm mô hình **THẬT**, xuất `.glb`, đồng thời giữ nguyên hệ thống Godot đã chạy được.

## Quy trình bắt buộc
1. Xác định đúng project root. Đọc `AGENTS.md` liên quan và **2 skill game 3D** trong `.agents` (tìm từng `SKILL.md`, nêu đúng tên/đường dẫn và áp dụng hướng dẫn phù hợp; không tự giả định đã đọc nếu thiếu file). Đọc toàn bộ `00_START_HERE/README.md`, `01_SPECS/*.md`, `03_MANIFEST/ASSET_MANIFEST.csv`, `05_QA/ACCEPTANCE_CHECKLIST.md`.
2. Kiểm kê mesh `.glb/.gltf`/rig/animation sẵn có, asset Blender, addon và công cụ tạo model. Lập bảng so khớp với manifest. Phân biệt concept PNG, GLB prototype thủ tục, GLB third-party, GLB game-ready nghệ thuật.
3. Tạo Git checkpoint/sao lưu trước khi chỉnh. Không xóa scene hoặc ghi đè tài nguyên đang có; không sửa mã JavaScript game cũ.
4. **Tập trung lô đầu**: `chr_ngoc_adventurer` (rig/skin, Idle/Walk/Run), `npc_tom_elder` (Idle/Talk/Wave), `bld_mayor_hall` (ngoại thất có kích thước vào được + interior scene), `brg_wood_arch`, ground blend + bờ sông. Không xây cả 100 asset chưa nghiệm thu mẫu đầu.
5. Nếu pipeline thực tế có Blender/artist/AI 3D phù hợp, sản xuất hình học/UV/material/texture/rig/animation. Xuất `.glb` thật và kèm `.blend`. Đánh giá silhouette so với `REF_01..05`, có ảnh trước, hai bên, sau. **Không** đổi tên PNG thành GLB, dùng hình khối thủ tục thấp cấp để tự nhận đã đạt chất lượng, hoặc gắn animation cho đối tượng cứng và nói là rig humanoid.
6. Nếu **chưa đủ khả năng tạo model chất lượng reference** chỉ bằng công cụ hiện có, nói rõ chỗ cần modeling/rigging thủ công, tạo *blockout* với nhãn `BLOCKOUT` để test gameplay, không báo đạt art production.
7. Dựng scene test riêng `test_asset_gallery.tscn`, `test_characters.tscn`, `test_interiors.tscn`; có thể xem từng model xoay 360°, đo tỷ lệ cạnh hero. Chỉ sau khi art được duyệt mới thay asset đang dùng trong MainWorld.
8. Kiểm tra Godot import, vật liệu, Skeleton3D, AnimationPlayer/AnimationTree, WASD, camera, NPC E, rương, collision, nội thất vào/ra; shader nước/ground cần chạy realtime trong Godot.
9. Kiểm tra 2 skill được áp dụng theo cách nào, các lỗi tìm thấy, test trong Godot nếu thực sự mở được; nếu không, chỉ ghi headless/import và hướng dẫn chủ dự án kiểm tra F5.
10. Báo cáo tiếng Việt, mỗi asset mang trạng thái `BLOCKOUT`, `ART_IN_PROGRESS`, `GAME_READY_VERIFIED` hoặc `BLOCKED_MISSING_ASSET`, file sinh ra, nguồn/license, ảnh 4 góc, số triangle/material, rig/animations, giới hạn và bước tiếp theo.

**Tiêu chí dừng/đạt:** 1 nhân vật hero và 1 NPC được nhìn thấy trong Godot đúng nhận dạng, có `Skeleton3D` + animation thật; 1 nhà lớn có thể vào, 1 cây cầu qua được hai chiều, 1 mảng địa hình chuyển cỏ–đất–đá–bờ nước; tất cả so sánh được với PNG tham chiếu; không hỏng các hệ thống cũ. Nếu thiếu mô hình/hoạt ảnh thì phải báo `CHƯA ĐẠT`, không tuyên bố hoàn tất.
