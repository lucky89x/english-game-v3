"""Cut the triangle count of the plant pack (assets/models/plants/*.glb: vertex-coloured meshes, no textures, no bones).
Run:  <python with bpy 4.2> tools/optimize/decimate_plants.py -- <dir with the ORIGINAL files> <out dir> [name,name,...]
  e.g. originals:  mkdir /tmp/plants0 && for f in $(git ls-files assets/models/plants); do git show c1cab93:$f > /tmp/plants0/$(basename $f); done
       then:       /workspace/.bpyenv/bin/python tools/optimize/decimate_plants.py -- /tmp/plants0 assets/models/plants
Blender only welds and decimates. The file is then written by this script from the ORIGINAL glTF JSON (same nodes, node names, translations,
material, mesh names; only POSITION / NORMAL / COLOR_0 / indices are replaced), so nothing the game looks up by name can change:
src/world/foliage.js finds the mesh node named "Plant", plants.js and homes.js load the files by name.
A file already under its budget is copied unchanged."""
import bpy, bmesh, sys, os, math, struct, shutil
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from glblib import read_glb, write_glb

a = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT = a[0], a[1]
ONLY = set(a[2].split(',')) if len(a) > 2 else None

def budget(name):
    if name.startswith('grass_') or name.startswith('clover'): return 200
    if name.startswith('fern_') or name in ('dandelion', 'wild_herb', 'herb_bundle'): return 300
    if name.startswith('bush_'): return 600
    if name.startswith('tree_'): return 1500
    return 800                                            # vegetables, fruit, crates, baskets
# files with several meshes: the share of the budget that goes to the leafy mesh "Plant" (the rest is split between the fruit / berry meshes).
# In the game foliage.js replaces "Plant" of trees and bushes by a crown made in code, so the fruit is what is really drawn from these files.
PLANT_SHARE = {'tree_apple': 0.66, 'bush_red_berries': 0.4, 'corn_plant_ripe': 0.5}
SHARP = math.radians(65)                                  # edges sharper than this stay hard (crate boards), the rest is smooth
SPREAD = 1.8                                              # a group of tiny solid pieces becomes one shell only if the shell is not much bigger than the pieces
SALIENT = 8                                               # how much a piece whose colour differs from the plant's mean colour counts (petals, berries)

def tri_count(me): return sum(len(p.vertices) - 2 for p in me.polygons)

def directions(n, min_elev):
    """n view directions spread over the sphere above the elevation `min_elev` (radians), Blender axes (Z up)."""
    out, i = [], 0
    while len(out) < n:
        z = 1 - 2 * (i + 0.5) / (n * 4); a = i * 2.399963; i += 1
        if i > n * 40: break
        if math.asin(max(-1, min(1, z))) < min_elev: continue
        r = math.sqrt(max(0, 1 - z * z)); out.append(Vector((math.cos(a) * r, math.sin(a) * r, z)))
    return out

def measure(o):
    """One loose piece: triangles, area, visible area, mean visible colour, size, and the fewest triangles that still give it a shape."""
    m = o.data; va = m.attributes['vis'].data; col = m.color_attributes[0].data; sa = m.attributes.get('solid'); solid = bool(sa and len(m.polygons) and sa.data[0].value > 0.5); A = V = 0.0; N = Vector((0, 0, 0)); C = Vector((0, 0, 0)); Call = Vector((0, 0, 0))
    for p in m.polygons:
        a = p.area; A += a; w = a * va[p.index].value; V += w; N += p.normal * a
        for li in p.loop_indices: c = col[li].color; c = Vector((c[0], c[1], c[2])); C += c * (w / 3); Call += c * (a / 3)
    co = np.empty(len(m.vertices) * 3, dtype=np.float32); m.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
    lo, hi = co.min(axis=0), co.max(axis=0); d = float(np.linalg.norm(hi - lo))
    if len(co) > 3: w, vec = np.linalg.eigh(np.cov((co - co.mean(axis=0)).T)); ev = w[::-1]; axis = vec[:, 0]      # axis: the direction the piece is thinnest in
    else: ev = np.array([1.0, 1.0, 1.0]); axis = np.array([0.0, 0.0, 1.0])
    thin = ev[0] > 0 and math.sqrt(max(ev[1], 0) / ev[0]) < 0.15            # a stem, a strand of a basket: a strip is enough
    flat = N.length / A if A > 0 else 1                                       # 1 = a flat card, 0 = a closed solid
    wiry = solid and not thin and A > 0 and d * d / A > 3                    # a bent rod: a basket handle, a hoop of wickerwork
    hoop = wiry and ev[0] > 0 and ev[2] / ev[0] < 0.02 and ev[1] / ev[0] > 0.3
    need = 3 if thin else 6 if wiry else 8 if solid else 2 if flat >= 0.75 else 2 + round(6 * (0.75 - flat) / 0.75)
    return dict(ob=o, n=len(m.polygons), A=A, V=V, C=(C / V if V > 0 else Call / (A or 1e-9)), d=d, lo=lo, hi=hi, thin=thin, flat=flat, solid=solid, hoop=hoop, axis=axis, need=need,
                size=max(A, 0.15 * d * d) * (2 if wiry else 1), frac=(V / A if A > 0 else 0))

