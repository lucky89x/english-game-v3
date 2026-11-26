# Rà soát tổng thể English Quest — 26/11/2026

Nhánh `fable/web-rebuild`, commit `c1cab93`. Báo cáo này chỉ nhận xét; **không sửa dòng mã nào**.

## Cách đọc báo cáo

**Cách làm.** 13 trợ lý rà song song, mỗi trợ lý một mảng (mã lõi, `main.js`, `src/game`, hiệu năng, mã giao diện, cân bằng, truyện, tiếng Anh, bản đồ, mô hình 3D, trải nghiệm của trẻ, bản quyền, kiểm thử). Sau đó em tự kiểm lại các phát hiện quan trọng bằng cách mở đúng dòng mã, chạy script nhỏ hoặc đo file.

**Mức.** P0 = lỗi nặng, hỏng, mất dữ liệu hoặc rủi ro cho trẻ. P1 = nên sửa sớm. P2 = cải thiện.

**Độ chắc**, ghi ở cuối cột Bằng chứng:
- ✔ = em đã tự kiểm lại (chạy mã, đo file, hoặc đọc đúng dòng).
- ◐ = trợ lý đọc mã và báo, em chưa tự kiểm lại.
- ? = suy đoán, cần chơi thử trên máy thật.

**Đã chạy:** `node --test tests/unit.test.mjs` (91/91 đạt), `tests/lantern.test.mjs` (6/6 đạt), các script tính số và đo file GLB.
**Không chạy:** game trong trình duyệt, quick, e2e. Mọi nhận định về cảm giác chơi, FPS, hình ảnh trong game đều chưa được xem tận mắt.

**Hai điều lệch với CLAUDE.md cần biết trước:**
- CLAUDE.md ghi các lượt 56–59 "chưa đẩy", nhưng nhánh trên GitHub đã ở `c1cab93` và bản cài `desktop-latest` (EnglishQuest-Setup-0.9.0.exe, 154 MB) đã được dựng tự động từ commit đó lúc 03:32 UTC ngày 26/11. Tức Luna, Mika và lô quái Tripo **đã nằm trong bản .exe trên mạng**. ✔
- CLAUDE.md ghi nhiệm vụ ngày 3% thanh và trùm 35% thanh; mã hiện là 1% và 15%.

---

## 10 việc quan trọng nhất nên làm ngay

| # | Việc | Vì sao | Công sức |
|---|---|---|---|
| 1 | **Bảo vệ bản lưu.** Khi bản lưu hỏng, game coi như chưa có ai chơi và ghi đè luôn; bản dự phòng `.bak` không bao giờ được đọc lại. | Một lần hỏng dữ liệu là cả hai bé mất hết tiến độ. Em đã tái hiện bằng script. | ít–vừa |
| 2 | **Gỡ hoặc ẩn Mika và Luna khỏi bản phát hành**, dựng lại .exe, kiểm xem repo có đang công khai không, xoá các nhánh chứa file thô. | Mika mang gần đủ đặc điểm thiết kế của một nhân vật game thương mại; cả hai mặc đồ kiểu người lớn, không hợp tuổi 11–14; và đã lên bản .exe. | ít |
| 3 | **Giảm tải cây cỏ và sửa cơ chế tự hạ đồ hoạ.** Gói cây cỏ mới làm Làng phải vẽ khoảng 4–5 triệu tam giác mỗi khung hình (ngân sách 0,7 triệu); cơ chế tự hạ đồ hoạ cho máy yếu không bao giờ chạy vì một điều kiện sai. | Máy nhà không có card rời sẽ giật mà game không tự cứu. | vừa |
| 4 | **Sửa chỉ đường sai sau khi đổi thứ tự map.** Sau huy hiệu của Tom, dòng mục tiêu và mũi tên vàng chỉ mãi về cổng rừng (khoá tới cấp 10); bến thuyền báo "lên cấp 20"; Tom nói mảnh La Bàn ở trong rừng; thông báo mở map bị lời Cú Mèo đè mất. | Đúng lúc bé cần biết "đi đánh quái ở đâu" thì game chỉ sai chỗ. | ít |
| 5 | **Gỡ hai chỗ kẹt cứng.** Thẻ "🎤 Đọc to" không có nút thoát khi máy không có micro hoặc bị chặn quyền (bản web); file nhân vật tải lỗi thì trang treo vĩnh viễn; đổi map tải lỗi thì kẹt "đang chuyển". | Bé phải tắt game mở lại, có thể mất phần vừa chơi. | ít |
| 6 | **Sửa mất thưởng nhiệm vụ khi nhận ở Làng** và biệt thự đòi cấp 25 (cấp tối đa hiện là 20). | Bé cấp 10 đứng ở Làng bấm nhận thưởng: 0 EXP, vàng còn một nửa rồi về 0, nhiệm vụ vẫn bị đánh dấu đã nhận. | ít |
| 7 | **Anh quyết lại nhịp độ và cách học.** Map 1 cày thuần chỉ ~3,4 giờ nhưng nửa số quái dồn vào một bãi 4 con; Map 2 ~10 giờ, Map 3 ~27 giờ. Lúc đánh quái không có chữ tiếng Anh nào, nên tỉ lệ học thật chỉ 4–17%, không phải 30%. | Đây là vấn đề lớn nhất về thiết kế: càng cày nhiều càng học ít. | vừa |
| 8 | **Sửa nội dung dạy sai.** Bãi "Thỏ Băng / Frost Bunny" hiện ra con hoa ăn thịt; câu lớp 8 "walks slower" giải thích sai; lỗi nghĩa và chính tả ở dữ liệu lớp 7, 9; câu "chọn câu đúng" trong bài thi lộ đáp án qua chữ hoa và dấu chấm. | Game học mà dạy sai thì hại hơn không dạy. | ít |
| 9 | **Vá các lỗ hổng luật chơi và bãi quái.** Bắn phép từ xa thì quái và trùm đứng yên chịu đòn; mở túi thì bé đứng im nhưng quái vẫn cắn; câu cá trả phí một lần rồi câu vô hạn; hũ chữ của Ben cho EXP vô hạn; hai bãi quái cấp cao ở Rừng và bãi Golem ở Làng nằm trên đỉnh vách, đi thẳng không lên được. | Làm game quá dễ, bất công, hoặc phá luật anh đã chốt; bé tưởng không tới được bãi quái. | ít–vừa |
| 10 | **An toàn cho trẻ và lưới kiểm thử.** Thêm nhắc nghỉ mắt và giới hạn giờ; giấu nút Quản trị (mật khẩu 321), tắt F12 ở bản .exe, bỏ nút mở YouTube; cho GitHub chạy unit test trước khi dựng .exe; thêm trang "Phím điều khiển". | Thiết kế hiện khuyến khích chơi 2–3 giờ/ngày mà không có phanh; mã lỗi vẫn tự thành bản cài. | ít–vừa |

---

## 1. Lỗi mã, hiệu năng, lưu dữ liệu

### 1a. Lưu dữ liệu (có mất tiến độ không?)

Trả lời ngắn: **có thể mất**, trong tình huống hiếm nhưng hậu quả nặng. Lưu được gọi ở 54 chỗ (mỗi lần hạ quái, mua bán, trả lời xong) và tự lưu 20 giây một lần, nên việc quên lưu không phải vấn đề. Vấn đề là khi bản lưu hỏng.

| Mức | Vấn đề | Bằng chứng | Đề xuất cách sửa | Công sức | Dùng gì |
|---|---|---|---|---|---|
| P0 | Bản lưu hỏng (hoặc từ bản game mới hơn) bị coi là "chưa có ai chơi"; lần lưu kế tiếp ghi đè. Bản `.bak` không được đọc ở đâu, và sau một lần lưu nó chứa chính dữ liệu hỏng. | `src/core/save.js:34-40, 44`. Tái hiện: cắt cụt chuỗi JSON → `load()` trả 0 hồ sơ → tạo hồ sơ mới → `.bak` không còn đọc được. ✔ | Khi đọc lỗi: thử `.bak`, rồi thử file của bản .exe; cất bản hỏng sang khoá riêng; không bao giờ chép bản không đọc được vào `.bak`. | ít | code |
| P0 | Bản .exe: file `Documents/EnglishQuest/store.json` chỉ được đọc khi bộ nhớ trang **trống**. Nếu bộ nhớ trang **hỏng** thì file tốt bị bỏ qua rồi bị ghi đè. Còn 14 bản sao theo ngày trong `backups/`, nhưng không có nút nào để nạp lại chúng. | `save.js:37`; `desktop/main.js:28-38`; `src/ui/ui.js:34` (nút Nhập chỉ nhận file một hồ sơ). ✔ (phần file: đọc mã, chưa chạy Electron) | Lúc mở, so bộ nhớ trang với file, lấy bản hợp lệ và mới hơn; thêm nút "Khôi phục bản sao lưu" trong bảng Quản trị; không ghi kho trống đè lên file đang có hồ sơ. | vừa | code |
| P0 | Một hồ sơ hỏng làm mất cả hai bé: danh sách hồ sơ có một phần tử lỗi là cả bản lưu bị bỏ. | `save.js:29`. Tái hiện: `profiles: [hồ sơ tốt, null]` → 0 hồ sơ. ✔ | `migrate` bỏ phần tử hỏng, giữ phần tốt; trường thiếu thì điền mặc định. | ít | code |
| P1 | Lưu thất bại (đầy bộ nhớ, trình duyệt chặn) chỉ ghi vào console, bé chơi tiếp cả buổi mà không lưu được. | `src/main.js:238`. ✔ | Hiện thông báo một lần "Chưa lưu được"; ghi file .exe độc lập với bộ nhớ trang. | ít | code |
| P1 | Mở game hai cửa sổ thì cửa sổ lưu sau xoá tiến độ của cửa sổ kia. Bản .exe không chặn mở hai lần. | `desktop/main.js` không có `requestSingleInstanceLock`. ✔ (cơ chế: đọc mã) | Thêm khoá một cửa sổ; bản web nghe sự kiện `storage`. | ít | code |
| P1 | EXP có thể thành "không phải số" vĩnh viễn nếu nhập hồ sơ thiếu trường, khi đó bé không lên cấp được nữa. | `save.js:53, 84`; `progress.js:37`. ◐ | Ép `level/exp/gold` về số trong `migrate`, `importProfile`, `addExp`. | ít | code |
| P1 | Nhập hồ sơ ghi đè hồ sơ cùng mã mà không hỏi; file có `"admin": true` thành quản trị không cần mật khẩu. | `save.js:51-56`; `ui.js:34`. ◐ | Hỏi xác nhận, hiện cấp cũ và mới; bỏ cờ `admin` khi nhập. | ít | code |
| P2 | Mỗi lần hạ quái ghi lại toàn bộ kho (cả hai bé, ~180 KB) và ghi file. | `combat.js:317`; `save.js:41-47`. ◐ | Đánh dấu "cần lưu", gộp ghi mỗi 2–3 giây. | ít | code |

### 1b. Lỗi logic và chỗ kẹt

| Mức | Vấn đề | Bằng chứng | Đề xuất cách sửa | Công sức | Dùng gì |
|---|---|---|---|---|---|
| P0 | Thẻ "🎤 Đọc to" che kín màn hình và không có nút thoát khi máy không có micro hoặc bé bấm "Chặn" (bản web; bản .exe có nút Xong). Thẻ hiện ở mọi bong bóng chữ và sau mỗi câu đúng ở cổng mini game. | `src/ui/voice.js:86`: nhánh `denied` vẽ lại thẻ rồi thoát, không thêm nút. ✔ | Thêm nút "Bỏ qua"; cho Esc đóng. | ít | code |
| P1 | File nhân vật Ruby/Luna/Mika tải lỗi thì trang treo cứng: `swapAvatar` bắt lỗi rồi gọi `applyLook`, `applyLook` gọi lại `swapAvatar`, và bộ nhớ đệm giữ luôn kết quả lỗi. | `main.js:941-956, 167`. ✔ (đọc mã; trợ lý đã mô phỏng vòng lặp) | Lỗi thì quay về Ngọc và không thử lại; xoá mục lỗi khỏi bộ nhớ đệm. | ít | code |
| P1 | Đổi map mà một file tải lỗi thì game kẹt ở trạng thái "đang chuyển", không thông báo, không thoát được. | `main.js:425-447` (không có `try/finally`); `src/world/index.js`. ◐ | `try/finally`, hiện lại màn tải kèm nút "Thử lại". | ít | code |
| P1 | Thông báo mở map mới (lời Tom "A boat is waiting…") bị lời Cú Mèo thay mất, đúng loại lỗi đã sửa ở lượt 52. Nhánh `L0 === 30` không bao giờ chạy vì bài thi ở cấp 10 và 20. | `main.js:1029-1032, 1063-1065, 251-257`. ◐ (dòng 1032 ✔) | Gọi `refresh()` sau `ui.dialogue(...)`; đổi 30 thành 20. | ít | code |
| P1 | Nhận thưởng sổ nhiệm vụ khi đang đứng ở Làng: bé cấp 10 nhận 0 EXP và nửa vàng (sau 30 lần là 0), nhiệm vụ vẫn tính đã nhận. Làng lại là nơi có nhà, Cú Mèo, cửa hàng. Trái với ghi chú "nhiệm vụ truyện không áp" trong CLAUDE.md. | `main.js:527`; `save.js:83, 98-102`. Tái hiện: nhiệm vụ "harbor" (100 vàng, 1.696 EXP) → ở Làng được 50 vàng, 0 EXP; ở Rừng được đủ. ✔ | Thưởng nhiệm vụ chính không qua `capGold`; EXP tính theo map cao nhất đã mở. | ít | code |
| P1 | Cổng mini game: đọc to không đạt 3 lần thì game hỏi lại đúng câu đó, lặp không dứt. Bé phát âm chưa chuẩn hoặc micro kém không vào chơi được. | `main.js:686` (`() => ask(n)`). ✔ | Sau 3 lần cho qua, đánh dấu "cần luyện". | ít | code |
| P1 | Tiệm may Mia: thử đồ ghi thẳng vào hồ sơ, game tự lưu sau 20 giây, đóng game lúc đang thử là mặc được đồ chưa mua. Tab loại đồ không đặt lại nên Ruby có thể mua nhầm áo không hiện trên Ruby. | `src/ui/tailor.js:58-60, 80`; `main.js:1461`. ✔ (dòng 58–60) | Thử đồ trên bản sao; đặt lại tab trong `show()`. | vừa | code |
| P1 | Rương khoá chữ: gõ đúng xong, trong 0,9 giây chờ mà bấm W/A/S/D theo thói quen thì bị tính sai, thưởng tụt từ 15 xuống 6 vàng. | `src/ui/arcade.js:281` (`g.key` không kiểm đã xong; `g.click` thì có). ✔ | Thêm `if (đã đủ chữ) return`. | ít | code |
| P1 | Thưởng trước, đổi bước sau: trả thư cho Tom, để hộp thoại mở hơn 20 giây rồi tải lại trang là nhận thưởng lần nữa. | `src/game/village.js:30-31, 59-61`. ◐ | Đổi bước và lưu trước khi mở hộp thoại. | ít | code |
| P2 | Ba dòng mã bị chú thích `//` nuốt mất (đúng cái bẫy đã ghi trong CLAUDE.md): biển "Ben's Word Jars" không bao giờ hiện; câu kiểm "độ phân giải không đổi thì thôi" không chạy; một lệnh đặt Sam (vô hại). | `src/world/village.js:199`; `main.js:197`; `main.js:375`. ✔ | Tách dòng; thêm unit test dò mẫu `// … tên(…);` ở cuối dòng. | ít | code |
| P2 | "Đổi người chơi" không dọn trạng thái: đang ở trong nhà mà đổi thì bé kia thấy nhà bé trước và có quyền chủ nhà. | `main.js:236, 723`. ◐ | Đầu `chooseProfile` gọi `leaveRoom()`, đóng mọi bảng. | ít | code |
| P2 | Tên người chơi chèn thẳng vào HTML ở bảng quản trị, bảng nhà, sổ nhiệm vụ; tên có ký tự `<` làm vỡ bảng. | `src/ui/admin.js:40`; `home.js:91-93`; `journal.js:83, 100`. ✔ (admin.js:40) | Dùng chung hàm `esc()` đã có trong `ui.js`. | ít | code |
| P2 | Giáp và áo choàng đặt theo thân Ngọc nên có thể lệch trên Ruby/Luna/Mika; quà rương vẫn tặng phụ kiện Ngọc cho Luna/Mika (không mặc được). | `main.js:856-864, 554, 971`. ? (chưa chụp) | Bảng bù như `HERO_FIT` cho giáp; lọc quà theo nhân vật. | vừa | code + Blender |
| P2 | Đổi giờ máy tính để mở lại rương, bong bóng chữ, nhiệm vụ ngày, quà thú, cây trồng chín ngay. | `src/game/chests.js:35`; `quests.js`; `farm.js`. ◐ | Lưu ngày lớn nhất từng thấy, chỉ nhận ngày lớn hơn. | vừa | code |
| P2 | Tìm đường tự đi nhận cả bước lên dốc không leo được (550 cặp ô ở Làng, 2.164 ở Rừng). | `src/core/nav.js:51`. ◐ | Chỉ kiểm chiều đi tới. | ít | code |
| P2 | Âm thanh: tắt tiếng vẫn chạy bộ phát ngầm; mở game lúc tắt tiếng rồi bật lại thì không có nhạc tới khi đổi map. | `src/audio.js:51, 112, 123`. ◐ | `stopLoop` khi tắt, `startLoop` khi bật. | ít | code |

