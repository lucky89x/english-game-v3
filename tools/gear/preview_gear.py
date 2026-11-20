"""Preview renders for gear (EEVEE): worn pieces on Ngọc v04 (front + 3/4), hand-held pieces standalone and in her right hand.
Run: DIR=<folder with .glb> OUT=<folder> NAMES=a,b blender -b -P tools/gear/preview_gear.py -> <OUT>/g_<name>_<view>.png
Optional TINT=main:hex,trim:hex colours tint_main / tint_trim / armor_main…; HELD=prefixes of hand-held files.
"""
import bpy, os, math, mathutils

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
DIR, OUT = os.environ["DIR"], os.environ["OUT"]
NAMES = [n for n in os.environ["NAMES"].split(",") if n]
HELD = tuple(os.environ.get("HELD", "gear_sword,weapon_").split(","))
TINT = dict(kv.split(":") for kv in os.environ.get("TINT", "main:c2452c,trim:e2b04a").split(","))
GRIP = mathutils.Vector((-.31, -.0, .555))


def lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4) for x in c] + [1]


def scene():
    sc = bpy.context.scene
    for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        try:
            sc.render.engine = eng
            break
        except TypeError:
            pass
    sc.render.resolution_x = sc.render.resolution_y = 360
    sc.world = bpy.data.worlds.new("w")
    sc.world.use_nodes = True
    next(n for n in sc.world.node_tree.nodes if n.type == 'BACKGROUND').inputs['Color'].default_value = (.78, .86, .93, 1)
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", 'SUN'))
    sun.data.energy = 3.2
    sun.rotation_euler = (math.radians(50), 0, math.radians(-35))
    bpy.context.collection.objects.link(sun)
    cam = bpy.data.objects.new("c", bpy.data.cameras.new("c"))
    bpy.context.collection.objects.link(cam)
    sc.camera = cam
    cam.data.lens = 50
    return sc, cam


def shoot(sc, cam, t, d, dist, path):
    t = mathutils.Vector(t)
    cam.location = t + mathutils.Vector(d).normalized() * dist
    cam.rotation_euler = (t - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


def tint_new(before):
    for m in set(bpy.data.materials) - before:
        if not m.use_nodes:
            continue
        b = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if b is None:
            continue
        if m.name.startswith("tint_main") or m.name.startswith("armor_main"):
            b.inputs['Base Color'].default_value = lin(TINT["main"])
        if m.name.startswith("tint_trim") or m.name.startswith("armor_trim"):
            b.inputs['Base Color'].default_value = lin(TINT["trim"])


def ngoc():
    bpy.ops.import_scene.gltf(filepath=os.path.join(REPO, "assets/models/chr_ngoc_adventurer_v04.glb"))
    for a in bpy.data.objects:
        if a.type == 'ARMATURE':
            if a.animation_data:
                a.animation_data.action = None
            for pb in a.pose.bones:
                pb.location, pb.rotation_quaternion, pb.scale = (0, 0, 0), (1, 0, 0, 0), (1, 1, 1)
        if a.name.startswith("Hair_") and a.name != "Hair_short":
            a.hide_render = True
    for m in bpy.data.materials:
        for k, h in {"_hair_tint": "8c4a22", "_top_tint": "f4e9d2", "_bottom_tint": "cfb487"}.items():
            if m.name.endswith(k) and m.use_nodes:
                b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
                if b.inputs['Base Color'].links:
                    mix = m.node_tree.nodes.new('ShaderNodeMix')
                    mix.data_type, mix.blend_type = 'RGBA', 'MULTIPLY'
                    mix.inputs['Factor'].default_value = 1
                    m.node_tree.links.new(b.inputs['Base Color'].links[0].from_socket, mix.inputs[6])
                    mix.inputs[7].default_value = lin(h)
                    m.node_tree.links.new(mix.outputs[2], b.inputs['Base Color'])


for n in NAMES:
    held = n.startswith(HELD)
    # standalone / worn
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if not held:
        ngoc()
    before = set(bpy.data.materials)
    bpy.ops.import_scene.gltf(filepath=os.path.join(DIR, n + ".glb"))
    tint_new(before)
    new = [o for o in bpy.data.objects if o.type == 'MESH' and not o.name.startswith(("Ngoc", "Hair_"))]
    sc, cam = scene()
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, -1.0 if held else 0))
    if held:
        for v, d in {"a": (0, -1, .1), "b": (1, -.6, .3)}.items():
            shoot(sc, cam, (0, 0, .35), d, 2.1, os.path.join(OUT, f"g_{n}_{v}.png"))
        # in her hand
        bpy.ops.wm.read_factory_settings(use_empty=True)
        ngoc()
        before = set(bpy.data.materials)
        bpy.ops.import_scene.gltf(filepath=os.path.join(DIR, n + ".glb"))
        tint_new(before)
        for o in bpy.data.objects:
            if o.type in ('MESH', 'EMPTY') and o.parent is None and not o.name.startswith(("Ngoc", "Hair_")) and o.type != 'ARMATURE':
                if any(c for c in [o] if c.type == 'MESH') or o.type == 'EMPTY':
                    o.matrix_world = mathutils.Matrix.Translation(GRIP) @ mathutils.Matrix.Rotation(.6, 4, 'X') @ o.matrix_world
        sc, cam = scene()
        bpy.ops.mesh.primitive_plane_add(size=20)
        shoot(sc, cam, (-.1, 0, .75), (.5, -1, .25), 3.4, os.path.join(OUT, f"g_{n}_hand.png"))
    else:
        top = max((o.matrix_world @ mathutils.Vector(c)).z for o in new for c in o.bound_box)
        bot = min((o.matrix_world @ mathutils.Vector(c)).z for o in new for c in o.bound_box)
        zc = max(.45, (top + bot) / 2)
        for v, d in {"a": (0, -1, .15), "b": (.8, -.75, .3)}.items():
            shoot(sc, cam, (0, 0, zc), d, 2.6 if top - bot > .2 else 1.6, os.path.join(OUT, f"g_{n}_{v}.png"))
