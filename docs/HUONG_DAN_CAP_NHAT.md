# Hướng dẫn cập nhật game về máy test (Windows)

Game nằm ở nhánh `fable/web-rebuild` của repo `lucky89x/english-game-v3`. Game chạy trong trình duyệt (Chrome hoặc Edge), cần một "máy chủ nhỏ" chạy trên chính máy đó, không cần Internet khi chơi.

## Cách mới (khuyên dùng): bản cài đặt English Quest (.exe)
Bản .exe tự dùng card đồ họa rời nếu máy có, không cần Python hay trình duyệt.
1. Vào https://github.com/lucky89x/english-game-v3/releases , mở bản **English Quest (bản mới nhất)**.
2. Tải **EnglishQuest-Setup-….exe** ở mục Assets, nháy đúp để cài. Windows có thể hỏi "Windows protected your PC": bấm **More info → Run anyway** (file chưa có chữ ký số).
3. Mở **English Quest** trên màn hình Desktop. F11: toàn màn hình.
- **Cập nhật:** mỗi lần có bản mới chỉ cần tải bộ cài mới và cài đè. Trên GitHub chỉ giữ **một** bản mới nhất (bản cũ tự bị xóa).
- **Tiến độ không bị mất khi cập nhật:** mỗi lần lưu, game ghi thêm vào thư mục **Documents\EnglishQuest** (file `store.json`, kèm thư mục `backups` giữ 14 ngày gần nhất). Cài đè hay cài lại, game tự đọc lại từ đó.
- Chuyển từ bản trình duyệt sang bản .exe: ở bản trình duyệt bấm ⚙ → **Xuất hồ sơ**, rồi ở bản .exe chọn **Nhập hồ sơ (JSON)** ở màn hình chọn người chơi.
- Máy **không có card đồ họa**: bản .exe tự chọn đồ họa **Thấp**; bấm ⚙ để thử Vừa nếu máy đủ khỏe.

## Cách cũ: chạy trong trình duyệt
### Lần đầu: cài 2 thứ (một lần duy nhất)
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
Thấy dòng `Already up to date.` là đã mới nhất. Lưu tiến độ của các bé **không mất** khi cập nhật (lưu trong trình duyệt), miễn là luôn mở đúng một địa chỉ và một trình duyệt (xem bên dưới).

## Chạy game
```bat
cd %USERPROFILE%\Documents\english-quest
py -m http.server 8000
```
Để nguyên cửa sổ đen đó (đóng là tắt game). Mở Chrome/Edge, vào: **http://localhost:8000**

- Sau khi cập nhật, bấm **Ctrl + F5** trên trang game để trình duyệt lấy bản mới.
- Luôn dùng đúng địa chỉ `http://localhost:8000` (cùng số 8000, cùng một trình duyệt, không dùng `127.0.0.1`, không bật chế độ ẩn danh): tiến độ lưu theo địa chỉ này. Tải game về một thư mục mới hay đổi số cổng thì sẽ như chơi lại từ đầu; khi đó bấm ⚙ → **Xuất hồ sơ** ở bản cũ rồi **Nhập hồ sơ** ở bản mới.
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
- Lời thoại ngắn hơn.
- **📖 Học từ** (phím B): xem lại tất cả từ của Unit đang học.
- Lần đầu dùng đọc to trên Windows: nếu không nghe tiếng, vào Cài đặt Windows → Thời gian và ngôn ngữ → Giọng nói, thêm giọng tiếng Anh (Mỹ).

## Có gì mới (17/11, lượt 3)
- **Quảng trường Nhiệm vụ** giữa làng có đài phun nước; Tom và **bảng nhiệm vụ săn quái** ở đây, biển chỉ đường ra từng khu. Thêm nhiều đường đi mới.
- Cây cao hơn, ít hơn. Dấu **!** vừa cỡ, sáng dịu.
- **Ngôi sao vàng**: có 12 ngôi sao giấu quanh làng; chạm vào được 3 vàng, đủ 12 sao thưởng thêm 20 vàng (đếm ở ô ★ trên góc trái).
- Camera bớt chóng mặt: gặp nhà che thì camera nâng lên, không thụt vào thụt ra.

