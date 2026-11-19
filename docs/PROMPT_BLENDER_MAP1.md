# Lệnh cho Blender MCP: làm đẹp lại Map 1 (rà soát 19/11)

Cách dùng: dán **QUY ƯỚC CHUNG** một lần ở đầu phiên Claude Code trên máy anh (có Blender MCP), rồi dán từng **Lô**. Mỗi lô xong thì để Claude Code commit và đẩy lên nhánh `blender-assets`; báo em "đã đẩy lô N" là em nối vào game.

Thứ tự ưu tiên (đẹp lên rõ nhất cho các bé): **Lô 13 quái** → Lô 14 vũ khí/giáp → Lô 15 đồ tương tác → Lô 16 thiên nhiên → Lô 17 đồ làng → Lô 18 đồ rừng.
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
