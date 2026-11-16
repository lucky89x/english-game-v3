# English Quest — Web (Three.js)

Game học tiếng Anh lớp 6–9 chạy trên trình duyệt, không cần cài đặt. Chơi chung một thế giới; từ vựng, thư, câu hỏi lấy theo lớp của hồ sơ.

Hiện có **Map 1 – Làng Khởi Đầu + Đồng Hoang** và **Rừng Ký Ức**:
- Truyện có tiếng Anh: Bức thư thất lạc, Hũ chữ của Ben, Sửa cây cầu, pha lê ký ức.
- Chơi không tiếng Anh: câu cá, hứng táo, chạy vòng, 12 sao ẩn, xếp kẹo, súng cao su, xếp hình, đua xe.
- Nhập vai: cấp, máu, đánh quái (slime, golem, Vua Slime), cửa hàng, trang bị.
- Tiếng Anh gắn vào vòng chơi: rương khóa chữ, khiên chữ của boss, bảng nhiệm vụ, Cú Mèo ôn tập mỗi 5 cấp, ôn cách quãng.

## Chạy thử
```bash
python3 -m http.server 8000     # chạy trong thư mục có index.html
```
Mở http://localhost:8000. three.js nằm sẵn trong `vendor/`.

## Điều khiển
WASD đi · Shift chạy · Space nhảy · E tương tác · J/F đánh · K né · Q ăn bánh · H gợi ý · Esc thoát bàn chơi · kéo chuột trái để xoay · lăn chuột để zoom · bấm bản đồ nhỏ để tự đi · F3 xem FPS.

## Kiểm thử
```bash
node --test tests/unit.test.mjs      # luật chơi và bản đồ, vài giây
node tests/e2e.mjs                   # trình duyệt thật (cần playwright), 20–25 phút trên máy không GPU
node tests/look.mjs out/look         # ảnh duyệt mỹ thuật chụp trong game
node tests/profile.mjs               # phần nào trong cảnh nặng nhất
```
Thêm `--shots screenshots` vào e2e chỉ khi muốn cập nhật bộ ảnh trong repo.

## Dựng lại model (Blender)
```bash
pip install bpy==4.2.0 pillow numpy          # Python 3.11
PY=python tools/chibi05/build_all.sh         # ~1 phút: dựng, giảm tam giác, nướng bóng khe, chép vào assets/, kiểm tra hoạt ảnh
```

## Tài liệu
`docs/MAP1_PLAN.md` (kế hoạch và trạng thái), `GAME_DESIGN.md`, `LEARNING_DESIGN.md`, `ART_DIRECTION.md`, `ASSET_MANIFEST.md`, `PERFORMANCE_BUDGET.md`, `reference_art/` (ảnh mẫu của chủ dự án).

## Ghi chú trung thực
- Nội dung thư và Sửa cây cầu chỉ có lớp 6 và 8; lớp 7, 9 game báo "chưa được soạn". 24/48 Unit có từ vựng chưa được đối chiếu với sách (xem `status` trong `data/learning/*.json`).
- Hồ sơ luôn học Unit 1; chuyển Unit theo map chưa làm.
- Model dựng bằng script, giống ảnh mẫu về khối, màu, phụ kiện; chưa đạt mức chi tiết của tranh.
- FPS trên máy thật không card đồ họa chưa được đo.
- Chưa có nội thất, giọng đọc, nút chạm cho máy tính bảng. Map 3–10 chưa dựng.
