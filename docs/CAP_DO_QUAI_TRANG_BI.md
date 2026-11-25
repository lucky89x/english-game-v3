# Cấp độ, bãi quái, trang bị (25/11)

Sinh từ code (`src/core/progress.js`, `zones.js`, `rules.js`): sửa số ở code rồi chạy lại lệnh sinh bảng này.

## Cấp tối đa
- Một hệ kỹ năng đầy = 7 dòng × 10 bậc = **70 điểm**, mỗi cấp 1 điểm → **cấp 70** (cả 4 hệ = 280 điểm, nhưng bé chỉ học một hệ).
- Mỗi map có cấp tối đa cứng; vượt cấp đó thì map đó không cho EXP.

| Map | Vùng | Cấp |
|---|---|---|
| 1 | Làng Khởi Đầu | 1–5 |
| 2 | Biển cả · Cảng Mặt Trời | 5–10 |
| 3 | Rừng xanh · Rừng Ký Ức | 10–20 |
| 4 | Sa mạc cát vàng (chưa xây) | 15–25 |
| 5 | Núi non (chưa xây) | 20–30 |
| 6 | Vương quốc trên trời (chưa xây) | 35–45 |
| 7 | Khu di tích cổ (chưa xây) | 25–35 |
| 8 | Đảo thần tiên (chưa xây) | 30–40 |
| 9 | Thung lũng núi lửa (chưa xây) | 40–55 |
| 10 | Hang tinh thể (chưa xây) | 50–70 |

## Bãi quái (mỗi loại một bãi)
Công thức (`progress.js`): máu = công của bé trong đồ cùng cấp × `hitsToKill` (3 + 0,25·cấp, tối đa 10); công = máu bé / `MOB_BITES` (10); EXP = EXP cấp / `killsPerLevel` (15 + 0,35·cấp); đánh tay không = 60% công cơ bản (`UNARMED`).
| Map | Bãi | Quái | Cấp | Loại | Máu | Công | EXP | Vàng | Số con |
|---|---|---|---|---|---|---|---|---|---|
| village | Bãi Thỏ Băng | Frost Bunny | 1 | normal | 59 | 11 | 10 | 3 | 5 |
| village | Bãi Slime Xanh | Green Slime | 2 | normal | 77 | 12 | 14 | 4 | 5 |
| village | Bãi Yêu Tinh Băng | Frost Goblin | 3 | ranged | 80 | 13 | 19 | 6 | 4 |
| village | Bãi Slime Đỏ | Red Slime | 4 | normal | 116 | 16 | 22 | 6 | 4 |
| village | Bãi Quỷ Lửa Nhỏ | Ember Imp | 5 | ranged | 116 | 16 | 27 | 8 | 4 |
| village | Bãi Golem Đá | Stone Golem | 5 | elite | 299 | 23 | 65 | 15 | 2 |
| harbor | Bãi Cua Biển | Beach Crab | 5 | normal | 136 | 18 | 26 | 7 | 5 |
| harbor | Bãi Sứa Phát Sáng | Glow Jellyfish | 6 | ranged | 138 | 18 | 32 | 8 | 4 |
| harbor | Bãi Hải Âu Bão | Storm Gull | 8 | ranged | 183 | 21 | 40 | 10 | 3 |
| harbor | Bãi Cướp Biển Nhí | Little Pirate | 9 | elite | 543 | 33 | 105 | 22 | 4 |
| forest | Bãi Dơi Bóng Tối | Shadow Bat | 10 | ranged | 234 | 24 | 48 | 12 | 5 |
| forest | Bãi Ma Trơi Sét | Storm Wisp | 12 | ranged | 296 | 27 | 57 | 14 | 4 |
| forest | Bãi Cáo Lửa | Ember Fox | 14 | normal | 423 | 34 | 62 | 15 | 4 |
| forest | Bãi Nấm Giận Dữ | Angry Mushroom | 16 | elite | 1109 | 49 | 175 | 35 | 3 |
| forest | Bãi Orc Gió Lốc | Gale Orc | 18 | elite | 1304 | 54 | 195 | 40 | 3 |

## Trùm
| Trùm | Map | Thức dậy ở cấp | Máu | Công | EXP lần đầu |
|---|---|---|---|---|---|
| Slime King | village | 4 | 845 | 22 | 2555 |
| Ancient Golem | forest | 19 | 3302 | 56 | 11352 |
| Mushroom Queen | forest | 17 | 2907 | 52 | 9945 |
| Captain Octopus | harbor | 9 | 1520 | 34 | 5037 |

## Vũ khí (công thức: 80% công cơ bản của cấp đó)
| Cấp | Nơi bán | Món | Công | Giá |
|---|---|---|---|---|
| 1 | forge | Wooden Sword | 8 | 45 |
| 3 | forge | Iron Sword | 11 | 75 |
| 4 | forge | Ember Sword | 13 | 115 |
| 4 | forge | Frost Sword | 13 | 115 |
| 4 | forge | Gale Sword | 13 | 115 |
| 4 | forge | Spark Sword | 13 | 115 |
| 5 | forge | Crystal Blade | 14 | 105 |
| 5 | forge | Ember Staff | 11 | 135 |
| 5 | forge | Frost Staff | 11 | 135 |
| 5 | forge | Gale Staff | 11 | 135 |
| 5 | forge | Spark Staff | 11 | 135 |
| 6 | harbor | Oakheart Blade | 16 | 105 |
| 8 | harbor | Blaze Blade | 19 | 175 |
| 8 | harbor | Glacier Blade | 19 | 175 |
| 8 | harbor | Storm Blade | 19 | 175 |
| 8 | harbor | Tempest Blade | 19 | 175 |
| 9 | harbor | Glacier Staff | 16 | 195 |
| 9 | harbor | Inferno Staff | 16 | 195 |
| 9 | harbor | Storm Staff | 16 | 195 |
| 9 | harbor | Tempest Staff | 16 | 195 |
| 10 | harbor | Moonlight Sword | 22 | 165 |
| 12 | forest | Thornwood Blade | 26 | 195 |
| 15 | forest | Aurora Blade | 30 | 310 |
| 15 | forest | Cyclone Blade | 30 | 310 |
| 15 | forest | Ironwood Blade | 30 | 240 |
| 15 | forest | Phoenix Blade | 30 | 310 |
| 15 | forest | Thunderclap Blade | 30 | 310 |
| 16 | forest | Aurora Staff | 24 | 310 |
| 16 | forest | Cyclone Staff | 24 | 310 |
| 16 | forest | Phoenix Staff | 24 | 310 |
| 16 | forest | Thunderclap Staff | 24 | 310 |
| 18 | forest | Starfall Blade | 35 | 270 |
| 20 | forest | Ancient Blade | 38 | 300 |

## Phí mini game (vàng)
| Cấp | Xếp kẹo/hình/cung | Đua xe, Style, Café, Salon | Câu cá, Hứng táo |
|---|---|---|---|
| 1 | 10 | 15 | 10 |
| 5 | 20 | 25 | 15 |
| 10 | 30 | 40 | 20 |
| 20 | 50 | 70 | 40 |
| 40 | 90 | 130 | 70 |
| 70 | 150 | 220 | 120 |
