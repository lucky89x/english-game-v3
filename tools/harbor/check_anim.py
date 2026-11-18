"""Re-import a rigged .glb, list its clips, render clip frames from the 3/4 view.
Run: OUT=<folder> NAMES=a,b CLIP=Walk FRAMES=1,7,13,19 blender -b -P tools/harbor/check_anim.py
"""
import bpy, os, mathutils

OUT = os.environ["OUT"]
CLIP = os.environ.get("CLIP", "Walk")
FR = [int(x) for x in os.environ.get("FRAMES", "1,7,13,19").split(",")]
for n in os.environ["NAMES"].split(","):
    for f in FR:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath=os.path.join(OUT, n + ".glb"))
        arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
        print("CLIPS", n, [a.name for a in bpy.data.actions], "bones", len(arm.data.bones),
              "meshes", [o.name for o in bpy.data.objects if o.type == 'MESH'])
        act = next(a for a in bpy.data.actions if a.name.startswith(CLIP))
        ad = arm.animation_data_create()
        for tr in list(ad.nla_tracks):
            ad.nla_tracks.remove(tr)
        ad.action = act
        try:
            ad.action_slot = act.slots[0]
        except Exception:
            pass
        sc = bpy.context.scene
        sc.frame_set(f)
        bpy.context.view_layer.update()
        objs = [o for o in bpy.data.objects if o.type == 'MESH']
        dg = bpy.context.evaluated_depsgraph_get()
        pts = []
        for o in objs:
            e = o.evaluated_get(dg)
            pts += [e.matrix_world @ v.co for v in e.to_mesh().vertices]
        mn = mathutils.Vector([min(p[i] for p in pts) for i in range(3)])
        mx = mathutils.Vector([max(p[i] for p in pts) for i in range(3)])
        c = mathutils.Vector((0, 0, (mx.z + mn.z) / 2))
        size = max((mx - mn).length, 1.0)
        sc.render.engine = 'BLENDER_WORKBENCH'
        sc.render.resolution_x = sc.render.resolution_y = 320
        sh = sc.display.shading
        sh.light, sh.color_type, sh.show_object_outline = 'STUDIO', 'MATERIAL', True
        sc.world = bpy.data.worlds.new("w")
        sc.world.color = (0.84, 0.92, 0.98)
        cam = bpy.data.objects.new("c", bpy.data.cameras.new("c"))
        bpy.context.collection.objects.link(cam)
        sc.camera = cam
        cam.data.lens = 60
        d = mathutils.Vector((1.0, -0.8, 0.45)).normalized()
        cam.location = c + d * size * 1.9
        cam.rotation_euler = (c - cam.location).to_track_quat('-Z', 'Y').to_euler()
        bpy.ops.mesh.primitive_plane_add(size=size * 4, location=(0, 0, 0))
        m = bpy.data.materials.new("g")
        m.diffuse_color = (0.62, 0.74, 0.55, 1)
        bpy.context.object.data.materials.append(m)
        sc.render.filepath = os.path.join(OUT, "an_%s_%s_%d.png" % (n, CLIP, f))
        bpy.ops.render.render(write_still=True)
