# Nghiên cứu: cho hai bé chơi chung qua mạng (27/11, lượt 68)

Anh hỏi: "nghiên cứu việc kết nối mạng để cho bé chơi với nhau online". Đây là bản nghiên cứu, **chưa viết dòng mã nào**. Cuối file có 4 câu cần anh chọn.

## 1. Hiện trạng của game

- Game chạy hoàn toàn trên một máy: trình duyệt hoặc bản .exe (Electron). Không có máy chủ, không tài khoản, bản lưu nằm trong máy.
- Mọi thứ (quái, máu, rương, nhiệm vụ) do máy của người chơi tự tính. Muốn hai máy thấy cùng một con quái thì phải có MỘT máy làm "trọng tài", máy kia nghe theo. Đây là phần tốn công nhất.
- Điểm thuận lợi đã có sẵn:
  - Lớp `Crowd` (lượt 67) đã vẽ được "người chơi khác" có bảng tên và cấp. Một người chơi thật qua mạng chỉ là một nhân vật như thế, nhưng vị trí lấy từ máy bên kia thay vì do máy tự nghĩ ra.
  - Mini game chạy theo hạt giống ngẫu nhiên (`rnd`): hai máy nhận cùng một hạt giống là ra cùng một ván, chỉ cần gửi cho nhau điểm số.
  - Bản .exe có phần Node (Electron) nên mở được cổng mạng trong nhà; bản trình duyệt thì không mở được cổng, chỉ đi kết nối tới nơi khác.

## 2. Bốn cách nối hai máy

| Cách | Hai bé ở đâu | Cần gì thêm | Tiền | Rủi ro với trẻ | Công làm |
|---|---|---|---|---|---|
| A. Chung một máy | ngồi cạnh nhau | không | 0 | không | nhỏ, từng trò |
| B. Mạng trong nhà (LAN) | cùng wifi nhà | bản .exe của một bé làm chủ phòng, bé kia nhập mã phòng | 0 | không ra Internet | vừa |
| C. Internet, nối thẳng hai máy (WebRTC) | khác nhà | một dịch vụ "giới thiệu" để hai máy tìm thấy nhau | 0 | thấp nếu chỉ vào bằng mã phòng | vừa + phải thử trên mạng thật |
| D. Internet, qua máy chủ trung chuyển | khác nhà | một máy chủ nhỏ của mình | 0 tới vài chục nghìn đồng/tháng | thấp nếu chỉ vào bằng mã phòng | lớn hơn C một chút, ổn định hơn |

Giải thích ngắn:

- **A. Chung một máy**: hai bé chơi luân phiên hoặc chia bàn phím (bé một dùng WASD, bé hai dùng phím mũi tên). Hợp với mini game đối kháng: đua xe 2 người (việc cũ còn treo), Snow Slide hai làn, đấu trả lời nhanh.
- **B. Mạng trong nhà**: bản .exe của bé thứ nhất mở một cổng WebSocket (thư viện `ws`, thêm vào `desktop/`), hiện mã phòng 4 chữ số kèm địa chỉ máy; bé thứ hai gõ mã. Dữ liệu không rời khỏi nhà. Cửa sổ Windows sẽ hỏi "cho phép qua tường lửa" một lần: anh bấm Cho phép (mạng riêng).
- **C. WebRTC nối thẳng**: hai máy trao đổi "địa chỉ" qua một dịch vụ trung gian rồi tự nói chuyện với nhau. Thư viện có sẵn:
  - PeerJS: có máy chủ giới thiệu miễn phí dùng chung; dữ liệu chơi không đi qua máy chủ đó.
  - Trystero: không cần máy chủ riêng, mượn các mạng công cộng (Nostr, BitTorrent, MQTT…) để hai máy tìm nhau; dữ liệu được mã hoá, đi thẳng giữa hai máy.
  - Điểm yếu: nếu CẢ HAI nhà đều ở sau kiểu chia sẻ địa chỉ chặt (symmetric NAT, hay gặp ở mạng 4G và một số gói cáp quang) thì không nối thẳng được, phải có máy trung chuyển (TURN). Không đo trước được; phải thử trên đúng mạng của hai nhà.
  - Điểm yếu thứ hai: dịch vụ miễn phí dùng chung không ai cam kết chạy mãi; hỏng thì game không vào phòng được cho tới khi đổi dịch vụ.
- **D. Máy chủ trung chuyển của mình**: một chương trình rất nhỏ nhận tin của máy này rồi chuyển cho máy kia trong cùng phòng. Nơi đặt hợp lý nhất hiện nay là Cloudflare Workers + Durable Objects: gói miễn phí đã dùng được Durable Objects (từ 4/2025), hạn mức 100.000 yêu cầu mỗi ngày, tin WebSocket đi vào tính 20 tin = 1 yêu cầu. Hai bé chơi 2 giờ, mỗi máy gửi 10 tin/giây ≈ 144.000 tin ≈ 7.200 yêu cầu: nằm trong gói miễn phí. Cần anh tạo một tài khoản Cloudflare (miễn phí, không cần thẻ) và em hướng dẫn đưa mã lên. Luôn nối được dù mạng nhà kiểu gì.

## 3. Đồng bộ cái gì: làm theo bậc, bậc nào cũng chơi được

