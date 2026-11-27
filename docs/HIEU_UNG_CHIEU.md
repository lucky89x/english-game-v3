# Hiệu ứng chiêu phép: đã vẽ lại gì, còn thiếu gì, anh có thể giúp gì (27/11, lượt 72)

Anh nhận xét: "hiệu ứng skill bây giờ xấu và kém quá". Em đã chụp 16 chiêu theo từng khung hình để xem lại và đồng ý: hiệu ứng cũ chỉ gồm vòng tròn phẳng một màu, khối cầu trơn và các chấm tròn mờ, nhỏ so với màn hình, không có cảm giác lực.

## Em đã tự làm được (không cần file ảnh nào)

Viết lại toàn bộ phần hình của 16 chiêu (`src/game/spells.js`) trên một bộ công cụ mới (`src/game/vfx.js`). Phần luật (ai trúng, lúc nào, bao nhiêu sát thương, hồi chiêu, mana) giữ nguyên.

| Kỹ thuật | Trước | Nay |
|---|---|---|
| Màu | một màu phẳng, cộng sáng nên cháy trắng trên nền cỏ | dải 3 tông (đậm → giữa → lõi nóng trắng); thân pha màu thường để giữ đúng màu, chỉ viền và lõi phát sáng |
| Chuyển động bên trong | không có | vân nhiễu cuộn qua mọi hình: lửa liếm, gió cuốn, sương lan |
| Lúc tàn | mờ dần đều | "ăn mòn": hình bị khoét từ chỗ mỏng trước, tan thành từng vệt như lửa tắt |
| Vòng phép dưới chân | một vòng tròn có vài nét | vòng phép riêng từng hệ (ngọn lửa, bông tuyết, xoáy gió, tia sét), vẽ dần ra rồi xoay và tan |
| Chém cận chiến | hình khuyên phẳng | lưỡi cong có viền nóng trắng, quét qua rồi tan từ đuôi; băng thì mọc tinh thể, sét thì toả tia trên mặt đất |
| Đạn bay | quả cầu trơn + chấm | cầu lửa có vỏ sôi, giáo băng dạng tinh thể, lưỡi gió xoay; sau đuôi là một dải vệt bám theo đường bay |
| Nổ | một chớp + vài chấm | quả cầu phình ra rồi bị ăn mòn, sóng lan trên mặt đất, vết nứt cháy đỏ rồi nguội đen, đá văng, khói |
| Sét | ống trắng đứng yên | tia giật lại hình liên tục, có nhánh phụ, cột sáng chỗ đánh xuống, vết cháy |
| Lốc xoáy | một đám sương xanh | phễu 3 lớp quay khác tốc độ, nghiêng lắc, bụi xoáy dưới chân, lá cuốn theo |
| Bão tuyết | đĩa mờ + chấm rơi | sàn đóng băng, vòng phép băng, hai tường tuyết xoáy, tinh thể mọc liên tục |
| Chiêu cuối | gần như chỉ là vòng tròn to | Hoả ngục: tường lửa dâng lên rồi cột lửa và quả cầu nổ; 0 độ tuyệt đối: vòm băng và cả rừng tinh thể; Mắt bão: hai phễu lớn; Phán quyết: mưa sét rồi cột sáng kết thúc |
| Cảm giác lực | không | rung nhẹ máy quay theo cỡ vụ nổ, một ánh sáng loé chiếu lên cảnh xung quanh |

Công cụ kèm theo: `node tests/fx_look.mjs <thư mục> medium` chụp mỗi chiêu thành một tờ ảnh theo từng mốc thời gian, để so trước và sau mỗi lần sửa.

## Em chưa kiểm được, cần anh xem trên máy thật

