# Thiết kế 12 map · mini game · nhà của bé (26/11, lượt 63)

Tài liệu này chốt khung 12 map (12 Unit của một năm học) và ghi các đề xuất chưa làm. Phần **ĐÃ CÓ** là mã đang chạy; phần **ĐỀ XUẤT** chờ anh chọn.

## 1. Khung 12 map (ĐÃ CÓ)

Map N dạy Unit N của lớp bé. Mỗi vùng bị Gió Đen lấy mất một loại lời nói; người giữ vùng dạy lại bằng bài học (5 từ + 1 trang ngữ pháp mỗi ngày); trùm giữ mảnh La Bàn và có khiên ngữ pháp.

| Map | Vùng | Cấp | Unit lớp 6 · lớp 8 | Vùng mất gì | Người giữ · Thương nhân | Trùm | Mini game hiện có |
|---|---|---|---|---|---|---|---|
| 1 | Làng Khởi Đầu | 1–5 | My New School · Leisure Time | (mở đầu) | Tom · Ben | Vua Slime | Hội Đèn, Xếp kẹo, Xếp hình, Bắn ná, Đua xe, Hứng táo, Câu cá |
| 2 | Biển cả | 5–10 | My House · Life in the Countryside | | Sam | Thuyền trưởng Bạch Tuộc | Đua ven biển, Style, Café, Salon |
| 3 | Rừng Ký Ức | 10–20 | My Friends · Teenagers | ký ức | Lily, Pip | Nữ hoàng Nấm, Golem Cổ | Đua trong rừng |
| 4 | Sa mạc Cát Vàng | 20–25 | My Neighbourhood · Ethnic Groups | câu hỏi | Zara · Omar | Rồng Cát | Dune Rally (đua) |
| 5 | Núi Tuyết | 25–30 | Natural Wonders · Customs and Traditions | lời so sánh | Bjorn · Greta | Rồng Băng | Snowball Shot (bắn) |
| 6 | Di tích Cổ | 30–35 | Our Tet Holiday · Lifestyles | câu chuyện đã qua | Ada · Milo | Người Khổng Lồ Đá | Rune Blocks (xếp hình) |
| 7 | Vương quốc trên Trời | 35–45 | Television · Environmental Protection | lời ước | Aria · Nimbus | Rồng Mặt Trời | Cloud Candy (xếp kẹo) |
| 8 | Đảo Thần Tiên | 45–50 | Sports and Games · Shopping | lời hô, lời nhắc | Flora · Thistle | Nữ hoàng Gai | Firefly Path (nối chữ) |
| 9 | Thung lũng Núi Lửa | 50–55 | Cities of the World · Natural Disasters | lời cảnh báo | Brann · Cinder | Người Khổng Lồ Dung Nham | Lava Shot (bắn) |
| 10 | Hang Tinh Thể | 55–60 | Houses in the Future · Communication in the Future | lời nhắn | Opal · Flint | Rồng Pha Lê | Crystal Vault (mở khoá chữ) |
| 11 | Thành phố Tương Lai | 60–65 | Our Greener World · Science and Technology | chữ "nếu" (ý tưởng) | Nova · Bolt | Người Máy Canh Gác | Neon Grand Prix (đua), Robot Workshop (điều tra) |
| 12 | Vương quốc Mộng Mơ | 65–70 | Robots · Life on Other Planets | giấc mơ | Luma · Dozy | Chúa tể Im Lặng (Hugh) | Dream Candy, Star Race |

- Đường đi: Làng → Biển → Rừng → Sa mạc → Núi tuyết → Di tích → Trời → Đảo tiên → Núi lửa → Hang tinh thể → Thành phố → Mộng mơ. Mở vùng sau = hạ trùm vùng trước + lên cấp cao nhất của vùng + qua bài thi 10 câu của Cú Mèo.
- Cốt truyện: Chúa tể Im Lặng ngày xưa là cậu bé Hugh, chậm nói, bị bạn cười. Sau mỗi mảnh La Bàn ông lộ thêm một chút; ở map 12 bé không "tiêu diệt" ông mà gọi tên thật và nói lời tử tế, Hugh nói được "Thank you". Bài học cho trẻ: lời nói tử tế mạnh hơn sự im lặng.
- Ngữ pháp: Unit 1–12 lớp 6 và lớp 8 đã soạn (10 câu + 1 thẻ ghi nhớ mỗi Unit, `src/core/grammar_units.js`). Khung chủ đề lấy theo trí nhớ về mục lục sách, **cần giáo viên đối chiếu**; ba chỗ còn nghi: lớp 6 Unit 12 (so sánh nhất tính từ dài, can/could), lớp 8 Unit 5 (mạo từ), lớp 8 Unit 10 (by/for). Lớp 7, 9 mới có Unit 1–2.
- Ảnh bản đồ thế giới (`assets/ui/world_map.jpg`) mới vẽ 10 vùng: cần anh tạo lại ảnh có thêm Thành phố tương lai và Vương quốc mộng mơ (hai huy hiệu đang đặt tạm ở góc phải và góc trên).

