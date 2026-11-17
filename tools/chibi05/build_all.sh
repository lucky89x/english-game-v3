#!/usr/bin/env bash
# Rebuilds every Blender-made model of the web game and copies the results into assets/.
#   PY=/path/to/python-with-bpy tools/chibi05/build_all.sh [ngoc|friends|npcs|houses|props ...]
# Needs: pip install bpy==4.2.0 pillow numpy (Python 3.11). Each model takes 5-40 s on a CPU.
# Triangles: hero 60 %, other characters 45 %, houses 50 % (CHIBI_DECIMATE). Contact shadows are baked into
# vertex colours by bake_ao.py. Lily, Rose and Anna share Ngọc's skeleton and play her clips in the game
# (CHIBI_NO_ANIM), so their files carry no animations. Nothing is written outside OUT and assets/.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/../.." && pwd)"
PY="${PY:-python}"; OUT="${OUT:-$(mktemp -d)}"; WHAT="${*:-ngoc friends npcs houses props}"
mkdir -p "$OUT/tools"; rm -rf "$OUT/tools/chibi05"; cp -r "$HERE" "$OUT/tools/chibi05"
export NGOC_ROOT="$OUT"; cd "$OUT"
run() { "$PY" "$@" 2>&1 | grep -E "Traceback|Error:|exported|decimated|baked" | grep -v Draco || true; }
for w in $WHAT; do case "$w" in
  ngoc)    CHIBI_DECIMATE=0.6 run tools/chibi05/build_ngoc_v03.py ;;
  friends) for v in lily rose anna; do CHIBI_NO_ANIM=1 CHIBI_DECIMATE=0.45 NGOC_VARIANT=$v run tools/chibi05/build_ngoc_v03.py; done ;;
  npcs)    CHIBI_DECIMATE=0.45 run tools/chibi05/build_tom_chibi.py; for v in sam ben forge; do CHIBI_DECIMATE=0.45 run tools/chibi05/build_villager_chibi.py -- $v; done; run tools/chibi05/build_pip_chibi.py ;;
  houses)  CHIBI_AO_STRENGTH=0.3 CHIBI_DECIMATE=0.5 run tools/chibi05/build_houses_chibi.py cottage_red hall_blue house_blue shop_orange ;;
  props)   CHIBI_AO_STRENGTH=0.3 run tools/chibi05/build_props_chibi.py ;;
  *) echo "unknown target: $w" >&2; exit 2 ;;
esac; done
# copy only the models the game loads, and Ngọc's face textures
for f in $(ls "$REPO/assets/models"); do src=$(find "$OUT/assets" -name "$f" | head -1); [ -n "$src" ] && cp "$src" "$REPO/assets/models/$f"; done
for n in blink talk joy; do src=$(find "$OUT/assets" -name "ngoc_face_$n.png" | head -1); [ -n "$src" ] && cp "$src" "$REPO/assets/tex/"; done
"$PY" - "$REPO" <<'PYEOF'
import json, struct, sys, glob, os
bad = 0
for f in sorted(glob.glob(sys.argv[1] + '/assets/models/*.glb')):
    b = open(f, 'rb').read(); j = json.loads(b[20:20 + struct.unpack('<I', b[12:16])[0]])
    anims, skins = len(j.get('animations', [])), len(j.get('skins', []))
    ao = all('COLOR_0' in p['attributes'] for m in j['meshes'] for p in m['primitives'])
    rigged = os.path.basename(f).startswith(('chr_', 'npc_')) and 'pip' not in f
    shared = any(n in f for n in ('lily', 'rose', 'anna'))
    flag = '' if (not rigged or (skins == 1 and (shared or anims >= 5))) else '   <-- LOST SKIN OR ANIMATIONS'
    bad += bool(flag)
    print(f'{os.path.basename(f):34s} {len(b) / 1048576:5.2f} MB  anims {anims:2d}  skin {skins}  AO {"yes" if ao else "no "}{flag}')
sys.exit(1 if bad else 0)
PYEOF
