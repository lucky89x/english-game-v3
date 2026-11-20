"""Oasis village mock-up for Map 3: places the map3_ models (and the desert NPCs, camel, fennec) on a sand plane and renders
a 16:9 picture for layout reference plus the 256x160 region card assets/ui/map_3.png.
Run: DIR=<folder with the .glb files> OUT=<folder> CARD=assets/ui/map_3.png blender -b -P tools/map3/preview_map3.py
Grey *_tint / roof_tint materials get sample colours here; the game picks its own.
"""
import bpy, os, math, mathutils
from mathutils import Vector

DIR, OUT, CARD = os.environ["DIR"], os.environ["OUT"], os.environ.get("CARD")
TINTS = {"roof_tint": "c86a3a", "tint_main": "c9463a", "tint_trim": "f2c84b", "tint_accent": "3fa0c8", "_hair_tint": "4a3428",
         "_top_tint": "e8dcc0", "_bottom_tint": "6a4a8a"}
LAYOUT = [   # file, x, y, rotation (deg)
    ("map3_oasis_pool_v01", 0, 2, 0), ("map3_inn_oasis_v01", -12, 10, 20), ("map3_house_sand_a_v01", 10, 11, -25),
    ("map3_house_sand_b_v01", 15, 2, -70), ("map3_house_tower_v01", -16, -2, 60), ("map3_tent_bazaar_v01", -5, -6, 10),
    ("map3_tent_bazaar_v01", 2, -8, -10), ("map3_house_home_v01", 18, -9, -60), ("map3_temple_gate_v01", 0, 24, 0),
    ("map3_palm_date_a_v01", -4, 6, 0), ("map3_palm_date_b_v01", 5, 6, 40), ("map3_palm_date_a_v01", 6, -1, 90),
    ("map3_palm_date_b_v01", -6, 0, 200), ("map3_well_v01", -9, 3, 0), ("map3_lantern_pole_v01", -2, -3, 0),
    ("map3_lantern_pole_v01", 6, -4, 0), ("map3_carpet_v01", -4.5, -8, 0), ("map3_crate_sack_v01", 4.5, -9, 30),
    ("map3_camel_v01", 9, -3, -120), ("map3_obelisk_v01", -10, 16, 15), ("map3_ruin_pillar_v01", 7, 19, 0),
    ("map3_ruin_arch_v01", -6, 21, 10), ("map3_cactus_a_v01", 13, 16, 0), ("map3_cactus_b_v01", -18, 12, 0),
    ("map3_cactus_flower_v01", 11, 6, 0), ("map3_dune_rock_c_v01", 22, 18, 0), ("map3_dune_rock_b_v01", -22, 6, 0),
    ("map3_dune_rock_a_v01", 16, -16, 0), ("map3_skeleton_v01", -14, -12, 40), ("map3_sandstorm_post_v01", 12, -14, 0),
    ("map3_signpost_v01", 0, -12, 0), ("map3_sand_skiff_v01", -10, -14, 70), ("map3_chest_v01", 3, 15, 180),
    ("npc_desert_elder_v01", -1.5, -10, 10), ("npc_desert_merchant_v01", -4, -4.5, 0), ("npc_desert_guide_v01", 2, -12, -20),
    ("npc_desert_smith_v01", 16, -6, -60), ("pet_fennec_v01", 1, -10.5, 30), ("map3_dry_bush_v01", -8, -10, 0), ("map3_dry_bush_v01", 9, 1, 0),
]
LINEUP = os.environ.get("LINEUP")      # LINEUP=1: close shot of the desert NPCs, fennec and camel side by side
if LINEUP:
    LAYOUT = [("npc_desert_elder_v01", -2.4, 0, 0), ("npc_desert_merchant_v01", -.8, 0, 0), ("npc_desert_guide_v01", .8, 0, 0),
              ("npc_desert_smith_v01", 2.4, 0, 0), ("pet_fennec_v01", 3.6, -.3, -20), ("map3_camel_v01", 6, 1, -60)]


def lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4) for x in c] + [1]


bpy.ops.wm.read_factory_settings(use_empty=True)
for fname, x, y, r in LAYOUT:
    p = os.path.join(DIR, fname + ".glb")
    if not os.path.exists(p):
        continue
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=p)
    new = set(bpy.data.objects) - before
    for o in new:
        if o.animation_data:
            for tr in list(o.animation_data.nla_tracks):
                o.animation_data.nla_tracks.remove(tr)
            o.animation_data.action = None
        if o.type == 'ARMATURE':
            for pb in o.pose.bones:
                pb.location, pb.rotation_quaternion, pb.scale = (0, 0, 0), (1, 0, 0, 0), (1, 1, 1)
    for o in new:
        if o.parent is None:
            o.matrix_world = mathutils.Matrix.Translation((x, y, 0)) @ mathutils.Matrix.Rotation(math.radians(r), 4, 'Z') @ o.matrix_world
for m in bpy.data.materials:
    if not m.use_nodes:
        continue
    b = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if not b:
        continue
    for k, h in TINTS.items():
        if m.name.startswith(k) or m.name.endswith(k):
            if b.inputs['Base Color'].links:
                mix = m.node_tree.nodes.new('ShaderNodeMix')
                mix.data_type, mix.blend_type = 'RGBA', 'MULTIPLY'
                mix.inputs['Factor'].default_value = 1
                m.node_tree.links.new(b.inputs['Base Color'].links[0].from_socket, mix.inputs[6])
                mix.inputs[7].default_value = lin(h)
                m.node_tree.links.new(mix.outputs[2], b.inputs['Base Color'])
            else:
                b.inputs['Base Color'].default_value = lin(h)
sc = bpy.context.scene
for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
    try:
        sc.render.engine = eng
        break
    except TypeError:
        pass
sc.world = bpy.data.worlds.new("w")
sc.world.use_nodes = True
bg = next(n for n in sc.world.node_tree.nodes if n.type == 'BACKGROUND')
bg.inputs['Color'].default_value = (.95, .78, .55, 1)
bg.inputs['Strength'].default_value = 1.0
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", 'SUN'))
sun.data.energy = 4.0
sun.data.color = (1.0, .93, .82)
sun.rotation_euler = (math.radians(45), 0, math.radians(-40))
sc.collection.objects.link(sun)
bpy.ops.mesh.primitive_plane_add(size=200)
g = bpy.data.materials.new("sand")
g.use_nodes = True
next(n for n in g.node_tree.nodes if n.type == 'BSDF_PRINCIPLED').inputs['Base Color'].default_value = lin("e8c890")
bpy.context.object.data.materials.append(g)
cam = bpy.data.objects.new("c", bpy.data.cameras.new("c"))
sc.collection.objects.link(cam)
sc.camera = cam
cam.data.lens = 32


def shot(path, res, loc, target):
    sc.render.resolution_x, sc.render.resolution_y = res
    cam.location = loc
    cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


if LINEUP:
    shot(os.path.join(OUT, "map3_npc_lineup.png"), (1600, 700), (1.8, -9, 1.6), (1.8, 0, .8))
else:
    shot(os.path.join(OUT, "map3_oasis_scene.png"), (1600, 900), (10, -38, 16), (0, 4, 1))
if CARD and not LINEUP:
    shot(os.path.abspath(CARD), (256, 160), (14, -30, 22), (0, 4, 0))