## Có gì mới (17/11, lượt 4): Map 2 Rừng Ký Ức đủ vòng chơi
- Bảng nhiệm vụ săn quái riêng ở đường vào rừng (dơi, nấm).
- 5 rương khóa chữ và 10 bong bóng chữ trong rừng (từ Unit 2).
- Boss **Nữ hoàng Nấm** thức dậy ở cấp 30, bãi trống phía Tây tàn tích; phá 3 khiên chữ bằng từ tiếng Anh.
- Cú Mèo ôn tập thêm ở cấp 25 và 30.

## Có gì mới (18/11)
- Bản cài đặt **.exe** (xem đầu file). Game tự hạ/nâng độ phân giải để luôn mượt, đồ họa Cao vẫn giữ đủ hiệu ứng.
- Mỗi trò chơi có một người giữ trò đứng cạnh biển: cô Hana (hứng táo), cô Mimi (xếp kẹo), chú Rex (bắn ná), anh Leo (đua xe), bác Max (xếp hình). Các trò đặt xa nhau.
- Xếp hình: rơi nhanh hơn, **bấm chuột để xoay**. Bắn ná: vẽ lại slime và bóng bay, bay chậm hơn.
- Nhà Lily, nhà Anna dời ra xa hơn.

## Có gì mới (18/11, lượt 2)
- **Tài khoản quản trị**: ở màn hình chọn người chơi bấm **🔑 Quản trị**, mật khẩu **321**. Trong game bấm nút **🛠 Admin** (hoặc F2): đi tới mọi nơi, đặt cấp, thêm vàng, không mất máu, mở hết, chọn bước nhiệm vụ để kiểm tra.
- **Bấm chuột xuống đất** là Ngọc tự đi tới đó (kéo chuột vẫn để xoay camera).
- Hồ sơ mới có **phần mở đầu cốt truyện** trước chuyến thuyền. Lời thoại **không còn nút Bỏ qua**.
- **Bắn ná** hết treo, mục tiêu là drone bia và đĩa bay. **Xếp hình** nhanh hơn, mỗi hàng xóa được tặng một từ tiếng Anh. **Đua xe** mới: đánh vần từ bằng xu chữ cái, có 3 xe đối thủ. Cuối trò, chủ trò hỏi lại vài từ.
- **Cửa hàng** mới: kệ gỗ, mỗi món có biểu tượng, giá, cấp cần có; chủ quầy Bram và Rose có nút **Talk** và **📜 Word quest** (hỏi tên tiếng Anh các món, có thưởng).
- **Nhà Anna = Phòng nhạc**: đứng trước cửa bấm E, nghe 4 bài hát kèm lời tiếng Anh và nghĩa tiếng Việt. Bài của BLACKPINK có bản quyền nên chỉ có nút mở kênh YouTube chính thức (cần mạng).

## Có gì mới (18/11, lượt 3)
- **Sổ nhiệm vụ** (phím **N** hoặc nút 📜 dưới khung nhân vật): tab **Chính tuyến** (làm lần lượt để lên cấp, mở Map 2…) và tab **Hằng ngày** (3 việc mới mỗi ngày). Xong việc bấm **Nhận thưởng**.
- **Vào trong nhà**: đứng trước cửa bấm E. Cửa hàng, phòng nhạc nhà Anna, **nhà trưởng làng** (xem nhiệm vụ chính tuyến), **nhà Lily** (nhiệm vụ ngày).
- **Đồ mới cho Map 2**: quầy của Willow trong rừng (gần cổng vào rừng), mở khi tới Map 2: kiếm lõi sồi, kiếm ánh trăng, áo choàng kiểm lâm, giáp vỏ cây, lông cú, súp rừng.
- Thỏ, chó, gà vẽ lại đẹp hơn.

## Phím chơi
WASD đi · Shift chạy · Space nhảy · E nói chuyện/nhặt · J đánh · K né · Q ăn bánh · I túi đồ · B sổ từ · N sổ nhiệm vụ · F2 admin · bấm chuột xuống đất để đi · H gợi ý · chuột trái kéo để xoay · lăn chuột để zoom · bấm bản đồ nhỏ để tự đi.
Phụ huynh: nút **⚙** góc dưới trái → ô **Unit** để chọn Unit con đang học trên lớp.


## Nghe nhạc của gia đình trong phòng nhạc (18/11)
- Chép file nhạc `.mp3` vào thư mục `Documents\EnglishQuest\music` (game tạo sẵn khi mở phòng nhạc của Anna).
- Muốn hiện lời: thêm file `.txt` cùng tên với file nhạc.
- Mỗi lần nghe trọn bài tốn 10 vàng của nhân vật.
