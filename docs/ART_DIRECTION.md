# Art direction

Target: the warm chibi fantasy paintings supplied by the owner (forest map: waterfall cliff, winding river, arched bridges, ancient tree with lanterns, ruins with a crystal, crystal cave, giant red mushrooms, camp, watchtower, cobbled paths with fences and lamps).

- Palette: sky `#2880f2 → #bde6ff`, grass `#58b535 / #86d44a`, water `#0d80b8 → #4ddbe6` with white foam, path `#e9d29c`, roofs/mushrooms `#db3a2c`, wood `#9a6436`, stone `#9b99a8`, glow `#ffc45a` (lanterns) and `#58c8ff` (crystals).
- Light: one warm sun with soft shadows, sky/ground hemisphere light, linear fog 70–330 m in sky colour, Neutral tone mapping (keeps saturation; no bloom pass yet).
- Shapes: rounded canopies (smooth-shaded lumpy spheres), stacked-cone pines, faceted rocks, big readable landmarks.
- Motion: wind on trees and grass, flowing water, waterfall with mist, flickering campfire, floating crystals, butterflies/fireflies, drifting clouds.

## How models are made (tools/chibi05)
1. A Python script builds each model from rounded primitives and swept curves (no sculpting), colours come from a 16x16 palette texture, faces are painted textures.
2. `CHIBI_DECIMATE` halves the triangles (hero 60 %, others 45–50 %).
3. `bake_ao.py` bakes contact shadows into vertex colours with Cycles: creases go towards a warm plum, open surfaces stay clean. Characters use strength 0.6, houses 0.3 (flat walls have too few vertices for more), painted faces are left untouched.
4. `build_all.sh` runs everything, copies into `assets/models`, and fails if a character lost its skin or clips.
Lessons kept: hair must be a few large locks in one tone (many small beads in three browns read as grapes); a strong sun burns out skin, so the scene uses a high sky/ground fill, a gentler sun and a cool rim light.

## Honest gap to the reference
- Shapes come from primitives: no sculpted cheeks, fingers, cloth folds or hair strands. The paintings have all of these.
- Flat palette colours: no painted gradients, roof moss or wood grain. Vertex-colour shadows help but are per-vertex.
- No bloom, no reflections, no screen-space ambient occlusion (kept off for machines without a graphics card).
- Friends are Ngọc's body with other colours and props, not their own outfits.
Next art steps, in order of value: sculpt-quality hero mesh made by an artist or an image-to-3D service then retopologised; painted texture atlas instead of the palette; per-character outfits.
