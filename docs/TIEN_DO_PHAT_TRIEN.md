# English Quest V3 — Kế hoạch và tiến độ phát triển

Cập nhật lần cuối: **07/11/2026** (phiên 5). Claude cập nhật file này ở cuối mỗi phiên làm việc.

**Ký hiệu trạng thái**
- `[x]` **ĐÃ NGHIỆM THU**: chủ dự án đã chạy F5 và xác nhận.
- `[~]` **ĐÃ LÀM, CHỜ NGHIỆM THU**: đã code/dựng, test tự động đạt, chủ dự án chưa xác nhận bằng F5.
- `[ ]` **CHƯA LÀM**.

## Tổng quan

| Giai đoạn | Nội dung | Trạng thái |
|---|---|---|
| P0 | Điều khiển, camera, tương tác chơi được | Đã nghiệm thu |
| P1 | Nhiệm vụ "Bức thư thất lạc" + vertical slice "Sửa cây cầu" | Chưa làm (cần file quest từ máy chủ dự án) |
| P2 | 5 asset chuẩn mỹ thuật | Đang làm (4/5 đã dựng, chờ duyệt) |
| P3 | Làng sống động, bản đồ rộng | Đang làm |
| P4 | Hệ thống học (Learning Engine, 48 Unit) | Chưa làm |
| P5 | Mở rộng 7 chương còn lại | Chưa làm |
| P6 | Đánh giá, tối ưu, thử nghiệm với học sinh | Chưa làm |

## P0 — Điều khiển và camera
- [x] WASD di chuyển theo hướng camera, Shift chạy, Space nhảy
- [x] Giữ chuột (phải hoặc trái) kéo để xoay camera, lăn chuột để zoom
- [x] E tương tác với NPC, cửa nhà, rương
- [x] Hội thoại không khóa điều khiển; đi ra xa thì tự đóng hội thoại
- [~] Animation nhảy, rơi, tiếp đất theo trạng thái thật
- [ ] Khóa di chuyển khi mở bảng chọn đáp án (khi có minigame), và tự mở khóa khi đóng

## P1 — Nhiệm vụ đầu tiên
- [ ] Nhận các file quest "Bức thư thất lạc" từ máy chủ dự án (chưa có trên GitHub)
- [ ] Chạy thử từ đầu đến cuối: Tom giao việc, vào nhà Tom, nhặt thư, trả thư
- [ ] Thưởng 50 EXP + 20 Gold đúng một lần; HUD cập nhật
- [ ] Lưu và nạp tiến độ nhiệm vụ (có saveVersion)
- [ ] Vertical slice "Sửa cây cầu" (15–20 phút): Tom → Ben → Sam → Pip → tìm vật liệu → nghe chỉ dẫn → sửa cầu → phần thưởng và manh mối vào rừng
- [ ] Hai phiên bản nội dung: lớp 6 và lớp 8

## P2 — Asset chuẩn mỹ thuật (fantasy chibi)
- [~] Ngọc: chibi đầu to, mặt vẽ, tóc xoăn búi, kính, khăn, 10 animation, chớp mắt
- [~] Tom: áo choàng xanh viền vàng, râu tóc trắng, gậy đèn lồng phát sáng, 5 animation
- [~] Nhà chibi: 8 mẫu (mái đỏ, xanh, cam, xanh lá; hội trường, chuồng bò, kho, tháp)
- [ ] Nhà Tom có nội thất mới (nội thất hiện vẫn là asset Quaternius cũ)
- [ ] Cầu gỗ cong mới có lan can và va chạm (cầu hiện vẫn là asset cũ)
- [~] Địa hình: cỏ, đất, đá, bờ sông, nước có bọt và gợn sóng
- [~] Cây có lá thật (tấm lá vẽ), vỏ cây có rãnh, bản rút gọn cho cây ở xa

## P3 — Làng sống động
- [~] Nhà to hơn (×1,45) cho cân với nhân vật
- [~] Bản đồ mở rộng 112 m → 240 m, đồi viền và núi xa dời ra ngoài
- [~] Đường lát đá đều toàn bộ mạng đường (12 tuyến), có đá viền hai bên
- [~] Ba xóm mới: xóm Tây (7 nhà), vườn cây phía Đông (4 nhà), đồng cỏ phía Nam (3 nhà)
- [~] Đường lên cổng Rừng Ký Ức (chưa có cổng và biển báo)
- [~] NPC dân làng: Ben (bán hàng), Sam (ngư dân), đi dạo theo tuyến
- [ ] Cổng Rừng Ký Ức, biển chỉ đường, cột đèn ven đường
- [ ] Thêm NPC: Pip, Lily, Rose, Anna; lịch sinh hoạt theo giờ
- [ ] Nội thất các nhà mới; nhà ở xóm mới hiện chưa vào được
- [ ] Rương, bí mật, nhiệm vụ ẩn; bản đồ nhỏ (minimap)
- [ ] Cầu thứ hai qua sông ở phía Nam
- [ ] Âm thanh: nhạc nền, tiếng bước chân, tiếng nước

## P4 — Hệ thống học tiếng Anh
- [ ] Learning Engine tách khỏi gameplay; dữ liệu bài học dạng file
- [ ] Metadata 48 Unit Global Success (lớp 6–9), có ID ổn định
- [ ] Nội dung mẫu đầy đủ: Unit 1 lớp 6 và Unit 1 lớp 8
- [ ] Lưu tiến độ riêng theo lớp, Unit, kỹ năng; ôn tập cách quãng
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

## Nhật ký các phiên làm việc

| Phiên | Ngày | Đã làm | Kiểm thử |
|---|---|---|---|
| 1 | 05/11/2026 | Dựng lại Ngọc chibi (rig, 10 animation, mặt vẽ, chớp mắt); thêm Jump/Fall/Land | Test cũ + test nhân vật mới đạt |
| 2 | 05/11/2026 | NPC Tom, Ben, Sam; 8 mẫu nhà chibi; cây chibi; shader cỏ và nước; đá lát đổi màu; chỉnh trang phục Ngọc | 171 mục đạt |
| 3 | 06/11/2026 | Tải 25 skill game, tạo CLAUDE.md, đề án xin tài trợ | — |
| 4 | 06/11/2026 | P0: kéo chuột trái cũng xoay camera; test điều khiển đầu-cuối 26 mục | 26/26 đạt; chủ dự án nghiệm thu điều khiển |
| 5 | 07/11/2026 | Nhà ×1,45; cây có lá thật + bản rút gọn; đường lát đá toàn mạng; bản đồ 240 m với 3 xóm mới (14 nhà); sông dài ra; tối ưu hiệu năng −47% tam giác | 177 mục đạt (7 bộ test) |

## Việc nên làm tiếp (đề xuất)
1. Chủ dự án chạy F5 kiểm tra phiên 5: kích thước nhà, cây, đường đá, đi thử ra 3 xóm mới.
2. Gửi các file quest "Bức thư thất lạc" để làm P1.
3. Dựng cầu gỗ cong mới và nhà Tom có nội thất (hoàn tất P2).
