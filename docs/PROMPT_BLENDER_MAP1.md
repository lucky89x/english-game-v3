# Lệnh cho Blender MCP: làm đẹp lại Map 1 (rà soát 19/11)

Cách dùng: dán **QUY ƯỚC CHUNG** một lần ở đầu phiên Claude Code trên máy anh (có Blender MCP), rồi dán từng **Lô**. Mỗi lô xong thì để Claude Code commit và đẩy lên nhánh `blender-assets`; báo em "đã đẩy lô N" là em nối vào game.

Thứ tự ưu tiên (đẹp lên rõ nhất cho các bé): **Lô 13 quái (ĐÃ NỐI)** → Lô 14 vũ khí/giáp → Lô 15 đồ tương tác → Lô 16 thiên nhiên → Lô 17 đồ làng → Lô 18 đồ rừng → Lô 19 trang phục/thân bạn nam → Lô 20 đồ theo hệ → Lô 21 hiệu ứng phép + biểu tượng → Lô 22 quái theo hệ → **Lô 23 phản diện, La Bàn, NPC cốt truyện** → **Lô 24 Map 3 Sa mạc** → **Lô 25 sự kiện và chơi chung**.
Tình trạng 20/11: nhánh `blender-assets` mới có đến lô 13 (và các lô cũ 1–12: cảng, đảo, nhà, phụ kiện, thú cưng). Lô 14–25 đang chờ anh làm.
Không cần vẽ lại: nhà (`bld_*`), NPC, đài phun nước, nông trại, cầu cong, thuyền, thú nuôi, mọi thứ ở Cảng/Đảo/nhà các con (đã là model Blender).

---

## QUY ƯỚC CHUNG (dán một lần)

```
Bạn đang làm model 3D cho game web Three.js "English Quest" (low-poly, màu phẳng kiểu hoạt hình, cho học sinh lớp 6–9).
Quy ước giống các lô trước (harbor_*, isle_*, home_*):
- Viết một script Python Blender chạy nền cho mỗi lô (tools/<tên thư mục>/build_*.py, chạy: OUT=<thư mục> blender -b -P script),
  xuất mỗi model ra assets/models/<tên>_v01.glb (glTF binary, +Y lên, áp dụng modifier, xuất tangent/normal bình thường).
- Gốc toạ độ ở chân vật thể (y=0 là mặt đất), vật thể nằm giữa gốc theo x/z. Mặt trước = −Y trong Blender (= +Z trong glTF).
- Đơn vị mét, đúng kích thước nêu trong từng mục. Màu phẳng, KHÔNG dùng texture ảnh; mỗi vùng màu một vật liệu có TÊN RIÊNG (game đổi/nháy màu theo tên).
  Màu ấm, no, hơi pastel, cùng tông với các model cũ (xem assets/models/harbor_mob_crab_v01.glb, bld_cottage_red_v01.glb để so).
- Viền sắc, mặt facet nhẹ (flat shading ở chỗ cần), bevel nhỏ. Vật thể sống có mắt trắng + đồng tử đen, biểu cảm dễ thương/dữ vừa phải (game cho học sinh cấp 2).
- Rig xương cứng đơn giản (không weight phức tạp) khi nói "có rig"; clip tên chính xác: Idle (lặp, 2 s), Walk (lặp, 1 s), Attack (một lần, 0.6 s), Hit (một lần, 0.3 s). Clip xuất thành animation của glTF.
- Giới hạn tam giác ghi theo mục. Sau khi xuất: tự kiểm bằng cách nạp lại file, in ra bbox, số tam giác, danh sách vật liệu và clip; render một ảnh xem trước 3/4 (tools/<thư mục>/preview_*.py) để em duyệt.
- Mỗi model xong: commit (chỉ add từng file), nhánh blender-assets, rồi push. Không đụng file ngoài assets/models, assets/ui, tools.
```

---

## LÔ 13 — Quái và boss Map 1 (ưu tiên cao nhất): 8 model có rig

Hiện tại quái Map 1 là hình dựng bằng code (khối cầu/đá thô), kém xa quái Map 2. Làm cùng đẳng cấp `harbor_mob_*`.

```
Lô 13: quái Map 1, thư mục tools/mobs1/, file build_mobs1.py. Mỗi con có rig, clip Idle, Walk, Attack, Hit, ≤ 2.500 tam giác (boss ≤ 7.000).
Tên file và vật liệu (giữ đúng tên vật liệu để game nháy sáng khi trúng đòn):
1. mob_slime_green_v01 — slime xanh lá, cao 0.9 m, rộng 1.0 m, thân thạch bóng (slime_green, slime_green_light cho vệt sáng), 2 mắt to eye_white/eye_black, miệng nhỏ cười, một vệt bóng trên đầu; Walk = nhún nảy, Attack = lao tới húc.
2. mob_slime_red_v01 — slime đỏ cam, cao 1.1 m, mặt cau có, 2 sừng nhỏ (horn_cream), vật liệu slime_red, slime_red_light.
3. mob_golem_stone_v01 — Golem đá, cao 1.8 m, thân khối đá xám (rock_grey, rock_dark, rock_moss rêu nhỏ trên vai), 2 tay to chân ngắn tách khớp (rig: root, body, head, arm_L/R, leg_L/R), mắt phát sáng vàng (eye_glow), Attack = vung 2 tay đập xuống.
4. boss_slime_king_v01 — Vua Slime, cao 2.4 m, thân xanh dương trong (slime_blue, slime_blue_light), vương miện vàng (gold) + ngọc đỏ (gem_red), mặt kiêu ngạo, vài viên đá quý lơ lửng nhỏ trong thân; Attack = nhún cao rồi đè xuống.
5. boss_golem_ancient_v01 — Golem Cổ, cao 3.2 m, đá nâu sẫm phủ rêu và dây leo (rock_brown, rock_moss, vine_green), hoa văn rune phát sáng xanh trên ngực và tay (rune_glow), vai có đá nhô, tư thế đồ sộ; Attack = đấm hai tay.
6. mob_bat_shadow_v01 — Dơi Bóng Tối, sải cánh 1.4 m, thân tím sẫm (bat_purple, bat_purple_light), tai to, nanh nhỏ, mắt vàng; cánh có màng (bat_wing), Idle và Walk đều là vỗ cánh (bay lơ lửng cách đất 1.2 m, chân y=0 là bóng đổ nên đặt thân ở y≈1.2).
7. mob_shroom_angry_v01 — Nấm Giận Dữ, cao 1.2 m, mũ nấm đỏ chấm trắng (cap_red, cap_dots), thân kem (stem_cream), mặt cau có, 2 chân ngắn + 2 tay ngắn; Walk = lắc lư đi, Attack = húc mũ.
8. boss_mushroom_queen_v01 — Nữ hoàng Nấm, cao 3.0 m, mũ nấm hồng chấm trắng (cap_pink, cap_dots), vương miện vàng nhỏ trên mũ (gold), thân kem, váy là các phiến nấm xếp tầng, mặt kiêu kỳ; Attack = rắc bào tử (chỉ cần xoay người + giơ tay).
Mặt trước −Y, chân chạm y=0 (trừ dơi). Cho mỗi model xuất kèm bbox in ra để em chỉnh tỉ lệ trong game.
```

