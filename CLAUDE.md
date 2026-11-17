# English Quest — bản web (nhánh `fable/web-rebuild`)

Game học tiếng Anh lớp 6–9 bằng Three.js, JavaScript thuần, không build. Người dùng là công chức, không chuyên lập trình; hai con học lớp 6 và lớp 8. Bản Godot (các nhánh khác) đã đóng băng.

## Quy tắc làm việc
- Trả lời tiếng Việt, ngắn. Cuối mỗi lượt báo checklist: đã làm · còn lại · đề xuất.
- Xong mỗi lượt: cập nhật mục **Tiến độ** cuối file này rồi mới commit (người dùng hay chuyển sang hội thoại mới).
- Chỉ push khi người dùng nói "đẩy đi" (mỗi lần nói chỉ áp dụng cho phần việc lúc đó). Đẩy lên `fable/web-rebuild`. Không tạo pull request.
- Không dùng `git add -A`, `reset --hard`, `clean`, force push. Luôn `git add` từng đường dẫn.
- Nội dung có bản quyền (sách, đề thi): chỉ lấy khung từ vựng, ngữ pháp. Bài đọc, câu hỏi, lời thoại phải tự viết.
- Lớp chưa có nội dung thì game nói "chưa được soạn"; không mượn nội dung lớp khác.
- Trò chơi kỹ năng không hỏi tiếng Anh. Tiếng Anh nằm ở nhiệm vụ, rương, boss, Cú Mèo (tỉ lệ khoảng 70% chơi, 30% học).

## Lệnh
```bash
node --test tests/unit.test.mjs        # vài giây; chạy sau mọi thay đổi
node tests/quick.mjs --only combat,owl # nhóm: boot combat unit owl arcade map2 forest bag shop intro touch; 2–6 phút, dùng cho lượt sửa nhỏ
node tests/e2e.mjs                     # cả cốt truyện, 20–25 phút trên máy không GPU; chạy nền, một lần cho mỗi cụm thay đổi
node tests/look.mjs <tiền tố> [village|forest] [quality] [tên,…]   # ảnh duyệt mỹ thuật trong game (ngoc_close, ngoc_side…)
python3 tools/review_sheet.py          # tạo lại bảng đối chiếu nội dung docs/DOI_CHIEU_NOI_DUNG.html
node tests/profile.mjs                 # tam giác và lệnh vẽ theo vật thể
PY=<python có bpy 4.2> tools/chibi05/build_all.sh   # dựng lại model, ~1 phút
```
- e2e cần `playwright` phân giải được từ thư mục cha (`node_modules/playwright`).
- Chỉ thêm `--shots screenshots` ở mốc lớn: chỉ ghi 8 ảnh tiêu biểu (danh sách KEEP trong e2e).
- Không sửa file trong lúc e2e đang chạy (bước tải lại trang sẽ lấy file dở dang).

## Cấu trúc
- `src/core/`: luật thuần, test được bằng node (bản đồ `regionkit`/`layout`, `nav` A*, `save` (EXP, cổng, `unitOf`), `review`, `rules` chiến đấu–cửa hàng–nhiệm vụ–boss–giới hạn thưởng, `grammar` câu ngữ pháp cổng Cú Mèo, `match3`, `blocks`, `spell`).
- `src/game/`: truyện làng (`village`), rừng (`quest`), quái (`combat`), mini game (`minigames`), rương (`chests`), lời thoại (`content`).
- `src/world/`: `index.js` (buildWorld), `common.js` (đất, nước, cây, cỏ, đèn, biển, `bake`/`compact`, `rnd` có seed: giữ thứ tự gọi để cảnh không đổi), `village.js`, `forest.js`. `src/ui/`: HUD, hộp thoại, bản đồ nhỏ, bàn chơi `arcade`, nút chạm `touch` (?touch=1 để thử).
- `data/learning/g<lớp>_u<unit>.json`: từ vựng; trường `status`, `vocabulary_checked` cho biết đã đối chiếu chưa.
- `docs/MAP1_PLAN.md`: kế hoạch và trạng thái; cập nhật cột Trạng thái khi xong một hạng mục.

