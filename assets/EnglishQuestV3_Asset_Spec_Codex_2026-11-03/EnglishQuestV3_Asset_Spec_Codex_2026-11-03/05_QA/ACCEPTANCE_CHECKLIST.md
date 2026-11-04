# Biểu nghiệm thu model / scene

## Mỗi GLB
- [ ] Có `.glb` **thật** (glTF 2.0), Blender mở được, Godot import được, đủ mesh/material/texture, không có texture thất lạc.
- [ ] Hình khối/hair/face/công trình **giống concept nhận diện rõ**, review ảnh 4 góc 360°, không chỉ nguyên khối primitive.
- [ ] Tỉ lệ: hero 1,50m; nhà/cửa/cầu theo thông số; origin/pivot + định hướng chuẩn; không clipping.
- [ ] Hình học/manifold hợp lý, shading/normal/UV ổn, vật liệu không cháy sáng; kiểm tra trên máy thật.
- [ ] Báo cáo mesh count, triangles, material slots, texture size, tình trạng LOD khi cần.
- [ ] Nếu là nhân vật: xác nhận `Skeleton3D`, không chỉ object transform animation; clip Idle/Walk/Run/Talk... chạy trên AnimationPlayer trong Godot; blending không giật, bàn chân không trượt bất thường.
- [ ] Nếu là nhà: cửa/cầu thang đủ cao/rộng, tường/sàn va chạm đúng, nội thất scene riêng vào/ra được.
- [ ] Nếu là cầu: bề mặt đi lại hai chiều, camera không kẹt, đầu cầu khớp bờ và đường.
- [ ] Nếu là terrain/water: không dùng mặt phẳng xanh đều, shader/mesh bờ hòa với đường/cỏ, chuyển động có hiệu năng chấp nhận được.
- [ ] GLB có tên đúng manifest, có license và reference, không ghi nhầm `DONE` khi chỉ là blockout.

## Trên scene `EnglishQuestV3`
- [ ] F5 chạy scene chính, không có lỗi import/parse, vẫn có HUD/avatar, camera và WASD.
- [ ] Ảnh screenshot tại 4 vị trí trong làng cùng camera; so sánh concept vs runtime (ánh sáng/material/độ chi tiết).
- [ ] NPC Tom tương tác E, lịch đi lại/đứng yên không chặn đường; NPC khác chưa đạt phải ghi rõ.
- [ ] Rương trước đây vẫn mở/đóng; tiến độ/logic không bị mất.
- [ ] FPS hiển thị đo ở 1280x720 + 1920x1080, VSync trạng thái, GPU/CPU và cảnh test được nêu rõ; headless chỉ là smoke test.
- [ ] Có Git checkpoint/bản backup, liệt kê file sửa và rollback; source `.blend` ở ngoài project hoặc art_source.

## Trạng thái bắt buộc trong báo cáo
`BLOCKOUT` / `ART_IN_PROGRESS` / `GAME_READY_VERIFIED` / `BLOCKED_MISSING_ASSET`. Không tự điền DONE cho thiết kế ảnh tham chiếu hoặc mô hình thủ tục thô.
