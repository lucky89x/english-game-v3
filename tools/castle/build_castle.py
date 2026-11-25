# The villa of a child's home as a fairy-tale castle (25/11, from the user's reference picture), built in Blender (bpy 4.2) and exported as
# assets/models/bld_castle_villa_f2.glb and _f3.glb (2 and 3 floors). Same layout as the code version in src/world/castle.js, with what code
# shapes cannot give cheaply: brick and stone textures, scalloped roof tiles, bevelled edges. Front faces glTF +Z (Blender -Y).
#   /workspace/.bpyenv/bin/python tools/castle/build_castle.py      (about a minute; textures are drawn with PIL first)
import bpy, bmesh, math, os, sys
from PIL import Image, ImageDraw, ImageFilter
import random

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
TEX = os.path.join(os.path.dirname(__file__), 'tex'); os.makedirs(TEX, exist_ok=True)
rnd = random.Random(7)

# ------------------------------------------------------------------ textures (PIL)
def tex_bricks(path, base, mortar, bw=64, bh=32, size=512, var=10):
    im = Image.new('RGB', (size, size), mortar); d = ImageDraw.Draw(im)
    for row in range(size // bh):
        off = (bw // 2) * (row % 2)
        for col in range(-1, size // bw + 1):
            x0, y0 = col * bw + off + 2, row * bh + 2; k = rnd.randint(-var, var)
            c = tuple(max(0, min(255, v + k)) for v in base); d.rectangle([x0, y0, x0 + bw - 4, y0 + bh - 4], fill=c)
            for _ in range(3): px, py = x0 + rnd.randint(2, bw - 6), y0 + rnd.randint(2, bh - 6); d.point((px, py), fill=tuple(max(0, v - 18) for v in c))
    im.filter(ImageFilter.SMOOTH).save(path)
def tex_shingles(path, base, dark, size=512, n=8):
    im = Image.new('RGB', (size, size), dark); d = ImageDraw.Draw(im); w = size // n; h = int(w * 0.7)
    for row in range(-1, size // h + 2):
        off = (w // 2) * (row % 2)
        for col in range(-1, n + 1):
            x0, y0 = col * w + off, row * h; k = rnd.randint(-14, 14); c = tuple(max(0, min(255, v + k)) for v in base)
            d.pieslice([x0 + 1, y0 - h, x0 + w - 1, y0 + h], 0, 180, fill=c, outline=dark)
            d.arc([x0 + 6, y0 - h + 8, x0 + w - 6, y0 + h - 8], 20, 160, fill=tuple(min(255, v + 30) for v in c), width=2)
    im.save(path)
def tex_planks(path, base, size=256):
    im = Image.new('RGB', (size, size), base); d = ImageDraw.Draw(im)
    for i in range(0, size, 32):
        k = rnd.randint(-12, 12); d.rectangle([i, 0, i + 30, size], fill=tuple(max(0, v + k) for v in base))
        for _ in range(6): y = rnd.randint(0, size); d.line([i + 4, y, i + 26, y + rnd.randint(-3, 3)], fill=tuple(max(0, v - 30) for v in base), width=1)
    im.save(path)
def tex_banner(path, color):
    im = Image.new('RGBA', (256, 512), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    poly = [(10, 10), (246, 10), (246, 400), (128, 500), (10, 400)]; d.polygon(poly, fill=color); d.line(poly + [poly[0]], fill=(232, 184, 48), width=12)
    g = (242, 198, 64); cx, cy = 128, 225
    d.ellipse([cx - 22, cy - 92, cx + 22, cy + 20], fill=g)                                  # the lily: middle petal
    for s in (-1, 1):
        d.pieslice([cx + (s * 10 if s > 0 else -78), cy - 70, cx + (78 if s > 0 else -10), cy + 10], 90 if s > 0 else 0, 270 if s > 0 else 180, fill=g)
    d.rectangle([cx - 46, cy + 18, cx + 46, cy + 36], fill=g); d.polygon([(cx - 22, cy + 36), (cx + 22, cy + 36), (cx, cy + 82)], fill=g)
    im.save(path)
P = lambda n: os.path.join(TEX, n)
tex_bricks(P('cream.png'), (236, 226, 207), (214, 202, 182))
tex_bricks(P('grey.png'), (170, 165, 170), (128, 124, 130), bw=96, bh=48, var=14)
tex_shingles(P('blue.png'), (64, 98, 204), (34, 56, 128))
tex_shingles(P('red.png'), (212, 76, 62), (130, 38, 30))
tex_planks(P('wood.png'), (138, 86, 48))
tex_banner(P('banner_red.png'), (200, 52, 44, 255)); tex_banner(P('banner_blue.png'), (47, 85, 192, 255))

# ------------------------------------------------------------------ scene and materials
bpy.ops.wm.read_factory_settings(use_empty=True)
MATS = {}
def mat(name, color=(1, 1, 1), rough=0.75, metal=0.0, emit=None, img=None, alpha=False):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True; bs = m.node_tree.nodes['Principled BSDF']
    bs.inputs['Base Color'].default_value = (*color, 1); bs.inputs['Roughness'].default_value = rough; bs.inputs['Metallic'].default_value = metal
    if emit: bs.inputs['Emission Color'].default_value = (*emit, 1); bs.inputs['Emission Strength'].default_value = 1.2
    if img:
        t = m.node_tree.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(P(img)); m.node_tree.links.new(t.outputs['Color'], bs.inputs['Base Color'])
        if alpha: m.node_tree.links.new(t.outputs['Alpha'], bs.inputs['Alpha']); m.blend_method = 'CLIP'
    MATS[name] = m; return m
srgb = lambda h: tuple(((h >> s & 255) / 255) ** 2.2 for s in (16, 8, 0))
M = {
  'cream': lambda: mat('cream', img='cream.png', rough=0.85), 'grey': lambda: mat('grey', img='grey.png', rough=0.9),
  'trim': lambda: mat('trim', srgb(0xddd1bb), 0.85), 'white': lambda: mat('white', srgb(0xfbf6ee), 0.6), 'dark': lambda: mat('dark', srgb(0x3a3038), 0.9),
  'blue': lambda: mat('roof_blue', img='blue.png', rough=0.55), 'red': lambda: mat('roof_red', img='red.png', rough=0.6), 'bluep': lambda: mat('blue_plain', srgb(0x3b5fc8), 0.5),
  'gold': lambda: mat('gold', srgb(0xe2b23a), 0.3, 0.8), 'wood': lambda: mat('wood', img='wood.png', rough=0.7), 'wood2': lambda: mat('wood_dark', srgb(0x5e3a20), 0.7),
  'carpet': lambda: mat('carpet', srgb(0xc8342c), 0.95), 'leaf': lambda: mat('leaf', srgb(0x4f9a3a), 0.9), 'pink': lambda: mat('pink', srgb(0xf08ab0), 0.7),
  'glow': lambda: mat('glow', srgb(0xffd27a), 0.4, emit=srgb(0xffb040)), 'plaster': lambda: mat('plaster', srgb(0xf6ead2), 0.8),
  'bred': lambda: mat('banner_red', img='banner_red.png', alpha=True), 'bblue': lambda: mat('banner_blue', img='banner_blue.png', alpha=True),
  'flagr': lambda: mat('flag_red', srgb(0xe8443a), 0.7),
}
OBJS = []
L = lambda x, y, z: (x, -z, y)      # three.js coordinates (y up, front +z) -> Blender (z up, front -y)

def finish(o, m, tile=None, mode='box', bevel=0.0, smooth=False):
    o.data.materials.append(M[m]() if isinstance(m, str) else m)
    if tile: uv(o, tile, mode)
    if bevel: b = o.modifiers.new('bev', 'BEVEL'); b.width = bevel; b.segments = 2; b.limit_method = 'ANGLE'
    if smooth:
        for p in o.data.polygons: p.use_smooth = True
    OBJS.append(o); return o
def uv(o, tile, mode):
    bm = bmesh.new(); bm.from_mesh(o.data); lay = bm.loops.layers.uv.verify(); mw = o.matrix_world
    for f in bm.faces:
        n = (mw.to_3x3() @ f.normal).normalized()
        for lp in f.loops:
            p = mw @ lp.vert.co
            if mode == 'cyl':
                cx, cy = mw.translation.x, mw.translation.y; a = math.atan2(p.y - cy, p.x - cx); r = math.hypot(p.x - cx, p.y - cy) or 1
                lp[lay].uv = (a * max(r, 0.6) / tile, p.z / tile) if abs(n.z) < 0.7 else (p.x / tile, p.y / tile)
            else:
                ax = max(range(3), key=lambda i: abs(n[i]))
                lp[lay].uv = (p.y / tile, p.z / tile) if ax == 0 else (p.x / tile, p.z / tile) if ax == 1 else (p.x / tile, p.y / tile)
    bm.to_mesh(o.data); bm.free()
def box(w, h, d, m, x, y, z, tile=None, bevel=0.03, ry=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=L(x, y, z), rotation=(0, 0, -ry)); o = bpy.context.object; o.scale = (w, d, h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True); return finish(o, m, tile, 'box', bevel)
def cyl(r1, r2, h, m, x, y, z, seg=24, tile=None):
    bpy.ops.mesh.primitive_cone_add(vertices=seg, radius1=r2, radius2=r1, depth=h, location=L(x, y, z)); return finish(bpy.context.object, m, tile, 'cyl', 0, True)
def cone(r, h, m, x, y, z, seg=24, tile=0.9, rot=0):
    bpy.ops.mesh.primitive_cone_add(vertices=seg, radius1=r, radius2=0, depth=h, location=L(x, y, z), rotation=(0, 0, rot)); o = bpy.context.object
    o.data.materials.append(M[m]()); bm = bmesh.new(); bm.from_mesh(o.data); lay = bm.loops.layers.uv.verify()
    for f in bm.faces:
        for lp in f.loops:
            v = lp.vert.co; a = math.atan2(v.y, v.x); lp[lay].uv = (a * r / tile, (v.z + h / 2) * 1.15 / tile)      # rows of tiles round the cone
    bm.to_mesh(o.data); bm.free()
    for p in o.data.polygons: p.use_smooth = seg > 6
    OBJS.append(o); return o
def ball(r, m, x, y, z, seg=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2 + 1, radius=r, location=L(x, y, z)); return finish(bpy.context.object, m, None, 'box', 0, True)
def plane(w, h, m, x, y, z, ry=0):
    bpy.ops.mesh.primitive_plane_add(size=1, location=L(x, y, z), rotation=(math.pi / 2, 0, -ry)); o = bpy.context.object; o.scale = (w, h, 1)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True); return finish(o, m)
def half_disc(r, m, x, y, z, thick=0.08, ry=0):
    """A half disc standing up (the top of an arched window or door), facing +z."""
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=r, depth=thick, location=L(x, y, z), rotation=(math.pi / 2, 0, -ry)); o = bpy.context.object
    bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 0), plane_no=(0, 1, 0), clear_inner=True)
    bmesh.ops.contextual_create(bm, geom=[e for e in bm.edges if e.is_boundary]); bm.to_mesh(o.data); bm.free(); return finish(o, m)
def half_ring(R, r, m, x, y, z, ry=0):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=24, minor_segments=8, location=L(x, y, z), rotation=(math.pi / 2, 0, -ry)); o = bpy.context.object
    bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 0), plane_no=(0, 1, 0), clear_inner=True); bm.to_mesh(o.data); bm.free()
    return finish(o, m, None, 'box', 0, True)
