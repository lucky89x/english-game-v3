# Lô 01 — công việc mỹ thuật cần hoàn thiện trong Blender

Đây là brief bàn giao, KHÔNG phải chứng nhận model hoàn thiện. Không có `.blend` custom mới được tạo trong lượt này: chưa tìm thấy Blender trong PATH, registry ứng dụng, Program Files, Local/Programs, Downloads hoặc thư mục cấu hình Blender. Không có connector tạo model 3D chuyên dụng trong phiên. Có 103 `.blend` Quaternius nguồn, danh sách tại `artifacts/batch01/blend_sources.json`; chúng chưa được mở/kiểm chứng bằng Blender trong phiên này.

Đọc ảnh trực tiếp trước khi dựng: `REF_03_ENVIRONMENT.png` bị đặt tên lệch (nội dung là nhân vật); nhà/cầu/terrain thực nằm ở `REF_04_VILLAGE_SCENE.png`. Giữ nguyên file gốc và ghi mapping này trong review.

## Ngọc — BLOCKED_MISSING_ASSET
Model đối chứng: `assets/pilot_batch01/chr_quaternius_adventurer_baseline_v01.glb`, tác giả Quaternius, không phải thiết kế Ngọc. 6.812 triangles, 62 joints, 9 materials, không có texture. Nguồn `.blend`: `assets/Ultimate Modular Women - April 2022/Individual Characters/Blends/Adventurer.blend`.

Cần sculpt/retopo đầu tròn chiếm 35–42% chiều cao 1,50 m; tóc xoăn búi nhiều lớp; goggles đồng trên khăn đỏ; khăn quàng, áo kem, quần short, boots buộc dây, găng tay, túi/cuộn bản đồ/bình thuốc xanh. Đồ mặc và phụ kiện tách object, seam/UV và atlas 2K thật. Tạo eyelids/mouth/blendshapes, sửa skin ở vai/hông/khuỷu/gối. Xuất hướng -Z, pivot bàn chân Y=0. Retarget và chỉnh bàn chân in-place cho Idle/Walk/Run; Jump/Fall/Land/Talk chưa có trong nguồn. Không đổi tên Roll/Spell thành clip thiếu. Interact/Wave nguồn có thể làm đối chứng, chưa mặc định phù hợp cơ thể chibi mới.

## Tom — BLOCKED_MISSING_ASSET
Wizard đối chứng có 5.376 triangles, 32 joints, 2 materials và 2 texture 512/1024. Nguồn `assets/RPG Characters - Nov 2020/Blends/Wizard.blend`. Cần sculpt mặt già phúc hậu, mũi tròn, tóc/râu trắng mềm, áo choàng xanh viền vàng, gậy đèn tách object với socket bàn tay. Dựng Talk có diễn xuất mặt/đầu/tay, Wave giơ và vẫy bàn tay với skin deformation thật. Nguồn chỉ có Idle/Walk/Run cùng các clip chiến đấu, **Talk/Wave MISSING**. Kiểm tra socket không xuyên áo khi vẫy và bước đi. Không xuất vật liệu kim loại quá tối cho mặt/râu.

## Nhà trưởng làng — BLOCKED_MISSING_ASSET (có baseline kitbash)
Không dùng baseline tháp cao làm nhà 18×14×13 m đã hoàn thiện. Thiết kế lại sảnh chính mái xanh dày, cánh hai bên, phù hiệu, cửa sáng, bậu hoa, bậc thềm. Cửa thông thủy ≥1,5×2,3 m, hành lang ≥1,8 m. Tách mặt ngoài/interior, hai phòng và cầu thang có landing/ramp collider. Basement/pivot không chìm sàn. Cần atlas gỗ mật ong/đá xám tím/vữa kem, giảm material và dữ liệu texture. Baseline hiện gồm tháp nên bounds khác mục tiêu và cửa chỉ là mesh đóng.

## Cầu — BLOCKOUT/đối chứng kỹ thuật
Baseline xuất từ cầu kitbash hiện có, chỉ 340 triangles: dùng để so tỷ lệ/collision, không được trình bày như cầu concept mới. Dài 9,1 m, tổng rộng 3,166 m gồm lan can; lối giữa khoảng 2,7 m. Cần bo cạnh ván, độ dày gỗ, kết cấu cong chịu lực dưới cầu, trụ/tay vịn nhiều chi tiết, đinh/dây, kết thúc mép bờ và texture gỗ có chủ đích. Pivot logical đầu cầu, transform apply; shader ramp hiện được thay bằng PBR fallback trong GLB, cần bake vân gỗ mới. Giữ collision mượt độc lập các chi tiết nhỏ.

## Terrain/water — ART_IN_PROGRESS, mẫu kỹ thuật
Mesh 32×32 m có rãnh sông, đỉnh RGBA là trọng số grass/dirt/gravel/wet. Hai tông cỏ dùng detail texture; đủ 5 màu vật liệu nhưng chưa có 5 bộ texture PBR. Cần sculpt/paint mask bờ và mặt đường tự nhiên; bake normal/roughness/atlas đá/cỏ/đất, xóa đường nối texture detail, thêm đá/reeds theo bố cục có chủ đích. Water GLB chỉ giữ hình học; Godot shader cung cấp chuyển động. Chưa có foam dựa depth quanh từng tảng đá.

## Quy trình xuất / nghiệm thu
Lưu `.blend` riêng trong `art_source/batch01/` và texture nguồn có tên rõ. Xuất GLB glTF2 với mesh, UV, material, embedded texture; skin và từng clip đúng tên. Kiểm tra trong Blender bằng cách import lại GLB, rồi mở scene gallery Godot F6, quay 0/90/180/270. Duyệt silhouette trước, tiếp đến vật liệu/biểu cảm/skin, cuối cùng collision & hiệu năng. Chỉ khi đạt mới dùng tên đích `assets/original_3d/...` và tích hợp MainWorld. Không nâng trạng thái chỉ vì parser GLB trả OK.
