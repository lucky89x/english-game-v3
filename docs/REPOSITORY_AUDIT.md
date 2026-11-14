# Repository audit (Godot project `lucky89x/english-game-v3`, branch `claude/adoring-wozniak-7dif4v`)

Audited once on 2026-11-13; binary files were listed by size, not re-read.

## Reused in the web build
| What | Source in the Godot repo | Use here |
|---|---|---|
| Curriculum data, stable ids `g6_u01`… | `data/learning/*.json` (48 units, 1,385 words) | copied to `data/learning/`, read by `src/core/catalog.js` |
| Ngọc (skinned, 10 clips, face textures) | `assets/characters/models/chr_ngoc_adventurer_v02.glb` 1.8 MB | player |
| Tom, Sam, Pip | `assets/npc/models/npc_*_v02.glb` 1.1 / 1.0 / 0.1 MB | NPCs |
| Curved bridge, cottage, forest gate | `assets/environment/village/models/*_v02.glb` | landmarks |
| Story | CLAUDE.md "Bí mật La Bàn Ngôn Ngữ", 8 regions | `src/game/content.js` OUTLINE |
| Quest logic worth keeping | lost letter, word jars (decoys, wrong answer explains), bridge repair (order steps), Leitner review, per-child profiles | same rules re-implemented in `src/core/review.js`, `save.js`, `src/game/quest.js` |

## Not shipped (too large or not needed)
- Whole Godot repo: about 1.3 GB in Git LFS, 1,739 LFS files. Third-party packs (`assets/Medieval Village MegaKit`, `Ultimate Stylized Nature`, `RPG Characters`, FBX/OBJ duplicates of the same models), `.blend` sources, 2K textures.
- Detailed tree GLBs (0.7–1.0 MB each): replaced by procedural instanced trees.
- Reference paintings (`assets/assets/reference_art/`, user uploads): used as art direction only, never as textures or models.

## Missing content
- Grammar and pronunciation for most units; readings exist only for unit 1 of grades 6 and 8.
- Recorded or generated voice: none.
- Models for Ben (not used yet), Lily, Rose, Anna, new characters from the reference sheets.
- Web versions of Chapter I quests (letter, word jars, bridge repair).

## Licences / attribution
- three.js r170, MIT (`vendor/THREE_LICENSE`).
- Character, bridge, cottage, gate models: made for this project with `tools/chibi05` Blender scripts.
- Vocabulary: owner's notes (grades 6, 8) and VietJack word lists (grades 7, 9); word + meaning only. Quest texts are original.
