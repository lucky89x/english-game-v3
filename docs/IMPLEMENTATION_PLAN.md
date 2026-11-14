# Implementation plan

## Done (milestone 0, this branch)
Engine shell (renderer, sky, light, fog, quality presets, perf panel) · map data as single source (`core/layout.js`) · collision + A* · player with real animations, blink, expressions · orbit camera with collision · Forest of Memories scenery · quest with graded clues, hints, decoys, review challenge, ending · multi-profile versioned saves with export/import · minimap travel · synth sound · 13 logic tests + 39 real-browser checks.

## Next batches (in order)
1. **Starter Village in the browser**: layout from the Godot `village_layout.gd`, houses as compressed GLB, square, market, dock, both bridges, forest gate; port Lost Letter, Word Jars, Bridge Repair; connect village → forest.
2. **Chapter I story chain**: arrival, footprints, language symbol, festival, chapter review, unlock; target 45–90 min.
3. **Characters**: Ben; Lily, Rose, Anna and travellers; Ngọc v03 per the turnaround sheet; NPC schedules.
4. **Learning**: later encounters that ask due words; listening with generated audio (replay, slow); sentence building.
5. **Art pass**: Blender hero props, bloom on magic objects, tree LOD, interiors (hall, shop, cottage).
6. **Release**: GLB Meshopt + KTX2, FPS on a real school computer, GitHub Pages workflow.
