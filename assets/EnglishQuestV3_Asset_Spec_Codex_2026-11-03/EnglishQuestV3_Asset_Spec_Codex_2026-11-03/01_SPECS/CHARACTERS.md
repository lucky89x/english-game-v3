# Nhân vật nữ chính và sáu NPC — yêu cầu GLB

## Hero: `chr_ngoc_adventurer_v01.glb`
**Mẫu:** `REF_01_FEMALE_HERO.png` (mái tóc nâu xoăn búi cao, kính goggles đồng trên khăn đỏ, mặt tròn, mắt to, khăn quàng đỏ, áo kem/quần short nâu, găng tay, boots buộc dây, bình thuốc xanh ở hông, túi bản đồ/cuộn giấy). Không đổi thành nhân vật nữ người lớn realistic, không dùng model nam hoặc hình trụ.

**Dựng bắt buộc:** mặt có miệng/mí mắt dùng blendshape hoặc animation riêng, tóc thành khối nhiều lớp, strap/buckle không xuyên cơ thể, áo và phụ kiện riêng để đổi đồ về sau. Render turnaround 0°/90°/180°/270° + ảnh HUD đầu/vai. Xuất mesh + Armature + các clip có thể chơi được trong Godot.

**Animations tối thiểu P0:** `Idle`, `Walk`, `Run`, `Jump`, `Fall`, `Land`, `Talk`, `Interact` (nếu một clip chưa dựng, báo `MISSING`; không giả thành công). P1: `Wave`, `PickUp`, `Celebrate`, `AttackLight`, `Hurt`, `Sit`, `Fishing`, `Read`. CharacterBody3D giữ lại trong Godot; model là child visual, không thay hệ vật lý.

**Hướng/scale:** mặt hướng `-Z` trong Godot; cao 1,50 m; giữa bàn chân ở `Y=0`, khớp pivot khớp hướng di chuyển; không root-motion di chuyển hai lần.

## 6 NPC lõi P0/P1
| ID | Hình mẫu | Dấu hiệu nhận dạng & đồ cầm tay | Anim ưu tiên | Vai trò |
|---|---|---|---|---|
| `npc_tom_elder` | `REF_02_ELDER_NPCS.png` | cụ già râu trắng, áo choàng xanh viền vàng, gậy đèn | Idle, Talk, Wave, Walk | Trưởng làng, quest chính |
| `npc_sam_fisherman` | REF_02 | cụ già nón rơm, áo xanh, cần câu/xô cá | Idle, Walk, Fishing, Talk | bến sông, câu cá |
| `npc_ben_merchant` | REF_02 | người bán hàng, tạp dề xanh, giỏ táo | Idle, Walk, Talk, GiveItem | cửa hàng, giao thương |
| `npc_professor_scholar` | REF_02 | kính tròn, mũ học thuật xanh, quyển sách đỏ | Idle, Read, Talk, Point | thư viện, bài học |
| `npc_forge_blacksmith` | REF_02 | tạp dề nâu, kính thợ, búa/đe | Idle, Hammer, Talk, Walk | chế tạo công cụ |
| `npc_herbalist` | REF_02 | áo/mũ xanh lá, túi lọ thuốc, gậy phép | Idle, Talk, PickHerb, Walk | thảo dược/quest ẩn |

NPC có thể dùng chung rig cơ sở sau khi duyệt chênh lệch hình thể, nhưng **mỗi NPC phải có mặt, trang phục và đạo cụ riêng**. Đạo cụ cầm tay xuất riêng để gắn `BoneAttachment3D`/socket. Thiết kế hệ data `npc_id`, `dialogue_id`, `schedule_id`, `quest_hooks`; NPC đi trên NavMesh và không đi xuyên nhau.

## Nhân vật nữ bổ sung (P2)
- `chr_forest_druid`, `chr_winter_traveler`, `npc_baker_girl`, `npc_musician_girl`, `npc_fairy_mage` theo REF_01.
- Không đưa vào lô đầu nếu chưa hoàn thiện hero + Tom.

## Tài liệu chứng minh mỗi nhân vật đạt
- GLB + file Blender + các texture nguồn; danh sách clip anim thực tế.
- Screenshot mặt trước/bên/sau, close-up biểu cảm, ảnh trong game ở khoảng cách camera thật.
- Báo cáo `Skeleton3D`, tên bones/sockets, texture, số triangle/material, lỗi clipping.
- Một scene Godot test `test_characters.tscn`: hero đi/chạy/nhảy; Tom Idle/Talk/Wave và tương tác `E`.
