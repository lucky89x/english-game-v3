"""Render each accessory worn on Ngọc v04 (EEVEE). Run: ACC=<folder with acc_*.glb> OUT=<folder> blender -b -P tools/acc/preview_acc.py
tint_main / tint_trim get sample colours here; the game picks its own."""
import bpy, os, math, mathutils

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
ACC, OUT = os.environ["ACC"], os.environ["OUT"]
SHOTS = {  # file: (target, view direction, distance, main colour, trim colour)
    "acc_hat_v01": ((0, 0, 1.15), (.7, -1, .45), 2.1, "e2b860", "c2452c"),
    "acc_bow_v01": ((-.15, 0, 1.2), (-1, -.7, .35), 1.5, "e58aa6", "ffffff"),
    "acc_headband_v01": ((0, 0, 1.2), (.6, -1, .6), 1.8, "3f6fc6", "f2c230"),
    "acc_glasses_v01": ((0, -.1, 1.07), (.55, -1, .15), 1.3, "2b2b33", "c2452c"),
    "acc_scarf_v01": ((0, -.05, .78), (.5, -1, .3), 1.6, "4a9a4a", "ffffff"),
    "acc_bag_v01": ((0, .1, .68), (-.7, 1, .35), 2.0, "e3862a", "6a4428"),
    "acc_bracelet_v01": ((.3, 0, .6), (1, -.7, .2), 1.0, "8c64c2", "ffffff"),
    "acc_shoes_v01": ((0, -.02, .12), (.6, -1, .45), 1.4, "d33a3a", "ffffff"),
}


def lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4) for x in c] + [1]


for name, (tgt, d, dist, cm, ct) in SHOTS.items():
    path = os.path.join(ACC, name + ".glb")
    if not os.path.exists(path):
        continue
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(REPO, "assets/models/chr_ngoc_adventurer_v04.glb"))
    for a in bpy.data.objects:
        if a.type == 'ARMATURE':
            if a.animation_data:
                a.animation_data.action = None
            for pb in a.pose.bones:
                pb.location, pb.rotation_quaternion, pb.scale = (0, 0, 0), (1, 0, 0, 0), (1, 1, 1)
        if a.name.startswith("Hair_") and a.name != "Hair_short":
            a.hide_render = True
    tints = {"_hair_tint": "8c4a22", "_top_tint": "f4e9d2", "_bottom_tint": "cfb487"}
    for m in bpy.data.materials:
        for k, h in tints.items():
            if m.name.endswith(k) and m.use_nodes:
                b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
                if b.inputs['Base Color'].links:
                    src = b.inputs['Base Color'].links[0].from_socket
                    mix = m.node_tree.nodes.new('ShaderNodeMix')
                    mix.data_type, mix.blend_type = 'RGBA', 'MULTIPLY'
                    mix.inputs['Factor'].default_value = 1
                    m.node_tree.links.new(src, mix.inputs[6])
                    mix.inputs[7].default_value = lin(h)
                    m.node_tree.links.new(mix.outputs[2], b.inputs['Base Color'])
    before = set(bpy.data.materials)
    bpy.ops.import_scene.gltf(filepath=path)
    for m in set(bpy.data.materials) - before:
        if m.name.startswith("tint_") and m.use_nodes:
            b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
            b.inputs['Base Color'].default_value = lin(cm if m.name.startswith("tint_main") else ct)
    sc = bpy.context.scene
    for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        try:
            sc.render.engine = eng
            break
        except TypeError:
            pass
    sc.render.resolution_x = sc.render.resolution_y = 480
    sc.world = bpy.data.worlds.new("w")
    sc.world.use_nodes = True
    bg = next(n for n in sc.world.node_tree.nodes if n.type == 'BACKGROUND')
    bg.inputs['Color'].default_value = (.78, .86, .93, 1)
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", 'SUN'))
    sun.data.energy = 3.2
    sun.rotation_euler = (math.radians(50), 0, math.radians(-35))
    bpy.context.collection.objects.link(sun)
    bpy.ops.mesh.primitive_plane_add(size=20)
    cam = bpy.data.objects.new("c", bpy.data.cameras.new("c"))
    bpy.context.collection.objects.link(cam)
    sc.camera = cam
    cam.data.lens = 50
    t = mathutils.Vector(tgt)
    cam.location = t + mathutils.Vector(d).normalized() * dist
    cam.rotation_euler = (t - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(OUT, "wear_" + name + ".png")
    bpy.ops.render.render(write_still=True)