## Bẫy đã gặp
- Máy chủ đám mây không có GPU: FPS đo được (1–2) không phản ánh máy thật; thời gian trong game dùng thời gian thật.
- Giảm tam giác trong Blender làm mất skin nếu không chọn lại rig + mesh trước khi xuất; `build_all.sh` kiểm tra việc này.
- Bóng khe (AO) nướng vào màu đỉnh: nhân vật 0.6, nhà 0.3 (tường phẳng ít đỉnh sẽ bị xám nếu mạnh hơn); không nướng lên mặt.
- Biển trò chơi đặt sát NPC làm phím E mở nhầm; giữ khoảng cách trên 4 m.
- Tải Blender bản đầy đủ bị chặn; dùng `pip install bpy==4.2.0` với Python 3.11 (máy này: `/workspace/.bpyenv/bin/python`).
- Lily, Rose, Anna xuất không có hoạt ảnh (`CHIBI_NO_ANIM=1`) và mượn clip của Ngọc lúc chạy; đổi xương của Ngọc thì phải dựng lại cả 4.
- Shader chèn thêm (paint, windy) phải nối chuỗi `onBeforeCompile` và có `customProgramCacheKey`; GLSL chèn đầu shader phải kết thúc bằng xuống dòng (nếu không dính vào `#define`).
- Hậu kỳ làm khung hình trên máy không GPU ~3 s (mức Thấp ~1 s): test cần chờ lâu (e2e `setDefaultTimeout(120000)`, giữ phím W 5 s). Không phản ánh máy thật có card đồ họa.
- Thêm địa điểm/đổi bản đồ: dùng `latePaths`/`lateClear`/`pathWiden`/`lateRiverHalf`/`thinTrees` (regionkit, áp dụng SAU khi sinh cây) để không xáo trộn cây đã sinh theo seed; đổi `treeFree`/`paths` sẽ làm cây mọc lại chỗ khác và hỏng test vị trí.
- Test trang thứ hai trong cùng trình duyệt chạy chậm: `__eq.pause(true)` dừng vẽ trang chính, `setDefaultTimeout(120000)`.
- Sửa code bằng script dễ nuốt mất dòng (chú thích `//` chèn giữa dòng): unit test cuối kiểm cú pháp mọi file `src/`.

## Tiến độ (cập nhật cuối mỗi lượt làm việc, trước khi commit)
Cập nhật mục này mỗi khi xong việc, để phiên/hội thoại mới đọc là nắm được ngay.

**Lần cập nhật:** 2026-11-17 (lượt 3, góp ý chơi thử) · nhánh `fable/web-rebuild` · unit 38/38 · quick + e2e: QUICK_E2E

