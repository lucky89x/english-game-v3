# English Quest

Game 3D học tiếng Anh cho học sinh THCS (lớp 6-9): thế giới phiêu lưu có cốt truyện, nhiều minigame lồng ghép, kiểm tra cơ bản/nâng cao. Godot 4.7.2, GDScript, chạy trên Windows.

## Quy tắc làm việc
- Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu (người dùng không phải lập trình viên chuyên nghiệp).
- Chỉ push lên GitHub khi người dùng nói "đẩy đi". Mặc định chỉ commit trong máy. Không tạo pull request nếu chưa được yêu cầu.
- Chỉ làm đúng phạm vi được yêu cầu, không dựng lại phần khác. Gom việc, tránh chụp/kiểm tra thừa để tiết kiệm token.
- Chạy test trước khi báo xong; báo trung thực nếu test lỗi hoặc phần nào chưa làm.

## Dùng skill game (bắt buộc)
Dự án có 25 skill game trong `.claude/skills/`. Trước khi làm một việc về game, tự tìm và gọi skill phù hợp, không cần người dùng nhắc. Chỉ gọi skill liên quan đến việc đang làm.

| Việc đang làm | Skill |
|---|---|
| Cảnh 3D, camera, ánh sáng, môi trường | `godot-3d-essentials`, `camera-systems` |
| Viết GDScript, cấu trúc node và scene | `godot-gdscript`, `godot-nodes-scenes`, `godot-signals-groups`, `godot-resources` |
| Nhân vật, hoạt ảnh, di chuyển, va chạm | `godot-animation`, `godot-physics`, `physics-tuning` |
| Điều khiển, phím, tay cầm | `input-systems` |
| Giao diện (HUD, menu, hội thoại, bảng điểm) | `godot-ui-control`, `game-ui-ux`, `dialogue-systems` |
| Minigame, cảm giác chơi, độ khó | `game-feel`, `game-ai`, `level-design` |
| Lưu tiến độ học, lịch sử làm bài | `save-systems`, `godot-resources` |
| Hiệu ứng nước, nền đất, shader | `godot-shaders`, `shader-programming` |
| Âm thanh, giọng đọc, nhạc | `godot-audio` |
| Tối ưu cho máy trường cấu hình thấp | `performance-optimization` |
| Rải cây, tạo địa hình, nội dung tự sinh | `procedural-gen` |
| Làm asset 2D/3D, quy trình dựng | `create-game-assets` |
| Kiểm thử không cần giao diện | `godot-gdscript-headless-testing` |
| Xuất bản cài đặt Windows | `godot-export` |

Nếu không skill nào khớp, nói rõ và làm theo cách thông thường. Nguồn skill ghi ở `.claude/skills/README.md` (Apache-2.0).

## Phong cách hình ảnh
- Chibi fantasy, đầu to, màu ấm; không dùng capsule hay khối thô làm sản phẩm.
- Ảnh mẫu: `assets/EnglishQuestV3_Asset_Spec_Codex_2026-11-03/EnglishQuestV3_Asset_Spec_Codex_2026-11-03/04_REFERENCES/` và `assets/assets/reference_art/`.
- Nhân vật, NPC, nhà, cây dựng bằng script Blender trong `tools/chibi05/` (thư viện chung `chibi_lib.py`). Mô tả đầy đủ ở `art_source/chibi05/README.md`.
- Chạy script bằng module `bpy` (`pip install bpy==5.2.3`) từ thư mục gốc repo, ví dụ `python tools/chibi05/build_ngoc_chibi.py`.

## Chạy test (Godot 4.7.2)
- Nhanh: `godot --headless --path . --script res://tests/smoke_test.gd` (cần dòng `SMOKE TEST PASSED`).
- Đầy đủ: `tests/village_life_test.gd`, `tests/skills_upgrade_test.gd`, `tests/chibi05_hero_test.gd`, `tests/redesign03/validate_characters.gd`, `tests/bridge_traversal_test.gd`.
- Chụp ảnh trong game cần renderer thật: `xvfb-run godot --rendering-driver opengl3 --script res://tests/chibi05_world_capture.gd -- <tiền tố>`.
- Sau khi thêm file model/ảnh mới, chạy `godot --headless --path . --import` để tạo file `.import`.

## Lưu ý kỹ thuật
- File nặng (glb, png, blend...) dùng Git LFS: cần `git lfs pull` sau khi tải. Push cần mạng cho phép `lfs.github.com`.
- Nhánh làm việc: `claude/adoring-wozniak-7dif4v`. Không đụng vào `main`.
- Hướng nhân vật/NPC: mặt hướng +Z của Godot; 1 đơn vị = 1 m. Nhân vật chính cao ~1,55 m.
- HUD hiện dùng số liệu mẫu, chưa phải tiến độ học thật. Chưa có minigame hay câu hỏi tiếng Anh; đó là việc giai đoạn tiếp theo.
- Nội thất 3 phòng, quầy chợ, cầu gỗ, hàng rào, rương vẫn là asset Quaternius cũ.
