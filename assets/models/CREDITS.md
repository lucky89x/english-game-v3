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

## Map 2 "Sunny Harbor" (tự dựng, không cần ghi công)

21 file `harbor_*_v01.glb` do dự án tự dựng bằng script, không dùng mô hình ngoài:
container 4 màu, tàu hàng, hải đăng, ghế cầu tàu, cọc buộc dây, đèn cầu tàu, chồng thùng, lưới cá, cẩu giàn,
ma-nơ-canh (4 object), đồ cửa hàng (4 object), 3 nhà (boutique, cafe, salon), quái cua/sứa/cướp biển và boss bạch tuộc
(có xương, clip "Idle" và "Walk"). Mặt trước hướng +Z glTF; vật liệu phát sáng tên `light_*`, kính `glass`.
Dựng lại: `OUT=<thư mục> blender -b -P tools/harbor/build_harbor.py` (tùy chọn `ONLY=harbor_crane,…`);
ảnh xem trước: `tools/harbor/preview.py`, kiểm hoạt ảnh: `tools/harbor/check_anim.py`.

## Nhân vật dựng lại (tự dựng, không cần ghi công)

`chr_ngoc_adventurer_v04.glb` (6 kiểu tóc, vật liệu `_tint`) và `npc_lily_druid_v02.glb`, `npc_rose_baker_v02.glb`, `npc_anna_bard_v02.glb` dựng bằng `tools/chibi05/build_ngoc_v03.py` (qua `tools/chibi05/build_all.sh ngoc friends`).

## Phụ kiện, thú cưng, đảo, nội thất (tự dựng, không cần ghi công)

- `acc_*_v01.glb` (8 phụ kiện đặt sẵn trên Ngọc): `tools/acc/build_acc.py`
- `pet_gull_v01.glb`, `pet_otter_v01.glb`, `pet_crab_v01.glb`: `tools/pets/build_pets.py`
- `isle_*_v01.glb`, `isle_palm_v02.glb`: `tools/isle/build_isle.py`
- `home_*_v01.glb`, `yard_*_v01.glb`: `tools/home/build_home.py`
- Ảnh `assets/ui/dex_*.png` (18 sinh vật): `tools/sprites/dex.py`

Lệnh chung: `OUT=<thư mục> blender -b -P <script>` (tùy chọn `ONLY=tên,tên`).

## Quái Map 1 (tự dựng, không cần ghi công)

8 file `mob_*_v01.glb`, `boss_*_v01.glb` (slime xanh/đỏ, golem đá, Vua Slime, Golem Cổ, dơi bóng tối, nấm giận dữ, Nữ hoàng Nấm): `tools/mobs1/build_mobs1.py`.

## Trang bị lô 14 (tự dựng): `gear_*_v01.glb` — `tools/gear/build_gear.py`.

## Đồ tương tác lô 15 (tự dựng): `prop_chest_locked`, `prop_star`, `prop_crystal`, `npc_owl`, `prop_board_quest`, `prop_word_jar` — `tools/pickups/build_pickups.py`.

## Thiên nhiên lô 16 (tự dựng): `nat_*_v01.glb` — `tools/nature/build_nature.py`.

## Đồ làng lô 17 (tự dựng): `vil_*_v01.glb` — `tools/village/build_village.py`.

## Đồ rừng lô 18 (tự dựng): `for_*_v01.glb` — `tools/forest/build_forest.py`.

## Vũ khí/giáp/bùa theo hệ lô 20 (tự dựng): `weapon_*`, `armor_*`, `acc_amulet_*` — `tools/gear/build_gear2.py`; ảnh `assets/ui/item_*.png` — `tools/sprites/icons.py`.

## Hiệu ứng phép lô 21 (tự dựng): `fx_*_v01.glb` — `tools/fx/build_fx.py`; biểu tượng `assets/ui/skill_*.png` — `tools/fx/skill_icons.py`.

## Nhân vật lô 19 (tự dựng): `chr_ngoc_adventurer_v05.glb`, `chr_ban_nam_v01.glb` — `tools/chibi05/build_ngoc_v03.py`; trang sức `acc_necklace/earrings/tiara/hairclip` — `tools/acc/build_acc.py`.

## Quái hệ lô 22B (tự dựng): `mob_{wisp_thunder,fox_ember,gull_storm,seal_frost,scorpion_sand,djinn_dust,cactus_spark,fox_moon}_v01`, `boss_sand_dragon_v01` — `tools/mobs3/build_mobs3.py`; boss `_v02` từ `tools/mobs1/build_mobs1.py` và `tools/harbor/b5_mobs.py`.

## Cốt truyện lô 23 (tự dựng): `npc_hush_lord`, `mob_hush_wraith`, `prop_compass_*`, `prop_magic_door` — `tools/story/build_story.py`; `npc_mia_tailor_v01` — `tools/chibi05/build_ngoc_v03.py`; ảnh `rank_*`, `compass_piece_*`, `badge_word_keeper` — `tools/story/icons_story.py`.