**Đã có (Map 1 + Rừng):**
- Truyện: Bức thư, Hũ chữ của Ben, Sửa cây cầu cho cả lớp 6–9 (lớp 8 dùng ngữ pháp Unit 1: động từ sở thích + V-ing), pha lê Rừng Ký Ức.
- Nhập vai: cấp 1–20 (9.405 EXP ≈ 8–10 giờ), J/F đánh, K né, Q ăn bánh; Đồng Hoang; Vua Slime cấp 8, Golem Cổ cấp 18 (Đông Nam); thắng Golem Cổ ở cấp 20 mở Map 2 (Rừng Ký Ức, từ Unit 2); cửa hàng Bram, Rose.
- Tiếng Anh trong vòng chơi: rương khóa chữ, bảng nhiệm vụ, khiên chữ của 2 boss, Cú Mèo cấp 5/10/15/20 (10/15/20 thêm 2 câu ngữ pháp, có cho Unit 1 cả 4 lớp). Unit theo map; phụ huynh chọn Unit ở thanh cài đặt.
- Trò chơi không tiếng Anh (8 trò): thưởng đầy đủ 3 lượt đầu mỗi trò mỗi ngày, sau đó 20%.
- Túi đồ (phím I, nút 🎒): mặc/cởi; giáp và cỏ bốn lá hiện trên người (`src/game/gear.js`, gắn xương chest/hips).
- Phía Nam làng (D1): cối xay gió, ao, bãi tập, khu trại (`src/world/village.js`, vị trí `SOUTH` trong `core/regions/village.js`).
- Map 2: Dơi Bóng Tối, Nấm Giận Dữ trong rừng (`FOREST_SPAWNS` trong rules.js), chỉ khi `flags.map2`.
- Máy tính bảng: cần ảo + nút chạm (chưa thử máy thật).
- Hướng dẫn cập nhật máy test: `docs/HUONG_DAN_CAP_NHAT.md`.
- Mỹ thuật: tóc lọn cong thuôn nhọn (M1) cho Ngọc, Lily, Rose, Anna; bóng khe nướng vào màu đỉnh; cây tán tròn (lá dạng thẻ đã BỎ theo ý anh 17/11: "xấu hơn trước").
- Góp ý chơi thử 17/11 đã làm: camera không còn tự thu/phóng khi qua tán cây (chóng mặt), mượt theo thời gian thật; bỏ giếng giữa quảng trường; dấu !/? vàng nổi trên đầu NPC giao việc; đường làng rộng ×1,45; 5 dân làng đi lại (`src/game/walkers.js`, E để chào); câu cá chậm hơn; mở đầu ngồi thuyền xuôi sông tới bến (E bỏ qua; test cần `?intro=1`); sông rộng 9,2 m; bớt 40% cây trong làng; biển hiệu cửa hàng/nhà trưởng làng; cửa hàng bấm E ở cửa (7.6, −8) mở cảnh bên trong: mua, mặc, bán nửa giá (`src/ui/shop.js`, `sell()` trong rules).
- Đồ họa kiểu saltline (học từ realskyrin/fps3ademo-saltline, chỉ đọc): `src/render/post.js` hậu kỳ tự viết (bloom 2 tầng, tone map, chỉnh màu ấm, tối viền) + bề mặt vẽ tay bằng shader (`paint()` trong common.js: loang màu, hạt, vệt cỏ) + bầu trời làm ánh sáng môi trường + lấp lánh mặt nước + viền hoạt hình quanh nhân vật (`src/render/outline.js`, inverted hull dùng chung xương). Chỉ bật ở mức Vừa/Cao; tia nắng (radial blur về phía mặt trời) chỉ ở mức Cao vì mặt trời cao nên ít khi thấy. Mức Thấp như cũ.

**Còn lại:** boss Map 2 và nhiệm vụ/rương riêng của Rừng Ký Ức cho Map 2; Map 3 (Sa mạc Gió Vàng).

**Báo cáo rà soát 16/11 (anh đã duyệt hết):** xong N2 N3 N4 N5 T1 T2 T3 T4 K1 K2 K3 K4 K5 K6 M1. N1: đã có bảng `docs/DOI_CHIEU_NOI_DUNG.html`, chờ giáo viên tick rồi gửi dòng mã. M2 thay bằng shader vẽ tay (không cần file ảnh). Anh đã bỏ Tripo (M3). Anh tự làm: Q1/Q4 xóa nhánh trên GitHub (em không có quyền xóa nhánh), Q2 tắt skill trong Cài đặt, Q5 gõ /compact thành dòng riêng, Q6 dùng /caveman lite. Q3 giữ nguyên. M3/M4 (dịch vụ AI 3D, thuê họa sĩ) cần anh làm/chi tiền, em tích hợp khi có file.

**Chưa xác nhận:** FPS trên máy thật không card đồ họa; nút chạm trên máy tính bảng thật; ngữ pháp Unit 1 lớp 6 (hiện tại đơn + tiếp diễn hay + trạng từ tần suất).
