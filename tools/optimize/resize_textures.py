"""Shrink the textures embedded in GLB files WITHOUT touching anything else (meshes, bones, clips, materials stay byte-identical):
the image bytes inside the BIN chunk are replaced by a smaller JPEG/PNG and the bufferView offsets are laid out again.
No Blender: a Blender import/export of a rigged, animated character can lose its skin (see CLAUDE.md "Bẫy đã gặp").
Run:  /workspace/.bpyenv/bin/python tools/optimize/resize_textures.py <max px> <file.glb> [<file.glb> ...]      (any python 3 with pillow)
      add DRY=1 in the environment to only print what would change.
Images whose longest side is already <= max px are left alone. JPEG stays JPEG (quality 88), PNG stays PNG (so alpha is kept)."""
import sys, os, io
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from glblib import read_glb, write_glb, view_bytes, rebuild
from PIL import Image

MAX = int(sys.argv[1]); DRY = bool(os.environ.get('DRY')); Q = int(os.environ.get('QUALITY', 88))

def shrink(b):
    im = Image.open(io.BytesIO(b)); fmt = im.format; w, h = im.size
    if max(w, h) <= MAX: return None
    k = MAX / max(w, h); size = (max(1, round(w * k)), max(1, round(h * k))); im = im.resize(size, Image.LANCZOS); out = io.BytesIO()
    if fmt == 'JPEG': im.convert('RGB').save(out, 'JPEG', quality=Q, optimize=True, subsampling=0 if Q >= 90 else 1)
    elif fmt == 'PNG': im.save(out, 'PNG', optimize=True)
    else: return None                                     # webp / ktx2: not handled, leave as it is
    return out.getvalue(), fmt, (w, h), size

total0 = total1 = 0
for path in sys.argv[2:]:
    js, binc = read_glb(path); rep = {}; notes = []; used = {}
    for im in js.get('images', []):
        if 'bufferView' not in im: continue
        bv = im['bufferView']; used[bv] = used.get(bv, 0) + 1
    for i, im in enumerate(js.get('images', [])):
        if 'bufferView' not in im: continue
        bv = im['bufferView']
        if bv in rep: continue
        r = shrink(view_bytes(js, binc, bv))
        if not r: continue
        data, fmt, a, b = r; rep[bv] = data; notes.append('%s %dx%d -> %dx%d' % (fmt, a[0], a[1], b[0], b[1]))
    s0 = os.path.getsize(path); total0 += s0
    if not rep: total1 += s0; print('SAME  ', path); continue
    if DRY: total1 += s0; print('WOULD ', path, '; '.join(notes)); continue
    newbin = rebuild(js, binc, rep); write_glb(path, js, newbin); s1 = os.path.getsize(path); total1 += s1
    print('DONE  ', path, '; '.join(notes), '| KB %d -> %d' % (s0 // 1024, s1 // 1024))
print('TOTAL MB %.2f -> %.2f' % (total0 / 1048576, total1 / 1048576))
