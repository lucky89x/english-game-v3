# ENGLISH QUEST V3 — ĐẶC TẢ NÂNG CẤP CẢNH QUAN, NHÂN VẬT VÀ HOẠT ẢNH

Phiên bản: 1.0 — 02/11/2026
Đích: Godot 4.x, game PC Windows, camera góc chéo có thể xoay 360°, thế giới fantasy stylized 3D.
Nguồn: ảnh concept English Quest do chủ dự án cung cấp, mô hình Quaternius đã nhập, bản Godot hiện hành.

## Nguyên tắc bắt buộc

1. Không đổi toàn bộ dự án, không mất các scene đã chạy được, không xóa dữ liệu hoặc asset gốc.
2. Kiểm kê scene và định dạng thực tế trước khi sửa; ảnh PNG concept không phải mesh 3D và không thể giả làm nhân vật rigged.
3. Không báo 'đạt đồ họa' chỉ vì thêm vài cây/đá, thay màu nền hoặc thêm một tấm skybox. Phải có cảnh quan 3D thật ở gần, trung và xa.
4. Không dồn cả ba đợt (cảnh quan, nhân vật, NPC) vào một lượt sửa. Mỗi đợt chạy F5 và được chủ dự án duyệt trước khi tiếp tục.
5. Không chép đè các cảnh báo, không tự động tải asset bên ngoài không rõ giấy phép.

## A. Quy chuẩn hình ảnh chung (Art Bible tóm tắt)

- Phong cách: stylized fantasy 3D, khối rõ, vật liệu sơn tay hoặc stylized PBR, đường viền mềm; nhân vật chibi tỷ lệ ổn định.
- Ánh sáng: ban ngày sáng ấm, bóng mềm, ambient vừa đủ; tránh bóng đen gắt và màu cháy.
- Màu: cỏ nhiều cấp độ xanh olive/chanh, đường đất nâu đất và vàng nhạt, đá xám ấm, gỗ nâu đỏ, mái ngói đất nung/lam, nước xanh ngọc.
- Dùng mẫu nhà, cây, cầu, nhân vật cũ làm ART REFERENCE, không đưa hình render PNG lên mặt đất làm nền camera xoay.
- Trong bán kính chơi gần: có cỏ, bụi, đá, đất, lối đi, bờ nước và đồ vật có quy mô hợp lý; cảnh ở xa chuyển dần thành rừng, đồi đá và chân trời.
- Địa hình không phẳng hoàn toàn: biến thiên độ cao nhỏ ở vùng đi bộ; bờ hồ, chân đồi và thềm đá có cấp độ; tránh tạo dốc cản người chơi ở đường chính.

## B. Đợt 1 — Môi trường 3D thực sự, không còn mặt đất xanh đơn điệu

### B1. Nền đất và đường đi

- Thay mặt nền một màu bằng terrain mesh hoặc các module 3D có vật liệu nhiều lớp. Dùng noise/splatmap/vertex color hoặc shader tương thích Godot để pha cỏ, đất, đá và bùn ẩm.
- Bố trí đường đá/đất uốn cong, ranh giới mềm: có cỏ mọc sát mép, sỏi, đất lộ và thay đổi sắc độ; không lặp cùng một decal theo hàng cứng nhắc.
- Có địa hình cao thấp vừa phải, collision đi lại được, nhân vật đặt bàn chân đúng mặt đất.

### B2. Phần nền xung quanh và chân trời

- WorldEnvironment với sky daylight, sương khoảng cách nhẹ, color grading thống nhất.
- Có ít nhất ba lớp chân trời (rừng xa, đồi gần, dãy núi xa) bằng geometry 3D tối ưu; camera xoay không nhìn thấy mặt phẳng trống hoặc rìa map ngay sau nhà.
- Bố trí vành đai địa hình tự nhiên bằng rừng, đồi, vách đá; có đường dẫn sang zone kế tiếp thay vì tường vô hình lộ liễu.

### B3. Khu vực mẫu 4 chức năng

