# Ghi công mô hình 3D (assets/models/)

Ba mô hình con vật lấy từ [Poly Pizza](https://poly.pizza), đã chỉnh trong Blender:
đặt tên gọn, xoay đứng và quay mặt về +Z, đặt chân chạm đất, đổi tỉ lệ, tô lại màu cho hợp phong cách game.

| File | Gốc | Tác giả | Giấy phép |
|---|---|---|---|
| `animal_rabbit_cream_v01.glb` | [Rabbit](https://poly.pizza/m/dyeBDJxhDwP) | Poly by Google | CC-BY 3.0 |
| `animal_chicken_white_v01.glb` | [Chicken](https://poly.pizza/m/1YE8U35HXsI) | jeremy | CC-BY 3.0 |
| `animal_dog_shiba_v01.glb` | [Shiba Inu](https://poly.pizza/m/y4wdQpg767) | Quaternius | CC0 (không bắt buộc ghi công) |

Giấy phép CC-BY 3.0: https://creativecommons.org/licenses/by/3.0/ — bắt buộc ghi tên tác giả (như bảng trên) và nêu rõ đã chỉnh sửa.

Chó Shiba giữ 4 hoạt ảnh: Idle, Walk, Gallop, Eating. Thỏ và gà không có hoạt ảnh.

## Prop do tự dựng (không cần ghi công)

11 file `prop_*_v01.glb` (đài phun nước quảng trường, vườn rau, cây tròn, cây thông, bụi cỏ, táo, cam, hồ, bãi lửa, thuyền, tháp nước) do dự án
tự dựng từ hình khối cơ bản trong Blender, không dùng mô hình ngoài. Dựng lại bằng:
`OUT=<thư mục> blender -b -P tools/props/build_props.py` (tùy chọn `ONLY=tên,tên`).
