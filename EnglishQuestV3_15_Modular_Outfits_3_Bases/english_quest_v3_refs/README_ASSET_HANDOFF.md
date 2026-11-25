# English Quest V3 — 3 nhân vật cơ sở và 15 trang phục module

## Nội dung

- `base_characters/`: 3 bản vẽ nhân vật cơ sở mặc bodysuit xám, mặt trung tính, T-pose và các hướng nhìn.
- `outfits/NGOC/`: 5 trang phục nữ chính Ngọc.
- `outfits/HONG_LIEN/`: 5 trang phục nữ Hồng Liên.
- `outfits/HAO_THIEN/`: 5 trang phục nam Hạo Thiên.
- `OUTFIT_MANIFEST.csv`: danh sách, màu và vai trò của từng ảnh.

**Các PNG là concept art 2D, KHÔNG phải mô hình 3D hay GLB.** Mô hình 3D, xương, topology, texture và skin weights cần được xây dựng, kiểm tra trong Blender trước khi nhập Godot.

## Yêu cầu chung khi dựng với Codex Astra / Blender MCP

1. Dựng một `Body` theo đúng nhân vật tại `base_characters/`. Giữ đầu, mặt, mắt, tóc thành các mesh được đặt tên riêng; không trộn trang phục vào body.
2. Tạo một `Armature` với T-pose thống nhất cho từng nhân vật; giữ ổn định tên xương, tỷ lệ và bind pose. Có thể chia sẻ animation có kiểm tra retarget, nhưng không mặc định cơ thể nam/nữ có cùng tỷ lệ.
3. **Mỗi bộ trang phục được dựng thành các skinned meshes riêng**: `Upper`, `Lower` (váy/quần), `Boots`, `Sleeves`, `Belt`, `Cape`, `Accessories` (chỉ tạo các slot thực sự có ở mẫu).
4. Những bộ phận phải co giãn và di chuyển theo cùng khung xương của nhân vật mặc. Với áo tay rộng/váy dài, thêm các xương phụ hoặc giải pháp animation thích hợp nếu cần.
5. Chia các vật liệu để đổi màu tại runtime: `cloth_primary`, `cloth_secondary`, `trim_metallic`, `gemstone` hoặc mask phù hợp. Không gộp tất cả màu vào một texture không thể đổi riêng.
6. Dựng mặt trước **và** mặt sau của trang phục; xem hình nhóm chi tiết nhỏ để phân chia lớp áo, dây đai, váy, giày, tay áo.
7. Đối chiếu và khắc phục xuyên mesh ở Idle, Walk, Run, Jump, Combat, Interact; khi mặc trang phục che phủ, ẩn mesh body ở vùng khuất nếu cần.
8. Xuất cơ thể và outfit thành các `.glb` riêng, kiểm tra mở lại trong Blender và import Godot. Giữ file nguồn `.blend`, không xóa/chỉnh sửa asset đang chạy trong game cho tới khi bản mới được kiểm thử.

## Quy trình nên giao Astra

Làm **1 nhân vật + 1 trang phục** trước (`NGOC` + `NGOC_01_Sky_Lotus_Blue.png`). Kiểm tra skin weights, chuyển động, đổi trang phục và đổi màu thành công trong Godot, sau đó mới sử dụng đúng bộ tiêu chuẩn đó để triển khai 14 bộ còn lại. Không tuyên bố một bộ đã game-ready chỉ vì có file `.glb`.

## Prompt ngắn có thể dùng với Astra

> Hãy dùng `base_characters/NGOC_base_turnaround.png` làm tham chiếu dựng body, mặt, tóc và bộ xương T-pose trong Blender. Dùng `outfits/NGOC/NGOC_01_Sky_Lotus_Blue.png` để dựng từng phần quần áo tách rời, khớp body và có skin weights theo skeleton của Ngọc. Không bake quần áo vào cơ thể. Chuẩn hóa vật liệu có thể đổi màu. Xuất hai `.glb` riêng cho body và bộ quần áo, giữ `.blend` nguồn. Kiểm tra tỷ lệ, mặt trước/sau và lỗi xuyên mesh khi Idle, Walk, Run, Jump. Chỉ thực hiện bộ đầu tiên để tôi duyệt trước; chưa tích hợp vào project Godot, chưa commit hoặc push khi chưa được yêu cầu.