---

## LÔ 14 — Vũ khí, giáp, bùa trang bị

Hiện kiếm là hộp dẹt, giáp là hình trụ. Giáp phải dựng trên thân Ngọc v04 như các phụ kiện `acc_*` (đã làm đúng chỗ, game treo vào xương bằng `boneInverses`).

```
Lô 14: trang bị, thư mục tools/gear/, file build_gear.py.
A) Vũ khí — mỗi file là một thanh kiếm đứng thẳng, gốc toạ độ ở TAY CẦM, lưỡi hướng +Y, mặt dẹt của lưỡi quay về +Z, dài khoảng 0.75 m (gồm cán), ≤ 700 tam giác:
 gear_sword_wood_v01 (kiếm gỗ: lưỡi gỗ sáng, đốc tròn, sợi dây quấn) · gear_sword_iron_v01 (sắt: lưỡi xám bạc bóng, chắn tay đồng) · gear_sword_crystal_v01 (pha lê: lưỡi xanh lam trong, phát sáng nhẹ, đốc bạc; vật liệu crystal_glow) · gear_sword_oak_v01 (lõi sồi: lưỡi gỗ nâu đỏ có vân, lá sồi trên đốc) · gear_sword_moon_v01 (ánh trăng: lưỡi trắng xanh, trăng lưỡi liềm ở chắn tay; vật liệu moon_glow).
 Vật liệu: blade, guard, grip, pommel, glow (tên chung để game đổi màu).
B) Giáp — dựng trong toạ độ nhân vật của assets/models/chr_ngoc_adventurer_v04.glb (gốc ở chân, cao 1.56 m, mặt trước +Z), ôm thân từ vai đến hông, chừa cổ và tay, không đè lên phụ kiện/túi, ≤ 900 tam giác, đọc thân Ngọc làm khuôn (xem tools/acc/build_acc.py cách làm):
 gear_vest_leather_v01 (áo da nâu, khoá dây) · gear_armor_iron_v01 (giáp sắt: ngực + 2 miếng vai, viền đồng) · gear_cloak_ranger_v01 (áo choàng kiểm lâm xanh rêu có mũ trùm hạ sau lưng, ghim lá) · gear_armor_bark_v01 (giáp vỏ cây: các mảng vỏ nâu, rêu, lá xanh ở vai).
C) Bùa (gắn hông, nhỏ 0.1 m): gear_charm_clover_v01 (cỏ bốn lá xanh trên sợi dây vàng) · gear_charm_owlfeather_v01 (lông cú nâu kem có chấm, buộc dây).
Kiểm tra: dựng một ảnh xem trước Ngọc mặc từng món (render từ trước và nghiêng).
```

---

## LÔ 15 — Đồ tương tác trong Map 1

```
Lô 15: đồ chơi tương tác, thư mục tools/pickups/, file build_pickups.py.
1. prop_chest_locked_v01 — rương khoá chữ rải ngoài đồng/rừng: thân gỗ nâu có đai sắt, nắp tròn, ổ khoá vàng to ở giữa (lock_gold), cao 0.8 m, rộng 1.1 m; 2 node chest_base + chest_lid (xoay quanh bản lề sau), clip Open (một lần, 0.8 s, ổ khoá rơi/biến mất không cần), vật liệu light_gold bên trong. Giống phong cách isle_chest_v01 nhưng có ổ khoá.
2. prop_star_v01 — ngôi sao vàng nhặt được (12 viên trong làng): sao 5 cánh dày vát cạnh, cao 0.6 m, viền sáng, vật liệu star_gold (phát sáng), đặt trên đế tròn nhỏ phát sáng star_base để game xoay.
3. prop_crystal_v01 — pha lê ký ức (Rừng): cụm 1 tinh thể lớn + 2 nhỏ, cao 1.4 m, vật liệu crystal_tint màu XÁM trung tính (0.8) để game tô 5 màu, crystal_core sáng hơn bên trong, đế đá rune_stone nhỏ.
4. npc_owl_v01 — Cú Mèo ôn bài: cú nâu kem to tròn, cao 1.1 m, mắt vàng rất to, mũ tốt nghiệp nhỏ (cap_navy, tassel_gold), kính tròn (frame_gold); có rig, clip Idle (chớp mắt, xoay đầu nhẹ), Talk (mỏ và cánh động), Hoot (một lần: phồng ngực).
5. prop_board_quest_v01 — bảng nhiệm vụ săn quái: 2 trụ gỗ, tấm gỗ lớn có 3 tờ giấy ghim (paper_cream) và 1 thanh kiếm bắt chéo trang trí, mái nhỏ, cao 2.4 m, rộng 2.2 m; tấm giữa để TRỐNG, game dán chữ.
6. prop_word_jar_v01 — hũ chữ của Ben: hũ thuỷ tinh tròn to có nút gỗ, trong có nhiều mảnh giấy cuộn và đom đóm nhỏ (jar_glass trong suốt, scroll_cream, firefly_glow), cao 0.9 m.
```

---

## LÔ 16 — Thiên nhiên (cây, bụi, đá, núi)

Cây thông hiện là vài hình nón chồng, bụi là cục tròn, núi là chóp xám. Đã có `prop_tree_round`, `prop_tree_pine` (chưa dùng) nhưng chỉ 1 kiểu; cần bộ đa dạng.

```
Lô 16: thiên nhiên, thư mục tools/nature/, file build_nature.py. Mỗi model chân ở y=0, ≤ 900 tam giác (cây to ≤ 1.600). Tán lá và thân đều là vật liệu riêng: trunk, leaf_a, leaf_b (khác sắc để game tô nhẹ theo mùa).
1. nat_pine_a/b/c_v01 — thông 3 kiểu (cao 6, 8, 10 m): tán 4–5 tầng bồng, mỗi tầng rìa răng cưa nhẹ, thân nâu có vài mấu cành; leaf_a xanh thông, leaf_b sáng hơn ở mép.
2. nat_oak_a/b/c_v01 — sồi/cây tán tròn 3 kiểu (cao 5, 6.5, 8 m): tán kết từ 6–9 cụm cầu nhám, thân xoắn nhẹ, có gốc nổi rễ.
3. nat_autumn_v01 (tán vàng cam) và nat_blossom_v01 (tán hồng anh đào, cành mảnh, vài cánh hoa rơi) cao 6 m.
4. nat_bush_a/b/c_v01 — bụi 3 kiểu (0.8–1.2 m): bụi lá tròn, bụi có quả đỏ (berry_red), bụi hoa (flower_pink, flower_yellow).
5. nat_rock_a/b/c_v01 — đá tảng low-poly facet 3 kiểu (1.0, 1.8, 3.0 m), vật liệu rock_grey, rock_light (mặt trên), rock_moss (rêu một bên); nat_rock_cluster_v01 — cụm 5 đá và vài cỏ.
6. nat_log_v01 (khúc gỗ nằm có nấm nhỏ) · nat_stump_v01 (gốc cây có vòng năm) · nat_mushroom_big_v01 (nấm đỏ chấm trắng 1.2 m) · nat_mushroom_group_v01 (cụm nấm nhỏ nhiều màu).
7. nat_mountain_a/b_v01 — núi nền xa (rộng 60 m, cao 28 m): 3–4 đỉnh, mặt facet xám xanh, chóp tuyết trắng (snow), chân núi thoải xuống y=0, ≤ 600 tam giác; chỉ cần đẹp khi nhìn từ xa.
```

