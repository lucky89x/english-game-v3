"""Group picture of Ngọc and friends for the profile screen (assets/ui/menu_heroes.png), rendered from the game models
the way the game shows them: pieces with glTF extras eq_hidden are hidden, *_tint materials get their eq_base colour.
Run: blender -b -P tools/chibi05/menu_heroes.py   (from the repository root; OUT=<png> to write elsewhere, POSE=0 for rest pose)
"""
import bpy, os, math, mathutils
from mathutils import Vector

ROOT = os.getcwd()
OUT = os.environ.get("OUT", os.path.join(ROOT, "assets/ui/menu_heroes.png"))
CAST = [   # file, x, y, turn (deg), clip, frame — Ngọc in front, friends and Tom behind (Ngọc first: friends borrow her clips)
    ("chr_ngoc_adventurer_v05", 0.55, -.25, -8, "Celebrate", 14),
    ("npc_tom_elder_v03", 0.0, 1.0, 0, "Idle", 1),
    ("npc_lily_druid_v02", -1.55, .55, 22, "Idle", 10),
    ("npc_anna_bard_v02", 1.55, .55, -22, "Idle", 20),
    ("npc_rose_baker_v02", -.85, .9, 12, "Idle", 30),
]
SHARED, SHARED_ACTS = "chr_ngoc_adventurer_v05", {}      # Lily, Rose and Anna have no clips of their own: they play Ngọc's


def srgb_to_lin(c):
    return c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4


bpy.ops.wm.read_factory_settings(use_empty=True)
for fname, x, y, rot, clip, frame in CAST:
    before, acts0 = set(bpy.data.objects), set(bpy.data.actions)
    bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, "assets/models", fname + ".glb"))
    new = set(bpy.data.objects) - before
    for o in new:
        if o.get("eq_hidden"):
            o.hide_render = True
        if o.type == 'ARMATURE':
            ad = o.animation_data_create()
            for tr in list(ad.nla_tracks):
                ad.nla_tracks.remove(tr)
            own = {a.name.split(".")[0]: a for a in set(bpy.data.actions) - acts0}
            if fname == SHARED:
                SHARED_ACTS = own
            act = own.get(clip) or SHARED_ACTS.get(clip)
            if act and os.environ.get("POSE", "1") == "1":
                ad.action = act
                try:
                    ad.action_slot = act.slots[0]
                except Exception:
                    pass
    for o in new:
        if o.parent is None:
            o.matrix_world = mathutils.Matrix.Translation((x, y, 0)) @ mathutils.Matrix.Rotation(math.radians(rot), 4, 'Z') @ o.matrix_world
sc = bpy.context.scene
sc.frame_set(14)
for m in bpy.data.materials:      # *_tint: multiply the grey palette by eq_base / 0.8 grey, as the game does
    base = m.get("eq_base")
    if base and m.use_nodes:
        b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        col = [srgb_to_lin(int(base[i:i + 2], 16) / 255) / srgb_to_lin(.8) for i in (1, 3, 5)] + [1]
        if b.inputs['Base Color'].links:
            mix = m.node_tree.nodes.new('ShaderNodeMix')
            mix.data_type, mix.blend_type = 'RGBA', 'MULTIPLY'
            mix.inputs['Factor'].default_value = 1
            m.node_tree.links.new(b.inputs['Base Color'].links[0].from_socket, mix.inputs[6])
            mix.inputs[7].default_value = col
            m.node_tree.links.new(mix.outputs[2], b.inputs['Base Color'])
for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
    try:
        sc.render.engine = eng
        break
    except TypeError:
        pass
sc.view_settings.view_transform = 'Standard'
sc.render.film_transparent = True
sc.render.resolution_x, sc.render.resolution_y = 960, 420
sc.world = bpy.data.worlds.new("w")
sc.world.use_nodes = True
bg = next(n for n in sc.world.node_tree.nodes if n.type == 'BACKGROUND')
bg.inputs['Color'].default_value = (.95, .9, .82, 1)
bg.inputs['Strength'].default_value = .9
for rot, energy, col in (((50, 0, -30), 2.6, (1, .94, .85)), ((60, 0, 150), 1.2, (.85, .9, 1))):
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", 'SUN'))
    sun.data.energy, sun.data.color = energy, col
    sun.rotation_euler = [math.radians(a) for a in rot]
    sc.collection.objects.link(sun)
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
sc.collection.objects.link(cam)
sc.camera = cam
cam.data.lens = 50
t = Vector((0, .3, .8))
cam.location = t + Vector((0, -1, .12)).normalized() * 7.0
cam.rotation_euler = (t - cam.location).to_track_quat('-Z', 'Y').to_euler()
sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print("wrote", OUT)
