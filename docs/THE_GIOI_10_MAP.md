# Thế giới 10 map, cổng dịch chuyển, khu mini game (thiết kế 23/11)

Nguồn: bản đồ thế giới anh gửi (ảnh "Bản đồ thế giới – English Quest") và yêu cầu 23/11. Anh đã chọn: **theo thứ tự trong bản đồ của anh**, **mở rộng Làng Khởi Đầu trước**. Ba map xây trước: **Làng (1), Biển cả (2), Rừng xanh (3)**; bảy map sau anh cập nhật.

## 1. Mười vùng và các đường đi

| # | Vùng | Cấp gợi ý | Trạng thái |
|---|---|---|---|
| 1 | Làng Khởi Đầu | 1–5 | có, sẽ mở rộng |
| 2 | Biển cả (cảng, đảo kho báu) | 5–10 | có, phải hạ cấp quái từ 21–28 xuống 5–10 |
| 3 | Rừng xanh (Rừng Ký Ức) | 10–20 | có, giữ cấp quái 11–18 |
| 4 | Sa mạc cát vàng | 15–25 | anh cập nhật sau |
| 5 | Núi non | 20–30 | sau |
| 6 | Vương quốc trên trời | 35–45 | sau |
| 7 | Khu di tích cổ | 25–35 | sau |
| 8 | Đảo thần tiên | 30–40 | sau |
| 9 | Thung lũng núi lửa | 40–50 | sau |
| 10 | Hang tinh thể | 45–55 | sau |

Gợi ý hành trình trong ảnh: 1→2→3→4→5→7, 5→6→8, 5→9→10. Đường đi (cạnh nối hai map) em lấy đúng như vậy:

- 1–2 (cầu phía Tây của làng, ra cảng), 2–3 (đường ven biển vào rừng), 3–4, 4–5, 5–7, 5–6 (tuyến bay khí cầu), 6–8, 5–9, 9–10.
- **Làng nối thẳng với rừng** bằng cổng Rừng sẵn có ở phía Đông Nam: đây là chỗ có **hai đường đi** nên hiện bảng **chọn map** (Biển cả hoặc Rừng xanh).

## 2. Cổng dịch chuyển

- Mỗi map có một hoặc nhiều **cổng dịch chuyển** (vòng cung đá có ánh sáng, đặt ở rìa map, có tên map đích trên biển hiệu).
- Bấm E ở cổng:
  - Chỉ một đường: hộp thoại "Đi tới <map>?" (hiện cấp gợi ý).
  - Hai đường trở lên: **thẻ chọn map** liệt kê các map nối với cổng này, mỗi dòng có khóa/mở và điều kiện còn thiếu.
- Điều kiện mở một cạnh (dữ liệu, kiểm bằng `core/world.js`, có test): cấp tối thiểu, cờ nhiệm vụ (huy hiệu, boss), bài thi của Cú Mèo (cấp 20, 30), mảnh La Bàn. Cạnh đã mở thì đi lại hai chiều.
- Đi qua cổng: mờ dần, vào map đích, đứng ở **cổng đến** của map đó (vùng đi được gần cổng).
- Giao diện **Bản đồ thế giới** (phím W hoặc nút trên thanh): vẽ lại ảnh của anh, bấm vùng đã mở để dịch chuyển nhanh từ **cổng** (không dịch chuyển tức thời từ giữa đồng). Vùng chưa mở hiện mờ và ghi điều kiện.
- Xin anh đẩy file ảnh bản đồ (nên là `.jpg` hoặc `.png` rộng 1600 px trở lên) vào thư mục chung để em dùng làm nền bản đồ.

## 3. Mở rộng map

Làng hiện là vòng tròn bán kính khoảng 60 m (khoảng 11.000 m²). Hướng mở:

1. Mở thêm **vành ngoài** (đến khoảng 110 m, gấp ba lần diện tích) bằng các hàm áp dụng sau khi sinh cây của `regionkit` (`late*`, `thinOuter`) để **không xáo trộn cây đã sinh** và không làm hỏng test vị trí.
2. Vành ngoài chứa: **Khu mini game** (mục 4), **Quảng trường cổng** ở rìa (cổng sang Biển, cổng sang Rừng), thêm đường, đồng cỏ, bãi săn quái cấp thấp.
3. Làm theo từng bước nhỏ, mỗi bước có ảnh kiểm tra: vành ngoài và cổng trước, rồi từng công trình mini game.

## 4. Khu mini game: công trình biểu tượng + NPC + thế giới riêng

- Mỗi mini game có một **công trình lớn** thể hiện trò đó (đường đua có cổng xuất phát và khán đài, trò nấu ăn là quán, câu cá là bến, v.v.), cao hơn nhà thường.
- **NPC chủ trò đứng trước công trình**: bấm E nhận **nhiệm vụ** (ví dụ "về hạng nhất", "hoàn thành 3 từ"), trả lời cổng 4 từ như hiện nay, rồi **vào thế giới trò chơi** (mờ dần sang cảnh riêng, như trò đua xe 3D mới).
- Dữ liệu `MINIGAME_SITES` (id, vị trí, công trình, NPC, nhiệm vụ, hàm bắt đầu) để thêm trò mới chỉ cần thêm một dòng và một mô hình.
- Mô hình công trình: anh có thể thiết kế trong Blender như bộ `Village_Arcade`; em có thể dựng tạm bằng khối rồi thay file của anh khi có.