def gap(p, q):
    """Distance between the bounding boxes of two pieces."""
    return float(np.linalg.norm(np.maximum(0, np.maximum(p['lo'] - q['hi'], q['lo'] - p['hi']))))

def hull(objs, open_axis=None):
    """Joins the pieces and replaces them by their convex hull; every hull corner keeps the colour that vertex had."""
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join(); o = bpy.context.view_layer.objects.active; me = o.data
    bm = bmesh.new(); bm.from_mesh(me); cl = bm.loops.layers.color.active or bm.loops.layers.color[0]; vl = bm.faces.layers.float.get('vis'); sl = bm.faces.layers.float.get('solid')
    vc = {v: tuple(v.link_loops[0][cl]) for v in bm.verts if v.link_loops}
    res = bmesh.ops.convex_hull(bm, input=bm.verts[:], use_existing_faces=False); shell = set(g for g in res['geom'] if isinstance(g, bmesh.types.BMFace))
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f not in shell], context='FACES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS'); bmesh.ops.triangulate(bm, faces=bm.faces[:])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    if open_axis is not None:                             # a stack of hoops is a bowl: no lid, no bottom
        ax = Vector([float(x) for x in open_axis]); caps = [f for f in bm.faces if abs(f.normal.dot(ax)) > 0.9]
        if len(caps) < len(bm.faces): bmesh.ops.delete(bm, geom=caps, context='FACES')
    for f in bm.faces:
        if vl: f[vl] = 0.5
        if sl: f[sl] = 1.0
        for l in f.loops: l[cl] = vc.get(l.vert, (1, 1, 1, 1))
    bm.to_mesh(me); bm.free(); me.update(); return o

