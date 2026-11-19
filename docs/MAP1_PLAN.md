# Kế hoạch Map 1 — Làng Khởi Đầu + Đồng Hoang

Mục tiêu: trẻ muốn chơi tiếp vì trò chơi vui. Tiếng Anh nằm trong nhiệm vụ, rương, cửa hàng, boss; trò chơi kỹ năng không hỏi tiếng Anh.

## Nguyên tắc
- 70% thời gian là chơi (hành động, mini game, khám phá). 30% là tiếng Anh, chia nhỏ, có lý do trong truyện.
- Mọi hoạt động đều cho EXP và vàng. Vàng mua trang bị. Trang bị giúp đánh quái và mở khu mới.
- Map 1 có 20 cấp (9.405 EXP, khoảng 8–10 giờ chơi). Lên cấp bằng EXP. Cổng sang map 2 mở khi đạt cấp 20 và thắng Golem Cổ.
- Nội dung học theo lớp của hồ sơ (6–9). Lớp chưa soạn thì game nói rõ, không mượn lớp khác.

## Cấp và Unit
Chơi chung map, chương trình học theo lớp của hồ sơ. 10 map cho 12 Unit:

| Map | Tên | Unit | Cấp |
|---|---|---|---|
| 1 | Làng Khởi Đầu + Đồng Hoang | 1 | 1–20 |
| 2 | Rừng Ký Ức | 2 | 21–40 |
| 3 | Sa mạc Gió Vàng | 3 | 41–60 |
| 4 | Ôn tập 1: Vườn cây – hội chợ | ôn 1–3 | 61–70 |
| 5 | Núi Vọng Âm | 4–5 | 71–90 |
| 6 | Cảng Đại Dương | 6–7 | 91–110 |
| 7 | Ôn tập 2: Cầu đèn đỏ ban đêm | ôn 4–7 | 111–120 |
| 8 | Học viện Tri thức | 8–9 | 121–140 |
| 9 | Thành phố Tương lai | 10–11 | 141–160 |
| 10 | Đảo Trời + Tháp Pha lê | 12 + thi cuối | 161–180 |

Mỗi 5 cấp có một "cổng kiến thức" (ôn từ đến hạn) mới lên tiếp được.

