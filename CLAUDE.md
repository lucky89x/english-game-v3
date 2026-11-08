# English Quest

Game 3D học tiếng Anh cho học sinh THCS (lớp 6-9): thế giới phiêu lưu có cốt truyện, nhiều minigame lồng ghép, kiểm tra cơ bản/nâng cao. Godot 4.7.2, GDScript, chạy trên Windows.

## Quy tắc làm việc
- Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu (người dùng không phải lập trình viên chuyên nghiệp).
- Chỉ push lên GitHub khi người dùng nói "đẩy đi". Mặc định chỉ commit trong máy. Không tạo pull request nếu chưa được yêu cầu.
- Chỉ làm đúng phạm vi được yêu cầu, không dựng lại phần khác. Gom việc, tránh chụp/kiểm tra thừa để tiết kiệm token.
- Chạy test trước khi báo xong; báo trung thực nếu test lỗi hoặc phần nào chưa làm.
- Cuối mỗi phiên: cập nhật `docs/TIEN_DO_PHAT_TRIEN.md` và `docs/TIEN_DO_PHAT_TRIEN.xlsx` (sheet Checklist: cột Trạng thái; sheet Nhật ký phiên, Hiệu năng; sửa bằng openpyxl, giữ công thức ở sheet Tổng quan) và báo tóm tắt tiến độ cho người dùng. Chỉ đánh `[x]` khi người dùng đã nghiệm thu bằng F5.

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

## Định hướng dài hạn (tóm tắt bản bàn giao của chủ dự án)
- Game phiêu lưu fantasy chibi 3D, "game trước, bài học nằm tự nhiên trong gameplay"; không làm chuỗi trắc nghiệm khô khan. Học sinh lớp 6-9, nội dung Global Success (48 Unit, 12 Unit/lớp), soạn nguyên bản, không chép sách/âm thanh có bản quyền.
- Cốt truyện "Bí mật La Bàn Ngôn Ngữ": Ngọc + Tom + tinh linh Pip tìm 8 mảnh la bàn, 8 vùng (Làng Khởi Đầu, Rừng Ký Ức, Sa Mạc Gió Vàng, Dãy Núi Vọng Âm, Hải Cảng, Học Viện, Thành Phố Tương Lai, Đảo Sao). Chỉ làm một vùng/lần, hoàn thiện Làng trước.
- Thứ tự: P0 điều khiển/camera chơi được -> P1 nhiệm vụ "bức thư thất lạc" và vertical slice "Sửa cây cầu" (15-20 phút, bản lớp 6 và lớp 8) -> P2 5 asset chuẩn (Ngọc, Tom, nhà Tom có nội thất, cầu gỗ cong, địa hình) -> P3 làng sống động -> P4 Learning Engine + 48 Unit metadata -> P5 mở rộng từng chương -> P6 đánh giá.
- Tách Learning Engine/dữ liệu khỏi gameplay; lưu tiến độ riêng theo lớp, Unit, kỹ năng; ID ổn định; có saveVersion. Không dùng dữ liệu lớp khác để thế lớp còn thiếu.
- Mỗi task: một mục tiêu, một đầu ra kiểm chứng được; báo ĐÃ CÓ / CHƯA CÓ / CHƯA KIỂM THỬ / ĐÃ NGHIỆM THU; không tự nhận "đạt" khi chưa chạy Godot.
- Thư mục làm việc thật của chủ dự án có thay đổi chưa commit (quest bức thư của Cline...) không nằm trên GitHub; đừng giả định chúng có trong repo. Không dùng `git add -A`, `reset --hard`, `clean`, force push trên bản của chủ dự án.

