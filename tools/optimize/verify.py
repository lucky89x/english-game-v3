"""Check every GLB under assets/models that differs from a git revision (default HEAD): it still parses, and nothing changed that must not.
Run:  /workspace/.bpyenv/bin/python tools/optimize/verify.py [git revision]        (python 3 with pillow; run from the repository root)
For each changed file: triangles before -> after, images before -> after, and FAIL lines when
  - node / mesh / material names differ, or skins, joints, clip names or animation channels differ
    (a static model that went from several materials to one is reported as "atlas", not as a failure);
  - the bounding box moved by more than 2 % of its diagonal;
  - a file with bones had anything but its images changed (all non-image buffer data must be byte-identical);
  - a plants/ file lost COLOR_0 on a primitive.
Exit code 1 when any check fails."""
import sys, os, subprocess, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from glblib import read_glb, parse_glb, stats_of
REV = sys.argv[1] if len(sys.argv) > 1 else 'HEAD'
out = subprocess.run(['git', 'status', '--porcelain', '--', 'assets/models'], capture_output=True, text=True, check=True).stdout.splitlines()
changed = [l[3:].strip().strip('"') for l in out if l[:2].strip() in ('M', 'MM', 'AM') and l.strip().endswith('.glb')]
bad = 0; T0 = T1 = B0 = B1 = 0
for path in sorted(changed):
    old = subprocess.run(['git', 'show', '%s:%s' % (REV, path)], capture_output=True, check=True).stdout
    a = stats_of(*parse_glb(old)); b = stats_of(*read_glb(path)); fails = []
    merged = not a['skins'] and len(b['materials']) == 1 and b['prims'] < a['prims']      # a static model whose materials were baked into one atlas
    for k in ('nodes', 'meshes', 'materials', 'skins', 'joints', 'anims', 'channels', 'prims'):
        if a[k] != b[k] and not (merged and k in ('materials', 'prims')): fails.append('%s differ' % k)
    diag = math.dist(a['lo'], a['hi']) or 1; shift = max(max(abs(a['lo'][k] - b['lo'][k]), abs(a['hi'][k] - b['hi'][k])) for k in range(3)) / diag
    if shift > 0.02: fails.append('bounding box moved %.1f %%' % (shift * 100))
    if a['skins'] and a['data_hash'] != b['data_hash']: fails.append('rigged file: mesh / skin / clip data changed')
    if '/plants/' in path and b['color'] != b['prims']: fails.append('COLOR_0 missing')
    if a['uv'] and b['uv'] != b['prims']: fails.append('UV missing')
    im = lambda s: ','.join('%s %dx%d %dKB' % (f, w, h, n // 1024) for f, w, h, n in s['images']) or '-'
    s0, s1 = len(old), os.path.getsize(path); T0 += a['tris']; T1 += b['tris']; B0 += s0; B1 += s1
    print('%-4s %-52s tris %6d -> %6d | KB %5d -> %5d | bbox %.2f%% | img %s -> %s%s' % ('FAIL' if fails else 'ok', path.replace('assets/models/', ''), a['tris'], b['tris'], s0 // 1024, s1 // 1024,
          shift * 100, im(a), im(b), (' | ' + '; '.join(fails)) if fails else (' | materials %d -> 1 (atlas)' % len(a['materials'])) if merged else ''))
    bad += bool(fails)
print('%d files changed, %d failed | triangles %d -> %d | MB %.2f -> %.2f' % (len(changed), bad, T0, T1, B0 / 1048576, B1 / 1048576))
sys.exit(1 if bad else 0)
