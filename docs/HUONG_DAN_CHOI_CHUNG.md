# Chơi chung qua mạng: hướng dẫn cho bố mẹ (27/11, lượt 69)

Các bé ở các máy tính khác nhau (cùng nhà hay khác nhà đều được) vào chung một **phòng** bằng **mã phòng 6 ký tự**, đứng cùng một vùng thì thấy nhân vật của nhau đi lại, có bảng tên và cấp, và nói với nhau bằng 18 câu tiếng Anh có sẵn. Một phòng tối đa 8 bạn.

Để các máy tìm thấy nhau cần một **máy chủ phòng** rất nhỏ. Mã của nó đã nằm trong dự án (`server/`), chạy trên tài khoản Cloudflare của anh, gói miễn phí. Anh chỉ làm phần A một lần.

## A. Đưa máy chủ phòng lên Cloudflare (một lần, khoảng 10 phút)

Cách này để GitHub tự đưa mã lên Cloudflare mỗi khi em sửa máy chủ, anh không phải cài gì trên máy.

**Bước 1. Mở trang Workers một lần.** Đăng nhập <https://dash.cloudflare.com>, bấm **Workers & Pages** ở cột trái (mục Compute). Lần đầu Cloudflare sẽ tạo cho tài khoản một địa chỉ con dạng `tên-của-anh.workers.dev`; nếu nó hỏi thì bấm đồng ý. Ở trang này, cột phải có dòng **Account ID** (một dãy 32 ký tự): bấm nút sao chép và dán tạm vào Notepad.

**Bước 2. Tạo mã truy cập (API token).** Bấm hình người ở góc trên phải → **My Profile** → **API Tokens** → **Create Token** → ở dòng **Edit Cloudflare Workers** bấm **Use template**. Kéo xuống:
- *Account Resources*: chọn **Include** → tài khoản của anh.
- *Zone Resources*: chọn **Include** → **All zones** (anh không có tên miền nào cũng được, cứ chọn vậy).
- Bấm **Continue to summary** → **Create Token** → bấm **Copy**, dán tạm vào Notepad. Mã này chỉ hiện một lần.

**Bước 3. Dán hai thứ đó vào GitHub.** Mở kho mã của game trên GitHub → **Settings** → cột trái **Secrets and variables** → **Actions** → **New repository secret**, tạo hai mục (tên phải đúng từng chữ):

| Name | Secret |
|---|---|
| `CLOUDFLARE_API_TOKEN` | mã ở bước 2 |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID ở bước 1 |

Mã truy cập là bí mật: chỉ dán vào ô Secret của GitHub, **không** gửi vào cuộc trò chuyện, không dán vào file nào. Xong thì xoá khỏi Notepad.

**Bước 4. Chạy.** Trên GitHub bấm thẻ **Actions** → cột trái **Room server (Cloudflare)** → **Run workflow** → chọn nhánh `fable/web-rebuild` → **Run workflow**. Chờ khoảng 1 phút tới khi có dấu ✓ xanh. (Nếu mục này chưa có trong danh sách: em chưa đẩy mã lượt 69 lên; anh nói "đẩy đi" trước.)

**Bước 5. Lấy địa chỉ.** Quay lại Cloudflare → **Workers & Pages** → có một mục tên **english-quest-room** → bấm vào, địa chỉ của nó có dạng `https://english-quest-room.tên-của-anh.workers.dev`. Mở địa chỉ đó trong trình duyệt phải thấy dòng `{"ok":true,"what":"English Quest room server",…}`.

**Bước 6. Báo địa chỉ cho em** (địa chỉ này không phải bí mật). Em ghi vào `data/online.json`, đẩy lên, GitHub dựng bản .exe mới: mọi máy cài bản đó đều có sẵn nút 👫. Trong lúc chờ, anh thử ngay được bằng cách dán địa chỉ vào bảng Quản trị (mục B).

Nếu bước 4 báo đỏ: bấm vào lần chạy đó, chép dòng lỗi cuối cùng gửi em. Hai lỗi hay gặp: tên secret gõ sai; chưa mở trang Workers lần nào (bước 1) nên tài khoản chưa có địa chỉ `workers.dev`.

## B. Bật, tắt trên từng máy (bảng Quản trị)

Đăng nhập tài khoản Quản trị trong game (mật khẩu của bố mẹ) → bấm **🛠 Admin (F2)** → mục **👫 Chơi chung qua mạng**:
- **Địa chỉ máy chủ**: dán địa chỉ ở bước 5 rồi bấm **Lưu**. Để trống = dùng địa chỉ có sẵn trong bản game (sau bước 6).
- Nút **Đang bật / Đang TẮT trên máy này**: tắt thì nút 👫 biến mất và game không mở kết nối nào.

Khi máy chưa có địa chỉ nào (như hiện nay, trước bước 6) thì game không có nút 👫 và không nối đi đâu cả.

