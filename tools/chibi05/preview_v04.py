"""Preview renders for chr_ngoc_adventurer_v04 and the friends' v02 files (EEVEE, tints applied like the game).
Run: GLB=<file.glb> OUT=<folder> MODE=body|hair [TINT=hair:8c4a22,top:f4e9d2,bottom:cfb487]
     blender -b -P tools/chibi05/preview_v04.py
MODE=body: 4 full-body angles (front, 3/4, side, back) -> <OUT>/<name>_<view>.png
MODE=hair: every Hair_* object alone, head close-up from the front 3/4 and the back 3/4 -> <OUT>/hair_<style>_<view>.png
The *_tint materials are multiplied by a colour (the game does the same) and every material by the baked AO.
"""
import bpy, os, math, mathutils

GLB, OUT, MODE = os.environ["GLB"], os.environ["OUT"], os.environ.get("MODE", "body")
NAME = os.path.splitext(os.path.basename(GLB))[0]
TINT = dict(kv.split(":") for kv in os.environ.get("TINT", "hair:8c4a22,top:f4e9d2,bottom:cfb487").split(","))
HAIR_TINT = {"Hair_short": "8c4a22", "Hair_long": "2b1d16", "Hair_curly": "6b3a1e", "Hair_wavy": "e2b860",
             "Hair_ponytail": "c2452c", "Hair_braids": "e58aa6"}


def lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4) for x in c] + [1]


def setup(hair_hex=None):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=GLB)
    for a in bpy.data.objects:      # the importer leaves some clip active: show the rest pose
        if a.type == 'ARMATURE':
            if a.animation_data:
                a.animation_data.action = None
            for pb in a.pose.bones:
                pb.location, pb.rotation_quaternion, pb.scale = (0, 0, 0), (1, 0, 0, 0), (1, 1, 1)
    for m in bpy.data.materials:
        if not m.use_nodes:
            continue
        nt = m.node_tree
        bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if not bsdf or not bsdf.inputs['Base Color'].links:
            continue
        src = bsdf.inputs['Base Color'].links[0].from_socket
        out = src
        for key in TINT:
            if m.name.endswith(f"{key}_tint"):
                mix = nt.nodes.new('ShaderNodeMix')
                mix.data_type, mix.blend_type = 'RGBA', 'MULTIPLY'
                mix.inputs['Factor'].default_value = 1
                nt.links.new(out, mix.inputs[6])
                mix.inputs[7].default_value = lin(hair_hex if (key == "hair" and hair_hex) else TINT[key])
                out = mix.outputs[2]
        ca = nt.nodes.new('ShaderNodeVertexColor')
        mix = nt.nodes.new('ShaderNodeMix')
        mix.data_type, mix.blend_type = 'RGBA', 'MULTIPLY'
        mix.inputs['Factor'].default_value = 1
        nt.links.new(out, mix.inputs[6])
        nt.links.new(ca.outputs['Color'], mix.inputs[7])
        nt.links.new(mix.outputs[2], bsdf.inputs['Base Color'])
    sc = bpy.context.scene
    for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        try:
            sc.render.engine = eng
            break
        except TypeError:
            pass
    sc.render.resolution_x, sc.render.resolution_y = 520, 620
    sc.world = bpy.data.worlds.new("w")
    sc.world.use_nodes = True
    bg = next(n for n in sc.world.node_tree.nodes if n.type == 'BACKGROUND')
    bg.inputs['Color'].default_value = (0.78, 0.86, 0.93, 1)
    bg.inputs['Strength'].default_value = 0.9
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", 'SUN'))
    sun.data.energy = 3.2
    sun.data.angle = 0.3
    sun.rotation_euler = (math.radians(50), 0, math.radians(-35))
    bpy.context.collection.objects.link(sun)
    cam = bpy.data.objects.new("c", bpy.data.cameras.new("c"))
    bpy.context.collection.objects.link(cam)
    sc.camera = cam
    bpy.ops.mesh.primitive_plane_add(size=20)
    g = bpy.data.materials.new("ground")
    g.use_nodes = True
    next(n for n in g.node_tree.nodes if n.type == 'BSDF_PRINCIPLED').inputs['Base Color'].default_value = (.5, .62, .42, 1)
    bpy.context.object.data.materials.append(g)
    return sc, cam


def shoot(sc, cam, target, d, dist, lens, path):
    cam.data.lens = lens
    t = mathutils.Vector(target)
    cam.location = t + mathutils.Vector(d).normalized() * dist
    cam.rotation_euler = (t - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


def only_hair(style):
    for o in bpy.data.objects:
        if o.name.startswith("Hair_"):
            o.hide_render = o.name != style


if MODE == "body":
    sc, cam = setup()
    only_hair("Hair_short")
    for v, d in {"front": (0, -1, .12), "q34": (.75, -.8, .3), "side": (1, 0, .1), "back": (0, 1, .15)}.items():
        shoot(sc, cam, (0, 0, .78), d, 3.6, 50, os.path.join(OUT, f"{NAME}_{v}.png"))
else:
    styles = sorted({o.name for o in bpy.data.objects if o.name.startswith("Hair_")}) if False else list(HAIR_TINT)
    for st in styles:
        sc, cam = setup(HAIR_TINT[st])
        only_hair(st)
        for v, d in {"f": (.55, -1, .25), "b": (-.6, 1, .3)}.items():
            shoot(sc, cam, (0, 0, 1.0), d, 2.2, 50, os.path.join(OUT, f"hair_{st}_{v}.png"))
