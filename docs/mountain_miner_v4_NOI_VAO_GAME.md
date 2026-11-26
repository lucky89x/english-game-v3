# Mỏ vàng sương núi v4

Import `mountainMinerV4(cards, rnd = Math.random)` từ `src/ui/mountain_miner/miner_v4.js`. Mở bằng `arcade.start(mountainMinerV4(unitCards))`. Giữ id `mountain_miner`. Đặt bảng “E · Mỏ vàng sương núi” trước cửa mỏ. Game chính xử lý phí và thoát ván.

Nhấp hoặc chạm để phóng móc. Vàng cộng ngay theo kích cỡ, tối đa 50 điểm. Đá chỉ cản đường và cộng 0 điểm. Kim cương xuất hiện ở một trong ba vòng và cộng 100 điểm. Ba vòng có góc, độ sâu và vị trí đá cản riêng. Mỗi vòng giữ một túi tăng thể lực và tốc độ kéo ×3 đến hết vòng. Từ Unit hiện cùng thông báo khi kéo vàng hoặc kim cương, rồi trả về trong words. Id miner_basic: là thẻ dự phòng.

Dùng tranh nền `assets/ui/mountain_miner_v2.webp`, càng kẹp vẽ canvas và hiệu ứng âm qua Web Audio. Chưa nối vào map núi. Chạy `node --test tests/mountain_miner_v4.test.mjs`.