### 1c. Hiệu năng (máy không card đồ hoạ rời)

Ước lượng tải mỗi map (tính từ file và mô phỏng thuật toán rải cây, **chưa đo trong game**):

| Map | Tam giác mỗi khung hình | Lệnh vẽ | Tải về |
|---|---|---|---|
| Làng | ~4–7 triệu | 450–800 | ~55–60 MB lúc khởi động |
| Biển | ~2,7–3,3 triệu | 300–450 | thêm ~3 MB |
| Rừng | ~3,2–4,3 triệu | 300–500 | thêm ~1 MB |

Ngân sách trong `docs/PERFORMANCE_BUDGET.md`: 700 nghìn tam giác, 150 lệnh vẽ, tải 20 MB, ảnh ≤ 1024 px. Hiện vượt 4–10 lần; tài liệu đó đã cũ.

| Mức | Vấn đề | Bằng chứng | Đề xuất cách sửa | Công sức | Dùng gì |
|---|---|---|---|---|---|
| P0 | Gói cây cỏ mới (24/11) rất nặng và luôn vẽ hết: một bụi dương xỉ 7.840 tam giác × ~63 bụi, bồ công anh 5.186 × ~74… Không cắt theo tầm nhìn, không giảm theo mức đồ hoạ. Khớp với ghi chú "máy test chậm hẳn từ lượt 50". | `src/world/plants.js:31-33, 50` (`frustumCulled = false`); đo GLB: `fern_lush` 7.840, `dandelion` 5.186, `grass_daisies` 2.624. ✔ (số tam giác từng file); tổng ~4 triệu là ước lượng | (1) Giảm lưới: cỏ ≤ 150, dương xỉ ≤ 300, bụi ≤ 600, cây ≤ 1.500 tam giác. (2) Nhân số lượng với mật độ của mức đồ hoạ (Thấp 20%). (3) Chia ô 30–40 m để cắt theo tầm nhìn, ẩn ô xa hơn 70 m. | vừa | Blender + code |
| P0 | Tự hạ đồ hoạ không bao giờ chạy: điều kiện đòi độ phân giải ≤ 61% trong khi sàn đã nâng lên 80%. Máy Intel tích hợp kẹt ở mức Vừa dù dưới 26 khung hình/giây. | `main.js:1471` so với `main.js:197` (`Math.max(0.8, …)`). ✔ | Đổi thành `<= 0.81`; nhận diện GPU Intel HD/UHD để khởi động ở mức Thấp; cho sàn xuống 60–65% khi dưới 30 khung hình/giây. | ít | code |
| P1 | Ảnh vân quá lớn, chưa nén: Tom 2048×4096; Ngọc và 5 NPC 2048²; 13–14 nhà và quầy mới mỗi cái 1536². Ước ~370–480 MB bộ nhớ đồ hoạ ngay khi vào Làng. | Đo GLB (`npc_tom_elder_v03`: 2048×4096). ✔ (kích thước ảnh); số MB là ước lượng | Thu về 1024 (nhà, quầy 512–768) bằng `tools/tripo/optimize.py`; lọc bất đẳng hướng theo mức đồ hoạ. | vừa | Blender |
| P1 | 5 dân làng và 7 chủ trò được tải thành 12 bản riêng, không qua bộ nhớ đệm, mỗi bản một ảnh 2048². Chủ trò luôn bị vẽ dù ở mép bản đồ. | `main.js:1301, 1353` dùng `loader.loadAsync` trực tiếp. ◐ | Dùng `animatedModel(name)` rồi clone vật liệu; ẩn khi xa hơn 50 m. | ít | code |
| P1 | Mọi NPC, quái, thú tắt cắt-theo-tầm-nhìn và đều đổ bóng; golem dung nham 16 mảnh vật liệu = 16 lệnh vẽ mỗi con. Viền hoạt hình nhân đôi tam giác nhân vật (Ruby 88,5 → 177 nghìn). | `actors.js:19, 220`; `combat.js:184`; `pet.js:61`; đo `mob_golem_lava`: 12.000 tam giác, 16 vật liệu. ✔ (số đo golem) | Ẩn quái và NPC xa hơn 60 m; gộp vật liệu; mức Vừa dùng bóng 1024. | vừa | code + Blender |
| P1 | Mức Thấp chưa đủ thấp: vẫn còn nguyên gói cây cỏ mới, khử răng cưa, lọc ảnh 16×, tầm nhìn 700 m. | `main.js:96, 106, 162`. ◐ | Thêm mức "Rất thấp": bỏ cỏ hoa mới, tầm nhìn 150 m, độ phân giải 50%. | ít–vừa | code |
| P1 | Vào game tải hết ~55–60 MB ngay từ đầu, kể cả vành ngoài Biển và Rừng mà bé chưa tới. | `main.js:1256-1353, 1279`. ◐ | Dựng vành ngoài và NPC vùng khác khi vào vùng đó. | vừa | code |
| P1 | Trong nhà: mỗi khối hộp một lệnh vẽ (vài trăm mỗi tầng), 6–9 đèn điểm; mỗi lần mua đồ dựng lại cả nhà. | `src/world/interior.js:9-12, 190`; `homewalk.js:146`. ◐ | `bake()` phần vỏ theo tầng; 1 đèn điểm cho tầng đang đứng. | vừa | code |
| P2 | Việc thừa mỗi khung hình: quét điểm tương tác mỗi khung; `homes.refresh()` 12 lần/giây với `JSON.stringify` cả đồ đạc; thế giới ngoài vẫn cập nhật khi bé ở trong nhà. | `main.js:1421, 1460, 1396-1408`; `homes.js:239`. ◐ | Đưa vào khối 12 lần/giây; chỉ gọi khi có thay đổi. | ít–vừa | code |
| P2 | Bản .exe vẫn vẽ hết tốc lực khi thu nhỏ cửa sổ. | `desktop/main.js` (tắt `backgroundThrottling`); không có `visibilitychange`. ✔ (không có trong mã); mức ảnh hưởng ? | Dừng vòng vẽ khi cửa sổ ẩn. | ít | code |
| P2 | Cảnh không đặt lại "hạt giống" khi dựng lại map: hoa, cỏ, nấm nằm chỗ khác sau mỗi lần quay lại. | `src/world/common.js:9`. ◐ | Hàm `reseed()` gọi đầu `buildWorld`. | ít | code |

**Ba phép đo anh tự làm được trên máy nhà:**
1. Vào Làng, bấm **F3**, chụp màn hình ở cả ba mức đồ hoạ: dòng GPU (có chữ Intel/SwiftShader không), FPS, số tam giác, số lệnh vẽ. Tam giác trên 3 triệu là xác nhận vấn đề cây cỏ.
2. Vẫn bật F3, nhìn thẳng xuống đất rồi nhìn ra xa. Nếu số tam giác gần như không đổi thì cây cỏ không được cắt theo tầm nhìn.
3. Mở Task Manager → Performance → GPU, xem bộ nhớ GPU tăng bao nhiêu sau khi vào game (dự đoán trên 700 MB).

### 1d. Mã chết và trùng lặp

| Mức | Vấn đề | Bằng chứng | Đề xuất | Công sức | Dùng gì |
|---|---|---|---|---|---|
| P2 | Dấu "!" trên đầu chủ trò luôn sáng vì không còn chỗ nào ghi `profile.plays`. | `main.js:1425-1455`; grep không thấy chỗ gán. ✔ | Bỏ, hoặc gắn với "chưa chơi hôm nay". | ít | code |
| P2 | Mã không còn chạy: đua xe 2D và nhánh chữ cái của đua xe 3D (`words = []`); trò câu cá cũ và 8 vòng đua vẫn dựng trong cảnh; `fishGame` được import mà không gọi; `villaExterior`; mô hình hội trường xanh nạp cho mỗi lô nhà rồi ẩn vĩnh viễn. | `src/ui/arcade.js:308-449`; `race3d.js:51`; `minigames.js`; `main.js:27`; `homes.js:148, 202`. ✔ (race3d:51, main:27); còn lại ◐ | Xoá dần, mỗi lượt một cụm, chạy unit sau mỗi bước. | vừa | code |
| P2 | Hai nơi cùng giữ điều kiện mở map (`map2Ready`/`forestReady` và `CONDITIONS`), dễ lệch nhau. | `rules.js:370-372`; `world.js:41-42`. ✔ | Giữ một nơi. | ít | code |
| P2 | `main.js` 154 KB, ~60 biến toàn cục; câu hỏi 3–4 lựa chọn viết lại 5 lần. | `main.js:683, 696, 1040, 1076, 1340`. ◐ | Tách dần: `quiz.js` → `look.js` → `interact.js` → `regions.js`. Chạy công cụ định dạng (mỗi lệnh một dòng) sẽ hết hẳn bẫy chú thích nuốt mã. | nhiều | code |
| P2 | `demo/mini_games.html` không được file nào dùng. | grep. ◐ | Xoá. | ít | code |

---

## 2. Luật chơi và cân bằng

Số liệu dưới đây tính bằng script từ `src/core/progress.js`, `rules.js`, `zones.js`. Giả định: chỉ chém thường (0,85 giây/nhát), 2,5 giây di chuyển mỗi con, hồi sinh 35 giây, không chết, chưa tính nhiệm vụ.

**Giờ cày quái để lên cấp**

| Đoạn | Số quái | Giờ | Ghi chú |
|---|---|---|---|
| Cấp 1→2 | 60 | 0,1 | bãi Thỏ |
| Cấp 2→3 | 180 | 0,4 | Slime xanh |
| Cấp 3→4 | 380 | 1,0 | Yêu tinh |
| Cấp 4→5 | 640 | 1,9 | Slime đỏ, bãi chỉ 4 con |
| **Map 1** | **1.260** | **~3,4** | tay không ~4,2 giờ |
| Map 2 (cấp 5→10) | ~3.100–3.400 | **~10** | 1,5–2,6 giờ mỗi cấp |
| Map 3 (cấp 10→20) | ~6.800–8.000 | **~27** | 1,6–3,6 giờ mỗi cấp |

**Vàng:** quái Map 1 cho ~6.900 vàng, trọn bộ trang bị đúng cấp chỉ 560 vàng (8%). Tới cấp 20 thu ~142.000–167.000, mọi thứ mua được cộng lại ~99.000.

