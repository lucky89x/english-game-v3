# GitHub snapshot — 2026-11-04

This is the current EnglishQuestV3 Godot development project, not a final art release.

## Download and run

Install Git LFS before cloning:

```sh
git lfs install
git clone https://github.com/lucky89x/english-game-v3.git
cd english-game-v3
git lfs pull
```

Open project.godot in Godot 4.7.2, let imports finish, and press F5.
The configured main scene is world/main_world.tscn.
Blender is not required to play: runtime models are exported GLBs.
Blender authoring files are in art_source; generation scripts are in tools/redesign03.

## Current work and known limitations

Village houses are taller and spaced farther apart in the latest layout.
Character art is still work in progress and has not passed visual acceptance against the reference sheet.
The latest Ngoc proportion experiment shows overly elongated forearms in runtime captures; animation playback checks do not establish visual quality.
The current files are preserved as requested, including this unfinished character revision.
Existing third-party license files are retained; repository visibility does not change their licenses.

Godot cache, portable Blender installation, local backups, temporary captures and logs are intentionally excluded.
Large binary assets use Git LFS; downloading Git pointer files alone is not sufficient to run the project.

## Snapshot validation

2026-11-04: tests/smoke_test.gd passed on Godot 4.7.2 (MainWorld, terrain, zones, chest interaction, NPC, camera, inputs and compatibility scene). A Windows root certificate store warning appeared during the sandboxed run; the smoke checks completed successfully. No new graphical performance measurement was performed for this GitHub upload.
