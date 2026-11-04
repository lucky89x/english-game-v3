# Công trình, cầu và nội thất — thiết kế để nhân vật vào được

## Bộ nhà (ảnh `REF_03_ENVIRONMENT.png`, `REF_04_VILLAGE_SCENE.png`)
| Model | Kích thước tham chiếu W×D×H (m) | Vào được? | Nội dung |
|---|---:|:---:|---|
| `bld_cottage_small_a` | 5×5×5 | Không (P1) | Nhà đỏ một tầng, hiên, bậu hoa, ống khói |
| `bld_house_medium_blue` | 7×7×7 | Có thể (P1) | Nhà mái xanh, gác xép, cửa sổ, bậc thềm |
| `bld_house_large_family` | 10×9×9 | Có (P1) | Hai tầng, phòng khách và phòng ngủ |
| `bld_mayor_hall` | **18×14×13** | **Có (P0)** | Nhà Trưởng làng Tom, mái xanh/huy hiệu/sảnh lớn, 2 phòng và cầu thang |
| `bld_school_library` | 15×12×10 | Có (P1) | sảnh sách, phòng học, bảng, kệ |
| `bld_shop_general` | 11×9×7 | Có (P1) | quầy, giá bán, phòng kho |
| `bld_riverside_fisher` | 9×7×6 | Có thể (P1) | sàn gỗ, thuyền nhỏ, lưới |
| `bld_bakery` | 11×9×8 | Có (P2) | lò bánh, quầy bán, bếp |
| `bld_blacksmith` | 12×10×8 | Có (P1) | lò rèn, đe, đồ nghề |
| `bld_watchtower` | 7×7×16 | Có thể (P1) | tháp, cầu thang, lan can |
| `bld_small_keep` | 24×18×18 | Có (P2) | lâu đài mini, điểm nhấn ở map sau |
| `bld_farm_barn` | 12×10×8 | Có thể (P1) | kho cỏ/rơm/đồ nghề |

Kích thước chỉ là **mục tiêu quy hoạch ban đầu**, phải căn chỉnh với nhân vật thật. Không chỉ `scale(2)` ngôi nhà nhỏ rồi báo đã làm nhà lớn: phải thay đổi tầng, cửa, sảnh, mái, phòng chức năng và collision.

**Nhà vào được:** cửa rộng >=1.5 m, cao >=2.3 m, hành lang hữu dụng >=1.8 m, cầu thang có thể leo; nội thất có sàn thật, collision, bề mặt mặt trong; trigger `Enter` và `Exit`; điểm chuyển scene không chồng lên cửa; camera trong nhà không xuyên mái. Lựa chọn tốt ở giai đoạn đầu: interior **scene riêng** load qua trigger, duy trì tọa độ exit, đặt NPC bên trong, tránh phải trưng tất cả nội thất ở map ngoài.

## Cầu / bến
- `brg_wood_arch`: cầu gỗ cong lan can 2 phía, rộng đi lại >=2.5 m, dài 8–12 m, collision mô phỏng đúng mặt đường, điểm đầu/đuôi khớp bờ.
- `brg_stone_arch`: cầu đá cuốn cao, rộng >=3 m, dài 10–14 m, dưới vòm có khoảng cho dòng nước; đá có hình khối dày, có lan can.
- `brg_rope_suspension`: cầu dây, rộng >=2 m, dây lan can mô phỏng; chuyển động nhẹ phần chi tiết **không** làm rung collision đi lại.
- `prop_dock_modular`: bộ bến thuyền thẳng/góc/bậc, móc neo, cọc, dây, thùng cá.

## Interiors/props
Gói `prop_*`: bàn gỗ, ghế, kệ sách, sách, thảm, giường, tủ, quầy shop, lò sưởi, bảng học, đèn, cửa mở được, biển hiệu, thùng gỗ, giỏ rau, rương, rèm, hàng rào, giếng; tạo prefab dùng lại.

## Mỗi công trình bàn giao
GLB **từng phần riêng nếu modular**, prefab scene Godot, material/texture, collision đơn giản, LOD khi cần, ảnh 4 góc và cảnh kiểm tra tỉ lệ nhân vật. Các công trình quan trọng có scene interior chạy được bằng F5 trước khi coi là hoàn thành.