1. **Chuyển động thật**: em chỉ xem được ảnh tĩnh từng khung (máy đám mây vẽ 1 khung hình/giây). Nhịp nhanh chậm, độ rung, cảm giác "đã tay" phải nhìn trên máy có card đồ hoạ.
2. **Mức đồ hoạ Thấp**: mức này tắt lớp toả sáng (bloom) nên lõi sáng sẽ kém rực hơn mức Vừa/Cao. Em mới chụp ở mức Vừa.
3. **Tốc độ khung hình** khi dùng chiêu cuối giữa đàn quái trên máy yếu.
4. **Độ chói**: rung và chớp sáng em để ở mức nhẹ vì người chơi là trẻ em. Nếu anh thấy vẫn chói thì ghi chú, em giảm hoặc thêm nút tắt.

Cách xem nhanh: vào tài khoản Quản trị, bấm **F1**, mở mục "✨ Xem hiệu ứng chiêu", bấm từng chiêu (có nút xem chậm ¼), thấy chỗ nào chưa ưng thì ghi chú ngay tại đó rồi xuất file gửi em. Hướng dẫn: `docs/HUONG_DAN_GOP_Y_F1.md`.

## Những thứ sẽ làm hiệu ứng tốt hơn nữa mà anh có thể nghiên cứu hoặc cung cấp

Xếp theo mức đáng làm:

1. **Một hình mẫu anh thích.** Một đoạn phim hoặc vài ảnh chụp chiêu phép của một trò chơi anh thấy đẹp (kiểu hoạt hình tươi sáng, kiểu anime nét đậm, hay kiểu ánh sáng mềm). Em sẽ chỉnh màu, độ dày nét, nhịp theo hướng đó. Đây là thứ giúp nhiều nhất mà không tốn gì.
2. **Âm thanh riêng cho từng chiêu.** Hiện mỗi hệ chỉ có một tiếng chung và một tiếng nổ. Tiếng động quyết định một nửa cảm giác của hiệu ứng. Anh có thể tìm tiếng động miễn phí bản quyền loại CC0 (ví dụ bộ của Kenney, hoặc mục CC0 trên các trang âm thanh miễn phí): tiếng vung kiếm lửa, tiếng băng vỡ, gió rít, sét đánh, nổ lớn, tiếng tụ lực. Định dạng `.ogg` hoặc `.mp3`, mỗi tiếng dưới 3 giây. Em gắn vào đúng thời điểm.
3. **Ảnh hiệu ứng vẽ tay dạng tờ khung hình (sprite sheet / flipbook)** nếu anh muốn nét vẽ tay kiểu hoạt hình mà mã không sinh ra được: ngọn lửa, vụ nổ, khói, vệt chém. Yêu cầu: ảnh PNG nền trong suốt, các khung xếp lưới đều (4×4 hoặc 8×8), mỗi khung 128–256 px, màu trắng xám (em tô màu theo hệ), giấy phép cho dùng trong sản phẩm. Lưu ý: Tripo3D không làm được loại này (nó dựng mô hình 3D, không vẽ hiệu ứng); các công cụ vẽ ảnh bằng AI làm được khung đơn nhưng khó ra chuỗi khung liền mạch.
4. **Hoạt ảnh ra chiêu của nhân vật.** Hiện nhân vật chỉ có một động tác "Interact" và cú vung tay. Nếu có các clip riêng (vung kiếm ngang, giơ tay niệm phép, đấm xuống đất, giơ hai tay lên trời) thì hiệu ứng khớp với người hơn nhiều. Phần này em có thể tự dựng bằng Blender trên bộ xương hiện có khi anh muốn.
5. **Phản ứng của quái khi trúng chiêu**: chớp trắng, giật lùi, đóng băng thành khối, bốc cháy vài giây. Em tự làm được, chưa làm trong lượt này.

## Việc em đề xuất làm tiếp cho hiệu ứng (khi anh đã xem trên máy thật)

- Sửa theo file góp ý F1 của anh.
- Quái phản ứng khi trúng (mục 5 ở trên).
- Hiệu ứng cho đòn đánh thường, cho quái và trùm (hiện vẫn kiểu cũ).
- Nút "giảm rung và chớp sáng" trong Cài đặt.