---

## LÔ 17 — Đồ trong làng

```
Lô 17: đồ làng, thư mục tools/village/, file build_village.py. Đơn vị mét, chân ở y=0.
1. vil_fence_v01 — một đoạn hàng rào gỗ dài 2.0 m: 2 cột có chóp, 2 thanh ngang hơi lệch, vài đinh; vil_fence_post_v01 (cột góc), vil_fence_gate_v01 (cổng 1.4 m, có then gài).
2. vil_lamp_v01 — cột đèn đường sắt đen cao 3.0 m, đèn lồng kính (lamp_glow vật liệu phát sáng), mũ chóp, tay treo uốn; vil_lantern_hang_v01 — đèn lồng treo nhỏ.
3. vil_sign_post_v01 — cột biển chỉ đường: cột gỗ + 3 tấm biển hình mũi tên (arrow_1..3) quay được, mặt biển trống cho game dán chữ, cao 2.2 m.
4. vil_stall_market_v01 — quầy chợ của Ben: mái vải sọc đỏ-trắng (awning_red, awning_white), bàn gỗ, giỏ táo/cam/bắp cải (fruit_*), bảng giá trống, rộng 3.0 m sâu 1.6 m cao 2.6 m.
5. vil_windmill_v01 — cối xay gió: thân tháp trắng/đá cao 7 m, mái chóp nâu, 4 cánh quạt là node riêng "blades" (game xoay quanh trục z), cửa, cửa sổ sáng (window_glow).
6. vil_scarecrow_v01 (bù nhìn rơm, nón rộng, áo kẻ, cao 2.0 m) · vil_dummy_v01 (người gỗ tập đánh: thân rơm quấn dây, vết chém, đế gỗ) · vil_target_v01 (bia bắn: vòng đỏ trắng trên giá 3 chân).
7. vil_tent_v01 — lều trại vải xanh/kem, cửa mở, cọc dây, rộng 3 m; vil_campfire_logs_v01 — ghế gỗ khúc quanh đống tro (đống lửa đã có prop_campfire).
8. vil_dock_v01 — bến thuyền gỗ dài 6 m rộng 2.4 m: ván lát, 4 cọc, thang xuống nước, thùng và dây thừng cuộn; vil_dock_fishing_v01 — cầu câu cá nhỏ (3 m) với cần câu cắm, xô cá.
9. vil_bunting_v01 — dây cờ tam giác nhiều màu, dài 4 m, võng nhẹ (để game kéo dài/đặt nhiều đoạn).
```

---

## LÔ 18 — Đồ trong Rừng Ký Ức

```
Lô 18: đồ rừng, thư mục tools/forest/, file build_forest.py. Chân ở y=0, mặt trước −Y.
1. for_tree_ancient_v01 — cây cổ thụ Ký Ức: thân rất to (đường kính 3 m, cao 14 m), rễ nổi, một hốc cây có cửa tròn nhỏ phát sáng ấm (window_glow), tán lá rộng vàng xanh, dây đèn và vài đom đóm; node "canopy" riêng để game lắc nhẹ.
2. for_camp_v01 — trại rừng của Willow: 1 lều vải xanh lá, bàn gỗ, giá treo nồi trên lửa, 3 hộp hàng, đèn lồng; for_stall_willow_v01 — quầy hàng nhỏ mái lá xanh, rộng 2.6 m (giống vil_stall_market_v01 nhưng kiểu rừng).
3. for_cave_v01 — cửa hang đá: vòm đá xám rêu cao 4.5 m rộng 6 m, miệng hang đen có tinh thể xanh phát sáng (crystal_glow), rễ cây thả xuống.
4. for_ruins_v01 — tàn tích: vòm cổng đá nửa sập, 4 cột gãy, bậc đá, rune khắc phát sáng (rune_glow), cỏ và dây leo; for_portal_v01 — cổng pha lê đứng giữa tàn tích: hai trụ đá + vòng sáng (portal_ring, vật liệu phát sáng), cao 4 m.
5. for_tower_v01 — tháp canh gỗ cao 8 m: 4 chân chéo, sàn, rào, mái chóp lợp ván, thang; đặt trên nền đá (gỡ khối xám phẳng ở chân hiện tại).
6. for_woodpile_v01 — đống củi xếp + rìu cắm vào gốc; for_bridge_wood_v01 — cầu gỗ cong 6 m có lan can và 2 đèn lồng (như prop_bridge_curved nhưng ván gỗ sẫm kiểu rừng).
7. for_waterfall_v01 — vách đá có thác nước: vách đá facet cao 9 m rộng 12 m, dải nước trắng xanh (water_fall, vật liệu riêng để game cuộn), bể bọt ở chân, rêu và cây nhỏ; for_gate_arch_v01 nếu muốn thay prop_forest_gate_v01 cho khớp phong cách mới.
```

---

## LÔ 19 — Trang phục khác hình, trang sức, thân bạn nam (19/11, cho màn tạo nhân vật và tiệm may cô Mia)

Hiện game đã có tạo nhân vật (8 khuôn mặt, 4 màu da, 6 kiểu tóc, màu áo/quần/váy/đầm) và tiệm may cô Mia bán đồ bằng vàng. Màn tạo nhân vật sẽ có thêm lựa chọn **Bạn nữ / Bạn nam** khi có thân bạn nam. Hạn chế hiện nay: áo phông, quần, váy, đầm **cùng một hình** (chỉ khác màu); trang sức đang vẽ tạm bằng khối; kính bảo hộ + khăn đỏ của Ngọc luôn che mũ/vương miện.

