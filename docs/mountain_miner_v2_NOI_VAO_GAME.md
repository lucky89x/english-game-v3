# Mỏ vàng sương núi phiên bản 2

Import `mountainMinerV2(cards, rnd)` từ `src/ui/mountain_miner/miner_v2.js`. Mở bằng `arcade.start(mountainMinerV2(unitCards))`. Id kết quả là `mountain_miner`. Bảng gợi ý “E · Mỏ vàng sương núi”, đặt trước cửa mỏ trên map núi. Dùng cards của Unit đang học. Nếu Unit trống, hiện thông báo và dùng từ cơ bản. Bên nhận bỏ qua id có tiền tố miner_basic: nếu chỉ lưu thẻ Unit.

Ba vòng có mục tiêu lần lượt 140, 160 và 180 điểm, mỗi vòng 65 giây. Vàng cỡ lớn đáng nhiều điểm và kéo chậm hơn. Đá cũng có nhiều cỡ. Vàng và ngọc mở câu hỏi từ vựng, đồng hồ dừng khi trả lời. Mỗi vòng có một túi sức mạnh. Kéo túi lên để tăng sức chứa thể lực từ 100 lên 150, nạp đầy và nhân ba tốc độ kéo. Mức tăng kết thúc khi sang vòng. Kết quả chỉ trả sau nút Nhận thưởng. Game chính xử lý phí, Escape và lưu kết quả.

Tranh `assets/ui/mountain_miner_v2.webp` tải lười. Âm thanh tổng hợp bằng Web Audio sau thao tác đầu tiên. Nút Loa hoặc M để bật tắt. Không cần mô hình, tệp âm thanh hoặc thư viện ngoài. Tọa độ nút tính theo canvas 560 × 560.

Chưa nối vào map núi. Mã v2 độc lập với v1. Chạy `node --test tests/mountain_miner_v2.test.mjs`.

Nguồn cảm hứng cơ chế móc lắc và trọng lượng: https://arcadethunder.com/puzzle-games/gold-miner

Tranh tạo bằng ImageGen tích hợp. Prompt gốc

Original square 2D cozy hand painted browser mining arcade game background, cross section. Upper exactly 31 percent shows blue misty mountain silhouettes outdoors, at x 64 percent a clearly readable cute full-body adult village miner in green cap saffron scarf cream shirt brown trousers stands with arms extended to left operating a small wooden winch near horizontal center x50%, on timber platform at y30%. Person occupies x56–76% y12–31%. Leave top 12% quiet sky for UI. Dirt cutaway below y33% fills rest, painterly deep slate indigo and umber rock, scattered tiny flecks and edge roots only. Large clear open subdued playfield throughout middle below ground for game objects to overlay. NO gold nuggets, no stones as obstacles, no gems, no rope, no hook, no text or labels, no signs, no UI. Original cozy polished gouache, village storybook, broad forms and readable proportions, square.
