"""Close-up EEVEE renders of the pets: rest pose from 3 sides, then one frame of every clip.
Run: PETS=<folder with pet_*.glb> OUT=<folder> blender -b -P tools/pets/preview_pets.py -> <OUT>/pp_<pet>_<shot>.png"""
import bpy, os, math, mathutils

PETS, OUT = os.environ["PETS"], os.environ["OUT"]
CLIPS = ["idle", "walk", "sit", "jump", "spin", "roll", "dance", "wave"]


def shot(name, clip, frame, d, path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(PETS, name + ".glb"))
    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    ad = arm.animation_data_create()
    for tr in list(ad.nla_tracks):
        ad.nla_tracks.remove(tr)
    ad.action = None
    for pb in arm.pose.bones:
        pb.location, pb.rotation_quaternion, pb.scale = (0, 0, 0), (1, 0, 0, 0), (1, 1, 1)
    sc = bpy.context.scene
    if clip:
        act = bpy.data.actions[clip]
        ad.action = act
        try:
            ad.action_slot = act.slots[0]
        except Exception:
            pass
        sc.frame_set(frame)
    for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        try:
            sc.render.engine = eng
            break
        except TypeError:
            pass
    sc.render.resolution_x = sc.render.resolution_y = 300
    sc.world = bpy.data.worlds.new("w")
    sc.world.use_nodes = True
    bg = next(n for n in sc.world.node_tree.nodes if n.type == 'BACKGROUND')
    bg.inputs['Color'].default_value = (.78, .86, .93, 1)
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", 'SUN'))
    sun.data.energy = 3.2
    sun.rotation_euler = (math.radians(50), 0, math.radians(-35))
    bpy.context.collection.objects.link(sun)
    bpy.ops.mesh.primitive_plane_add(size=10)
    cam = bpy.data.objects.new("c", bpy.data.cameras.new("c"))
    bpy.context.collection.objects.link(cam)
    sc.camera = cam
    cam.data.lens = 50
    t = mathutils.Vector((0, 0, .26))
    cam.location = t + mathutils.Vector(d).normalized() * 1.9
    cam.rotation_euler = (t - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


for f in sorted(os.listdir(PETS)):
    if not (f.startswith("pet_") and f.endswith(".glb")):
        continue
    n = f[:-4]
    for v, d in {"front": (0, -1, .25), "q34": (.8, -.9, .45), "side": (1, 0, .2)}.items():
        shot(n, None, 0, d, os.path.join(OUT, f"pp_{n}_{v}.png"))
    for c in CLIPS:
        shot(n, c, 9, (.8, -.9, .45), os.path.join(OUT, f"pp_{n}_{c}.png"))