def prism(w, h, d, m, x, y, z, tile=0.9):
    """A gable roof: a triangular prism running along z (front to back)."""
    me = bpy.data.meshes.new('gable'); bm = bmesh.new(); hw = w / 2
    vs = [bm.verts.new(v) for v in [(-hw, 0, 0), (hw, 0, 0), (0, 0, h), (-hw, d, 0), (hw, d, 0), (0, d, h)]]
    for f in [(0, 2, 1), (3, 4, 5), (0, 3, 5, 2), (1, 2, 5, 4), (0, 1, 4, 3)]: bm.faces.new([vs[i] for i in f])
    bm.normal_update(); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new('gable', me); bpy.context.collection.objects.link(o)
    o.location = L(x, y, z + d / 2); bpy.context.view_layer.update(); return finish(o, m, tile, 'box')

# ------------------------------------------------------------------ the castle (same layout as src/world/castle.js)
def window(x, y, z, w=0.8, h=1.2, ry=0, flowers=True):
    s, c = math.sin(ry), math.cos(ry); f = lambda dx, dy, dz: (x + dx * c + dz * s, y + dy, z - dx * s + dz * c)
    box(w, h, 0.08, 'glow', *f(0, 0, 0), bevel=0, ry=ry); half_disc(w / 2, 'glow', *f(0, h / 2, 0), ry=ry); half_ring(w / 2 + 0.05, 0.06, 'trim', *f(0, h / 2, 0.05), ry=ry)
    for dx in (-w / 2 - 0.04, w / 2 + 0.04): box(0.1, h, 0.12, 'trim', *f(dx, 0, 0.05), bevel=0.01, ry=ry)
    box(w + 0.22, 0.12, 0.22, 'trim', *f(0, -h / 2 - 0.06, 0.07), ry=ry); box(0.07, h, 0.12, 'wood2', *f(0, 0, 0.05), bevel=0, ry=ry); box(w, 0.06, 0.12, 'wood2', *f(0, 0.1, 0.05), bevel=0, ry=ry)
    if flowers:
        box(w + 0.1, 0.2, 0.26, 'wood', *f(0, -h / 2 - 0.22, 0.2), ry=ry)
        for i in range(5): ball(0.085, 'pink' if i % 2 else 'leaf', *f(-w / 2 + 0.1 + i * (w - 0.2) / 4, -h / 2 - 0.07, 0.22), seg=8)