| Mức | Vấn đề | Bằng chứng | Đề xuất | Công sức | Dùng gì |
|---|---|---|---|---|---|
| P1 | Map 1 không dài "một tuần" mà lại nhàm: cày thuần 3,4 giờ, nhưng 51% số quái dồn vào cấp 4 ở một bãi 4 con, hơn một phần ba thời gian là đứng chờ quái mọc lại. | `progress.js:26-29`; `zones.js`; `rules.js:36`. ✔ (bảng số em tự chạy lại) | Xem "Phương án nhịp độ" dưới bảng. | vừa | code |
| P1 | Map 2 và 3 quá ì: mỗi cấp 655–880 quái. Cảng thiếu bãi cấp 7; Rừng thiếu cấp 11, 13, 15, 17, 19, nên bé phải đánh quái thấp hơn và mất 20% EXP. | `progress.js:27` (+15 quái mỗi cấp sau cấp 4). ✔ | Sau cấp 4 đặt khoảng 200 + 10·cấp; thêm bãi cho cấp lẻ. | vừa | code |
| P1 | Tốc độ lên cấp do thời gian hồi sinh quyết định, không do sức mạnh: tay không chỉ chậm hơn 15–25%. Mua kiếm hay học phép gần như không giúp lên cấp nhanh hơn. | `rules.js:36` (`RESPAWN` 35 giây); mỗi bãi 2–5 con. ✔ (số liệu) | Hồi sinh 15–18 giây, mỗi bãi 7–8 con, đồng thời giảm số quái cần. | ít | code |
| P1 | Bắn phép từ xa: quái chỉ đuổi khi bé cách dưới 8–10 m, trùm chỉ bắn khi dưới 14 m, trong khi phép đơn tầm 18 m. Đứng xa bắn là quái và trùm đứng yên chịu đòn. | `src/game/combat.js:359, 383`; `spells.js:44`. ✔ (dòng 359) | Bị đánh thì đặt "thù" 6 giây, đuổi và bắn bất kể khoảng cách. | ít | code |
| P1 | Đánh vượt cấp lợi bất thường: quái cao hơn bé trả đủ EXP, chết không mất gì. Bé cấp 1 đánh Quỷ Lửa cấp 5 được gấp đôi EXP mỗi phút so với đánh Thỏ. | `progress.js:92`; `combat.js:391`. ◐ | Quái cao hơn bé quá 2 cấp chỉ trả EXP như quái cấp bé + 2. | ít | code |
| P1 | Bẫy mềm ở cấp 5: lên cấp 5 trước khi hạ Vua Slime thì mất EXP lần đầu của trùm, và sau 30 con quái thì quái trả 0 vàng trong khi vẫn cần mua bánh để đánh trùm. | `combat.js:307`; `progress.js` `CAP_GOLD`. ◐ | Chưa hạ trùm của map thì chưa đếm lượt giảm vàng. | ít | code |
| P1 | Câu cá: trả phí và 3 câu hỏi một lần rồi câu vô hạn; bán cá không qua luật "vàng giảm ở cấp tối đa". | `src/game/fishing.js:125, 190`. ◐ | Một vé = 8–10 lần thả cần. | ít | code |
| P1 | Hũ chữ của Ben chơi lại vô hạn, mỗi hũ đúng cho EXP (39 EXP ở cấp 4, quái cấp 4 cho 22), không mất phí. Trái luật "EXP chỉ từ quái và nhiệm vụ". | `src/game/village.js:76, 105-106`; `scaleExp(4, 5) = 39`. ✔ | **Cần anh quyết.** Em nghiêng về giữ (đây là lúc bé tự nguyện học) nhưng đặt trần mỗi ngày. | ít | code |
| P1 | Vàng thừa, phí mini game vô nghĩa: thu gấp 12–40 lần giá trang bị; một lượt mini game bằng 30–40 giây đánh quái. | `progress.js:75, 98-104`. ◐ | Giảm vàng quái, tăng giá vũ khí, hoặc thêm thứ đáng mua. | ít | code |
| P1 | Biệt thự lâu đài cần cấp 25, cấp tối đa hiện là 20. | `src/core/house.js:12`. ✔ | Hạ xuống cấp 18–20. | ít | code |
| P1 | Hệ Sét vượt trội khi đánh trùm: tuyệt kỹ dồn 14 tia vào một mục tiêu ≈ 15 lần công; Băng 2,6; Gió 5,3; Lửa ~6,4. | `src/game/spells.js`; `src/core/skills.js`. ◐ | Mỗi quái nhận tối đa 5 tia; tăng Băng. | ít | code |
| P2 | Bảng săn và nhiệm vụ ngày vô nghĩa từ cấp 3: một vòng bảng săn ở Làng 467 EXP = 3% thanh cấp 4; nhiệm vụ ngày ≈ 19 con quái. | `rules.js:342` (em chạy: 55–105 EXP mỗi việc); `quests.js` `dailyReward`. ✔ | Trả theo % thanh. | ít | code |
| P2 | Quái bắn xa (9/15 loại) gần như vô hại: đạn bay 7 m/s, bé chạy 9,2 m/s. | `combat.js:359, 407`. ? | Đạn 11–12 m/s. | ít | code |
| P2 | Bánh mì hồi máu tốt hơn mọi bình máu và không có thời gian chờ: bấm Q liên tục là qua mọi trùm. | `rules.js:55-61`. ◐ | Chờ 5 giây giữa hai lần dùng. | ít | code |
| P2 | Bạch Tuộc và Nữ hoàng Nấm không bắt buộc: vào Rừng chỉ cần huy hiệu, cấp 10 và bài thi, bỏ qua được mảnh La Bàn 2. | `src/core/world.js:41`. ✔ | Thêm điều kiện `boss4`. | ít | code |
| P2 | Trang trại ngược đời: cà rốt lời nhất, bí ngô tệ nhất; chuồng lợn 900 vàng không bao giờ hoàn vốn. | `src/core/farm.js:10-17`. ◐ | Cây lâu hơn phải lời hơn mỗi phút. | ít | code |
| P2 | Bỏng (burn) xuyên khiên chữ của trùm. | `combat.js:365`. ◐ | Bỏ qua khi khiên đang bật. | ít | code |
| P2 | Tài liệu lệch mã: `docs/GAME_DESIGN.md` (EXP từ mọi thứ, trùm cấp 8/18), `docs/KY_NANG.md` (6 nhánh, cấp 180), `docs/CAP_DO_QUAI_TRANG_BI.md` (tên Stone Golem, Gale Orc). | các file đó. ◐ | Sinh lại từ mã; ghi "đã cũ" ở đầu file chưa sửa. | ít | code |

**Phương án nhịp độ Map 1 để anh cân nhắc** (chưa chơi thử; phải đổi luật "EXP chỉ từ quái và nhiệm vụ"):
- Giảm quái: `KILLS_TABLE = [25, 60, 110, 160]` (355 con, khoảng 1–1,5 giờ đánh), hồi sinh 15–18 giây, bãi 7–8 con.
- Thêm EXP gắn tiếng Anh, tính theo % thanh, **có trần mỗi ngày** (~50% thanh): từ mới thuộc 1,5% mỗi từ (tối đa 6 từ/ngày); rương khoá chữ 2%; trả lời đúng cổng mini game lần đầu trong ngày 2%; nhiệm vụ ngày 5% × 3.
- Kết quả ước tính: cấp 1–3 trong 1–2 buổi, cấp 3→5 mất 3–4 ngày; cả Map 1 khoảng 5–7 ngày × 2 giờ, tỉ lệ học 30–40%.
- Ý chính: "một tuần" đến từ **trần học mỗi ngày**, không từ số quái. Bé chăm học thì lên nhanh hơn bé chỉ cày.

---

## 3. Mạch truyện và câu chuyện

**Nhận định chung.** Lời thoại tiếng Anh sạch, đúng trình độ, có bản riêng cho lớp 6 và lớp 8: phần này nên giữ. Nhưng truyện gần như dừng sau chuỗi làng (thư → hũ chữ → sửa cầu → huy hiệu). Từ đó tới Vua Slime là 1.260 quái với 6 việc "hạ N con" và không NPC nào nói câu mới. Cảng Mặt Trời không có chuỗi truyện, chỉ có danh sách việc. NPC là quầy hàng hoặc người giao việc; không có bạn hay đối thủ cùng tuổi; phản diện Lord Hush chỉ hiện chữ 3 lần với lý do "ghét từ ngữ". Giọng "con", "little hero" hợp lớp 3–4 hơn lớp 8 (nhận định chủ quan).

| Mức | Vấn đề | Bằng chứng | Đề xuất | Công sức | Dùng gì |
|---|---|---|---|---|---|
| P0 | Sau huy hiệu, dòng mục tiêu ở Làng và Tom luôn chỉ ra cổng rừng (cần cấp 10 + bài thi). Việc thật là Đồng Hoang → Vua Slime → Cú Mèo → Biển. | `main.js:243` ("Go to the forest gate in the north-west. ★"), `:284`; `village.js:38`. ✔ | Lấy dòng mục tiêu từ `mainCurrent()`; Tom nói theo cờ. | ít | code |
| P0 | Tom nói mảnh La Bàn của làng "the forest remembers where it is", nhưng mảnh 1 do Vua Slime giữ. | `src/game/saga.js:10` so với `:30`. ✔ | "The Slime King took it to the Wild Meadow." | ít | lời thoại |
| P0 | Bến thuyền báo "Lên cấp 20 và qua bài kiểm tra… để mở Map 2"; luật thật là cấp 5 + Vua Slime + Cú Mèo, và Làng chỉ cho tới cấp 5. | `main.js:1158` so với `rules.js:370`. ✔ | Dùng lại `CONDITIONS.sea`. | ít | code |
| P1 | Chữ sót của thứ tự map cũ: "Chương cuối Map 1: vào Rừng"; quầy Willow "đồ Map 2" ở cả cảng lẫn rừng; thẻ Hành trình không biết Rừng là Map 3; dòng "Chapter complete! The Ancient Golem has the Compass piece." ở Làng. | `quests.js:30`; `main.js:284, 619, 1126, 1139`; `journal.js:80`. ✔ (quests:30, main:284, journal:80) | Sửa từng dòng. | ít | code |
| P1 | Tiền đề không thấy trong game: mở đầu nói vùng đất mất màu, mất từ; làng vẫn đủ màu, ai cũng nói bình thường. | `src/game/content.js:172`; `quests.js:17`. ◐ | Bỏ "mất màu"; cho biển hiệu hoá "???" (nhiệm vụ mẫu 1). | vừa | code + lời thoại |
| P1 | Pip: tài liệu ghi "đi theo suốt hành trình"; mã chỉ cho hiện ở cầu, cổng rừng, rừng; tới cấp 10 mới tự giới thiệu. | `main.js:364, 376, 382`; `content.js:62`. ◐ | Pip bay theo ở mọi map, giới thiệu lúc sửa cầu. | vừa | code |
| P1 | 20 nhiệm vụ chính: 5 có tình huống đọc hiểu, 6 hạ quái/trùm, 4 bài Cú Mèo, 5 kiểu "đi tới / chơi đủ / gom đủ". 19 việc bảng săn đều "hạ N"; 15 nhiệm vụ ngày đều là bộ đếm. Không có lựa chọn nào có hậu quả. | `quests.js:14-34, 45-60`; `rules.js:314-340`. ✔ (đã đọc `quests.js`) | Nhiệm vụ mẫu bên dưới. | vừa–nhiều | code + lời thoại |
| P1 | Cảng không có người kể chuyện; Willow ở cảng lại nói về rừng. | `main.js:1122-1127`; `shop.js:36, 38`. ◐ | Bạch Tuộc sau khi tỉnh thành NPC cảng; viết thoại riêng. | vừa | lời thoại |
| P1 | Người Cây là quái phải hạ trong khi Cây Cổ Thụ là bạn; "Lava Golem" lại mang hệ Sét; việc săn golem ghi "by the farm" nhưng bãi golem ở bờ Đông. | `rules.js:19, 30, 318, 330`; `zones.js:16`. ◐ | Nhiệm vụ mẫu 7; đổi tên "Storm Golem". | ít | lời thoại |
| P2 | Trùng tên: Leo (đua xe, đầu bếp cảng, Hội Đèn), Mia (may làng, boutique cảng), Ruby (salon **và** nhân vật người chơi), Mimi (chủ trò kẹo và mèo). "Người Giữ Từ" lẫn "Người Giữ Chữ". | `minigames.js:22, 24`; `pet.js:11`; `world.js:41`. ✔ (world.js:41) | Đổi tên. | ít | lời thoại |
| P2 | Giọng người làm game lọt vào game: "Khu này sắp mở, em đang xây."; Tom nói "Map 2", "Unit". | `world.js:44`; `main.js:253`. ✔ (world.js:44) | Viết lại theo giọng nhân vật. | ít | lời thoại |
| P2 | Lỗi tiếng Anh nhỏ: "for **your** wardrobe" (nhân vật tự nói) → my; "lives **on** the clearing" → in; "Let us play!" → Let's; lẫn Anh-Mỹ (Harbor, Armor) với Anh-Anh (colour, Armour) trong khi sách dùng Anh-Anh. | `main.js:563`; `saga.js:18, 20`; `pet.js:7, 10`; `rules.js:54`. ◐ | Sửa; chọn một kiểu chính tả. | ít | lời thoại |
| P2 | Ba tài liệu có ba danh sách map khác nhau; `COT_TRUYEN.md` còn ghi Golem Cổ = mảnh 1. | `docs/MAP1_PLAN.md`, `THE_GIOI_10_MAP.md`, `LO_TRINH_12_UNIT.md`, `COT_TRUYEN.md:41`. ◐ | Gộp một file cốt truyện. | ít | tài liệu |

### Đề xuất cốt truyện (tự viết, không mượn tác phẩm nào)

**Xương sống.** Gió Đen không phá từ ngữ, nó *lấy cắp*. Mỗi mảnh La Bàn giữ một loại từ; mất mảnh nào, vùng đó mất loại từ ấy và bé **thấy tận mắt**:
- Làng mất *tên gọi*: biển hiệu thành "???". Hũ chữ của Ben là cách dân làng cất từ khỏi gió.
- Biển mất *lời chỉ đường*: hải đăng không gọi được tàu. Thuyền trưởng Bạch Tuộc vốn là hoa tiêu của cảng.
- Rừng mất *ký ức* (chuyện đã qua, khớp với thì quá khứ).

Lấy lại mảnh nào, loại từ ấy trở về và vùng đất đổi khác. Bí ẩn kéo dài: Lord Hush từng là Người Giữ Chữ nhỏ tuổi nhất, tên Hugh, học trò của Cú Mèo. Một lần cậu nói sai trước cả Hội và bị cười, từ đó tin rằng lời nói chỉ làm đau. Mỗi map hé một mảnh ký ức của Hugh. Map 4–10 mỗi vùng một loại từ (sa mạc = câu hỏi, núi = so sánh, trời = ước mơ…). Kết: không đánh gục Hush mà ghép đúng câu cậu chưa từng được nghe.

**Nhân vật nên thêm hoặc đào sâu**
1. **Kit** (13 tuổi, đối thủ rồi thành bạn; cháu của Sam). Tự chế đồ, luôn tới trước một bước, để lại giấy nhắn. Câu cửa miệng: "Too slow, rookie!", về sau "Not bad, partner." Bí mật: đọc giỏi nhưng không dám nói thành tiếng.
2. **Lord Hush / Hugh**: nói nhỏ, lịch sự, không gào. "Shh. Words only hurt." Bí mật: vẫn giữ một hũ chữ có từ đầu tiên cậu học, *friend*.
3. **Bà Quill** (tên cho Cú Mèo): nghiêm, khô mà hài. "Hoo told you that? Check it twice." Bí mật: chính bà đã cười Hugh; mỗi bài thi là cách bà chuộc lỗi.
4. **Pip**: tò mò, hay gọi sai tên đồ vật. "Ooh! What's that called?"
5. **Thuyền trưởng Bạch Tuộc** (sau khi tỉnh, đứng ở chợ cá): làm tám việc một lúc, hay nhầm tay. "Eight arms, no problem!"

**Nhiệm vụ mẫu** (đều dùng lại cơ chế đã có, không cần mô hình mới)

