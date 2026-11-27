# Sổ góp ý (phím F1): anh ghi chỗ muốn sửa ngay trong game, xuất một file gửi cho Claude

Làm ở lượt 72 (27/11) theo yêu cầu của anh: "một bảng debug bật tắt bằng phím F1 gắn vào tài khoản quản trị, muốn chỉnh sửa nội dung nào tôi note luôn vào chỗ đó, sau đó xuất ra 1 file để bạn biết sửa theo cho đúng ý tôi".

## Mở bảng

1. Vào game bằng tài khoản **Quản trị** (nút Quản trị ở màn hình chọn người chơi, mật khẩu của bố mẹ).
2. Bấm **F1**. Bảng "📝 Sổ góp ý" hiện ở mép phải màn hình. Bấm F1 lần nữa để đóng. Tài khoản của các bé bấm F1 không mở được bảng này.

## Viết một ghi chú

1. Đi tới chỗ anh muốn sửa (tài khoản Quản trị đi được mọi vùng bằng bảng 🛠 Admin, phím F2).
2. Dòng "📍 Ghi chú sẽ gắn vào: …" cho biết game sẽ tự ghi kèm những gì: vùng và toạ độ, đang đứng cạnh ai/cái gì, con quái gần nhất, hộp thoại hay bảng nào đang mở, chiêu vừa dùng.
3. Muốn nói về **đúng một thứ trên màn hình** (một nút, một dòng chữ trong hộp thoại, một món hàng, một cái cây, một con quái): bấm **🎯 Chỉ vào một chỗ trên màn hình**, rồi bấm vào thứ đó. Cú bấm này chỉ để "chỉ", không kích hoạt nút.
4. Chọn loại (Hiệu ứng chiêu · Hình ảnh, mô hình · Chữ, tiếng Anh · Cách chơi, độ khó · Lỗi · Âm thanh · Khác) và mức (Cần sửa · Nên sửa · Ý tưởng).
5. Viết điều anh muốn vào ô chữ, bấm **✔ Lưu ghi chú** (hoặc Ctrl+Enter). Nếu ô "kèm ảnh màn hình" đang bật, game chụp luôn một ảnh nhỏ của cảnh lúc đó.

Trong lúc gõ, nhân vật không đi lại theo phím. Ghi chú đã lưu hiện ở cuối bảng và có một tấm biển 📝 #số nổi trong cảnh ở đúng chỗ đã ghi (khi bảng đang mở).

Mỗi ghi chú có các nút: **Tới đó** (đưa nhân vật về đúng chỗ đã ghi), **Sửa**, **✓ Xong**, **Xoá** (bấm hai lần).

## Góp ý về hiệu ứng chiêu

Mở mục **✨ Xem hiệu ứng chiêu** trong bảng:

- 16 nút là 16 chiêu của 4 hệ. Bấm là dùng chiêu ngay, không tốn mana, không cần học, hệ nào cũng dùng được. Nên đứng gần vài con quái để thấy cả lúc trúng.
- **🐢 Xem chậm ¼**: hiệu ứng chạy chậm 4 lần để nhìn kỹ từng giai đoạn.
- **✏️ Ghi chú về chiêu …**: chuyển loại sang "Hiệu ứng chiêu" và ghi chú sẽ ghi rõ tên chiêu.

Gợi ý cách viết để em sửa đúng ý: nói về **màu** (quá trắng, chưa đủ đỏ…), **cỡ** (to/nhỏ hơn bao nhiêu), **thời lượng** (nhanh/chậm quá), **giai đoạn** (lúc tụ lực, lúc bay, lúc nổ, lúc tàn), và nếu có thì **một trò chơi anh thấy đẹp** để em theo hướng đó.

## Xuất file gửi cho Claude

- **💾 Xuất file**: gom mọi ghi chú (kèm ảnh) vào **một file** tên `english-quest-gop-y-<ngày>-<giờ>.json`.
  - Bản cài trên Windows (.exe): file nằm trong `Documents\EnglishQuest\gop-y\`, game mở sẵn thư mục đó.
  - Bản chạy trong trình duyệt: file nằm trong thư mục Tải xuống (Downloads).
- Gửi cho Claude bằng một trong hai cách: kéo thả file vào khung trò chuyện, hoặc chép file vào thư mục dự án rồi chạy `day-code-len-github.bat` như mọi lần và báo tên nhánh.
- **📋 Chép chữ**: chỉ lấy phần chữ (không ảnh) để dán thẳng vào khung trò chuyện khi chỉ có vài ghi chú.
- Xuất xong, khi em đã sửa, anh bấm **🗑 Xoá hết** (hai lần) để bắt đầu đợt góp ý mới. Ghi chú được giữ trong máy cho tới khi anh xoá, tắt game không mất.

## Những điều nên biết

- Ảnh kèm ghi chú chỉ chụp **cảnh 3D**, không chụp được các bảng và hộp thoại (là lớp chữ nằm trên cảnh). Vì vậy chữ của hộp thoại đang mở và tên bảng đang mở được ghi kèm bằng chữ; muốn nói về một dòng cụ thể thì dùng nút 🎯.
- Ghi chú nằm trong bộ nhớ của trình duyệt/bản cài trên **máy đó**. Bộ nhớ này có hạn: khi gần đầy, game bỏ bớt ảnh của ghi chú cũ nhất trước (chữ không mất) và báo cho anh; lúc đó nên Xuất file rồi Xoá hết.
- Phía em đọc file bằng lệnh `node tools/notes_read.mjs <file> <thư mục ảnh>`: in ra từng ghi chú kèm chỗ ghi và tách ảnh ra để xem.