## 2. Mini game riêng cho từng map (ĐỀ XUẤT)

Hiện mỗi vùng mới dùng lại một trò có sẵn dưới tên của vùng (để bé có chỗ tiêu vàng ngay). Dưới đây là trò **riêng** nên làm dần; trò nào cũng có tiếng Anh nằm trong cách chơi, không phải câu hỏi chặn cửa.

| Map | Trò đề xuất | Cách chơi | Tiếng Anh lồng vào | Tiêu vàng / phần thưởng | Công |
|---|---|---|---|---|---|
| 3 | Mushroom Says | Pip hô lệnh, bé chạy tới đúng cây nấm trước khi hết giờ | nghe lệnh + màu, số, vị trí | vé vào; điểm cao mở nấm trang trí cho nhà | nhỏ |
| 4 | Bazaar Bargain | Khách hỏi giá, bé nghe rồi chọn đúng món và tiền thối | How much…? số đếm, câu hỏi (Unit 4) | trả lời đúng được mua đồ hiếm giá rẻ | vừa |
| 5 | Snow Slide | Trượt tuyết 3 làn, mỗi cổng có 3 đáp án | so sánh hơn, nhất | vé vào; kỷ lục đổi ván trượt màu mới | vừa |
| 6 | Rune Decoder | Xếp các phiến đá thành câu đúng thứ tự | trật tự từ trong câu | mở rương cổ: giấy dán tường chủ đề di tích | nhỏ |
| 7 | Balloon Ride | Lái khinh khí cầu hứng chữ cái theo thứ tự | đánh vần | vé vào; sao đổi diều, đèn trời treo nhà | vừa |
| 8 | Fairy Games | Ba môn: chạy theo lệnh, ném vòng, nhảy nấm theo nhịp | câu mệnh lệnh, quá khứ đơn kể lại kết quả | huy chương treo tường nhà | lớn |
| 9 | Rescue Run | Đọc cảnh báo, chọn việc đúng rồi chạy tới chỗ an toàn | từ vựng thảm hoạ, quá khứ tiếp diễn | vé vào; cứu được dân nhận quà | vừa |
| 10 | Gem Mine | Trả vàng đào 5 ô; ô khoá bằng câu hỏi | will / might, lời nhắn | đá quý đổi đèn, bàn ghế pha lê cho nhà | vừa |
| 11 | Robot Builder | Lắp robot theo lời chỉ dẫn | giới từ, câu điều kiện loại 1 | robot lắp xong về nhà làm robot giúp việc | lớn |
| 12 | Dream Weaver | Nối các mảnh câu thành một truyện ngắn | câu tường thuật | truyện thành bức tranh treo ở nhà | vừa |

Nguyên tắc tiêu vàng: vé vào tăng theo cấp (đã có), phần thưởng là **đồ trang trí nhà** chứ không phải vàng hay EXP, nên vàng chảy từ đánh quái sang nhà. Không làm trò may rủi kiểu quay thưởng.

## 3. Nhà của bé đi theo 12 map (bước 1 ĐÃ LÀM 27/11; còn lại ĐỀ XUẤT)

Nền có sẵn: nhà 1–3 tầng và biệt thự, đặt đồ, sơn tường và sàn, vườn, trang trại, bệ La Bàn 12 ô, **cửa nhà thần kỳ ở cổng mọi vùng** (bấm E là về nhà, ra lại đúng vùng đang đứng).

