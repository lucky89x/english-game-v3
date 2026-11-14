# Runtime asset manifest (everything the browser downloads)

| File | Size | Use |
|---|---|---|
| `vendor/three.module.min.js` | 0.69 MB | renderer |
| `vendor/addons/loaders/GLTFLoader.js`, `utils/BufferGeometryUtils.js` | 0.14 MB | model loading, geometry merge |
| `assets/models/chr_ngoc_adventurer_v02.glb` | 1.79 MB | Ngọc, 10 animations |
| `assets/models/npc_tom_elder_v02.glb` | 1.11 MB | Tom |
| `assets/models/npc_sam_fisherman_v02.glb` | 0.99 MB | Sam |
| `assets/models/npc_pip_spirit_v02.glb` | 0.12 MB | Pip |
| `assets/models/bld_cottage_red_v02.glb` | 0.59 MB | woodcutter's cottage |
| `assets/models/prop_bridge_curved_v02.glb` | 0.34 MB | two bridges |
| `assets/models/prop_forest_gate_v02.glb` | 0.19 MB | forest gate (both regions) |
| `assets/models/bld_hall_blue_v02.glb` | 1.40 MB | Tom's village hall |
| `assets/models/bld_shop_orange_v02.glb` | 0.81 MB | shop |
| `assets/models/bld_house_blue_v02.glb` | 0.84 MB | house |
| `assets/models/npc_ben_merchant_v02.glb` | 0.92 MB | Ben |
| `assets/tex/ngoc_face_{blink,talk,joy}.png` | 3 × 1024 px | facial expressions |
| `data/learning/*.json` | 49 files, about 0.2 MB | curriculum (12 files of the chosen grade are fetched) |
| `src/**/*.js`, `index.html` | about 0.1 MB | game code |

Everything else (terrain, river, waterfall, trees, rocks, grass, flowers, cobbles, fences, ancient tree, ruins, cave, mushrooms, camp, tower, mountains, sky, sounds) is generated in code. `vendor/addons/utils/SkeletonUtils.js` is present but not loaded.
Exact per-file bytes of the last test run: `docs/measurements.json`.
