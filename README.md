# EnglishQuestV3 - Godot 3D foundation

Technical foundation for a PC 3D game made with Godot 4 and GDScript.

## Run

1. Open Godot Project Manager and import this folder by selecting `project.godot`.
2. Open `world/main_world.tscn` if it is not already open.
3. Press **F6** to run only that scene, or **F5** to run the configured project.

## Controls

- **WASD**: move relative to the camera
- **Shift**: run
- **Space**: jump
- **Hold right or left mouse + drag**: orbit the camera 360 degrees
- **R**: reset camera; sensitivity is exposed on OrbitCamera
- **F1**: help; **F3**: development FPS
- **Mouse wheel**: zoom
- **E**: interact with a nearby NPC

## Structure

- `world/`: world scenes, terrain and level geometry
- `characters/`: player and reusable character scenes
- `npc/`: future NPC scenes and behavior composition
- `assets/`: imported high-quality character, NPC and environment source assets
- `scripts/`: reusable GDScript controllers
- `ui/`: user interface scenes
- `systems/`: future game-wide systems (save, quests, audio, dialogue)

The placeholder mesh lives under `Player/VisualRoot`. Replace or hide it and instance a future character model under `AssetSocket`; keep the `CharacterBody3D`, collision shape and controller intact.

## Fantasy village prototype

`world/village/fantasy_village.tscn` uses the CC0 Quaternius Stylized Nature and Medieval Village glTF assets found directly under `assets/`. It contains three modular houses, dirt paths, trees, fences, rocks, flowers, a pond, a modular wooden bridge and an interactive elder NPC point.

The newly supplied Ultimate Modular Women pack now provides Adventurer (62 bones), with Idle/Walk/Run and Interact/Wave. The capsule mesh is hidden; its collision remains. RPG Characters provides Wizard as the elder visual with Idle. Dedicated Jump/Fall/Land/Talk/Celebrate clips and an avatar portrait are still missing. The RPG HUD uses explicitly requested sample statistics; it does not represent saved learning progress. See artifacts/skills_upgrade/REPORT.md for current validation.
