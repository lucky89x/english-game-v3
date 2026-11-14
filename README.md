# English Quest — Web (Three.js)

Bản web nhẹ của English Quest, tách khỏi bản Godot (`lucky89x/english-game-v3`). Hiện có: khu **Rừng Ký Ức** chơi được (nhiệm vụ "Echoes of the Forest", lớp 6–9), hồ sơ nhiều học sinh, bản đồ nhỏ có tự đi (A*), gợi ý theo cấp, ôn cách quãng.

## Chạy thử
```bash
python3 -m http.server 8000     # chạy trong thư mục có index.html
# mở http://localhost:8000
```
Không cần cài gì thêm (three.js nằm trong `vendor/`).

## Kiểm thử
```bash
node --test tests/unit.test.mjs                                  # logic: bản đồ, tìm đường, ôn tập, lưu, nhiệm vụ (13 mục)
npm i playwright && node tests/e2e.mjs --shots screenshots       # trình duyệt thật (39 mục)
```

## Điều khiển
WASD đi · Shift chạy · Space nhảy · E tương tác · H gợi ý · giữ chuột trái kéo để xoay · lăn chuột để zoom · bấm bản đồ nhỏ để tự đi · F3 hiệu năng.

## Tài liệu
`docs/`: REPOSITORY_AUDIT, GAME_DESIGN, ART_DIRECTION, LEARNING_DESIGN, ASSET_MANIFEST, PERFORMANCE_BUDGET, IMPLEMENTATION_PLAN, measurements.json. Ảnh chụp: `screenshots/`.

## Đăng lên GitHub Pages
Repo → Settings → Pages → Deploy from a branch → chọn nhánh chứa `index.html`, thư mục `/ (root)`. Không cần bước build.

## Ghi chú trung thực
- Mới có Rừng Ký Ức (Chương II); Làng Khởi Đầu và các chương còn lại chưa port.
- Ngọc, Tom, Sam, Pip dùng lại model GLB của bản Godot. Chưa có nhân vật mới, nội thất, giọng đọc.
- FPS đo bằng trình dựng phần mềm (không GPU), không phản ánh máy thật.
- `data/learning/` copy từ bản Godot.
