"""Build chibi05 vegetation (REF_04_VILLAGE_SCENE.png, tree/bush rows).

    python tools/chibi05/build_trees_chibi.py

Outputs assets/environment/village/models/veg_<name>_v02.glb. Sizes match the Quaternius
trees they replace (~7 m trees, ~1.4 m bushes) so existing placements keep their scale.
"""
import bpy  # noqa: F401
import math, os, random, sys
from pathlib import Path
from mathutils import Vector, Quaternion

ROOT = Path(os.environ.get('NGOC_ROOT', os.getcwd()))
sys.path.insert(0, str(ROOT / 'tools/chibi05'))
from chibi_lib import *  # noqa
import chibi_lib as L

OUT = ROOT / 'assets/environment/village/models'
SRC = ROOT / 'art_source/chibi05/vegetation'
PAL = {
    'bark': ('8a5a34', .9, 0), 'bark_dark': ('63401f', .9, 0), 'birch': ('efe9dc', .85, 0), 'birch_mark': ('3e3630', .9, 0),
    'leaf_dark': ('3f8a34', .85, 0), 'leaf': ('56a83c', .85, 0), 'leaf_light': ('7cc44a', .8, 0), 'leaf_yellow': ('a8d050', .8, 0),
    'pine_dark': ('2f6e3a', .85, 0), 'pine': ('3f8a46', .85, 0), 'pine_light': ('5aa456', .8, 0),
    'pink': ('f39ab8', .8, 0), 'pink_light': ('fbc2d4', .8, 0), 'pink_dark': ('e07a9c', .8, 0),
    'flower_white': ('f8f4ec', .7, 0), 'flower_yellow': ('f6d24a', .7, 0), 'flower_red': ('e44a40', .7, 0), 'flower_pink': ('f08ab0', .7, 0),
    'grass': ('62b040', .85, 0), 'moss': ('6aa84a', .9, 0),
}


# ------------------------------------------------------------------ leaf cards
LEAF_PNG = SRC / 'veg_leaf_atlas_v02.png'
CARDS = []          # (corners[4], uv_cell, canopy_centre)
LEAF_MAT = None