## C. Các bé chơi thế nào

1. Một bé bấm nút **👫** (hoặc phím **Y**) → **Tạo phòng mới** → màn hình hiện mã, ví dụ `BE28QQ`. Đọc mã cho bạn (gọi điện, nhắn Zalo cho bố mẹ bạn…).
2. Bạn kia bấm **👫** → gõ mã → **Vào phòng**. Lần sau có nút **Vào lại phòng …** khỏi gõ.
3. Hai bé **đi tới cùng một vùng** (cùng Làng, cùng Rừng…) là thấy nhau; bảng 👫 ghi mỗi bạn đang ở vùng nào. Bảng tên của bạn thật màu xanh nhạt, khác bảng tên màu kem của nhân vật máy.
4. Phím **C**: chọn một câu để nói (`Follow me!`, `Where are you?`, `Good job!`…). Câu hiện trên đầu nhân vật, máy bạn đọc thành tiếng. Đứng cạnh bạn bấm **E** = vẫy chào `Hello!`.
5. **Rời phòng**: bấm 👫 → Rời phòng, hoặc đổi người chơi, hoặc tắt game.
6. Khi đang ở trong nhà riêng mà cửa sổ "nhà" đang mở thì phím Y chưa có tác dụng (cửa sổ đó nhận hết phím): đóng cửa sổ nhà trước, hoặc ra khỏi nhà.

Mỗi bé vẫn chơi phần của mình: quái, nhiệm vụ, vàng, nhà cửa, bản lưu đều ở máy của bé đó và không ai sửa được của ai. Bé chưa mở vùng nào thì chưa sang vùng đó gặp bạn được.

## D. An toàn

- Không có danh sách phòng, không ghép với người lạ: chỉ ai biết mã mới vào được. **Dặn các bé chỉ đưa mã cho bạn quen.** Muốn đổi mã thì tạo phòng mới.
- Không có ô gõ chữ tự do, không giọng nói, không ảnh. Thứ duy nhất đi qua mạng: tên nhân vật trong game, cấp, kiểu tóc và màu quần áo, vị trí, và **số thứ tự** của câu có sẵn. Máy chủ lọc mọi tin trước khi chuyển tiếp, nên một bản game bị sửa cũng không gửi được chữ nào khác.
- Tên nhân vật là thứ duy nhất do bé tự đặt mà bạn trong phòng nhìn thấy (tối đa 16 chữ cái): đừng đặt tên thật đầy đủ.
- Máy chủ không lưu gì: không tài khoản, không nhật ký ai chơi lúc nào, không bản lưu. Phòng không còn ai thì tự biến mất.
- Kho mã của game là công khai, nên địa chỉ máy chủ cũng công khai. Người lạ biết địa chỉ chỉ mở được phòng riêng của họ, không vào được phòng của các bé nếu không biết mã (6 ký tự, hơn một tỉ khả năng). Điều xấu nhất họ làm được là dùng hết hạn mức miễn phí trong ngày, khi đó các bé không vào phòng được tới hôm sau. Nếu chuyện đó xảy ra, báo em: em thêm "chìa khoá gia đình" để chỉ bản game của nhà mình nối được.

## E. Hạn mức miễn phí của Cloudflare

Gói miễn phí cho 100.000 yêu cầu mỗi ngày; 20 tin từ game gửi lên tính là 1 yêu cầu. Game chỉ gửi vị trí khi nhân vật đang di chuyển (nhiều nhất khoảng 6 lần mỗi giây), đứng yên thì 20 giây một lần. Bốn bé chơi liền bốn tiếng, lúc nào cũng chạy: khoảng 18.000 yêu cầu, chưa tới một phần năm hạn mức. Hết hạn mức thì chỉ phần chơi chung ngừng tới hôm sau; game vẫn chơi một mình bình thường và Cloudflare không tự trừ tiền (gói miễn phí không có thẻ).

## F. Hiện có gì, chưa có gì

- **Có (bậc 1 và 2)**: thấy nhau trong cùng vùng (thân hình, màu da, kiểu tóc, màu và kiểu quần áo), bảng tên và cấp, chấm 🙂 trên bản đồ nhỏ, 18 câu nói có sẵn, danh sách ai đang ở vùng nào, tự nối lại khi rớt mạng.
- **Chưa có**: phụ kiện, vũ khí, thú cưng của bạn chưa hiện; chưa thi mini game với nhau (bậc 3); chưa sang thăm nhà nhau (bậc 4); chưa đánh chung quái và trùm (bậc 5, làm sau cùng). Trong nhà riêng thì bạn không thấy mình (bảng ghi "đang ở trong nhà").
- **Chưa kiểm được từ phía em**: hai máy thật qua Internet tới Cloudflare thật (độ trễ, tường lửa). Em mới thử với máy chủ chạy tại chỗ. Cần anh và hai bé thử sau bước 6.
