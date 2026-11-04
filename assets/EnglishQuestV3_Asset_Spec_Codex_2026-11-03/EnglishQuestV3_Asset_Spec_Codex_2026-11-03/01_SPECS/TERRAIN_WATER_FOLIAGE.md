# Địa hình, sông hồ, đá, cây — giải quyết gốc lỗi nền xanh

## Nguyên tắc
**Không tiếp tục phủ thêm cỏ/hoa lên mặt phẳng xanh duy nhất rồi gọi là ground đẹp.** Địa hình cần có phân vùng vật liệu và chiều cao hợp lý, chuyển sắc tự nhiên tại các ranh giới; dùng nhiều lớp hình học ở mép sông và địa hình. Giữ đường collision đồng nhất với hình dáng terrain.

## Hệ terrain
- Sử dụng `heightmap`/mesh chunks/terrain plugin đã kiểm tra tương thích dự án; phân ô/chunk sau khi thử prototype; mỗi chunk có topography.
- Shader `terrain_blend` PBR có ít nhất 5 vùng: cỏ non/cỏ sẫm, đất mòn, đất đường, sỏi/đá, đất ẩm ven sông. Blend theo **mask/vertex colors/splatmap**, cộng slope/height khi phù hợp.
- Tạo variation vi mô không lặp (noise màu/normal/roughness), tránh tạo pattern ô vuông lộ seam. Dùng geometry scatter cỏ/hoa cho lớp gần, LOD hoặc texture detail cho lớp xa.
- Đường làng phải có mép mờ, đá có nền đất lộ kẽ, rêu mỏng, không chồng các viên như trải sỏi đều khắp.

## Sông, hồ và thác
- Sông là **rãnh hạ mặt địa hình**, bờ có dốc/đá/đất ẩm/chuyển cây cỏ. Nước không cắt qua vùng đất phẳng kiểu hình chữ nhật.
- Nước turquoise theo ảnh nhưng không xanh neon; shader có UV flow hoặc world-space flow, 2 lớp gợn sóng chuyển hướng, fake highlights, Fresnel nhẹ, mép foam khi nước gặp đá, opacity tùy độ sâu nếu pipeline cho phép.
- `wat_river_straight`, `wat_river_bend`, `wat_river_junction`, `wat_pond_a`, `wat_waterfall_small` dùng **geometry/scene + shader**: GLB chỉ chứa hình học, còn hoạt ảnh nước nên thực hiện trong Godot `ShaderMaterial`/GPUParticles3D.
- Bờ sông trồng reeds/cattails/hoa súng/moss, có sỏi bờ; kiểm tra va chạm và giới hạn bơi/đi trong nước.

## Cây/đá/cỏ
- `veg_oak_*`, `veg_birch_*`, `veg_pine_*`, `veg_blossom_*`, `veg_bush_*`, `veg_flower_*`, `trn_cliff_*`, `trn_rock_*` là mesh độc lập, hình khối theo REF_03.
- Không để cây lá quá sáng cháy vàng. Kết hợp màu lá ấm lạnh, mật độ thay đổi giữa quảng trường/rừng/ven sông. Tránh che nhân vật và HUD ở camera mục tiêu; dùng fade hoặc occlusion cho vật cản gần camera.
- LOD/MultiMeshInstance3D cho cỏ, hoa, đá nhỏ và tree variants khi có lợi; tránh quá nhiều material riêng trên vật lặp.

## QA cảnh map 1
- Chụp 4 ảnh: quảng trường, bến sông, nông trại, rìa rừng (cùng chuẩn camera và ánh sáng).
- Khi quay camera 360°, không lộ nền xanh phẳng vô tận; phông núi có tỷ lệ và sương khoảng cách.
- Cầu đi qua 2 chiều, bờ không có răng cưa, NPC đi được trên đường NavMesh.
- Không có vùng đường/cỏ/sông bị lặp tile thô; nước có chuyển động rõ nhưng không gây FPS tụt lớn.