def leaf_atlas(path):
    """2x2 atlas of painted leaf clusters: 0 oak green, 1 birch yellow-green, 2 blossom, 3 pine."""
    from PIL import Image, ImageDraw
    import random as R
    SS, C = 2, 512
    big = Image.new('RGBA', (C * 2 * SS, C * 2 * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(big)
    pal = [((44, 112, 40), (132, 204, 78)), ((96, 160, 52), (214, 232, 110)), ((230, 122, 160), (255, 214, 228)), ((34, 92, 50), (92, 168, 86))]
    for v in range(4):
        rnd_ = R.Random(40 + v)
        ox, oy = (v % 2) * C * SS, (v // 2) * C * SS
        cx, cy = ox + C * SS / 2, oy + C * SS / 2
        dark, light = pal[v]
        n = 70 if v != 3 else 150
        for k in range(n):
            a = rnd_.uniform(0, 2 * math.pi)
            rr = C * SS * .40 * math.sqrt(rnd_.random())
            px, py = cx + math.cos(a) * rr, cy + math.sin(a) * rr
            if v != 3:  # twig towards the cluster centre
                d.line([(cx + (px - cx) * .25, cy + (py - cy) * .25), (px, py)], fill=(96, 66, 36, 255), width=3 * SS)
        for k in range(n):
            a = rnd_.uniform(0, 2 * math.pi)
            rr = C * SS * .40 * math.sqrt(rnd_.random())
            px, py = cx + math.cos(a) * rr, cy + math.sin(a) * rr
            ang = a + rnd_.uniform(-.7, .7)
            t = rnd_.random()
            col = tuple(int(dark[i] + (light[i] - dark[i]) * t) for i in range(3))
            if v == 2 and k % 3 == 0:   # five-petal blossom
                pr = C * SS * rnd_.uniform(.035, .05)
                for j in range(5):
                    b = ang + j * 2 * math.pi / 5
                    qx, qy = px + math.cos(b) * pr, py + math.sin(b) * pr
                    d.ellipse([qx - pr, qy - pr, qx + pr, qy + pr], fill=col + (255,))
                d.ellipse([px - pr * .45, py - pr * .45, px + pr * .45, py + pr * .45], fill=(250, 214, 90, 255))
                continue
            if v == 2:
                col = (86, 150, 60)
            L = C * SS * (rnd_.uniform(.10, .16) if v != 3 else rnd_.uniform(.10, .15))
            W = L * (.48 if v != 3 else .10)
            pts = []
            for i in range(13):
                u = i / 12
                pts.append(((u - .5) * L, W / 2 * math.sin(math.pi * u) ** .8))
            pts += [(x, -y) for x, y in reversed(pts)]
            ca, sa = math.cos(ang), math.sin(ang)
            poly = [(px + x * ca - y * sa, py + x * sa + y * ca) for x, y in pts]
            d.polygon(poly, fill=col + (255,))
            if v != 3:  # darker midrib
                mid = tuple(max(0, c - 34) for c in col) + (255,)
                d.line([(px - L * .45 * ca, py - L * .45 * sa), (px + L * .45 * ca, py + L * .45 * sa)], fill=mid, width=2 * SS)
    big.resize((C * 2, C * 2), Image.LANCZOS).save(path)


def leaf_material():
    m = bpy.data.materials.new(f"{L.STATE['name']}_Leaves")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    t = nt.nodes.new('ShaderNodeTexImage')
    t.image = bpy.data.images.load(str(LEAF_PNG))
    nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    nt.links.new(t.outputs['Alpha'], b.inputs['Alpha'])
    b.inputs['Roughness'].default_value = .75
    return m


def cards(center, radius, n, variant, seed, size=1.0, spread=.85, upper=-.35):
    rnd = random.Random(seed * 7 + 3)
    c0 = Vector(center)
    for k in range(n):
        while True:
            d = Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(upper, 1)))
            if .15 < d.length <= 1:
                break
        d.normalize()
        p = c0 + d * radius * spread
        nrm = (d + Vector((rnd.uniform(-.4, .4), rnd.uniform(-.4, .4), rnd.uniform(-.2, .4)))).normalized()
        u, v = L.frame_from(nrm)
        roll = rnd.uniform(0, 2 * math.pi)
        u, v = u * math.cos(roll) + v * math.sin(roll), v * math.cos(roll) - u * math.sin(roll)
        sz = radius * rnd.uniform(.8, 1.2) * size
        CARDS.append(([p - u * sz / 2 - v * sz / 2, p + u * sz / 2 - v * sz / 2, p + u * sz / 2 + v * sz / 2, p - u * sz / 2 + v * sz / 2], variant, c0))


def flush_cards():
    if not CARDS:
        return
    verts, faces, cells, normals = [], [], [], []
    for corners, var, c0 in CARDS:
        base = len(verts)
        verts += corners
        faces.append((base, base + 1, base + 2, base + 3))
        cells.append(var)
        for q in corners:  # soft volumetric shading: normals radiate from the canopy centre
            normals.append((q - c0).normalized())
    ob = mesh_obj('LeafCards', verts, faces)
    me = ob.data
    uvl = me.uv_layers.new(name='UVMap').data
    for poly, var in zip(me.polygons, cells):
        u0, v0 = (var % 2) * .5, .5 - (var // 2) * .5
        for li, (uu, vv) in zip(poly.loop_indices, [(0, 0), (1, 0), (1, 1), (0, 1)]):
            uvl[li].uv = (u0 + uu * .5, v0 + vv * .5)
    me.normals_split_custom_set_from_vertices(normals)
    finish(ob, None, ['x'], smooth=True, material=LEAF_MAT)
    CARDS.clear()


def trunk(height, r0, lean=(0, 0), roots=4, col='bark', seed=0):
    rnd = random.Random(seed)
    pts, rad = [], []
    for i in range(7):
        t = i / 6
        pts.append(Vector((lean[0] * t * t + .05 * math.sin(t * 5 + seed), lean[1] * t * t + .05 * math.cos(t * 4 + seed), height * t)))
        rad.append(r0 * (1.25 - .55 * t) + (r0 * .5 if i == 0 else 0))
    tr = tube('Trunk', pts, rad, seg=16)
    for vv in tr.data.vertices:  # vertical bark ridges
        z = vv.co.z
        i = min(5, max(0, int(z / max(height, .01) * 6)))
        c = pts[i].lerp(pts[i + 1], max(0, min(1, z / height * 6 - i)))
        off = vv.co - Vector((c.x, c.y, vv.co.z))
        a = math.atan2(off.y, off.x)
        k = 1 + .09 * math.sin(a * 7 + z * 1.7 + seed) + .04 * math.sin(a * 13 - z * 3.1)
        vv.co = Vector((c.x, c.y, vv.co.z)) + off * k
    finish(tr, col, ['x'], subsurf=1)
    for k in range(roots):
        a = 2 * math.pi * k / roots + rnd.uniform(-.3, .3)
        d = Vector((math.cos(a), math.sin(a), 0))
        finish(tube('Root', [Vector((0, 0, .45)), d * r0 * 1.6 + Vector((0, 0, .12)), d * r0 * 2.6 + Vector((0, 0, -.02))], [r0 * .55, r0 * .45, r0 * .2], seg=8),
               col, ['x'])
    return pts[-1]


def branch(a, b, r, col='bark'):
    finish(tube('Branch', [Vector(a), (Vector(a) + Vector(b)) / 2 + Vector((0, 0, .15)), Vector(b)], [r, r * .8, r * .5], seg=8), col, ['x'])


def canopy(center, radius, clusters, cols, seed=0, squash=.85, bump=.16, variant=0, card_density=1.0):
    """leafy crown v03: no solid ball. A small dark inner core, many smaller clumps each held by a
    visible branch from the crown base, and dense painted leaf cards that stick out past every
    clump so the outline reads as leaves and the branches show through the gaps."""
    rnd = random.Random(seed)
    c0 = Vector(center)
    base = c0 - Vector((0, 0, radius * .55))
    finish(ellipsoid('CanopyCore', c0, (radius * .42, radius * .42, radius * .36 * squash), seg=12, rings=8,
                     deform=lambda q, v: lumpy(q, v, radius * .05, 5, seed)), cols[2] if len(cols) > 2 else cols[0], ['x'])
    n = int(clusters * 1.5)
    for k in range(n):
        y = 1 - (k + .5) / n * 1.4
        r = math.sqrt(max(0, 1 - y * y))
        a = k * 2.399 + seed
        d = Vector((math.cos(a) * r, math.sin(a) * r, y * squash))
        s = radius * rnd.uniform(.28, .38)
        col = cols[1] if d.z > .25 else (cols[2] if d.z < -.2 else rnd.choice(cols[:2]))
        if d.z > .55:
            col = cols[3] if len(cols) > 3 else cols[1]
        cc = c0 + d * radius * rnd.uniform(.66, .8)
        # twig from the crown base out to the clump (visible between clumps)
        mid = base.lerp(cc, .55) + Vector((0, 0, radius * .12))
        finish(tube('Twig', [base + d * radius * .12, mid, cc.lerp(c0, .2)], [radius * .05, radius * .035, radius * .02], seg=6), 'bark', ['x'])
        finish(ellipsoid('Clump', cc, (s * .68, s * .68, s * .58), seg=10, rings=7,
                         deform=lambda q, v, k=k: lumpy(q, v, s * bump, 6, k + seed)), col, ['x'])
        cards(cc, s, int(14 * card_density), variant, seed * 13 + k, size=1.5, spread=.98, upper=-.6)


def dots(center, radius, n, colors, size=.12, seed=0, upper=.0):
    rnd = random.Random(seed + 99)
    for k in range(n):
        while True:
            d = Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(upper, 1)))
            if .2 < d.length <= 1:
                break
        d.normalize()
        p = Vector(center) + Vector((d.x, d.y, d.z * .85)) * radius
        finish(ellipsoid('Blossom', p, (size, size, size * .8), seg=8, rings=6), rnd.choice(colors), ['x'])


