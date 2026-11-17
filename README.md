# English Quest — Web (Three.js)

Game học tiếng Anh lớp 6–9 chạy trên trình duyệt, không cần cài đặt. Chơi chung một thế giới; từ vựng, thư, câu hỏi lấy theo lớp của hồ sơ.

Hiện có **Map 1 – Làng Khởi Đầu + Đồng Hoang** và **Rừng Ký Ức**:
- Truyện có tiếng Anh: Bức thư thất lạc, Hũ chữ của Ben, Sửa cây cầu, pha lê ký ức.
- Chơi không tiếng Anh: câu cá, hứng táo, chạy vòng, 12 sao ẩn, xếp kẹo, súng cao su, xếp hình, đua xe.
- Làng: đường rộng, dân làng đi lại, cối xay gió, ao, bãi tập, khu trại; cửa hàng có biển hiệu, vào trong xem hàng, mua và bán đồ.
- Nhập vai: cấp 1–20 (khoảng 8–10 giờ), máu, đánh quái (slime, golem, Vua Slime cấp 8, Golem Cổ cấp 18), cửa hàng, trang bị; thắng Golem Cổ ở cấp 20 mở Map 2.
- Tiếng Anh gắn vào vòng chơi: rương khóa chữ, khiên chữ của boss, bảng nhiệm vụ, Cú Mèo ôn tập mỗi 5 cấp (cấp 10/15/20 có thêm 2 câu ngữ pháp), ôn cách quãng. Unit đi theo map; phụ huynh chọn được Unit ở thanh cài đặt.
- Mini game thưởng đầy đủ 3 lượt đầu mỗi ngày, sau đó 20%.

## Chạy thử
```bash
python3 -m http.server 8000     # chạy trong thư mục có index.html
```
Mở http://localhost:8000. three.js nằm sẵn trong `vendor/`.

## Điều khiển
WASD đi · Shift chạy · Space nhảy · E tương tác · J/F đánh · K né · Q ăn bánh · I túi đồ · H gợi ý · Esc thoát bàn chơi · kéo chuột trái để xoay · lăn chuột để zoom · bấm bản đồ nhỏ để tự đi · F3 xem FPS.
Máy tính bảng: cần ảo bên trái, nút E/⚔/né/nhảy/bánh/chạy bên phải, kéo một ngón để xoay, chụm hai ngón để zoom (thử trên máy tính: thêm `?touch=1` vào địa chỉ).

## Kiểm thử
```bash
node --test tests/unit.test.mjs      # luật chơi và bản đồ, vài giây
node tests/quick.mjs [--only combat,owl,arcade,unit,touch,forest]   # kiểm nhanh từng nhóm, 2–6 phút
node tests/e2e.mjs                   # cả cốt truyện trong trình duyệt thật (cần playwright), 20–25 phút trên máy không GPU
node tests/look.mjs out/look [village|forest]   # ảnh duyệt mỹ thuật chụp trong game
node tests/profile.mjs               # phần nào trong cảnh nặng nhất
```
Thêm `--shots screenshots` vào e2e chỉ khi muốn cập nhật 8 ảnh tiêu biểu trong repo (`--all-shots` chụp hết, không commit).
`python3 tools/review_sheet.py` tạo lại bảng đối chiếu nội dung `docs/DOI_CHIEU_NOI_DUNG.html`.

## Dựng lại model (Blender)
```bash
pip install bpy==4.2.0 pillow numpy          # Python 3.11
PY=python tools/chibi05/build_all.sh         # ~1 phút: dựng, giảm tam giác, nướng bóng khe, chép vào assets/, kiểm tra hoạt ảnh
```

## Tài liệu
`docs/MAP1_PLAN.md` (kế hoạch và trạng thái), `GAME_DESIGN.md`, `LEARNING_DESIGN.md`, `ART_DIRECTION.md`, `ASSET_MANIFEST.md`, `PERFORMANCE_BUDGET.md`, `reference_art/` (ảnh mẫu của chủ dự án).

## Ghi chú trung thực
- Thư, Sửa cây cầu và câu ngữ pháp có cho cả 4 lớp (Unit 1); ngữ pháp lớp 7, 9 và 47/48 Unit chưa được đối chiếu với sách: giáo viên tick trong `docs/DOI_CHIEU_NOI_DUNG.html`.
- Map 2 hiện là Rừng Ký Ức với từ Unit 2; quái và boss riêng của Map 2 chưa có.
- Model dựng bằng script, giống ảnh mẫu về khối, màu, phụ kiện; chưa đạt mức chi tiết của tranh.
- FPS trên máy thật không card đồ họa chưa được đo.
- Chưa có nội thất, giọng đọc, nút chạm cho máy tính bảng. Map 3–10 chưa dựng.
