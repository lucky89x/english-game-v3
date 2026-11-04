# EnglishQuestV3 Asset Catalog

## Latest update — character packs now present

The earlier missing-character notes below describe the previous inventory. The new inventory contains 390 glTF and 553 FBX files. Ultimate Modular Women/Individual Characters/glTF/Adventurer.gltf is now instanced in the main player scene (62 bones; Idle, Walk, Run, Interact, Wave). RPG Characters/glTF/Wizard.gltf is instanced in the elder NPC scene (32 bones; Idle). See artifacts/skills_upgrade/REPORT.md for remaining animation and art gaps.

This catalog records the imported packs that are suitable for later maps. Prefer the `glTF` versions in Godot; the FBX/OBJ folders are source alternatives and should not be instanced in parallel.

## Nature

- `assets/glTF`: lightweight stylized trees, pine trees, rocks, flowers, grass, mushrooms, pebbles and stone-path pieces.
- `assets/Ultimate Stylized Nature - May 2022-20261102T070539Z-1-001/Ultimate Stylized Nature - May 2022/glTF`: expanded maple, birch, normal, pine and palm tree families plus bushes, flowers, grass and rocks. Use this pack for forest edges and landscape variety.

## Village architecture

- `assets/Medieval Village MegaKit[Standard]/glTF`: modular walls, roofs, doors, windows, stairs, balconies, fences, vines, crates, wagon and architectural trims. Use this pack to build reusable house variants instead of one-off meshes.

## Props and set dressing

- `assets/Exports/glTF`: market stalls, carts, barrels, crates, furniture, forge props, books, containers, banners, lanterns, tools, weapons, food and small interior props.
- `world/props/market_square.tscn`: reusable market cluster assembled from this pack for village maps.

## Characters and NPCs

- `assets/characters`: currently contains only a placeholder marker.
- `assets/npc`: currently contains only a placeholder marker.
- No rigged humanoid with Idle, Walk and Run clips was detected as of 2026-11-02. Add future character files here in `.glb` or `.gltf` format and keep their skeleton and animation clips embedded.
- The only animated model currently present is `Exports/glTF/Chest_Wood.gltf`; its skeleton is a mechanical lid rig with `Chest_Open`, `Chest_Opened`, `Chest_Close` and `Chest_Closed`, not a humanoid character.

## Reference art

- The supplied PNG concepts are currently located in `assets/assets/reference_art` because the imported archive contains an extra nested `assets` directory.
- Treat them only as art direction for palette, proportions and silhouettes. Never use them as planes or billboards to claim a finished 3D character.
- Detailed audit: `assets/ASSET_AUDIT_2026-11-02.md`.

## Import notes

- Keep original texture folders beside their glTF files.
- Do not rename or move source textures after Godot imports a pack.
- Prefer one source format per asset to avoid duplicate imports and larger project scans.
- Validate scale, forward direction, materials, skeleton and animation names before adding an asset to a reusable scene.