| Bậc | Hai bé làm được gì | Gửi qua mạng | Công | Ghi chú |
|---|---|---|---|---|
| 1. Thấy nhau | Cùng đứng trong một vùng, thấy nhân vật của nhau đi lại, vẫy tay, bảng tên và cấp | vị trí, hướng, dáng đi, trang phục: 10 lần/giây, ~50 byte | 1–2 lượt | Quái vẫn riêng từng máy (mỗi bé đánh quái của mình). Dùng lại lớp `Crowd`. |
| 2. Nói chuyện an toàn | Bấm chọn câu tiếng Anh có sẵn ("Follow me!", "Good job!", "Let's play a game!"), biểu cảm | số thứ tự câu | nhỏ | KHÔNG có ô gõ chữ tự do: không ai nhắn được gì ngoài các câu của game. Cũng là luyện tiếng Anh. |
| 3. Thi mini game | Mời bạn vào cùng một ván: đua xe, Snow Slide, Bazaar, đấu từ vựng; xem điểm của nhau theo thời gian thực | hạt giống ván + điểm | 1 lượt cho khung, mỗi trò thêm một ít | Đây là phần vui nhất so với công bỏ ra. |
| 4. Thăm nhà, tặng quà | Sang nhà bạn xem đồ, chơi Find it! trong nhà bạn, tặng một món đồ mỗi ngày | danh sách đồ trong nhà | 1 lượt | Nhà đã lưu thành dữ liệu gọn (`profile.home`). |
| 5. Đánh quái chung | Cùng đánh một con quái, một con trùm; chia EXP | máy chủ phòng tính quái, máy khách gửi đòn đánh | 3–5 lượt, phải sửa `game/combat.js` nhiều | Rủi ro lỗi cao nhất. Nên để sau cùng, hoặc chỉ làm riêng cho trùm (một "phòng trùm" hai người). |

Bản lưu vẫn ở máy từng bé; chơi chung không ghi đè bản lưu của nhau. Tiến độ truyện của mỗi bé giữ nguyên là của bé đó.

## 4. An toàn cho trẻ (áp dụng cho mọi cách)

- Chỉ vào phòng bằng **mã phòng** do bé kia (hoặc bố mẹ) đọc cho. Không có danh sách phòng, không ghép ngẫu nhiên với người lạ.
- Không gõ chữ tự do, không giọng nói, không gửi ảnh. Chỉ các câu tiếng Anh của game.
- Tên hiển thị là tên nhân vật trong game; không gửi tên thật, tuổi, địa chỉ, không có tài khoản hay email.
- Phòng tối đa 4 người; chủ phòng có nút mời ra.
- Có công tắc "Chơi chung qua mạng" trong phần Quản trị (mật khẩu của bố mẹ), mặc định TẮT. Tắt thì game không mở kết nối nào, giống hệt hiện nay.
- Quy tắc cũ "game không đưa trẻ ra Internet" (26/11): cách A và B giữ nguyên quy tắc này. Cách C và D là ngoại lệ mà chỉ bố mẹ bật được.

## 5. Đề xuất của em

1. **Làm trước: cách B (mạng trong nhà) + bậc 1, 2, 3.** Hai bé ở cùng nhà nên đây là thứ dùng được ngay, không tốn tiền, không ra Internet, không phụ thuộc dịch vụ nào. Lớp truyền tin viết tách riêng (`src/net/`: "gửi tin vào phòng, nhận tin từ phòng") để sau này đổi đường truyền mà không sửa phần game.
2. **Khi cần chơi khác nhà: thêm cách D** (Cloudflare miễn phí) dùng đúng lớp truyền tin đó. Em nghiêng về D hơn C vì D luôn nối được; C miễn phí hẳn nhưng có nhà nối không được và em không thử trước được từ đây.
3. **Bậc 4 (thăm nhà) làm sau bậc 3; bậc 5 (đánh quái chung) để cuối**, sau khi anh và hai bé đã chơi thử các bậc trước.

Điều em KHÔNG kiểm được từ phiên làm việc trên đám mây: hai máy thật nối với nhau qua wifi nhà anh, tường lửa Windows, độ trễ. Phần này phải nhờ anh và hai bé thử, em viết sẵn màn hình báo lỗi dễ hiểu ("không tìm thấy phòng", "máy chủ phòng đã thoát").

## 6. Bốn câu cần anh chọn

1. Hai bé có **hai máy tính** riêng không, hay dùng chung một máy? (Chung một máy thì làm cách A trước.)
2. Hai bé chủ yếu chơi **cùng nhà** hay có lúc **khác nhà** (ví dụ một bé ở nhà ông bà)?
3. Anh muốn bậc nào trước: **thấy nhau + thi mini game** (em đề xuất), hay đi thẳng tới **đánh quái chung** (lâu hơn nhiều)?
4. Nếu chơi khác nhà: anh có sẵn lòng tạo một tài khoản Cloudflare miễn phí không?

## Nguồn đã tra (27/11)

- Cloudflare: Durable Objects có trong gói Workers miễn phí, hạn mức và cách tính tin WebSocket: <https://developers.cloudflare.com/changelog/2025-04-07-durable-objects-free-tier>, <https://developers.cloudflare.com/durable-objects/platform/pricing>, <https://developers.cloudflare.com/durable-objects/platform/limits>
- PeerJS: máy chủ giới thiệu miễn phí, trường hợp không nối thẳng được: <https://peerjs.com/client/faq>, <https://peerjs.com/server/cloud>
- Trystero: WebRTC không cần máy chủ riêng: <https://github.com/dmotz/trystero>

Chưa xác minh: số kết nối cùng lúc tối đa của máy chủ PeerJS miễn phí (nguồn cũ ghi 50, không có số chính thức hiện tại); tỉ lệ nhà mạng ở Việt Nam chặn nối thẳng.