| # | Map | Tên · NPC | Ba bước | Tiếng Anh lồng vào | Phần thưởng cảm xúc |
|---|---|---|---|---|---|
| 1 | Làng | The Signs Forgot Their Names · Professor Finn | 5 biển hiện "???" → Finn đưa thẻ định nghĩa ("You buy bread here.") → bé tới đúng chỗ, chọn tên | đọc định nghĩa, từ chỉ nơi chốn | biển sáng lại vĩnh viễn, dân làng đổi câu chào |
| 2 | Làng | Sam's Lost Net · Sam, Kit | Sam mất lưới → 3 lời chỉ đường → thấy lưới kèm giấy "Too slow, rookie! – K" | hướng, số bước | Kit ra mắt |
| 3 | Làng | Why Are the Slimes Angry? · Pip | cứ ~30 quái rơi một mảnh chữ → ghép thành từ → một con quái hết giận ra giếng làng nói một câu ngớ ngẩn | ghép chữ | 1.260 quái thành ~40 mốc nhỏ, quảng trường đông dần |
| 4 | Biển | Message in a Bottle · người bán cá | câu được chai → xếp 4 mảnh thư đúng thứ tự → đào trên đảo, thấy nhật ký hoa tiêu của Bạch Tuộc | First/Then/Finally, quá khứ đơn | biết trùm từng là người tốt trước khi đánh |
| 5 | Biển | Who Took the Fish? · cướp biển nhí | đọc 3 lời khai → tìm câu mâu thuẫn → **chọn** tha hay báo | giờ, nơi chốn, phủ định | tha thì cậu nhóc ra bán cá và chào bé bằng tên |
| 6 | Rừng | Hazel's Wobbly Potion · Hazel | đọc công thức → hái 3 loại cỏ → xếp bước; sai thì tóc xanh lè 5 phút | số lượng, câu mệnh lệnh | hài hước |
| 7 | Rừng | The Treant Who Forgot · Cây Cổ Thụ | một Người Cây là "con" của cây cổ thụ → thay vì hạ, bé gọi đúng 3 từ theo định nghĩa → nó về gác trại | định nghĩa | gỡ mâu thuẫn bạn/quái |

**Hai đoạn thoại viết lại**

Tom chào (`village.js:25-26`). Trước: "Hi, {name}! I am Tom. The wind took my letter!"
Sau:
- "{name}! You are here at last. Look at this sign." (Cháu tới rồi! Nhìn tấm biển này đi.)
- "Yesterday it said BAKERY. Today it says nothing. The Dark Wind eats our words." (Hôm qua nó ghi TIỆM BÁNH. Hôm nay trống trơn. Gió Đen đang ăn chữ của làng.)
- "It took my letter too! It is near my hall. Run, before the wind reads it!" (Nó cuốn cả thư của ta! Ở gần nhà ta. Chạy đi, kẻo gió đọc mất!)

Lord Hush sau mảnh 1 (`saga.js:61-62`). Trước: "You will never find the other nine. My Dark Wind is waiting for you at the sea!"
Sau:
- "Shh… not so loud." (Suỵt… đừng to tiếng thế.)
- "One piece. I had all ten once. Do you know what words did to me?" (Một mảnh. Ta từng giữ cả mười. Ngươi biết lời nói đã làm gì ta không?)
- "They laughed. Go home. The sea is quiet now, and I like it." (Chúng đã cười. Về đi. Biển giờ yên lặng, và ta thích thế.)
- Pip: "He sounded sad. Is that strange?" (Nghe ông ấy buồn nhỉ. Lạ không?)

**Ba khoảnh khắc đáng nhớ, rẻ**
1. Buổi tối: Anna ra hát giữa quảng trường, dân làng đang đi bộ dừng lại quây quanh; bé nhấn E hát cùng một câu.
2. Sau thác nước trong rừng có một hũ chữ phủ rêu. Mở ra là tờ giấy trẻ con: "Hugh, age 9. My favourite word is FRIEND." Không nhiệm vụ nào chỉ tới đó.
3. Thắng Vua Slime: một slime tí hon đội vương miện ngồi trên thành giếng, nhấn E thì nó nói "Blub! BAKERY!". Mỗi trùm tỉnh lại thêm một vị khách ở quảng trường.

---

## 4. Học tiếng Anh

**Dữ liệu** (đã kiểm bằng script): 48 file, 1.405 từ, không file nào hỏng, không unit nào rỗng.

| Lớp | Số từ | Từ vựng đã đối chiếu | Ngữ pháp có câu hỏi |
|---|---|---|---|
| 6 | 408 | 12/12 unit | Unit 1, 2 |
| 8 | 471 | 12/12 unit | Unit 1, 2 |
| 7 | 261 | 0/12 | Unit 1, 2 |
| 9 | 265 | 0/12 | Unit 1, 2 |

Mỗi từ chỉ có chữ và nghĩa: **không phiên âm, không câu ví dụ**. Unit 3 (Map 3) không lớp nào có ngữ pháp.

**Tỉ lệ chơi/học thực tế** (ước lượng từ mã, chưa đo máy thật):

| Kịch bản | % thời gian có tiếng Anh |
|---|---|
| Bé chăm, làm hết bong bóng chữ, rương, mini game mỗi ngày | 11–17% |
| Bé chạy theo EXP (chỉ quái mới cho EXP) | 4–8% |
| Giờ chơi thứ hai trong ngày (bong bóng, rương đã hết) | 3–5% |
| Map 2, Map 3 | 3–5% |

Mục tiêu là 30%. Nguyên nhân gốc: mọi hoạt động học đều tách khỏi việc lên cấp (không EXP), còn mini game thì mất vàng mà không được gì. Lúc đánh quái không có chữ tiếng Anh nào ngoài nhãn "Lv N".

| Mức | Vấn đề | Bằng chứng | Đề xuất | Công sức | Dùng gì |
|---|---|---|---|---|---|
| P0 | Bãi quái cấp 1 tên "Frost Bunny / Thỏ Băng 🐰" nhưng mô hình là hoa ăn thịt; "Frost Goblin" là sói bóng tối; "Ember Imp" là pha lê dung nham. Bảng săn vẫn nói "Frost goblins froze our water bucket". Bé học sai tên con vật. | `main.js:173` (`bunny: 'mob_carnivorous_flower'`, `goblin: 'mob_shadow_wolf'`, `imp: 'mob_magma_crystal'`) so với `rules.js:14-18`. ✔ | Đổi tên, biểu tượng, câu bảng săn theo mô hình (lượt 59 đã làm cho golem, nấm, người cây). | ít | lời thoại |
| P1 | Câu lớp 8 "The buffalo walks ___ than the cow" lấy `slower`, giải thích "tính từ ngắn". Sau động từ cần trạng từ; sách dạy `more slowly`. Ngoài đời "walks slower" vẫn gặp, nhưng lời giải thích thì sai và lệch với lớp học. | `src/core/grammar.js:79`. ✔ | Đổi thành "The buffalo is ___ than the cow." | ít | lời thoại |
| P1 | Dữ liệu lớp 7 và 9 có lỗi nghĩa và chính tả (danh sách dưới bảng). Chưa ảnh hưởng hai bé lớp 6 và 8. | 4 mục em kiểm lại đều đúng như báo. ✔ | Sửa theo danh sách. | ít | dữ liệu |
| P1 | Game không theo kịp lớp học. Cuối tháng 11 lớp học khoảng Unit 5–6; game ở Unit 1. Unit 2 cần ~3.400 quái, Unit 3 cần ~8.000. Ô chọn Unit của phụ huynh đã bị bỏ. | `save.js:68-72` (`unitPick` chỉ còn cho admin và test). ✔ | Thêm lại "Unit đang học ở lớp" cho từng bé; map chỉ là bối cảnh, từ lấy từ Unit đã chọn cộng ôn Unit cũ. | vừa | code |
| P1 | Câu "chọn câu xếp đúng" trong bài thi lộ đáp án: chỉ câu đúng mới bắt đầu bằng chữ hoa và kết thúc bằng dấu chấm (94,5% số câu loại này). Chiếm 3/10 câu, cần đúng 8. | `src/core/exam.js:13-18, 48-53`. ✔ (đọc mã); con số 94,5% ◐ | Bỏ hoa và dấu câu trước khi xáo; hoặc phương án nhiễu sai một điểm ngữ pháp. | ít–vừa | code |
| P1 | Ôn ngắt quãng có dữ liệu thật nhưng bị "học dồn" phá: đúng cùng một từ 6 lần trong một ngày là 30 ngày sau mới hỏi lại. Từ Unit cũ chỉ quay lại ở Cú Mèo; cổng mini game không dùng lịch ôn. | `src/core/review.js:10-19`. ✔ | Chỉ lên hộp khi từ đã đến hạn; một nơi "ôn từ đến hạn hôm nay" lấy từ mọi Unit đã học. | ít–vừa | code |
| P1 | Trả lời sai không hậu quả: 3 lựa chọn, sai thì hiện đáp án rồi hỏi lại đúng câu đó; thẻ "Từ mới" hiện nghĩa ngay trước câu hỏi; thi rớt được thi lại ngay. Báo cáo cho phụ huynh vì thế đẹp hơn thật. | `main.js:679, 686`. ✔ | Sai thì đẩy câu xuống cuối và đổi phương án; chỉ ghi kết quả lần đầu. | ít–vừa | code |
| P1 | Phí + 3 câu hỏi + đọc to cho một trò không thưởng gì là "thuế". Bé sẽ né mini game và mất luôn kênh học chính. | `main.js:661-690`. ✔ (đọc luồng) | Đảo chiều: đúng ngay cả 3 câu thì miễn phí, hoặc được bùa +EXP đánh quái 10–20 phút. | ít | code |
| P1 | Khung ngữ pháp có vẻ lệch sách ở lớp 6 Unit 1, 2 và lớp 7, 9 Unit 2 (file ghi chú "đoán theo chủ đề"). | `grammar.js:5, 53, 65, 89`. ? (cần sách để so) | Anh hoặc giáo viên đối chiếu sách rồi mới viết lại. | vừa | việc của phụ huynh + lời thoại |
| P1 | Ngữ pháp Unit 1 gần như không được kiểm: cổng cấp 5 không hỏi ngữ pháp; bài thi cấp 20 chỉ có 10 câu từ vựng. | `grammar.js:103`; `exam.js:6-8`. ◐ | Cổng cấp 5 thêm 2–3 câu ngữ pháp; soạn ngữ pháp Unit 3 cho lớp 6 và 8. | vừa | lời thoại |
| P1 | Dạng bài nghèo: ~90% là trắc nghiệm nghĩa của từ đơn. Không có câu hỏi nghe; viết chỉ có ghép chữ ở rương. | `arcade.js:279-296`. ◐ | Thêm câu ví dụ tự viết cho Unit 1–3 lớp 6 và 8; thêm dạng nghe chọn từ, điền từ vào câu. | nhiều | lời thoại + code |
| P2 | Hai đáp án cùng đúng ở lớp 8 Unit 1: fancy, be fond of, be into đều ghi "thích". | `data/learning/g8_u01.json`; `main.js:683`. ◐ | Ghi nghĩa phân biệt; lọc theo từng vế nghĩa. | ít | dữ liệu |
| P2 | Hai câu ngữ pháp có phương án nhiễu cũng đúng: "___ I wear a hat…?" (`Do` vẫn đúng); "___ house has a big garden." (`Our` vẫn đúng về ngữ pháp). | `grammar.js:71, 63`. ✔ | Đổi nhiễu: `Does / Am`; `Its / Her`. | ít | lời thoại |
| P2 | Cổng trò luôn ghi "Chọn dạng đúng của động từ" kể cả câu giới từ, there is/are. | `main.js:677`. ✔ | "Chọn từ đúng điền vào chỗ trống". | ít | code |
| P2 | Giọng đọc đặt `en-US` trong khi sách dùng Anh-Anh; máy Windows tiếng Việt có thể không có giọng tiếng Anh và game không báo. Kiểm phát âm chỉ chạy ở bản web (cần Internet và micro), bản .exe bỏ qua. | `src/ui/speech.js:28`. ✔ (en-US); chất lượng giọng trên máy anh ? | Ưu tiên giọng `en-GB` và giọng "Natural"; báo khi máy thiếu giọng. | ít | code |
| P2 | Báo cáo phụ huynh không nêu từ nào yếu, dù dữ liệu có sẵn. | `journal.js:90-103`. ◐ | Thêm 10 từ sai nhiều nhất của mỗi bé. | ít | code |
| P2 | Hội Đèn Làng có bộ từ dự phòng ngoài unit (lamp, boat, fish…), trái quy tắc "chưa được soạn". | `src/ui/lantern/board.js:53`. ◐ | Thiếu từ thì báo chưa soạn, không thu phí. | ít | code |
| P2 | `units.json` lệch file thật (lớp 6 Unit 3 ghi 15 từ, thật 25; Unit 6 ghi 7, thật 17). | `data/learning/units.json`. ◐ | Sinh `units.json` từ các file unit. | ít | code |

**Lỗi dữ liệu cụ thể**
1. `g7_u04.json:66` "muscial instrument = nhạc cũ" → "musical instrument = nhạc cụ". ✔
2. `g9_u10.json:102` pesticide "thuốc diệt cỏ" → "thuốc trừ sâu". ✔
3. `g7_u12.json:47` castle "pháo đài" → "lâu đài" ✔; `:22` amazing "ngạc nhiên" → "đáng kinh ngạc"; `:91` "new Zealand" → "New Zealand".
4. `g8_u01.json:39` fishing net "lưới câu" → "lưới đánh cá" (từ này nằm trong thư Unit 1). ✔
5. `g7_u08.json:102` shocking "làng sửng sốt" → "gây sửng sốt"; `:122` "bảo lực" → "bạo lực"; `:91` scary "sợ hãi" → "đáng sợ".
6. `g7_u09.json`: "cannes Film Festival", "dutch", "mid-Autumn Festival" → viết hoa đúng.
7. `g7_u03.json:67` homeless "vô gia cư, không có gia đình" → bỏ vế sau.
8. `g9_u09.json:62` "trôi trảy" → "trôi chảy"; `g9_u08.json:67` "tạinhiều" → "tại nhiều".
9. `g9_u01.json:106` police officer "công an" → "cảnh sát".
10. Dạng từ: `g6_u06` firework → fireworks; `g6_u08` congratulation → congratulations; `g6_u11` earth → Earth, organize → organise; `g8_u07` devices → device; `g8_u08` saving → savings.
11. Thiếu từ lõi: lớp 6 Unit 2 "My House" không có sofa, sink, wardrobe (câu ngữ pháp lại dùng "sink") nhưng có cap, crazy, department store.

Mục 3 (trừ castle), 5–11 là trợ lý báo, em chưa mở từng dòng.

