# Mô hình cần anh tạo bằng Tripo3D (cập nhật 26/11)

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

## Không cần làm
- Cây, bụi, cỏ: em giảm lưới gói hiện có và dựng thêm bằng Blender.
- Hoạt ảnh cho quái và thú Tripo đang đứng im: em gắn xương trong Blender.
- Phụ kiện, quần áo, kiểu tóc, vũ khí, giáp, đồ đạc: Blender (cần khớp thân nhân vật).
