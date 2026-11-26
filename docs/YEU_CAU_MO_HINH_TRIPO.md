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

Map 4 Sa mạc **không cần chờ Tripo**: nhà, NPC, quái (bọ cạp, thần gió, xương rồng) và trùm rồng cát đã có sẵn trong `assets/models` từ các lô Blender trước. Mục 5 và 6 chỉ làm đẹp thêm.

## Không cần làm
- Cây, bụi, cỏ: em giảm lưới gói hiện có và dựng thêm bằng Blender.
- Hoạt ảnh cho quái và thú Tripo đang đứng im: em gắn xương trong Blender.
- Phụ kiện, quần áo, kiểu tóc, vũ khí, giáp, đồ đạc: Blender (cần khớp thân nhân vật).
