"""Preview for batch 23: every model from the 3/4 view, Lord Hush in 3 poses, the 10 compass pieces put back together.
Run: DIR=<folder with the .glb files> OUT=<folder> blender -b -P tools/story/preview_story.py -> <OUT>/s_*.png
"""
import bpy, os, math, mathutils
from mathutils import Vector

DIR, OUT = os.environ["DIR"], os.environ["OUT"]


def scene(size, target, d=(.8, -1, .45)):
    sc = bpy.context.scene
    for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        try:
            sc.render.engine = eng
            break
        except TypeError:
            pass
    sc.render.resolution_x = sc.render.resolution_y = 300
    sc.world = bpy.data.worlds.new("w")
    sc.world.use_nodes = True
    next(n for n in sc.world.node_tree.nodes if n.type == 'BACKGROUND').inputs['Color'].default_value = (.78, .86, .93, 1)
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", 'SUN'))
    sun.data.energy = 3.0
    sun.rotation_euler = (math.radians(50), 0, math.radians(-35))
    sc.collection.objects.link(sun)
    bpy.ops.mesh.primitive_plane_add(size=40)
    cam = bpy.data.objects.new("c", bpy.data.cameras.new("c"))
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.data.lens = 50
    t = Vector(target)
    cam.location = t + Vector(d).normalized() * size * 2.0
    cam.rotation_euler = (t - cam.location).to_track_quat('-Z', 'Y').to_euler()
    return sc


def pose(clip, frame):
    for o in bpy.data.objects:
        ad = o.animation_data
        if not ad:
            continue
        for tr in list(ad.nla_tracks):
            ad.nla_tracks.remove(tr)
        act = next((a for a in bpy.data.actions if a.name.startswith(clip) or a.name.endswith("_" + clip)), None)
        if o.type == 'ARMATURE':
            act = bpy.data.actions.get(clip)
        if act:
            ad.action = act
            try:
                ad.action_slot = act.slots[0]
            except Exception:
                pass
    bpy.context.scene.frame_set(frame)


def shot(name, clip=None, frame=1, d=(.8, -1, .45)):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(DIR, name + ".glb"))
    if clip:
        pose(clip, frame)
    dg = bpy.context.evaluated_depsgraph_get()
    pts = [o.evaluated_get(dg).matrix_world @ Vector(c) for o in bpy.data.objects if o.type == 'MESH' for c in o.bound_box]
    mn = Vector([min(p[i] for p in pts) for i in range(3)])
    mx = Vector([max(p[i] for p in pts) for i in range(3)])
    sc = scene(max((mx - mn).length, .5), (mn + mx) / 2, d)
    sc.render.filepath = os.path.join(OUT, "s_%s%s.png" % (name, "_" + clip if clip else ""))
    bpy.ops.render.render(write_still=True)


for n in ("npc_hush_lord_v01", "mob_hush_wraith_v01", "prop_compass_whole_v01", "prop_compass_pedestal_v01", "prop_magic_door_v01",
          "npc_mia_tailor_v01"):
    if os.path.exists(os.path.join(DIR, n + ".glb")):
        shot(n)
for clip, f in (("Talk", 6), ("Cast", 12), ("Laugh", 8)):
    shot("npc_hush_lord_v01", clip, f)
shot("prop_magic_door_v01", "Open", 15)
# the ten pieces back together, seen from above
bpy.ops.wm.read_factory_settings(use_empty=True)
for k in range(10):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(DIR, "prop_compass_piece_%02d_v01.glb" % (k + 1)))
    for o in set(bpy.data.objects) - before:
        if o.type == 'MESH' and "fit_offset" in o:
            o.animation_data_clear()             # the Float clip would pin every piece to its own spot
            x, y, z = o["fit_offset"]
            o.location = (x, -z, y)          # glTF (x, y, z) -> Blender (x, -z, y)
sc = scene(1.0, (0, 0, 0), (0, -.15, 1))
sc.render.filepath = os.path.join(OUT, "s_pieces_together.png")
bpy.ops.render.render(write_still=True)
