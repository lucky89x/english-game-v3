# Nối Mỏ vàng sương núi vào game

- File mới `src/ui/mountain_miner/miner.js`, factory `mountainMiner(cards, rnd = Math.random)`. Export `vocabulary(cards)` dùng để kiểm thử bộ từ.
- Import `{ mountainMiner }` từ đường dẫn tương ứng. Mở qua `arcade.start(mountainMiner(unitCards))`.
- Id đề xuất `mountain_miner`. Bảng hiện `E · Mỏ vàng sương núi`. Đặt ở sân trống trước cửa mỏ thuộc map núi, cách cửa và NPC ít nhất 3 đơn vị. Người nối chọn tọa độ theo layout map núi thực tế.
- Bắt buộc cung cấp cards của đúng Unit đang học. rnd tùy chọn để kiểm thử. Không cần DOM, Three.js, âm thanh hay ảnh.
- Object có info() bổ sung cho overlay hiện tại. Tọa độ đầu vào 560 × 560. click thực hiện thao tác, down/drag/up có sẵn để tương thích. Không gọi click thêm một lần từ down.
- Game chính xử lý Escape, phí vào chơi và lưu kết quả. done() trả null đến khi bấm Nhận thưởng, rồi trả {id,score,text,words}. Kết quả có thể đọc lại, bên gọi đóng ván và ghi nhận đúng một lần.
- words chứa cả từ Unit và từ dự phòng thực sự đã gặp. Id bắt đầu miner_basic: là từ dự phòng, người nối cần bỏ qua khi lưu vào hệ ôn tập chỉ chấp nhận id Unit.
- Ván thua ở lại màn hình để chơi lại. Quyết định thu phí cho lượt chơi lại thuộc game chính.
- Không có ảnh hoặc GLB. Canvas tự vẽ mọi chi tiết.
- Chưa nối bảng, chưa chọn tọa độ map núi, chưa kiểm tra trên điện thoại thật hoặc trình duyệt thật. Test Node kiểm tra pool từ, thắng, thua, chơi lại, tạm dừng và dữ liệu trả về.
- Chạy `node --test tests/mountain_miner.test.mjs`.