**Năm cơ chế lồng tiếng Anh vào chính việc đánh quái** (rẻ, làm bằng code)
1. **Quái mang bùa chữ.** Cứ ~5 con có một con mang bùa: hiện nghĩa tiếng Việt và 3 từ trên phím 1-2-3, trận không dừng. Đúng thì đòn ×2 và +20% EXP; sai thì quái hồi chút máu. Lấy từ đến hạn ôn của mọi Unit đã học. Map 1 sẽ có ~250 câu.
2. **Quái rơi mảnh chữ.** Đủ chữ thì mở màn ghép chữ sẵn có, thưởng lọ máu và EXP.
3. **Lửa trại nghe–chọn.** Lúc chờ quái hồi sinh hoặc sau khi ngất: máy đọc một từ, bé chọn nghĩa; đúng thì hồi đầy máu và bãi hồi sinh nhanh hơn. Đây là dạng nghe game chưa có.
4. **Lệnh săn bằng câu tiếng Anh.** Ví dụ lớp 8: "Sam detests seeing slimes near the bridge. Hunt five of them." Bé phải đọc hiểu con gì, ở đâu, bao nhiêu; có một lệnh nhiễu.
5. **Bùa "Trí nhớ hôm nay".** Làm xong lượt ôn ngày (5 từ đến hạn) thì +25% EXP quái trong 20 phút.

---

## 5. Bối cảnh và bố trí map

Không mở game: mọi số liệu tính bằng script trên dữ liệu bản đồ thuần (`regionkit`, `regions/*`, `zones`, `safe`, `world`, `nav`). Trợ lý đã vẽ bản đồ nhìn từ trên xuống cho từng map (file tạm, em gửi kèm trong hội thoại; không commit vào repo).

**Nhận xét từng map**
- **Làng**: lõi 30 m quanh quảng trường rất đặc (43 điểm nội dung), sông chia đôi. Bờ Tây có nhà và bốn trò chơi ở vành ngoài, mỗi trò có đường riêng. Bờ Đông chỉ có vườn táo và sáu bãi quái; từ vườn táo trở ra không còn đường, biển chỉ hay nhà nào. Năm rương dồn cả vào Đồng Hoang.
- **Cảng**: nửa đĩa, phía Đông là biển. Thị trấn, hai cầu tàu và hải đăng là cụm rõ nhất trong ba map. Nửa Tây là đồi cây với hai lối mòn. Cả map chỉ có 242 m đường và không có biển chỉ đường nào.
- **Rừng**: vào từ góc Tây Nam, đường vòng qua hai cầu và hàng đá, mốc rải đều. Đây là map có cấu trúc tốt nhất. Vành 80–92 m trống 55% và không có đường.
- **Đảo Kho Báu**: 7 mốc trên khoảng 2.000 m², đủ cho trò kho báu.

| | Làng | Cảng | Rừng |
|---|---|---|---|
| NPC đứng trong map | 12 cố định + 5 chủ trò + 5 dân đi bộ | 2 | 5 |
| Điểm bấm E | 50 (+12 sao) | 28 | 24 (+9 pha lê) |
| Bãi quái / số quái / trùm | 6 / 24 / 1 | 4 / 16 / 1 | 5 / 19 / 2 |
| Công trình | 28 nhà + 12 quầy | 20 | 17 |
| Tổng chiều dài đường | 780 m | 242 m | 457 m |
| Hai điểm xa nhất | 196 m, chạy 21 giây | 150 m, 16 giây | 168 m, 18 giây |
| Vùng trống ở vành ngoài cùng | 37% | 31% | 55% |

Nhân vật đi 6,4 m/s, chạy 9,2 m/s: băng cả map chỉ khoảng 20 giây. Vấn đề của vành ngoài là **thiếu nội dung**, không phải xa.

| Mức | Map | Vấn đề | Bằng chứng | Đề xuất | Công sức | Dùng gì |
|---|---|---|---|---|---|---|
| P1 | Rừng | Bãi Người Cây (cấp 18) nằm trên đỉnh vách Bắc cao ~9,6 m, không có đường. Đi thẳng hoặc chéo 45° vào vách: 0/143 điểm thử lên được; chỉ lên được khi đi xiên rất nghiêng. Bé sẽ tưởng không lên được. | `src/core/zones.js:29`; vách ở `regions/forest.js:40`. ✔ (em chạy lại script mô phỏng bước đi); chưa xét nhảy, chưa xem trong game | Dời bãi xuống chân thác, hoặc làm bậc đá cạnh thác kèm đoạn đường. | vừa | code (bậc đá đẹp: Blender) |
| P1 | Rừng | Bãi Nấm (cấp 16): cả 3 quái đứng trên vách đá Đông cao ~8 m. Đi thẳng hướng Đông 0/111 lên được. | `zones.js:28`; độ cao tại (64, −16) là 8,3 m, tại (58, −16) là 0,4 m. ✔ | Dời tâm bãi về khoảng (50, −16), nền phẳng. | ít | code |
| P1 | Làng | Bãi Golem ở cao nguyên Đông Bắc (8,7 m). Từ Đồng Hoang là vách (0/71). Lối duy nhất là dốc phía Tây, không đường, không biển. | `zones.js:16`. ✔ | Thêm đường và biển "Golem ↗", hoặc dời bãi xuống đồng. | vừa | code |
| P1 | Cả 3 | Bấm bản đồ nhỏ để tự đi: tuyến được vạch xuyên vách, nhân vật dừng ở chân vách. | `src/core/nav.js:51`. ◐ | Chỉ kiểm chiều đi tới. | ít | code |
| P1 | Rừng | Golem Cổ (trùm cấp 19) đặt đúng toạ độ tháp canh (49, −44), tức nằm trong vật cản. Pha lê "Watchtower" của nhiệm vụ đầu rừng cách trùm 5,7 m. | `combat.js:11`; `world/forest.js:82`; thấy rõ trên bản đồ vẽ. ◐ | Dời trùm ra bãi trống cách tháp ít nhất 10 m. | ít | code |
| P1 | Làng | Bến thuyền đi Cảng gần như không bấm được: điểm câu cá cách 0,6 m và được hỏi trước. (Cổng dịch chuyển vẫn đi Cảng được.) | `main.js:1158`; `fishing.js:11`. ◐ | Dời điểm lên thuyền, hoặc bỏ thuyền. | ít | code |
| P1 | Cảng, Rừng | Quái cấp cao đứng ngay trên lối nhiệm vụ: cướp biển (cấp 9, bắn xa) phủ đường ra hải đăng và một rương; ma trơi (cấp 12) phủ pha lê Camp, một rương, cách Sam ~10 m, trong khi bé vào rừng ở cấp 10. | `zones.js:22, 26`. ◐; độ khó ? | Lùi mỗi bãi ~15 m; thêm vùng an toàn ở Camp. | ít | code |
| P1 | Cả 3 | Số quái mỗi bãi quá ít so với thanh EXP: cấp 4 cần 640 quái mà bãi Slime Đỏ có 4 con; cấp 7–8 ở Cảng chỉ có bãi hải âu 3 con; Người Cây 3 con. | `zones.js`; `progress.js:26-27`. ✔ | Mỗi cấp hai bãi ở hai hướng, hoặc bãi 8 con; thêm quái cấp 7. | vừa | code |
| P1 | Làng | Bờ Đông **không** bị khoá bởi nhiệm vụ sửa cầu: Cầu Làng luôn mở, mọi bãi quái tới được từ đầu. Sửa cầu Nam chỉ rút đường tới bãi Slime từ 96 m xuống 77 m. Lệch với ghi chú trong CLAUDE.md. | `regions/village.js:64`. ◐ | Chấp nhận và sửa lời thoại, hoặc dời bãi Slime xuống hẳn phía Nam cầu Nam để cầu có ý nghĩa. | ít | code |
| P1 | Làng, Cảng | Bãi quái không có đường hay biển dẫn tới (cách đường 20–42 m). Cảng không có biển chỉ đường nào; biển ở Làng không nhắc bốn trò vành ngoài. | biển chỉ đường chỉ có ở `world/village.js:201-213` và `world/forest.js:128`. ◐ | Thêm đường nhánh và cột biển ghi cấp ở ngã ba. | vừa | code |
| P2 | Cả 3 | Bản đồ nhỏ chỉ có chấm quái, không có vòng bãi, tên hay cấp. Bé không biết bãi hợp cấp mình ở đâu. | `src/ui/minimap.js`. ◐ | Vẽ vòng bãi kèm "Lv N"; tô sáng bãi đúng cấp. | ít | code |
| P2 | Làng | Bảy quầy có biển tên (Sweets, Potions, Gifts, Fruit, Bakery, Flowers) chỉ là trang trí, bấm E không có gì. | `regions/village.js:27, 46`. ◐ | Mỗi quầy một câu chào kèm từ vựng, hoặc bán đồ tương ứng. | ít | code |
| P2 | Làng, Cảng, Rừng | Điểm tương tác quá gần nhau: Poppy ↔ Lily 3,5 m (dễ nói nhầm người); chợ cá che 90% một bong bóng chữ; Tom và Pip ở Rừng cách nhau 1,1 m. | tính khoảng cách mọi cặp. ◐ | Dời cho cách nhau trên 4 m. | ít | code |
| P2 | Làng, Rừng | Vành ngoài không có gì để tìm: 12 sao đều trong bán kính 58 m; rương Làng dồn một chỗ. | `minigames.js:13`; `chests.js:9`. ◐ | Rải 4–5 rương và sao ra vành. | ít | code |
| P2 | Cả 3 | Ba map cùng một khuôn đĩa tròn; độ cao chỉ là vách chắn. Có ngày đêm, dân đi bộ, cá bơi; không có thời tiết hay sinh vật nền (chim, bướm). | `regionkit.js`. ◐; cảm giác ? | Xem điểm nhấn bên dưới. | nhiều | Blender / Tripo3D + code |

Đã kiểm và không có lỗi: mọi quái và điểm tương tác đều trên cạn; đủ số quái ở mỗi bãi (59/59); không bãi nào chồng vùng an toàn; không vùng đi được nào bị cô lập.

**Ba điểm nhấn nên thêm cho mỗi map** (toạ độ gợi ý chưa dò địa hình)

*Làng*
1. Chòi canh hoặc tháp đá bờ Đông, quanh (58, 4), làm ngã ba dẫn ra các bãi quái, có cột biển ghi cấp. Bờ Đông hiện không có mốc cao nào. (Blender hoặc Tripo3D; đường bằng code.)
2. Lối lên cao nguyên thác nước: bậc đá, điểm ngắm thác, rương ẩn. Biến bãi Golem thành đấu trường có lối vào.
3. Góc Đông Nam đang trống 46%: miếu ven sông hoặc cối xay nước, kèm sao và rương.

*Cảng*
1. Cụm hải đăng mới (anh đã nhắc), thay hải đăng dựng bằng code, kèm vịnh của Bạch Tuộc. (Tripo3D.)
2. Đồi ngắm hoàng hôn phía Tây Bắc: vọng lâu, rương, lối mòn.
3. Xác tàu đắm trên bãi Bắc và vũng đá bãi Nam, mỗi nơi một rương hoặc bong bóng chữ.

*Rừng*
1. Bậc đá cạnh thác lên đỉnh vách. Đây là thay đổi độ cao có ý nghĩa duy nhất của ba map, đồng thời giải quyết bãi Người Cây.
2. Vườn pha lê phát sáng phía Đông, nối từ Hang Pha Lê. Hướng Đông đang trống 69%.
3. Vòng nấm tiên hoặc thân cây đổ ở Tây Bắc; đặt `npc_treant_keeper` (đã có mô hình, chưa dùng) cạnh Cây Cổ Thụ.

---

## 6. Mô hình 3D

**Kiểm kê (đã đo):** 467 file GLB, 137,5 MB, 1,85 triệu tam giác. Không file nào dùng nén (Draco, meshopt, KTX2). Bản cài .exe hiện 154 MB.

| Nhóm | File | MB | Tam giác lớn nhất | Đang dùng | Không dùng (MB) |
|---|---|---|---|---|---|
| Nhân vật chơi | 8 | 20,2 | 88.509 (Ruby) | 5 | 3 (4,5) |
| NPC | 22 | 22,2 | 32.470 | 11 | 11 (9,5) |
| Quái | 44 | 19,9 | 14.000 | 15 | 29 (13,1) |
| Trùm | 10 | 3,9 | 7.438 | 4 | 6 (2,3) |
| Thú, động vật, cá | 21 | 9,5 | 9.000 | 19 | 2 (0,2) |
| Vũ khí, giáp, bùa | 35 | 1,7 | 1.396 | 35 | 0 |
| Phụ kiện | 57 | 1,5 | 1.116 | 57 | 0 |
| Nhà, công trình | 34 | 21,4 | 56.338 (lâu đài) | 20 | 14 (0,9) |
| Quầy | 11 | 11,0 | 10.618 | 7 | 4 (1,5) |
| Cây cỏ, nông sản | 68 | 6,4 | 27.368 (thùng ngô) | 29 | 39 (2,0) |
| Đồ đạc | 20 | 0,8 | 1.376 | 20 | 0 |
| Đạo cụ cảnh | 77 | 5,6 | 14.320 | 24 | 53 (2,6) |
| Đua xe | 27 | 10,2 | 7.400 | 22 | 5 (0,5) |
| Sự kiện `ev_` | 23 | 3,0 | 3.340 | 0 | 23 (3,0) |
| Hiệu ứng `fx_` | 10 | 0,3 | 792 | 0 | 10 (0,3) |
| **Tổng** | **467** | **137,5** | | **268** | **199 (40,3 MB)** |

"Dùng / không dùng" là dò tên file trong mã, kể cả tên ghép động; chưa chạy trình duyệt nên có thể sót vài file.

**199 file không dùng chia ba loại:**
- **A. Bản cũ đã bị thay, xoá được (24 file, 16,1 MB):** `chr_ngoc_adventurer_v03`, `chr_ban_nam_v01`, `chr_hero_body_v01` (file trung gian, nên để ngoài `assets`), `npc_lily_v01`, `npc_rose_v01`, `npc_anna_v01`, `npc_tom_elder_v02`, `boss_golem_ancient_v01`, `boss_mushroom_queen_v01`, `boss_slime_king_v01`, `harbor_boss_octopus_v01`, `stall_fish`, `harbor_boutique_props_v01`, và 11 quái đã bị thay (`mob_stone_golem`, `mob_venom_mushroom`, `mob_rage_boar`, `mob_forest_treant`, `mob_imp_fire`, `mob_orc_gale`, `mob_goblin_frost`, `mob_golem_stone`, `mob_shroom_angry`, `mob_slime_green`, `mob_bat_shadow`).
- **B. Dự trữ cho map 4+ và sự kiện, nên giữ (81 file, 19 MB):** 30 `map3_*`, 4 `npc_desert_*`, 23 `ev_*`, quái sa mạc và tuyết đã có hoạt ảnh, `mob_golem_ice`, `mob_dragon_ice`, `npc_treant_keeper`. Nên chuyển ra thư mục không đóng vào .exe.
- **C. Đã dựng bằng Blender nhưng chưa nối, game đang vẽ bằng code (94 file, 5,2 MB):** `nat_*`, `vil_*`, `for_*`, `fx_*`, `prop_*`.
- **Trùng nội dung:** `race/bld_anna_house`, `race/bld_farm_barn`, `race/stall_fruit` giống hệt bản ở gốc (4,75 MB thừa).

