# Lộ trình 12 Unit Global Success ↔ 12 bản đồ (21/11)

Mỗi bản đồ dạy **một Unit** của sách Global Success đúng lớp của con: Map N ↔ Unit N. Hai con chơi cùng bản đồ nhưng mỗi con học từ vựng, ngữ pháp của lớp mình (lớp 6 / lớp 8). Phụ huynh vẫn chọn Unit khác ở ⚙ (ô Unit) khi cần ôn.

Nội dung trong game do game tự soạn: chỉ lấy khung từ vựng, chủ điểm, điểm ngữ pháp; câu hỏi, bài đọc, lời thoại tự viết (không chép sách). Từ thêm vào cho đủ chủ điểm được đánh dấu `"source": "game (21/11)…"` trong `data/learning/`.

| Bản đồ | Chủ đề bản đồ | Lớp 6 | Lớp 8 | Trạng thái |
|---|---|---|---|---|
| Map 1 | Làng Khởi Đầu + Rừng Ký Ức | My New School (39 từ) | Leisure Time (52 từ) | đã có |
| Map 2 | Cảng Mặt Trời + Đảo Kho Báu | My House (28 từ) | Life in the Countryside (48 từ) | đã có |
| Map 3 | Thị trấn Bạn Bè (câu lạc bộ, trường) | My Friends (25 từ) | Teenagers (37 từ) | dự kiến |
| Map 4 | Phố Chợ Hàng Xóm | My Neighbourhood (54 từ) | Ethnic Groups of Viet Nam (27 từ) | dự kiến |
| Map 5 | Vịnh Kỳ Quan (hang động, thác) | Natural Wonders of Viet Nam (42 từ) | Our Customs and Traditions (37 từ) | dự kiến |
| Map 6 | Lễ hội Tết – Phong tục | Our Tet Holiday (17 từ) | Lifestyles (35 từ) | dự kiến |
| Map 7 | Đài Truyền Hình | Television (26 từ) | Environmental Protection (50 từ) | dự kiến |
| Map 8 | Sân Vận Động | Sports and Games (33 từ) | Shopping (45 từ) | dự kiến |
| Map 9 | Thành Phố Thế Giới | Cities of the World (28 từ) | Natural Disasters (37 từ) | dự kiến |
| Map 10 | Làng Tương Lai | Our Houses in the Future (35 từ) | Communication in the Future (36 từ) | dự kiến |
| Map 11 | Rừng Xanh Bảo Vệ Môi Trường | Our Greener World (43 từ) | Science and Technology (37 từ) | dự kiến |
| Map 12 | Trạm Vũ Trụ – Robot | Robots (38 từ) | Life on Other Planets (30 từ) | dự kiến |

## Mỗi bản đồ mới cần gì (khuôn mẫu Map 1, Map 2)
1. Vùng đất mới (regionkit) + 1 thị trấn an toàn (SAFE trong `core/rules.js`) + 2 vùng quái + 1 boss có khiên chữ.
2. Chuỗi nhiệm vụ chính (5–7 bước) dùng từ vựng Unit N; nhiệm vụ ngày; bảng săn quái.
3. Rương khóa chữ, bong bóng chữ, cổng Cú Mèo (ôn từ), bài kiểm tra cuối bản đồ (8/10 câu đúng để mở bản đồ sau).
4. 2–3 mini game có lồng tiếng Anh theo chủ điểm Unit (ví dụ Unit 8 Sports: đua chạy tiếp sức; Unit 7 Television: đoán chương trình).
5. Nhạc nền riêng (thêm một style trong `src/audio.js`).

## Gợi ý mở rộng
- Map 3 (Unit 3: My Friends / Teenagers): câu lạc bộ trường, mạng xã hội an toàn, kết bạn — hợp tuổi cấp 2.
- Có thể làm trước Map 6 (Tết) vào dịp Tết để con hứng thú.
