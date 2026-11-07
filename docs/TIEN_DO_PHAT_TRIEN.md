# English Quest V3 — Kế hoạch và tiến độ phát triển

Cập nhật lần cuối: **07/11/2026** (phiên 9). Claude cập nhật file này ở cuối mỗi phiên làm việc.

**Ký hiệu trạng thái**
- `[x]` **ĐÃ NGHIỆM THU**: chủ dự án đã chạy F5 và xác nhận.
- `[~]` **ĐÃ LÀM, CHỜ NGHIỆM THU**: đã code/dựng, test tự động đạt, chủ dự án chưa xác nhận bằng F5.
- `[ ]` **CHƯA LÀM**.

## Tổng quan

| Giai đoạn | Nội dung | Trạng thái |
|---|---|---|
| P0 | Điều khiển, camera, tương tác chơi được | Đã nghiệm thu phần chính; 2 mục chờ duyệt |
| P1 | Nhiệm vụ "Bức thư thất lạc" + vertical slice "Sửa cây cầu" | Bức thư xong (chờ duyệt); Sửa cây cầu chưa làm |
| P2 | 5 asset chuẩn mỹ thuật | Đã dựng đủ 5/5, chờ duyệt |
| P3 | Làng sống động, bản đồ rộng | Đang làm |
| P4 | Hệ thống học (Learning Engine, 48 Unit) | Đã có khung dữ liệu + lưu tiến độ |
| P5 | Mở rộng 7 chương còn lại | Chưa làm |
| P6 | Đánh giá, tối ưu, thử nghiệm với học sinh | Chưa làm |

## P0 — Điều khiển và camera
- [x] WASD di chuyển theo hướng camera, Shift chạy, Space nhảy
- [x] Giữ chuột (phải hoặc trái) kéo để xoay camera, lăn chuột để zoom
- [x] E tương tác với NPC, cửa nhà, rương
- [x] Hội thoại không khóa điều khiển; đi ra xa thì tự đóng hội thoại
- [~] Animation nhảy, rơi, tiếp đất theo trạng thái thật
- [~] Khóa di chuyển khi mở bảng chọn đáp án, tự mở khóa khi chọn xong hoặc nhấn E

## P1 — Nhiệm vụ đầu tiên
- [~] Dựng lại quest "Bức thư thất lạc" trên bản GitHub (không cần file Cline; nếu gửi bản Cline thì cần gộp tay)
- [~] Đầu-cuối theo luồng gốc: Tom hỏi lớp → giao việc → vào nhà Tom (dấu ✉ trên cửa) → tìm thư gần giá sách → đọc thư tiếng Anh, trả lời (sai có gợi ý) → ra trả Tom (dấu ?)
- [~] Thưởng 50 EXP + 20 Vàng đúng một lần; HUD cập nhật
- [~] Lưu và nạp tiến độ (version 1, ghi an toàn + bản .bak)
- [ ] Vertical slice "Sửa cây cầu" (15–20 phút): Tom → Ben → Sam → Pip → tìm vật liệu → nghe chỉ dẫn → sửa cầu → phần thưởng và manh mối vào rừng
- [ ] Hai phiên bản nội dung: lớp 6 và lớp 8 (Bức thư đã có cả hai; Sửa cây cầu chưa)

## P2 — Asset chuẩn mỹ thuật (fantasy chibi)
- [~] Ngọc: chibi đầu to, mặt vẽ, tóc xoăn búi, kính, khăn, 10 animation, chớp mắt
- [~] Tom: áo choàng xanh viền vàng, râu tóc trắng, gậy đèn lồng phát sáng, 5 animation
- [~] Nhà chibi: 8 mẫu (mái đỏ, xanh, cam, xanh lá; hội trường, chuồng bò, kho, tháp)
- [~] Nhà Tom có nội thất mới: lò sưởi đá, giá sách, bàn tròn có bản đồ, giường chăn xanh, rương, thảm tròn, đèn treo
- [~] Cầu gỗ cong mới có lan can, cột đèn hai đầu, mố đá; va chạm bám theo mặt cầu
- [~] Địa hình: cỏ, đất, đá, bờ sông, nước có bọt và gợn sóng
- [~] Cây có lá thật (tấm lá vẽ), vỏ cây có rãnh, bản rút gọn cho cây ở xa

## P3 — Làng sống động
- [~] Nhà to hơn (×1,45) cho cân với nhân vật
- [~] Bản đồ mở rộng 112 m → 240 m, đồi viền và núi xa dời ra ngoài
- [~] Đường lát đá đều toàn bộ mạng đường (12 tuyến), có đá viền hai bên
- [~] Ba xóm mới: xóm Tây (7 nhà), vườn cây phía Đông (4 nhà), đồng cỏ phía Nam (3 nhà)
- [~] Đường lên cổng Rừng Ký Ức (chưa có cổng và biển báo)
- [~] NPC dân làng: Ben (bán hàng), Sam (ngư dân), đi dạo theo tuyến
- [~] Cổng Rừng Ký Ức (đóng, có biển và lời nhắn "mở ở Chương II"), 5 biển chỉ đường song ngữ Anh–Việt, cột đèn ven đường
- [ ] Thêm NPC: Pip, Lily, Rose, Anna; lịch sinh hoạt theo giờ
- [ ] Nội thất các nhà mới; nhà ở xóm mới hiện chưa vào được
- [ ] Rương, bí mật, nhiệm vụ ẩn; bản đồ nhỏ (minimap)
- [ ] Cầu thứ hai qua sông ở phía Nam
- [ ] Âm thanh: nhạc nền, tiếng bước chân, tiếng nước

