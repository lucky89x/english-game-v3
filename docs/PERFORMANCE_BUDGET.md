# Performance budget and measurements

## Budget
- Initial download: target under 20 MB. **Measured 9.85 MB** (files actually requested during the end-to-end run, uncompressed).
- Triangles in view: under 700k on High, under 450k on Low. Draw calls under 150.
- Textures: none above 1024 px.

## Measured (2026-11-14, Chromium headless + SwiftShader (software GL, no GPU))
| Quality | FPS | Frame | Draw calls | Triangles |
|---|---|---|---|---|
| Low | 2.3 | 443.6 ms | 88 | 447,216 |
| Medium | 1.1 | 897.7 ms | 90 | 487,584 |
| High | 0.9 | 1159.2 ms | 90 | 538,336 |

**These FPS numbers are from a server with no graphics card (software rasteriser).** They show the relative cost of the presets, not what a child will see. FPS on a real desktop or school computer has not been measured; press F3 in the game to read it.
Measured at the forest riverside view.

## Quality presets
| | Low | Medium | High |
|---|---|---|---|
| Render scale | 0.6 × device | up to 1.0 | up to 1.5 |
| Sun shadows | off | 2048, 55 m | 4096, 85 m |
| Grass / flowers | 22% | 60% | 100% |
| Particles, mist | off | on | on |
| Far mountains | off | on | on |

## Known cost centres
Trees (about 420 instances, 3 draw calls) and shadows. Not done yet: LOD for far trees, frustum-culled chunks for grass, Meshopt/KTX2 compression of the GLBs.
