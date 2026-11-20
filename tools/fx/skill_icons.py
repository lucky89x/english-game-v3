"""24 skill icons (128 px, transparent): inner skills = round badge with metal rim and an emblem (heart, shield, drop);
outer skills = the spell effect (from tools/fx models) on a disc in the element colour.
Run: FX=<folder with fx_*.glb> DST=assets/ui blender -b -P tools/fx/skill_icons.py   (optional ONLY=fireball,...)
Pillow importable in Blender squeezes each PNG to a 256-colour palette.
"""
import bpy, os, math, mathutils
from mathutils import Vector, Matrix

FX, DST = os.environ["FX"], os.environ["DST"]
ONLY = [s for s in os.environ.get("ONLY", "").split(",") if s]
ELEM = {"fire": "ff6a2a", "ice": "6fd0ff", "wind": "6fe08a", "thunder": "ffd23c"}
SKILLS = {   # id: (element, kind, payload)
    "fire_core": ("fire", "badge", "heart"), "fire_guard": ("fire", "badge", "shield"), "fire_flow": ("fire", "badge", "drop"),
    "flame_slash": ("fire", "fx", "fx_slash_arc"), "fireball": ("fire", "fx", "fx_fireball"), "meteor": ("fire", "fx", "fx_meteor"),
    "ice_core": ("ice", "badge", "heart"), "ice_guard": ("ice", "badge", "shield"), "ice_flow": ("ice", "badge", "drop"),
    "frost_strike": ("ice", "fx", "fx_hit_spark"), "ice_spear": ("ice", "fx", "fx_ice_spear"), "blizzard": ("ice", "fx", "fx_blizzard_ring"),
    "wind_core": ("wind", "badge", "heart"), "wind_guard": ("wind", "badge", "shield"), "wind_flow": ("wind", "badge", "drop"),
    "whirlwind": ("wind", "fx", "fx_whirlwind_ring"), "wind_blade": ("wind", "fx", "fx_wind_blade"), "tornado": ("wind", "fx", "fx_tornado"),
    "thunder_core": ("thunder", "badge", "heart"), "thunder_guard": ("thunder", "badge", "shield"), "thunder_flow": ("thunder", "badge", "drop"),
    "thunder_fist": ("thunder", "badge", "fist"), "lightning": ("thunder", "fx", "fx_thunder_strike"), "thunderstorm": ("thunder", "fx", "storm"),
}
VIEW_ROT = {   # how each effect is turned to face the camera (looking along +Y): Euler XYZ
    "fx_slash_arc": (math.pi / 2, 0, .5), "fx_fireball": (0, 0, math.pi / 2), "fx_meteor": (0, .6, 0), "fx_hit_spark": (0, 0, 0),
    "fx_ice_spear": (0, 0, math.pi / 2 + .7), "fx_blizzard_ring": (1.1, 0, 0), "fx_whirlwind_ring": (1.2, 0, 0), "fx_wind_blade": (1.4, 0, 0),
    "fx_tornado": (0, 0, 0), "fx_thunder_strike": (0, 0, 0)}


def lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4) for x in c] + [1]


def mat(name, hexc, emit=0.0, metal=0.0, rough=.4):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = lin(hexc)
    b.inputs['Metallic'].default_value = metal
    b.inputs['Roughness'].default_value = rough
    if emit:
        b.inputs['Emission Color'].default_value = lin(hexc)
        b.inputs['Emission Strength'].default_value = emit
    return m


def add(o, m):
    o.data.materials.append(m)
    for p in o.data.polygons:
        p.use_smooth = True
    return o


def shade(h, f):
    c = [int(h[i:i + 2], 16) for i in (0, 2, 4)]
    return "".join("%02x" % max(0, min(255, int(x * f if f < 1 else x + (255 - x) * (f - 1)))) for x in c)


def disc(el, kind):
    col = ELEM[el]
    bpy.ops.mesh.primitive_cylinder_add(radius=1, depth=.12, vertices=48, location=(0, .2, 0), rotation=(math.pi / 2, 0, 0))
    add(bpy.context.object, mat("disc", shade(col, .45 if kind == "badge" else .6)))
    bpy.ops.mesh.primitive_torus_add(major_radius=1, minor_radius=.08, major_segments=48, minor_segments=8, location=(0, .12, 0),
                                     rotation=(math.pi / 2, 0, 0))
    add(bpy.context.object, mat("rim", "e2b04a" if kind == "badge" else shade(col, 1.35), metal=.8 if kind == "badge" else 0, rough=.3))


def heart(m):
    for s in (-1, 1):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=.3, location=(s * .22, 0, .18))
        add(bpy.context.object, m)
    bpy.ops.mesh.primitive_cone_add(radius1=.5, radius2=0, depth=.62, vertices=24, location=(0, 0, -.2), rotation=(math.pi, 0, 0))
    o = add(bpy.context.object, m)
    o.scale = (1, .55, 1)


def shield(m, m2):
    bpy.ops.mesh.primitive_cylinder_add(radius=.5, depth=.12, vertices=32, location=(0, 0, .05), rotation=(math.pi / 2, 0, 0))
    o = add(bpy.context.object, m)
    for v in o.data.vertices:
        if v.co.y < 0:      # local y of the rotated disc = world -z: pull the bottom to a point
            v.co.x *= 1 + v.co.y * 1.3
            v.co.y *= 1.45
    bpy.ops.mesh.primitive_torus_add(major_radius=.42, minor_radius=.04, location=(0, -.07, .08), rotation=(math.pi / 2, 0, 0))
    add(bpy.context.object, m2)