def reduce(ob, target, tall):
    """The pack's models are made of many loose pieces (leaves, blades, petals, fruit, kernels, boards). A plain collapse of the whole mesh
    turns every piece into a sliver, so: (1) weld; (2) measure how much of each face can be seen from outside (rays to ~64 view points; plants
    lower than a child are only seen from above the horizon); (3) delete faces buried deep inside; (4) split into loose pieces and give each a
    share of the triangle budget by its visible area (pieces whose colour stands out, like white petals, count more); the pieces that cannot
    get even a minimal shape are dropped, least visible first (groups of tiny solid pieces are first merged into one shell each, see below);
    (5) collapse each piece on its own; (6) join again and make fresh normals."""
    name = ob.name; me = ob.data
    bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.triangulate(bm, faces=bm.faces[:]); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bm.faces.ensure_lookup_table(); bm.verts.ensure_lookup_table()
    if len(bm.faces) <= target: bm.to_mesh(me); bm.free(); return ob
    bvh = BVHTree.FromBMesh(bm); lo = Vector((min(v.co[k] for v in bm.verts) for k in range(3))); hi = Vector((max(v.co[k] for v in bm.verts) for k in range(3)))
    eps = (hi - lo).length * 2e-4; dirs = directions(64, math.radians(-70 if tall else 2)); far = (hi - lo).length * 3
    lay = bm.faces.layers.float.new('vis'); vis = []; sol = bm.faces.layers.float.new('solid'); seen = set()
    for f0 in bm.faces:                                   # a piece is "solid" when it is a closed surface (fruit, kernel, board), told before faces are deleted
        if f0.index in seen: continue
        stack, piece, closed = [f0], [], True; seen.add(f0.index)
        while stack:
            f = stack.pop(); piece.append(f)
            for e in f.edges:
                if len(e.link_faces) != 2: closed = False
                for g in e.link_faces:
                    if g.index not in seen: seen.add(g.index); stack.append(g)
        for f in piece: f[sol] = 1.0 if closed else 0.0
    for f in bm.faces:
        c = f.calc_center_median(); n = 0
        for d in dirs:
            if bvh.ray_cast(c + d * eps, d, far)[0] is None: n += 1
        f[lay] = n / len(dirs); vis.append(n)
    dead = [f for f in bm.faces if vis[f.index] == 0 and all(vis[g.index] == 0 for v in f.verts for g in v.link_faces)]
    if len(dead) < len(bm.faces): bmesh.ops.delete(bm, geom=dead, context='FACES')
    loose = [v for v in bm.verts if not v.link_faces]; bmesh.ops.delete(bm, geom=loose, context='VERTS')
    bm.to_mesh(me); bm.free(); me.update()
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.mesh.separate(type='LOOSE'); parts = [o for o in bpy.context.selected_objects if o.type == 'MESH']
    if ob not in parts: parts.append(ob)
    D = (hi - lo).length; info = [measure(o) for o in parts]
    Vt = sum(i['V'] for i in info) or 1e-9; mean = sum((i['C'] * i['V'] for i in info), Vector((0, 0, 0))) / Vt
    # many small solid pieces of one colour packed together (lavender bulbs, corn kernels, dandelion seeds) cannot each get a shape:
    # every such group becomes ONE convex shell in the colours of its pieces
    small = [k for k, i in enumerate(info) if i['d'] < 0.12 * D and i['solid'] and not i['thin']]; root = {k: k for k in small}
    for k in small: info[k]['need'] = 4
    def find(k):
        while root[k] != k: root[k] = root[root[k]]; k = root[k]
        return k
    for x in range(len(small)):
        for y in range(x + 1, len(small)):
            p, q = info[small[x]], info[small[y]]
            if (p['C'] - q['C']).length < 0.2 and gap(p, q) < 0.5 * max(p['d'], q['d']): root[find(small[x])] = find(small[y])
    # the same for a stack of parallel hoops (the wickerwork of a basket): one bowl-shaped shell instead of twenty rings of a few triangles each
    hoops = [k for k, i in enumerate(info) if i['hoop']]
    for k in hoops: root[k] = k
    for x in range(len(hoops)):
        for y in range(x + 1, len(hoops)):
            p, q = info[hoops[x]], info[hoops[y]]
            if (p['C'] - q['C']).length < 0.2 and abs(float(np.dot(p['axis'], q['axis']))) > 0.9 and gap(p, q) < 0.1 * max(p['d'], q['d']): root[find(hoops[x])] = find(hoops[y])
    groups = {}
    for k in small + hoops: groups.setdefault(find(k), []).append(k)
    gone = set()
    for g in groups.values():
        if len(g) < 4: continue
        if not info[g[0]]['hoop']:                        # buds strung out along a stem: their hull would be a big flat flag, keep them apart
            tb = bmesh.new()
            for k in g:
                for v in info[k]['ob'].data.vertices: tb.verts.new(v.co)
            r = bmesh.ops.convex_hull(tb, input=tb.verts[:]); ha = sum(f.calc_area() for f in r['geom'] if isinstance(f, bmesh.types.BMFace)); tb.free()
            spread = ha / (sum(info[k]['A'] for k in g) or 1e-9)
            if os.environ.get('DEBUG'): print('GROUP', name, len(g), 'spread %.2f' % spread)
            if spread > SPREAD: continue
        o = hull([info[k]['ob'] for k in g], info[g[0]]['axis'] if info[g[0]]['hoop'] else None); m = measure(o); m['V'] = sum(info[k]['V'] for k in g); m['size'] = max(m['size'], sum(info[k]['size'] for k in g) * 0.5)
        m['frac'] = max(info[k]['frac'] for k in g); m['need'] = min(m['n'], 16 if info[g[0]]['hoop'] else 6); m['hoop'] = False; m['C'] = sum((info[k]['C'] * info[k]['V'] for k in g), Vector((0, 0, 0))) / (m['V'] or 1e-9)
        gone.update(g); info.append(m)
    info = [i for k, i in enumerate(info) if k not in gone]
    for i in info: i['imp'] = i['size'] * i['frac'] * (1 + SALIENT * (i['C'] - mean).length); i['need'] = min(i['need'], i['n'])
    It = sum(i['imp'] for i in info) or 1e-9
    keep = [i for i in info if i['imp'] > It * 2e-4] or [max(info, key=lambda i: i['imp'])]
    keep.sort(key=lambda i: i['imp'] / i['need'])
    while len(keep) > 1 and sum(i['need'] for i in keep) > target * 0.8: keep.pop(0)
    def alloc(s): return [max(i['need'], min(i['n'], s * i['imp'] ** 0.75)) for i in keep]
    a, b = 0.0, 1.0
    while sum(alloc(b)) < target and b < 1e12: b *= 4
    for _ in range(60):
        s = (a + b) / 2
        if sum(alloc(s)) > target: b = s
        else: a = s
    want = alloc(a); kept = set(id(i) for i in keep)
    for i in info:
        if id(i) not in kept: bpy.data.objects.remove(i['ob'], do_unlink=True)
    for i, t in zip(keep, want):
        o = i['ob']
        if t >= i['n']: continue
        bpy.context.view_layer.objects.active = o
        mod = o.modifiers.new('dec', 'DECIMATE'); mod.decimate_type = 'COLLAPSE'; mod.ratio = max(0.0005, (t + 0.5) / i['n']); mod.use_collapse_triangulate = True
        with bpy.context.temp_override(object=o, active_object=o, selected_objects=[o]): bpy.ops.object.modifier_apply(modifier='dec')
    bpy.ops.object.select_all(action='DESELECT'); objs = [i['ob'] for i in keep]
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1: bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active; ob.name = name; me = ob.data
    bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.dissolve_degenerate(bm, edges=bm.edges[:], dist=1e-6); bmesh.ops.triangulate(bm, faces=bm.faces[:])
    loose = [v for v in bm.verts if not v.link_faces]; bmesh.ops.delete(bm, geom=loose, context='VERTS'); bm.to_mesh(me); bm.free()
    # fresh normals: the imported custom normals do not survive a collapse
    if me.has_custom_normals:
        with bpy.context.temp_override(object=ob, active_object=ob, selected_objects=[ob]): bpy.ops.mesh.customdata_custom_splitnormals_clear()
    for p in me.polygons: p.use_smooth = True
    me.set_sharp_from_angle(angle=SHARP); me.update(); return ob

