# Tiến độ của bé: lưu ở đâu, cập nhật game có mất không, lấy lại khi có sự cố (27/11, lượt 73)

## Lưu ở đâu

Bản cài trên Windows (.exe) ghi tiến độ của mọi bé trên máy đó vào thư mục **`Documents\EnglishQuest`** của tài khoản Windows đang dùng:

| File | Là gì |
|---|---|
| `store.json` | bản lưu mới nhất (ghi lại mỗi lần game lưu) |
| `backups\store-<năm>-<tháng>-<ngày>.json` | bản sao của từng ngày có chơi; giữ 14 ngày gần nhất |
| `backups\store-before-….json` | bản lưu ngay trước mỗi lần anh bấm khôi phục; giữ 10 bản gần nhất |
| `backups\store-rescue-….json` | bản cứu hộ game tự cất khi thấy bản lưu sắp bị ghi đè bằng một bản trống; giữ 10 bản |

Thư mục này nằm ngoài thư mục cài game.

## Cập nhật game

Tải file cài mới rồi cài đè lên bản cũ. Bộ cài không đụng tới `Documents\EnglishQuest`, nên tiến độ của bé còn nguyên.

Đã kiểm (27/11): một bản lưu do bản game ngày 25/11 ghi ra được nạp vào bản mới nhất, cấp, vàng, EXP, từ đã học, nhiệm vụ đều y nguyên. Bản lưu đó nay nằm trong bộ kiểm thử tự động, nên bản cập nhật nào làm hỏng dữ liệu cũ sẽ bị chặn trước khi tới tay anh. Chưa kiểm được: thao tác cài đè trên một máy Windows thật (lần cập nhật đầu tiên, anh mở game xem tên bé còn trong danh sách rồi hãy cho bé chơi).

Ba điều không nên làm:

1. Không xoá thư mục `Documents\EnglishQuest`.
2. Không cài một bản CŨ đè lên bản mới: bản cũ từ chối đọc bản lưu do bản mới hơn ghi.
3. Không cho hai bé chơi cùng một tên người chơi.

## Lấy lại tiến độ của một bé (nút Khôi phục bản sao lưu)

Dùng khi một bé lỡ bị xoá, bị bạn chơi hộ làm hỏng, hoặc anh muốn đưa bé về một ngày trước.

1. Vào game bằng tài khoản **Quản trị**, bấm **F2** (bảng 🛠 Admin).
2. Tìm mục **💾 Khôi phục bản sao lưu**. Mỗi nút là một ngày có bản sao.
3. Bấm một ngày: bảng hiện từng bé có trong bản sao đó (cấp, vàng, số từ đã học) và tình trạng của bé đó trong game hiện nay để anh so.
4. Bấm **Khôi phục <tên bé>**, rồi bấm lần nữa để xác nhận.

Chỉ bé được chọn quay về ngày đó; các bé khác và tài khoản Quản trị giữ nguyên. Trước khi thay, game cất bản lưu hiện tại thành một nút "Trước lần khôi phục …" trong cùng danh sách, nên bấm nhầm vẫn quay lại được.

Bản chạy trong trình duyệt không có các bản sao theo ngày (mục này chỉ hiện dòng giải thích).

## Chuyển bé sang máy khác

- Một bé: trong game bấm ⚙, bấm **Xuất hồ sơ** để lấy file `english-quest-<tên>.json`; ở máy mới, tại màn hình chọn người chơi, bấm **Nhập hồ sơ (JSON)** và chọn file đó.
- Cả máy: chép nguyên thư mục `Documents\EnglishQuest` sang đúng chỗ đó ở máy mới TRƯỚC khi mở game lần đầu.
