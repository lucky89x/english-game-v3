# Mô hình cần anh tạo bằng Tripo3D (cập nhật 26/11, lượt 63)

Chỉ những thứ Blender vẽ bằng script không đẹp được (vật hữu cơ, công trình mốc, nhân vật). Phụ kiện, quần áo, đồ đạc, cây cỏ, nhà thường: em tự dựng bằng Blender, anh không cần làm.

## Cách xuất để đỡ tốn công xử lý
- Định dạng **GLB**, một file một mô hình, không kèm bệ đá hay nền.
- Nhân vật: tư thế **chữ T**, tay tách khỏi thân, có rig nếu Tripo cho chọn.
- Nếu có ô chọn số mặt: 30–50 nghìn là đủ (em giảm tiếp còn 6–12 nghìn).
- Đẩy lên nhánh `work-<ngày-giờ>` như mọi lần rồi báo tên nhánh. File thô không commit vào nhánh game.
- Thêm vào cuối mỗi câu lệnh: `original design, not based on any existing game or film character`.

## Danh sách theo thứ tự ưu tiên

| # | Tên file gợi ý | Dùng ở đâu | Câu lệnh gợi ý |
|---|---|---|---|
| 1 | `kit_boy.glb` | Kit: bạn đối thủ 13 tuổi trong truyện, kiêm nhân vật nam cho người chơi | `full body chibi boy adventurer, age 13, big head, messy short hair, tool belt with small wrench, simple tunic, shorts and boots, T-pose, arms away from body, soft hand-painted look, no baked highlights, white background` |
| 2 | `lighthouse_isle.glb` | Mốc của map Biển (thay hải đăng dựng bằng code) | `stylized chibi fantasy lighthouse on a small rocky islet, red and white striped tower, tiny keeper cottage, wooden stairs, hand-painted soft colors, chunky rounded shapes, game asset, no base, no text` |
| 3 | `ancient_tree.glb` | Cây Cổ Thụ của Rừng | `giant ancient oak tree with thick twisted roots, round puffy leaf clusters, hanging paper lanterns, stylized chibi fantasy, hand-painted texture, chunky low-poly look, no base` |
| 4 | `east_watchtower.glb` | Mốc bờ Đông của Làng (ngã ba ra các bãi quái) | `small stylized stone watchtower with wooden roof and a flag, mossy stones, chibi fantasy village style, hand-painted, chunky shapes, no base` |
| 5 | `desert_temple.glb` | Mốc của Map 4 Sa mạc | `stylized chibi desert temple gate with sandstone pillars and blue tile dome, hand-painted warm colors, chunky rounded shapes, toy-like, game asset, no base` |
| 6 | `desert_boss_sphinx.glb` (tuỳ chọn) | Trùm phụ Map 4 (trùm chính đã có rồng cát) | `cute stylized stone sphinx guardian with cracked sandstone body and glowing blue eyes, chibi proportions, hand-painted, sitting pose, no base` |

**Map 4–7 đã dựng xong (26/11) bằng mô hình có sẵn**, không chờ Tripo. Các mục dưới đây chỉ để đẹp hơn; có file nào em thay vào mốc tương ứng.

| # | Tên file gợi ý | Thay cho | Câu lệnh gợi ý |
|---|---|---|---|
| 7 | `ice_dragon_rigged.glb` | Trùm Núi tuyết (đang là mô hình đứng im) | nếu Tripo cho xuất có xương và hoạt ảnh thì xuất kèm; không thì em gắn xương |
| 8 | `mountain_lodge.glb` | Nhà nghỉ Núi tuyết (đang mượn nhà trọ của làng) | `cozy stylized chibi mountain lodge, log walls, thick snow on the roof, warm windows, stone chimney, hand-painted, chunky shapes, no base` |
| 9 | `cloud_palace.glb` | Cung điện Mây ở Trời (đang mượn tháp sa mạc) | `cute stylized cloud palace with white towers, golden domes and blue flags, standing on a puffy cloud, hand-painted, chibi toy style, no base` |
| 10 | `ruins_statue.glb` | Tượng ở sân cột Di tích | `ancient stone statue of a kind owl scholar holding an open book, mossy and cracked, stylized chibi, hand-painted, no base` |

## Map 8–12 (thêm 26/11, lượt 63)

Khung 5 vùng đã chạy bằng cảnh vẽ bằng mã và quái mượn mô hình cũ đổi màu. Danh sách dưới xếp theo mức "đáng làm": trùm và người giữ vùng trước (bé nhìn gần, lâu), công trình mốc sau. Có file nào em thay vào ngay, không phải sửa bản đồ.

**Trùm (mỗi con một file, tư thế đứng, không bệ):**