def drop(m):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=.38, location=(0, 0, -.12))
    o = add(bpy.context.object, m)
    for v in o.data.vertices:
        if v.co.z > 0:
            t = v.co.z / .38
            v.co.x *= 1 - t * .9
            v.co.y *= 1 - t * .9
            v.co.z *= 1.9


def fist(m, m2):
    bpy.ops.mesh.primitive_cube_add(size=.6, location=(0, 0, -.05))
    o = add(bpy.context.object, m)
    o.scale = (1, .7, .9)
    for k in range(4):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=.1, location=(-.22 + k * .15, -.18, .24))
        add(bpy.context.object, m)
    pts = [(.35, -.3, .6), (.15, -.3, .3), (.3, -.3, .28), (.05, -.3, -.1)]
    for a, b in zip(pts, pts[1:]):
        a, b = Vector(a), Vector(b)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(a + b) / 2)
        o = bpy.context.object
        o.scale = (.09, .03, (b - a).length)
        o.rotation_mode = 'QUATERNION'
        o.rotation_quaternion = (b - a).to_track_quat('Z', 'Y')
        add(o, m2)


def place_fx(name):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(FX, name + "_v01.glb"))
    new = [o for o in set(bpy.data.objects) - before]
    roots = [o for o in new if o.parent is None]
    for o in new:
        if o.animation_data:
            o.animation_data.action = None
            for tr in list(o.animation_data.nla_tracks):
                o.animation_data.nla_tracks.remove(tr)
    bpy.context.view_layer.update()
    R = Matrix.Rotation(VIEW_ROT.get(name, (0, 0, 0))[0], 4, 'X') @ Matrix.Rotation(VIEW_ROT.get(name, (0, 0, 0))[1], 4, 'Y') @ \
        Matrix.Rotation(VIEW_ROT.get(name, (0, 0, 0))[2], 4, 'Z')
    for o in roots:
        o.matrix_world = R @ o.matrix_world
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in new if o.type == 'MESH' for c in o.bound_box]
    mn = Vector([min(p[i] for p in pts) for i in range(3)])
    mx = Vector([max(p[i] for p in pts) for i in range(3)])
    size = max(mx.x - mn.x, mx.z - mn.z)
    k = 1.45 / size
    c = (mn + mx) / 2
    T = Matrix.Translation((0, -.3, 0)) @ Matrix.Scale(k, 4) @ Matrix.Translation(-c)
    for o in roots:
        o.matrix_world = T @ o.matrix_world


def storm(el):
    m, m2 = mat("cloud", "6a6f80", rough=.8), mat("bolt", ELEM[el], emit=4.0)
    for k, (x, z, r) in enumerate(((-.3, .3, .3), (.05, .38, .36), (.38, .28, .28), (0, .18, .3))):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=(x, -.1, z))
        add(bpy.context.object, m)
    for x0 in (-.25, .25):
        pts = [(x0, -.25, .05), (x0 + .1, -.25, -.25), (x0 - .05, -.25, -.28), (x0 + .08, -.25, -.6)]
        for a, b in zip(pts, pts[1:]):
            a, b = Vector(a), Vector(b)
            bpy.ops.mesh.primitive_cube_add(size=1, location=(a + b) / 2)
            o = bpy.context.object
            o.scale = (.08, .03, (b - a).length)
            o.rotation_mode = 'QUATERNION'
            o.rotation_quaternion = (b - a).to_track_quat('Z', 'Y')
            add(o, m2)


def tint_fx(el):
    for m in bpy.data.materials:
        if m.name.startswith(("tint_main", "fx_glow", "fx_soft")) and m.use_nodes:
            b = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
            if b:
                b.inputs['Base Color'].default_value = lin(ELEM[el])
                b.inputs['Emission Color'].default_value = lin(ELEM[el])
                b.inputs['Emission Strength'].default_value = 2.0


def render(path):
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
    for loc, en in [((-3, -5, 4), 700), ((4, -3, 1), 200)]:
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
    cam.data.ortho_scale = 2.3
    cam.location = (0, -6, 0)
    cam.rotation_euler = (math.pi / 2, 0, 0)
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    try:
        from PIL import Image
        im = Image.open(path).convert('RGBA')
        im.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(path, optimize=True)
    except ImportError:
        pass


for sid, (el, kind, what) in SKILLS.items():
    if ONLY and sid not in ONLY:
        continue
    bpy.ops.wm.read_factory_settings(use_empty=True)
    disc(el, kind)
    em, em2 = mat("emblem", ELEM[el], emit=1.5, rough=.3), mat("emblem_light", shade(ELEM[el], 1.5), emit=2.5, rough=.3)
    if what == "heart":
        heart(em)
    elif what == "shield":
        shield(em, em2)
    elif what == "drop":
        drop(em)
    elif what == "fist":
        fist(mat("fist", "f0c09a", rough=.6), em2)
    elif what == "storm":
        storm(el)
    else:
        place_fx(what)
        tint_fx(el) if what in ("fx_slash_arc", "fx_hit_spark", "fx_whirlwind_ring") else None
    p = os.path.abspath(os.path.join(DST, "skill_%s.png" % sid))
    render(p)
    print("ICON", sid, os.path.getsize(p))
