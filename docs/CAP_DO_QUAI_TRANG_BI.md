# Cấp độ, bãi quái, trang bị (26/11)

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
| village | Bãi Hoa Ăn Thịt | Snap Flower | 1 | normal | 59 | 11 | 10 | 3 | 7 |
| village | Bãi Slime Nước | Water Slime | 2 | normal | 77 | 12 | 14 | 4 | 7 |
| village | Bãi Sói Bóng Tối | Shadow Wolf | 3 | ranged | 80 | 13 | 19 | 6 | 7 |
| village | Bãi Slime Đỏ | Red Slime | 4 | normal | 116 | 16 | 22 | 6 | 7 |
| village | Bãi Pha Lê Dung Nham | Magma Crystal | 5 | ranged | 116 | 16 | 27 | 8 | 7 |
| village | Bãi Golem Dung Nham | Lava Golem | 5 | elite | 299 | 23 | 65 | 15 | 3 |
| harbor | Bãi Cua Biển | Beach Crab | 5 | normal | 136 | 18 | 26 | 7 | 6 |
| harbor | Bãi Sứa Phát Sáng | Glow Jellyfish | 6 | ranged | 138 | 18 | 32 | 8 | 6 |
| harbor | Bãi Hải Âu Bão | Storm Gull | 8 | ranged | 183 | 21 | 40 | 10 | 6 |
| harbor | Bãi Cướp Biển Nhí | Little Pirate | 9 | elite | 543 | 33 | 105 | 22 | 5 |
| forest | Bãi Dơi Bóng Tối | Shadow Bat | 10 | ranged | 234 | 24 | 48 | 12 | 7 |
| forest | Bãi Ma Trơi Sét | Storm Wisp | 12 | ranged | 296 | 27 | 57 | 14 | 6 |
| forest | Bãi Cáo Lửa | Ember Fox | 14 | normal | 423 | 34 | 62 | 15 | 6 |
| forest | Bãi Nấm Khổng Lồ | Giant Mushroom | 16 | elite | 1109 | 49 | 175 | 35 | 6 |
| forest | Bãi Người Cây Cổ Thụ | Elder Treant | 18 | elite | 1304 | 54 | 195 | 40 | 5 |
| desert | Bãi Xương Rồng Tia Lửa | Spark Cactus | 20 | normal | 688 | 45 | 86 | 20 | 7 |
| desert | Bãi Bọ Cạp Cát | Sand Scorpion | 21 | normal | 743 | 47 | 90 | 21 | 7 |
| desert | Bãi Xương Rồng Sấm | Thunder Cactus | 22 | ranged | 679 | 44 | 99 | 24 | 7 |
| desert | Bãi Thần Gió Bụi | Dust Djinn | 23 | ranged | 721 | 45 | 103 | 25 | 6 |
| desert | Bãi Khủng Long Lửa | Fire Dino | 24 | elite | 2000 | 68 | 255 | 53 | 5 |
| mountain | Bãi Thỏ Tuyết | Snow Bunny | 25 | normal | 962 | 54 | 106 | 25 | 7 |
| mountain | Bãi Hải Cẩu Băng | Frost Seal | 26 | normal | 1026 | 56 | 110 | 25 | 7 |
| mountain | Bãi Ếch Gió | Wind Frog | 27 | ranged | 928 | 52 | 120 | 29 | 7 |
| mountain | Bãi Người Tuyết Yeti | Yeti | 28 | normal | 1150 | 59 | 118 | 27 | 6 |
| mountain | Bãi Golem Băng | Ice Golem | 29 | elite | 2618 | 79 | 305 | 62 | 5 |
| ruins | Bãi Ma Sấm | Thunder Ghost | 30 | ranged | 1037 | 57 | 132 | 32 | 7 |
| ruins | Bãi Cáo Trăng | Moon Fox | 31 | normal | 1260 | 65 | 130 | 30 | 7 |
| ruins | Bãi Bóng Câm | Hush Wraith | 32 | ranged | 1105 | 60 | 141 | 34 | 7 |
| ruins | Bãi Lốc Xoáy Nhỏ | Little Whirlwind | 33 | normal | 1330 | 68 | 138 | 32 | 6 |
| ruins | Bãi Rùa Đá Cổ | Stone Turtle | 34 | elite | 3014 | 91 | 355 | 73 | 5 |
| sky | Bãi Chim Gió | Wind Bird | 35 | normal | 1400 | 72 | 146 | 34 | 7 |
| sky | Bãi Mực Mây | Cloud Squid | 37 | ranged | 1258 | 68 | 162 | 39 | 7 |
| sky | Bãi Cáo Mặt Trời | Sun Fox | 39 | normal | 1550 | 79 | 162 | 37 | 7 |
| sky | Bãi Chim Bão | Storm Bird | 41 | ranged | 1377 | 74 | 179 | 43 | 6 |
| sky | Bãi Golem Bão | Storm Golem | 43 | elite | 3718 | 112 | 445 | 90 | 5 |
| fairy | Bãi Tiên Đom Đóm | Firefly Pixie | 45 | ranged | 1496 | 81 | 195 | 47 | 7 |
| fairy | Bãi Hoa Cắn | Petal Snapper | 46 | normal | 1800 | 92 | 190 | 43 | 7 |
| fairy | Bãi Ếch Sương | Dew Frog | 47 | ranged | 1564 | 84 | 204 | 48 | 7 |
| fairy | Bãi Nấm Nhảy | Hopping Mushroom | 48 | normal | 1870 | 95 | 198 | 45 | 6 |
| fairy | Bãi Người Cây Gai | Thorn Treant | 49 | elite | 4202 | 126 | 505 | 101 | 5 |
| volcano | Bãi Mảnh Dung Nham | Lava Shard | 50 | normal | 1940 | 99 | 206 | 47 | 7 |
| volcano | Bãi Cáo Lửa | Lava Fox | 51 | normal | 1980 | 101 | 210 | 48 | 7 |
| volcano | Bãi Dơi Tro | Ash Bat | 52 | normal | 2020 | 102 | 214 | 49 | 7 |
| volcano | Bãi Ma Trơi Tro | Ash Wisp | 53 | ranged | 1743 | 94 | 229 | 55 | 6 |
| volcano | Bãi Golem Nham Thạch | Lava Golem | 54 | elite | 4598 | 138 | 555 | 112 | 5 |
| crystal | Bãi Dơi Hang | Cave Bat | 55 | normal | 2120 | 108 | 226 | 52 | 7 |
| crystal | Bãi Slime Đá Quý | Gem Slime | 56 | normal | 2160 | 110 | 230 | 52 | 7 |
| crystal | Bãi Đốm Sáng | Glow Wisp | 57 | ranged | 1870 | 100 | 246 | 58 | 7 |
| crystal | Bãi Tinh Thể Vọng | Echo Crystal | 58 | ranged | 1896 | 102 | 250 | 59 | 6 |
| crystal | Bãi Golem Pha Lê | Crystal Golem | 59 | elite | 4994 | 150 | 605 | 121 | 5 |
| city | Bãi Drone Tia Điện | Spark Drone | 60 | ranged | 1955 | 105 | 258 | 62 | 7 |
| city | Bãi Robot Bánh Xe | Wheel Bot | 61 | normal | 2340 | 119 | 250 | 57 | 7 |
| city | Bãi Robot Hộp | Box Bot | 62 | normal | 2380 | 120 | 254 | 58 | 7 |
| city | Bãi Drone Laser | Laser Drone | 63 | ranged | 2049 | 110 | 271 | 65 | 6 |
| city | Bãi Robot Canh Gác | Guard Bot | 64 | elite | 5390 | 161 | 655 | 132 | 5 |
| dream | Bãi Dơi Ác Mộng | Nightmare Bat | 65 | normal | 2480 | 126 | 266 | 61 | 7 |
| dream | Bãi Cáo Mộng | Dream Fox | 66 | normal | 2520 | 128 | 270 | 61 | 7 |
| dream | Bãi Bóng Thì Thầm | Whisper Shade | 67 | ranged | 2176 | 116 | 288 | 68 | 7 |
| dream | Bãi Ma Ngủ Gật | Sleepy Ghost | 68 | ranged | 2202 | 118 | 292 | 69 | 6 |
| dream | Bãi Golem Ác Mộng | Nightmare Golem | 69 | elite | 5786 | 173 | 705 | 141 | 5 |

## Trùm
| Trùm | Map | Thức dậy ở cấp | Máu | Công | EXP lần đầu |
|---|---|---|---|---|---|
| Slime King | village | 4 | 845 | 22 | 1061 |
| Captain Octopus | harbor | 9 | 1520 | 34 | 2291 |
| Mushroom Queen | forest | 17 | 2907 | 52 | 4212 |
| Ancient Golem | forest | 19 | 3302 | 56 | 4644 |
| Sand Dragon | desert | 24 | 4410 | 67 | 5724 |
| Ice Dragon | mountain | 29 | 5466 | 79 | 6804 |
| Stone Giant | ruins | 34 | 6272 | 90 | 7884 |
| Sun Dragon | sky | 44 | 7885 | 112 | 10044 |
| Thorn Queen | fairy | 49 | 8691 | 124 | 11124 |
| Magma Titan | volcano | 54 | 9498 | 135 | 12204 |
| Crystal Dragon | crystal | 59 | 10304 | 146 | 13284 |
| Iron Warden | city | 64 | 11110 | 157 | 14364 |
| Lord Hush | dream | 69 | 11917 | 169 | 15444 |

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
