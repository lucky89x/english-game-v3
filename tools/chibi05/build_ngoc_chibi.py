"""Build chr_ngoc_adventurer_v02 — an original stylised chibi hero for EnglishQuestV3.

Run from the repository root with Blender 4.2+/5.x:
    blender --background --python tools/chibi05/build_ngoc_chibi.py
or with the `bpy` Python module:
    python tools/chibi05/build_ngoc_chibi.py

Design reference: REF_01_FEMALE_HERO.png (curly chestnut updo, brass goggles over a red
bandana, red neck scarf, cream shirt, khaki shorts, leather harness, gloves, lace-up boots,
blue potion and map scroll). Everything here is modelled from scratch; no third-party mesh.

Conventions: 1 unit = 1 m, feet at Z=0, character faces Blender -Y (glTF +Z), which is the
direction PlayerController rotates VisualRoot towards.
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix, Quaternion, Euler


from pathlib import Path
ROOT = Path(os.environ.get('NGOC_ROOT', os.getcwd()))
sys.path.insert(0, str(ROOT / 'tools/chibi05'))
import ngoc_face  # noqa: E402

OUT_DIR = ROOT / 'assets/characters/models'
SRC_DIR = ROOT / 'art_source/chibi05'
OUT_DIR.mkdir(parents=True, exist_ok=True)
SRC_DIR.mkdir(parents=True, exist_ok=True)
GLB = OUT_DIR / 'chr_ngoc_adventurer_v02.glb'
BLEND = SRC_DIR / 'chr_ngoc_adventurer_v02.blend'

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 24

# --------------------------------------------------------------------------------------
# Palette atlas: every non-face part samples one flat cell of a small texture, so the
# whole body renders with a single material (+ separate face material).
# --------------------------------------------------------------------------------------
PALETTE = {  # name: (sRGB hex, roughness, metallic)
    'skin': ('f6c8a6', .62, 0), 'skin_dark': ('e8ae8c', .65, 0),
    'hair': ('7b3f1e', .55, 0), 'hair_light': ('9c5730', .5, 0), 'hair_dark': ('5a2b14', .6, 0),
    'bandana': ('c9322c', .7, 0), 'bandana_dark': ('9a2420', .75, 0),
    'scarf': ('d23b30', .72, 0), 'scarf_dark': ('a52b24', .75, 0),
    'brass': ('d39a42', .32, .75), 'brass_dark': ('9c6a2a', .4, .7), 'lens': ('3f7a8c', .08, .25),
    'lens_shine': ('bfe8f0', .05, .1),
    'shirt': ('f4e9d2', .8, 0), 'shirt_shade': ('e2d1ae', .82, 0),
    'shorts': ('cfb487', .8, 0), 'shorts_cuff': ('bb9c6c', .8, 0),
    'leather': ('8c5631', .55, 0), 'leather_dark': ('5f3519', .6, 0), 'leather_light': ('a96d3e', .55, 0),
    'gold': ('e2b04a', .28, .85),
    'boot': ('8e5631', .5, 0), 'boot_cuff': ('b07240', .55, 0), 'sole': ('4a2a17', .7, 0), 'lace': ('f1e2c2', .8, 0),
    'glove': ('7d4626', .55, 0),
    'glass': ('2f9be8', .06, .1), 'potion': ('7fd6ff', .1, 0), 'cork': ('c99c62', .8, 0),
    'parchment': ('f0ddb0', .85, 0), 'parchment_edge': ('d9bd86', .85, 0), 'ribbon': ('c2312c', .7, 0),
    'eye_dark': ('2a140a', .3, 0),
}
CELL = 16
GRID = 16
NAMES = list(PALETTE)


def srgb_to_lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def cell_uv(name):
    i = NAMES.index(name)
    cx, cy = i % GRID, i // GRID
    return ((cx + .5) / GRID, 1 - (cy + .5) / GRID)


def build_palette_images():
    from PIL import Image
    size = CELL * GRID
    alb = Image.new('RGB', (size, size), (255, 0, 255))
    orm = Image.new('RGB', (size, size), (255, 200, 0))
    for i, (n, (hx, rough, metal)) in enumerate(PALETTE.items()):
        x, y = (i % GRID) * CELL, (i // GRID) * CELL
        alb.paste(hex_rgb(hx), (x, y, x + CELL, y + CELL))
        orm.paste((255, int(rough * 255), int(metal * 255)), (x, y, x + CELL, y + CELL))
    p1, p2 = SRC_DIR / 'ngoc_palette_albedo.png', SRC_DIR / 'ngoc_palette_orm.png'
    alb.save(p1)
    orm.save(p2)
    faces = {}
    for key, eyes, mouth in [('happy', 'open', 'smile'), ('blink', 'closed', 'smile'),
                             ('talk', 'open', 'talk'), ('joy', 'happy', 'smile')]:
        img = ngoc_face.make_face(eyes, mouth)
        p = SRC_DIR / f'ngoc_face_{key}.png'
        img.save(p)
        faces[key] = p
        # runtime copies used by the Godot face controller for blinking/talking
        img.save(OUT_DIR / f'ngoc_face_{key}.png')
    return p1, p2, faces


PAL_ALB, PAL_ORM, FACE_PNGS = build_palette_images()


def make_material(name, albedo_path, orm_path=None, rough=.6):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = bpy.data.images.load(str(albedo_path))
    tex.interpolation = 'Closest' if orm_path else 'Linear'
    nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    if orm_path:
        t2 = nt.nodes.new('ShaderNodeTexImage')
        t2.image = bpy.data.images.load(str(orm_path))
        t2.image.colorspace_settings.name = 'Non-Color'
        t2.interpolation = 'Closest'
        sep = nt.nodes.new('ShaderNodeSeparateColor')
        nt.links.new(t2.outputs['Color'], sep.inputs['Color'])
        nt.links.new(sep.outputs['Green'], bsdf.inputs['Roughness'])
        nt.links.new(sep.outputs['Blue'], bsdf.inputs['Metallic'])
    else:
        bsdf.inputs['Roughness'].default_value = rough
    return m


MAT_BODY = make_material('NgocBody', PAL_ALB, PAL_ORM)
MAT_FACE = make_material('NgocFace', FACE_PNGS['happy'], rough=.62)

# --------------------------------------------------------------------------------------
# Geometry helpers
# --------------------------------------------------------------------------------------
PARTS = []  # (object, bones-for-skinning)


def link(obj):
    bpy.context.collection.objects.link(obj)
    return obj


def mesh_obj(name, verts, faces):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], faces)
    me.validate()
    me.update()
    return link(bpy.data.objects.new(name, me))


def paint(obj, color, faces=None):
    """assign palette cell `color` to all (or the given) polygons via UVs"""
    me = obj.data
    if not me.uv_layers:
        me.uv_layers.new(name='UVMap')
    if not me.materials:
        me.materials.append(MAT_BODY)
    uv = me.uv_layers.active.data
    u = cell_uv(color)
    polys = me.polygons if faces is None else [me.polygons[i] for i in faces]
    for p in polys:
        for li in p.loop_indices:
            uv[li].uv = u
    return obj


def finish(obj, color, bones, subsurf=0, smooth=True):
    if subsurf:
        mod = obj.modifiers.new('sub', 'SUBSURF')
        mod.levels = subsurf
        mod.render_levels = subsurf
        bpy.context.view_layer.objects.active = obj
        with bpy.context.temp_override(object=obj, active_object=obj):
            bpy.ops.object.modifier_apply(modifier=mod.name)
    if smooth:
        for p in obj.data.polygons:
            p.use_smooth = True
    if color:
        paint(obj, color)
    PARTS.append((obj, bones))
    return obj


def frame_from(t, ref=None):
    t = t.normalized()
    ref = ref or (Vector((0, 0, 1)) if abs(t.z) < .9 else Vector((1, 0, 0)))
    u = ref - t * ref.dot(t)
    if u.length < 1e-6:
        u = Vector((0, 1, 0)) - t * t.y
    u.normalize()
    v = t.cross(u)
    return u, v


def loft(name, rings, seg=24, caps=(True, True), ref=None, shape=None):
    """rings: list of (center, ra, rb[, twist]) — ellipse cross sections along a path.
    `ref` fixes the 'a' axis direction; `shape(theta, ring_index)` returns a radial scale."""
    verts, faces = [], []
    n = len(rings)
    centers = [Vector(r[0]) for r in rings]
    prev_u = None
    for i, r in enumerate(rings):
        c, ra, rb = centers[i], r[1], r[2]
        tw = r[3] if len(r) > 3 else 0
        rref = r[4] if len(r) > 4 else None
        t = (centers[min(i + 1, n - 1)] - centers[max(i - 1, 0)])
        u, v = frame_from(t, rref if rref is not None else (ref if ref is not None else prev_u))
        prev_u = u
        for j in range(seg):
            a = 2 * math.pi * j / seg + tw
            k = shape(a, i) if shape else 1
            verts.append(c + (u * math.cos(a) * ra + v * math.sin(a) * rb) * k)
    for i in range(n - 1):
        for j in range(seg):
            a, b = i * seg + j, i * seg + (j + 1) % seg
            faces.append((a, b, b + seg, a + seg))
    if caps[0]:
        verts.append(centers[0] - (centers[1] - centers[0]).normalized() * min(rings[0][1], rings[0][2]) * .25)
        ci = len(verts) - 1
        faces += [(ci, (j + 1) % seg, j) for j in range(seg)]
    if caps[1]:
        verts.append(centers[-1] + (centers[-1] - centers[-2]).normalized() * min(rings[-1][1], rings[-1][2]) * .25)
        ci = len(verts) - 1
        base = (n - 1) * seg
        faces += [(ci, base + j, base + (j + 1) % seg) for j in range(seg)]
    return mesh_obj(name, verts, faces)


def ellipsoid(name, center, radii, seg=24, rings=14, rot=None, deform=None):
    verts, faces = [], []
    for i in range(1, rings):
        th = math.pi * i / rings
        for j in range(seg):
            ph = 2 * math.pi * j / seg
            verts.append(Vector((math.sin(th) * math.cos(ph), math.sin(th) * math.sin(ph), math.cos(th))))
    verts.append(Vector((0, 0, 1)))
    verts.append(Vector((0, 0, -1)))
    top, bot = len(verts) - 2, len(verts) - 1
    for i in range(rings - 2):
        for j in range(seg):
            a, b = i * seg + j, i * seg + (j + 1) % seg
            faces.append((a, b, b + seg, a + seg))
    faces += [(top, j, (j + 1) % seg) for j in range(seg)][::1]
    last = (rings - 2) * seg
    faces += [(bot, last + (j + 1) % seg, last + j) for j in range(seg)]
    out = []
    rm = (rot.to_matrix() if rot else Matrix.Identity(3))
    for v in verts:
        p = Vector((v.x * radii[0], v.y * radii[1], v.z * radii[2]))
        if deform:
            p = deform(p, v)
        out.append(Vector(center) + rm @ p)
    # flip winding so normals point outward
    faces = [tuple(reversed(f)) for f in faces]
    return mesh_obj(name, out, faces)


def torus(name, center, R, r, seg=32, rseg=10, rot=None, sx=1, sy=1):
    verts, faces = [], []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        for j in range(rseg):
            b = 2 * math.pi * j / rseg
            verts.append(Vector(((R + r * math.cos(b)) * math.cos(a) * sx, (R + r * math.cos(b)) * math.sin(a) * sy, r * math.sin(b))))
    for i in range(seg):
        for j in range(rseg):
            a = i * rseg + j
            b = i * rseg + (j + 1) % rseg
            c = ((i + 1) % seg) * rseg + (j + 1) % rseg
            d = ((i + 1) % seg) * rseg + j
            faces.append((a, d, c, b))
    rm = rot.to_matrix() if rot else Matrix.Identity(3)
    return mesh_obj(name, [Vector(center) + rm @ v for v in verts], faces)


def tube(name, pts, radii, seg=12, caps=(True, True), ref=None):
    return loft(name, [(p, r, r) for p, r in zip(pts, radii)], seg=seg, caps=caps, ref=ref)


def curve_tube(name, pts, r0, r1, bevel_res=3, taper_pow=1.0, flat=1.0):
    """smooth swept lock using a Blender poly curve with tapered radius (good for hair)."""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = 1.0
    cu.bevel_resolution = bevel_res
    cu.use_fill_caps = True
    sp = cu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    n = len(pts)
    for i, (p, cp) in enumerate(zip(pts, sp.points)):
        t = i / (n - 1)
        cp.co = (*p, 1)
        cp.radius = r0 + (r1 - r0) * (t ** taper_pow)
    ob = link(bpy.data.objects.new(name, cu))
    if flat != 1.0:
        ob.scale = (1, 1, 1)
    with bpy.context.temp_override(selected_objects=[ob], selected_editable_objects=[ob], active_object=ob, object=ob):
        bpy.context.view_layer.objects.active = ob
        for o in bpy.context.view_layer.objects:
            o.select_set(o == ob)
        bpy.ops.object.convert(target='MESH')
    ob = bpy.context.view_layer.objects.active
    ob.name = name
    return ob


def smoothstep(e0, e1, x):
    t = max(0, min(1, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


from mathutils.bvhtree import BVHTree


def bvh_of(*objs):
    dg = bpy.context.evaluated_depsgraph_get()
    verts, polys = [], []
    for o in objs:
        e = o.evaluated_get(dg)
        m = e.to_mesh()
        off = len(verts)
        verts += [o.matrix_world @ v.co for v in m.vertices]
        polys += [[off + i for i in p.vertices] for p in m.polygons]
        e.to_mesh_clear()
    return BVHTree.FromPolygons(verts, polys)


def surf(tree, origin, direction, offset=0.0):
    """raycast from inside a closed shape outwards; returns surface point pushed along its normal"""
    origin, direction = Vector(origin), Vector(direction).normalized()
    hit, n, _, _ = tree.ray_cast(origin, direction, 2.0)
    if hit is None:
        return origin + direction * .2, direction
    if n.dot(direction) < 0:
        n = -n
    return hit + n * offset, n


def wrap_band(name, tree, center, normal, heights, offset, seg=56, thick=.006, prof=None):
    """closed band lying on a surface, defined by a tilted plane through `center`"""
    normal = Vector(normal).normalized()
    u, v = frame_from(normal, Vector((1, 0, 0)) if abs(normal.x) < .9 else Vector((0, 1, 0)))
    rows = []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        d = u * math.cos(a) + v * math.sin(a)
        row = []
        for k, h in enumerate(heights):
            off = offset + (prof(k) if prof else 0)
            row.append(surf(tree, Vector(center) + normal * h, d, off))
        rows.append(row)
    verts, faces = [], []
    nh = len(heights)
    for row in rows:
        for p, n in row:
            verts.append(p + n * thick * .5)
        for p, n in row:
            verts.append(p - n * thick * .5)
    stride = 2 * nh
    for i in range(seg):
        j = (i + 1) % seg
        for k in range(nh - 1):
            a, b = i * stride + k, j * stride + k
            faces.append((a, a + 1, b + 1, b))
            a2, b2 = a + nh, b + nh
            faces.append((a2, b2, b2 + 1, a2 + 1))
        faces.append((i * stride, j * stride, j * stride + nh, i * stride + nh))
        t = nh - 1
        faces.append((i * stride + t, i * stride + nh + t, j * stride + nh + t, j * stride + t))
    ob = mesh_obj(name, verts, faces)
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(ob.data)
    bm.free()
    return ob


def gauss(d, s):
    return math.exp(-(d / s) ** 2)


def shrink_to(obj, target, offset):
    m = obj.modifiers.new('sw', 'SHRINKWRAP')
    m.target = target
    m.wrap_method = 'NEAREST_SURFACEPOINT'
    m.wrap_mode = 'OUTSIDE_SURFACE'
    m.offset = offset
    with bpy.context.temp_override(object=obj, active_object=obj):
        bpy.ops.object.modifier_apply(modifier=m.name)


# --------------------------------------------------------------------------------------
# Proportions (metres). Height ~1.52 m with the head+hair about 42 % of it.
# --------------------------------------------------------------------------------------
HZ = 1.105                # head centre
HA, HB, HC = .285, .255, .258   # head half width / depth / height
SHOULDER = Vector((.150, 0.0, .770))
ARM_DIR = Vector((.60, .03, -.80)).normalized()
UPPER, FORE, HAND = .125, .115, .075
HIP_X = .082

# ---------------- head -------------------------------------------------------------------
def head_deform(p, v):
    x, y, z = p
    nz = v.z
    # fuller cheeks in the lower front, slightly flatter back, soft chin
    cheek = smoothstep(.15, -.55, nz) * smoothstep(.2, -.6, v.y)
    x *= 1 + .07 * cheek
    if v.y > 0:
        y *= 1 - .06 * v.y
    if nz < -.55:
        y -= .02 * (-.55 - nz) * (v.y < 0)
    # little nose bump
    nose = gauss((Vector((x, z)) - Vector((0, -.088))).length, .028) * (v.y < -.7)
    y -= .012 * nose
    return Vector((x, y, z))


head = ellipsoid('Ngoc_Head', (0, 0, HZ), (HA, HB, HC), seg=48, rings=30, deform=head_deform)
me = head.data
me.materials.append(MAT_BODY)   # slot 0: skin from palette
me.materials.append(MAT_FACE)   # slot 1: projected face
uvl = me.uv_layers.new(name='UVMap').data
skin_uv = cell_uv('skin')
for p in me.polygons:
    c = p.center
    front = p.normal.y < -.15 and c.y < -.05 and abs(c.z - HZ) < .26
    p.material_index = 1 if front else 0
    for li in p.loop_indices:
        if front:
            co = me.vertices[me.loops[li].vertex_index].co
            uvl[li].uv = (co.x / (2 * ngoc_face.SPAN) + .5, (co.z - HZ) / (2 * ngoc_face.SPAN) + .5)
        else:
            uvl[li].uv = skin_uv
for p in me.polygons:
    p.use_smooth = True
PARTS.append((head, ['head']))

for s in (-1, 1):
    ear = ellipsoid(f'Ngoc_Ear_{s}', (s * .275, .0, HZ - .03), (.035, .028, .052), seg=12, rings=8)
    finish(ear, 'skin', ['head'])

# ---------------- torso / shirt ---------------------------------------------------------
def torso_shape(a, i):
    # flatten the back slightly, round belly forward
    return 1.0


torso = loft('Ngoc_Shirt', [
    ((0, .005, .455), .150, .118),
    ((0, .000, .520), .150, .122),
    ((0, -.004, .600), .146, .122),
    ((0, -.004, .690), .150, .116),
    ((0, .000, .755), .140, .104),
    ((0, .004, .800), .100, .080),
    ((0, .006, .830), .055, .050),
], seg=28, caps=(True, True), ref=Vector((1, 0, 0)))
finish(torso, 'shirt', ['hips', 'spine', 'chest', 'neck'], subsurf=1)
# shirt hem flare
hem = loft('Ngoc_ShirtHem', [((0, .004, .505), .158, .128), ((0, .006, .470), .168, .136), ((0, .006, .452), .166, .134)],
           seg=28, caps=(False, False), ref=Vector((1, 0, 0)))
finish(hem, 'shirt', ['hips', 'spine'], subsurf=1)
neck = tube('Ngoc_Neck', [(0, .006, .80), (0, .006, .88)], [.052, .050], seg=14)
finish(neck, 'skin', ['neck', 'head'])
# collar flaps
for s in (-1, 1):
    col = ellipsoid(f'Ngoc_Collar_{s}', (s * .040, -.050, .805), (.040, .010, .026), seg=12, rings=8,
                    rot=Euler((math.radians(-25), math.radians(-28 * s), math.radians(14 * s))).to_quaternion())
    finish(col, 'shirt_shade', ['chest'])

# ---------------- shorts ----------------------------------------------------------------
shorts = loft('Ngoc_Shorts', [
    ((0, .006, .515), .150, .122),
    ((0, .010, .460), .158, .128),
    ((0, .012, .405), .160, .126),
    ((0, .012, .370), .120, .095),
], seg=28, caps=(False, True), ref=Vector((1, 0, 0)))
finish(shorts, 'shorts', ['hips'], subsurf=1)
for s in (-1, 1):
    leg = loft(f'Ngoc_ShortsLeg_{s}', [
        ((s * .072, .010, .440), .085, .088),
        ((s * .086, .010, .370), .084, .084),
        ((s * .092, .008, .315), .086, .086),
    ], seg=20, caps=(False, False))
    finish(leg, 'shorts', ['hips', f'thigh.{"L" if s > 0 else "R"}'], subsurf=1)
    cuff = torus(f'Ngoc_ShortsCuff_{s}', (s * .092, .008, .318), .082, .014, seg=24, rseg=8)
    finish(cuff, 'shorts_cuff', [f'thigh.{"L" if s > 0 else "R"}'])

# ---------------- legs & boots ----------------------------------------------------------
for s in (-1, 1):
    side = 'L' if s > 0 else 'R'
    leg = tube(f'Ngoc_Leg_{s}', [(s * .090, .008, .34), (s * .090, .006, .26), (s * .090, .004, .18)], [.050, .046, .044], seg=14)
    finish(leg, 'skin', [f'thigh.{side}', f'shin.{side}'], subsurf=1)
    # boot shaft
    shaft = loft(f'Ngoc_BootShaft_{s}', [
        ((s * .090, .004, .070), .066, .070),
        ((s * .090, .004, .140), .062, .064),
        ((s * .090, .004, .205), .064, .064),
        ((s * .090, .004, .225), .066, .066),
    ], seg=20, caps=(False, False))
    finish(shaft, 'boot', [f'shin.{side}', f'foot.{side}'], subsurf=1)
    cuffb = torus(f'Ngoc_BootCuff_{s}', (s * .090, .004, .228), .066, .020, seg=24, rseg=8)
    finish(cuffb, 'boot_cuff', [f'shin.{side}'])
    foot = ellipsoid(f'Ngoc_BootFoot_{s}', (s * .092, -.040, .058), (.072, .118, .066), seg=22, rings=12,
                     deform=lambda p, v: Vector((p.x * (1 + .12 * max(0, -v.y)), p.y, p.z * (1 - .25 * max(0, -v.y)) if p.z > 0 else p.z * .55)))
    finish(foot, 'boot', [f'foot.{side}', f'shin.{side}'], subsurf=0)
    sole = loft(f'Ngoc_BootSole_{s}', [
        ((s * .092, .07, .012), .074, .010),
        ((s * .092, .02, .012), .078, .010),
        ((s * .093, -.06, .012), .080, .010),
        ((s * .094, -.135, .014), .062, .010),
    ], seg=16, caps=(True, True), ref=Vector((1, 0, 0)))
    finish(sole, 'sole', [f'foot.{side}'])
    # criss-cross laces on the front of the shaft
    for k in range(3):
        z = .095 + k * .040
        for d in (-1, 1):
            l = tube(f'Ngoc_Lace_{s}_{k}_{d}', [(s * .090 - .030 * d, -.064, z), (s * .090 + .030 * d, -.068, z + .030)], [.0065, .0065], seg=6)
            finish(l, 'lace', [f'shin.{side}'])
    bow = ellipsoid(f'Ngoc_LaceBow_{s}', (s * .090, -.071, .220), (.022, .008, .012), seg=10, rings=6)
    finish(bow, 'lace', [f'shin.{side}'])

# ---------------- arms ------------------------------------------------------------------
for s in (-1, 1):
    side = 'L' if s > 0 else 'R'
    sh = Vector((s * SHOULDER.x, SHOULDER.y, SHOULDER.z))
    d = Vector((s * ARM_DIR.x, ARM_DIR.y, ARM_DIR.z))
    elbow = sh + d * UPPER
    wrist = elbow + d * FORE
    # puffy short sleeve
    sleeve = loft(f'Ngoc_Sleeve_{s}', [
        (sh - d * .03, .050, .050),
        (sh + d * .03, .068, .066),
        (sh + d * .075, .066, .064),
        (sh + d * .105, .056, .054),
    ], seg=18, caps=(True, False))
    finish(sleeve, 'shirt', ['chest', f'upper_arm.{side}'], subsurf=1)
    scuff = torus(f'Ngoc_SleeveCuff_{s}', sh + d * .103, .054, .012, seg=20, rseg=8,
                  rot=Vector((0, 0, 1)).rotation_difference(d))
    finish(scuff, 'shirt_shade', [f'upper_arm.{side}'])
    arm = tube(f'Ngoc_Arm_{s}', [sh + d * .06, elbow, wrist - d * .01], [.040, .036, .032], seg=14)
    finish(arm, 'skin', [f'upper_arm.{side}', f'forearm.{side}'], subsurf=1)
    # glove: cuff + mitten hand + thumb
    gcuff = loft(f'Ngoc_GloveCuff_{s}', [(wrist - d * .035, .040, .040), (wrist - d * .005, .044, .044), (wrist + d * .010, .040, .040)],
                 seg=16, caps=(False, False))
    finish(gcuff, 'leather_dark', [f'forearm.{side}', f'hand.{side}'], subsurf=1)
    hc = wrist + d * .045
    hand = ellipsoid(f'Ngoc_Hand_{s}', hc, (.036, .026, .046), seg=16, rings=10,
                     rot=Vector((0, 0, 1)).rotation_difference(d))
    finish(hand, 'glove', [f'hand.{side}'])
    thumb = ellipsoid(f'Ngoc_Thumb_{s}', hc + Vector((0, -.026, .008)) - d * .008, (.012, .012, .024), seg=10, rings=8,
                      rot=Vector((0, 0, 1)).rotation_difference((d + Vector((0, -.6, 0))).normalized()))
    finish(thumb, 'glove', [f'hand.{side}'])
    # skin finger tips peeking out of the fingerless gloves
    tips = ellipsoid(f'Ngoc_FingerTips_{s}', hc + d * .036, (.030, .021, .016), seg=12, rings=8,
                     rot=Vector((0, 0, 1)).rotation_difference(d))
    finish(tips, 'skin', [f'hand.{side}'])

# ---------------- harness, belt and kit -------------------------------------------------
belt = torus('Ngoc_Belt', (0, .009, .510), .156, .016, seg=40, rseg=8, sy=.128 / .156)
for v in belt.data.vertices:
    v.co.z += (v.co.z - .510) * .6
finish(belt, 'leather', ['hips'])
buckle = torus('Ngoc_Buckle', (0, -.118, .510), .026, .0075, seg=4, rseg=6,
               rot=Euler((math.radians(90), math.radians(45), 0)).to_quaternion())
finish(buckle, 'gold', ['hips'], smooth=False)
# diagonal bandolier strap from right shoulder to left hip, wrapped onto the shirt
TORSO_TREE = bvh_of(torso)
phi = math.radians(52)
strap = wrap_band('Ngoc_Strap', TORSO_TREE, (0, 0, .640), (math.sin(phi), 0, math.cos(phi)), [-.016, 0, .016], .006, seg=64, thick=.008)
finish(strap, 'leather_dark', ['hips', 'spine', 'chest'])
sp, sn = surf(TORSO_TREE, (0, 0, .64), (-.55, -1, .45), .016)
sbuckle = torus('Ngoc_StrapBuckle', sp, .017, .0055, seg=4, rseg=6,
                rot=Vector((0, 0, 1)).rotation_difference(sn) @ Quaternion((0, 0, 1), math.radians(45)))
finish(sbuckle, 'gold', ['chest'], smooth=False)
bp, bn = surf(TORSO_TREE, (0, 0, .64), (.45, -1, -.30), .012)
badge = ellipsoid('Ngoc_StrapBadge', bp, (.020, .020, .006), seg=10, rings=6, rot=Vector((0, 0, 1)).rotation_difference(bn))
finish(badge, 'brass', ['spine'])
# hip pouch (character's right side = -X)
PQ = Quaternion((0, 0, 1), math.radians(-38))
PC = Vector((-.150, -.062, .452))
pouch = loft('Ngoc_Pouch', [(PC + PQ @ Vector((0, 0, -.048)), .052, .028), (PC, .056, .032), (PC + PQ @ Vector((0, 0, .046)), .054, .030)],
             seg=16, caps=(True, True), ref=PQ @ Vector((1, 0, 0)), shape=lambda a, i: 1 + .08 * math.cos(4 * a))
finish(pouch, 'leather', ['hips'], subsurf=1)
flap = ellipsoid('Ngoc_PouchFlap', PC + PQ @ Vector((0, -.030, .032)), (.054, .010, .026), seg=14, rings=8,
                 rot=PQ @ Quaternion((1, 0, 0), math.radians(-12)))
finish(flap, 'leather_light', ['hips'])
pstud = ellipsoid('Ngoc_PouchStud', PC + PQ @ Vector((0, -.042, .016)), (.009, .005, .009), seg=8, rings=6)
finish(pstud, 'gold', ['hips'])
# blue potion on the left hip (+X)
POT = Vector((.168, -.060, .440))
flask = ellipsoid('Ngoc_Potion', POT, (.040, .040, .042), seg=18, rings=12)
finish(flask, 'glass', ['hips'])
liquid_hi = ellipsoid('Ngoc_PotionShine', POT + Vector((-.012, -.033, .015)), (.010, .006, .014), seg=8, rings=6)
finish(liquid_hi, 'lens_shine', ['hips'])
pneck = tube('Ngoc_PotionNeck', [POT + Vector((0, 0, .034)), POT + Vector((0, 0, .062))], [.014, .013], seg=10)
finish(pneck, 'glass', ['hips'])
cork = tube('Ngoc_PotionCork', [POT + Vector((0, 0, .058)), POT + Vector((0, 0, .080))], [.015, .013], seg=10)
finish(cork, 'cork', ['hips'])
holder = torus('Ngoc_PotionHolder', POT + Vector((0, 0, .006)), .041, .006, seg=20, rseg=6)
finish(holder, 'leather_dark', ['hips'])
# rolled map scroll tucked diagonally behind the strap on the back
sc_a, sc_b = Vector((-.15, .150, .520)), Vector((.12, .150, .760))
scroll = tube('Ngoc_Scroll', [sc_a, sc_b], [.030, .030], seg=16)
finish(scroll, 'parchment', ['chest', 'spine'])
for t in (0.0, 1.0):
    endp = sc_a.lerp(sc_b, t)
    cap = torus(f'Ngoc_ScrollEnd_{t}', endp, .024, .009, seg=16, rseg=6, rot=Vector((0, 0, 1)).rotation_difference(sc_b - sc_a))
    finish(cap, 'parchment_edge', ['chest', 'spine'])
rib = torus('Ngoc_ScrollRibbon', sc_a.lerp(sc_b, .5), .032, .006, seg=16, rseg=6, rot=Vector((0, 0, 1)).rotation_difference(sc_b - sc_a))
finish(rib, 'ribbon', ['chest', 'spine'])

# ---------------- neck scarf ------------------------------------------------------------
scarf = torus('Ngoc_Scarf', (0, .000, .835), .082, .036, seg=40, rseg=12, sy=.92)
for v in scarf.data.vertices:
    # lower at the front, chunkier folds
    v.co.z -= .02 * max(0, -v.co.y / .1)
    a = math.atan2(v.co.y, v.co.x)
    v.co.z += .006 * math.sin(a * 5)
finish(scarf, 'scarf', ['neck', 'chest'])
knot = ellipsoid('Ngoc_ScarfKnot', (-.050, -.090, .800), (.034, .026, .030), seg=14, rings=10)
finish(knot, 'scarf_dark', ['chest'])
# two flowing tails sweeping back on her right side
for k, (dz, spread, ln) in enumerate([(0, .0, 1.0), (-.03, .05, .82)]):
    pts = []
    for i in range(9):
        t = i / 8
        pts.append((Vector((-.060 - .16 * t - spread * t, -.08 + .30 * t, .790 - .10 * t + .06 * math.sin(t * 3.0) + dz)), ln))
    rings = [(p, .040 * (1 - .35 * (i / 8)), .008) for i, (p, _) in enumerate(pts)]
    tail = loft(f'Ngoc_ScarfTail_{k}', rings, seg=12, ref=Vector((0, 0, 1)))
    finish(tail, 'scarf' if k == 0 else 'scarf_dark', ['scarf_tail.R'])

# ---------------- hair ------------------------------------------------------------------
HAIR_OFF = .024
HAIR_C = Vector((0, .014, HZ + .014))
HAIR_R = (HA + HAIR_OFF, HB + HAIR_OFF + .012, HC + HAIR_OFF)
proxy = ellipsoid('_HairProxy', HAIR_C, HAIR_R, seg=40, rings=24)
HAIR_TREE = bvh_of(proxy)
HEAD_TREE = bvh_of(head)
bpy.data.objects.remove(proxy)
HC_W = Vector((0, 0, HZ))   # ray origin for head-surface work


def hair_dir(az, el):
    """direction from the head centre; az=0 is the face, +az towards her left (+X)"""
    return Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))


def cap_ridges(p, v):
    d = p.normalized() if p.length else p
    az = math.atan2(d.x, -d.y)
    el = math.asin(max(-1, min(1, d.z)))
    ridge = (.5 + .5 * math.cos(13 * az + 1.6 * math.sin(el * 2.5))) ** 2.2
    amp = .022 * smoothstep(-.9, -.2, el) * (1 - .6 * smoothstep(.9, 1.3, el))
    return p + d * (amp * ridge + .004 * math.sin(az * 7 + el * 5))


cap = ellipsoid('Ngoc_HairCap', HAIR_C, HAIR_R, seg=64, rings=32, deform=cap_ridges)
bm = bmesh.new()
bm.from_mesh(cap.data)
kill = []
for f in bm.faces:
    c = f.calc_center_median()
    rel = c - Vector((0, 0, HZ))
    ang = math.atan2(abs(c.x), -c.y)          # 0 at the face centre, pi/2 at the ear
    hairline = .080 + .045 * smoothstep(.35, .95, ang)
    if ang < .95 and rel.z < hairline:
        kill.append(f)
    elif ang < 1.45 and rel.z < -.115:
        kill.append(f)
    elif rel.z < -.205 and c.y < .10:
        kill.append(f)
    elif rel.z < -.235:
        kill.append(f)
bmesh.ops.delete(bm, geom=kill, context='FACES')
bm.to_mesh(cap.data)
bm.free()
finish(cap, 'hair', ['head'])


def lock(name, pts, r0, r1, color='hair', res=1, pw=1.0, bone='head'):
    ob = curve_tube(name, pts, r0, r1, bevel_res=res, taper_pow=pw)
    finish(ob, color, [bone])
    return ob


def helix(base, axis, length, radius, turns, n=26, phase=0.0, shrink=.5):
    axis = Vector(axis).normalized()
    u, v = frame_from(axis)
    pts = []
    for i in range(n):
        t = i / (n - 1)
        a = phase + 2 * math.pi * turns * t
        r = radius * (1 - shrink * t)
        pts.append(Vector(base) + axis * length * t + (u * math.cos(a) + v * math.sin(a)) * r)
    return pts


def on_hair(az, el, off=.0):
    return surf(HAIR_TREE, HAIR_C, hair_dir(az, el), off)[0]


HAIR_COLS = ['hair', 'hair_light', 'hair_dark']

# front puffs above the bandana: curly volume on the crown towards the face
for k, az in enumerate((-.62, -.22, .22, .62)):
    p = on_hair(az, math.radians(58), -.006)
    puff = ellipsoid(f'Ngoc_CrownPuff_{k}', p, (.075, .062, .052), seg=14, rings=9,
                     rot=Vector((0, 0, 1)).rotation_difference((p - HAIR_C).normalized()))
    finish(puff, HAIR_COLS[k % 2], ['head'])

# fringe: chunky hooked curls tumbling out under the bandana onto the forehead
for i, (az0, da, el0, r0) in enumerate([(-.04, -.30, 24, .034), (.10, .30, 24, .032), (-.36, -.26, 22, .032),
                                        (.40, .26, 22, .030), (-.66, -.24, 16, .030), (.68, .24, 16, .030)]):
    pts = []
    keys = [(0, el0, .030), (.45, el0 - 8, .016), (.85, el0 - 13, .013), (1.0, el0 - 10, .016), (.86, el0 - 5, .022)]
    for j in range(len(keys) - 1):
        for k in range(5):
            t = k / 5
            f0, e0, o0 = keys[j]
            f1, e1, o1 = keys[j + 1]
            f, e, o = f0 + (f1 - f0) * t, e0 + (e1 - e0) * t, o0 + (o1 - o0) * t
            pts.append(surf(HEAD_TREE, HC_W, hair_dir(az0 + da * f, math.radians(e)), o)[0])
    f, e, o = keys[-1]
    pts.append(surf(HEAD_TREE, HC_W, hair_dir(az0 + da * f, math.radians(e)), o)[0])
    lock(f'Ngoc_Fringe_{i}', pts, r0, r0 * .55, color=HAIR_COLS[i % 3], res=2, pw=1.5)

# side ringlets: chunky corkscrew curls framing the face, down to the shoulders
for s in (-1, 1):
    for k, (az, el, ln, ph) in enumerate([(74, -6, .24, 0.0), (94, -10, .29, 1.3), (114, -14, .30, 2.6), (136, -18, .27, .7)]):
        base = on_hair(math.radians(az) * s, math.radians(el), -.012)
        axis = (s * .20, .05 * (k - 1.5), -1)
        lock(f'Ngoc_SideCurl_{s}_{k}', helix(base, axis, ln, .020, 1.7, n=26, phase=ph, shrink=.2), .048, .024,
             color=HAIR_COLS[k % 3], pw=1.3, res=2)

# nape ringlets
for k in range(7):
    az = math.radians(148 + k * 10.7)
    base = on_hair(az, math.radians(-20), -.01)
    out = (base - HAIR_C)
    out.z = 0
    out.normalize()
    lock(f'Ngoc_BackCurl_{k}', helix(base, out * .25 + Vector((0, 0, -1)), .19, .020, 1.5, n=18, phase=k * .9, shrink=.2), .046, .022,
         color=HAIR_COLS[k % 3], pw=1.2)

# the top bun: a big round core wrapped with thick coils + two loose curls
BUN = Vector((0, .085, HZ + HC + .055))
bun_core = ellipsoid('Ngoc_BunCore', BUN, (.135, .125, .105), seg=24, rings=14)
finish(bun_core, 'hair', ['bun'])
BUN_TREE = bvh_of(bun_core)
for k in range(6):
    nrm = Vector((math.cos(k * 2.1), math.sin(k * 2.1), 1.1 + .5 * (k % 2))).normalized()
    u, v = frame_from(nrm)
    pts = []
    for i in range(18):
        t = i / 17
        a = k * 1.1 + 3.3 * t
        dirv = (u * math.cos(a) + v * math.sin(a))
        p, _ = surf(BUN_TREE, BUN, dirv, .010)
        pts.append(p)
    lock(f'Ngoc_BunCoil_{k}', pts, .042, .030, color=HAIR_COLS[k % 3], bone='bun', res=2)
for k, a in enumerate((.6, 3.4)):
    base = BUN + Vector((math.cos(a) * .10, math.sin(a) * .09, .045))
    lock(f'Ngoc_BunCurl_{k}', helix(base, (math.cos(a), math.sin(a), .6), .075, .018, 1.2, n=16, phase=a, shrink=.3),
         .026, .012, color='hair_light', bone='bun', pw=1.2)
bun_base = ellipsoid('Ngoc_BunBase', BUN + Vector((0, -.010, -.075)), (.135, .120, .058), seg=20, rings=10)
finish(bun_base, 'hair_dark', ['head'])

# ---------------- bandana + goggles -----------------------------------------------------
BAND_N = Vector((0, .42, 1)).normalized()          # higher at the front, lower at the back
band_c = HAIR_C + Vector((0, 0, .040))
band = wrap_band('Ngoc_Bandana', HAIR_TREE, band_c, BAND_N, [-.036, -.024, -.008, .008, .024, .036], .015, seg=64, thick=.010,
                 prof=lambda k: (0, .005, .007, .007, .005, 0)[k])
finish(band, 'bandana', ['head'])
# knot and two tails on her left, behind the ear
KN, KN_N = surf(HAIR_TREE, band_c, Vector((.75, .66, -.28)), .026)
kn = ellipsoid('Ngoc_BandanaKnot', KN, (.036, .030, .034), seg=12, rings=8)
finish(kn, 'bandana_dark', ['head'])
for k, (dz, sw) in enumerate(((-.11, .03), (-.07, .09))):
    pts = [KN + Vector((.015 + .06 * t + .02 * math.sin(t * 2.5), .02 + sw * t, dz * t)) for t in [i / 6 for i in range(7)]]
    rings = [(p, .028 * (1 - .35 * i / 6), .007) for i, p in enumerate(pts)]
    tl = loft(f'Ngoc_BandanaTail_{k}', rings, seg=10, ref=Vector((0, 1, 0)))
    finish(tl, 'bandana' if k else 'bandana_dark', ['head'])

# goggle strap around the head, just above the bandana
GS_N = Vector((0, .25, 1)).normalized()
gs_c = HAIR_C + Vector((0, 0, .130))
gstrap = wrap_band('Ngoc_GoggleStrap', HAIR_TREE, gs_c, GS_N, [-.016, .0, .016], .026, seg=64, thick=.010)
finish(gstrap, 'leather_dark', ['head'])
# big brass goggles resting on the crown, lenses looking forward/up
for s in (-1, 1):
    p, n = surf(HAIR_TREE, HAIR_C, hair_dir(math.radians(25) * s, math.radians(52)), .030)
    q = Vector((0, 0, 1)).rotation_difference(n)
    rim = torus(f'Ngoc_GoggleRim_{s}', p + n * .020, .054, .016, seg=24, rseg=8, rot=q)
    finish(rim, 'brass', ['head'])
    cup = loft(f'Ngoc_GoggleCup_{s}', [(p - n * .012, .050, .050), (p + n * .018, .059, .059)], seg=24, caps=(True, False))
    finish(cup, 'brass_dark', ['head'])
    lens = ellipsoid(f'Ngoc_GoggleLens_{s}', p + n * .018, (.046, .046, .010), seg=20, rings=10, rot=q)
    finish(lens, 'lens', ['head'])
    shine = ellipsoid(f'Ngoc_GoggleShine_{s}', p + n * .027 + (q @ Vector((-.014, .014, 0))), (.012, .008, .003), seg=8, rings=6, rot=q)
    finish(shine, 'lens_shine', ['head'])
    for r in range(4):  # rivets
        a = math.pi / 4 + r * math.pi / 2
        rv = ellipsoid(f'Ngoc_GoggleRivet_{s}_{r}', p + n * .034 + q @ Vector((math.cos(a) * .050, math.sin(a) * .054, 0)), (.006, .006, .004),
                       seg=6, rings=4, rot=q)
        finish(rv, 'gold', ['head'])
bl = on_hair(math.radians(-9), math.radians(53), .056)
br = on_hair(math.radians(9), math.radians(53), .056)
bridge = tube('Ngoc_GoggleBridge', [bl, (bl + br) / 2 + Vector((0, -.004, .010)), br], [.011, .011, .011], seg=8)
finish(bridge, 'brass', ['head'])

# --------------------------------------------------------------------------------------
# Armature
# --------------------------------------------------------------------------------------
if os.environ.get('NGOC_STAGE') == 'mesh':
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))
    print('saved mesh stage', BLEND)
    raise SystemExit(0)

arm_data = bpy.data.armatures.new('NgocRig')
rig = link(bpy.data.objects.new('NgocRig', arm_data))
bpy.context.view_layer.objects.active = rig
for o in bpy.context.view_layer.objects:
    o.select_set(o == rig)
bpy.ops.object.mode_set(mode='EDIT')
EB = arm_data.edit_bones


def bone(name, head, tail, parent=None, deform=True):
    b = EB.new(name)
    b.head, b.tail = Vector(head), Vector(tail)
    b.roll = 0
    b.use_deform = deform
    if parent:
        b.parent = EB[parent]
    return b


bone('root', (0, 0, 0), (0, -.12, 0), deform=False)
bone('hips', (0, 0, .460), (0, 0, .560), 'root')
bone('spine', (0, 0, .560), (0, 0, .680), 'hips')
bone('chest', (0, 0, .680), (0, 0, .815), 'spine')
bone('neck', (0, 0, .815), (0, 0, .875), 'chest')
bone('head', (0, 0, .875), (0, 0, 1.250), 'neck')
bone('bun', (0, .075, HZ + HC + .000), (0, .090, HZ + HC + .130), 'head')
bone('scarf_tail.R', (-.070, -.060, .800), (-.220, .180, .730), 'chest')
for s, side in ((1, 'L'), (-1, 'R')):
    sh = Vector((s * SHOULDER.x, SHOULDER.y, SHOULDER.z))
    d = Vector((s * ARM_DIR.x, ARM_DIR.y, ARM_DIR.z))
    bone(f'shoulder.{side}', (s * .040, 0, .785), sh, 'chest')
    bone(f'upper_arm.{side}', sh, sh + d * UPPER, f'shoulder.{side}')
    bone(f'forearm.{side}', sh + d * UPPER, sh + d * (UPPER + FORE), f'upper_arm.{side}')
    bone(f'hand.{side}', sh + d * (UPPER + FORE), sh + d * (UPPER + FORE + HAND), f'forearm.{side}')
    bone(f'thigh.{side}', (s * HIP_X, .008, .440), (s * .090, .006, .260), 'hips')
    bone(f'shin.{side}', (s * .090, .006, .260), (s * .090, .004, .075), f'thigh.{side}')
    bone(f'foot.{side}', (s * .090, .004, .075), (s * .092, -.115, .030), f'shin.{side}')
for b in EB:
    if b.parent and (b.head - b.parent.tail).length < 1e-4:
        b.use_connect = True
bpy.ops.object.mode_set(mode='OBJECT')
SEGS = {b.name: (b.head_local.copy(), b.tail_local.copy()) for b in arm_data.bones}
REST_Q = {b.name: b.matrix_local.to_quaternion() for b in arm_data.bones}


def seg_dist(p, a, b):
    ab = b - a
    t = max(0, min(1, (p - a).dot(ab) / ab.length_squared))
    return (p - (a + ab * t)).length


# --------------------------------------------------------------------------------------
# Skin weights: smooth inverse-distance falloff over each part's allowed bones.
# --------------------------------------------------------------------------------------
for obj, bones in PARTS:
    groups = {b: obj.vertex_groups.new(name=b) for b in bones}
    for v in obj.data.vertices:
        if len(bones) == 1:
            groups[bones[0]].add([v.index], 1.0, 'REPLACE')
            continue
        ws = [(b, 1 / (seg_dist(v.co, *SEGS[b]) + .012) ** 5) for b in bones]
        ws.sort(key=lambda x: -x[1])
        ws = ws[:3]
        tot = sum(w for _, w in ws)
        for b, w in ws:
            if w / tot > .02:
                groups[b].add([v.index], w / tot, 'REPLACE')

# join everything into one skinned mesh (2 materials: palette body + painted face)
objs = [o for o, _ in PARTS]
for o in bpy.context.view_layer.objects:
    o.select_set(o in objs)
bpy.context.view_layer.objects.active = head
with bpy.context.temp_override(active_object=head, selected_editable_objects=objs, selected_objects=objs):
    bpy.ops.object.join()
body = head
body.name = 'Ngoc'
body.data.name = 'Ngoc'
# keep material order deterministic: 0 body, 1 face
mats = [m.name for m in body.data.materials]
print('materials', mats)
body.parent = rig
mod = body.modifiers.new('NgocRig', 'ARMATURE')
mod.object = rig
# merge exactly coincident verts per part isn't needed; just normalise weights
bpy.context.view_layer.objects.active = body
with bpy.context.temp_override(object=body, active_object=body):
    bpy.ops.object.vertex_group_normalize_all(lock_active=False)
    bpy.ops.object.vertex_group_limit_total(limit=4)
tri_count = sum(len(p.vertices) - 2 for p in body.data.polygons)
print('triangles', tri_count, 'vertices', len(body.data.vertices))

# --------------------------------------------------------------------------------------
# Animation helpers. Poses use armature-space Euler degrees:
#   X+ = swing backwards / lean forward, Y = side roll, Z = yaw (twist).
# --------------------------------------------------------------------------------------
for pb in rig.pose.bones:
    pb.rotation_mode = 'QUATERNION'
BONES = [b.name for b in arm_data.bones]


def arm_q(x=0, y=0, z=0):
    return (Quaternion((0, 0, 1), math.radians(z)) @ Quaternion((0, 1, 0), math.radians(y)) @
            Quaternion((1, 0, 0), math.radians(x)))


def apply_pose(pose, frame):
    for name in BONES:
        pb = rig.pose.bones[name]
        x, y, z = pose.get(name, (0, 0, 0))
        rq = REST_Q[name]
        pb.rotation_quaternion = rq.inverted() @ arm_q(x, y, z) @ rq
        pb.keyframe_insert('rotation_quaternion', frame=frame, group=name)
        if name in ('hips', 'root'):
            loc = Vector(pose.get(name + '_loc', (0, 0, 0)))
            pb.location = rq.inverted() @ loc
            pb.keyframe_insert('location', frame=frame, group=name)


def add(p, bone, x=0, y=0, z=0):
    a = p.get(bone, (0, 0, 0))
    p[bone] = (a[0] + x, a[1] + y, a[2] + z)


def arms(p, side, abduct=0, swing=0, elbow=0, twist=0, wrist=0):
    """abduct>0 raises the arm sideways, swing>0 moves it back, elbow<0 bends forward"""
    s = 1 if side == 'L' else -1
    add(p, f'upper_arm.{side}', swing, -s * abduct, twist * s)
    add(p, f'forearm.{side}', elbow, 0, 0)
    add(p, f'hand.{side}', wrist, 0, 0)


def base_pose():
    p = {}
    arms(p, 'L', abduct=-16, elbow=-12)
    arms(p, 'R', abduct=-16, elbow=-12)
    return p


def legs(p, side, thigh=0, knee=0, foot=None, spread=0):
    s = 1 if side == 'L' else -1
    add(p, f'thigh.{side}', thigh, -s * spread, 0)
    add(p, f'shin.{side}', knee, 0, 0)
    add(p, f'foot.{side}', -(thigh + knee) * .9 if foot is None else foot, 0, 0)


def lerp_pose(a, b, t):
    out = {}
    for k in set(a) | set(b):
        va, vb = a.get(k, (0, 0, 0)), b.get(k, (0, 0, 0))
        out[k] = tuple(x + (y - x) * t for x, y in zip(va, vb))
    return out


def ease(t):
    return t * t * (3 - 2 * t)


ACTIONS = {}


def make_action(name, frames, fn, loop=True):
    act = bpy.data.actions.new(name)
    act.use_fake_user = True
    rig.animation_data_create()
    rig.animation_data.action = act
    last = frames if loop else frames
    for f in range(0, last + 1):
        apply_pose(fn(f / frames, f), f)
    act.frame_range = (0, frames)
    act.use_frame_range = True
    act.use_cyclic = loop
    for fc in getattr(act, 'fcurves', []) or []:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'
    ACTIONS[name] = act
    track = rig.animation_data.nla_tracks.new()
    track.name = name
    strip = track.strips.new(name, 0, act)
    track.mute = True
    rig.animation_data.action = None
    return act


def keyed(keys):
    """keys: list of (t, pose) with t in [0,1]; eased interpolation"""
    def fn(t, f):
        for (t0, p0), (t1, p1) in zip(keys, keys[1:]):
            if t0 <= t <= t1:
                return lerp_pose(p0, p1, ease((t - t0) / max(1e-6, t1 - t0)))
        return keys[-1][1]
    return fn


TAU = 2 * math.pi


def idle(t, f):
    p = base_pose()
    a = TAU * t
    add(p, 'hips', 0, 0, 1.5 * math.sin(a))
    p['hips_loc'] = (0, 0, .004 * math.sin(2 * a))
    add(p, 'spine', -1.5 + 1.2 * math.sin(2 * a), 0, 0)
    add(p, 'chest', -1.0 * math.sin(2 * a), 0, 0)
    add(p, 'head', 1.5 * math.sin(2 * a + .6), 3.0 * math.sin(a), 2 * math.sin(a + 1))
    arms(p, 'L', abduct=1.5 * math.sin(2 * a), swing=2 * math.sin(a))
    arms(p, 'R', abduct=1.5 * math.sin(2 * a + .5), swing=-2 * math.sin(a))
    add(p, 'bun', 3 * math.sin(2 * a - .8), 2 * math.sin(a - .8), 0)
    add(p, 'scarf_tail.R', 4 * math.sin(2 * a - 1.0), 0, 4 * math.sin(a - 1))
    return p


def walk(t, f):
    p = base_pose()
    a = TAU * t
    sa, ca = math.sin(a), math.cos(a)
    legs(p, 'L', thigh=-30 * sa, knee=10 + 42 * max(0, ca) ** 1.5)
    legs(p, 'R', thigh=30 * sa, knee=10 + 42 * max(0, -ca) ** 1.5)
    p['hips_loc'] = (0, 0, -.010 + .016 * math.cos(2 * a) ** 2)
    add(p, 'hips', 0, 2.5 * ca, 7 * sa)
    add(p, 'spine', 5, 0, -4 * sa)
    add(p, 'chest', 0, 0, -4 * sa)
    add(p, 'head', -3 + 2 * math.cos(2 * a), -2 * ca, -2 * sa)
    arms(p, 'L', swing=28 * sa, abduct=-2, elbow=-10 - 10 * max(0, -sa))
    arms(p, 'R', swing=-28 * sa, abduct=-2, elbow=-10 - 10 * max(0, sa))
    add(p, 'bun', 6 * math.cos(2 * a - .9), 0, 3 * sa)
    add(p, 'scarf_tail.R', -10 + 8 * math.cos(2 * a - 1.2), 0, 6 * sa)
    return p


def run(t, f):
    p = base_pose()
    a = TAU * t
    sa, ca = math.sin(a), math.cos(a)
    legs(p, 'L', thigh=-48 * sa - 8, knee=18 + 75 * max(0, ca) ** 1.4)
    legs(p, 'R', thigh=48 * sa - 8, knee=18 + 75 * max(0, -ca) ** 1.4)
    p['hips_loc'] = (0, 0, -.020 + .030 * abs(math.cos(a)))
    add(p, 'hips', 6, 0, 10 * sa)
    add(p, 'spine', 9, 0, -6 * sa)
    add(p, 'chest', 4, 0, -6 * sa)
    add(p, 'head', -12, 0, -3 * sa)
    arms(p, 'L', swing=45 * sa, abduct=4, elbow=-70)
    arms(p, 'R', swing=-45 * sa, abduct=4, elbow=-70)
    add(p, 'bun', -10 + 8 * math.cos(2 * a - .9), 0, 4 * sa)
    add(p, 'scarf_tail.R', -35 + 12 * math.sin(4 * a), 0, 8 * math.sin(2 * a))
    return p


def crouch(depth=1.0):
    p = base_pose()
    legs(p, 'L', thigh=-42 * depth, knee=78 * depth, spread=3)
    legs(p, 'R', thigh=-42 * depth, knee=78 * depth, spread=3)
    p['hips_loc'] = (0, 0, -.060 * depth)
    add(p, 'spine', 16 * depth)
    add(p, 'head', -10 * depth)
    arms(p, 'L', swing=28 * depth, abduct=8 * depth, elbow=-20)
    arms(p, 'R', swing=28 * depth, abduct=8 * depth, elbow=-20)
    add(p, 'bun', -6 * depth)
    return p


def airborne(tuck=1.0):
    p = base_pose()
    legs(p, 'L', thigh=-35 * tuck, knee=55 * tuck, foot=-10)
    legs(p, 'R', thigh=-8 * tuck, knee=25 * tuck, foot=-5)
    add(p, 'spine', -4)
    add(p, 'head', -4)
    arms(p, 'L', abduct=62, swing=-22, elbow=-30)
    arms(p, 'R', abduct=62, swing=-22, elbow=-30)
    add(p, 'bun', 12)
    add(p, 'scarf_tail.R', 25, 0, 0)
    return p


def fall(t, f):
    p = airborne(.8)
    a = TAU * t
    arms(p, 'L', abduct=8 * math.sin(2 * a), elbow=-8 * math.sin(2 * a + 1))
    arms(p, 'R', abduct=8 * math.sin(2 * a + 1.5), elbow=-8 * math.sin(2 * a + 2))
    add(p, 'thigh.L', 6 * math.sin(a))
    add(p, 'thigh.R', -6 * math.sin(a))
    add(p, 'scarf_tail.R', 10 * math.sin(2 * a), 0, 5 * math.sin(a))
    add(p, 'bun', 4 * math.sin(2 * a))
    return p


def talk(t, f):
    p = idle(t, f)
    a = TAU * t
    add(p, 'head', 4 * math.sin(2 * a) + 2 * math.sin(6 * a), 4 * math.sin(a), 6 * math.sin(a + .5))
    add(p, 'chest', 0, 0, 4 * math.sin(a))
    arms(p, 'R', swing=-32 - 8 * math.sin(2 * a), abduct=6, elbow=-55 + 15 * math.sin(2 * a + .5), twist=-20)
    arms(p, 'L', swing=-10 - 6 * math.sin(2 * a + 2), abduct=4 + 4 * math.sin(a), elbow=-30)
    return p


IDLE0 = idle(0, 0)


def wave_pose(k):
    p = base_pose()
    arms(p, 'R', abduct=80, swing=-42, elbow=0, twist=0)
    add(p, 'forearm.R', 0, 38 + 24 * k, 0)
    add(p, 'hand.R', 0, 16 * k, 0)
    add(p, 'head', -2, 5, -8)
    add(p, 'chest', 0, 4, -6)
    add(p, 'spine', 0, 5, 0)
    arms(p, 'L', abduct=-4, elbow=-10)
    add(p, 'bun', 0, 4 * k, 0)
    return p


def interact_pose(press=0.0):
    p = base_pose()
    add(p, 'spine', 12 + 3 * press)
    add(p, 'chest', 6)
    add(p, 'head', -8)
    arms(p, 'R', swing=-78 - 6 * press, abduct=-8, elbow=-12 + 10 * press, twist=-10)
    arms(p, 'L', swing=-20, abduct=-6, elbow=-35)
    legs(p, 'R', thigh=-18, knee=24)
    legs(p, 'L', thigh=8, knee=6)
    p['hips_loc'] = (0, 0, -.012)
    add(p, 'bun', -8)
    return p


def cheer_pose(up=1.0, hop=0.0):
    p = base_pose()
    arms(p, 'L', abduct=104 * up, swing=-30 * up)
    arms(p, 'R', abduct=104 * up, swing=-30 * up)
    add(p, 'forearm.L', 0, -38 * up, 0)
    add(p, 'forearm.R', 0, 38 * up, 0)
    legs(p, 'L', thigh=-30 * hop, knee=60 * hop)
    legs(p, 'R', thigh=-30 * hop, knee=60 * hop)
    p['hips_loc'] = (0, 0, .07 * hop)
    add(p, 'head', -10 * up)
    add(p, 'spine', -6 * up)
    add(p, 'bun', 10 * hop)
    add(p, 'scarf_tail.R', 20 * hop)
    return p


make_action('Idle', 48, idle)
make_action('Walk', 16, walk)
make_action('Run', 12, run)
make_action('Fall', 16, fall)
make_action('Talk', 48, talk)
make_action('Jump', 12, keyed([(0, IDLE0), (.35, crouch(.8)), (.65, lerp_pose(base_pose(), airborne(.3), .6)), (1, airborne(1))]), loop=False)
make_action('Land', 12, keyed([(0, airborne(.6)), (.2, crouch(1.0)), (.55, crouch(.35)), (1, IDLE0)]), loop=False)
make_action('Wave', 36, keyed([(0, IDLE0), (.16, wave_pose(0)), (.28, wave_pose(1)), (.40, wave_pose(-1)), (.52, wave_pose(1)),
                               (.64, wave_pose(-1)), (.76, wave_pose(.6)), (1, IDLE0)]), loop=False)
make_action('Interact', 24, keyed([(0, IDLE0), (.3, interact_pose(0)), (.5, interact_pose(1)), (.65, interact_pose(0)), (1, IDLE0)]), loop=False)
make_action('Celebrate', 32, keyed([(0, IDLE0), (.15, crouch(.6)), (.35, cheer_pose(1, 1)), (.55, cheer_pose(1, 0)), (.7, cheer_pose(1, .6)),
                                    (.85, cheer_pose(.8, 0)), (1, IDLE0)]), loop=False)

# leave the rig in rest pose with Idle as the active action for previews
rig.animation_data.action = ACTIONS['Idle']
scene.frame_set(0)

bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))
print('saved', BLEND)

# --------------------------------------------------------------------------------------
# Export GLB
# --------------------------------------------------------------------------------------
for o in bpy.context.view_layer.objects:
    o.select_set(o in (rig, body))
export_kwargs = dict(
    filepath=str(GLB), export_format='GLB', use_selection=True, export_apply=False,
    export_animations=True, export_animation_mode='ACTIONS', export_nla_strips=True,
    export_force_sampling=True, export_frame_step=1, export_def_bones=True, export_skins=True,
    export_morph=False, export_yup=True, export_texcoords=True, export_normals=True,
    export_image_format='AUTO', export_materials='EXPORT', export_extras=False,
    export_anim_single_armature=True, export_reset_pose_bones=True, export_optimize_animation_size=False,
)
import inspect
props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
bpy.ops.export_scene.gltf(**{k: v for k, v in export_kwargs.items() if k in props})
print('exported', GLB, 'triangles', tri_count)