Xoá loại A và file trùng tiết kiệm ngay ~21 MB.

| Mức | Vấn đề | Bằng chứng | Đề xuất | Công sức | Dùng gì |
|---|---|---|---|---|---|
| P0 | Gói cây cỏ vượt ngân sách nhiều lần (xem mục 1c). Thùng ngô 27.368 tam giác, giỏ táo 18.596, bắp cải 18.244. | đo GLB. ✔ (cỏ, dương xỉ) | Giảm lưới cả gói `plants/` (24 file). | vừa | Blender |
| P1 | Nhân vật chơi nặng gấp 5–7 lần ngân sách: Ruby 88.509 tam giác, 13 vật liệu; Luna 60.417; Mika 59.998. Tài liệu đặt ≤ 12.000 (+3.000 phụ kiện). | đo GLB `chr_hero_v01`. ✔ | Hạ về tổng 20–25 nghìn; gộp ảnh thành 1–2 tấm. | vừa | Blender |
| P1 | Quái và thú Tripo tĩnh thay cho bản có hoạt ảnh: golem dung nham 12.000 tam giác, 16 vật liệu, 0 clip; bản bị thay ~1.900 tam giác và 5 clip. Thú mới 9.000 tam giác, 0 clip, trong khi rái cá/hải âu/cua ~1.900 và 8 clip. | đo GLB. ✔ (golem, cáo lửa) | Giảm còn 4–6 nghìn, gộp 1 vật liệu, gắn 4–8 xương + clip đúng tên game đang dùng. | vừa | Blender |
| P1 | Ảnh vân quá cỡ (xem mục 1c). | đo GLB. ✔ | Thu về 1024 / 512. | ít | Blender |
| P1 | NPC 21–32 nghìn tam giác, ngân sách ≤ 8.000. | đo GLB (`npc_tom_elder_v03` 23.772). ✔ | Giảm về ≤ 10.000. | ít | Blender |
| P1 | 94 mô hình Blender làm rồi không nối; rừng vẫn vẽ bằng code cây cổ thụ, hang, tàn tích; làng vẽ bằng code giếng, cối xay, bến. | danh sách loại C. ◐ | Nối theo kiểu "có file thì dùng, không thì vẽ code" (đã có sẵn ở cảng, đảo). **Cần anh duyệt ảnh trước**: chưa ai xem được hình các file này. | vừa | code |
| P1 | File thừa và trùng: 24 bản cũ + 3 file trùng ≈ 21 MB vẫn đóng vào .exe. | md5, dò tên. ◐ | Xoá; cho đua xe trỏ về bản gốc. | ít | code |
| P2 | Hai bộ xương, số clip khác nhau: bộ 21 khớp (Ngọc v04, Lily/Rose/Anna, Mia) và bộ 19 khớp (Ngọc v05, Ruby, Luna, Mika, 6 NPC mới). Ngọc v04 (1,7 MB) chỉ nạp để cho mượn clip. | kiểm kê. ◐ | Chọn bộ 19 khớp làm chuẩn; dựng lại Lily/Rose/Anna. | vừa | Blender |
| P2 | Lệch phong cách (chủ quan, dựa trên `screenshots/hero_wardrobe_check.png`, `11_ancient_tree.jpg`): Ruby vân vẽ tay chi tiết đứng cạnh mũ, ba lô màu phẳng khối vuông; cây "lá thẻ giấy", đá khối. | ảnh đã nêu (các ảnh `.jpg` trong `screenshots/` đều cũ, trước gói cây và nhà mới). ? | Thêm chuyển sắc màu đỉnh và bóng khe nướng cho đồ Blender; làm lại cây và đá mốc. | vừa | Blender, Tripo3D |
| P2 | Lâu đài biệt thự 45–56 nghìn tam giác, 19 lệnh vẽ cho một căn. | đo GLB. ◐ | Gộp vật liệu, giảm ~40%. | ít | Blender |
| P2 | 22 đồ nội thất mới vẽ bằng khối trong mã, cạnh 16 món Blender. | `interior.js` `XTRA`. ◐ | Chuyển sang script Blender. | vừa | Blender |
| P2 | `docs/ASSET_MANIFEST.md` ghi 15 file 10 MB; thực tế 467 file. | so sánh. ◐ | Sinh lại từ bảng kiểm kê. | ít | code |

### Phân công công cụ

| Công cụ | Nên làm loại nào | Lý do | Nên chuyển về đây |
|---|---|---|---|
| **Blender (script)** | Phụ kiện, trang phục, kiểu tóc theo thân; vũ khí, giáp; đồ đạc; rào, đèn, cầu, bến, quầy; nhà nhiều biến thể màu; cây, bụi, cỏ, đá rải hàng loạt; **gắn xương, clip và tối ưu mọi đồ Tripo** | Khớp kích thước và xương, vật liệu đổi màu được, lặp biến thể rẻ, nhẹ | 22 đồ nội thất `XTRA`; cây và bụi đang nặn bằng mã (`foliage.js`, `common.js`); công trình mini game; giảm lưới gói `plants/` |
| **Tripo3D** | Vật hữu cơ, mỗi thứ một bản: quái, trùm, thú, NPC, nhân vật gốc, cây cổ thụ, tượng, **công trình mốc** của mỗi map | Đẹp nhanh, nhưng nặng, lệch tỉ lệ, không có hoạt ảnh | **Không** dùng cho phụ kiện, đồ lặp nhiều, cỏ |
| **Code** | Địa hình, nước, đường, rải hàng loạt; chùm sáng, hạt, phép; cổng xoáy; thứ đổi kích thước động (phòng, cầu thang, luống, biển tên) | Đổi tham số lúc chạy, không tốn dung lượng | **Chuyển khỏi code:** mốc rừng và làng, nội thất |

**Quy trình bắt buộc cho đồ Tripo** (qua `tools/tripo/optimize.py`): quái thường ≤ 6.000 tam giác, tinh anh và trùm ≤ 12.000, thú ≤ 3.000, NPC ≤ 10.000, nhân vật chơi ≤ 25.000 cả đồ, công trình mốc ≤ 12.000; một ảnh màu ≤ 1024 (vật nhỏ 512); bỏ ảnh pháp tuyến và kim loại, metallic 0; gộp còn 1 vật liệu; cắt bệ; đặt chiều cao thật. Hoạt ảnh: hình người chuyển về 19 xương Ngọc bằng `rig_girl.py`; quái và thú gắn 4–8 xương trong Blender với các clip game đang gọi; "tĩnh + nhún" chỉ là tạm.

### Danh sách mô hình nên bổ sung, theo ưu tiên

| # | Việc | Dùng ở | Công cụ | Ngân sách | Hoạt ảnh |
|---|---|---|---|---|---|
| 1 | Giảm lưới gói `plants/*` | mọi map | Blender | cỏ ≤ 150, bụi ≤ 600, cây ≤ 1.500 | không |
| 2 | Cây và bụi bản mới thay cây xấu | mọi map | Blender (thử nối `nat_*` trước) | cây ≤ 1.500, bụi ≤ 400 | gió bằng shader |
| 3 | Ruby bản nhẹ; hai nhân vật tự tạo thay Luna, Mika | nhân vật chơi | Tripo3D + Blender | ≤ 25.000 | 10 clip của Ngọc |
| 4 | Clip cho golem dung nham, nấm khổng lồ, người cây | Làng, Rừng | Blender | ≤ 6.000, 1 vật liệu | 5 clip |
| 5 | Clip cho chó con, mèo con, cáo lửa | thú đồng hành | Blender | ≤ 3.000, ảnh 512 | 8 clip |
| 6 | NPC và nhà, quầy: thu ảnh, giảm lưới | Làng | Blender | NPC ≤ 10.000, ảnh 1024 | giữ |
| 7 | Nối `for_*`, `vil_*`, rương, sao, pha lê | Rừng, Làng | code | đã nhẹ | không |
| 8 | Cụm hải đăng (tháp + mỏm đá + nhà gác) | Biển | Tripo3D | ≤ 10.000, ảnh 1024 | chùm sáng bằng code |
| 9 | Cây cổ thụ bản mới | Rừng | Tripo3D | ≤ 12.000 | không |
| 10 | Kiểu áo, quần, giày, tóc cho Ruby (4 mỗi loại) | tiệm Mia | Blender (`hero_lib.py`) | ≤ 1.500 mỗi món | theo xương |
| 11 | Đặt `npc_treant_keeper` | Rừng | Blender | ≤ 8.000 | Idle, Talk |
| 12 | 22 đồ `home_*` thay đồ khối | nhà | Blender | ≤ 1.200 | không |
| 13 | Map 4 Sa mạc: nối `map3_*`, `npc_desert_*`, quái sa mạc, rồng cát (đã có sẵn) | Map 4 | code | có sẵn | có sẵn |
| 14 | Đền sa mạc làm mốc | Map 4 | Tripo3D | ≤ 12.000 | không |
| 15 | Bộ núi tuyết: nhà gỗ, thông tuyết, đá băng, cầu treo; clip cho golem băng, rồng băng | Map 5 | Blender | ≤ 1.500 mỗi món | 5 clip cho quái |
| 16 | Lâu đài trời, tàu bay | Map 6 | Tripo3D | ≤ 12.000 / ≤ 6.000 | cánh quạt quay bằng code |
| 17 | Công trình mini game (tiệm kẹo, trường bắn, tháp khối) | Làng | Blender | ≤ 6.000 | không |
| 18 | Vũ khí, giáp cấp 11–20 (17 món đang mượn hình) | quầy Willow | Blender | ≤ 1.200 | không |

Gợi ý câu lệnh Tripo (thêm vào cuối mỗi câu: `original design, not based on any existing game or film character`):
- Hải đăng: `stylized chibi fantasy lighthouse on a small rocky islet, red and white striped tower, tiny keeper cottage, wooden stairs, hand-painted soft colors, chunky rounded shapes, game asset, no base, no text`
- Cây cổ thụ: `giant ancient oak tree with thick twisted roots, round puffy leaf clusters, hanging paper lanterns, stylized chibi fantasy, hand-painted texture, chunky low-poly look, no base`
- Nhân vật mới: `full body chibi girl adventurer, big head, simple short tunic and boots, plain hairstyle, T-pose, arms away from body, soft hand-painted look, no baked highlights, white background`

---

## 7. Giao diện và cách dùng cho trẻ

**Bảng phím thực tế** (đọc từ `main.js:1195-1238`)

| Phím | Chức năng | Có chỉ dẫn trên màn hình? |
|---|---|---|
| W A S D / mũi tên | Đi | Không |
| Shift · Space | Chạy · nhảy | Không |
| E | Tương tác, lật trang thoại, **đóng** hầu hết các bảng | Có |
| 1–4 · 5–8 | Phép (trong câu hỏi là chọn đáp án) · bình máu, mana | Có |
| Tab · J hoặc F · K | Khoá quái · đánh · lăn né | Không |
| Q | Ăn bánh hồi máu | Chỉ khi rê chuột |
| V · I | Túi đồ mới · túi đồ **cũ** (danh sách chữ tiếng Anh) | V: vài chỗ; I: không |
| B | Sổ từ; trong nhà là "Sắp xếp đồ" | Nút trong ⚙ |
| T · N · O · P | Sách kỹ năng · sổ nhiệm vụ · bản đồ thế giới · thú | Một phần |
| U · G | Tủ đồ · album biển (chỉ sau khi mở Map 2) | Nút 👗 ghi sai là "(V)" |
| H · M · R | Gợi ý (rừng) · bản đồ kho báu (đảo) · xoay đồ (nhà) | Có |
| F2 · F3 | Quản trị · hiệu năng | Có |
| F11 · F5 · F12 | Toàn màn hình · tải lại · công cụ lập trình (chỉ bản .exe) | Không |
| Esc | Đóng bảng; **thoát mini game ngay**; khi đang đi lại thì không làm gì | Một phần |

Không có trang trợ giúp phím trong game, không đổi phím được, không có tạm dừng.