def pack(me):
    """Blender mesh -> glTF arrays (Y up), vertices shared where position index, normal and colour agree."""
    me.calc_loop_triangles(); col = me.color_attributes.active_color or (me.color_attributes[0] if me.color_attributes else None)
    if col is None or col.domain != 'CORNER': raise RuntimeError('no corner colour layer')
    cn = me.corner_normals; pos, nor, rgba, idx, seen = [], [], [], [], {}
    for t in me.loop_triangles:
        for li in t.loops:
            vi = me.loops[li].vertex_index; n = cn[li].vector; c = col.data[li].color
            cb = tuple(max(0, min(255, int(round(x * 255)))) for x in c)
            key = (vi, round(n.x * 20), round(n.y * 20), round(n.z * 20), cb[0] >> 3, cb[1] >> 3, cb[2] >> 3)      # share a vertex when normal and colour nearly agree
            k = seen.get(key)
            if k is None:
                k = seen[key] = len(pos); v = me.vertices[vi].co
                pos.append((v.x, v.z, -v.y)); nor.append((n.x, n.z, -n.y)); rgba.append(cb)
            idx.append(k)
    return pos, nor, rgba, idx

def process(name, scale=1.0):
    src = os.path.join(SRC, name + '.glb'); dst = os.path.join(OUT, name + '.glb')
    js, binc = read_glb(src); acc = js['accessors']
    tris0 = sum(acc[p['indices']]['count'] // 3 for m in js['meshes'] for p in m['primitives'])
    B = budget(name)
    if tris0 <= B:
        if os.path.abspath(src) != os.path.abspath(dst): shutil.copyfile(src, dst)
        print('KEEP  ', name, tris0, '<=', B); return
    for m in js['meshes']:
        p = m['primitives']
        if len(p) != 1 or set(p[0]['attributes']) != {'POSITION', 'NORMAL', 'COLOR_0'} or js.get('skins') or js.get('images'):
            raise RuntimeError(name + ': not a plain vertex-coloured mesh, refusing')
    bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=src)
    by_mesh = {}                                          # glTF mesh index -> Blender object (through the node name)
    for n in js['nodes']:
        if 'mesh' in n:
            ob = bpy.data.objects.get(n['name'])
            if ob is None or ob.type != 'MESH': raise RuntimeError(name + ': node ' + n['name'] + ' not found after import')
            by_mesh[n['mesh']] = ob
    if len(by_mesh) != len(js['meshes']): raise RuntimeError(name + ': a mesh is shared between nodes')
    cur = {i: acc[js['meshes'][i]['primitives'][0]['indices']]['count'] // 3 for i in by_mesh}
    plant = next((i for i, o in by_mesh.items() if o.name == 'Plant'), None); Bs = B * scale
    hi_y = max(acc[m['primitives'][0]['attributes']['POSITION']]['max'][1] + (n.get('translation') or [0, 0, 0])[1] for n in js['nodes'] if 'mesh' in n for m in [js['meshes'][n['mesh']]])
    tall = hi_y > 1.1                                     # taller than a child's eyes once scaled x1.5: also seen from below
    target = {}
    if len(by_mesh) == 1 or plant is None:
        for i in by_mesh: target[i] = max(4, int(Bs * cur[i] / tris0))
    else:
        share = PLANT_SHARE.get(name, 0.5); rest = sum(c for i, c in cur.items() if i != plant)
        for i in by_mesh: target[i] = int(Bs * share) if i == plant else max(4, int(Bs * (1 - share) * cur[i] / rest))
    views, accs, buf = [], [], bytearray()
    def add(data, fmt, ctype, typ, target_kind, norm=False, mm=None):
        nonlocal buf
        buf += b'\0' * (-len(buf) % 4); off = len(buf); n = len(data)
        flat = [x for row in data for x in row] if typ != 'SCALAR' else data
        buf += struct.pack('<%d%s' % (len(flat), fmt), *flat)
        views.append({'buffer': 0, 'byteOffset': off, 'byteLength': len(buf) - off, 'target': target_kind})
        ac = {'bufferView': len(views) - 1, 'componentType': ctype, 'count': n, 'type': typ}
        if norm: ac['normalized'] = True
        if mm: ac['min'], ac['max'] = mm
        accs.append(ac); return len(accs) - 1
    total = 0
    for i, m in enumerate(js['meshes']):
        node = by_mesh[i].name; ob = reduce(by_mesh[i], target[i], tall); pos, nor, rgba, idx = pack(ob.data); total += len(idx) // 3
        mm = ([min(p[k] for p in pos) for k in range(3)], [max(p[k] for p in pos) for k in range(3)])
        pr = m['primitives'][0]; o = acc[pr['attributes']['POSITION']]
        # a collapse pulls the outline in by a percent or two: stretch back to the original bounding box (same size, same foot on the ground)
        fit = [((o['max'][k] - o['min'][k]) / (mm[1][k] - mm[0][k]) if mm[1][k] > mm[0][k] else 1) for k in range(3)]
        fit = [f if 0.8 < f < 1.25 else None for f in fit]
        pos = [tuple(p[k] if fit[k] is None else o['min'][k] + (p[k] - mm[0][k]) * fit[k] for k in range(3)) for p in pos]
        mm = ([min(p[k] for p in pos) for k in range(3)], [max(p[k] for p in pos) for k in range(3)])
        pr['attributes'] = {'POSITION': add(pos, 'f', 5126, 'VEC3', 34962, mm=mm), 'NORMAL': add(nor, 'f', 5126, 'VEC3', 34962),
                            'COLOR_0': add(rgba, 'B', 5121, 'VEC4', 34962, norm=True)}
        big = len(pos) > 65535; pr['indices'] = add(idx, 'I' if big else 'H', 5125 if big else 5123, 'SCALAR', 34963)
    if total > B:
        if scale < 0.6: raise RuntimeError(name + ': still over budget')
        return process(name, scale * min(0.97, B / total))
    js['accessors'], js['bufferViews'] = accs, views; js['buffers'] = [{'byteLength': len(buf) + (-len(buf) % 4)}]
    write_glb(dst, js, buf)
    print('DONE  ', name, tris0, '->', total, '(budget %d)' % B, 'KB', os.path.getsize(src) // 1024, '->', os.path.getsize(dst) // 1024)

names = sorted(f[:-4] for f in os.listdir(SRC) if f.endswith('.glb'))
for n in names:
    if ONLY and n not in ONLY: continue
    process(n)
