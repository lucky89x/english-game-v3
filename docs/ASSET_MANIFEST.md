# Asset manifest

Every model is built by the scripts in `tools/chibi05/` (`build_all.sh`); nothing is third-party. Contact shadows are baked into vertex colours. Table generated from the files.

| File | Size | Triangles | Clips | Used for |
|---|---|---|---|---|
| `bld_cottage_red_v02.glb` | 0.42 MB | 15,082 | 0 | nhà mái đỏ (làng, rừng) |
| `bld_hall_blue_v02.glb` | 0.95 MB | 34,032 | 0 | nhà trưởng làng |
| `bld_house_blue_v02.glb` | 0.58 MB | 20,638 | 0 | nhà mái xanh |
| `bld_shop_orange_v02.glb` | 0.56 MB | 19,940 | 0 | cửa hàng |
| `chr_ngoc_adventurer_v03.glb` | 1.53 MB | 28,851 | 10 | Ngọc (v03) |
| `npc_anna_bard_v01.glb` | 0.94 MB | 21,821 | 0 | Anna (dùng hoạt ảnh của Ngọc) |
| `npc_ben_merchant_v02.glb` | 0.60 MB | 10,383 | 5 | Ben |
| `npc_forge_blacksmith_v01.glb` | 0.59 MB | 10,143 | 5 | Bram (cửa hàng rèn) |
| `npc_lily_druid_v01.glb` | 0.95 MB | 22,045 | 0 | Lily (dùng hoạt ảnh của Ngọc) |
| `npc_pip_spirit_v02.glb` | 0.13 MB | 2,624 | 0 | Pip |
| `npc_rose_baker_v01.glb` | 0.94 MB | 22,011 | 0 | Rose (cửa hàng bánh; dùng hoạt ảnh của Ngọc) |
| `npc_sam_fisherman_v02.glb` | 0.65 MB | 10,962 | 5 | Sam |
| `npc_tom_elder_v02.glb` | 0.68 MB | 12,162 | 5 | Tom |
| `prop_bridge_curved_v02.glb` | 0.39 MB | 14,320 | 0 | cầu (mọi cầu) |
| `prop_forest_gate_v02.glb` | 0.22 MB | 8,048 | 0 | cổng rừng |

Total models: 10.12 MB. Textures: `assets/tex/ngoc_face_{blink,talk,joy}.png` (face swaps). Everything else (terrain, trees, water, props, creatures, monsters) is generated in `src/world/` (common.js, village.js, forest.js) and `src/game/*.js`.

Sound: synthesised at run time (`src/audio.js`), no audio files. Code: three.js, vendored in `vendor/` (MIT).