1. Quảng trường: giếng, 3–5 ngôi nhà, 2–3 quầy, lối đi, biển chỉ dẫn, đèn, NPC.
2. Bến sông: mặt nước có chuyển động, bờ đá/cỏ, cầu gỗ hoặc cầu đá, bến thuyền, lau sậy, hoa súng.
3. Nông trại: ruộng và vườn cây, nhà kho, hàng rào, cối xay hoặc dụng cụ, đường đi.
4. Rìa rừng: cây thông/lá rộng theo cụm, đường mòn, bãi đá, cổng dẫn sang vùng kế tiếp, điểm bí mật.

### B4. Biện pháp hiệu năng

- Scene có thể mở riêng; đồ vật lặp sử dụng instancing/MultiMesh khi phù hợp; culling và LOD tùy ngân sách thiết bị.
- Texture và mesh có số lượng/độ phân giải cân đối, tránh quá nhiều vật liệu alpha trong suốt; bóng đổ xa rút gọn.
- Đo FPS và frame time thực tế trong build có đồ họa khi chạy qua làng, xoay camera và chuyển khu. Báo cáo các cấu hình kiểm thử.

### Điều kiện nghiệm thu đợt 1

- F5 mở được, các hệ thống camera/di chuyển/chest/NPC hiện hành không hỏng.
- Quay camera 360° ở ít nhất 3 vị trí khác nhau: không thấy nền xanh đồng màu trống trải, không lộ mép map đột ngột.
- Nhân vật đi từ quảng trường tới bến sông, nông trại, rìa rừng mà không kẹt ở địa hình hoặc đi xuyên nước.
- Có ảnh chụp in-game tại 4 khu vực; quay clip 30–60 giây camera và di chuyển; log FPS/frame time thực tế.

## C. Đợt 2 — Player 3D hoàn chỉnh

### C1. Asset cần đủ

- Model ưu tiên GLB/glTF, Skeleton3D/skin, tỷ lệ nhân vật nhất quán, vật liệu/texture hợp phong cách, nếu có thì dùng rig humanoid.
- Ít nhất 01 nhân vật nữ (phù hợp mẫu phiêu lưu khăn đỏ), sau đó tùy chọn nhân vật nam hoặc tạo hình thay thế.
- Các hoạt ảnh thực sự, không xoay/nhún một hình trụ để giả lập vận động.

### C2. Bộ animation player tối thiểu

| Animation | Trigger / mục đích | Ghi chú |
|---|---|---|
| Idle | đứng yên | thở, chớp mắt/nhìn quanh nhẹ nếu có |
| Walk | di chuyển | bước chân khớp tốc độ |
| Run | Shift + di chuyển | chuyển từ Walk mượt |
| Start/Stop | tăng/giảm tốc | tùy asset có sẵn; tránh giật |
| Turn | đổi hướng | xoay thân theo hướng đi, không snap |
| Jump | Space | cất cánh, bay, tiếp đất nếu có |
| Interact/Pickup | E | có cử chỉ đưa tay, nhận đồ |
| Talk/Greet | hội thoại | gật đầu, vẫy tay |
| Celebrate | nhận thưởng | vui mừng ngắn, không gián đoạn di chuyển lâu |
| Hurt | bị tác động | phản hồi nhẹ, phù hợp trẻ em |

- Dùng AnimationPlayer chứa clip, AnimationTree (StateMachine hoặc BlendSpace) để blend Idle/Walk/Run và trạng thái tương tác; trộn 0,12–0,25 giây chỉ là điểm khởi đầu, chỉnh theo cảm giác chơi.
- Thống nhất nguồn chuyển động: in-place animation + di chuyển CharacterBody3D HOẶC root motion được xử lý có kiểm soát; tránh chạy đôi làm trượt chân.
- Nếu chưa có asset với rig/animation, đánh dấu BLOCKED và xuất danh sách thiếu, không tự báo hoàn thành.

### Điều kiện nghiệm thu đợt 2

- Không còn capsule lộ ra khi chạy bình thường.
- Idle–Walk–Run–Stop–Turn–Jump–Interact chạy được, không T-pose, không chân lọt nền, không biến dạng bất thường.
- Di chuyển tương đối theo hướng camera; giữ chuột kéo xoay không làm nhân vật giật hướng.
- F5 và scene riêng PlayerTest cùng hoạt động.