```
Lô 19: sửa tools/chibi05/build_ngoc_v03.py để xuất chr_ngoc_adventurer_v05.glb (giữ v04 nguyên vẹn), cùng xương, cùng clip, cùng vật liệu
ngoc_skin / ngoc_boots / ngoc_gear / NgocFace và 6 tóc Hair_*. Thêm các object quần áo ĐỔI HÌNH, mỗi object skinned theo xương như thân,
dùng đúng vật liệu tô màu xám 0,8 đã có (game nhân màu):
- Áo (ngoc_top_tint), tên object: Top_tshirt (hình hiện tại), Top_hoodie (mũ trùm sau gáy, túi trước), Top_jacket (áo khoác mở, cổ bẻ),
  Top_aodai (áo dài Việt Nam: thân dài tới gối, xẻ hai bên, cổ đứng; tà áo đi theo xương thigh khi chạy).
- Dưới (ngoc_bottom_tint): Bottom_shorts (hình hiện tại), Bottom_trousers (quần dài tới cổ chân), Bottom_skirt (váy xòe ngang gối).
- Đầm (cả hai vật liệu đều là ngoc_top_tint): Dress_sundress (đầm xòe 2 dây), Dress_party (đầm công chúa, chân váy phồng).
- Kính bảo hộ + khăn đỏ trên đầu: tách thành object riêng Gear_goggles (game ẩn khi đội mũ hoặc vương miện).
- Các object mới (trừ Top_tshirt, Bottom_shorts, Gear_goggles) có extras eq_hidden: 1 như 5 kiểu tóc. Quần áo không được xuyên thân
  trong các clip Run/Jump/Attack (kiểm bằng ảnh 4 tư thế). Mỗi món ≤ 1.500 tam giác.

Trang sức: thêm vào tools/acc/build_acc.py, đặt sẵn đúng chỗ trên Ngọc v05 như các acc_* cũ:
- acc_necklace_v01 (dây mảnh + mặt đá giọt nước, xương chest/neck), acc_earrings_v01 (2 object earring_L / earring_R, xương head),
  acc_tiara_v01 (vương miện nhỏ 5 mũi, xương head), acc_hairclip_v01 (kẹp hoa 5 cánh bên trái đầu, xương head).
- Vật liệu: tint_main = phần kim loại (game tô vàng kim/bạc), tint_trim = đá quý (game tô hồng/xanh/tím…). Mỗi món ≤ 600 tam giác.

(BẮT BUỘC, anh duyệt 19/11: game sẽ đưa lên mạng cho cả bạn nam chơi) chr_ban_nam_v01.glb: cùng xương và tên vật liệu với Ngọc v05 (ban_nam_hair_tint/top_tint/bottom_tint,
ngoc_skin, NgocFace để game thay mặt), dáng vai rộng hơn chút, 4 kiểu tóc nam Hair_short, Hair_spiky, Hair_side, Hair_buzz.

Xuất xong: render bảng ảnh xem trước tools/chibi05/preview_v05.py (mỗi kiểu áo/quần/đầm một ô, màu mẫu), commit từng file, đẩy nhánh blender-assets.
```

---

## LÔ 20 — Vũ khí, giáp, bùa theo 4 hệ (20/11, cho hệ thống kỹ năng `docs/KY_NANG.md`)

Thay cho phần kiếm/giáp/bùa của lô 14 (lô 14 vẫn làm các món thường: kiếm gỗ, kiếm sắt, kiếm pha lê, áo da, giáp sắt, cỏ bốn lá, kiếm lõi sồi, kiếm ánh trăng, áo choàng kiểm lâm, giáp vỏ cây, lông cú). Màu hệ: Lửa `#ff6a2a`, Băng `#6fd0ff`, Gió `#6fe08a`, Sét `#ffd23c`.

```
Lô 20: viết tools/gear/build_gear.py (chạy nền như các lô trước), xuất 28 file vào assets/models/:

A. VŨ KHÍ CẦM TAY (16 file) — quy ước riêng cho vũ khí:
- Gốc toạ độ = ĐIỂM TAY NẮM (giữa chuôi), lưỡi/thân hướng lên +Z trong Blender (game xoay vào xương hand.R).
- Kiếm cấp 1 (Map 1, dài 0,85 m, lưỡi 0,6 m): weapon_sword_ember_v01 (lưỡi đỏ cam, vân lửa, chuôi đen),
  weapon_sword_frost_v01 (lưỡi băng xanh trong, tinh thể ở chuôi), weapon_sword_gale_v01 (lưỡi cong như lá, xanh lá, dải lụa
  bay ở chuôi), weapon_sword_spark_v01 (lưỡi răng cưa hình tia sét, vàng, chuôi tím).
- Kiếm cấp 2 (Map 2, dài 1,0 m, to và lộng lẫy hơn, có viên ngọc ở chắn tay): weapon_sword_blaze_v01, weapon_sword_glacier_v01,
  weapon_sword_tempest_v01, weapon_sword_storm_v01.
- Gậy phép cấp 1 (dài 1,15 m: 0,25 m dưới tay, 0,9 m trên tay; gỗ + quả cầu hệ trên đỉnh có 3 móc kim loại giữ):
  weapon_staff_ember_v01, weapon_staff_frost_v01, weapon_staff_gale_v01, weapon_staff_spark_v01.
- Trượng cấp 2 (dài 1,35 m, đầu trượng hình biểu tượng hệ: ngọn lửa / bông tuyết / xoáy gió / tia sét, có vòng bay quanh):
  weapon_staff_inferno_v01, weapon_staff_glacier_v01, weapon_staff_tempest_v01, weapon_staff_storm_v01.
- Vật liệu đặt tên: metal, grip, wood, gem, glow (phần phát sáng của hệ, màu hệ, emissive 1,5–2; game làm nhấp nháy theo tên).
- ≤ 900 tam giác mỗi món. Không rig.

B. GIÁP HỆ (4 file, Map 2) — đặt sẵn đúng chỗ trên Ngọc v04 (như acc_*), skin vào xương chest/spine/upper_arm.*:
- armor_flame_mail_v01 (giáp vảy đỏ cam, vai hình ngọn lửa), armor_frost_mail_v01 (giáp băng xanh trắng, vai tinh thể),
  armor_wind_cloak_v01 (áo choàng xanh lá nhẹ, vạt áo có 2 xương cape_1, cape_2 để game đung đưa),
  armor_storm_plate_v01 (giáp tấm tím đậm, đường sét vàng).
- Vật liệu: armor_main, armor_trim, glow. ≤ 1.500 tam giác. Không được xuyên thân trong Run/Attack (ảnh 4 tư thế).

C. BÙA HỆ (4 file, Map 1) — mặt dây chuyền đeo trước ngực, đặt sẵn trên Ngọc v04, xương chest:
- acc_amulet_fire_v01 (ngọn lửa trong khung vàng), acc_amulet_ice_v01 (bông tuyết), acc_amulet_wind_v01 (xoáy gió),
  acc_amulet_thunder_v01 (tia sét). Vật liệu: metal, gem, glow. ≤ 400 tam giác.

D. ẢNH CỬA HÀNG (4 + 4 + 4 + 16 = 28 ảnh nhỏ): render mỗi món 128×128 PNG nền trong suốt, góc 3/4, viền tối nhẹ, vào
   assets/ui/item_<tên file không có _v01>.png (ví dụ assets/ui/item_weapon_sword_ember.png).

Xuất xong: in bbox/tam giác/vật liệu; render tools/gear/preview_gear.py (bảng ảnh tất cả món, Ngọc cầm kiếm + gậy, mặc 4 giáp);
commit từng file, đẩy nhánh blender-assets.
```

