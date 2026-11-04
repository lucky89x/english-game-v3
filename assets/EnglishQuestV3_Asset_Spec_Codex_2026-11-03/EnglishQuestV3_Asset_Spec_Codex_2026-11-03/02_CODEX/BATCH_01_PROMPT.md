# LÔ 01 — PROMPT NGẮN ĐỂ CODEX TRIỂN KHAI NGAY

Tiếp tục project Godot 4 EnglishQuestV3. **Trước khi viết code:** tìm/đọc 2 skill game 3D trong `.agents` và các AGENTS.md; đọc bộ tài liệu này tại `docs/asset_production`, đặc biệt `01_SPECS`, `ASSET_MANIFEST.csv`, `ACCEPTANCE_CHECKLIST.md`; nêu skill thực tế đã đọc. Tạo checkpoint Git/sao lưu.

Bước này KHÔNG yêu cầu dựng cả làng ngay. Hãy thực hiện một **pilot chất lượng cao** đúng ảnh PNG người dùng cung cấp:

A. `chr_ngoc_adventurer_v01.glb`: nhân vật nữ khăn đỏ, goggles, tóc búi, túi/bình thuốc xanh theo REF_01; mô hình 3D đa góc, rig chuẩn để Godot nhận Skeleton3D, animation Idle/Walk/Run, portrait HUD từ đúng model.
B. `npc_tom_elder_v01.glb`: ông già áo xanh râu trắng gậy đèn theo REF_02; rig, Idle/Talk/Wave, tương tác E.
C. `bld_mayor_hall_v01.glb`: nhà hội trường thật sự to (tham chiếu 18×14×13m), cửa đủ rộng để nhân vật vào, interior có NPC, rời vào qua portal.
D. `brg_wood_arch_v01.glb`: cầu gỗ cong chi tiết, có lan can, collision và đường tiếp nối bờ sông, đi hai chiều.
E. Terrain: không dùng nền xanh phẳng; tạo ground material 5 lớp blend, sông xẻ địa hình, đá/cỏ/bờ liền nhau, nước có chuyển động shader.

Đầu tiên phải kiểm kê xem đã có `.blend` / `.glb` đủ chất lượng chưa. Nếu chỉ có reference PNG và prototype thủ tục, cần **thành thật nói chưa thể tạo mô hình cao cấp** nếu không có modeling/rigging chuyên dụng, thay vì tạo khối thô và báo xong. Có thể chuẩn bị scene test, scale/rig templates, shader, validators, nhưng phân biệt rõ blockout và game-ready.

Nghiệm thu: ảnh 4 góc với đúng chất lượng đã duyệt, test Godot scene riêng, rig/animation thật, collision và nội thất; F5 không lỗi, không phá MainWorld. Xuất bảng file, nguồn, trạng thái và thiếu sót; dừng sau lô đầu để tôi duyệt.