## Phong cách hình ảnh
- Chibi fantasy, đầu to, màu ấm; không dùng capsule hay khối thô làm sản phẩm.
- Ảnh mẫu: `assets/EnglishQuestV3_Asset_Spec_Codex_2026-11-03/EnglishQuestV3_Asset_Spec_Codex_2026-11-03/04_REFERENCES/` và `assets/assets/reference_art/`.
- Nhân vật, NPC, nhà, cây dựng bằng script Blender trong `tools/chibi05/` (thư viện chung `chibi_lib.py`). Mô tả đầy đủ ở `art_source/chibi05/README.md`.
- Chạy script bằng module `bpy` (`pip install bpy==5.2.3`) từ thư mục gốc repo, ví dụ `python tools/chibi05/build_ngoc_chibi.py`.

## Chạy test (Godot 4.7.2)
- Nhanh: `godot --headless --path . --script res://tests/smoke_test.gd` (cần dòng `SMOKE TEST PASSED`).
- Điều khiển bằng sự kiện phím/chuột thật: `tests/controls_e2e_test.gd` (26 mục).
- Dữ liệu học: `tests/learning_data_test.gd` (16 mục).
- Hồ sơ, ôn cách quãng, chợ Ben: `tests/profiles_market_test.gd` (40 mục).
- Nhiệm vụ Bức thư (chọn lớp, đọc thư, thưởng, lưu/nạp): `tests/lost_letter_quest_test.gd` (39 mục).
- Sửa cây cầu, cầu mới, bản đồ nhỏ: `tests/bridge_repair_quest_test.gd` (31 mục).
- Rương bí mật, âm thanh: `tests/secret_chests_test.gd` (20 mục).
- Đầy đủ: `tests/village_life_test.gd`, `tests/skills_upgrade_test.gd`, `tests/chibi05_hero_test.gd`, `tests/redesign03/validate_characters.gd`, `tests/bridge_traversal_test.gd`.
- Chụp ảnh trong game cần renderer thật: `xvfb-run godot --rendering-driver opengl3 --script res://tests/chibi05_world_capture.gd -- <tiền tố>`.
- Sau khi thêm file model/ảnh mới, chạy `godot --headless --path . --import` để tạo file `.import`.