## 5. Các trò mới (đã tra cứu, đề xuất chuyển thể để học tiếng Anh)

Em chỉ dùng **ý tưởng cơ chế**, vẽ và viết lại hoàn toàn bằng tài sản của game (không chép hình, âm thanh, tên của game gốc).

| Trò gốc | Cơ chế gốc (đã tra) | Chuyển thể cho game | Map gợi ý |
|---|---|---|---|
| **Grindstone** (Capybara Games, Apple Arcade 2019) | Giải đố chiến đấu: vẽ đường nối chuỗi quái **cùng màu** (8 hướng), chuỗi từ 10 quái trở lên cho đá mài để đổi màu tấn công | **Word Slayer**: mỗi quái mang một từ, màu là chủ đề (động vật, đồ ăn…) hoặc loại từ; nối chuỗi các từ cùng nhóm để chém; chuỗi dài đổi nhóm | 3 Rừng, 5 Núi |
| **Card of Darkness** (Zach Gage và Choice Provisions, 2019) | Hầm ngục thẻ bài theo lượt trên lưới: dọn chồng thẻ để mở chồng sâu hơn, vũ khí bị hỏng nên phải đổi vũ khí | **Word Dungeon**: thẻ từ vựng làm vũ khí, quái là thẻ cần chọn đúng nghĩa; vũ khí hỏng khi trả lời sai; thẻ thuốc, rương | 10 Hang tinh thể, 7 Di tích |
| **Speed Demons** (Radiangames, 2019) | Đua xe nhìn từ trên xuống, vật lý, đường cao tốc tạo ngẫu nhiên, các chế độ đua/rượt/chạy trốn | **Highway Rush**: nhìn từ trên xuống; né xe, nhặt chữ cái và xu; chế độ rượt và chạy trốn có câu hỏi từ | 4 Sa mạc |
| **Tangle Tower** (SFB Games, Apple Arcade 2019) | Trinh thám điểm-và-bấm: tìm bằng chứng, hỏi nghi phạm, **kéo thả từ** vào câu để suy luận | **Tower Mystery**: các câu trả lời của nghi phạm bằng tiếng Anh; kéo thả từ/cụm vào chỗ trống để kết luận; học ngữ pháp qua manh mối | 7 Di tích |
| Đua thuyền (anh nêu) | | Dùng lại động cơ **Race3D** với đường nước, thuyền, phao, đảo | 2 Biển cả |
| Bắn máy bay nhìn ngang (anh nêu) | | **Sky Ace**: máy bay cuộn ngang, bắn **bóng chứa từ đúng nghĩa**, né mây giông | 6 Vương quốc trên trời |

Nguồn đã đọc: [Grindstone](https://wikipedia.com/wiki/Grindstone_(video_game)), [Card of Darkness](https://en.wikipedia.org/wiki/Card_of_Darkness), [Tangle Tower](https://Www.Wikipedia.org/wiki/Tangle_Tower), [Speed Demons](https://toucharcade.com/2019/10/02/apple-arcade-speed-demons-review/).

## 6. Đua xe hai người qua mạng (hai máy)

- Hai máy cùng đua: mỗi máy tự mô phỏng xe mình, gửi vị trí (quãng đường, làn, tốc độ, đồ nhặt/bắn) khoảng 15 lần mỗi giây; xe còn lại chạy bằng máy.
- Cách kết nối (cần anh chọn):
  1. **Cùng mạng nhà** (khuyên dùng trước): bản `.exe` mở một máy chủ nhỏ trên máy thứ nhất, máy thứ hai nhập mã phòng. Đơn giản, không cần dịch vụ ngoài.
  2. **Qua Internet**: dùng dịch vụ trung gian miễn phí hoặc WebRTC, phức tạp hơn và phụ thuộc bên thứ ba.
- Em làm khi trò đua đơn đã ổn định và anh chọn cách kết nối.

## 7. Thứ tự làm

1. Lõi bản đồ thế giới: `core/world.js` (đồ thị, điều kiện, test) + thẻ chọn map + cổng ở ba map (xong trước).
2. Hạ cấp Biển cả xuống 5–10, đổi thứ tự mở map theo ảnh, đổi số Unit theo số map.
3. Mở rộng Làng (vành ngoài, quảng trường cổng).
4. Khung `MINIGAME_SITES`, đưa đua xe và câu cá vào làm hai khu đầu tiên.
5. Các trò mới theo thứ tự: đua thuyền, Sky Ace, Word Slayer, Highway Rush, Word Dungeon, Tower Mystery.
6. Đua xe hai người.
