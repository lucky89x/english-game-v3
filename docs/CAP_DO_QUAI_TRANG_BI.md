# Cấp độ, bãi quái, trang bị (24/11)

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
| Map | Bãi | Quái | Cấp | Loại | Máu | Công | EXP | Vàng | Số con |
|---|---|---|---|---|---|---|---|---|---|
| village | Bãi Thỏ Băng | Frost Bunny | 1 | normal | 40 | 8 | 17 | 3 | 5 |
| village | Bãi Slime Xanh | Green Slime | 2 | normal | 53 | 9 | 25 | 4 | 5 |
| village | Bãi Yêu Tinh Băng | Frost Goblin | 3 | ranged | 55 | 9 | 35 | 6 | 4 |
| village | Bãi Slime Đỏ | Red Slime | 4 | normal | 81 | 11 | 40 | 6 | 4 |
| village | Bãi Quỷ Lửa Nhỏ | Ember Imp | 5 | ranged | 82 | 11 | 49 | 8 | 4 |
| village | Bãi Golem Đá | Stone Golem | 5 | elite | 211 | 17 | 117 | 15 | 2 |
| harbor | Bãi Cua Biển | Beach Crab | 5 | normal | 96 | 13 | 47 | 7 | 5 |
| harbor | Bãi Sứa Phát Sáng | Glow Jellyfish | 6 | ranged | 98 | 13 | 56 | 8 | 4 |
| harbor | Bãi Hải Âu Bão | Storm Gull | 8 | ranged | 132 | 15 | 69 | 10 | 3 |
| harbor | Bãi Cướp Biển Nhí | Little Pirate | 9 | elite | 393 | 23 | 177 | 22 | 4 |
| forest | Bãi Dơi Bóng Tối | Shadow Bat | 10 | ranged | 170 | 17 | 80 | 12 | 5 |
| forest | Bãi Ma Trơi Sét | Storm Wisp | 12 | ranged | 217 | 20 | 90 | 14 | 4 |
| forest | Bãi Cáo Lửa | Ember Fox | 14 | normal | 312 | 24 | 95 | 15 | 4 |
| forest | Bãi Nấm Giận Dữ | Angry Mushroom | 16 | elite | 824 | 35 | 258 | 35 | 3 |
| forest | Bãi Orc Gió Lốc | Gale Orc | 18 | elite | 973 | 38 | 278 | 40 | 3 |

## Trùm
| Trùm | Map | Thức dậy ở cấp | Máu | Công | EXP lần đầu |
|---|---|---|---|---|---|
| Slime King | village | 4 | 717 | 16 | 351 |
| Ancient Golem | forest | 19 | 2752 | 41 | 1229 |
| Mushroom Queen | forest | 17 | 2427 | 37 | 1112 |
| Captain Octopus | harbor | 9 | 1280 | 24 | 644 |

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
