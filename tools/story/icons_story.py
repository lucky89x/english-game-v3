"""Story icons (128 px, transparent): rank_01..11 (Word Keeper ranks: bronze -> silver -> gold -> platinum -> crystal rims,
symbol in the middle), compass_piece_01..10 (each piece seen from above) and badge_word_keeper (leaf + letter A).
Run: STORY=<folder with prop_compass_piece_XX_v01.glb> DST=assets/ui blender -b -P tools/story/icons_story.py
"""
import bpy, os, math
from mathutils import Vector, Matrix

STORY, DST = os.environ["STORY"], os.environ["DST"]
RANKS = [("leaf", "b07a45"), ("compass", "b07a45"), ("book", "c0c6cc"), ("torch", "c0c6cc"), ("hat", "e2b04a"), ("cloak", "e2b04a"),
         ("sword", "e2b04a"), ("shield", "dfe6ee"), ("crown", "dfe6ee"), ("star", "9fe6ff"), ("goldbook", "9fe6ff")]


def lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4) for x in c] + [1]


def mat(name, hexc, emit=0.0, metal=0.0, rough=.4, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = lin(hexc)
    b.inputs['Metallic'].default_value = metal
    b.inputs['Roughness'].default_value = rough
    if emit:
        b.inputs['Emission Color'].default_value = lin(hexc)
        b.inputs['Emission Strength'].default_value = emit
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
    return m


def add(o, m, smooth=True):
    o.data.materials.append(m)
    for p in o.data.polygons:
        p.use_smooth = smooth
    return o


def prim(kind, loc, scale=(1, 1, 1), rot=(0, 0, 0), m=None, **kw):
    getattr(bpy.ops.mesh, "primitive_%s_add" % kind)(location=loc, rotation=rot, **kw)
    o = bpy.context.object
    o.scale = scale
    return add(o, m)


def render(path, ortho=2.3, view=(0, -6, 0), rot=(math.pi / 2, 0, 0)):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = 32
    sc.cycles.use_denoising = True
    sc.render.resolution_x = sc.render.resolution_y = 128
    sc.render.film_transparent = True
    sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'Standard'
    w = bpy.data.worlds.new('w')
    sc.world = w
    w.use_nodes = True
    bg = next(x for x in w.node_tree.nodes if x.type == 'BACKGROUND')
    bg.inputs[0].default_value = (0.9, 0.92, 1.0, 1)
    bg.inputs[1].default_value = .9
    for loc, en in [((-3, -5, 4), 700), ((4, -3, 1), 200), ((0, 0, 6), 300)]:
        l = bpy.data.objects.new('l', bpy.data.lights.new('l', 'POINT'))
        l.data.energy, l.data.shadow_soft_size, l.location = en, 2, loc
        sc.collection.objects.link(l)
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = 'ABSOLUTE'
    sc.render.line_thickness = 1.0
    ls = bpy.context.view_layer.freestyle_settings.linesets[0]
    ls.select_silhouette, ls.select_border, ls.select_crease = True, True, False
    if ls.linestyle is None:
        ls.linestyle = bpy.data.linestyles.new('line')
    ls.linestyle.color = (0.13, 0.08, 0.12)
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = ortho
    cam.location, cam.rotation_euler = view, rot
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    try:
        from PIL import Image
        im = Image.open(path).convert('RGBA')
        im.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(path, optimize=True)
    except ImportError:
        pass


def badge(rim_hex, inner_hex="2c3e66", crystal=False):
    prim("cylinder", (0, .2, 0), rot=(math.pi / 2, 0, 0), m=mat("disc", inner_hex, rough=.6), radius=1, depth=.12, vertices=48)
    rim = mat("rim", rim_hex, metal=.85 if not crystal else 0, rough=.25, emit=1.0 if crystal else 0, alpha=.85 if crystal else 1)
    prim("torus", (0, .12, 0), rot=(math.pi / 2, 0, 0), m=rim, major_radius=1, minor_radius=.1, major_segments=48, minor_segments=8)
    for k in range(12 if crystal else 8):   # little studs, more for the higher ranks
        a = k * 2 * math.pi / (12 if crystal else 8)
        prim("uv_sphere", (math.cos(a) * 1.0, .02, math.sin(a) * 1.0), scale=(.07, .07, .07), m=rim, segments=10, ring_count=6)


def bar(a, b, w, m, d=.08):
    a, b = Vector(a), Vector(b)
    o = prim("cube", tuple((a + b) / 2), m=m, size=1)
    o.scale = (w, d, (b - a).length)
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = (b - a).to_track_quat('Z', 'Y')
    return o


def symbol(kind, m, m2):
    if kind == "leaf":
        prim("uv_sphere", (0, -.1, .05), scale=(.38, .1, .6), rot=(0, .5, 0), m=m, segments=16, ring_count=8)
        bar((.25, -.15, -.5), (-.15, -.15, .45), .05, m2)
    elif kind == "compass":
        prim("cylinder", (0, -.05, 0), rot=(math.pi / 2, 0, 0), m=m2, radius=.55, depth=.06, vertices=32)
        prim("cone", (0, -.12, .25), scale=(.12, .04, 1), m=mat("needle", "e5483a", emit=1.0), radius1=1, radius2=0, depth=.5, vertices=4)
        prim("cone", (0, -.12, -.25), rot=(math.pi, 0, 0), scale=(.12, .04, 1), m=m, radius1=1, radius2=0, depth=.5, vertices=4)
    elif kind in ("book", "goldbook"):
        for s in (-1, 1):
            o = prim("cube", (s * .28, -.1, 0), rot=(0, s * -.15, 0), m=m, size=1)
            o.scale = (.52, .08, .7)
        prim("cube", (0, -.05, 0), scale=(1.1, .05, .74), m=m2, size=1)
    elif kind == "torch":
        bar((0, -.1, -.6), (0, -.1, .2), .12, m2)
        prim("cone", (0, -.1, .45), m=mat("flame", "ff8a2a", emit=3.0), radius1=.22, radius2=0, depth=.55, vertices=8)
    elif kind == "hat":
        prim("cone", (0, -.1, .2), m=m, radius1=.4, radius2=.05, depth=.8, vertices=12)
        prim("cylinder", (0, -.1, -.22), m=m, radius=.62, depth=.06, vertices=24)
        prim("torus", (0, -.1, -.12), m=m2, major_radius=.36, minor_radius=.05)
    elif kind == "cloak":
        prim("cone", (0, -.1, -.05), m=m, radius1=.55, radius2=.15, depth=1.0, vertices=12)
        prim("uv_sphere", (0, -.1, .48), scale=(.22, .2, .16), m=m2, segments=12, ring_count=6)
    elif kind == "sword":
        bar((0, -.12, -.25), (0, -.12, .7), .14, m, .04)
        bar((-.32, -.14, -.25), (.32, -.14, -.25), .09, m2)
        bar((0, -.12, -.3), (0, -.12, -.6), .09, mat("grip", "4a2e18"))
    elif kind == "shield":
        o = prim("cylinder", (0, -.08, .05), rot=(math.pi / 2, 0, 0), m=m, radius=.55, depth=.1, vertices=32)
        for v in o.data.vertices:
            if v.co.y < 0:
                v.co.x *= 1 + v.co.y * 1.3
                v.co.y *= 1.45
        bar((0, -.16, .45), (0, -.16, -.55), .08, m2, .02)
        bar((-.42, -.16, .1), (.42, -.16, .1), .08, m2, .02)
    elif kind == "crown":
        prim("cylinder", (0, -.1, -.2), scale=(1, .4, 1), m=m, radius=.5, depth=.3, vertices=24)
        for k in range(5):
            x = -.4 + k * .2
            prim("cone", (x, -.18, .15 + .1 * (k == 2)), m=m, radius1=.1, radius2=0, depth=.4 + .2 * (k == 2), vertices=4)
            prim("uv_sphere", (x, -.25, -.18), scale=(.06, .06, .06), m=m2, segments=8, ring_count=5)
    elif kind == "star":
        verts = []
        for i in range(10):
            a = math.pi / 2 + i * math.pi / 5
            r = .62 if i % 2 == 0 else .26
            verts.append((r * math.cos(a), 0, r * math.sin(a)))
        me = bpy.data.meshes.new("star")
        me.from_pydata(verts + [(0, -.15, 0), (0, .05, 0)], [], [[10, (i + 1) % 10, i] for i in range(10)] + [[11, i, (i + 1) % 10] for i in range(10)])
        o = bpy.data.objects.new("star", me)
        bpy.context.collection.objects.link(o)
        add(o, m, smooth=False)


for i, (sym, rim) in enumerate(RANKS):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    badge(rim, crystal=i >= 9)
    gold = "e2b04a" if sym != "book" else "f4e2b8"
    symbol(sym, mat("sym", {"leaf": "5fb04a", "compass": "e2b04a", "book": "8c3a2a", "torch": "e2b04a", "hat": "3a4f9a", "cloak": "6a3a9a",
                           "sword": "dfe6ee", "shield": "c9463a", "crown": "f2c84b", "star": "ffe45a", "goldbook": "e2b04a"}[sym],
                    emit=.6 if sym in ("star", "goldbook") else 0, metal=.6 if sym in ("compass", "crown", "goldbook", "sword") else 0),
           mat("sym2", gold, metal=.7, rough=.3))
    render(os.path.abspath(os.path.join(DST, "rank_%02d.png" % (i + 1))))
    print("ICON rank", i + 1)

for k in range(10):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(STORY, "prop_compass_piece_%02d_v01.glb" % (k + 1)))
    for o in bpy.data.objects:
        o.animation_data_clear()
        o.location = (0, 0, 0)
        o.rotation_euler = (0, 0, 0)
    render(os.path.abspath(os.path.join(DST, "compass_piece_%02d.png" % (k + 1))), ortho=.82, view=(0, 0, 3), rot=(0, 0, 0))
    print("ICON piece", k + 1)

bpy.ops.wm.read_factory_settings(use_empty=True)
badge("e2b04a", inner_hex="2f6a3e")
prim("uv_sphere", (-.12, -.1, .05), scale=(.42, .1, .62), rot=(0, .6, 0), m=mat("leaf", "6fc04a"), segments=16, ring_count=8)
bpy.ops.object.text_add(location=(.12, -.25, -.28), rotation=(math.pi / 2, 0, 0))
t = bpy.context.object
t.data.body = "A"
t.data.size = .95
t.data.extrude = .05
t.data.align_x = 'CENTER'
bpy.ops.object.convert(target='MESH')
add(bpy.context.object, mat("letter", "fff2c0", emit=.8), smooth=False)
render(os.path.abspath(os.path.join(DST, "badge_word_keeper.png")))
print("ICON badge")
