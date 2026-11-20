"""Skinned clothing check: bind a piece to Ngọc v04's own armature and render it in 4 clip poses.
Run: GLB=<piece.glb> OUT=<folder> [BASE=<character.glb>] [POSES=Run:6,Jump:8,Interact:12,Celebrate:12] blender -b -P tools/gear/preview_pose.py
Writes <OUT>/pose_<piece>_<clip>.png. The piece's meshes are re-pointed at the character's armature (bones matched by name).
"""
import bpy, os, math, mathutils

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
GLB, OUT = os.environ["GLB"], os.environ["OUT"]
BASE = os.environ.get("BASE", os.path.join(REPO, "assets/models/chr_ngoc_adventurer_v04.glb"))
POSES = [p.split(":") for p in os.environ.get("POSES", "Run:6,Jump:8,Interact:12,Celebrate:12").split(",")]
name = os.path.splitext(os.path.basename(GLB))[0]
for clip, frame in POSES:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=BASE)
    rig = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    for o in bpy.data.objects:
        if o.name.startswith("Hair_") and o.name != "Hair_short":
            o.hide_render = True
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=GLB)
    for o in set(bpy.data.objects) - before:
        if o.type == 'MESH':
            for md in o.modifiers:
                if md.type == 'ARMATURE':
                    md.object = rig
            mw = o.matrix_world.copy()
            o.parent = rig
            o.matrix_world = mw
        elif o.type == 'ARMATURE':
            o.hide_render = True
    act = next((a for a in bpy.data.actions if a.name.startswith(clip)), None)
    ad = rig.animation_data_create()
    for tr in list(ad.nla_tracks):
        ad.nla_tracks.remove(tr)
    if act:
        ad.action = act
        try:
            ad.action_slot = act.slots[0]
        except Exception:
            pass
    sc = bpy.context.scene
    sc.frame_set(int(frame))
    for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        try:
            sc.render.engine = eng
            break
        except TypeError:
            pass
    sc.render.resolution_x = sc.render.resolution_y = 320
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
    t = mathutils.Vector((0, 0, .75))
    cam.location = t + mathutils.Vector((.85, -1, .3)).normalized() * 3.3
    cam.rotation_euler = (t - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(OUT, "pose_%s_%s.png" % (name, clip))
    bpy.ops.render.render(write_still=True)
