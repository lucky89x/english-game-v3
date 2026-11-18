# Nhạc của gia đình (phòng nhạc của Anna)

Game không kèm bài hát hay lời bài hát có bản quyền. Phụ huynh tự chép nhạc của mình vào:

- **Bản cài đặt (.exe):** thư mục `Documents\EnglishQuest\music` (game tự tạo khi mở phòng nhạc).
  Chép file `.mp3` vào đó. Muốn hiện lời: thêm file `.txt` **cùng tên** (ví dụ `Tên bài.mp3` + `Tên bài.txt`).
- **Bản chạy trên trình duyệt:** chép file vào thư mục này (`assets/music/`) và viết `list.json`:

```json
[{ "title": "Tên bài", "file": "ten-bai.mp3", "lyrics": "ten-bai.txt" }]
```

Mỗi lần phát cả bài tốn 10 vàng. File lỗi không phát được thì vàng được trả lại.