---

## LÔ 21 — Hiệu ứng phép và biểu tượng kỹ năng (20/11)

Hiện các phép được vẽ tạm bằng khối màu. Lô này làm hình đẹp cho từng phép. Game tự di chuyển, phóng to, làm mờ dần các model này.

```
Lô 21: viết tools/fx/build_fx.py, xuất vào assets/models/ (glTF, gốc ở tâm hiệu ứng, +Y glTF = lên trên, hướng bay = +Z glTF):
- fx_fireball_v01: quả cầu lửa 0,5 m, lõi vàng trắng + 6 lưỡi lửa cam đỏ phía sau (đuôi theo −Z). Clip "Spin" lặp 0,6 s.
- fx_ice_spear_v01: giáo băng dài 1,4 m, tinh thể xanh trong suốt có cạnh, mũi nhọn về +Z, vài mảnh băng nhỏ bay quanh.
- fx_wind_blade_v01: lưỡi gió hình trăng khuyết 1,6 m nằm ngang, xanh lá trắng, 3 vệt gió mỏng phía sau.
- fx_meteor_v01: tảng đá nóng chảy 0,9 m (đá nâu đen + vết nứt phát sáng cam), đuôi lửa dài 2,5 m theo +Y (rơi xuống).
- fx_tornado_v01: phễu lốc xoáy cao 4,5 m (rộng 3,4 m ở trên, 0,6 m ở dưới), 3 lớp xoắn ốc mờ dần, lá cây và đá nhỏ bay quanh;
  clip "Spin" lặp 0,8 s (xoay quanh Y).
- fx_blizzard_ring_v01: vòng tròn băng tuyết bán kính 6 m dưới đất (băng mỏng + gờ tinh thể quanh mép) + 12 bông tuyết 6 cánh
  object riêng snowflake_1..12 (game cho rơi).
- fx_thunder_strike_v01: cột sét từ trời cao 12 m (đường gấp khúc, 2 nhánh phụ) + vòng nứt đất bán kính 1,5 m dưới chân.
- fx_slash_arc_v01: vệt chém vòng cung 160°, bán kính 2,2 m, dày ở giữa mỏng ở hai đầu (game tô màu theo hệ: vật liệu tint_main).
- fx_whirlwind_ring_v01: vòng gió xoay quanh người bán kính 3,2 m, 3 vệt cong (vật liệu tint_main).
- fx_hit_spark_v01: chùm tia nhỏ 0,6 m khi đánh trúng (8 tia nhọn, vật liệu tint_main).
- Vật liệu: fx_core (sáng nhất), fx_glow (màu hệ), fx_soft (mờ, alpha 0,4–0,6, blend alpha), tint_main (xám 0,8 để game tô).
  Emissive mạnh (2–4) để hậu kỳ bloom làm phát sáng. Mỗi model ≤ 1.200 tam giác.

Biểu tượng kỹ năng: render 24 ảnh 128×128 PNG nền trong suốt vào assets/ui/skill_<id>.png cho đúng các id:
fire_core fire_guard fire_flow flame_slash fireball meteor ice_core ice_guard ice_flow frost_strike ice_spear blizzard
wind_core wind_guard wind_flow whirlwind wind_blade tornado thunder_core thunder_guard thunder_flow thunder_fist lightning thunderstorm
(nội năng: biểu tượng tròn kiểu huy hiệu — trái tim lửa, khiên, giọt máu…; ngoại năng: chính hiệu ứng phép trên nền tròn màu hệ).

Xuất xong: render tools/fx/preview_fx.py (bảng ảnh mọi hiệu ứng + bảng 24 biểu tượng); commit từng file, đẩy nhánh blender-assets.
```

---

## LÔ 22 — Quái theo 4 hệ cho Map 1–3 (20/11)

Đã có trong game (lượt 32): **Frost Goblin** ❄️ (Đồng Hoang), **Ember Imp** 🔥 (cánh đồng golem), **Gale Orc** 🌪️ (Rừng Ký Ức), lấy từ bộ
**Ultimate Monsters của Quaternius (CC0, dùng tự do)** qua bản sao trên GitHub; script chuẩn hoá `tools/monsters/import_quaternius.py`.
Máy chủ của em chỉ vào được GitHub, nên phần còn lại anh làm trên máy anh theo **một trong hai cách** (cách A nhanh, nên làm trước).

Mục tiêu: mỗi vùng có đủ 4 hệ để bé dùng tương khắc: Đồng Hoang (thiếu Sét nhỏ), Rừng Ký Ức (thiếu Lửa, Sét), Cảng (thiếu Gió), Map 3 Sa mạc Gió Vàng (chưa có quái).

### Cách A — tải thêm quái CC0 của Quaternius (nhanh, hoạt ảnh sẵn)
```
Lô 22A: trên máy có Blender, tải bộ "Ultimate Monsters" (glTF) của Quaternius từ https://quaternius.com (giấy phép CC0).
Chạy cho từng nhóm (tên file trong bộ có thể khác chút, mở thư mục glTF để xem tên đúng):
  PACK="Bunny.gltf=mob_bunny_ice_v01,Ghost.gltf=mob_ghost_thunder_v01,Frog.gltf=mob_frog_wind_v01,Dino.gltf=mob_dino_fire_v01,Birb.gltf=mob_bird_wind_v01,Squidle.gltf=mob_squid_ice_v01,Cactoro.gltf=mob_cactus_thunder_v01,Yeti.gltf=mob_yeti_ice_v01,Hywirl.gltf=mob_whirl_wind_v01,Dragon.gltf=boss_dragon_fire_v01" \
  blender -b -P tools/monsters/import_quaternius.py -- <thư mục glTF của bộ> assets/models
Kiểm: mỗi file ~0,8 MB, cao 1 m, có clip Idle/Walk/Weapon hoặc Punch/HitReact/Death. Thêm một dòng vào assets/models/CREDITS.md
(bảng "Quái CC0 của Quaternius"). Commit từng file, đẩy nhánh blender-assets, báo em "đã đẩy lô 22A".
Nếu bộ không có con nào trong danh sách thì chọn con khác cùng màu/hệ, đặt tên mob_<tên>_<hệ>_v01.
```

Em sẽ đặt như sau (tên tiếng Anh trong game, cấp, nơi ở):

