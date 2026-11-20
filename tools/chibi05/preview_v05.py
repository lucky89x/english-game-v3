"""Outfit sheet for chr_ngoc_adventurer_v05 / chr_ban_nam_v01: each outfit shown alone with sample tint colours,
then the same outfits in 4 clip poses to check that nothing pokes through.
Run: GLB=<file.glb> OUT=<folder> [POSES=1] blender -b -P tools/chibi05/preview_v05.py -> <OUT>/o_<outfit>[_<clip>].png
"""
import bpy, os, math, mathutils

GLB, OUT = os.environ["GLB"], os.environ["OUT"]
BOY = "ban_nam" in GLB
POSES = os.environ.get("POSES") == "1"
OUTFITS = {   # name: (shown pieces, top colour, bottom colour, hair colour)
    "tshirt_shorts": (("Hair_short", "Top_tshirt", "Bottom_shorts", "Gear_goggles"), "f4e9d2", "cfb487", "8c4a22"),
    "hoodie_trousers": (("Hair_long", "Top_hoodie", "Bottom_trousers"), "e8657a", "3f5f8f", "2b1d16"),
    "jacket_skirt": (("Hair_wavy", "Top_jacket", "Bottom_skirt", "Gear_goggles"), "f2c84b", "5b7fc6", "e2b860"),
    "aodai_trousers": (("Hair_long", "Top_aodai", "Bottom_trousers"), "f6f2ea", "f6f2ea", "2b1d16"),
    "sundress": (("Hair_braids", "Dress_sundress"), "8fd3c7", "8fd3c7", "e58aa6"),
    "party": (("Hair_ponytail", "Dress_party"), "c9a0f2", "c9a0f2", "c2452c"),
}
if BOY:
    OUTFITS = {
        "tshirt_shorts": (("Hair_short", "Top_tshirt", "Bottom_shorts", "Gear_goggles"), "6fa8dc", "3a4f7a", "3a2a20"),
        "hoodie_trousers": (("Hair_spiky", "Top_hoodie", "Bottom_trousers"), "5cb85c", "3a3a44", "22180f"),
        "jacket_trousers": (("Hair_side", "Top_jacket", "Bottom_trousers", "Gear_goggles"), "c9463a", "3f5f8f", "8a5230"),
        "aodai_trousers": (("Hair_buzz", "Top_aodai", "Bottom_trousers"), "2c539a", "f6f2ea", "22180f"),
    }
CLIPS = [("Run", 3), ("Jump", 8), ("Interact", 12), ("Celebrate", 14)]


def lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4) for x in c] + [1]


def setup(shown, top, bottom, hair, clip=None):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=GLB)
    rig = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    ad = rig.animation_data_create()
    for tr in list(ad.nla_tracks):
        ad.nla_tracks.remove(tr)
    ad.action = None
    for pb in rig.pose.bones:
        pb.location, pb.rotation_quaternion, pb.scale = (0, 0, 0), (1, 0, 0, 0), (1, 1, 1)
    if clip:
        act = bpy.data.actions[clip[0]]
        ad.action = act
        try:
            ad.action_slot = act.slots[0]
        except Exception:
            pass
        bpy.context.scene.frame_set(clip[1])
    for o in bpy.data.objects:
        if o.type == 'MESH' and o.name.split(".")[0] not in ("Ngoc",) and o.name.startswith(("Hair_", "Top_", "Bottom_", "Dress_", "Gear_")):
            o.hide_render = o.name.split(".")[0] not in shown
    tints = {"_hair_tint": hair, "_top_tint": top, "_bottom_tint": bottom}
    for m in bpy.data.materials:
        for k, h in tints.items():
            if m.name.endswith(k) and m.use_nodes:
                b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
                if b.inputs['Base Color'].links:
                    mix = m.node_tree.nodes.new('ShaderNodeMix')
                    mix.data_type, mix.blend_type = 'RGBA', 'MULTIPLY'
                    mix.inputs['Factor'].default_value = 1
                    m.node_tree.links.new(b.inputs['Base Color'].links[0].from_socket, mix.inputs[6])
                    mix.inputs[7].default_value = lin(h)
                    m.node_tree.links.new(mix.outputs[2], b.inputs['Base Color'])
    sc = bpy.context.scene
    for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        try:
            sc.render.engine = eng
            break
        except TypeError:
            pass
    sc.render.resolution_x, sc.render.resolution_y = 300, 360
    sc.world = bpy.data.worlds.new("w")
    sc.world.use_nodes = True
    next(n for n in sc.world.node_tree.nodes if n.type == 'BACKGROUND').inputs['Color'].default_value = (.78, .86, .93, 1)
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", 'SUN'))
    sun.data.energy = 3.2
    sun.rotation_euler = (math.radians(50), 0, math.radians(-35))
    sc.collection.objects.link(sun)
    bpy.ops.mesh.primitive_plane_add(size=20)
    cam = bpy.data.objects.new("c", bpy.data.cameras.new("c"))
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.data.lens = 50
    t = mathutils.Vector((0, 0, .78))
    cam.location = t + mathutils.Vector((.7, -1, .25)).normalized() * 3.5
    cam.rotation_euler = (t - cam.location).to_track_quat('-Z', 'Y').to_euler()
    return sc


for name, (shown, top, bottom, hair) in OUTFITS.items():
    sc = setup(shown, top, bottom, hair)
    sc.render.filepath = os.path.join(OUT, "o_%s.png" % name)
    bpy.ops.render.render(write_still=True)
    if POSES:
        for clip in CLIPS:
            sc = setup(shown, top, bottom, hair, clip)
            sc.render.filepath = os.path.join(OUT, "o_%s_%s.png" % (name, clip[0]))
            bpy.ops.render.render(write_still=True)