| Mức | Vấn đề | Bằng chứng | Đề xuất | Công sức | Dùng gì |
|---|---|---|---|---|---|
| P0 | Thẻ "🎤 Đọc to" kẹt (xem mục 1b). | `voice.js:86`. ✔ | Nút "Bỏ qua". | ít | code |
| P1 | Xong truyện làng, mũi tên vàng và thẻ mục tiêu chỉ mãi về cổng rừng đang khoá; ảnh `screenshots/03e_wild_fight.jpg` cho thấy đang đánh quái mà thẻ vẫn ghi "Go to the forest gate". | `main.js:243, 317, 1450`. ✔ (dòng 243) | Thẻ mục tiêu song ngữ lấy từ nhiệm vụ chính hiện tại; mũi tên chỉ bãi quái hợp cấp. | vừa | code |
| P1 | Không dạy điều khiển và cách đánh; J/F, K, Tab, Q, V không hiện ở đâu. | không có chuỗi hướng dẫn trong `content.js`, `village.js`. ◐ | 4 thẻ nhắc lần đầu (đi, xoay, E, đánh) và một trang "Phím" trong ⚙. | vừa | code |
| P1 | Chỉ dẫn phím sai: nút 👗 và tiệm may ghi "Tủ đồ (V)", phím đúng là U và chỉ mở sau Map 2. Bé mua áo ở Làng không mở được tủ đồ. | `main.js:1218, 1299`; `tailor.js:75`. ✔ | Sửa chữ; mở tủ đồ từ Map 1. | ít | code |
| P1 | Mở túi, sổ nhiệm vụ, sách kỹ năng thì bé đứng im nhưng quái vẫn cắn. Bản đồ thế giới không đóng bằng Esc và nhân vật vẫn đi được phía sau. | `main.js:1373` so với `:1408`. ✔ | Một cờ "đang mở bảng" dùng chung; Esc đóng mọi bảng. | ít | code |
| P1 | Chữ HUD quá nhỏ: số máu và EXP 9,5 px; tên chiêu 9 px; chú thích bản đồ nhỏ 10–11 px. | `index.html:20, 24`. ◐ | Tối thiểu 13–14 px; thêm cỡ chữ "Thường / Lớn". | vừa | code |
| P1 | Thanh EXP rất dài (cấp 4 cần 640 quái) nhưng chỉ có một con số nhỏ: không mốc 25/50/75%, không "còn N quái", không thành tích, không chuỗi ngày. | `ui.js:69`; `combat.js:311`. ◐; mức chán ? | Ghi "còn N quái nữa lên cấp"; mốc 25% có thưởng nhỏ. | vừa | code |
| P1 | Thông báo quan trọng chỉ hiện 2,2 giây, cái sau đè cái trước, kể cả câu hướng dẫn dài. | `index.html:34`. ◐ | Thời lượng theo số chữ; câu hướng dẫn chuyển sang hộp thoại. | ít | code |
| P1 | Trộn ngôn ngữ không nhất quán: thẻ mục tiêu và thông báo chiến đấu chỉ có tiếng Anh; túi cũ toàn tiếng Anh; bảng khác thuần Việt. | `main.js:240-244`; `combat.js:282, 310`. ✔ (dòng 240–244) | Quy ước: câu tiếng Anh to, dòng Việt nhỏ ở dưới, bật tắt được. | vừa | code |
| P1 | Hai bé dùng chung máy: không có mã PIN hồ sơ; nút "🔑 Quản trị" nằm ngay màn hình chọn người chơi, mật khẩu `321`; vào được là xoá hồ sơ bé kia, cộng vàng. | `ui.js:28`; `src/ui/admin.js:8`. ✔ | Giấu nút (giữ 3 giây vào logo); phụ huynh tự đặt mật khẩu; PIN 4 số tuỳ chọn. | vừa | code |
| P1 | Không giới hạn giờ chơi, không nhắc nghỉ mắt, không tạm dừng. | grep không thấy. ✔ | Nhắc nghỉ mỗi 30–40 phút; đếm phút chơi trong báo cáo phụ huynh. | vừa | code |
| P2 | Esc trong mini game thoát ngay, không hỏi, mất phí vừa trả; trò lỗi thì đóng im lặng, cũng mất phí. | `arcade.js:30, 35`. ◐ | Hỏi "Thoát? Phí không hoàn lại"; lỗi thì hoàn phí. | ít | code |
| P2 | Lời khi hết máu sai thực tế: nói "Máu đã đầy lại" và "đưa về làng", nhưng máu chỉ còn 30% và hồi sinh ở điểm vào của map hiện tại. | `combat.js:391`; `main.js:1347`. ✔ (dòng 391) | Hồi đầy máu, hoặc sửa chữ. | ít | code |
| P2 | Màn cảm ứng: cụm nút đè lên hộp thoại; nút 🎒 mở túi cũ; thiếu nút gợi ý và khoá mục tiêu. | `touch.js:6, 18`. ◐; chưa thử máy thật | Ẩn cụm nút khi đang có hộp thoại; đổi 🎒 sang túi mới. | ít | code |
| P2 | Nút nhỏ hơn 44 px (✕ của bảng ~27 px, ± bản đồ nhỏ 22 px); cách đóng bảng không nhất quán. | `journal.js:14`; `worldmap.js:12`. ◐ | Một kiểu nút đóng chung 44 px. | ít | code |
| P2 | Cài đặt thiếu: âm thanh chỉ bật/tắt, không có nút toàn màn hình, thoát game không hỏi. "Xuất hồ sơ / Nhập hồ sơ (JSON)" là từ khó với trẻ. | `main.js:223-226`. ◐ | Thanh âm lượng, nút ⛶. | vừa | code |
| P2 | Cả 4 nhân vật là nữ; ảnh chân dung HUD luôn là mặt Ngọc. | `creator.js:93`; `index.html:17`. ◐ | Thêm nhân vật nam nếu cần. | vừa | Tripo3D + Blender |

**Điểm đã ổn:** font hiển thị đủ dấu tiếng Việt; chữ nâu đậm trên nền kem dễ đọc; trả lời sai luôn kèm đáp án đúng, giọng nhẹ nhàng; cổng bị khoá ghi rõ còn thiếu gì; sổ nhiệm vụ có thẻ "Việc tiếp theo"; màu không phải kênh duy nhất để phân biệt.

**Năm điều nên quan sát khi ngồi xem con chơi 20 phút**
1. Phút đầu, con có tự tìm ra WASD, kéo chuột xoay camera và bấm chuột để đánh không?
2. Sau huy hiệu của Tom, con đi đâu: theo mũi tên tới cổng rừng bị khoá, hay tự tìm bãi quái?
3. Con có đọc dòng tiếng Anh không, hay chỉ nhìn dòng tiếng Việt rồi bấm E?
4. Từ cấp 2 trở đi, sau bao nhiêu phút đánh quái thì con chán hoặc bỏ sang mini game?
5. Hai bé có vào hồ sơ của nhau hoặc bấm thử "Quản trị" không? Con có phải nheo mắt đọc số máu, EXP không?

---

## 8. Bản quyền và phù hợp lứa tuổi

Đây là đánh giá rủi ro thực tế, **không phải tư vấn pháp lý**. Kịch bản A = chỉ dùng trong gia đình. Kịch bản B = chia sẻ rộng, đăng công khai hoặc bán.

Vì repo không có ảnh Luna, Mika, trợ lý đã dựng ảnh 4 góc từ file GLB và em đã xem.

| Mức | Vấn đề | Bằng chứng | Rủi ro A / B | Đề xuất | Công sức | Dùng gì |
|---|---|---|---|---|---|---|
| P0 | **Mika rất giống nhân vật Ganyu của game Genshin Impact**: tóc xanh dài có chỏm, cặp sừng đỏ sẫm, chuông ở cổ, áo liền đen bó, vạt trắng tím viền vàng, tay áo rời, nút thắt đỏ gắn ngọc ở hông, giày cao gót. | `assets/models/chr_girl2_v01.glb`; ảnh dựng từ file. ✔ (em đã xem ảnh; nhận định theo đặc điểm thiết kế, file không ghi tên gốc) | A: thấp. B: cao (có thể bị yêu cầu gỡ; không bán được). | Gỡ khỏi nhánh công khai và dựng lại bản cài; thay bằng nhân vật tự thiết kế. | gỡ: ít; thay: vừa | code; Tripo3D + Blender |
| P0 | **Luna: không xác định được giống nhân vật nào**, nhưng là kiểu nhân vật game anime thương mại (tóc bạc dài, giáp trắng tím). | `chr_girl1_v01.glb`; ảnh dựng. ✔ (đã xem); nguồn gốc ? | A: thấp. B: chưa rõ, có thể cao như Mika. | Anh nhớ lại ảnh đầu vào lấy từ đâu; nếu là ảnh nhân vật game/anime thì xử lý như Mika. | ít | việc của phụ huynh |
| P0 | **Trang phục và dáng người Luna, Mika không hợp tuổi 11–14**: tỉ lệ cơ thể người lớn; Luna áo khoét ngực, quần rất ngắn, dây đeo đùi, bốt cao gót; Mika áo bó, hở vai, cao gót. Bé chọn được ngay khi tạo nhân vật. | ảnh dựng; `src/ui/creator.js:93`. ✔ | A: tuỳ gia đình. B: không hợp game học tập cho trẻ. | Ẩn hai nút chọn cho tới khi có nhân vật thay thế. | ít | code |
| P1 | Lô Tripo đã lên mạng và đã thành bản cài (xem đầu báo cáo). Repo có thể đang công khai: trợ lý truy cập được không cần đăng nhập, nhưng đường truyền của phiên làm việc có thể đã chèn xác thực. | release `desktop-latest` dựng từ `c1cab93`. ✔; công khai hay không ? | B: các mục trên đang nằm ngoài tầm kiểm soát. | Anh mở trang repo bằng cửa sổ ẩn danh để biết chắc; nếu công khai và chưa gỡ kịp thì chuyển sang riêng tư. | ít | việc của phụ huynh |
| P1 | Nhánh `work-20261126-0820` chứa 16 file Tripo thô (~550 MB, gồm bản gốc của Mika) và một file `.rar`; `lantern-games` cũng có file `.rar`. Xoá file ở nhánh chính không xoá lịch sử. | danh sách nhánh trên GitHub. ◐ | B: bản gốc độ phân giải cao nằm công khai. | Xoá các nhánh `work-*`, `characters-*`, `lantern-games` sau khi đã lấy đồ (em không có quyền xoá nhánh). | ít | việc của phụ huynh |
| P1 | Quyền dùng mô hình Tripo3D chưa rõ: 13 file (Ruby, Luna, Mika, 5 quái, 3 thú, người cây). Gói miễn phí của các dịch vụ này thường yêu cầu ghi công hoặc cấm thương mại. | `assets/models/CREDITS.md` chưa nhắc Tripo. ✔ (CREDITS); điều khoản ? | A: thấp. B: vừa. | Anh xem gói đang dùng và điều khoản hiện hành; ghi vào `CREDITS.md`. | ít | việc của phụ huynh |
| P1 | Thiếu file LICENSE và không có màn "Ghi công" trong game. Thỏ và gà là mô hình CC-BY 3.0, bắt buộc ghi tên tác giả; hiện chỉ ghi trong `CREDITS.md`. | không có `LICENSE*`; `CREDITS.md:8-9`. ✔ | A: không. B: thấp–vừa. | Thêm nút "Ghi công" trong ⚙; thêm LICENSE. | ít | code |
| P1 | Nút "Nhạc K-pop" mở kênh YouTube trong trình duyệt: bé ra Internet không kiểm soát (gợi ý video, quảng cáo, bình luận). Không nhúng video, không chép lời. | `src/ui/music.js:96, 159`. ✔ | A: tuỳ gia đình. B: nên bỏ. | Bỏ nút, hoặc chỉ hiện trong bảng Quản trị. | ít | code |
| P1 | Kiểm phát âm bằng micro: trên Chrome/Edge, âm thanh giọng trẻ được gửi lên dịch vụ nhận dạng của hãng trình duyệt. Game không lưu âm thanh. | `src/ui/voice.js:5-8, 33`. ◐ (theo chú thích mã; không đo mạng) | A: nên biết. B: cần thông báo và sự đồng ý của phụ huynh. | Công tắc trong ⚙, mặc định tắt, kèm một dòng giải thích. | ít | code |
| P1 | Không nhắc nghỉ, không giới hạn giờ, trong khi thiết kế kéo dài (hàng nghìn quái, nhiệm vụ ngày, cây trồng theo giờ thật). | xem mục 7. ✔ | A: vừa. | Nhắc nghỉ; giới hạn giờ mỗi ngày đặt trong Quản trị. | vừa | code |
| P2 | Ruby: váy xẻ trước lộ lớp lót màu be giống màu da. Thiết kế chibi, không thấy giống nhân vật thương mại nào. | `screenshots/hero_ingame.png`; `tools/hero/fit_outfit.py`. ◐ | thấp, nhưng dễ bị nhìn nhầm. | Tô lớp lót thành quần short màu nâu hoặc đỏ. | ít | Blender |
| P2 | Nội dung học bám sách Global Success: 48 tên unit trùng tên bài; cài đặt hiện chữ "Đang học: Global Success". Chỉ lấy từ và nghĩa; thư và lời thoại tự viết (không có sách để so nguyên văn). | `data/learning/units.json`; `main.js:223`. ◐ | A: không. B: thấp. | Bản công khai: ghi "bám theo chủ điểm lớp 6–9", thêm câu "không liên kết với nhà xuất bản". | ít | code |
| P2 | Trò Xếp hình dùng đúng 7 khối và bảng 10×20 của một trò xếp gạch nổi tiếng. | `src/core/blocks.js:2-6`. ◐ | A: không. B: thấp–vừa. | Bản công khai: đổi cỡ bảng hoặc thêm khối riêng. | ít | code |
| P2 | Bản .exe: không ký số (Windows sẽ cảnh báo); Electron 33 đã cũ; F12 mở công cụ lập trình, bé gõ một dòng là có 99.999 vàng; `__eq` để lộ trong bản phát hành. | `desktop/main.js:67`; `main.js:187`. ✔ | A: thấp. | Tắt F12 ở bản đóng gói; chỉ gắn `__eq` khi test. | ít | code |
| P2 | Ảnh giao diện là ảnh AI, không thấy watermark; nguồn không ghi trong repo. Thư mục nhạc gia đình: đừng commit file mp3 hay lời vào `assets/music/`. | `assets/ui/*`; `assets/music/README.md`. ◐ | B: thấp. | Anh ghi lại công cụ đã tạo ảnh; thêm `assets/music/*.mp3` vào `.gitignore`. | ít | việc của phụ huynh |

**Sạch, yên tâm (đã kiểm, không thấy vấn đề)**
- Nhạc và âm thanh: toàn bộ tạo bằng mã, không có file nhạc. 7 bài trong phòng nhạc gồm một bài dân gian hết bản quyền và 6 bài tự viết.
- Không có thương hiệu nào trong game ngoài hai chỗ đã nêu.
- Quái và thú Tripo là hình mẫu fantasy chung.
- Ngọc, NPC, nhà, cây, đồ vật (khoảng 440/467 file) dựng bằng script của dự án; quái Quaternius là CC0 và đã ghi công.
- Không kèm file font; Three.js và Electron đều giấy phép MIT.
- Không có khoá API, mật khẩu dịch vụ, email hay tên thật trong repo.
- Game không có máy chủ, không thu thập dữ liệu, không tự cập nhật.
- Không có máu; quái ngã rồi biến mất; không từ ngữ thô tục; không mua bằng tiền thật, không vòng quay may rủi.

---

## 9. Kiểm thử

**Đã chạy:** unit 91/91 đạt (10 giây), lantern 6/6 đạt. Độ phủ `src/core`: 89% nhánh, 82% hàm. Mã viết dòng rất dài nên "% dòng" gần như luôn 100 và không có ý nghĩa.

**Hai script kiểm toàn vẹn** trợ lý tự viết và chạy:
- Tài nguyên: 0 file thiếu; 15 loại quái và 4 trùm đều có mô hình.
- Dữ liệu học: 48 file đều đọc được, mọi từ có nghĩa; 13 cảnh báo (đã nêu ở mục 4).

**Tính năng nào có test**

| Tính năng | Unit | Quick | E2E |
|---|---|---|---|
| Truyện làng, cầu, rừng pha lê | có | — | có |
| Quái, Vua Slime, khiên chữ | có | có | có |
| Hạ ba trùm còn lại | chỉ số liệu | chỉ "thức dậy" | — |
| Cổng Cú Mèo, bài thi | có | có | cấp 5 |
| Kẹo, khối, bắn cung, đua xe làng | có | có | có |
| Đua xe Biển, Rừng | — | — | — |
| Cửa hàng, túi đồ | có | có | có |
| Lưu rồi tải lại trang | có | — | chỉ vàng, số từ, bước truyện |
| **Bản lưu hỏng** | — | — | — |
| **Ruby, Luna, Mika, màn tạo nhân vật** | giá + file | — | — |
| 45 phụ kiện, đổi màu, tiệm may | luật | 1 mũ (Ngọc) | — |
| Thú mới | mua | — | — |
| Nhà: vào, sắp xếp đồ, cầu thang | luật | — | — |
| Trang trại, phòng nhạc, Hội Đèn trong trình duyệt | luật / — | — | — |
| Admin xoá người chơi | — | — | — |