| File | Tên trong game | Hệ | Nơi | Cấp |
|---|---|---|---|---|
| mob_bunny_ice | Snow Bunny | ❄️ | Đồng Hoang (gần làng, quái dễ nhất) | 2 |
| mob_ghost_thunder | Spark Ghost | ⚡ | Rừng Ký Ức, quanh tàn tích | 12 |
| mob_dino_fire | Ember Dino | 🔥 | Rừng Ký Ức, quanh khu trại | 13 |
| mob_frog_wind | Gale Frog | 🌪️ | Rừng Ký Ức, quanh thác | 11 |
| mob_bird_wind | Storm Gull | 🌪️ | Cảng, bờ Bắc | 23 |
| mob_squid_ice | Ice Squid | ❄️ | Cảng, cầu tàu nhỏ | 25 |
| mob_cactus_thunder, mob_whirl_wind, mob_yeti_ice | Cactus Brute, Dust Whirl, Night Yeti | ⚡ 🌪️ ❄️ | Map 3 Sa mạc Gió Vàng | 31–38 |
| boss_dragon_fire | Sand Dragon (kẻ gác mảnh La Bàn số 3) | 🔥 | Map 3 | 40 |

### Cách B — vẽ quái mới bằng Blender (đẹp theo phong cách riêng, lâu hơn)
```
Lô 22B: viết tools/mobs3/build_mobs3.py theo quy ước chung (rig xương cứng, clip Idle 2 s, Walk 1 s, Attack 0.6 s, Hit 0.3 s,
THÊM clip "Cast" 0.8 s: quái giơ tay/há miệng phun phép — game sẽ cho quái dùng phép theo hệ; THÊM clip "Death" 0.9 s: ngã xuống),
gốc ở chân, mặt trước −Y Blender. Màu hệ: Lửa #ff6a2a, Băng #6fd0ff, Gió #6fe08a, Sét #ffd23c. Mỗi con ≤ 3.000 tam giác.
Vật liệu đặt tên: body_main, body_dark, eye_white, eye_dark, glow (phần phát sáng màu hệ, emissive 2) để game nháy sáng và đổi màu.
Biểu cảm dễ thương, dữ vừa phải (cho học sinh cấp 2), dáng chibi đầu to.

Rừng Ký Ức (Map 1, cấp 11–15):
- mob_wisp_thunder_v01: đom đóm sét 0,6 m bay (thân tròn vàng, đuôi tia sét, 4 cánh mỏng trong), hover sẵn cao 0,8 m.
- mob_fox_ember_v01: cáo lửa 0,9 m, đuôi là ngọn lửa (vật liệu glow), mắt xếch tinh nghịch.
Cảng (Map 2, cấp 22–26):
- mob_gull_storm_v01: hải âu bão 1,0 m, cánh xám có vệt xanh lá, mây nhỏ trên đầu; bay, hover cao 1,2 m.
- mob_seal_frost_v01: hải cẩu băng 1,1 m, mũ băng nhọn, ria tinh thể.
Sa mạc Gió Vàng (Map 3, cấp 31–40):
- mob_scorpion_sand_v01 (🔥 bọ cạp cát 1,2 m, đuôi lửa), mob_djinn_dust_v01 (🌪️ thần gió cát 1,6 m, phần dưới là lốc xoáy, bay),
  mob_cactus_spark_v01 (⚡ xương rồng biết đi 1,5 m, gai phát sáng), mob_fox_moon_v01 (❄️ cáo trăng sa mạc 1,0 m, đêm, tai to).
- boss_sand_dragon_v01: rồng cát 4 m (🔥), kẻ gác mảnh La Bàn số 3; thêm clip "Roar" 1,5 s; 3 vị trí khiên chữ quanh ngực.

Boss cũ thêm clip (sửa tools/mobs1/build_mobs1.py và tools/harbor, KHÔNG đổi tên file, nâng lên _v02):
- boss_slime_king (❄️ phun hơi băng), boss_mushroom_queen (🌪️ thổi bào tử), boss_golem_ancient (⚡ đập đất ra sét),
  harbor_boss_octopus (🔥 phun mực lửa): mỗi con thêm "Cast" 1,0 s và "Death" 1,2 s; thêm một xương "fx" ở chỗ phép bay ra (miệng/tay).

Xuất xong: render tools/mobs3/preview_mobs3.py (bảng ảnh mọi quái, mỗi con 3 tư thế Idle/Attack/Cast); commit từng file, đẩy blender-assets.
```

---

## LÔ 23 — Phản diện, La Bàn Ngôn Từ, NPC cốt truyện (20/11, cho `docs/COT_TRUYEN.md`)

Cốt truyện xương sống đã chạy trong game nhưng **Chúa tể Im Lặng (Lord Hush)** mới chỉ có lời thoại, **La Bàn** và **cửa nhà thần kỳ** đang vẽ tạm bằng khối, cô **Mia** dùng tạm bản sao của Rose. Lô này vẽ thật cho các thứ đó.