## P4 — Hệ thống học tiếng Anh
- [~] Learning Engine tách khỏi gameplay; dữ liệu bài học dạng file (`data/learning/`, `LearningCatalog`)
- [~] Metadata 48 Unit Global Success (lớp 6–9), ID ổn định `g6_u01`... (tên Unit cần giáo viên đối chiếu)
- [ ] Nội dung mẫu đầy đủ: Unit 1 lớp 6 và Unit 1 lớp 8. Đã có: từ vựng đủ 12 Unit lớp 6 và 8 (859 từ, từ sổ tay của chủ dự án trên Drive), ngữ pháp và ngữ âm Unit 1 lớp 8, 1 bài đọc mỗi lớp. Chưa có: lớp 7 và 9, ngữ pháp Unit 1 lớp 6 chưa đối chiếu
- [ ] Lưu tiến độ riêng theo lớp, Unit, kỹ năng (đã có); ôn tập cách quãng (chưa)
- [ ] Minigame đầu tiên (ví dụ: Mua bán ở chợ Ben, Câu cá từ vựng với Sam)
- [ ] Kiểm tra đầu vào, kiểm tra qua cổng, tổng kết; mức cơ bản và nâng cao
- [ ] Giọng đọc (thu âm hợp pháp) cho phần nghe

## P5 — Mở rộng thế giới (mỗi lần một chương)
- [ ] II Rừng Ký Ức
- [ ] III Sa Mạc Gió Vàng
- [ ] IV Dãy Núi Vọng Âm
- [ ] V Hải Cảng Đại Dương
- [ ] VI Học Viện Tri Thức
- [ ] VII Thành Phố Tương Lai
- [ ] VIII Đảo Sao và Tháp Pha Lê

## P6 — Đánh giá và phát hành
- [ ] Đo FPS trên máy cấu hình tham chiếu (máy phòng tin học trường)
- [ ] Mức đồ họa thấp cho máy yếu
- [ ] Bản cài đặt Windows
- [ ] Thử nghiệm với học sinh, khảo sát và chỉnh sửa

## Chỉ số hiệu năng (đo tự động, cùng một góc nhìn chơi game)

Đo bằng trình dựng hình phần mềm trên máy chủ đám mây nên **chưa phải FPS thật**; chỉ so sánh trước/sau.

| Phiên | Draw call | Tam giác vẽ mỗi khung | Ghi chú |
|---|---|---|---|
| 5 (trước tối ưu) | 1.218 | 2.242.796 | Bản đồ vừa mở rộng |
| 5 (sau tối ưu) | 700 | 1.185.218 | Chia ô cây/cỏ, bản cây xa, bóng 2 tầng 45 m |
| 6 | 678 | 1.218.836 | Thêm cầu mới, cột đèn, biển, cổng rừng |
| 7–8 | — | — | Không đo lại: chỉ thêm logic nhiệm vụ, 1 bức thư + 1 đèn nhỏ |

## Nhật ký các phiên làm việc

| Phiên | Ngày | Đã làm | Kiểm thử |
|---|---|---|---|
| 1 | 05/11/2026 | Dựng lại Ngọc chibi (rig, 10 animation, mặt vẽ, chớp mắt); thêm Jump/Fall/Land | Test cũ + test nhân vật mới đạt |
| 2 | 05/11/2026 | NPC Tom, Ben, Sam; 8 mẫu nhà chibi; cây chibi; shader cỏ và nước; đá lát đổi màu; chỉnh trang phục Ngọc | 171 mục đạt |
| 3 | 06/11/2026 | Tải 25 skill game, tạo CLAUDE.md, đề án xin tài trợ | — |
| 4 | 06/11/2026 | P0: kéo chuột trái cũng xoay camera; test điều khiển đầu-cuối 26 mục | 26/26 đạt; chủ dự án nghiệm thu điều khiển |
| 5 | 07/11/2026 | Nhà ×1,45; cây có lá thật + bản rút gọn; đường lát đá toàn mạng; bản đồ 240 m với 3 xóm mới (14 nhà); sông dài ra; tối ưu hiệu năng −47% tam giác | 177 mục đạt (7 bộ test) |
| 6 | 07/11/2026 | P2: cầu gỗ cong mới, nội thất nhà Tom; P3: cột đèn ven đường, 5 biển chỉ đường song ngữ, cổng Rừng Ký Ức | 177 mục đạt; đi qua cầu 2 chiều đạt |
| 7 | 07/11/2026 | P1: quest "Bức thư thất lạc" dựng lại (chọn lớp, thư tiếng Anh, gợi ý, thưởng 1 lần); P4: 48 Unit metadata, Unit 1 lớp 6/8 mẫu, lưu tiến độ có version; khóa di chuyển khi chọn đáp án | 213 mục đạt (8 bộ test) |
| 9 | 07/11/2026 | Đọc Drive (game english > global); nhập từ vựng lớp 6 và 8 (24 Unit, 859 từ) bằng công cụ nhập; ngữ pháp, ngữ âm Unit 1 lớp 8 | Test dữ liệu học 13 mục đạt |
| 8 | 07/11/2026 | Bức thư theo luồng gốc: thư lạc trong nhà Tom, dấu ✉ trên cửa, vào nhà tìm, đọc, ra trả Tom | 215 mục đạt (8 bộ test) |

## Việc nên làm tiếp (đề xuất)
1. Chủ dự án chạy F5 kiểm tra phiên 5–8: nhà, cây, đường đá, xóm mới, cầu, nhà Tom, cổng rừng, nhiệm vụ Bức thư.
2. Giáo viên tiếng Anh đối chiếu tên 48 Unit và nội dung thư lớp 6, lớp 8.
3. Làm vertical slice "Sửa cây cầu" (Tom → Ben → Sam → Pip), minigame đầu tiên ở chợ Ben.
