# Hệ thống kỹ năng phép thuật 4 hệ (20/11)

Anh yêu cầu 20/11: mỗi cấp được 1 điểm kỹ năng, tổng số bậc kỹ năng lớn hơn tổng số cấp; 4 hệ Lửa, Băng, Gió, Sét; mỗi hệ có nội năng (tăng cho bản thân) và ngoại năng (phép đánh ra), có phép đánh gần và đánh xa; quái cũng có 4 hệ, các hệ tương sinh, tương khắc; trang bị và vũ khí gắn với từng hệ.

Mã: `src/core/skills.js` (luật, có unit test), `src/game/spells.js` (phép trong trận), `src/game/floaters.js` (số sát thương bay lên), `src/ui/skills.js` (thanh phép + bảng Kỹ năng), `src/game/combat.js` (`Wild.damage`: hệ, combo, chí mạng, cháy/chậm/choáng).

## Điểm kỹ năng
- Mỗi lần lên cấp: **+1 điểm** (điểm = cấp − 1). Nhân vật cũ đã có cấp thì có sẵn điểm để cộng.
- Mỗi hệ có **6 nhánh × 10 bậc = 60 bậc**. Cả 4 hệ = **240 bậc**, nhiều hơn 179 điểm của nhân vật cấp 180 (cấp tối đa dự kiến của 10 map). Không ai học hết được, nên mỗi bé có lối chơi riêng.
- **Tẩy điểm**: lần đầu miễn phí, sau đó 50 vàng cho mỗi 5 cấp.

## 4 hệ, mỗi hệ 3 nội năng + 3 ngoại năng
| Hệ | Nội năng (bản thân mạnh lên) | Ngoại năng: gần | Ngoại năng: xa | Tuyệt kỹ (cấp 12, ≥10 điểm hệ) |
|---|---|---|---|---|
| 🔥 Lửa | Tâm Lửa +2 công/bậc · Kháng Lửa · Huyết Lửa (phép trúng hồi máu) | Chém Lửa (vòng cung, đốt cháy) | Quả Cầu Lửa (bắn xa, nổ) | Mưa Thiên Thạch |
| ❄️ Băng | Da Băng +1 thủ +8 máu · Kháng Băng · Suối Lạnh (+10 máu) | Đòn Băng Giá (làm chậm) | Giáo Băng (xuyên quái, làm chậm) | Bão Tuyết (quanh mình) |
| 🌪️ Gió | Bước Gió (+tốc chạy, +né) · Kháng Gió · Hơi Thở Gió (hồi năng lượng) | Lốc Xoáy (360°, hất văng) | Lưỡi Gió (rất nhanh, xuyên) | Vòi Rồng (đi tới, hút quái) |
| ⚡ Sét | Mạch Sét (+chí mạng ×1,8) · Kháng Sét · Nạp Nhanh (−thời gian chờ) | Quyền Sấm (làm choáng) | Tia Sét (trúng ngay, bậc 5 lan) | Lôi Bão (6 tia sét) |

- Phép xa mở từ **cấp 3**. Tuyệt kỹ mở từ **cấp 12** và cần **10 điểm** trong hệ đó.
- Mỗi phép tốn **năng lượng** (thanh xanh trên thanh phép, tự hồi) và có **thời gian chờ**. Sát thương = công × hệ số phép (+12% mỗi bậc) × thưởng trang bị.
- Đặt phép vào **4 ô**, dùng bằng **phím 1 2 3 4** hoặc bấm ô (máy tính bảng). Phím **T** mở bảng Kỹ năng. J vẫn là chém thường, K né.

## Tương khắc, tương sinh
- **Tương khắc**: 🔥 Lửa → ❄️ Băng → ⚡ Sét → 🌪️ Gió → 🔥 Lửa.
  - Lửa làm tan Băng. Băng bọc kín, chặn Sét. Sét xé tan Gió. Gió thổi tắt Lửa.
  - Đánh hệ mình khắc: ×1,5 (số vàng có ▲). Đánh hệ khắc mình: ×0,7 (số xám có ▼).
- **Tương sinh**: hệ bị khắc **nuôi** hệ khắc nó. Phép trúng để lại **dấu hệ** 4 giây (chấm màu cạnh thanh máu đổi màu). Phép tiếp theo đúng hệ được nuôi sẽ nổ **combo**:
  - ❄️ rồi 🔥: **Nổ hơi nước**, +60% sát thương.
  - ⚡ rồi ❄️: **Mưa đá**, +30% và choáng 1,2 giây.
  - 🌪️ rồi ⚡: **Giông bão**, +30% và lan sang 2 quái.
  - 🔥 rồi 🌪️: **Bão lửa**, +30% và lửa lan sang 3 quái.
- Nhờ vậy học **2 hệ cạnh nhau** trong vòng (ví dụ Băng + Lửa) sẽ có combo mạnh, đó là một lựa chọn chiến thuật.

## Hệ của quái
| Map | Quái (hệ) | Boss (hệ) |
|---|---|---|
| Đồng Hoang | slime xanh 🌪️, slime đỏ 🔥, golem đá ⚡, Frost Goblin ❄️ (cấp 5), Ember Imp 🔥 (cấp 9) | Vua Slime ❄️, Golem Cổ ⚡ |
| Rừng Ký Ức | dơi 🌪️, nấm ❄️, Gale Orc 🌪️ (cấp 15) | Nữ hoàng Nấm 🌪️ |
| Cảng | cua ❄️, sứa ⚡, cướp biển 🔥 | Bạch Tuộc 🔥 |

Đòn của quái mang hệ của nó: nội năng **Kháng** và giáp/bùa cùng hệ giảm sát thương nhận vào (tối đa 60%).

## Trang bị theo hệ
- **Kiếm** (`kind: 'sword'`): tăng **phép gần** của hệ mình; cú chém thường J mang hệ của kiếm.
- **Gậy phép / trượng** (`kind: 'staff'`): tăng **phép xa và tuyệt kỹ** của hệ mình.
- **Bùa** (charm): +15% phép của hệ và kháng hệ 15%.
- **Giáp hệ** (Map 2): kháng hệ 30%.

| Nơi bán | Món |
|---|---|
| Bram, trong Village Shop (Map 1, cấp 6–8) | Ember/Frost/Gale/Spark **Sword** (+20% phép gần) · Ember/Frost/Gale/Spark **Staff** (+25% phép xa) |
| Rose, trong Village Shop (Map 1, cấp 5) | Fire/Ice/Wind/Thunder **Amulet** |
| Willow ở cảng (Map 2, cấp 23–25) | Blaze/Glacier/Tempest/Storm **Blade** (+35%) · Inferno/Glacier/Tempest/Storm **Staff** (+40%) · Flame Mail, Frost Mail, Wind Cloak, Storm Plate (kháng 30%) |

Hiện vũ khí và hiệu ứng phép được vẽ tạm bằng khối (kiếm/gậy có quả cầu phát sáng màu hệ). Khi anh đẩy **lô 20** (vũ khí, giáp, bùa) và **lô 21** (hiệu ứng phép, biểu tượng), em sẽ nối model vào game. Lệnh Blender ở cuối `docs/PROMPT_BLENDER_MAP1.md`.

## Còn có thể làm sau
- Quái dùng phép (quái hệ Lửa ném cầu lửa, boss có đòn hệ riêng).
- Ngọc/nhân vật chọn "hệ chính" khi tạo nhân vật (chỉ để trang trí, không khóa).
- Rương và nhiệm vụ thưởng "sách kỹ năng" (+1 điểm).