```
Lô 23: viết tools/story/build_story.py theo quy ước chung, xuất vào assets/models/:
1) npc_hush_lord_v01.glb — Chúa tể Im Lặng, cao 2,2 m, dáng chibi cao gầy (đầu to), áo choàng đen tím dài chấm đất rách tua, mũ trùm sâu,
   trong mũ chỉ có hai mắt tím phát sáng và một đường khâu kéo khoá miệng (ý nghĩa: ghét tiếng nói). Cầm một cuộn giấy rách bay lơ lửng.
   Vật liệu: hush_cloak (đen tím #2a1f3d), hush_trim (tím #7a4bd1), eye_glow (tím sáng, emissive 3), zip_silver, paper_cream.
   Rig xương cứng; clip: Idle (lặp 3 s, áo choàng đung đưa), Talk (lặp 1 s, tay nhấn nhá), Cast (0,9 s, giơ tay, gió đen xoáy), Laugh (lặp 1,2 s, vai rung, KHÔNG có tiếng),
   Vanish (1,2 s, thu nhỏ vào xoáy khói). ≤ 3.500 tam giác. Dữ vừa phải, hơi buồn cười, KHÔNG đáng sợ (game cho học sinh cấp 2).
2) mob_hush_wraith_v01.glb — tay sai của Lord Hush, "Bóng Im Lặng": cao 1,2 m, thân là làn khói đen tím hình giọt nước nhọn đuôi,
   2 mắt tròn sáng, miệng bị khoá kéo, hai tay mảnh. Bay, hover cao 0,6 m. Vật liệu: smoke_dark, smoke_light (alpha 0,7), eye_glow, zip_silver.
   Clip Idle, Walk, Attack, Hit, Cast, Death (tan thành khói 0,9 s). ≤ 1.800 tam giác.
3) prop_compass_whole_v01.glb — La Bàn Ngôn Từ nguyên vẹn, đường kính 0,9 m, nằm nghiêng 20° trên đế nhỏ: viền vàng đồng chạm 10 vạch chữ,
   mặt kính xanh biển, kim chỉ hai đầu đỏ/trắng phát sáng. Clip Spin (kim quay chậm, lặp 4 s). Vật liệu: gold, glass_blue, needle_red, needle_white, rune_glow.
4) prop_compass_piece_01_v01 … prop_compass_piece_10_v01 — 10 mảnh vỡ của La Bàn (mỗi mảnh một hình cánh quạt khác nhau, rộng 0,35 m, cao 0,05 m, mép vỡ lởm chởm,
   cùng viền vàng + mặt kính). Mỗi mảnh MỘT MÀU nhận diện vùng đất, vật liệu piece_main:
   01 xanh lá (Làng/Rừng), 02 xanh biển (Cảng), 03 vàng cát (Sa mạc), 04 trắng băng, 05 đỏ lửa, 06 tím mây, 07 hồng hoa, 08 xanh ngọc, 09 cam hoàng hôn, 10 vàng kim sao.
   Clip Float (lặp 2 s, lơ lửng lên xuống 6 cm và xoay chậm). Mảnh ghép lại với nhau thành vòng tròn đúng (khớp mép vỡ).
5) prop_compass_pedestal_v01.glb — bệ đặt La Bàn trong nhà: đế đá hình trụ 8 cạnh cao 0,9 m, mặt bệ là vòng tròn có 10 ô hình cánh quạt lõm (đúng khớp 10 mảnh),
   chạm khắc nhẹ, ở giữa có trụ nhỏ đặt kim. Mỗi ô là object riêng slot_01 … slot_10 (game bật phát sáng mảnh nào đã lấy được).
6) prop_magic_door_v01.glb — cửa nhà thần kỳ đứng giữa đất trống (nhà theo bé tới mọi map): khung cửa gỗ tròn vòm cao 2,2 m rộng 1,3 m, KHÔNG có tường,
   bên trong là mặt cửa phát sáng xanh tím (vật liệu door_glow, emissive 2,5, alpha 0,8), tay nắm vàng, hai bên có dây leo, hoa nhỏ và 2 ngôi sao lơ lửng.
   Clip Open (0,8 s, cửa sáng loé và hai cánh mở), Idle (lặp 3 s, sao lơ lửng). Vật liệu door_wood tint_main xám 0,8 (game tô theo màu nhà của bé).
7) npc_mia_tailor_v01.glb — cô Mia thợ may, cùng chuẩn và xương với npc_rose_baker_v02, người khác hẳn Rose: dáng cao mảnh, tóc nâu đỏ búi cao có kim cài,
   kính tròn gọng vàng, thước dây quanh cổ, tạp dề kẻ ô tím, tay cầm kéo. Clip Idle, Talk, Wave. Vật liệu có tint như Rose (hair_tint, top_tint, bottom_tint).

Biểu tượng (assets/ui/, PNG 128×128 nền trong suốt): rank_01 … rank_11 (11 hạng Người Giữ Chữ: Tập sự, Thám hiểm, Kiểm lâm, … Đại sư Ngôn Từ,
huy hiệu tròn viền kim loại tăng dần: đồng → bạc → vàng → bạch kim → pha lê, giữa là biểu tượng: lá, la bàn, sách, ngọn đuốc, mũ, áo choàng, kiếm, khiên, vương miện, ngôi sao, quyển sách vàng),
compass_piece_01 … compass_piece_10 (hình ảnh 10 mảnh theo màu trên), badge_word_keeper (huy hiệu Người Giữ Chữ ông Tom trao, lá + chữ A).

Xuất xong: render tools/story/preview_story.py (mỗi model một ô 3/4, Lord Hush 3 tư thế, 10 mảnh ghép thành vòng), commit từng file, đẩy blender-assets.
```

---

## LÔ 24 — Map 3: Sa mạc Gió Vàng (20/11, vùng đất thứ ba, hạng Kiểm lâm, Unit 3)

Map 3 chưa có gì ngoài tên (quái ở lô 22). Lô này là toàn bộ đồ dựng cho vùng: nhà, đồ trang trí, cây, đồ tương tác, 4 NPC. Tông màu **vàng cát ấm, đất nung, lam ngọc (turquoise) làm điểm nhấn**; ban đêm có đèn lồng. Chủ đề: làng ốc đảo, chợ lều, đền cổ đang bị cát vùi, gió vàng thổi bay chữ trên các tấm bia.

```
Lô 24: viết tools/map3/build_map3.py theo quy ước chung (màu phẳng, vật liệu có tên, gốc ở chân, mặt trước −Y Blender), xuất vào assets/models/ (tiền tố map3_):
NHÀ (mỗi nhà có cửa hướng +Z glTF, cửa sổ có vật liệu window_glow để game bật sáng ban đêm, mái có vật liệu roof_tint xám 0,8 để game đổi màu):
- map3_house_sand_a_v01 (nhà đất nung mái bằng 6×5×3,4 m, cầu thang ngoài lên mái, vải che nắng), map3_house_sand_b_v01 (nhà tròn mái vòm 5,5 m),
  map3_house_tower_v01 (tháp gió cao 8 m, cửa sổ đón gió, cờ vải), map3_tent_bazaar_v01 (lều chợ 4×3 m, quầy hàng, thảm, đèn lồng; 3 màu vải tint),
  map3_inn_oasis_v01 (quán trọ 8×6×4 m, mái vải, giếng nhỏ bên hông, bảng treo trống để game dán chữ),
  map3_temple_gate_v01 (cổng đền cổ 6 m cao 7 m, hai cột chạm chữ, nửa dưới vùi cát, lối vào vùng boss),
  map3_house_home_v01 (nhà của bé phiên bản sa mạc, cùng cỡ bld_house_blue_v01, tô màu được).
ĐỒ NGOÀI TRỜI:
- map3_well_v01 (giếng đá có ròng rọc, xô, vòi nước phát sáng xanh), map3_oasis_pool_v01 (hồ ốc đảo bầu dục 7×5 m, mép đá, nước lam ngọc alpha 0,8, 3 cây sậy),
  map3_palm_date_v01 (cọ chà là 5,5 m, chùm quả; 2 biến thể _a/_b), map3_cactus_a_v01 / map3_cactus_b_v01 / map3_cactus_flower_v01 (xương rồng 1,2–2,5 m, hoa hồng),
  map3_dune_rock_a/b/c_v01 (đá sa thạch xếp tầng 1–3 m), map3_dry_bush_v01, map3_skeleton_v01 (xương thú cát 2 m, dễ thương không rùng rợn),
  map3_obelisk_v01 (bia đá 3 m có mặt phẳng khắc chữ trống, vật liệu rune_glow; game dán từ vựng lên mặt bia — Gió Vàng thổi bay chữ),
  map3_ruin_pillar_v01 (cột đổ gãy 2,5 m), map3_ruin_arch_v01 (vòm đá nửa vùi 4 m), map3_sandstorm_post_v01 (cột cờ báo bão, cờ vàng, clip Wave lặp 2 s),
  map3_lantern_pole_v01 (cột đèn lồng 3 m, đèn tròn đỏ cam, window_glow), map3_carpet_v01 (thảm bày hàng 2×1,4 m, tint), map3_crate_sack_v01 (rương gỗ + bao tải),
  map3_chest_v01 (rương kho báu sa mạc, nắp cong, clip Open giống isle_chest_v01), map3_signpost_v01 (biển chỉ đường 3 hướng, mặt biển trống).
PHƯƠNG TIỆN VÀ THÚ:
- map3_camel_v01 (lạc đà chibi 1,8 m có yên đỏ, clip Idle, Walk, Sit, Spit lặp 1 s; tint yên), pet_fennec_v01 (cáo tai to 0,4 m làm thú cưng, đủ clip như pet_otter_v01: idle, walk, sit, jump, spin, roll, dance, wave),
  map3_sand_skiff_v01 (thuyền buồm trượt cát 3 m thay cho thuyền, buồm tam giác).
NPC (cùng chuẩn xương và clip như npc_anna_bard_v02: Idle, Talk, Wave; vật liệu hair_tint/top_tint/bottom_tint):
- npc_desert_elder_v01 (bà trưởng làng Amira, khăn lam ngọc, gậy cọ, 1,3 m), npc_desert_merchant_v01 (chú thương nhân Karim, ria cong, áo choàng sọc, túi hàng, 1,35 m),
  npc_desert_guide_v01 (bạn dẫn đường Layla, mũ rộng vành, kính cát, bản đồ cuộn, 1,2 m), npc_desert_smith_v01 (thợ rèn Idris, tạp dề da, búa, râu xù, 1,4 m).

Biểu tượng: assets/ui/map_3.png (ảnh vùng đất 256×160 trong thẻ Hành trình), ảnh cảnh mẫu preview tổng hợp đặt đủ đồ trong một khung hình 16:9 để em tham khảo bố cục.
Xuất xong: render tools/map3/preview_map3.py (bảng từng nhóm + 1 ảnh phối cảnh làng ốc đảo), commit từng file, đẩy blender-assets.
```