def build(name, fn):
    global LEAF_MAT
    init(f'veg_{name}_v02', PAL, OUT, SRC)
    LEAF_MAT = leaf_material()
    CARDS.clear()
    fn()
    flush_cards()
    join_static(f'veg_{name}_v02')
    glb = OUT / f'veg_{name}_v02.glb'
    export(glb, SRC / f'veg_{name}_v02.blend')

    def leafy(m):
        if m.get('name', '').endswith('_Leaves'):
            m['alphaMode'] = 'MASK'
            m['alphaCutoff'] = .5
            m['doubleSided'] = True
    patch_glb_materials(str(glb), leafy)
    export_lod(name)


def export_lod(name, ratio=.16):
    """far-distance version: no leaf cards, decimated volumes (used past ~45 m in Godot)"""
    import bmesh
    body = L.STATE['body']
    leaf_slots = {i for i, m in enumerate(body.data.materials) if m and m.name.endswith('_Leaves')}
    bm = bmesh.new()
    bm.from_mesh(body.data)
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.material_index in leaf_slots], context='FACES')
    bm.to_mesh(body.data)
    bm.free()
    mod = body.modifiers.new('lod', 'DECIMATE')
    mod.ratio = ratio
    L.apply_mod(body, mod)
    for o in bpy.context.view_layer.objects:
        o.select_set(o == body)
    path = OUT / f'veg_{name}_lod_v02.glb'
    bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', use_selection=True, export_materials='EXPORT',
                              export_animations=False, export_yup=True)
    print('exported lod', path, sum(len(p.vertices) - 2 for p in body.data.polygons))


