# Ngọc — chibi05 (chr_ngoc_adventurer_v02)

Nhân vật chính dựng lại hoàn toàn trong Blender theo `REF_01_FEMALE_HERO.png` (nhân vật thứ 2 từ trái): tóc nâu xoăn búi cao, kính đồng trên băng đô đỏ, khăn quàng đỏ, áo kem tay phồng, quần short kaki, dây da chéo, thắt lưng khóa vàng, túi da, bình thuốc xanh, cuộn bản đồ sau lưng, găng hở ngón, boots buộc dây.
Không dùng mesh bên thứ ba: toàn bộ hình học do script `tools/chibi05/build_ngoc_chibi.py` tạo.

## Thông số
| Mục | Giá trị |
|---|---|
| Runtime | `res://assets/characters/models/chr_ngoc_adventurer_v02.glb` |
| Nguồn | `art_source/chibi05/chr_ngoc_adventurer_v02.blend` |
| Chiều cao | 1,55 m (đầu + tóc ≈ 42 %), chân tại Y=0, mặt hướng +Z của Godot (hướng PlayerController xoay VisualRoot) |
| Tam giác | 40.056, 1 mesh skinned, 2 material (`NgocBody` palette 256 px + ORM, `NgocFace` 1024 px) |
| Xương | 22 bone (root, hips, spine, chest, neck, head, bun, scarf_tail.R, vai/cánh tay/cẳng tay/bàn tay, đùi/ống chân/bàn chân L/R) |
| Animation | Idle, Walk, Run, Jump, Fall, Land, Talk, Interact, Wave, Celebrate (24 fps, tại chỗ) |
| Khuôn mặt | `ngoc_face_happy/blink/talk/joy.png`, đổi lúc chạy bằng `scripts/ngoc_face_controller.gd` (chớp mắt, nhép miệng, mặt vui khi Wave/Celebrate) |

## Dựng lại
```
blender --background --python tools/chibi05/build_ngoc_chibi.py      # chạy tại thư mục gốc repo
# hoặc: pip install bpy==5.2.3 && python tools/chibi05/build_ngoc_chibi.py
```
Script ghi đè `.blend`, `.glb`, palette và 4 texture mặt. Muốn đổi màu: sửa `PALETTE`; đổi nét mặt: `tools/chibi05/ngoc_face.py`.

## Kiểm thử (Godot 4.7.2)
- `tests/redesign03/validate_characters.gd`: đủ 10 clip, mỗi clip có bone chuyển động.
- `tests/chibi05_hero_test.gd`: Jump → Fall → Land trong MainWorld, material mặt được thay, mặt vui khi Wave, nhép miệng khi talk.
- `tests/smoke_test.gd`, `tests/skills_upgrade_test.gd`: vẫn PASS.
- `tests/chibi05_capture.gd` (cần renderer thật, ví dụ `xvfb-run godot --rendering-driver opengl3 --script ...`): ảnh trong game ở `artifacts/chibi05/`.

## Giới hạn còn lại
- Ngón tay gộp dạng găng tay, chưa có ngón riêng; tóc/khăn là rigid theo xương (bun, scarf_tail có lắc thứ cấp bằng keyframe, chưa có physics).
- Chưa có shape key/blendshape: biểu cảm dùng đổi texture mặt.
- Animation là keyframe thủ tục, chưa qua chỉnh tay của animator; chân có thể trượt nhẹ vì tốc độ di chuyển của controller (5,5/8 m/s) lớn so với sải chân chibi.
- Bản cũ `assets/redesign03/ngoc_adventurer.glb` vẫn giữ nguyên để đối chiếu, không còn được Player dùng.

---

# Lượt 2 — NPC, nhà, cây, nền đất, sông (chibi05)

Tất cả dựng mới bằng script Blender, cùng phong cách với Ngọc (khối tròn, màu palette phẳng, đèn cửa sổ phát sáng). Thư viện chung: `tools/chibi05/chibi_lib.py`.

| Hạng mục | Script | Runtime |
|---|---|---|
| Trưởng làng Tom (áo choàng xanh viền vàng, râu tóc trắng, gậy đèn lồng sáng) | `build_tom_chibi.py` | `assets/npc/models/npc_tom_elder_v02.glb` (27k tris; Idle/Walk/Run/Talk/Wave) |
| Ben bán hàng (mũ kem viền đỏ, ria trắng, nơ đỏ, tạp dề xanh) | `build_villager_chibi.py ben` | `npc_ben_merchant_v02.glb` (22k tris) |
| Sam ngư dân (nón rơm, râu trắng, khăn xanh, gile da) | `build_villager_chibi.py sam` | `npc_sam_fisherman_v02.glb` (23k tris) |
| 8 công trình: nhà mái đỏ, nhà 2 tầng mái xanh, cửa hàng mái cam + mái hiên sọc, thư viện mái xanh lá, hội trường, chuồng bò đỏ, kho bến sông, tháp canh | `build_houses_chibi.py` | `assets/environment/village/models/bld_*_v02.glb` |
| 10 cây/bụi: sồi (3 kiểu), hoa anh đào hồng, thông (2), bạch dương, bụi xanh/hoa/đỏ | `build_trees_chibi.py` | `veg_*_v02.glb` (cùng kích thước cây Quaternius cũ ~7 m) |

Trong Godot:
- `world/buildings/village_architecture.gd` đặt nhà chibi tại đúng vị trí cũ, giữ tên node (`HouseWest`, `VillageHall`, `HallWatchTower`...), cửa vào nội thất qua `BuildingTravel.register_door(..., door_local)`.
- Mọi scene trong `world/` và `landscape_details.gd` trỏ sang cây chibi.
- `assets/materials/terrain_blend.gdshader`: cỏ xanh tươi có mảng nắng và chấm hoa nhỏ, đường đất vàng mật ong, bờ sông cát, đá tím xám.
- `assets/materials/stylized_water.gdshader`: nước xanh biển sáng, vệt caustic, bọt trắng chuyển động ven bờ.
- Đá lát đường được tô lại xám tím ấm.
- NPC dùng chung `scripts/ngoc_face_controller.gd` (chớp mắt; Tom nhép miệng khi hội thoại).

Ngọc: đuôi khăn quàng dài bay như mẫu, thêm túi da sau hông, sửa pháp tuyến ở cực các khối tròn.

Ảnh: `preview_npcs.png`, `preview_buildings.png`, `preview_vegetation.png`, `preview_village_ingame.png`, `preview_village_before_after.png`.

Còn lại: nội thất 3 phòng, quầy chợ, cầu gỗ, hàng rào, rương vẫn là asset Quaternius; đồi/núi xa giữ nguyên; bờ sông vẫn là dải thẳng (chỉ thêm bọt/màu).
