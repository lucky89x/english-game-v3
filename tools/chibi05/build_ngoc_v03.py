"""Build chr_ngoc_adventurer_v02 — an original stylised chibi hero for EnglishQuestV3.

Run from the repository root with Blender 4.2+/5.x:
    blender --background --python tools/chibi05/build_ngoc_v03.py
or with the `bpy` Python module:
    python tools/chibi05/build_ngoc_v03.py        (normally through tools/chibi05/build_all.sh)

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
import ngoc_face_v03 as ngoc_face  # noqa: E402

OUT_DIR = ROOT / 'assets/characters/models'
SRC_DIR = ROOT / 'art_source/chibi05'
OUT_DIR.mkdir(parents=True, exist_ok=True)
SRC_DIR.mkdir(parents=True, exist_ok=True)
# v04 (2026-11-19): body split into tintable materials (*_tint = grey texture, the game multiplies a colour)
# and five extra hairstyles (Hair_long/curly/wavy/ponytail/braids) next to Hair_short; the game hides/shows them.
# v05 (2026-11-20): + swappable clothes (Top_*, Bottom_*, Dress_*), Gear_goggles split out, boy hero variant (ban_nam).
GLB = OUT_DIR / 'chr_ngoc_adventurer_v05.glb'
BLEND = SRC_DIR / 'chr_ngoc_adventurer_v05.blend'

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 24

# --------------------------------------------------------------------------------------
# Palette atlas: every non-face part samples one flat cell of a small texture, so the
# whole body renders with a single material (+ separate face material).
# --------------------------------------------------------------------------------------
PALETTE = {  # name: (sRGB hex, roughness, metallic)
    'skin': ('f6c8a6', .62, 0), 'skin_dark': ('e8ae8c', .65, 0),
    'hair': ('8c4a22', .5, 0), 'hair_light': ('a85c2e', .45, 0), 'hair_dark': ('6a3418', .55, 0),
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
PALETTE.update({'white': ('fbf8f0', .8, 0), 'bread': ('d9953f', .7, 0), 'bread_light': ('f0c070', .7, 0), 'wicker': ('b98a4a', .85, 0),
                'crystal': ('58e07a', .1, 0), 'leaf': ('4d9a3a', .8, 0), 'lute': ('c98a48', .5, 0), 'lute_dark': ('7a4a26', .6, 0)})
PALETTE.update({'ev_red': ('c8202a', .7, 0), 'ev_red_dark': ('8e1620', .75, 0), 'ev_yellow': ('f6c63a', .45, .2), 'ev_purple': ('5a2a8a', .75, 0),
                'ev_purple_dark': ('3a1a5a', .8, 0), 'ev_orange': ('f08a24', .7, 0), 'ev_green': ('2e8a4a', .75, 0), 'ev_black': ('2a2430', .7, 0),
                'ev_brown': ('7a4a26', .7, 0), 'ev_pink': ('f2a0b0', .6, 0)})     # event outfits (fixed colours, ngoc_gear material)
VARIANT = os.environ.get('NGOC_VARIANT', 'ngoc')
BOY = VARIANT == 'ban_nam'
HERO = VARIANT in ('ngoc', 'ban_nam')     # playable heroes: swappable hair, clothes, goggles
BW = 1.08 if BOY else 1.0                  # the boy is a little broader in the shoulders
HEIGHT = {'amira': 1.3, 'karim': 1.35, 'layla': 1.2, 'idris': 1.4}.get(VARIANT)   # desert NPCs: whole model (rig node) scaled to this height
VARIANTS = {   # friends built on Ngoc's body: (file name, palette overrides)
    'lily': ('npc_lily_druid_v02', {'hair': 'e0702c', 'hair_light': 'f08a3c', 'hair_dark': 'b8531c', 'bandana': '5fa83c', 'bandana_dark': '3f7d2a',
                                    'scarf': '6cb444', 'scarf_dark': '4a8a30', 'shirt': '8cc25a', 'shirt_shade': '6a9e42', 'shorts': 'f0e6cc',
                                    'shorts_cuff': 'd9c9a2', 'glass': '4fd06a', 'ribbon': '5fa83c'}),
    'rose': ('npc_rose_baker_v02', {'hair': 'ee8a94', 'hair_light': 'f8a8b0', 'hair_dark': 'd06a78', 'bandana': 'f6f0e6', 'bandana_dark': 'd8cfc0',
                                    'scarf': 'c8352e', 'scarf_dark': '9a2620', 'shirt': 'fbf6ec', 'shirt_shade': 'e6dcc8', 'shorts': 'c8352e',
                                    'shorts_cuff': '9a2620', 'glass': 'f6c62e', 'ribbon': 'c8352e'}),
    'anna': ('npc_anna_bard_v02', {'hair': '6b3a1e', 'hair_light': '8a5230', 'hair_dark': '4a2612', 'bandana': 'f2c230', 'bandana_dark': 'c99a1e',
                                   'scarf': 'f2c230', 'scarf_dark': 'c99a1e', 'shirt': '3f6fc6', 'shirt_shade': '2c539a', 'shorts': 'f4efe6',
                                   'shorts_cuff': 'd8d0c0', 'glass': 'b684e8', 'ribbon': 'f2c230'}),
    'mia': ('npc_mia_tailor_v01', {'hair': '9a3e22', 'hair_light': 'b5502e', 'hair_dark': '6e2a16', 'bandana': '8c64c2', 'bandana_dark': '6a4a9a',
                                   'scarf': 'e2b04a', 'scarf_dark': 'c99a1e', 'shirt': 'f4efe6', 'shirt_shade': 'd8d0c0', 'shorts': '6a4a9a',
                                   'shorts_cuff': '4a3070', 'glass': 'e2b04a', 'ribbon': '8c64c2'}),
    'amira': ('npc_desert_elder_v01', {'hair': 'd8d0c0', 'hair_light': 'f0ece4', 'hair_dark': 'b0a898', 'bandana': '3fc0b0', 'bandana_dark': '2a8c80',
                                       'scarf': '3fc0b0', 'scarf_dark': '2a8c80', 'shirt': 'e8dcc0', 'shirt_shade': 'c9b890', 'shorts': '8a6a4a',
                                       'shorts_cuff': '6a4a2a', 'glass': '3fc0b0', 'ribbon': '3fc0b0'}),
    'karim': ('npc_desert_merchant_v01', {'hair': '3a2a20', 'hair_light': '5a4232', 'hair_dark': '22180f', 'bandana': 'c9463a', 'bandana_dark': '8e2e28',
                                          'scarf': 'e2b04a', 'scarf_dark': 'b08a2a', 'shirt': 'f4efe6', 'shirt_shade': 'd8d0c0', 'shorts': '5a4a8a',
                                          'shorts_cuff': '3a2a6a', 'glass': 'e2b04a', 'ribbon': 'c9463a'}),
    'layla': ('npc_desert_guide_v01', {'hair': '2a1d16', 'hair_light': '4a3428', 'hair_dark': '1a120c', 'bandana': 'e8a33a', 'bandana_dark': 'b07a2a',
                                       'scarf': 'e8a33a', 'scarf_dark': 'b07a2a', 'shirt': 'f2e2c2', 'shirt_shade': 'd8c49a', 'shorts': '7a5a3a',
                                       'shorts_cuff': '5a3a20', 'glass': '5ac8ff', 'ribbon': 'e8a33a'}),
    'idris': ('npc_desert_smith_v01', {'hair': '4a3222', 'hair_light': '6a4a32', 'hair_dark': '2a1a10', 'bandana': '6a4a3a', 'bandana_dark': '4a3020',
                                       'scarf': '8a6a4a', 'scarf_dark': '6a4a2a', 'shirt': 'b88a5a', 'shirt_shade': '9a6e44', 'shorts': '4a3a30',
                                       'shorts_cuff': '2a2018', 'glass': 'e8603a', 'ribbon': '6a4a3a'}),
    'ban_nam': ('chr_ban_nam_v01', {'hair': '3a2a20', 'hair_light': '5a4232', 'hair_dark': '22180f', 'shirt': '6fa8dc', 'shirt_shade': '4a86bf',
                                    'shorts': '3a4f7a', 'shorts_cuff': '2a3a5c'}),
}
if VARIANT in VARIANTS:
    _name, _over = VARIANTS[VARIANT]
    for _k, _v in _over.items():
        PALETTE[_k] = (_v,) + PALETTE[_k][1:]
    GLB = OUT_DIR / f'{_name}.glb'
    BLEND = SRC_DIR / f'{_name}.blend'
# Hair reads as one soft mass: the light and dark tones stay close to the base (contact shadows separate the locks).
def _mix(a, b, t):
    return ''.join(f'{round(int(a[i:i + 2], 16) * (1 - t) + int(b[i:i + 2], 16) * t):02x}' for i in (0, 2, 4))
for _k in ('hair_light', 'hair_dark'):
    PALETTE[_k] = (_mix(PALETTE['hair'][0], PALETTE[_k][0], .38),) + PALETTE[_k][1:]
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


# v04: the body is split by what the game may recolour. Hair, top and bottom use *_tint materials that sample a
# GREY copy of the palette (the group's base tone = 0.8 grey, lighter/darker tones keep their ratio), so the game can
# multiply any colour on top; contact shadows stay in the vertex colours. Ngọc keeps skin, boots and gear apart too;
# the friends put skin + boots + gear in one '<name>_body' material (fewer draw calls).
TINT_GROUPS = {'hair': ('hair', 'hair_light', 'hair_dark'), 'top': ('shirt', 'shirt_shade'), 'bottom': ('shorts', 'shorts_cuff')}


def group_of(color):
    for g, names in TINT_GROUPS.items():
        if color in names:
            return g
    if color in ('skin', 'skin_dark', 'eye_dark'):
        return 'skin'
    if color in ('boot', 'boot_cuff', 'sole', 'lace'):
        return 'boots'
    return 'gear'


def build_tint_image():
    from PIL import Image
    size = CELL * GRID
    img = Image.new('RGB', (size, size), (204, 204, 204))

    def lum(h):
        r, g, b = hex_rgb(h)
        return .2126 * srgb_to_lin(r / 255) + .7152 * srgb_to_lin(g / 255) + .0722 * srgb_to_lin(b / 255)
    for g, names in TINT_GROUPS.items():
        base = lum(PALETTE[names[0]][0])
        for n in names:
            lin = min(1.0, srgb_to_lin(.8) * lum(PALETTE[n][0]) / base)     # base tone -> 0.8 grey (sRGB)
            v = round(255 * (lin * 12.92 if lin <= .0031308 else 1.055 * lin ** (1 / 2.4) - .055))
            i = NAMES.index(n)
            x, y = (i % GRID) * CELL, (i // GRID) * CELL
            img.paste((v, v, v), (x, y, x + CELL, y + CELL))
    p = SRC_DIR / f'{VARIANT}_palette_tint.png'
    img.save(p)
    return p


PAL_TINT = build_tint_image()
_pre = VARIANT
MATS = {g: make_material(f'{_pre}_{g}_tint', PAL_TINT, PAL_ORM) for g in TINT_GROUPS}
if HERO:
    MATS.update({g: make_material(f'ngoc_{g}', PAL_ALB, PAL_ORM) for g in ('skin', 'boots', 'gear')})
else:
    _body = make_material(f'{_pre}_body', PAL_ALB, PAL_ORM)
    MATS.update({g: _body for g in ('skin', 'boots', 'gear')})
MAT_BODY = MATS['skin']
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
    m = MATS[group_of(color)]
    names = [x.name for x in me.materials]
    if m.name not in names:
        me.materials.append(m)
        names.append(m.name)
    idx = names.index(m.name)
    uv = me.uv_layers.active.data
    u = cell_uv(color)
    polys = me.polygons if faces is None else [me.polygons[i] for i in faces]
    for p in polys:
        p.material_index = idx
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
    ob = mesh_obj(name, out, faces)
    bm = bmesh.new()   # pole fans wind opposite to the quads: make normals consistent
    bm.from_mesh(ob.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(ob.data)
    bm.free()
    return ob


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
    for o in _sel:
        o.select_set(True)
    bpy.context.view_layer.objects.active = _act


# --------------------------------------------------------------------------------------
# Proportions (metres). Height ~1.52 m with the head+hair about 42 % of it.
# --------------------------------------------------------------------------------------
HZ = 1.105                # head centre
HA, HB, HC = .285, .255, .258   # head half width / depth / height
SHOULDER = Vector((.150 * BW, 0.0, .770))
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
torso.scale.x = BW
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
        ((s * .090, .004, .070), .080, .084),
        ((s * .090, .004, .140), .076, .078),
        ((s * .090, .004, .215), .080, .080),
        ((s * .090, .004, .245), .084, .084),
    ], seg=20, caps=(False, False))
    finish(shaft, 'boot', [f'shin.{side}', f'foot.{side}'], subsurf=1)
    cuffb = torus(f'Ngoc_BootCuff_{s}', (s * .090, .004, .248), .084, .024, seg=24, rseg=8)
    finish(cuffb, 'boot_cuff', [f'shin.{side}'])
    foot = ellipsoid(f'Ngoc_BootFoot_{s}', (s * .094, -.045, .062), (.088, .138, .076), seg=22, rings=12,
                     deform=lambda p, v: Vector((p.x * (1 + .12 * max(0, -v.y)), p.y, p.z * (1 - .25 * max(0, -v.y)) if p.z > 0 else p.z * .55)))
    finish(foot, 'boot', [f'foot.{side}', f'shin.{side}'], subsurf=0)
    sole = loft(f'Ngoc_BootSole_{s}', [
        ((s * .094, .085, .012), .088, .012),
        ((s * .094, .02, .012), .094, .012),
        ((s * .095, -.07, .012), .096, .012),
        ((s * .096, -.165, .014), .074, .012),
    ], seg=16, caps=(True, True), ref=Vector((1, 0, 0)))
    finish(sole, 'sole', [f'foot.{side}'])
    # criss-cross laces on the front of the shaft
    for k in range(3):
        z = .095 + k * .040
        for d in (-1, 1):
            l = tube(f'Ngoc_Lace_{s}_{k}_{d}', [(s * .090 - .036 * d, -.078, z), (s * .090 + .036 * d, -.082, z + .034)], [.008, .008], seg=6)
            finish(l, 'lace', [f'shin.{side}'])
    bow = ellipsoid(f'Ngoc_LaceBow_{s}', (s * .090, -.086, .236), (.028, .010, .015), seg=10, rings=6)
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
    gcuff = loft(f'Ngoc_GloveCuff_{s}', [(wrist - d * .045, .050, .050), (wrist - d * .005, .056, .056), (wrist + d * .012, .048, .048)],
                 seg=16, caps=(False, False))
    finish(gcuff, 'leather_dark', [f'forearm.{side}', f'hand.{side}'], subsurf=1)
    hc = wrist + d * .045
    hand = ellipsoid(f'Ngoc_Hand_{s}', hc, (.046, .034, .054), seg=16, rings=10,
                     rot=Vector((0, 0, 1)).rotation_difference(d))
    finish(hand, 'glove', [f'hand.{side}'])
    thumb = ellipsoid(f'Ngoc_Thumb_{s}', hc + Vector((0, -.026, .008)) - d * .008, (.012, .012, .024), seg=10, rings=8,
                      rot=Vector((0, 0, 1)).rotation_difference((d + Vector((0, -.6, 0))).normalized()))
    finish(thumb, 'glove', [f'hand.{side}'])
    # skin finger tips peeking out of the fingerless gloves
    tips = ellipsoid(f'Ngoc_FingerTips_{s}', hc + d * .044, (.036, .026, .018), seg=12, rings=8,
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
POT = Vector((.185, -.075, .425))
flask = ellipsoid('Ngoc_Potion', POT, (.060, .060, .062), seg=18, rings=12)
finish(flask, 'glass', ['hips'])
liquid_hi = ellipsoid('Ngoc_PotionShine', POT + Vector((-.018, -.052, .022)), (.014, .008, .020), seg=8, rings=6)
finish(liquid_hi, 'lens_shine', ['hips'])
pneck = tube('Ngoc_PotionNeck', [POT + Vector((0, 0, .052)), POT + Vector((0, 0, .086))], [.020, .018], seg=10)
finish(pneck, 'glass', ['hips'])
cork = tube('Ngoc_PotionCork', [POT + Vector((0, 0, .082)), POT + Vector((0, 0, .108))], [.021, .018], seg=10)
finish(cork, 'cork', ['hips'])
holder = torus('Ngoc_PotionHolder', POT + Vector((0, 0, .008)), .061, .008, seg=20, rseg=6)
finish(holder, 'leather_dark', ['hips'])
# second small leather pouch on her left-back hip
PC2 = Vector((.120, .100, .455))
pouch2 = loft('Ngoc_Pouch2', [(PC2 + Vector((0, 0, -.040)), .044, .026), (PC2, .048, .030), (PC2 + Vector((0, 0, .040)), .046, .028)],
              seg=14, caps=(True, True), ref=Vector((.6, .8, 0)))
finish(pouch2, 'leather_dark', ['hips'], subsurf=1)
finish(ellipsoid('Ngoc_Pouch2Flap', PC2 + Vector((.018, .024, .030)), (.046, .010, .022), seg=12, rings=8,
                 rot=Quaternion((0, 0, 1), math.radians(37))), 'leather', ['hips'])
finish(ellipsoid('Ngoc_Pouch2Stud', PC2 + Vector((.026, .036, .018)), (.008, .005, .008), seg=8, rings=6), 'gold', ['hips'])
# rolled map scroll tucked diagonally behind the strap on the back
sc_a, sc_b = Vector((-.20, .165, .500)), Vector((.19, .165, .850))
scroll = tube('Ngoc_Scroll', [sc_a, sc_b], [.044, .044], seg=16)
finish(scroll, 'parchment', ['chest', 'spine'])
for t in (0.0, 1.0):
    endp = sc_a.lerp(sc_b, t)
    cap = torus(f'Ngoc_ScrollEnd_{t}', endp, .036, .012, seg=16, rseg=6, rot=Vector((0, 0, 1)).rotation_difference(sc_b - sc_a))
    finish(cap, 'parchment_edge', ['chest', 'spine'])
rib = torus('Ngoc_ScrollRibbon', sc_a.lerp(sc_b, .5), .046, .008, seg=16, rseg=6, rot=Vector((0, 0, 1)).rotation_difference(sc_b - sc_a))
finish(rib, 'ribbon', ['chest', 'spine'])

# ---------------- neck scarf ------------------------------------------------------------
scarf = torus('Ngoc_Scarf', (0, .000, .835), .094, .047, seg=40, rseg=12, sy=.92)
for v in scarf.data.vertices:
    # lower at the front, chunkier folds
    v.co.z -= .02 * max(0, -v.co.y / .1)
    a = math.atan2(v.co.y, v.co.x)
    v.co.z += .006 * math.sin(a * 5)
finish(scarf, 'scarf', ['neck', 'chest'])
knot = ellipsoid('Ngoc_ScarfKnot', (-.050, -.100, .800), (.046, .034, .040), seg=14, rings=10)
finish(knot, 'scarf_dark', ['chest'])
# two flowing tails sweeping back on her right side
for k, (dz, spread, ln) in enumerate([(0, .0, 1.0), (-.03, .05, .82)]):
    pts = []
    for i in range(11):
        t = i / 10
        # long ribbon that billows out to her right and back, like REF_01
        pts.append((Vector((-.060 - .36 * t * ln - spread * t, -.08 + .40 * t * ln, .800 - .04 * t + .09 * math.sin(t * 3.4) + dz)), ln))
    rings = [(p, .074 * (1 - .30 * (i / 10)) + .014 * math.sin(i * 1.1), .011) for i, (p, _) in enumerate(pts)]
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
    amp = .034 * smoothstep(-.9, -.2, el) * (1 - .6 * smoothstep(.9, 1.3, el))
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
    puff = ellipsoid(f'Ngoc_CrownPuff_{k}', p, (.092, .076, .066), seg=14, rings=9,
                     rot=Vector((0, 0, 1)).rotation_difference((p - HAIR_C).normalized()))
    finish(puff, HAIR_COLS[k % 2], ['head'])

# M1 (2026-11-16): the volume is made of swept curls, not round tufts. Each curl starts flat on the hair cap,
# bulges out as it falls, then hooks sideways and back towards the head with a pointed tip, as in the painted
# reference. Alternate curls swirl left and right; rings lower on the head are longer and fuller.
import random as _rnd
_rnd.seed(7)


def curl_pts(az0, el0, span, swirl, bulge, n=16):
    """points of one swept curl over the hair proxy: span = degrees it falls, swirl = radians it hooks sideways"""
    pts = []
    for i in range(n):
        t = i / (n - 1)
        e = el0 - span * math.sin(t * math.pi * .62) / math.sin(math.pi * .62)     # falls, then lifts a little at the tip
        a = az0 + swirl * math.sin(t * math.pi * .55) ** 1.6
        o = -.010 + bulge * math.sin(math.pi * min(1.0, t * 1.05) * .82)
        pts.append(on_hair(a, math.radians(e), o))
    return pts


_k = 0
for el_deg, count, span, r0, bulge in ((74, 6, 24, .066, .022), (54, 9, 28, .074, .026), (32, 10, 30, .080, .030),
                                        (10, 10, 28, .078, .030), (-10, 9, 24, .070, .026)):
    for i in range(count):
        az = (i + .5 * (_k % 2)) / count * 2 * math.pi - math.pi
        if abs(az) < math.radians(62) and el_deg < 50:
            continue                                  # keep the face and the bandana front clear
        if abs(az) < math.radians(40) and el_deg < 70:
            continue                                  # goggles sit here
        az += _rnd.uniform(-.06, .06)
        side = 1 if (_k % 2) else -1
        pts = curl_pts(az, el_deg + _rnd.uniform(-3, 3), span * _rnd.uniform(.9, 1.1), side * _rnd.uniform(.16, .24), bulge)
        lock(f'Ngoc_Curl_{_k}', pts, r0 * _rnd.uniform(.92, 1.08), r0 * .22, color='hair_light' if el_deg > 60 and _k % 2 else 'hair',
             res=2, pw=1.6)
        _k += 1

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
bun_core = ellipsoid('Ngoc_BunCore', BUN, (.160, .150, .125), seg=24, rings=14)
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

if HERO:
    # goggle strap around the head, just above the bandana
    GS_N = Vector((0, .25, 1)).normalized()
    gs_c = HAIR_C + Vector((0, 0, .130))
    gstrap = wrap_band('Ngoc_GoggleStrap', HAIR_TREE, gs_c, GS_N, [-.016, .0, .016], .026, seg=64, thick=.010)
    bpy.data.objects.remove(gstrap)   # v03: no dark ring, the goggles sit on the red band
    # big brass goggles resting on the crown, lenses looking forward/up
    for s in (-1, 1):
        p, n = surf(HAIR_TREE, HAIR_C, hair_dir(math.radians(26) * s, math.radians(36)), .030)
        q = Vector((0, 0, 1)).rotation_difference(n)
        rim = torus(f'Ngoc_GoggleRim_{s}', p + n * .020, .066, .019, seg=24, rseg=8, rot=q)
        finish(rim, 'brass', ['head'])
        cup = loft(f'Ngoc_GoggleCup_{s}', [(p - n * .012, .062, .062), (p + n * .018, .072, .072)], seg=24, caps=(True, False))
        finish(cup, 'brass_dark', ['head'])
        lens = ellipsoid(f'Ngoc_GoggleLens_{s}', p + n * .018, (.058, .058, .012), seg=20, rings=10, rot=q)
        finish(lens, 'lens', ['head'])
        shine = ellipsoid(f'Ngoc_GoggleShine_{s}', p + n * .027 + (q @ Vector((-.014, .014, 0))), (.012, .008, .003), seg=8, rings=6, rot=q)
        finish(shine, 'lens_shine', ['head'])
        for r in range(4):  # rivets
            a = math.pi / 4 + r * math.pi / 2
            rv = ellipsoid(f'Ngoc_GoggleRivet_{s}_{r}', p + n * .034 + q @ Vector((math.cos(a) * .050, math.sin(a) * .054, 0)), (.006, .006, .004),
                           seg=6, rings=4, rot=q)
            finish(rv, 'gold', ['head'])
    bl = on_hair(math.radians(-11), math.radians(37), .056)
    br = on_hair(math.radians(11), math.radians(37), .056)
    bridge = tube('Ngoc_GoggleBridge', [bl, (bl + br) / 2 + Vector((0, -.004, .010)), br], [.011, .011, .011], seg=8)
    finish(bridge, 'brass', ['head'])
elif VARIANT not in ('mia', 'amira', 'karim', 'layla', 'idris'):
    PALETTE_EXTRA = True
    for k in range(11):
        az = math.radians(-100 + k * 20)
        p = on_hair(az, math.radians(40 - 6 * abs(k - 5) / 5), .030)
        finish(ellipsoid(f'Ngoc_Crown_{k}', p, (.050, .050, .040), seg=10, rings=6), 'lens_shine' if k % 2 else 'parchment', ['head'])
        finish(ellipsoid(f'Ngoc_CrownDot_{k}', p + (p - HAIR_C).normalized() * .034, (.020, .020, .016), seg=6, rings=4), 'gold', ['head'])

# ---------------- v04: extra hairstyles (Ngọc only) ------------------------------------------
# Each style is its own skinned object (head + bun bones, ngoc_hair_tint) so the game can show one at a time.
# They are built light (≤ ~1.3k triangles, no decimation) on a slightly smaller copy of the hair cap, so the
# bandana and goggles, which ride on the original cap surface, sit on top of every style.
HAIR_SHORT_PREFIX = ('Ngoc_HairCap', 'Ngoc_CrownPuff', 'Ngoc_Curl_', 'Ngoc_Fringe_', 'Ngoc_SideCurl_', 'Ngoc_BackCurl_',
                     'Ngoc_BunCore', 'Ngoc_BunCoil', 'Ngoc_BunCurl', 'Ngoc_BunBase')
HAIR_STYLE_OF = {}          # part object name -> hairstyle object name
HAIR_STYLES = ['Hair_long', 'Hair_curly', 'Hair_wavy', 'Hair_ponytail', 'Hair_braids']


def hpart(style, obj, color, bone='head', smooth=True):
    finish(obj, color, [bone], smooth=smooth)
    HAIR_STYLE_OF[obj.name] = style
    return obj


def low_cap(style, seg=22, rings=12, back=-.235, shrink=.004, ridges=True):
    """light hair cap with the same hairline as Hair_short; `back` = how low it reaches at the nape"""
    def dfm(p, v):
        if not ridges:
            return p
        d = p.normalized() if p.length else p
        az = math.atan2(d.x, -d.y)
        el = math.asin(max(-1, min(1, d.z)))
        return p + d * (.022 * (.5 + .5 * math.cos(11 * az + el * 2)) ** 1.5 * smoothstep(-.9, -.1, el))
    r = (HAIR_R[0] - shrink, HAIR_R[1] - shrink, HAIR_R[2] - shrink)
    ob = ellipsoid(f'{style}_Cap', HAIR_C, r, seg=seg, rings=rings, deform=dfm)
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    kill = []
    for f in bm.faces:
        c = f.calc_center_median()
        rel = c - Vector((0, 0, HZ))
        ang = math.atan2(abs(c.x), -c.y)
        if (ang < .95 and rel.z < .080 + .045 * smoothstep(.35, .95, ang)) or (ang < 1.45 and rel.z < -.115) \
                or (rel.z < -.205 and c.y < .10) or rel.z < back:
            kill.append(f)
    bmesh.ops.delete(bm, geom=kill, context='FACES')
    bm.to_mesh(ob.data)
    bm.free()
    return hpart(style, ob, 'hair')


def strand(style, name, pts, r0, r1, seg=6, flat=1.0, color='hair', bone='head', ref=None, shape=None):
    n = len(pts)
    rings = [(Vector(p), (r0 + (r1 - r0) * i / (n - 1)), (r0 + (r1 - r0) * i / (n - 1)) * flat) for i, p in enumerate(pts)]
    return hpart(style, loft(f'{style}_{name}', rings, seg=seg, ref=ref, shape=shape), color, bone)


def fringe(style, spec, seg=5):
    """side-swept bangs under the bandana: spec = [(az0 deg, sweep deg, el0 deg, radius), ...]"""
    for i, (az0, da, el0, r0) in enumerate(spec):
        pts = []
        for k in range(6):
            t = k / 5
            e = el0 - 14 * math.sin(t * math.pi * .7)
            pts.append(surf(HEAD_TREE, HC_W, hair_dir(math.radians(az0 + da * t), math.radians(e)), .016 - .006 * t)[0])
        strand(style, f'Fringe_{i}', pts, r0, r0 * .35, seg=seg, flat=.55, color=HAIR_COLS[i % 3],
               ref=Vector((0, 0, 1)))


def path(p0, p1, n, bow=(0, 0, 0), wave=(0, 0, 0), waves=0.0):
    """n points from p0 to p1, bowed out by `bow` in the middle and waving by `wave` (waves = full cycles)"""
    p0, p1, bow, wave = Vector(p0), Vector(p1), Vector(bow), Vector(wave)
    return [p0.lerp(p1, i / (n - 1)) + bow * math.sin(math.pi * i / (n - 1)) + wave * math.sin(2 * math.pi * waves * i / (n - 1))
            for i in range(n)]


if VARIANT == 'ngoc':
    _rnd.seed(11)
    # -- Hair_long: straight curtain down to the middle of the back, side locks over the shoulders, swept fringe
    st = 'Hair_long'
    low_cap(st, back=-.30)
    curtain = loft(f'{st}_Back', [(Vector((0, .07, 1.08)), .285, .215), (Vector((0, .115, .93)), .27, .16),
                                  (Vector((0, .15, .80)), .245, .10), (Vector((0, .175, .69)), .225, .075),
                                  (Vector((0, .19, .60)), .205, .055), (Vector((0, .195, .54)), .17, .035)],
                   seg=16, ref=Vector((1, 0, 0)), shape=lambda a, i: 1 + .06 * abs(math.cos(7 * a + .4 * i)) - .03)
    hpart(st, curtain, 'hair')
    for s in (-1, 1):
        top = on_hair(math.radians(84) * s, math.radians(-8), -.02)
        strand(st, f'Side_{s}', path(top, (s * .19, -.07, .74), 6, bow=(s * .05, -.03, 0)), .055, .03, seg=7, flat=.55,
               color='hair_light' if s > 0 else 'hair', ref=Vector((0, 1, 0)))
    fringe(st, [(-50, 60, 30, .040), (-15, 55, 28, .038), (20, 45, 26, .034), (48, 30, 20, .030)])

    # -- Hair_curly: shoulder-length cloud of round curls
    st = 'Hair_curly'
    low_cap(st, seg=16, rings=9, back=-.28)
    k = 0
    for el, cnt, rr in ((52, 4, .100), (20, 5, .112), (-12, 5, .112), (-38, 4, .106)):
        for i in range(cnt):
            az = (i + .5 * (k % 2)) / cnt * 2 * math.pi - math.pi
            if abs(az) < math.radians(64) and el < 45:
                continue
            p = on_hair(az + _rnd.uniform(-.08, .08), math.radians(el + _rnd.uniform(-4, 4)), rr * .35)
            if el <= -30:
                p += Vector((0, .02, -.06))
            q = Vector((0, 0, 1)).rotation_difference((p - HAIR_C).normalized())
            hpart(st, ellipsoid(f'{st}_Puff_{k}', p, (rr, rr, rr * .82), seg=8, rings=6, rot=q,
                                deform=lambda q_, v: q_ * (1 + .1 * math.sin(v.x * 9 + v.y * 7))), HAIR_COLS[k % 3])
            k += 1
    for i, az in enumerate((-.42, -.05, .32)):     # little curls on the forehead
        p = surf(HEAD_TREE, HC_W, hair_dir(az, math.radians(22)), .020)[0]
        hpart(st, ellipsoid(f'{st}_Fringe_{i}', p, (.045, .032, .040), seg=6, rings=4), HAIR_COLS[(i + 1) % 3])

    # -- Hair_wavy: soft waves to the shoulders, wavy side locks, centre-parted fringe
    st = 'Hair_wavy'
    low_cap(st, back=-.30)
    wav = loft(f'{st}_Back', [(Vector((0, .07, 1.08)), .29, .215), (Vector((0, .11, .95)), .285, .16),
                              (Vector((.0, .14, .84)), .27, .11), (Vector((0, .16, .75)), .255, .075),
                              (Vector((0, .17, .69)), .24, .05)],
               seg=18, ref=Vector((1, 0, 0)), shape=lambda a, i: 1 + .07 * math.cos(9 * a + 1.3 * i))
    hpart(st, wav, 'hair')
    for s in (-1, 1):
        for j, (az, ln) in enumerate(((78, .30), (100, .33))):
            top = on_hair(math.radians(az) * s, math.radians(-6), -.02)
            strand(st, f'Wave_{s}_{j}', path(top, top + Vector((s * .05, -.03 + .05 * j, -ln)), 8, wave=(s * .025, .012, 0), waves=1.5),
                   .050, .022, seg=6, flat=.7, color=HAIR_COLS[(j + (s > 0)) % 3], ref=Vector((0, 1, 0)))
    fringe(st, [(-8, -55, 27, .036), (8, 55, 27, .036), (-36, -40, 22, .030), (36, 40, 22, .030)])

    # -- Hair_ponytail: smooth cap, scrunchie high at the back, a long swinging tail on the bun bone
    st = 'Hair_ponytail'
    low_cap(st, back=-.24)
    PT = on_hair(math.pi, math.radians(38), .0)
    hpart(st, torus(f'{st}_Tie', PT, .055, .022, seg=12, rseg=5,
                    rot=Vector((0, 0, 1)).rotation_difference((PT - HAIR_C).normalized())), 'hair_dark')
    tail = [PT + Vector((0, .04, .03)), PT + Vector((0, .11, .0)), PT + Vector((0, .16, -.10)), PT + Vector((0, .165, -.22)),
            PT + Vector((0, .14, -.34)), PT + Vector((.0, .11, -.45)), PT + Vector((.015, .10, -.53))]
    rings = [(p, r, r * .9) for p, r in zip(tail, (.070, .110, .125, .118, .098, .070, .022))]
    hpart(st, loft(f'{st}_Tail', rings, seg=12, ref=Vector((1, 0, 0)), shape=lambda a, i: 1 + .10 * math.cos(7 * a + i)),
          'hair', bone='bun')
    for s in (-1, 1):
        top = on_hair(math.radians(72) * s, math.radians(4), -.015)
        strand(st, f'Frame_{s}', path(top, top + Vector((s * .03, -.03, -.20)), 6, wave=(s * .012, 0, 0), waves=1), .030, .012,
               seg=5, flat=.6, color='hair_light', ref=Vector((0, 1, 0)))
    fringe(st, [(-30, 50, 28, .036), (5, 45, 27, .034), (35, 30, 22, .030)])

    # -- Hair_braids: two plaits from behind the ears over the shoulders, with ties and tufts
    st = 'Hair_braids'
    low_cap(st, back=-.26)
    for s in (-1, 1):
        b0 = on_hair(math.radians(112) * s, math.radians(-14), -.03)
        b1 = Vector((s * .20, -.06, .60))
        ctr = path(b0, b1, 7, bow=(s * .07, .03, 0))
        for j in range(6):
            p = ctr[j].lerp(ctr[j + 1], .5)
            d = (ctr[j + 1] - ctr[j]).normalized()
            side = d.cross(Vector((0, 1, 0))).normalized() * (.014 if j % 2 else -.014)
            r = .052 - .004 * j
            hpart(st, ellipsoid(f'{st}_Plait_{s}_{j}', p + side, (r, r * .85, (ctr[j + 1] - ctr[j]).length * .62), seg=7, rings=5,
                                rot=Vector((0, 0, 1)).rotation_difference(d)), HAIR_COLS[j % 3])
        hpart(st, torus(f'{st}_Tie_{s}', b1 + Vector((0, 0, .015)), .028, .011, seg=10, rseg=4), 'hair_dark')
        hpart(st, ellipsoid(f'{st}_Tuft_{s}', b1 + Vector((s * .004, -.004, -.045)), (.034, .03, .05), seg=7, rings=5,
                            deform=lambda q_, v: q_ * (1 + .25 * max(0, -v.z))), 'hair_light')
    fringe(st, [(-40, 55, 28, .036), (-8, 50, 27, .036), (28, 40, 24, .032)])

# ---------------- v05: swappable clothes for the heroes (Ngọc and the boy) ------------------
# Each outfit piece is its own skinned object (weights from the same distance falloff as the body), using the grey
# *_top_tint / *_bottom_tint materials. The default pieces are split off the body: Top_tshirt, Bottom_shorts and
# Gear_goggles (bandana + goggles); everything else starts hidden (glTF extras eq_hidden: 1). One top + one bottom, or
# one dress, is shown at a time: each top/dress carries its own torso, each bottom/dress its own hips.
TOP_PREFIX = ('Ngoc_Shirt', 'Ngoc_Collar_', 'Ngoc_Sleeve_', 'Ngoc_SleeveCuff_')
BOTTOM_PREFIX = ('Ngoc_Shorts',)
GOGGLE_PREFIX = ('Ngoc_Bandana', 'Ngoc_Goggle')
CLOTHES = ['Top_hoodie', 'Top_jacket', 'Top_aodai', 'Bottom_trousers', 'Bottom_skirt', 'Dress_sundress', 'Dress_party']
if BOY:
    CLOTHES = ['Top_hoodie', 'Top_jacket', 'Top_aodai', 'Bottom_trousers']
# batch 25 event outfits (Tết, Halloween, Christmas, Mid-Autumn): fixed colours, hidden at start like the other extras
EVENT = ['Top_aodai_tet', 'Top_xmas_sweater', 'Hat_witch', 'Hat_santa', 'Hat_antlers', 'Acc_lantern_hand', 'Acc_mask_cat']
if not BOY:
    EVENT.insert(2, 'Dress_halloween_witch')
CLOTHES = CLOTHES + EVENT
SLOT = lambda g: 'hair' if g.startswith('Hair_') else 'dress' if g.startswith('Dress_') else 'top' if g.startswith('Top_') else \
    'bottom' if g.startswith('Bottom_') else 'hat' if g.startswith('Hat_') else 'acc' if g.startswith('Acc_') else 'gear'
TORSO = [((0, .005, .455), .150, .118), ((0, .000, .520), .150, .122), ((0, -.004, .600), .146, .122), ((0, -.004, .690), .150, .116),
         ((0, .000, .755), .140, .104), ((0, .004, .800), .100, .080), ((0, .006, .830), .055, .050)]


def cpart(style, obj, color, bones, smooth=True):
    finish(obj, color, bones, smooth=smooth)
    HAIR_STYLE_OF[obj.name] = style
    return obj


def torso_loft(style, name, z0, z1, grow, color, seg=20, caps=(False, True), extra=None):
    rings = []
    for (c, ra, rb) in TORSO:
        if z0 - 1e-6 <= c[2] <= z1 + 1e-6:
            rings.append((Vector(c), (ra + grow) * BW, rb + grow))
    if extra:
        rings = extra + rings
    return cpart(style, loft(f'{style}_{name}', rings, seg=seg, caps=caps, ref=Vector((1, 0, 0))), color, ['hips', 'spine', 'chest', 'neck'])


def arm_frame(s):
    sh = Vector((s * SHOULDER.x, SHOULDER.y, SHOULDER.z))
    d = Vector((s * ARM_DIR.x, ARM_DIR.y, ARM_DIR.z))
    return sh, d, sh + d * UPPER, sh + d * (UPPER + FORE)


def long_sleeves(style, color, cuff_color, r=(.062, .052, .047), seg=14):
    for s in (-1, 1):
        side = 'L' if s > 0 else 'R'
        sh, d, el, wr = arm_frame(s)
        rings = [(sh - d * .03, r[0] * .8, r[0] * .8), (sh + d * .03, r[0], r[0]), (el, r[1], r[1]), (wr - d * .012, r[2], r[2])]
        cpart(style, loft(f'{style}_Sleeve_{s}', rings, seg=seg, caps=(True, False)), color, ['chest', f'upper_arm.{side}', f'forearm.{side}'])
        cpart(style, torus(f'{style}_Cuff_{s}', wr - d * .015, r[2], .011, seg=14, rseg=5, rot=Vector((0, 0, 1)).rotation_difference(d)),
              cuff_color, [f'forearm.{side}'])


def hips_piece(style, color, grow=.004):
    rings = [((0, .006, .53), (.150 + grow) * BW, .122 + grow), ((0, .010, .46), (.158 + grow) * BW, .128 + grow),
             ((0, .012, .40), (.158 + grow) * BW, .126 + grow), ((0, .012, .37), .12 * BW, .095)]
    return cpart(style, loft(f'{style}_Hips', [(Vector(c), a, b) for c, a, b in rings], seg=20, caps=(False, True), ref=Vector((1, 0, 0))),
                 color, ['hips'])


def flare(style, name, rings, color, bones, seg=24, wave=0.0):
    sh = (lambda a, i: 1 + wave * math.cos(8 * a)) if wave else None
    return cpart(style, loft(f'{style}_{name}', [(Vector(c), a, b) for c, a, b in rings], seg=seg, caps=(False, False),
                             ref=Vector((1, 0, 0)), shape=sh), color, bones)


if HERO:
    # -- Top_hoodie: roomy torso, long sleeves, hood bunched at the nape, drawstrings, kangaroo pocket, hem band
    st = 'Top_hoodie'
    torso_loft(st, 'Body', .45, .84, .02, 'shirt', seg=16, extra=[(Vector((0, .006, .435)), .168 * BW, .14)])
    long_sleeves(st, 'shirt', 'shirt_shade', r=(.07, .058, .05), seg=10)
    cpart(st, torus(f'{st}_Hem', Vector((0, .006, .44)), .163 * BW, .016, seg=24, rseg=6), 'shirt_shade', ['hips', 'spine'])
    cpart(st, ellipsoid(f'{st}_Hood', (0, .105, .815), (.15 * BW, .07, .075), seg=18, rings=10), 'shirt', ['chest', 'neck'])
    cpart(st, ellipsoid(f'{st}_HoodIn', (0, .09, .835), (.11 * BW, .04, .045), seg=14, rings=8), 'shirt_shade', ['chest', 'neck'])
    cpart(st, ellipsoid(f'{st}_Pocket', (0, -.133, .51), (.1 * BW, .02, .05), seg=14, rings=8), 'shirt_shade', ['hips', 'spine'])
    for s in (-1, 1):
        cpart(st, tube(f'{st}_String_{s}', [(s * .03, -.11, .79), (s * .033, -.135, .7)], [.006, .006], seg=6), 'shirt_shade', ['chest'])
    # -- Top_jacket: tee underneath + open jacket with turned-down collar and lapels, long sleeves
    st = 'Top_jacket'
    torso_loft(st, 'Tee', .45, .84, .0, 'shirt_shade')
    jk = torso_loft(st, 'Coat', .44, .80, .022, 'shirt', caps=(False, False), extra=[(Vector((0, .006, .43)), .172 * BW, .142)])
    bm = bmesh.new()
    bm.from_mesh(jk.data)
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.calc_center_median().y < -.06 and abs(f.calc_center_median().x) < .045 * BW],
                     context='FACES')
    bm.to_mesh(jk.data)
    bm.free()
    long_sleeves(st, 'shirt', 'shirt_shade', r=(.068, .056, .05))
    for s in (-1, 1):
        cpart(st, ellipsoid(f'{st}_Lapel_{s}', (s * .065 * BW, -.125, .72), (.045, .012, .085), seg=10, rings=6,
                            rot=Euler((math.radians(-12), 0, math.radians(-22 * s))).to_quaternion()), 'shirt_shade', ['chest'])
        cpart(st, ellipsoid(f'{st}_Collar_{s}', (s * .06 * BW, -.03, .805), (.06, .045, .02), seg=10, rings=6,
                            rot=Euler((math.radians(-20), math.radians(18 * s), 0)).to_quaternion()), 'shirt_shade', ['chest', 'neck'])
    # -- Top_aodai: fitted bodice, mandarin collar, slim long sleeves, front and back panels to the knee (slit at the sides)
    st = 'Top_aodai'
    torso_loft(st, 'Body', .455, .84, .006, 'shirt')
    cpart(st, loft(f'{st}_Collar', [(Vector((0, .006, .80)), .062, .058), (Vector((0, .006, .855)), .058, .055)], seg=16, caps=(False, False)),
          'shirt_shade', ['neck', 'chest'])
    long_sleeves(st, 'shirt', 'shirt', r=(.058, .046, .04))
    for side_y, nm in ((-1, 'Front'), (1, 'Back')):
        rings = [((0, side_y * .095, .5), .14 * BW, .03), ((0, side_y * .11, .4), .15 * BW, .025), ((0, side_y * .12, .3), .16 * BW, .022),
                 ((0, side_y * .125, .23), .165 * BW, .02)]
        flare(st, nm, rings, 'shirt', ['hips', 'thigh.L', 'thigh.R'], seg=16)
    if not BOY:
        # -- Bottom_skirt: flared to the knee, waistband
        st = 'Bottom_skirt'
        hips_piece(st, 'shorts')
        flare(st, 'Skirt', [((0, .006, .53), .152, .124), ((0, .008, .46), .175, .15), ((0, .012, .36), .24, .21), ((0, .014, .28), .285, .25)],
              'shorts', ['hips', 'thigh.L', 'thigh.R'], seg=28, wave=.035)
        cpart(st, torus(f'{st}_Band', Vector((0, .006, .52)), .154, .014, seg=24, rseg=6), 'shorts_cuff', ['hips'])
        # -- Dress_sundress: bodice with two straps, flared skirt to the knee, bare shoulders
        st = 'Dress_sundress'
        torso_loft(st, 'Bodice', .455, .755, .006, 'shirt', caps=(False, False))
        cpart(st, loft(f'{st}_Neck', [(Vector((0, .0, .755)), .14, .104), (Vector((0, .004, .80)), .1, .08), (Vector((0, .006, .835)), .052, .048)],
                       seg=20, caps=(False, True), ref=Vector((1, 0, 0))), 'skin', ['chest', 'neck'])
        flare(st, 'Skirt', [((0, .006, .6), .15, .124), ((0, .008, .5), .19, .16), ((0, .012, .38), .25, .22), ((0, .014, .27), .3, .27)],
              'shirt', ['hips', 'thigh.L', 'thigh.R'], seg=28, wave=.03)
        for s in (-1, 1):
            side = 'L' if s > 0 else 'R'
            sh, d, el, wr = arm_frame(s)
            cpart(st, ellipsoid(f'{st}_Shoulder_{s}', sh + d * .02, (.05, .05, .05), seg=12, rings=8), 'skin', ['chest', f'upper_arm.{side}'])
            cpart(st, tube(f'{st}_Strap_{s}', [(s * .06, -.1, .75), (s * .08, -.02, .8), (s * .07, .08, .76)], [.012, .012, .012], seg=6),
                  'shirt_shade', ['chest'])
        cpart(st, torus(f'{st}_Waist', Vector((0, .006, .6)), .152, .013, seg=24, rseg=6), 'shirt_shade', ['spine'])
        # -- Dress_party: princess dress: bodice, puff sleeves, big petticoat skirt, ruffled hem, bow
        st = 'Dress_party'
        torso_loft(st, 'Bodice', .455, .84, .008, 'shirt')
        flare(st, 'Skirt', [((0, .006, .56), .155, .128), ((0, .01, .48), .26, .23), ((0, .014, .38), .35, .32), ((0, .016, .3), .37, .34),
                            ((0, .016, .25), .35, .32)], 'shirt', ['hips', 'thigh.L', 'thigh.R'], seg=24, wave=.05)
        cpart(st, torus(f'{st}_Ruffle', Vector((0, .016, .255)), .35, .03, seg=32, rseg=6, sy=.32 / .35), 'shirt_shade',
              ['hips', 'thigh.L', 'thigh.R'])
        for s in (-1, 1):
            side = 'L' if s > 0 else 'R'
            sh, d, el, wr = arm_frame(s)
            cpart(st, ellipsoid(f'{st}_Puff_{s}', sh + d * .04, (.085, .085, .075), seg=10, rings=6,
                                deform=lambda q_, v: q_ * (1 + .06 * math.cos(8 * math.atan2(v.y, v.x)))), 'shirt', ['chest', f'upper_arm.{side}'])
            cpart(st, ellipsoid(f'{st}_Bow_{s}', (s * .06, .135, .58), (.06, .02, .04), seg=10, rings=6, rot=Euler((0, s * .3, 0)).to_quaternion()),
                  'shirt_shade', ['spine'])
        cpart(st, torus(f'{st}_Waist', Vector((0, .006, .56)), .156, .016, seg=24, rseg=6), 'shirt_shade', ['spine'])
    # -- Bottom_trousers: hips + long legs tucked into the boot tops
    st = 'Bottom_trousers'
    hips_piece(st, 'shorts')
    for s in (-1, 1):
        side = 'L' if s > 0 else 'R'
        rings = [((s * .072, .010, .44), .088, .09), ((s * .088, .010, .34), .078, .08), ((s * .09, .008, .26), .068, .07),
                 ((s * .09, .006, .225), .066, .068)]
        cpart(st, loft(f'{st}_Leg_{s}', [(Vector(c), a, b) for c, a, b in rings], seg=16, caps=(False, False)), 'shorts',
              ['hips', f'thigh.{side}', f'shin.{side}'])
        cpart(st, torus(f'{st}_Cuff_{s}', Vector((s * .09, .006, .23)), .067, .012, seg=16, rseg=5), 'shorts_cuff', [f'shin.{side}'])

    # ---------------- batch 25: event outfits ----------------
    def flower(st, c, r, color='ev_yellow', bones=('chest',), ny=-1):
        for k in range(5):
            a = k * 2 * math.pi / 5
            cpart(st, ellipsoid(f'{st}_Petal_{c.x:.2f}_{c.z:.2f}_{k}', c + Vector((r * math.cos(a), 0, r * math.sin(a))), (r * .75, .006, r * .75),
                                seg=6, rings=3), color, list(bones))
        cpart(st, ellipsoid(f'{st}_FlowerC_{c.x:.2f}_{c.z:.2f}', c + Vector((0, ny * .003, 0)), (r * .55, .007, r * .55), seg=6, rings=3),
              'ev_red_dark', list(bones))
    # -- Top_aodai_tet: red áo dài with a gold collar and gold apricot flowers on the bodice and front panel
    st = 'Top_aodai_tet'
    torso_loft(st, 'Body', .455, .84, .007, 'ev_red')
    cpart(st, loft(f'{st}_Collar', [(Vector((0, .006, .80)), .063, .059), (Vector((0, .006, .86)), .059, .056)], seg=16, caps=(False, False)),
          'ev_yellow', ['neck', 'chest'])
    long_sleeves(st, 'ev_red', 'ev_yellow', r=(.058, .046, .04))
    for side_y, nm in ((-1, 'Front'), (1, 'Back')):
        rings = [((0, side_y * .095, .5), .14 * BW, .03), ((0, side_y * .11, .4), .15 * BW, .025), ((0, side_y * .12, .3), .16 * BW, .022),
                 ((0, side_y * .125, .21), .165 * BW, .02)]
        flare(st, nm, rings, 'ev_red', ['hips', 'thigh.L', 'thigh.R'], seg=16)
    flower(st, Vector((.07 * BW, -.128, .66)), .022)
    flower(st, Vector((-.04 * BW, -.126, .55)), .018, bones=('spine',))
    flower(st, Vector((.03 * BW, -.147, .34)), .026, bones=('hips',))
    # -- Top_xmas_sweater: knitted red sweater, white stripes and cuffs, a little green tree with a star
    st = 'Top_xmas_sweater'
    torso_loft(st, 'Body', .45, .84, .02, 'ev_red', seg=16, extra=[(Vector((0, .006, .435)), .168 * BW, .14)])
    long_sleeves(st, 'ev_red', 'white', r=(.07, .058, .05), seg=10)
    cpart(st, torus(f'{st}_Hem', Vector((0, .006, .44)), .163 * BW, .017, seg=24, rseg=6), 'white', ['hips', 'spine'])
    cpart(st, torus(f'{st}_Stripe', Vector((0, .0, .73)), .17 * BW, .012, seg=24, rseg=4, sy=.134 / (.17 * BW)), 'white', ['chest'])
    cpart(st, torus(f'{st}_Neck', Vector((0, .004, .81)), .075, .016, seg=18, rseg=5), 'white', ['chest', 'neck'])
    cpart(st, loft(f'{st}_Tree', [(Vector((0, -.142, .5)), .065, .012), (Vector((0, -.14, .58)), .045, .01), (Vector((0, -.137, .66)), .004, .004)],
                   seg=4, caps=(True, False), ref=Vector((1, 0, 0))), 'ev_green', ['spine', 'chest'])
    cpart(st, ellipsoid(f'{st}_Star', Vector((0, -.14, .675)), (.016, .01, .016), seg=6, rings=4), 'ev_yellow', ['chest'])
    for k, (x, z) in enumerate(((-.09, .56), (.09, .6), (-.08, .66), (.1, .5))):
        cpart(st, ellipsoid(f'{st}_Snow_{k}', Vector((x * BW, -.14, z)), (.009, .006, .009), seg=6, rings=3), 'white', ['spine'])
    if not BOY:
        # -- Dress_halloween_witch: purple dress, flared zigzag skirt with an orange hem, orange belt with a gold buckle
        st = 'Dress_halloween_witch'
        torso_loft(st, 'Bodice', .455, .84, .008, 'ev_purple')
        flare(st, 'Skirt', [((0, .006, .56), .155, .128), ((0, .01, .47), .21, .19), ((0, .014, .36), .28, .26), ((0, .016, .27), .31, .29)],
              'ev_purple', ['hips', 'thigh.L', 'thigh.R'], seg=24, wave=.07)
        cpart(st, torus(f'{st}_HemTrim', Vector((0, .016, .272)), .31, .016, seg=32, rseg=5, sy=.29 / .31), 'ev_orange', ['hips', 'thigh.L', 'thigh.R'])
        long_sleeves(st, 'ev_purple', 'ev_orange', r=(.06, .054, .058), seg=10)
        cpart(st, torus(f'{st}_Belt', Vector((0, .006, .56)), .157, .017, seg=24, rseg=6), 'ev_orange', ['spine'])
        cpart(st, ellipsoid(f'{st}_Buckle', Vector((0, -.135, .56)), (.028, .01, .024), seg=8, rings=4), 'ev_yellow', ['spine'])
        cpart(st, loft(f'{st}_Collar', [(Vector((0, .004, .79)), .11, .095), (Vector((0, .004, .82)), .15, .13)], seg=12, caps=(False, False),
                       shape=lambda a, i: 1 + .25 * (math.cos(6 * a) > 0) * i), 'ev_purple_dark', ['chest', 'neck'])
    HAT_Z = HAIR_C.z + HAIR_R[2] - .07
    # -- Hat_witch: wide brim, tall bent cone, orange band with a gold buckle
    st = 'Hat_witch'
    cpart(st, loft(f'{st}_Brim', [(Vector((0, .01, HAT_Z - .015)), .5, .48), (Vector((0, .01, HAT_Z + .005)), .48, .46)], seg=28, caps=(True, True)),
          'ev_purple_dark', ['head'])
    rings = []
    for k in range(8):
        t = k / 7
        rings.append((Vector((0, .01 + .16 * t ** 2.5, HAT_Z + .56 * t - .08 * t ** 4)), .27 * (1 - t) + .01, .26 * (1 - t) + .01))
    cpart(st, loft(f'{st}_Cone', rings, seg=20, caps=(False, True)), 'ev_purple', ['head'])
    cpart(st, torus(f'{st}_Band', Vector((0, .012, HAT_Z + .05)), .25, .018, seg=24, rseg=5, sy=.24 / .25), 'ev_orange', ['head'])
    cpart(st, ellipsoid(f'{st}_Buckle', Vector((0, -.235, HAT_Z + .05)), (.04, .01, .032), seg=8, rings=4), 'ev_yellow', ['head'])
    # -- Hat_santa: red cap flopping to the side, white fur rim and pompom
    st = 'Hat_santa'
    rings = []
    for k in range(8):
        t = k / 7
        rings.append((Vector((.2 * t ** 2.2, .012 + .03 * t, HAT_Z + .03 + .32 * t - .14 * t ** 3)), .28 * (1 - t) + .02, .27 * (1 - t) + .02))
    cpart(st, loft(f'{st}_Cap', rings, seg=20, caps=(False, True)), 'ev_red', ['head'])
    cpart(st, torus(f'{st}_Rim', Vector((0, .012, HAT_Z + .03)), .29, .045, seg=24, rseg=8, sy=.28 / .29), 'white', ['head'])
    cpart(st, ellipsoid(f'{st}_Pompom', rings[-1][0] + Vector((.03, 0, -.03)), (.065, .065, .065), seg=10, rings=6), 'white', ['head'])
    # -- Hat_antlers: brown headband over the hair, two branching antlers, little gold bells with red bows
    st = 'Hat_antlers'
    band = [HAIR_C + Vector((math.sin(a) * (HAIR_R[0] + .012), .03, math.cos(a) * (HAIR_R[2] + .012))) for a in
            [math.radians(d) for d in range(-85, 86, 17)]]
    cpart(st, tube(f'{st}_Band', band, [.014] * len(band), seg=6), 'ev_brown', ['head'])
    for sd in (-1, 1):
        a = math.radians(38 * sd)
        b0 = HAIR_C + Vector((math.sin(a) * (HAIR_R[0] + .015), .03, math.cos(a) * (HAIR_R[2] + .015)))
        trunk = [b0, b0 + Vector((sd * .05, 0, .1)), b0 + Vector((sd * .09, .01, .2)), b0 + Vector((sd * .16, .02, .27))]
        cpart(st, tube(f'{st}_Antler_{sd}', trunk, [.022, .018, .014, .008], seg=6), 'leather_light', ['head'])
        for k, (i, d) in enumerate(((1, Vector((-sd * .04, -.01, .09))), (2, Vector((-sd * .02, -.01, .1))), (2, Vector((sd * .08, 0, .03))))):
            cpart(st, tube(f'{st}_Tine_{sd}_{k}', [trunk[i], trunk[i] + d], [.013, .006], seg=5), 'leather_light', ['head'])
        bell = b0 + Vector((sd * .02, -.03, -.01))
        cpart(st, ellipsoid(f'{st}_Bell_{sd}', bell, (.026, .026, .03), seg=8, rings=5), 'ev_yellow', ['head'])
        cpart(st, ellipsoid(f'{st}_Bow_{sd}', bell + Vector((0, -.006, .032)), (.03, .01, .014), seg=8, rings=4), 'ev_red', ['head'])
    # -- Acc_lantern_hand: Mid-Autumn star lantern on a bamboo stick, held in the right hand
    st = 'Acc_lantern_hand'
    HAND_R = Vector((-SHOULDER.x, SHOULDER.y, SHOULDER.z)) + Vector((-ARM_DIR.x, ARM_DIR.y, ARM_DIR.z)) * (UPPER + FORE + .045)
    tip = HAND_R + Vector((-.06, -.22, .34))
    cpart(st, tube(f'{st}_Stick', [HAND_R + Vector((0, .0, -.04)), tip], [.009, .007], seg=6), 'ev_brown', ['hand.R'])
    cpart(st, tube(f'{st}_String', [tip, tip + Vector((0, -.02, -.07))], [.003, .003], seg=4), 'ev_yellow', ['hand.R'])
    sc = tip + Vector((0, -.02, -.17))
    verts, faces = [], []
    for side, yy in ((0, -.03), (1, .03)):
        verts.append(sc + Vector((0, yy * 1.6, 0)))
        for k in range(10):
            a = math.pi / 2 + k * math.pi / 5
            r = .1 if k % 2 == 0 else .045
            verts.append(sc + Vector((r * math.cos(a), yy, r * math.sin(a))))
    for k in range(10):
        a, b = 1 + k, 1 + (k + 1) % 10
        faces.append((0, b, a))
        faces.append((11, 11 + a, 11 + b))
        faces.append((a, b, 11 + b, 11 + a))
    cpart(st, mesh_obj(f'{st}_Star', verts, faces), 'ev_red', ['hand.R'], smooth=False)
    cpart(st, ellipsoid(f'{st}_Glow', sc + Vector((0, -.05, 0)), (.03, .01, .03), seg=8, rings=4), 'ev_yellow', ['hand.R'])
    cpart(st, tube(f'{st}_Tassel', [sc + Vector((0, 0, -.045)), sc + Vector((0, 0, -.16))], [.008, .014], seg=6), 'ev_yellow', ['hand.R'])
    # -- Acc_mask_cat: Mid-Autumn style cat mask worn pushed to the side of the head (left), tilted up: white face,
    #    ears with pink insides, closed happy eyes, pink nose and blush, whiskers
    st = 'Acc_mask_cat'
    nrm = Vector((.82, -.5, .3)).normalized()
    MP = HAIR_C + Vector((nrm.x * (HAIR_R[0] + .02), nrm.y * (HAIR_R[1] + .02), nrm.z * (HAIR_R[2] + .02)))
    MR = Vector((0, -1, 0)).rotation_difference(nrm) @ Quaternion((0, 1, 0), math.radians(-25))

    def W(x, y, z):          # mask-local (x right, -y out of the face, z up) -> model space
        return MP + MR @ Vector((x, y, z))
    cpart(st, ellipsoid(f'{st}_Face', W(0, .0, 0), (.12, .035, .105), seg=18, rings=10, rot=MR,
                        deform=lambda p_, v: p_ + Vector((0, .02 * (v.x ** 2 + v.z ** 2), 0))), 'white', ['head'])
    for sd in (-1, 1):
        cpart(st, loft(f'{st}_Ear_{sd}', [(W(sd * .07, .0, .07), .045, .02), (W(sd * .1, .0, .16), .004, .004)], seg=4, caps=(True, False),
                       ref=MR @ Vector((1, 0, 0))), 'white', ['head'])
        cpart(st, loft(f'{st}_EarIn_{sd}', [(W(sd * .072, -.014, .085), .025, .006), (W(sd * .093, -.014, .14), .003, .003)], seg=4,
                       caps=(True, False), ref=MR @ Vector((1, 0, 0))), 'ev_pink', ['head'])
        cpart(st, tube(f'{st}_Eye_{sd}', [W(sd * .065, -.036, .02), W(sd * .045, -.04, .035), W(sd * .025, -.036, .02)], [.006, .007, .006], seg=5),
              'ev_black', ['head'])
        cpart(st, ellipsoid(f'{st}_Blush_{sd}', W(sd * .07, -.03, -.025), (.022, .006, .013), seg=8, rings=4, rot=MR), 'ev_pink', ['head'])
        for k in range(2):
            cpart(st, tube(f'{st}_Whisker_{sd}_{k}', [W(sd * .05, -.038, -.04 - .015 * k), W(sd * .14, -.03, -.03 - .03 * k)], [.003, .002], seg=4),
                  'ev_black', ['head'])
    cpart(st, ellipsoid(f'{st}_Nose', W(0, -.04, -.02), (.016, .008, .011), seg=8, rings=4, rot=MR), 'ev_pink', ['head'])
    cpart(st, tube(f'{st}_Mouth', [W(-.022, -.037, -.05), W(0, -.04, -.04), W(.022, -.037, -.05)], [.003, .003, .003], seg=4), 'ev_black', ['head'])
    cpart(st, tube(f'{st}_Strap', [W(-.11, .02, 0), HAIR_C + Vector((0, .1, HAIR_R[2] * .55)), HAIR_C + Vector((-HAIR_R[0] * .7, .06, HAIR_R[2] * .4))],
                   [.006, .006, .006], seg=4), 'ev_red', ['head'])

if BOY:
    # boy hairstyles (the curly updo built above is dropped at join time)
    def boy_cap(style, back=-.2, ridges=True, shrink=.004, seg=22, rings=12):
        return low_cap(style, seg=seg, rings=rings, back=back, shrink=shrink, ridges=ridges)
    st = 'Hair_short'
    boy_cap(st)
    fringe(st, [(-40, 40, 26, .045), (-10, 35, 26, .045), (20, 30, 24, .042), (48, 20, 18, .036)])
    for s in (-1, 1):
        p = on_hair(math.radians(95) * s, math.radians(-12), -.01)
        hpart(st, ellipsoid(f'{st}_Side_{s}', p, (.03, .06, .07), seg=8, rings=5), 'hair_dark')
    st = 'Hair_spiky'
    boy_cap(st)
    for k in range(14):
        az = (k / 14) * 2 * math.pi - math.pi
        el = 55 if k % 2 else 30
        if abs(az) < math.radians(50) and el < 40:
            el = 50
        p = on_hair(az, math.radians(el), -.01)
        n = (p - HAIR_C).normalized()
        hpart(st, loft(f'{st}_Spike_{k}', [(p, .05, .04), (p + n * .09 + Vector((0, .02, .03)), .004, .004)], seg=6, caps=(True, False)),
              HAIR_COLS[k % 3])
    fringe(st, [(-30, 20, 26, .04), (0, 15, 28, .04), (30, 15, 26, .04)])
    st = 'Hair_side'
    boy_cap(st, back=-.22)
    hpart(st, loft(f'{st}_Sweep', [(on_hair(math.radians(-60), math.radians(55), .0), .06, .03),
                                   (on_hair(math.radians(0), math.radians(48), .03), .09, .04),
                                   (on_hair(math.radians(55), math.radians(32), .02), .06, .03),
                                   (on_hair(math.radians(85), math.radians(15), .0), .02, .02)], seg=10, ref=Vector((0, 0, 1))), 'hair_light')
    fringe(st, [(-45, 60, 28, .045), (-10, 55, 27, .042), (25, 40, 24, .038)])
    st = 'Hair_buzz'
    boy_cap(st, back=-.18, ridges=False, shrink=.016, seg=20, rings=10)

# ---------------- friends' own props (v03 round 2) -----------------------------------------
_D = Vector((ARM_DIR.x, ARM_DIR.y, ARM_DIR.z))
HAND_L = Vector((SHOULDER.x, SHOULDER.y, SHOULDER.z)) + _D * (UPPER + FORE + .045)
HAND_R = Vector((-HAND_L.x, HAND_L.y, HAND_L.z))
if VARIANT == 'lily':
    # twisted wooden staff with a glowing green crystal and leaves, leaf cape over the shoulders
    a, b = HAND_R + Vector((.0, -.02, -.40)), HAND_R + Vector((-.03, -.02, .88))
    finish(tube('Lily_Staff', [a, HAND_R, b + Vector((.0, 0, -.14)), b], [.024, .022, .020, .016], seg=8), 'leather', ['hand.R'])
    finish(torus('Lily_StaffLoop', b + Vector((0, 0, .075)), .075, .018, seg=18, rseg=6, rot=Quaternion((1, 0, 0), math.radians(90))), 'leather', ['hand.R'])
    cr = ellipsoid('Lily_Crystal', b + Vector((0, 0, .075)), (.038, .030, .060), seg=6, rings=4)
    finish(cr, 'crystal', ['hand.R'], smooth=False)
    for k in range(5):
        ang = k * 1.3
        finish(ellipsoid(f'Lily_StaffLeaf_{k}', b + Vector((math.cos(ang) * .07, .0, -.05 - k * .11)), (.050, .012, .028), seg=8, rings=5,
                         rot=Quaternion((0, 1, 0), ang)), 'leaf', ['hand.R'])
    for k in range(9):
        az = -math.pi * .9 + k * math.pi * 1.8 / 8
        c = Vector((math.sin(az) * .175, .01 - math.cos(az) * .135, .735))
        finish(ellipsoid(f'Lily_CapeLeaf_{k}', c + Vector((0, 0, -.05)), (.075, .022, .105), seg=10, rings=6,
                         rot=Quaternion((0, 0, 1), -az) @ Quaternion((1, 0, 0), math.radians(-28))), 'leaf' if k % 2 else 'bandana', ['chest'])
elif VARIANT == 'rose':
    # tall baker's hat over the bun, basket of bread on her left arm
    finish(ellipsoid('Rose_HatPuff', BUN + Vector((0, -.02, .05)), (.215, .200, .150), seg=20, rings=12,
                     deform=lambda q, v: q + v * (.012 * math.sin(math.atan2(v.y, v.x) * 7))), 'white', ['bun'])
    finish(loft('Rose_HatBand', [(BUN + Vector((0, -.02, -.095)), .150, .140), (BUN + Vector((0, -.02, -.02)), .155, .145)], seg=24, caps=(False, False)),
           'white', ['head'])
    BK = HAND_L + Vector((.03, -.05, -.17))
    finish(loft('Rose_Basket', [(BK + Vector((0, 0, -.07)), .085, .070), (BK, .120, .095), (BK + Vector((0, 0, .05)), .125, .100)], seg=20,
                caps=(True, False), shape=lambda a, i: 1 + .03 * math.cos(12 * a)), 'wicker', ['hand.L'])
    finish(torus('Rose_BasketRim', BK + Vector((0, 0, .05)), .125, .013, seg=24, rseg=6, sy=.100 / .125), 'wicker', ['hand.L'])
    for k, (dx, dy, rz) in enumerate(((-.05, .0, 20), (.045, -.02, -25), (.0, .03, 70))):
        finish(ellipsoid(f'Rose_Bread_{k}', BK + Vector((dx, dy, .085)), (.036, .085, .034), seg=12, rings=8,
                         rot=Quaternion((0, 0, 1), math.radians(rz)) @ Quaternion((1, 0, 0), math.radians(18))), 'bread' if k % 2 else 'bread_light', ['hand.L'])
    finish(tube('Rose_BasketHandle', [BK + Vector((-.122, 0, .05)), BK + Vector((-.07, 0, .15)), HAND_L, BK + Vector((.07, 0, .15)),
                                      BK + Vector((.122, 0, .05))], [.010] * 5, seg=8), 'wicker', ['hand.L'])
elif VARIANT == 'mia':
    # Mia the tailor: hair pins through the bun, round gold glasses, tape measure round the neck,
    # purple checked apron, scissors in the right hand
    for k, (dx, a) in enumerate(((-.05, .5), (.05, -.4))):
        finish(tube(f'Mia_Pin_{k}', [BUN + Vector((dx - .14 * math.cos(a), .02, .05 - .14 * math.sin(a) * .3)),
                                     BUN + Vector((dx + .14 * math.cos(a), .02, .05 + .14 * math.sin(a) * .3))], [.008, .008], seg=6), 'gold', ['bun'])
        finish(ellipsoid(f'Mia_PinBead_{k}', BUN + Vector((dx + .15 * math.cos(a), .02, .05 + .15 * math.sin(a) * .3)), (.018, .018, .018),
                         seg=8, rings=5), 'bandana', ['bun'])
    for s in (-1, 1):   # round glasses over the eyes
        ey = Vector((s * .112, -.272, HZ - .046))
        finish(torus(f'Mia_Glass_{s}', ey, .06, .007, seg=18, rseg=5, rot=Quaternion((1, 0, 0), math.radians(90))), 'gold', ['head'])
        finish(tube(f'Mia_Temple_{s}', [ey + Vector((s * .06, .0, .01)), Vector((s * .28, .0, HZ - .02))], [.006, .006], seg=5), 'gold', ['head'])
    finish(tube('Mia_GlassBridge', [Vector((-.052, -.276, HZ - .035)), Vector((0, -.282, HZ - .025)), Vector((.052, -.276, HZ - .035))],
                [.006, .006, .006], seg=5), 'gold', ['head'])
    finish(torus('Mia_Tape', Vector((0, .0, .815)), .115, .012, seg=24, rseg=4, sx=1.05, sy=.95), 'scarf', ['chest', 'neck'])
    for s in (-1, 1):
        finish(loft(f'Mia_TapeEnd_{s}', [(Vector((s * .06, -.115, .8)), .02, .004), (Vector((s * .07, -.135, .62)), .02, .004)], seg=6,
                    ref=Vector((0, 1, 0))), 'scarf', ['chest'])
    # apron: bib + skirt panel in front, checked with darker stripes
    finish(loft('Mia_ApronBib', [(Vector((0, -.135, .58)), .1, .012), (Vector((0, -.13, .74)), .085, .012)], seg=8, ref=Vector((0, 1, 0))),
           'bandana', ['chest', 'spine'])
    finish(loft('Mia_ApronSkirt', [(Vector((0, -.14, .52)), .15, .02), (Vector((0, -.16, .34)), .17, .02)], seg=10, ref=Vector((0, 1, 0))),
           'bandana', ['hips', 'thigh.L', 'thigh.R'])
    for k in range(5):
        x = -.12 + k * .06
        finish(tube(f'Mia_Check_{k}', [Vector((x, -.163, .51)), Vector((x * 1.1, -.183, .35))], [.004, .004], seg=4), 'bandana_dark',
               ['hips', 'thigh.L', 'thigh.R'])
    for k in range(3):
        z = .5 - k * .065
        finish(tube(f'Mia_CheckH_{k}', [Vector((-.15, -.165 - .005 * k, z)), Vector((.15, -.165 - .005 * k, z))], [.004, .004], seg=4),
               'bandana_dark', ['hips'])
    # scissors in her right hand
    for k, a in enumerate((.25, -.25)):
        finish(tube(f'Mia_Blade_{k}', [HAND_R + Vector((0, -.02, .0)), HAND_R + Vector((.04 * a, -.03, -.13))], [.008, .003], seg=4), 'brass', ['hand.R'])
        finish(torus(f'Mia_Ring_{k}', HAND_R + Vector((.025 * (1 if k else -1), -.01, .03)), .018, .005, seg=10, rseg=3), 'bandana_dark', ['hand.R'])
elif VARIANT == 'amira':
    # village elder: turquoise headscarf over the hair, palm-wood staff
    finish(ellipsoid('Amira_Scarf', HAIR_C + Vector((0, .02, .03)), (HAIR_R[0] + .05, HAIR_R[1] + .05, HAIR_R[2] + .05), seg=24, rings=14,
                     deform=lambda q_, v: q_ if v.y > -.55 or v.z > .45 else q_ * .2), 'bandana', ['head'])
    finish(loft('Amira_Drape', [(Vector((0, .2, 1.0)), .28, .1), (Vector((0, .22, .8)), .26, .08), (Vector((0, .2, .62)), .22, .05)], seg=12,
                ref=Vector((1, 0, 0))), 'bandana_dark', ['head', 'chest'])
    finish(torus('Amira_Band', HAIR_C + Vector((0, .0, .13)), HAIR_R[0] + .055, .02, seg=24, rseg=4, sy=(HAIR_R[1] + .055) / (HAIR_R[0] + .055),
                 rot=Quaternion((1, 0, 0), math.radians(-14))), 'gold', ['head'])
    st0, st1 = HAND_L + Vector((0, -.02, -.5)), HAND_L + Vector((.02, -.02, .75))
    finish(tube('Amira_Staff', [st0, HAND_L, st1], [.025, .022, .02], seg=8), 'leather', ['hand.L'])
    for k in range(5):
        a = k * 1.25
        finish(ellipsoid(f'Amira_Frond_{k}', st1 + Vector((.09 * math.cos(a), .09 * math.sin(a), .03)), (.11, .025, .03), seg=8, rings=4,
                         rot=Quaternion((0, 0, 1), a) @ Quaternion((0, 1, 0), -.5)), 'leaf', ['hand.L'])
elif VARIANT == 'karim':
    # merchant: turban with a jewel, curled moustache, striped cloak, bag of goods
    for k in range(3):
        finish(torus(f'Karim_Turban_{k}', HAIR_C + Vector((0, .01, .1 + .07 * k)), HAIR_R[0] - .02 * k, .05, seg=24, rseg=6,
                     sy=(HAIR_R[1] - .02 * k) / (HAIR_R[0] - .02 * k)), 'bandana' if k % 2 == 0 else 'white', ['head'])
    finish(ellipsoid('Karim_TurbanTop', HAIR_C + Vector((0, .01, .26)), (.2, .19, .1), seg=16, rings=8), 'bandana', ['head'])
    finish(ellipsoid('Karim_Jewel', HAIR_C + Vector((0, -HAIR_R[1] - .02, .12)), (.035, .02, .045), seg=8, rings=5), 'crystal', ['head'])
    for sd in (-1, 1):   # curled moustache under the nose
        pts = [Vector((sd * .015, -.262, HZ - .1)), Vector((sd * .06, -.262, HZ - .11)), Vector((sd * .1, -.25, HZ - .09)),
               Vector((sd * .11, -.245, HZ - .06))]
        finish(tube(f'Karim_Moustache_{sd}', pts, [.016, .018, .012, .006], seg=6), 'hair_dark', ['head'])
    finish(loft('Karim_Cloak', [(Vector((0, .02, .8)), .19, .14), (Vector((0, .06, .55)), .25, .19), (Vector((0, .07, .3)), .28, .21)],
                seg=16, caps=(False, False), ref=Vector((1, 0, 0))), 'shorts', ['chest', 'spine', 'hips'])
    for k in range(6):
        a = math.pi * .2 + k * math.pi * .6 / 5
        finish(tube(f'Karim_Stripe_{k}', [Vector((.2 * math.cos(a), .02 + .2 * math.sin(a), .78)), Vector((.29 * math.cos(a), .07 + .22 * math.sin(a), .32))],
                    [.008, .008], seg=4), 'scarf', ['chest', 'hips'])
    finish(ellipsoid('Karim_Bag', Vector((.05, .26, .58)), (.16, .1, .17), seg=12, rings=8), 'wicker', ['chest', 'spine'])
elif VARIANT == 'layla':
    # young guide: wide-brimmed hat with sand goggles, rolled map in her hand
    hz = HAIR_C.z + HAIR_R[2] - .06
    finish(loft('Layla_HatBrim', [(Vector((0, .01, hz - .02)), .48, .46), (Vector((0, .01, hz)), .46, .44)], seg=24, caps=(True, True)), 'leather', ['head'])
    finish(loft('Layla_HatCrown', [(Vector((0, .01, hz)), .27, .26), (Vector((0, .01, hz + .16)), .24, .23), (Vector((0, .01, hz + .2)), .18, .17)],
                seg=20, caps=(False, True)), 'leather_light', ['head'])
    finish(torus('Layla_HatBand', Vector((0, .01, hz + .04)), .265, .02, seg=20, rseg=4), 'bandana', ['head'])
    for sd in (-1, 1):
        finish(torus(f'Layla_Goggle_{sd}', Vector((sd * .09, -.25, hz + .07)), .05, .014, seg=12, rseg=4, rot=Quaternion((1, 0, 0), math.radians(70))),
               'brass', ['head'])
        finish(ellipsoid(f'Layla_GoggleLens_{sd}', Vector((sd * .09, -.255, hz + .07)), (.045, .01, .045), seg=10, rings=5,
                         rot=Quaternion((1, 0, 0), math.radians(-20))), 'lens', ['head'])
    finish(tube('Layla_Map', [HAND_R + Vector((-.1, -.03, .0)), HAND_R + Vector((.1, -.03, .02))], [.03, .03], seg=10), 'parchment', ['hand.R'])
    finish(torus('Layla_MapTie', HAND_R + Vector((0, -.03, .01)), .032, .006, seg=10, rseg=3, rot=Quaternion((0, 1, 0), math.radians(90))), 'ribbon', ['hand.R'])
elif VARIANT == 'idris':
    # blacksmith: leather apron, hammer, bushy beard
    for k in range(9):
        a = -1.1 + k * .275
        finish(ellipsoid(f'Idris_Beard_{k}', Vector((.13 * math.sin(a), -.2 - .05 * math.cos(a), HZ - .17 - .03 * math.cos(a * 1.5))),
                         (.06, .05, .07), seg=8, rings=5), 'hair_dark' if k % 2 else 'hair', ['head'])
    finish(ellipsoid('Idris_BeardTip', Vector((0, -.26, HZ - .25)), (.08, .05, .08), seg=10, rings=6), 'hair', ['head'])
    finish(loft('Idris_Apron', [(Vector((0, -.135, .75)), .12, .012), (Vector((0, -.14, .5)), .16, .015), (Vector((0, -.16, .3)), .17, .015)], seg=8,
                ref=Vector((0, 1, 0))), 'leather_dark', ['chest', 'spine', 'hips', 'thigh.L', 'thigh.R'])
    finish(tube('Idris_HammerHandle', [HAND_R + Vector((0, -.02, -.15)), HAND_R + Vector((0, -.02, .2))], [.018, .018], seg=6), 'leather', ['hand.R'])
    finish(ellipsoid('Idris_HammerHead', HAND_R + Vector((0, -.02, .24)), (.09, .05, .05), seg=10, rings=6), 'brass_dark', ['hand.R'])
elif VARIANT == 'anna':
    # big yellow bow on the bun and a little lute on her back strap, neck up over the left shoulder
    for sgn in (-1, 1):
        finish(ellipsoid(f'Anna_Bow_{sgn}', BUN + Vector((sgn * .135, -.06, .02)), (.125, .040, .085), seg=14, rings=8,
                         rot=Quaternion((0, 1, 0), math.radians(-22 * sgn))), 'bandana', ['bun'])
        finish(loft(f'Anna_BowTail_{sgn}', [(BUN + Vector((sgn * .04, -.08, -.02)), .030, .010), (BUN + Vector((sgn * .11, -.07, -.20)), .040, .010)],
                    seg=8, ref=Vector((0, 1, 0))), 'bandana_dark', ['bun'])
    finish(ellipsoid('Anna_BowKnot', BUN + Vector((0, -.085, .02)), (.045, .035, .045), seg=10, rings=6), 'bandana_dark', ['bun'])
    LC = Vector((-.05, .215, .560))
    lq = Quaternion((0, 1, 0), math.radians(-32))
    finish(ellipsoid('Anna_LuteBody', LC, (.135, .060, .165), seg=18, rings=10, rot=lq), 'lute', ['chest', 'spine'])
    finish(ellipsoid('Anna_LuteHole', LC + Vector((0, .058, .0)), (.040, .008, .040), seg=10, rings=4, rot=lq), 'lute_dark', ['chest', 'spine'])
    n0, n1 = LC + lq @ Vector((0, 0, .15)), LC + lq @ Vector((0, 0, .46))
    finish(tube('Anna_LuteNeck', [n0, n1], [.022, .018], seg=8), 'lute_dark', ['chest'])
    finish(box('Anna_LuteHead', n1 + lq @ Vector((0, 0, .03)), (.060, .030, .075), bevel=.008, rot=lq) if 'box' in globals() else
           ellipsoid('Anna_LuteHead', n1 + lq @ Vector((0, 0, .03)), (.034, .018, .042), seg=8, rings=5, rot=lq), 'lute', ['chest'])

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

# join the parts into skinned meshes: the body (+ the friends' hair), and for Ngọc one object per hairstyle
def _style(o):
    if not HERO:
        return None
    if o.name in HAIR_STYLE_OF:
        return HAIR_STYLE_OF[o.name]
    if o.name.startswith(HAIR_SHORT_PREFIX):
        return '_drop' if BOY else 'Hair_short'      # the boy has his own short cut
    if o.name.startswith(TOP_PREFIX):
        return 'Top_tshirt'
    if o.name.startswith(BOTTOM_PREFIX):
        return 'Bottom_shorts'
    if o.name.startswith(GOGGLE_PREFIX):
        return 'Gear_goggles'
    return None


def _join(objs, active, name):
    for o in bpy.context.view_layer.objects:
        o.select_set(o in objs)
    bpy.context.view_layer.objects.active = active
    if len(objs) > 1:
        with bpy.context.temp_override(active_object=active, selected_editable_objects=objs, selected_objects=objs):
            bpy.ops.object.join()
    active.name = name
    active.data.name = name
    active.parent = rig
    md = active.modifiers.new('NgocRig', 'ARMATURE')
    md.object = rig
    bpy.context.view_layer.objects.active = active
    with bpy.context.temp_override(object=active, active_object=active):
        bpy.ops.object.vertex_group_normalize_all(lock_active=False)
        bpy.ops.object.vertex_group_limit_total(limit=4)
    print('mesh', name, 'materials', [m.name for m in active.data.materials],
          'triangles', sum(len(p.vertices) - 2 for p in active.data.polygons))
    return active


_groups = {}
for o, _ in PARTS:
    _groups.setdefault(_style(o), []).append(o)
body = _join(_groups.pop(None), head, 'Ngoc')
for o in _groups.pop('_drop', []):
    bpy.data.objects.remove(o)
HAIRS = {}      # every swappable piece (hair, clothes, goggles), keyed by object name
DEFAULT_SHOWN = ('Hair_short', 'Top_tshirt', 'Bottom_shorts', 'Gear_goggles')
_order = ['Hair_short'] + (['Hair_spiky', 'Hair_side', 'Hair_buzz'] if BOY else HAIR_STYLES) + \
    ['Top_tshirt', 'Bottom_shorts', 'Gear_goggles'] + (CLOTHES if HERO else [])
for st in _order:
    if st in _groups:
        objs = _groups[st]
        HAIRS[st] = _join(objs, objs[0], st)
        if st not in DEFAULT_SHOWN:
            HAIRS[st]['eq_hidden'] = 1          # glTF extras: the game starts with only the default pieces visible
tri_count = sum(len(p.vertices) - 2 for o in [body] + list(HAIRS.values()) for p in o.data.polygons)
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
    export_animations=os.environ.get('CHIBI_NO_ANIM') != '1', export_animation_mode='ACTIONS', export_nla_strips=True,
    export_force_sampling=True, export_frame_step=1, export_def_bones=True, export_skins=True,
    export_morph=False, export_yup=True, export_texcoords=True, export_normals=True,
    export_image_format='AUTO', export_materials='EXPORT', export_extras=False, export_vertex_color='ACTIVE', export_all_vertex_colors=False,
    export_anim_single_armature=True, export_reset_pose_bones=True, export_optimize_animation_size=False,
)
import inspect

def _decimate(ob):
    """Optional triangle reduction for weak machines: CHIBI_DECIMATE=0.5 keeps half the triangles (weights and UVs survive)."""
    import os as _os
    r = float(_os.environ.get('CHIBI_DECIMATE', '1'))
    if r >= 1:
        return
    _sel, _act = list(bpy.context.selected_objects), bpy.context.view_layer.objects.active      # the exporter relies on the selection
    bpy.context.view_layer.objects.active = ob
    for o in bpy.context.selected_objects:
        o.select_set(False)
    ob.select_set(True)
    m = ob.modifiers.new('Decimate', 'DECIMATE')
    m.ratio = r
    m.use_collapse_triangulate = True
    while ob.modifiers[0] != m:
        bpy.ops.object.modifier_move_up(modifier=m.name)
    bpy.ops.object.modifier_apply(modifier=m.name)
    print('decimated to', sum(len(p.vertices) - 2 for p in ob.data.polygons), 'triangles')

_decimate(body)
for _n in ('Top_tshirt', 'Bottom_shorts', 'Gear_goggles') + (() if BOY else ('Hair_short',)):
    if _n in HAIRS:
        _decimate(HAIRS[_n])            # pieces split off the original body; the new pieces are built light
for _n, _o in HAIRS.items():            # every swappable piece <= 1,500 triangles (the curly updo Hair_short is the old hair, kept as is)
    _t = sum(len(p.vertices) - 2 for p in _o.data.polygons)
    if _t > 1500 and _n != 'Hair_short':
        _m = _o.modifiers.new('Dec', 'DECIMATE')
        _m.ratio = 1450 / _t
        _m.use_collapse_triangulate = True
        while _o.modifiers[0] != _m:
            with bpy.context.temp_override(object=_o, active_object=_o):
                bpy.ops.object.modifier_move_up(modifier=_m.name)
        with bpy.context.temp_override(object=_o, active_object=_o):
            bpy.ops.object.modifier_apply(modifier=_m.name)
from bake_ao import bake_ao
# contact shadows: each mesh is baked with only the default hair (or its own style) present, so hidden styles
# don't darken the head of the visible one
_meshes = [body] + list(HAIRS.values())
for target in _meshes:
    tslot = SLOT(target.name) if target is not body else None
    keep = {body, target}
    for d in DEFAULT_SHOWN:           # the default outfit stays around, except pieces in the target's own slot
        if d in HAIRS and (tslot is None or (SLOT(d) != tslot and not (tslot == 'dress' and SLOT(d) in ('top', 'bottom')))):
            keep.add(HAIRS[d])
    for o in _meshes:
        o.hide_render = o not in keep
    bake_ao(target)
for o in _meshes:
    o.hide_render = False
print('final triangles', {o.name: sum(len(p.vertices) - 2 for p in o.data.polygons) for o in _meshes})
for o in bpy.context.view_layer.objects:      # select rig + meshes again: the exporter writes the skin only for selected objects
    o.select_set(o in [rig] + _meshes)
export_kwargs['export_extras'] = bool(HAIRS)
if HEIGHT:      # desert NPCs: same skeleton and clips, scaled as a whole by the rig node
    rig.scale = (HEIGHT / 1.562,) * 3
bpy.context.view_layer.objects.active = rig
props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
bpy.ops.export_scene.gltf(**{k: v for k, v in export_kwargs.items() if k in props})
print('exported', GLB, 'triangles', tri_count)