---

## LÔ 25 — Sự kiện, mùa lễ và chơi chung (20/11, cho phần mini game đôi và sự kiện cuối tuần)

Dựa trên mục 7 của `docs/COT_TRUYEN.md`: Đấu chữ nhanh, Bếp đôi, Kho báu đôi, Boss sự kiện, Thời trang đôi; sự kiện cuối tuần và theo mùa (Trung thu, Tết, Halloween, Giáng sinh).

```
Lô 25: viết tools/events/build_events.py theo quy ước chung, xuất vào assets/models/ (tiền tố ev_):
CHƠI CHUNG:
- ev_arena_v01 (sàn Đấu chữ nhanh: bục tròn bán kính 4 m chia đôi 2 màu xanh/hồng, hai bục câu hỏi có bảng chữ trống, 4 cột đèn góc, viền chữ A–Z),
- ev_kitchen_double_v01 (bếp đôi: 2 quầy đối diện 4×1 m, quầy trái có bảng phiếu gọi món trống, quầy phải có 8 ô nguyên liệu, chuông gọi món; object riêng slot_1…slot_8),
- ev_dig_spot_v01 (điểm đào kho báu: đống đất nhỏ 0,8 m có cắm xẻng, dấu X đỏ, clip Dig 1 s), ev_treasure_map_v01 (bản đồ cuộn trải ra 0,9×0,6 m, mặt trống để game vẽ hướng đi),
- ev_mannequin_pair_v01 (hai ma-nơ-canh bên nhau cho Thời trang đôi, mỗi con tint được, bục có số 1, 2), ev_scoreboard_v01 (bảng điểm đôi 2×1 m, hai nửa trái/phải, mặt trống),
- ev_portal_coop_v01 (cổng "Phòng chơi chung" vòm tròn 3 m, mặt cổng phát sáng, hai cột có biểu tượng hai người; clip Idle xoáy sáng lặp 3 s),
- ev_boss_giant_v01 (BOSS SỰ KIỆN cao 6 m: Chữ Khổng Lồ "Letter Colossus", thân là các khối chữ cái xếp chồng nối bằng khớp phát sáng, mắt là hai chữ O; rig cứng,
  clip Idle, Walk, Attack, Hit, Cast, Death, Roar; 4 vị trí khiên chữ ở ngực, vai trái, vai phải, lưng, vật liệu shield_slot_1…4; ≤ 5.000 tam giác).
MÙA LỄ (mỗi bộ là các model nhỏ để game trang trí quảng trường, vật liệu tint_main tô được):
- Trung thu: ev_lantern_star_v01 (đèn lồng ngôi sao 0,6 m, phát sáng), ev_lantern_fish_v01 (đèn cá chép), ev_mooncake_stall_v01 (quầy bánh trung thu), ev_lion_dance_v01 (múa lân chibi 1,6 m, clip Dance lặp 1,2 s),
- Tết: ev_peach_blossom_v01 (cành đào 1,8 m), ev_apricot_blossom_v01 (cây mai vàng 2 m), ev_red_envelope_v01 (bao lì xì 0,2 m xoay), ev_banh_chung_v01 (bánh chưng gói lá dong 0,3 m), ev_firecracker_light_v01 (dây pháo đèn LED, không nổ thật),
- Halloween: ev_pumpkin_lantern_v01 (bí ngô đèn 0,6 m mặt cười dễ thương), ev_ghost_friendly_v01 (ma trắng dễ thương 0,9 m bay, clip Idle, Wave), ev_candy_bucket_v01 (xô kẹo),
- Giáng sinh: ev_tree_xmas_v01 (cây thông 3 m, đèn dây, quà dưới gốc), ev_snowman_v01 (người tuyết 1,3 m, clip Wave), ev_gift_box_v01 (hộp quà 0,4 m, tint dây ruy băng).
ĐỒ MẶC SỰ KIỆN (tiếp theo lô 19, cùng xương và vật liệu tint với chr_ngoc_adventurer_v05, đặt object eq_hidden: 1 như các kiểu áo khác):
- Top_aodai_tet (áo dài Tết có hoa văn dập nổi), Dress_halloween_witch (đầm phù thủy + mũ nhọn là object riêng Hat_witch), Top_xmas_sweater (áo len Giáng sinh), Hat_santa, Hat_antlers (sừng tuần lộc), Acc_lantern_hand (đèn lồng cầm tay, xương hand_R), Acc_mask_cat (mặt nạ mèo gắn tóc).

Biểu tượng (assets/ui/, PNG 128×128 nền trong suốt): ev_season_trungthu, ev_season_tet, ev_season_halloween, ev_season_xmas, ev_weekend_boss,
emote_1 … emote_8 (8 emoji gặp nhau trong làng: vẫy tay, cười, ngạc nhiên, cảm ơn, giỏi lắm, giúp tôi, đi thôi, chờ tôi; kiểu sticker tròn viền trắng).

Xuất xong: render tools/events/preview_events.py (bảng từng bộ mùa + bảng chơi chung + boss khổng lồ 3 tư thế), commit từng file, đẩy blender-assets.
```