Vòng lặp: đánh quái, học bài → vàng và đồ lưu niệm của vùng → bày trong nhà → điểm Ấm cúng tăng → quyền lợi (giấc ngủ cho thêm EXP) → lại lên đường.

**ĐÃ LÀM (lượt 64, luật ở `src/core/homeplay.js`):**

| Phần | Cách chơi | Tiếng Anh | Chỗ trong mã |
|---|---|---|---|
| Nhãn từ | Đứng cạnh một món đồ bấm **F**: nghe tên, chọn đúng 1 trong 3 từ là món đó được dán nhãn (hiện tên nổi phía trên). Món đã có nhãn thì F đọc lại tên. | nghe và nhận từ; 60 tên đồ vật | `main.js homeTouch`, `homeWord` |
| Điểm Ấm cúng | Đồ đạc 1–6 điểm, nhãn +2, đồ lưu niệm 8, cúp trùm 5, mỗi nâng cấp 8, màu sơn 3, mảnh La Bàn 4. 10 hạng từ Bare tới Palace of Words. | tên hạng bằng tiếng Anh | `homeplay.js comfort`, bảng trong danh sách nhà (phím L) |
| Giấc ngủ | F cạnh giường (hoặc nút trong danh sách): hồi đầy máu, 20 phút sau đó quái cho thêm 5–14% EXP theo hạng Ấm cúng. Mỗi ngày một lần, phải có giường. | | `homeplay.js startRest`, `save.js restMul` |
| Find it! | Phím **G**: Pip gọi 5 món ("Find the lamp!", "Find the thing next to the bed!"), bé chạy tới đúng món rồi bấm F. Hai ván đầu mỗi ngày có EXP. Lớp 8 gặp câu "next to" nhiều hơn. | nghe lệnh, giới từ vị trí | `homeplay.js findRound`, `main.js homeFind` |
| Đồ lưu niệm 12 vùng | Mỗi vùng từ Map 4 có một món chỉ thương nhân vùng đó bán (chậu xương rồng, quả cầu tuyết, bình cổ, đèn mây, đèn nấm, đèn dung nham, cụm pha lê, robot đồ chơi, đèn ngủ ngôi sao). | tên món | `rules.js sv_*`, mô hình `tools/lands/build_souvenirs.py` |
| Cúp trùm | Hạ trùm nào, cúp của trùm đó tự về phòng học (13 cúp). | tên trùm | `homeplay.js syncTrophies` |

**CÒN ĐỀ XUẤT (chưa làm):**

1. **Khách tới thăm.** Người bé đã giúp ở mỗi vùng ghé nhà theo ngày (cuối cùng là Hugh), đưa một yêu cầu dùng đúng ngữ pháp của Unit vùng đó: "Can you put the vase on the table?", "Which chair is more comfortable?". Làm đúng được quà hiếm.
2. **Đủ bộ thì phòng đổi cảnh.** Mỗi vùng thêm 3–5 món nữa; đủ bộ thì phòng có hiệu ứng của vùng (tuyết rơi, đom đóm, sao lơ lửng) và một danh hiệu.
3. **Tường ảnh.** Ảnh chụp ở mỗi vùng treo trong nhà.
4. **Phòng có việc để làm.** Phòng học (ôn từ sai, làm lại bài thi, bảng Word Wall đếm từ đã thuộc); Xưởng (ghép vật liệu vùng thành đồ); Vườn giống cây các vùng lớn theo ngày thật.
5. **Hai anh chị em.** Điểm Ấm cúng hiện trên biển nhà ngoài làng, nút "thích" khi thăm nhà nhau, mỗi tuần một chủ đề trang trí.
6. **Phần thưởng mini game là đồ trang trí nhà** (xem mục 2) thay cho vàng.

## 4. Mô hình

- Cảnh riêng của map 8–12 hiện vẽ bằng mã (hoa khổng lồ, hồ dung nham, núi lửa, tinh thể, tháp kính, tàu trên không, trăng sao). Quái map 8, 9, 10, 12 dùng lại mô hình cũ đổi màu; robot map 11 và trùm Người Máy Canh Gác em đã vẽ bằng Blender (`tools/lands/build_robots.py`).
- Cái cần đẹp hơn mức Blender dựng bằng script: xem `docs/YEU_CAU_MO_HINH_TRIPO.md` (đã thêm câu lệnh cho map 8–12).