## D. Đợt 3 — NPC, quái vật, thú đồng hành, hoạt ảnh môi trường

### D1. Nhân vật NPC tối thiểu của Starter Village

- Elder Tom: nam cụ già râu trắng, gậy đèn; Idle, Talk, Greet, Point, GiveItem, Walk.
- Merchant Ben: người bán hàng; Idle, Talk, HandOverItem, Walk.
- Teacher/Sage: giáo viên hoặc học giả cụ già; Idle, Talk, Explain/Point, ReadBook.
- Rose/Lily: NPC nữ; Idle, Walk, Talk, Wave; không dùng chung một skin cho mọi NPC.
- Ngư dân Sam: Idle, Fish, Talk, Walk (sau khi có bến sông).
- Mỗi NPC có marker đứng, collision nhẹ, vùng tương tác, biểu tượng nhiệm vụ, tên dễ đọc và quay mặt về player lúc hội thoại.

### D2. Sinh vật

- Slime: Idle wobble, Patrol, React, Hop; thân thiện không đáng sợ.
- Rock golem nhỏ: Idle, Walk, Wave, Hurt nhẹ.
- Pet (chó/cú): Follow, Idle, Celebrate; tránh bị kẹt hoặc tụt lại.

### D3. Hoạt ảnh cảnh quan

- Mặt nước có gợn/ripple, dòng nước/foaming hợp lý; bánh xe nước quay nếu có.
- Lá cây/cỏ rung nhẹ bằng shader hoặc animation (không quá mạnh).
- Ống khói có khói, đèn phát sáng, lửa trại chuyển động, cờ/phướn bay nhẹ.
- Các hiệu ứng phải có thể bật/tắt theo cài đặt chất lượng đồ họa.

### Điều kiện nghiệm thu đợt 3

- Có ít nhất 3 NPC khác biệt bằng mô hình thật, cùng phong cách và có animation quan sát được.
- E tương tác tạo hội thoại; NPC có cử chỉ trong khi nói; không dịch chuyển xuyên tường.
- Có một quái vật thân thiện và một thú đồng hành mẫu được kiểm tra trên đường đi.
- Cảnh quan có hiệu ứng chuyển động nhưng không bị giật/hạ FPS đáng kể.

## E. Camera và UX (duy trì ở cả 3 đợt)

- Nút kéo xoay camera cấu hình được, đề xuất chuột phải để không xung đột chọn/điều khiển NPC.
- Yaw xoay liên tục 360°, pitch giới hạn hợp lý, zoom cuộn; smoothed rotation/follow theo delta time.
- Camera collision/occlusion cho nhà, cây, vách đá; tránh xuyên hình hoặc che player.
- Hiện chỉ dẫn phím một lần, sau đó thu gọn; tùy chỉnh độ nhạy và đảo chiều xoay.

## F. Cấu trúc file gợi ý (không ép ghi đè file hiện tại)

res://assets/reference_art/          # PNG concept (chỉ tham chiếu)
res://assets/third_party/            # Asset tải về + license
res://assets/characters/models/      # GLB/glTF người chơi
res://assets/npc/models/             # GLB/glTF NPC
res://assets/creatures/models/       # GLB/glTF quái/pet
res://assets/environment/models/     # Nhà, cây, đá, cầu
res://world/zones/starter_village/   # Scene địa hình/chunk/vùng
res://characters/                   # Player scene/logic
res://npc/                          # NPC scenes/logic
res://systems/                      # Interaction, animation, streaming

## G. Cách bàn giao cho chủ dự án

Trong mỗi đợt Codex phải nêu: (1) file thay đổi; (2) asset nguồn được sử dụng; (3) tài nguyên thiếu; (4) cách F5 và scene test; (5) kết quả đo FPS thực tế; (6) ảnh/video game chạy thật. Nếu không đủ asset mô hình, không nhận là đã hoàn thành thiết kế 3D.