## Hệ thống cần làm
| # | Hạng mục | Nội dung | Trạng thái |
|---|---|---|---|
| A1 | HUD nhân vật | Khung chân dung, cấp, thanh máu, thanh EXP, vàng, sao | xong |
| A2 | Cấp 1–20 | Đường cong EXP (9.405 EXP ≈ 8–10 giờ), hiệu ứng lên cấp, chỉ số tăng theo cấp | xong |
| A3 | Chiến đấu | Đánh (J/F), né lăn (K), máu, đẩy lùi, hồi sinh ở làng | xong |
| A4 | Đồng Hoang | Đông Bắc làng: slime xanh, slime đỏ, golem đá | xong (chưa có dơi) |
| A5 | Cửa hàng + trang bị | Bram bán kiếm và giáp, Rose bán bùa và bánh hồi máu (phím Q) | xong |
| A6 | Túi đồ | Phím I / nút 🎒: xem chỉ số, mặc/cởi đồ; kiếm trên tay, giáp da/giáp sắt trên ngực, cỏ bốn lá bên hông | xong |
| A7 | Boss map 1 | Vua Slime (cấp 8+), Golem Cổ (cấp 18+, cánh đồng đá Đông Nam); 3 khiên chữ phá bằng từ tiếng Anh | xong |
| A8 | Cổng Map 2 | Thắng Golem Cổ và đạt cấp 20 → mở Map 2 (Cảng Mặt Trời), từ vựng chuyển sang Unit 2 | xong |
| F-1 | Quái chương rừng (cuối Map 1) | Rừng Ký Ức: 5 Dơi Bóng Tối (cấp 11), 5 Nấm Giận Dữ (cấp 14); bật sau khi xong nhiệm vụ pha lê của Pip (19/11: chuyển từ Map 2 về Map 1) | xong |
| F-2 | Boss chương rừng | Nữ hoàng Nấm cấp 16 (trước Golem Cổ cấp 18), bãi trống phía Tây tàn tích, 3 khiên chữ | xong |
| F-3 | Bảng nhiệm vụ rừng | Cạnh đường vào rừng, 4 việc săn dơi/nấm (150–360 EXP), lưu riêng | xong |
| F-4 | Rương + bong bóng chữ rừng | 5 rương khóa chữ, 10 bong bóng chữ dọc đường rừng (từ Unit đang học) | xong |
| M2-5 | Cổng Cú Mèo 25/30 | Ôn từ + 2 câu ngữ pháp Unit 2; cổng 30 là bài thi 10 câu (4 từ + 3 ngữ pháp + 3 câu) mở Map 3 | xong (ngữ pháp chờ giáo viên đối chiếu) |
| M2-6 | Cảng Mặt Trời: quái biển | 5 cua (cấp 21, bãi Nam), 4 sứa (cấp 24, bờ Bắc, bay lơ lửng), 5 cướp biển (cấp 27, mũi hải đăng); model Blender có xương, clip Idle/Walk | xong |
| M2-7 | Boss Map 2 | Thuyền trưởng Bạch Tuộc cấp 28, mũi bắc cạnh hải đăng, 3 khiên chữ Unit 2; đánh bại + cấp 30 → cờ `map3` | xong |
| M2-8 | Bảng săn + rương + bong bóng cảng | Bảng cạnh quảng trường cảng (5 việc cua/sứa/cướp biển, lưu riêng `hunt3`), 6 rương khóa chữ, 10 bong bóng chữ | xong |
| M2-9 | Trò Seaside Café | "Café Chef": khách gọi món bằng tiếng Anh (sandwich, burger, pizza, salad + nguyên liệu, bậc 3 thêm đồ uống) | xong |
| M2-10 | Trò Beauty Salon | Kiểu tóc, màu tóc, son môi, phấn mắt, sơn móng theo lời khách (bậc 1/2/3 = 3/4/5 phần) | xong |
| M2-11 | Chuỗi nhiệm vụ chính Map 2 | map2 → harbor → shops → hunt3 → owl25 → boss4 (Bạch Tuộc cấp 28) → exam2 (bài thi cấp 30); Map 1 có thêm hunt2 và boss3 (chương rừng) | xong |
| M2-12 | Nhiệm vụ ngày của cảng | 5 nhiệm vụ riêng (quái biển, rương, bong bóng, việc ở bảng, 2 trò ở cửa hàng); khi đã mở Map 2 mỗi ngày có 1 nhiệm vụ cảng + 2 nhiệm vụ chung | xong |
| M2-13 | Câu cá + Album biển | Trò câu cá 5 lần (thanh trượt), 18 mục Album biển có nghĩa tiếng Việt và độ hiếm, bán cá ở chợ cá, mốc thưởng | xong |
| M2-14 | Tủ đồ | Khách hoàn hảo ở Boutique/Salon trả phụ kiện (8 loại, 10 màu), mặc lên Ngọc | xong (đổi màu tóc/áo cần tách vật liệu trong Blender) |
| M2-15 | Tàu gia đình + bảng tuần | Điểm chung hai bé, 8 cấp tàu, xếp hạng tuần, báo cáo phụ huynh | xong |
| M2-16 | Thú đồng hành | 3 loài, chăm bằng tiếng Anh (món ăn, lệnh), gắn bó +% vàng, quà hằng ngày | xong |
| M2-17 | Đảo Kho Báu | Đi thuyền từ cầu tàu nhỏ, bản đồ kho báu tiếng Anh (hướng, số bước, giữa hai vật), 2 kho báu/ngày | xong |
| B1 | Xếp kẹo (match-3) | Biển phía Tây quảng trường, 25 lượt, có combo | xong |
| B2 | Đua xe | Xe bí ngô, giữ phím để lái, né đá và bùn, nhặt xu | xong |
| B3 | Bắn súng cao su | Kéo thả ná, đạn bay vòng cung, slime và bóng bay | xong |
| B4 | Xếp hình (khối rơi) | Bãi chơi phía Tây, phím mũi tên | xong |
| B5 | Câu cá, hứng táo, chạy vòng, 12 sao | Đã có | xong |
| C1 | Tiếng Anh trong truyện | Thư, Hũ chữ, Sửa cầu | xong (lớp 6–9; lớp 7, 9 chờ giáo viên đối chiếu) |
| C2 | Rương khóa chữ | 5 rương ở Đồng Hoang, ghép từ Unit theo nghĩa, 1 lần/ngày, vào ôn tập | xong |
| C3 | Nhiệm vụ săn quái có lời thoại tiếng Anh | Bảng nhiệm vụ ở Đồng Hoang, 4 việc xoay vòng, câu ngắn cho lớp 6–7 | xong |
| C4 | Cổng kiến thức mỗi 5 cấp | Cú Mèo hỏi 5 câu (Anh↔Việt); cấp 10/15/20 thêm 2 câu ngữ pháp; sai tối đa 1 câu | xong |
| C5 | Unit theo map | Map 1 = Unit 1, Map 2 = Unit 2; phụ huynh chọn Unit trên lớp ở thanh cài đặt | xong |
| B6 | Giới hạn thưởng mini game | 3 lượt đầu mỗi trò mỗi ngày thưởng đầy đủ, sau đó 20% | xong |
| E1 | Máy tính bảng | Cần ảo, nút chạm, phím mũi tên khi chơi bàn, kéo xoay, chụm zoom | xong (chưa thử trên máy thật) |
| D1 | Lấp đất trống | Phía Nam: cối xay gió, ao sen, bãi tập (hình nộm), khu trại có lửa trại; đường mới và biển chỉ đường | xong |
| D2 | Nhẹ máy | Tải 17.7 → 10.9 MB; 723 → 210 vật thể vẽ; tự hạ đồ họa | xong, chờ đo FPS máy thật |

## Thứ tự làm
1. A1 HUD → A2 cấp → A3 chiến đấu → A4 Đồng Hoang (lõi "train").
2. A5 cửa hàng → A6 túi đồ.
3. B1–B4 mini game kỹ năng (mỗi lượt 1–2 trò).
4. C2–C4 gắn tiếng Anh vào vòng chơi → A7 boss → cổng map 2.
5. D1, D2 trau chuốt.

## Checklist mỗi lượt
Mỗi lượt báo: đã làm · còn lại · đề xuất nâng cấp. Bảng trên được cập nhật cột Trạng thái.
