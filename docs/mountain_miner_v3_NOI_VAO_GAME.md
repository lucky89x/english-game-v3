# Mỏ vàng sương núi v3

Import `mountainMinerV3(cards, rnd = Math.random)` từ `src/ui/mountain_miner/miner_v3.js`. Dùng `arcade.start(mountainMinerV3(unitCards))`. Giữ id `mountain_miner`. Bảng gợi ý “E · Mỏ vàng sương núi” trước cửa mỏ, tọa độ theo bản đồ thực tế. Game chính xử lý phí, thoát ván và lưu kết quả.

Nhấp hoặc chạm một lần vào bàn để phóng càng theo góc đang lắc. Đường thẳng đến mép nếu trượt. Đá che vàng nên cần kéo đá ra trước. Ba vòng, mỗi vòng có một túi thể lực. Túi tăng sức chứa, nạp đầy và tăng tốc kéo gấp ba đến hết vòng. Mỗi lượt chơi có kim cương ở một trong ba vòng. Kim cương đáng 100 điểm, gấp đôi cục vàng lớn nhất. Điểm không in trên vật.

Nhận cards của Unit hiện tại. Các từ dự phòng có id miner_basic:, lọc chúng khi lưu nếu sổ ôn tập chỉ nhận id của Unit. Hình nền dùng lại `assets/ui/mountain_miner_v2.webp` tải lười. Càng kẹp và vật phẩm vẽ bằng canvas. Nút loa trên cùng hoặc phím M, âm thanh tổng hợp. Chưa nối vào map núi.

Cảm hứng móc lắc và trọng lượng từ Gold Miner truyền thống.
https://arcadethunder.com/puzzle-games/gold-miner
