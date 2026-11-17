# Hướng dẫn cập nhật game về máy test (Windows)

Game nằm ở nhánh `fable/web-rebuild` của repo `lucky89x/english-game-v3`. Game chạy trong trình duyệt (Chrome hoặc Edge), cần một "máy chủ nhỏ" chạy trên chính máy đó, không cần Internet khi chơi.

## Lần đầu: cài 2 thứ (một lần duy nhất)
1. **Git for Windows**: tải ở https://git-scm.com/download/win, cài mặc định (bấm Next liên tục).
2. **Python 3**: tải ở https://www.python.org/downloads/, khi cài **tick ô "Add python.exe to PATH"**.

## Lần đầu: tải game về
Mở **Command Prompt** (bấm phím Windows, gõ `cmd`, Enter), gõ lần lượt:

```bat
cd %USERPROFILE%\Documents
git clone -b fable/web-rebuild https://github.com/lucky89x/english-game-v3.git english-quest
```

Repo riêng tư thì Git sẽ hiện cửa sổ đăng nhập GitHub: đăng nhập bằng tài khoản của anh.

## Mỗi lần có bản mới: cập nhật
```bat
cd %USERPROFILE%\Documents\english-quest
git pull
```
Thấy dòng `Already up to date.` là đã mới nhất. Lưu tiến độ của các bé **không mất** khi cập nhật (lưu trong trình duyệt).

## Chạy game
```bat
cd %USERPROFILE%\Documents\english-quest
py -m http.server 8000
```
Để nguyên cửa sổ đen đó (đóng là tắt game). Mở Chrome/Edge, vào: **http://localhost:8000**

- Sau khi cập nhật, bấm **Ctrl + F5** trên trang game để trình duyệt lấy bản mới.
- Luôn dùng đúng địa chỉ `http://localhost:8000` (cùng số 8000): tiến độ lưu theo địa chỉ này.
- Tiện hơn: tạo file `ChoiGame.bat` trên màn hình Desktop với nội dung dưới, nháy đúp là chạy:

```bat
@echo off
cd /d %USERPROFILE%\Documents\english-quest
git pull
start http://localhost:8000
py -m http.server 8000
```

## Kiểm tra độ mượt (máy không card đồ họa)
1. Vào game, bấm **F3**: góc màn hình hiện `FPS`.
2. Bấm nút **⚙** góc dưới trái, ô **Đồ họa**: thử **Vừa**, đi quanh làng 1 phút, xem FPS.
   - FPS **từ 30 trở lên**: mượt, giữ mức Vừa (có hiệu ứng ánh sáng, viền nhân vật).
   - FPS **dưới 25**: chọn **Thấp** (không có hiệu ứng mới, nhẹ như trước).
3. Gửi lại cho Claude: tên máy/CPU, mức đồ họa, số FPS ở làng và ở rừng.

## Lưu / chuyển hồ sơ của bé
- Nút **Xuất hồ sơ** (góc dưới trái) tải file `.json` về máy: giữ làm bản sao.
- Ở màn hình chọn người chơi có **Nhập hồ sơ (JSON)** để đưa hồ sơ sang máy khác.

## Có gì mới (17/11)
- Hồ sơ mới: Ngọc ngồi thuyền xuôi sông tới bến làng (bấm E để bỏ qua).
- Cửa hàng: đứng trước cửa nhà mái cam có biển **VILLAGE SHOP**, bấm E để vào xem hàng, mua, mặc, bán lại lấy nửa giá.
- Dấu **!** vàng nổi trên đầu người đang có việc cho con; **?** là chỗ cần quay lại báo.
- Dân làng đi lại trên đường; đến gần bấm E để chào.

## Có gì mới (17/11, lượt 2)
- Camera trở lại kiểu cũ (sau lưng Ngọc), nhìn rộng hơn một chút.
- Người giao nhiệm vụ có dấu **!** vàng 3D to, xoay, nhấp nháy, có cột sáng lên trời nhìn từ xa; **?** xanh nhạt là chỗ cần quay lại báo.
- Bảng cài đặt gập vào nút **⚙** góc dưới trái (Đồ họa, Âm thanh, Đọc to, Sổ từ, Unit cho phụ huynh).
- Bật bộ gõ tiếng Việt (Unikey) vẫn đi được bằng WASD; tốt nhất vẫn tắt bộ gõ khi chơi (Ctrl+Shift hoặc Alt+Z).
- Biển gỗ treo trên cửa: VILLAGE SHOP, VILLAGE HALL, LILY'S HOUSE, ANNA'S HOUSE. Đường làng rộng hơn.
- **Bong bóng chữ "Abc"** dọc đường: chạy tới bấm E để học một từ mới (nghe, xem nghĩa, được EXP và vàng). Ben sẽ hỏi lại đúng những từ con vừa học.
- Từ mới được **dạy trước** khi hỏi: thẻ chữ to, đọc to, có nghĩa tiếng Việt.
- Máy **đọc to** lời thoại tiếng Anh (nút "Đọc to" để tắt). Bấm vào từ gạch chân để nghe và xem nghĩa. Nút 🔊 nghe lại.
- Lời thoại ngắn hơn; nút **Bỏ qua ⏭** (hoặc Esc) nhảy tới câu tiếng Việt "việc cần làm".
- **📖 Học từ** (phím B): xem lại tất cả từ của Unit đang học.
- Lần đầu dùng đọc to trên Windows: nếu không nghe tiếng, vào Cài đặt Windows → Thời gian và ngôn ngữ → Giọng nói, thêm giọng tiếng Anh (Mỹ).

## Phím chơi
WASD đi · Shift chạy · Space nhảy · E nói chuyện/nhặt · J đánh · K né · Q ăn bánh · I túi đồ · B sổ từ · Esc bỏ qua thoại · H gợi ý · chuột trái kéo để xoay · lăn chuột để zoom · bấm bản đồ nhỏ để tự đi.
Phụ huynh: nút **⚙** góc dưới trái → ô **Unit** để chọn Unit con đang học trên lớp.