## Lưu ý kỹ thuật
- File nặng (glb, png, blend...) dùng Git LFS: cần `git lfs pull` sau khi tải. Push cần mạng cho phép `lfs.github.com`.
- Nhánh làm việc: `claude/adoring-wozniak-7dif4v`. Không đụng vào `main`.
- Hướng nhân vật/NPC: mặt hướng +Z của Godot; 1 đơn vị = 1 m. Nhân vật chính cao ~1,55 m.
- Dữ liệu học ở `data/learning/` (units.json 48 Unit + nội dung từng Unit), đọc qua `systems/learning_catalog.gd`; lớp nào chưa có nội dung thì báo, không lấy lớp khác thế. Từ vựng 12 Unit lớp 6 và 8 nhập từ `data/source/sgk_notes_vocab.txt` (sổ tay của chủ dự án trên Drive `game english > global`) bằng `python tools/learning/import_sgk_words.py`; lớp 7, 9 nhập từ `data/source/web_vocab_g7_g9.txt` (VietJack) bằng `python tools/learning/import_sgk_words.py data/source/web_vocab_g7_g9.txt --tag vietjack`; `make_outlines.py` gắn trạng thái outline/vocab/playable. Ôn lớp dưới (có chủ đích, ghi nhận riêng) khác với lấy lớp khác thế nội dung còn thiếu: ôn thì được, thế thì không. Nguồn học liệu khác (đề, giáo án, sách tham khảo) có bản quyền: chỉ lấy khung từ vựng/ngữ pháp, không chép bài đọc hay đề vào game.
- Hồ sơ từng con: `systems/profile_store.gd` (`user://profiles.json`, mỗi hồ sơ một file `user://profile_<id>.json`), màn chọn `systems/profile_menu.gd` (chỉ hiện khi bấm F5, test không hiện). Tiến độ lưu bởi `systems/game_state.gd` (nhóm `game_state`, có `version`, `use_profile()`). Test phải đặt `GameState.override_path` (và `ProfileStore.index_path` nếu tạo hồ sơ) trước khi nạp world.
- Ôn cách quãng: `systems/word_review.gd` (hộp Leitner theo từng từ, chỉ lớp hiện tại và lớp dưới). Chợ Ben "Hũ Chữ": `systems/word_market.gd` (node Systems/WordMarket, quầy ở (-5, 18.5)); ngày đầu là kiểm tra đầu vào ẩn. Nguyên tắc: học tự nhiên trong lúc chơi, không khóa di chuyển, không hiện chữ "kiểm tra"/"ôn tập" với trẻ.
- Quest "Bức thư thất lạc": `systems/lost_letter_quest.gd` (node Systems/LostLetterQuest); Tom gọi `handle_tom()` qua `quest_giver_id`; thư sinh ra trong nhà Tom khi `building_travel` phát `room_entered`. Làm xong thư thì Tom chuyển sang `systems/bridge_repair_quest.gd` ("Sửa cây cầu": cầu Nam ở (10.5, 44) hỏng đến khi sửa; model `prop_bridge_broken_v02.glb` dựng bằng `build_props_chibi.py bridge_broken`). Bảng chọn đáp án: `debug_hud.show_choices()` (phím 1-9, khóa di chuyển); khung hội thoại neo giữa-dưới, tự cao lên khi chữ dài. Lời nhân vật cần đọc kỹ (khách ở chợ) đưa vào `debug_hud.show_request()` (khung trên cùng), không thả chữ 3D lơ lửng.
- Rìu trong "Sửa cây cầu" do Ben đưa sau một buổi chợ (`word_market.round_finished`). Pip: `assets/npc/models/npc_pip_spirit_v02.glb` (`tools/chibi05/build_pip_chibi.py`).
- Rương bí mật khóa chữ: `systems/secret_chests.gd` (4 vị trí trong `CHESTS`, cờ `flags.secret_chests`).
- Âm thanh: `systems/game_sound.gd` (nhóm `sound`, gọi `get_tree().call_group("sound", "play", "correct")`; bus SFX, Music). File tự tổng hợp bằng `python tools/audio/make_sounds.py`, không dùng âm thanh có bản quyền.
- HUD góc phải trên: bản đồ nhỏ `ui/minimap.gd` (vẽ từ VillageLayout: đường, sông, nhà, `BRIDGES`, `AREAS`; dấu "!"/"?" là Label3D trong nhóm `quest_marker`), dưới nó là thẻ nhiệm vụ.
- Khu ven sông (`world/zones/starter_village/river_areas.gd`): Cầu Trại Gỗ, Cầu Cuối Sông, Bến câu cá, Trại gỗ. Đã bỏ cầu tàu cũ, đá và cây chắn đường; kiểm tra lại khi thêm đồ vật mới (không đặt vật có va chạm trên đường hay đầu cầu).
- Nội thất cửa hàng và thư viện, quầy chợ, hàng rào, rương vẫn là asset Quaternius cũ. Cầu gỗ cong, nội thất nhà Tom, cột đèn, biển chỉ đường, cổng Rừng Ký Ức là asset chibi05 (`tools/chibi05/build_props_chibi.py`; đặt bởi `village_props.gd`, `chibi_bridge.gd`).
- Bố cục bản đồ (240 m) nằm ở `world/zones/starter_village/village_layout.gd`: đường (ROADS), nhà xóm (HAMLET), sông. Đường lát đá, shader nền, rải cây và đặt nhà đều đọc từ đây; sửa bố cục thì sửa file này.
- Hiệu năng: cây/cỏ dùng MultiMesh chia ô 32 m + bản cây xa (`veg_*_lod_v02.glb`); bóng mặt trời 2 tầng, 45 m. Đo bằng Performance monitor trước khi tối ưu.