| # | Tên file gợi ý | Thay cho | Câu lệnh gợi ý |
|---|---|---|---|
| 11 | `boss_thorn_queen.glb` | Nữ hoàng Gai (đang mượn Nữ hoàng Nấm đổi màu) | `cute stylized fairy queen made of rose vines and thorns, big rose flower as a skirt, leaf crown, small wings, chibi proportions, hand-painted, soft colors, standing pose, no base` |
| 12 | `boss_magma_titan.glb` | Người Khổng Lồ Dung Nham (mượn Golem Cổ) | `chunky stylized lava titan, black rock body with glowing orange cracks, big fists, small glowing eyes, friendly-scary, chibi proportions, hand-painted, standing pose, no base` |
| 13 | `boss_crystal_dragon.glb` | Rồng Pha Lê (mượn Rồng Băng) | `cute stylized crystal dragon, body covered in purple and blue gem shards, big eyes, short wings, chibi proportions, hand-painted, standing on four legs, no base` |
| 14 | `boss_iron_warden.glb` | Người Máy Canh Gác (em đã vẽ bản khối đơn giản) | `big friendly-scary guardian robot, rounded white and steel armor, glowing blue visor, chest light, chunky arms, toy-like chibi style, hand-painted, T-pose, no base` |
| 15 | `chr_hugh_boy.glb` | Hugh sau khi hết làm Chúa tể Im Lặng (cảnh kết) | `full body chibi shy boy age 12, dark purple hooded cloak pulled back, messy hair, gentle smile, holding a small glowing compass, T-pose, arms away from body, soft hand-painted look, white background` |

**Người giữ vùng (tư thế chữ T, có rig nếu được):**

| # | Tên file gợi ý | Ai | Câu lệnh gợi ý |
|---|---|---|---|
| 16 | `npc_flora_fairy.glb` | Tiên Flora (Map 8) | `full body chibi fairy girl, pink hair with flower crown, leaf dress, small transparent wings, T-pose, arms away from body, soft hand-painted look, white background` |
| 17 | `npc_brann_firewatcher.glb` | Chú Brann (Map 9) | `full body chibi old fire-watcher man, grey beard, heavy leather coat, goggles on forehead, lantern on belt, T-pose, arms away from body, soft hand-painted look, white background` |
| 18 | `npc_opal_miner.glb` | Opal (Map 10) | `full body chibi miner girl age 12, helmet with a small lamp, overalls, pickaxe on her back, braided hair, T-pose, arms away from body, soft hand-painted look, white background` |
| 19 | `npc_nova_inventor.glb` | Nova (Map 11) | `full body chibi young woman inventor, short teal hair, white lab coat with glowing lines, tool belt, T-pose, arms away from body, soft hand-painted look, white background` |
| 20 | `npc_luma_dreamweaver.glb` | Luma (Map 12) | `full body chibi dream weaver girl, long lavender hair with small stars, pale yellow robe, crescent moon staff on her back, T-pose, arms away from body, soft hand-painted look, white background` |

**Công trình mốc (một file một công trình, không nền):**

| # | Tên file gợi ý | Ở đâu | Câu lệnh gợi ý |
|---|---|---|---|
| 21 | `fairy_mushroom_house.glb` | Nhà nấm Map 8 (đang là cây nấm phóng to) | `cozy stylized mushroom house, red cap roof with white dots, round door, small windows, flower pots, chibi fairy village style, hand-painted, chunky shapes, no base` |
| 22 | `volcano_forge_gate.glb` | Cổng Lửa Map 9 | `stylized black stone gate with glowing lava runes and two fire bowls, chunky fantasy shapes, hand-painted, game asset, no base` |
| 23 | `crystal_gate.glb` | Hốc Rồng Map 10 | `stylized cave entrance framed by giant purple and blue crystals, glowing softly, chunky shapes, hand-painted, game asset, no base` |
| 24 | `future_station.glb` | Nhà ga Map 11 | `small cute futuristic train station, white curved roof, glass walls, solar panels, glowing blue lines, toy-like chibi style, hand-painted, no base` |
| 25 | `star_castle.glb` | Lâu đài Ngôi Sao Map 12 (đang mượn biệt thự) | `dreamy stylized castle with tall towers, star on the top, crescent moon window, pastel purple and gold, puffy cloud at the base, chibi toy style, hand-painted, no base` |

Quái thường của map 8, 9, 10, 12: chưa cần. Khi anh muốn, mỗi vùng chọn 2 con đặc trưng (tiên đom đóm, cáo dung nham, dơi hang, cừu mộng mơ…) là đủ khác biệt; số còn lại vẫn mượn mô hình cũ.

## Không cần làm
- Cây, bụi, cỏ: em giảm lưới gói hiện có và dựng thêm bằng Blender.
- Hoạt ảnh cho quái và thú Tripo đang đứng im: em gắn xương trong Blender.
- Phụ kiện, quần áo, kiểu tóc, vũ khí, giáp, đồ đạc: Blender (cần khớp thân nhân vật).
