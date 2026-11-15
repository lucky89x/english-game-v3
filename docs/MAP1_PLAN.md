# Kế hoạch Map 1 — Làng Khởi Đầu + Đồng Hoang

Mục tiêu: trẻ muốn chơi tiếp vì trò chơi vui. Tiếng Anh nằm trong nhiệm vụ, rương, cửa hàng, boss; trò chơi kỹ năng không hỏi tiếng Anh.

## Nguyên tắc
- 70% thời gian là chơi (hành động, mini game, khám phá). 30% là tiếng Anh, chia nhỏ, có lý do trong truyện.
- Mọi hoạt động đều cho EXP và vàng. Vàng mua trang bị. Trang bị giúp đánh quái và mở khu mới.
- Map 1 có 20 cấp. Lên cấp bằng EXP. Cổng sang map 2 mở khi đạt cấp 20 và thắng boss.
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
| A2 | Cấp 1–20 | Đường cong EXP, hiệu ứng lên cấp, chỉ số tăng theo cấp | một phần (có EXP, cấp) |
| A3 | Chiến đấu | Đánh thường (J/F), máu, đẩy lùi, hồi sinh ở làng | xong (chưa có né) |
| A4 | Đồng Hoang | Đông Bắc làng: slime xanh, slime đỏ, golem đá | xong (chưa có dơi) |
| A5 | Cửa hàng + trang bị | Bram bán kiếm và giáp, Rose bán bùa và bánh hồi máu (phím Q) | xong |
| A6 | Túi đồ | Kiếm hiện trên tay Ngọc; chưa có màn hình túi đồ riêng, giáp chưa đổi hình | một phần |
| A7 | Boss map 1 | Vua Slime; đòn đặc biệt mở bằng câu trả lời từ vựng Unit | chưa |
| B1 | Xếp kẹo (match-3) | Biển phía Tây quảng trường, 25 lượt, có combo | xong |
| B2 | Đua xe | Xe bí ngô quanh làng, né chướng ngại | chưa |
| B3 | Bắn súng cao su | Kéo thả ná, đạn bay vòng cung, slime và bóng bay | xong |
| B4 | Xếp hình (khối rơi) | Bãi chơi phía Tây, phím mũi tên | xong |
| B5 | Câu cá, hứng táo, chạy vòng, 12 sao | Đã có | xong |
| C1 | Tiếng Anh trong truyện | Thư, Hũ chữ, Sửa cầu | xong (lớp 6, 8) |
| C2 | Rương khóa chữ | 5 rương ở Đồng Hoang, ghép từ Unit theo nghĩa, 1 lần/ngày, vào ôn tập | xong |
| C3 | Nhiệm vụ săn quái có lời thoại tiếng Anh | NPC giao việc bằng câu mẫu Unit | chưa |
| C4 | Cổng kiến thức mỗi 5 cấp | Ôn cách quãng | chưa |
| D1 | Lấp đất trống | Bãi tập, đường đua, trại, ao, cối xay | chưa |
| D2 | Nhẹ máy | Tải 17.7 → 10.9 MB; 723 → 210 vật thể vẽ; tự hạ đồ họa | xong, chờ đo FPS máy thật |

## Thứ tự làm
1. A1 HUD → A2 cấp → A3 chiến đấu → A4 Đồng Hoang (lõi "train").
2. A5 cửa hàng → A6 túi đồ.
3. B1–B4 mini game kỹ năng (mỗi lượt 1–2 trò).
4. C2–C4 gắn tiếng Anh vào vòng chơi → A7 boss → cổng map 2.
5. D1, D2 trau chuốt.

## Checklist mỗi lượt
Mỗi lượt báo: đã làm · còn lại · đề xuất nâng cấp. Bảng trên được cập nhật cột Trạng thái.