Lý do nhân vật mới không bao giờ được test: `main.js:736` bỏ màn tạo nhân vật khi chạy tự động, nên quick và e2e luôn chạy bằng Ngọc. ✔

| Mức | Vấn đề | Bằng chứng | Test cần viết | Công sức | Dùng gì |
|---|---|---|---|---|---|
| P0 | Không có test nào cho bản lưu hỏng, bản lưu từ bản mới hơn, hay một hồ sơ lỗi. | `save.js:34-40`; ba trường hợp em chạy đều ra 0 hồ sơ. ✔ | "bản lưu hỏng không bị ghi đè, khôi phục từ .bak"; "bỏ hồ sơ hỏng, giữ hồ sơ tốt". | vừa (phải sửa mã trước) | code |
| P1 | Không có bước chạy test trước khi dựng .exe: đẩy mã lên là GitHub dựng và phát hành ngay, mã lỗi cú pháp vẫn thành bản cài. | `.github/workflows/desktop-windows.yml`. ✔ | Thêm bước chạy unit + lantern trước bước dựng. | ít | code |
| P1 | Chuỗi 20 nhiệm vụ chính chưa bao giờ được đi hết trong test: 16/20 hàm kiểm tra hoàn thành không chạy. | `quests.js:34`; độ phủ hàm 55,8%. ◐ | "bật cờ theo thứ tự, đi đủ 20 bước, điều kiện mở map khớp `canGo`". | ít | code |
| P1 | Kiểm toàn vẹn chỉ có cho 8 file Tripo và 45 phụ kiện. | `unit.test.mjs:1142, 1155`. ◐ | Đưa hai script toàn vẹn ở trên vào unit test. | ít | code |
| P1 | Ruby, Luna, Mika, kiếm giáp gắn xương, thú không có clip: 0 khẳng định. | `main.js:736`. ✔ | Nhóm quick `avatars`: đặt từng nhân vật → đi, mặc giáp, vào nhà, mua cáo lửa; không lỗi console. | vừa | code |
| P1 | Quick dùng lớp 8 và tìm đáp án theo nghĩa tiếng Việt, nên lấy nhầm khi 2–3 từ cùng nghĩa. Có thể là một nguồn "trượt giả" đã ghi trong CLAUDE.md. | `tests/quick.mjs:54, 99, 113`. ? (chưa chạy) | Đọc đáp án đúng qua hook thay vì đoán theo chữ. | ít | code |
| P1 | Ba khẳng định luôn đúng (không kiểm được gì). | `quick.mjs:46` (`|| true`); `e2e.mjs:327, 268`. ◐ | Bỏ `|| true`; kiểm điều kiện thật. | ít | code |
| P1 | Test giòn: 172 lần chờ cố định trong e2e, 141 trong quick; 40 toạ độ viết cứng; số viết cứng (`m.hp = 460`). | `e2e.mjs:273, 214, 78`. ◐ | Chờ theo trạng thái; lấy số từ dữ liệu game. | vừa | code |
| P1 | Tải lại trang chỉ so vàng, số từ, bước truyện; không so cấp, túi, tủ đồ, nhà, thú, phép, nhân vật. | `e2e.mjs:392-395`. ◐ | So toàn bộ hồ sơ trước và sau. | ít | code |
| P1 | Quick không trượt khi có lỗi console; mô hình thiếu bị nuốt im lặng. | `quick.mjs:436`; `main.js:170, 174`. ◐ | Cuối quick: không có dòng lỗi. | ít | code |
| P2 | Test chạy ở đồ hoạ Trung bình trên máy không GPU (~3 giây mỗi khung hình thay vì ~1 giây ở mức Thấp). | `main.js:1359`. ◐ | Đặt mức Thấp trong `shot.mjs` trước khi nạp trang. | ít | code |

**Các bước e2e và quick dễ lệch sau lượt 59** (chưa chạy, suy từ mã): không bước nào có khả năng trượt cao, vì lượt 59 giữ nguyên mã loại quái, số quái và cấp. Chỗ sát ngưỡng: `quick.mjs:187` (đếm 19 quái Rừng trong 240 giây, mô hình mới nặng hơn); 15 chỗ `timeout: 60000` trong e2e trong khi vào map mất ~210 giây.

**Quy trình ba tầng đề xuất**
- **Tầng 1, mỗi lần sửa (10 giây):** unit + lantern, cộng 3 test mới (tài nguyên, dữ liệu học, bản lưu hỏng). Gắn vào GitHub trước bước dựng .exe.
- **Tầng 2, khói (mục tiêu 2–4 phút, chưa đo):** quick nhóm `boot` cộng nhóm của phần vừa sửa, ở mức đồ hoạ Thấp và cửa sổ nhỏ.
- **Tầng 3, trước mỗi lần "đẩy đi":** e2e đầy đủ chạy nền trên bản sao, chỉ tin dòng `EXIT`.

---

## 10. Còn thiếu gì để game hoàn chỉnh hơn

Mục này em tổng hợp từ chín mảng trên; không có phát hiện mới.

| Mức | Còn thiếu | Vì sao cần | Công sức | Dùng gì |
|---|---|---|---|---|
| P1 | **Tiếng Anh trong lúc đánh quái** (5 cơ chế ở mục 4) | Không có nó thì không bao giờ đạt 30% học. | vừa | code |
| P1 | **Ô "Unit đang học ở lớp" cho từng bé** | Để game theo kịp lớp học thay vì chờ mở map. | vừa | code |
| P1 | **Truyện cho đoạn giữa Map 1 và cho Cảng** (nhiệm vụ mẫu 1–5) | Đoạn dài nhất của game hiện không có câu chuyện. | vừa–nhiều | code + lời thoại |
| P1 | **Nhắc nghỉ, giới hạn giờ, tạm dừng** | An toàn cho trẻ. | vừa | code |
| P1 | **Hướng dẫn điều khiển + trang phím** | Bé mới không biết cách đánh. | vừa | code |
| P1 | **Nút khôi phục bản sao lưu** | Bản sao 14 ngày đã có nhưng không dùng được. | vừa | code |
| P1 | **Hoạt ảnh cho quái và thú Tripo** | Quái đứng im rồi nhún trông như đồ chơi hỏng. | vừa | Blender |
| P2 | **Mốc tiến độ và thành tích** ("còn N quái", mốc 25%, chuỗi ngày, bộ sưu tập) | Thanh EXP dài cần mục tiêu gần. | vừa | code |
| P2 | **Bạn đồng hành hoặc đối thủ cùng tuổi** (Kit) và phản diện có lý do | Tuổi 11–14 cần nhân vật để quan tâm. | vừa | lời thoại + mô hình có sẵn |
| P2 | **Báo cáo phụ huynh: từ nào yếu, số phút chơi** | Dữ liệu đã có, chưa hiển thị. | ít | code |
| P2 | **Câu ví dụ, phiên âm, dạng nghe và điền từ** | Hiện chỉ có nghĩa của từ đơn lẻ. | nhiều | lời thoại + code |
| P2 | **Ngữ pháp Unit 3** cho lớp 6 và 8 | Bài thi cấp 20 hiện chỉ hỏi từ. | vừa | lời thoại |
| P2 | **Trang phục cho Ruby** (kiểu dáng, tóc) và nhân vật nam | Tiệm may với Ruby chỉ bán màu. | vừa | Blender |
| P2 | **Map 4 Sa mạc**: mô hình, NPC, quái, trùm đều **đã có sẵn** trong `assets/models` | Chỉ thiếu bố trí và nhiệm vụ. Nên làm **sau** khi chốt lại nhịp độ, kẻo nhân thêm phần cày. | nhiều | code |
| P2 | **Chơi hai người** (đua xe 2 người, hoặc hai bé cùng map) | Hai bé cùng nhà: đây là động lực mạnh nhất mà chưa dùng. | nhiều | code |
| P2 | **Màn "Ghi công" và file LICENSE** | Cần trước khi chia sẻ ra ngoài. | ít | code |

---

## Lộ trình ba giai đoạn

### Giai đoạn 1: một tuần (chỉ sửa, không thêm tính năng)

Mục tiêu: không mất dữ liệu, không kẹt, không dạy sai, không chỉ sai đường, an toàn để hai bé chơi.

1. Bản lưu: đọc `.bak` và file khi bản chính hỏng; không ghi đè; chịu được hồ sơ lỗi; báo khi lưu thất bại; khoá một cửa sổ. Kèm unit test.
2. Ẩn Luna và Mika; anh kiểm repo công khai hay không; xoá nhánh thô; dựng lại .exe.
3. Hiệu năng nhanh: sửa điều kiện tự hạ đồ hoạ (`main.js:1471`), tách dòng bị nuốt (`main.js:197`), mật độ cây cỏ theo mức đồ hoạ. Anh đo F3 trên máy nhà trước và sau.
4. Chỉ đường: dòng mục tiêu theo nhiệm vụ chính; sửa lời Tom, bến thuyền, La Bàn; thông báo mở map không bị đè; phím tủ đồ.
5. Gỡ kẹt: nút "Bỏ qua" ở thẻ đọc to; cổng mini game cho qua sau 3 lần; nhân vật tải lỗi thì về Ngọc; đổi map có `try/finally`.
6. Thưởng nhiệm vụ không bị cắt khi đứng ở Làng; biệt thự về cấp 18–20.
7. Nội dung: đổi tên ba loại quái theo mô hình; sửa câu "slower"; sửa lỗi dữ liệu lớp 7 và 9; câu thi không lộ đáp án.
8. Luật và bãi quái: quái bị bắn thì đuổi; quái ngừng cắn khi mở bảng; câu cá có số lượt; dời hai bãi trên vách ở Rừng xuống đất bằng, dời Golem Cổ khỏi tháp canh.
9. An toàn: tắt F12 ở bản đóng gói; giấu nút Quản trị; bỏ nút YouTube; nhắc nghỉ mỗi 30–40 phút.
10. GitHub chạy unit trước khi dựng .exe.

Trước khi làm, **anh cần quyết ba việc**: (a) hũ chữ của Ben có được cho EXP không và trần bao nhiêu; (b) giữ hay gỡ hẳn Luna, Mika; (c) repo để công khai hay riêng tư.

### Giai đoạn 2: một tháng (làm cho game đáng chơi và đúng mục tiêu học)

1. **Chốt lại nhịp độ** (cần anh chơi thử và quyết): giảm số quái, tăng số quái mỗi bãi, giảm thời gian hồi sinh, thêm bãi cho cấp lẻ, cân lại vàng.
2. **Tiếng Anh trong chiến đấu**: quái mang bùa chữ, bùa "Trí nhớ hôm nay", lệnh săn bằng câu tiếng Anh. Đo lại tỉ lệ học.
3. **Ô chọn Unit theo lớp** cho từng bé; ôn từ đến hạn lấy từ mọi Unit đã học; sửa lỗi "học dồn".
4. **Truyện**: nhiệm vụ mẫu 1, 2, 3 ở Làng; 4, 5 ở Cảng; Pip đi theo; thoại mới cho Tom và Lord Hush; đổi các tên trùng.
5. **Hiệu năng sâu**: giảm lưới gói cây cỏ, thu ảnh vân, nhân vật và NPC bản nhẹ, chia ô cắt theo tầm nhìn, dùng chung mô hình dân làng.
6. **Mô hình**: clip cho quái và thú Tripo; hai nhân vật tự tạo thay Luna, Mika; cụm hải đăng; cây bản mới; xoá 21 MB file thừa.
7. **Giao diện**: hướng dẫn điều khiển, trang phím, "còn N quái", cỡ chữ, Esc đóng mọi bảng, nút khôi phục bản sao lưu, báo cáo từ yếu cho phụ huynh.
8. **Kiểm thử**: nhóm quick cho nhân vật mới và tải lại trang; test đi hết chuỗi nhiệm vụ; bỏ các khẳng định rỗng.
9. Dọn tài liệu: một file cốt truyện, sinh lại các bảng số, đánh dấu file đã cũ.

### Giai đoạn 3: sau đó

1. **Map 4 Sa mạc** (tài nguyên đã có sẵn), rồi Map 5 núi tuyết. Mỗi map một loại từ bị mất, một mốc Tripo, một chuỗi truyện 5–7 nhiệm vụ.
2. **Nội dung học sâu**: câu ví dụ, phiên âm, dạng nghe và điền từ; ngữ pháp Unit 3 trở đi; giáo viên đối chiếu khung ngữ pháp.
3. **Chơi hai người** cho hai bé.
4. Tách `main.js`; chạy công cụ định dạng mã; xoá mã chết.
5. Nếu muốn chia sẻ ra ngoài gia đình: LICENSE, màn Ghi công, kiểm điều khoản Tripo, đổi cách ghi "Global Success", đổi bảng Xếp hình, ký số bản cài.

---

## Phụ lục: đã kiểm gì, chưa kiểm gì

**Em đã tự kiểm lại (✔):** ba kịch bản bản lưu hỏng; mất thưởng khi nhận ở Làng; EXP bảng săn và hũ chữ; bảng số quái, EXP, vàng theo cấp; số tam giác và vật liệu của Ruby, golem dung nham, cỏ, dương xỉ; kích thước ảnh của Tom; ảnh dựng Luna và Mika; bản cài `desktop-latest`; và khoảng 45 dòng mã được trích trong báo cáo.

**Trợ lý báo, em chưa tự kiểm lại (◐):** phần lớn mục P2; con số bộ nhớ đồ hoạ; số lệnh vẽ; lỗi tìm đường; lỗi âm thanh; cỡ chữ đo bằng dựng tĩnh; danh sách file không dùng (dò theo tên, có thể sót).

**Chưa ai kiểm (?):** mọi thứ cần chạy game thật: FPS và độ giật trên máy nhà; cảm giác đánh quái và thời gian thật mỗi con; tốc độ câu cá; giáp có lệch trên Ruby không; chất lượng giọng đọc trên Windows; màn cảm ứng; hình dáng các mô hình `nat_*`, `vil_*`, `for_*` chưa nối.

**Chưa làm:** không chạy quick, e2e (theo yêu cầu). Mảng bản đồ chưa phân tích vật trang trí (`plants.js`, `outer_ring.js`) và chưa xét việc nhảy khi leo vách.

**File tạm của đợt rà soát** (không commit; mất khi phiên làm việc kết thúc, chạy lại script là có): bảng kiểm kê 467 mô hình, danh sách 199 file không dùng, bản đồ nhìn từ trên xuống của bốn vùng, ảnh dựng Luna và Mika. Nếu anh muốn giữ, bảo em chép vào `docs/`.
