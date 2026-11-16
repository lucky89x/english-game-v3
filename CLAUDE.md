# English Quest — bản web (nhánh `fable/web-rebuild`)

Game học tiếng Anh lớp 6–9 bằng Three.js, JavaScript thuần, không build. Người dùng là công chức, không chuyên lập trình; hai con học lớp 6 và lớp 8. Bản Godot (các nhánh khác) đã đóng băng.

## Quy tắc làm việc
- Trả lời tiếng Việt, ngắn. Cuối mỗi lượt báo checklist: đã làm · còn lại · đề xuất.
- Chỉ push khi người dùng nói "đẩy đi" (mỗi lần nói chỉ áp dụng cho phần việc lúc đó). Đẩy lên `fable/web-rebuild`. Không tạo pull request.
- Không dùng `git add -A`, `reset --hard`, `clean`, force push. Luôn `git add` từng đường dẫn.
- Nội dung có bản quyền (sách, đề thi): chỉ lấy khung từ vựng, ngữ pháp. Bài đọc, câu hỏi, lời thoại phải tự viết.
- Lớp chưa có nội dung thì game nói "chưa được soạn"; không mượn nội dung lớp khác.
- Trò chơi kỹ năng không hỏi tiếng Anh. Tiếng Anh nằm ở nhiệm vụ, rương, boss, Cú Mèo (tỉ lệ khoảng 70% chơi, 30% học).

## Lệnh
```bash
node --test tests/unit.test.mjs        # vài giây; chạy sau mọi thay đổi
node tests/e2e.mjs                     # 20–25 phút trên máy không GPU; chạy nền, một lần cho mỗi cụm thay đổi
node tests/look.mjs <tiền tố>          # ảnh duyệt mỹ thuật trong game
node tests/profile.mjs                 # tam giác và lệnh vẽ theo vật thể
PY=<python có bpy 4.2> tools/chibi05/build_all.sh   # dựng lại model, ~1 phút
```
- e2e cần `playwright` phân giải được từ thư mục cha (`node_modules/playwright`).
- Chỉ thêm `--shots screenshots` ở mốc lớn: mỗi lần ghi đè khoảng 3 MB ảnh vào lịch sử git.
- Không sửa file trong lúc e2e đang chạy (bước tải lại trang sẽ lấy file dở dang).

## Cấu trúc
- `src/core/`: luật thuần, test được bằng node (bản đồ `regionkit`/`layout`, `nav` A*, `save`, `review`, `rules` chiến đấu–cửa hàng–nhiệm vụ, `match3`, `blocks`, `spell`).
- `src/game/`: truyện làng (`village`), rừng (`quest`), quái (`combat`), mini game (`minigames`), rương (`chests`), lời thoại (`content`).
- `src/world/forest.js`: dựng cảnh cho CẢ làng và rừng (tên file cũ). `src/ui/`: HUD, hộp thoại, bản đồ nhỏ, bàn chơi `arcade`.
- `data/learning/g<lớp>_u<unit>.json`: từ vựng; trường `status`, `vocabulary_checked` cho biết đã đối chiếu chưa.
- `docs/MAP1_PLAN.md`: kế hoạch và trạng thái; cập nhật cột Trạng thái khi xong một hạng mục.

## Bẫy đã gặp
- Máy chủ đám mây không có GPU: FPS đo được (1–2) không phản ánh máy thật; thời gian trong game dùng thời gian thật.
- Giảm tam giác trong Blender làm mất skin nếu không chọn lại rig + mesh trước khi xuất; `build_all.sh` kiểm tra việc này.
- Bóng khe (AO) nướng vào màu đỉnh: nhân vật 0.6, nhà 0.3 (tường phẳng ít đỉnh sẽ bị xám nếu mạnh hơn); không nướng lên mặt.
- Biển trò chơi đặt sát NPC làm phím E mở nhầm; giữ khoảng cách trên 4 m.
- Tải Blender bản đầy đủ bị chặn; dùng `pip install bpy==4.2.0` với Python 3.11.
