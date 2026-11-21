# Hiệu ứng phép thuật: làm thêm bằng Tripo3D + Blender (21/11)

Bản 21/11 đã vẽ lại toàn bộ hiệu ứng trong code (`src/game/fx.js`, `src/game/spells.js`): hạt sáng, vệt lửa, mảnh băng, gió xoáy, sét phân nhánh, vòng phép dưới chân. Không cần file ngoài vẫn chạy. Nếu anh muốn đẹp hơn nữa, làm thêm vài **mô hình 3D nhỏ** dưới đây; anh đẩy file `.glb` vào `assets/models/`, em nối vào game (thay hình khối trong code).

## 1. Tripo3D (trên máy anh, tài khoản của anh)
Tạo từng món bằng **Text to 3D**, kiểu *Stylized / Cartoon*, nền trơn. Câu lệnh (dán nguyên văn):

| Tên file | Câu lệnh Tripo |
|---|---|
| `fx_meteor_v01` | `stylized cartoon meteor rock, chunky low poly, glowing orange cracks of lava, game asset, no base` |
| `fx_fireball_v01` | `stylized cartoon fireball core, swirling flame shape, low poly, game VFX mesh, no base` |
| `fx_ice_spear_v01` | `stylized ice spear crystal, long sharp icicle, faceted low poly, light blue translucent look, game asset` |
| `fx_ice_spike_v01` | `cluster of three ice spikes coming out of the ground, faceted low poly, cartoon style` |
| `fx_wind_blade_v01` | `crescent shaped wind blade, curved swoosh, stylized cartoon, flat thin mesh, game VFX` |
| `fx_thunder_orb_v01` | `stylized electric orb with small lightning arcs, low poly cartoon, game asset` |
| `fx_rune_circle_v01` | `flat magic rune circle disc with symbols, thin, stylized fantasy, game decal mesh` |

Tải về dạng **GLB**.

## 2. Blender (4.2) cho từng file
1. File → Import → glTF, chọn file Tripo vừa tải.
2. Chọn mô hình → thêm **Decimate** (Ratio sao cho còn ≤ 1.500 tam giác, xem ở góc phải dưới khi bật Statistics) → Apply.
3. Đặt gốc: Object → Set Origin → Origin to Geometry; dời về (0, 0, 0); mũi giáo / lưỡi gió hướng theo trục **+Y** của Blender (tức là về phía trước).
4. Vật liệu: Principled BSDF, **Emission** cùng màu (lửa cam, băng xanh nhạt, gió xanh lá, sét vàng), Emission Strength 1–2. Tên vật liệu: `fx_fire`, `fx_ice`, `fx_wind`, `fx_thunder`.
5. Kích thước: thiên thạch ~1 m, giáo băng ~1,3 m, lưỡi gió ~1 m ngang, vòng phép ~2 m.
6. File → Export → glTF 2.0 (.glb), bật *Apply Modifiers*, tắt *Animation*. Lưu `assets/models/fx_<tên>_v01.glb`.

## 3. Đẩy lên
Chép file vào thư mục `assets/models/` của repo trên máy anh, commit, push nhánh `fable/web-rebuild` rồi báo em: em nối vào `spells.js` (giữ hạt sáng hiện có, thay hình khối bằng mô hình) và chụp ảnh kiểm.