def merlons(x0, z0, x1, z1, y):
    Ln = math.hypot(x1 - x0, z1 - z0); k = max(2, round(Ln / 0.75))
    for i in range(0, k + 1, 2): t = i / k; box(0.42, 0.5, 0.42, 'cream', x0 + (x1 - x0) * t, y + 0.25, z0 + (z1 - z0) * t, tile=1.2, bevel=0.04)
def ring_merlons(x, z, r, y):
    for i in range(0, 12, 2): a = i / 12 * math.tau; box(0.4, 0.45, 0.32, 'cream', x + math.cos(a) * r, y + 0.22, z + math.sin(a) * r, tile=1.2, bevel=0.04, ry=-a + math.pi / 2)
def flag(x, y, z): cyl(0.035, 0.035, 1.3, 'gold', x, y + 0.65, z, seg=8); ball(0.1, 'gold', x, y + 1.35, z); plane(1.0, 0.42, 'flagr', x + 0.52, y + 1.08, z)
def ivy(x, y, z, h):
    for i in range(int(h * 3)): ball(0.12 + (i % 3) * 0.03, 'leaf', x + math.sin(i * 1.7) * 0.18, y + i * 0.32, z, seg=8)

def build(n):
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    OBJS.clear(); S, Pz = 3.4, 1.0; H = n * S; TOP = Pz + H
    # plinth with arches, terrace balustrade
    PW, PZ0, PZ1 = 10.4, -3.4, 3.0
    box(PW, Pz, PZ1 - PZ0, 'grey', 0, Pz / 2, (PZ0 + PZ1) / 2, tile=1.6, bevel=0.05); box(PW + 0.2, 0.14, PZ1 - PZ0 + 0.2, 'trim', 0, Pz, (PZ0 + PZ1) / 2)
    for i in range(6):
        x = -PW / 2 + 0.9 + i * (PW - 1.8) / 5
        if abs(x) < 1.8: continue
        box(0.7, 0.4, 0.06, 'dark', x, 0.32, PZ1 + 0.02, bevel=0); half_disc(0.35, 'dark', x, 0.52, PZ1 + 0.02, thick=0.06)
    for sx in (-1, 1):
        box(PW / 2 - 1.8, 0.1, 0.18, 'white', sx * (1.8 + (PW / 2 - 1.8) / 2), Pz + 0.62, PZ1 - 0.12)
        for k in range(6): cyl(0.06, 0.06, 0.5, 'white', sx * (2.0 + k * 0.55), Pz + 0.3, PZ1 - 0.12, seg=8)
    # grand stair with a carpet edged in gold, lamp posts
    SN, SZ0, SZ1 = 5, PZ1, PZ1 + 1.7; run = (SZ1 - SZ0) / SN
    for i in range(SN):
        h = Pz * (SN - i) / SN; z = SZ0 + run * (i + 0.5)
        box(3.4, h, run, 'trim', 0, h / 2, z, bevel=0.03); box(1.6, 0.02, run + 0.01, 'carpet', 0, h + 0.01, z, bevel=0)
        for s in (-1, 1): box(0.08, 0.025, run + 0.01, 'gold', s * 0.82, h + 0.012, z, bevel=0)
    box(1.6, 0.02, 1.2, 'carpet', 0, Pz + 0.08, PZ1 - 0.6, bevel=0)
    for s in (-1, 1):
        box(0.3, Pz + 0.5, SZ1 - SZ0, 'white', s * 1.85, (Pz + 0.5) / 2, (SZ0 + SZ1) / 2); cyl(0.05, 0.06, 1.2, 'wood2', s * 1.85, Pz + 1.1, SZ1 - 0.15, seg=8)
        [box(0.32, 0.06, 0.32, 'wood2', s * 1.85, Pz + 1.85 + dy, SZ1 - 0.15) for dy in (-0.19, 0.19)]; box(0.24, 0.32, 0.24, 'glow', s * 1.85, Pz + 1.85, SZ1 - 0.15, bevel=0)
    # main block, battlements, windows
    MW, MZ0, MZ1 = 7.0, -2.4, 2.3
    box(MW, H, MZ1 - MZ0, 'cream', 0, Pz + H / 2, (MZ0 + MZ1) / 2, tile=1.2, bevel=0.04)
    for f in range(1, n + 1): box(MW + 0.14, 0.16, MZ1 - MZ0 + 0.14, 'trim', 0, Pz + f * S - 0.05, (MZ0 + MZ1) / 2)
    box(MW + 0.5, 0.3, MZ1 - MZ0 + 0.5, 'trim', 0, TOP + 0.15, (MZ0 + MZ1) / 2)
    merlons(-MW / 2 - 0.1, MZ1 + 0.15, MW / 2 + 0.1, MZ1 + 0.15, TOP + 0.3); merlons(-MW / 2 - 0.1, MZ0 - 0.15, MW / 2 + 0.1, MZ0 - 0.15, TOP + 0.3)
    merlons(-MW / 2 - 0.15, MZ0, -MW / 2 - 0.15, MZ1, TOP + 0.3); merlons(MW / 2 + 0.15, MZ0, MW / 2 + 0.15, MZ1, TOP + 0.3)
    for f in range(n):
        for x in (-2.5, -1.25, 1.25, 2.5):
            if f == 0 and abs(x) < 2: continue
            window(x, Pz + f * S + 1.8, MZ1 + 0.05)
        for s in (-1, 1):
            for z in (-1.0, 1.0): window(s * (MW / 2 + 0.05), Pz + f * S + 1.8, z, 0.7, 1.1, s * math.pi / 2, f > 0)
    # the gate
    DZ, DH = MZ1 + 0.06, 3.0
    box(2.6, DH + 0.8, 0.3, 'trim', 0, Pz + (DH + 0.8) / 2, DZ + 0.05); half_ring(1.15, 0.22, 'grey', 0, Pz + DH - 0.9, DZ + 0.22)
    box(1.9, DH - 0.9, 0.12, 'wood', 0, Pz + (DH - 0.9) / 2, DZ + 0.22, tile=1.0, bevel=0); half_disc(0.95, 'wood', 0, Pz + DH - 0.9, DZ + 0.22, thick=0.12)
    box(0.05, DH - 0.2, 0.14, 'wood2', 0, Pz + (DH - 0.2) / 2, DZ + 0.26, bevel=0)
    for y in (0.6, 1.5): box(1.9, 0.07, 0.14, 'gold', 0, Pz + y, DZ + 0.27, bevel=0)
    for s in (-1, 1):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.14, minor_radius=0.03, location=L(s * 0.32, Pz + 1.15, DZ + 0.32), rotation=(math.pi / 2, 0, 0)); finish(bpy.context.object, 'gold', smooth=True)
        box(0.12, 0.12, 0.4, 'wood2', s * 1.65, Pz + 2.3, DZ + 0.35); [box(0.32, 0.06, 0.32, 'wood2', s * 1.65, Pz + 2.0 + dy, DZ + 0.55) for dy in (-0.22, 0.22)]; box(0.24, 0.38, 0.24, 'glow', s * 1.65, Pz + 2.0, DZ + 0.55, bevel=0)
    plane(1.5, 3.0, 'bred', 0, Pz + DH + 2.2, DZ + 0.12); box(1.7, 0.08, 0.08, 'gold', 0, Pz + DH + 3.72, DZ + 0.14, bevel=0)
    for s in (-1, 1): plane(0.95, 1.9, 'bblue', s * 2.6, Pz + DH + 1.0, DZ + 0.1); box(1.1, 0.06, 0.06, 'gold', s * 2.6, Pz + DH + 1.96, DZ + 0.12, bevel=0)
    # the keep, its roof, spires and dormer
    KW, KZ, KH = 3.4, -0.2, 3.6
    box(KW, KH, KW, 'cream', 0, TOP + KH / 2, KZ, tile=1.2, bevel=0.04); box(KW + 0.3, 0.25, KW + 0.3, 'trim', 0, TOP + KH, KZ)
    window(0, TOP + 1.6, KZ + KW / 2 + 0.05, 0.9, 1.4)
    cone(KW * 0.86, 4.8, 'blue', 0, TOP + KH + 2.4, KZ, seg=4, tile=0.8, rot=math.pi / 4); ball(0.16, 'gold', 0, TOP + KH + 4.85, KZ); flag(0, TOP + KH + 4.9, KZ)
    for s in (-1, 1): cyl(0.42, 0.45, 1.4, 'cream', s * 1.7, TOP + KH + 0.6, KZ + 1.1, seg=14, tile=1.2); cone(0.62, 1.6, 'blue', s * 1.7, TOP + KH + 2.1, KZ + 1.1, seg=14); ball(0.08, 'gold', s * 1.7, TOP + KH + 2.95, KZ + 1.1)
    gz, gy = KZ + KW / 2 + 0.25, TOP + KH - 0.2
    box(1.6, 1.4, 0.6, 'cream', 0, gy + 0.2, gz, tile=1.2); prism(1.9, 0.9, 0.8, 'blue', 0, gy + 0.9, gz - 0.1); window(0, gy + 0.25, gz + 0.32, 0.6, 0.8, 0, False)
    for s in (-1, 1): x, z, y = s * 2.4, 0.8, TOP + 0.9; box(1.4, 1.5, 1.3, 'trim', x, y, z); prism(1.7, 0.9, 1.4, 'blue', x, y + 0.75, z - 0.05); window(x, y + 0.05, z + 0.68, 0.55, 0.75, 0, True)
    box(MW - 0.4, 0.6, MZ1 - MZ0 - 0.4, 'blue', 0, TOP + 0.3, (MZ0 + MZ1) / 2, tile=0.8, bevel=0)
    # back towers
    for s in (-1, 1):
        x, z, r, th = s * 4.0, -2.2, 1.25, H + 2.6
        cyl(r, r + 0.1, th, 'cream', x, Pz + th / 2, z, seg=28, tile=1.2); cyl(r + 0.28, r + 0.1, 0.4, 'trim', x, Pz + th, z, seg=28); ring_merlons(x, z, r + 0.15, Pz + th + 0.2)
        cone(r + 0.45, 3.6, 'blue', x, Pz + th + 2.25, z, seg=28); flag(x, Pz + th + 4.0, z)
        for f in range(n): window(x, Pz + f * S + 2.2, z + r + 0.02, 0.6, 1.0, 0, f > 0)
    # front towers with lantern pavilions
    for s in (-1, 1):
        x, z, r, th = s * 4.55, 1.5, 1.0, H - 0.6
        cyl(r + 0.15, r + 0.25, 1.4, 'grey', x, 0.7, z, seg=24, tile=1.6); cyl(r, r, th, 'cream', x, Pz + th / 2, z, seg=24, tile=1.2)
        cyl(r + 0.3, r + 0.2, 0.35, 'trim', x, Pz + th + 0.17, z, seg=24); ring_merlons(x, z, r + 0.2, Pz + th + 0.3)
        for k in range(6): a = k / 6 * math.tau; cyl(0.06, 0.06, 1.3, 'wood2', x + math.cos(a) * (r - 0.1), Pz + th + 1.0, z + math.sin(a) * (r - 0.1), seg=6)
        ball(0.28, 'glow', x, Pz + th + 0.95, z); cone(r + 0.5, 1.6, 'red', x, Pz + th + 2.4, z, seg=24); ball(0.1, 'gold', x, Pz + th + 3.25, z); flag(x, Pz + th + 3.25, z)
        plane(0.8, 1.6, 'bblue', x, Pz + 1.6, z + r + 0.03); window(x, Pz + S + 1.6, z + r + 0.02, 0.55, 0.9, 0, True); ivy(x - s * 0.7, Pz, z + 0.75, 4)
    # cottage and gazebo
    x, z, w, d, h = -2.85, 2.4, 1.6, 1.2, 1.7
    box(w, h, d, 'plaster', x, Pz + h / 2, z)
    for dx in (-0.75, 0, 0.75): box(0.07, h, 0.05, 'wood2', x + dx, Pz + h / 2, z + d / 2 + 0.01, bevel=0)
    box(w, 0.07, 0.05, 'wood2', x, Pz + h * 0.6, z + d / 2 + 0.01, bevel=0); prism(w + 0.4, 0.9, d + 0.3, 'red', x, Pz + h, z - 0.15); window(x + 0.35, Pz + 1.0, z + d / 2 + 0.03, 0.45, 0.6, 0, True)
    x, z, r = 2.85, 2.35, 0.75
    cyl(r + 0.1, r + 0.1, 0.15, 'white', x, Pz + 0.08, z, seg=18)
    for k in range(6): a = k / 6 * math.tau; cyl(0.06, 0.06, 1.5, 'white', x + math.cos(a) * r, Pz + 0.85, z + math.sin(a) * r, seg=8)
    cyl(r + 0.12, r + 0.12, 0.14, 'white', x, Pz + 1.65, z, seg=18)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=10, radius=r + 0.1, location=L(x, Pz + 1.7, z)); o = bpy.context.object
    bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 0), plane_no=(0, 0, 1), clear_inner=True); bm.to_mesh(o.data); bm.free()
    finish(o, 'bluep', smooth=True); ball(0.09, 'gold', x, Pz + 2.6, z)
    # flowers and ivy
    for (x, z) in [(-1.6, 2.7), (1.6, 2.7), (-4.0, 2.75), (4.0, 2.75), (-2.0, 3.9), (2.0, 3.9)]:
        y = 0 if z > 3 else Pz; cyl(0.22, 0.17, 0.3, 'trim', x, y + 0.15, z, seg=12)
        for i in range(5): ball(0.11, 'pink' if i % 2 else 'leaf', x + math.cos(i * 1.3) * 0.12, y + 0.36 + (i % 2) * 0.05, z + math.sin(i * 1.3) * 0.12, seg=8)
    ivy(-3.3, Pz, MZ1 + 0.08, 5); ivy(3.3, Pz, MZ1 + 0.08, 6)
    # one object, one primitive per material
    bpy.ops.object.select_all(action='DESELECT')
    for o in OBJS: o.select_set(True)
    bpy.context.view_layer.objects.active = OBJS[0]
    for o in OBJS:
        for md in list(o.modifiers): bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier=md.name)
    bpy.context.view_layer.objects.active = OBJS[0]; bpy.ops.object.join(); o = bpy.context.object; o.name = f'castle_villa_f{n}'
    out = os.path.join(ROOT, 'assets', 'models', f'bld_castle_villa_f{n}.glb')
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_apply=True, export_yup=True)
    tris = sum(len(p.vertices) - 2 for p in o.data.polygons)
    print('wrote', out, 'triangles', tris, 'size KB', os.path.getsize(out) // 1024)

for n in (2, 3): build(n)
