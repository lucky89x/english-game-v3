# LỆNH GỬI CODEX — THỰC HIỆN TỪNG ĐỢT, KHÔNG DỒN GỘP

## NHIỆM VỤ 1 — CẢNH QUAN

Bạn là kỹ sư Godot 4 của EnglishQuestV3. Hãy đọc `01_VISUAL_UPGRADE_SPEC.md` và kiểm tra các scene hiện có, đặc biệt main world, fantasy village, camera, material/shader địa hình. Đừng tự giả định tên file khi chưa tìm thấy.

Mục tiêu của đợt này là thay cảnh nền xanh phẳng bằng một môi trường 3D fantasy thực có chiều sâu: địa hình cỏ/đất/đá nhiều lớp, đường uốn cong, cây/cỏ/hoa/đá bố trí tự nhiên, núi và rừng ở chân trời, bầu trời, sương nhẹ, hồ/sông/cầu, bến sông, nông trại và rìa rừng có lối đi. Ưu tiên dùng mô hình Quaternius có thật, giữ ảnh PNG concept chỉ làm tham chiếu. Giữ tất cả tính năng đã hoạt động: WASD, camera xoay, E tương tác, chest. Không kéo một tấm ảnh PNG để giả nền 3D, không thêm vài cây rồi báo hoàn thành.

Chia scene thành các khu vực tái sử dụng, bảo đảm collision và tối ưu mesh/instancing; kiểm tra camera xoay 360° không lộ mép map hoặc khoảng trống. Chạy thử Godot có hiển thị; log FPS/frame time thực tế khi di chuyển và xoay camera, không thay bằng headless benchmark. Kết thúc đợt 1, báo file đã đổi, asset đã dùng, tình trạng lỗi, ảnh 4 khu, hướng dẫn F5 và mục chưa hoàn thành. Sau đó dừng chờ nghiệm thu trước khi thực hiện đợt 2.

## NHIỆM VỤ 2 — NHÂN VẬT

Chỉ làm sau khi đợt 1 được nghiệm thu. Đọc `01_VISUAL_UPGRADE_SPEC.md`. Kiểm kê tài nguyên nhân vật 3D rigged đang có. Thay hình trụ chính thức bằng 1 nhân vật nữ 3D đúng tỷ lệ, có Skeleton3D và animation thực. Dựng AnimationPlayer + AnimationTree/StateMachine cho Idle, Walk, Run, Turn, Jump, Interact, Talk/Greet; Walk/Run phải blend mượt theo vận tốc, không trượt chân, không T-pose. Nếu thiếu asset rig/animation: báo danh sách thiếu và vị trí cần đặt file; KHÔNG dùng capsule hoặc mô hình không rig để đánh dấu hoàn thành. Không tự tải nội dung không rõ giấy phép. Kiểm thử scene PlayerTest và toàn game bằng F5, bàn giao file thay đổi, clip chuyển trạng thái và bảng các animation đã chạy.

## NHIỆM VỤ 3 — NPC VÀ HIỆU ỨNG

Chỉ làm sau khi đợt 2 được nghiệm thu. Dựng các NPC 3D: Elder Tom (cụ già), Merchant Ben, Teacher/Sage, Rose/Lily, Fisherman Sam (khi đã có bến sông). Dùng các model thực hoặc báo thiếu rõ ràng. Mỗi NPC phải có tương tác E, tên, marker, collision, cử chỉ khi nói; tối thiểu ba NPC chạy được mô hình riêng. Bổ sung Slime và pet mẫu cùng animation thực. Bổ sung chuyển động mặt nước, cỏ/lá, khói, đèn/lửa phù hợp máy PC. Kiểm thử và báo cáo chi tiết theo `01_VISUAL_UPGRADE_SPEC.md`.