def oak_a():
    top = trunk(3.6, .32, seed=1)
    for a in (0.4, 2.6, 4.5):
        branch(top - Vector((0, 0, .8)), top + Vector((math.cos(a) * 1.3, math.sin(a) * 1.3, .4)), .14)
    canopy(top + Vector((0, 0, 1.2)), 2.6, 16, ['leaf', 'leaf_light', 'leaf_dark', 'leaf_yellow'], seed=1)


def oak_b():
    top = trunk(3.2, .30, lean=(.4, .2), seed=3)
    canopy(top + Vector((0, 0, 1.4)), 2.3, 13, ['leaf_dark', 'leaf', 'leaf_dark', 'leaf_light'], seed=3)
    canopy(top + Vector((.9, .4, .3)), 1.3, 7, ['leaf', 'leaf_light', 'leaf_dark'], seed=4)
    canopy(top + Vector((-1.0, -.3, .5)), 1.2, 7, ['leaf', 'leaf_light', 'leaf_dark'], seed=5)


def oak_wide():
    top = trunk(2.7, .40, seed=7)
    for a in (0.0, 1.6, 3.2, 4.7):
        branch(top - Vector((0, 0, .5)), top + Vector((math.cos(a) * 2.0, math.sin(a) * 2.0, .5)), .16)
    canopy(top + Vector((0, 0, 1.2)), 2.4, 14, ['leaf', 'leaf_light', 'leaf_dark', 'leaf_yellow'], seed=7, squash=.75)
    for a in (0.0, 1.6, 3.2, 4.7):
        canopy(top + Vector((math.cos(a) * 2.2, math.sin(a) * 2.2, .7)), 1.3, 6, ['leaf', 'leaf_light', 'leaf_dark'], seed=8 + a)


def blossom():
    top = trunk(3.0, .30, lean=(-.3, .2), seed=11, col='bark_dark')
    canopy(top + Vector((0, 0, 1.3)), 2.4, 15, ['pink', 'pink_light', 'pink_dark', 'pink_light'], seed=11, variant=2)
    dots(top + Vector((0, 0, 1.3)), 2.5, 26, ['flower_white', 'pink_light'], size=.13, seed=11, upper=-.3)


