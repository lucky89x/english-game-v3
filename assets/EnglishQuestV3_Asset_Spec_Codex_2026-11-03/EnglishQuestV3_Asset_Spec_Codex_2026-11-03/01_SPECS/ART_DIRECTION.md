# Quy chuẩn sản xuất — English Quest V3 (Godot 4)

## Mục tiêu hình ảnh
- **Stylized high-quality chibi fantasy**, khối tròn có độ mềm và tỷ lệ dễ thương; không dùng capsule, primitive cube hoặc low-poly hình học thô như asset thành phẩm.
- Màu chủ đạo: kem ấm, gỗ mật ong, mái đỏ/lam, đá xám tím ấm, cỏ nhiều sắc xanh-vàng, nước xanh ngọc, ánh sáng vàng nhạt. Hạn chế xanh neon và lá vàng cháy sáng.
- Nhà cửa có mái dày, ngói rõ lớp, cửa sáng, cửa sổ, bậu hoa, bậc thềm, chi tiết đá/gỗ thật. Quy hoạch có khoảng trống đi lại, nhận diện landmark mạnh.
- Nhân vật có đầu lớn (khoảng 35–42% chiều cao ở chibi), tay/chân ngắn, mặt rõ ở camera xa, phụ kiện không xuyên mesh; không sao chép máy móc các lỗi phối cảnh của ảnh AI.
- Tính đồng nhất quan trọng hơn số lượng: chỉ nhập asset đã qua review chất lượng; dùng Quaternius làm phần nền/test nếu chưa có bản custom đạt chuẩn.

## Chuẩn kỹ thuật
| Tiêu chí | Chuẩn bắt buộc |
|---|---|
| Target | Godot 4 PC, GDScript; nguyên mẫu trong Blender |
| Xuất | glTF 2.0 binary `.glb` (từng asset độc lập), `Y up` theo glTF; trong Godot `-Z` là hướng nhìn/trước của nhân vật |
| Đơn vị | 1 đơn vị thế giới ≈ 1 mét; nhân vật nữ 1,50 m (chibi) làm chuẩn; cửa nhà ≥ 1,5 m rộng, ≥ 2,3 m cao |
| Origin/pivot | Grounded assets đặt pivot tại chân/đáy, theo trục giữa hợp lý; cửa/cầu có pivot tại đầu gốc logic; vũ khí có grip/socket |
| Texture | PNG/WebP nguồn; PBR baseColor/roughness/normal tùy asset; tránh texture vỡ hoặc đường seam rõ. Hero 2K; NPC 1K–2K; kiến trúc dùng atlas dùng lại |
| Material | Ưu tiên ít material, texture atlas và shared palette; mặt trong cần normal đúng |
| Collision | Đơn giản hóa trong Godot bằng `StaticBody3D`/primitive hoặc convex; không dùng triangle collision động cho NPC/Player |
| Rig | Nhân vật/NPC: Armature + skin weights + các clip animation được export và nhận vào Godot `Skeleton3D`/`AnimationPlayer` |
| Naming | `chr_`, `npc_`, `bld_`, `brg_`, `trn_`, `wat_`, `veg_`, `wpn_`, `prop_` + snake_case + `_v01.glb` |
| Hiệu năng | Chỉ tiêu **ngân sách sơ bộ**, kiểm chứng bằng Godot Profiler; không lấy FPS headless làm FPS thực |

## Ngân sách tham chiếu (mức khởi đầu để tối ưu, không phải giới hạn bắt buộc)
- Nhân vật chính: 15–35k triangles, 1–3 material slots, texture 2K.
- NPC quan trọng: 10–25k triangles, 1–3 material slots, texture 1K–2K.
- Nhà nhỏ: 5–15k tris; nhà lớn/hội trường 15–40k tris nếu gồm mặt ngoài; nội thất có thể stream riêng.
- Cây tầm trung: 500–4k tris; props nhỏ 100–3k tris; đối tượng lặp cần LOD/MultiMesh sau kiểm thử.
- Camera isometric/third-person của dự án: đánh giá silhouette tại khoảng cách thường chơi; **không thay art chất lượng bằng mesh 200 tris rồi báo đạt**.

## Mức chất lượng 3 giai đoạn
1. **Blockout**: đúng kích thước, đường đi, cửa, trục/pivot và collision (chưa đẹp, ghi rõ).
2. **Art pass**: đúng silhouette concept, thiết kế vật liệu, kỹ thuật UV, texture và điểm nhấn; duyệt ảnh 4 góc.
3. **Game-ready**: đáp ứng chuẩn GLB, anim/rig/collision, không lỗi import, chạy F5/kiểm thử có báo cáo.

## Hình ảnh nguồn và bản quyền
- Dùng file trong `04_REFERENCES` làm **tham chiếu hình ảnh**; không nhập nguyên tấm concept vào cảnh như mô hình 3D.
- Các asset Quaternius đã tải chỉ được dùng theo giấy phép đính kèm gói. Ghi nguồn từng tài nguyên; không tự nhận mesh của bên thứ ba là thiết kế gốc.
- Không cố chuyển PNG thành mesh 3D bằng cách đổi phần mở rộng.