def pine(tiers=5, h=7.3, r=2.5, seed=0):
    finish(tube('PineTrunk', [Vector((0, 0, 0)), Vector((0, 0, 1.6))], [.32, .26], seg=10), 'bark', ['x'])
    for k in range(3):
        a = k * 2.1
        finish(tube('PineRoot', [Vector((0, 0, .35)), Vector((math.cos(a) * .55, math.sin(a) * .55, -.02))], [.16, .06], seg=6), 'bark', ['x'])
    z0 = 1.2
    tier_h = (h - z0) / tiers * 1.35
    for k in range(tiers):
        t = k / (tiers - 1)
        rr = r * (1 - .72 * t)
        zb = z0 + k * (h - z0 - tier_h * .5) / tiers
        cols = ['pine_dark', 'pine', 'pine_light']
        skirt = loft('Tier', [((0, 0, zb), rr, rr), ((0, 0, zb + tier_h * .18), rr * .97, rr * .97), ((0, 0, zb + tier_h * .55), rr * .55, rr * .55),
                              ((0, 0, zb + tier_h), rr * .08, rr * .08)], seg=24, caps=(True, True),
                     shape=lambda a, i, k=k: 1 + (.10 * math.cos(a * 9 + k) if i < 2 else .04 * math.cos(a * 9 + k)))
        finish(skirt, cols[min(2, k % 3)] if k else 'pine_dark', ['x'], subsurf=1)
        rnd_p = random.Random(seed * 31 + k)
        for j in range(14):
            a = 2 * math.pi * j / 14 + rnd_p.uniform(-.15, .15)
            p = Vector((math.cos(a) * rr * .92, math.sin(a) * rr * .92, zb + tier_h * .12))
            out = Vector((math.cos(a), math.sin(a), -.35)).normalized()
            u = Vector((-math.sin(a), math.cos(a), 0))
            v = out.cross(u).normalized()
            sz = rr * .55
            CARDS.append(([p - u * sz / 2 - v * sz / 2, p + u * sz / 2 - v * sz / 2, p + u * sz / 2 + v * sz / 2, p - u * sz / 2 + v * sz / 2], 3,
                          Vector((0, 0, zb + tier_h * .4))))
    finish(ellipsoid('PineTip', (0, 0, h - .1), (.18, .18, .26), seg=8, rings=6), 'pine_light', ['x'])


def pine_a():
    pine(5, 7.3, 2.5, 0)


def pine_b():
    pine(4, 6.4, 2.2, 1)


def birch():
    top = trunk(4.6, .22, lean=(.2, -.1), roots=3, col='birch', seed=21)
    rnd = random.Random(21)
    for k in range(9):
        z = .5 + k * .45
        a = rnd.uniform(0, 6.28)
        finish(ellipsoid('BirchMark', (math.cos(a) * .24 * (1.2 - .1 * k / 2), math.sin(a) * .24 * (1.2 - .1 * k / 2), z), (.10, .10, .035), seg=8, rings=4,
                         rot=Quaternion((0, 0, 1), a)), 'birch_mark', ['x'])
    canopy(top + Vector((0, 0, 1.1)), 1.8, 11, ['leaf_light', 'leaf_yellow', 'leaf', 'leaf_yellow'], seed=21, squash=1.05, variant=1)
    canopy(top + Vector((.3, 0, 2.3)), 1.1, 6, ['leaf_yellow', 'leaf_light', 'leaf'], seed=22, variant=1)


def bush():
    for k, (x, y, r) in enumerate([(0, 0, .65), (.55, .2, .48), (-.5, .15, .5), (.1, -.45, .45)]):
        finish(ellipsoid('Bush', (x, y, r * .8), (r * .85, r * .85, r * .75), seg=12, rings=8, deform=lambda q, v, k=k: lumpy(q, v, r * .12, 6, k)),
               ['leaf_dark', 'leaf', 'leaf_dark', 'leaf'][k], ['x'])
        cards((x, y, r * .8), r, 12, 0, 70 + k, size=1.1, spread=.82, upper=-.2)


def bush_flower():
    bush()
    dots((0, 0, .55), .78, 16, ['flower_pink', 'flower_white', 'flower_yellow'], size=.09, seed=3, upper=-.1)


def bush_red():
    bush()
    dots((0, 0, .55), .78, 14, ['flower_red'], size=.10, seed=5, upper=-.1)


ALL = {'oak_a': oak_a, 'oak_b': oak_b, 'oak_wide': oak_wide, 'blossom': blossom, 'pine_a': pine_a, 'pine_b': pine_b, 'birch': birch,
       'bush': bush, 'bush_flower': bush_flower, 'bush_red': bush_red}
if __name__ == '__main__':
    leaf_atlas(LEAF_PNG)
    args = [a for a in sys.argv[1:] if not a.startswith('-')]
    for n, fn in ALL.items():
        if not args or n in args:
            build(n, fn)
