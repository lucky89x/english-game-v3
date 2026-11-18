"""Render 3 preview angles (front, 3/4, top) of exported .glb files.
Run: OUT=<folder> NAMES=a,b blender -b -P tools/harbor/preview.py  -> <OUT>/pv_<name>_<view>.png
Front = glTF +Z = Blender -Y after import. Optional SIZE (px), ANIM=1 renders mid-Walk pose.
"""
import bpy, os, mathutils

OUT = os.environ["OUT"]
names = [n for n in os.environ["NAMES"].split(",") if n]
S = int(os.environ.get("SIZE", "420"))
views = {"front": (0, -1, 0.12), "q34": (0.8, -0.95, 0.55), "top": (0.0, -0.18, 1)}
for n in names:
    for v, d in views.items():
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath=os.path.join(OUT, n + ".glb"))
        sc = bpy.context.scene
        sc.frame_set(1)
        bpy.context.view_layer.update()
        objs = [o for o in bpy.data.objects if o.type == 'MESH']
        pts = [o.matrix_world @ mathutils.Vector(c) for o in objs for c in o.bound_box]
        mn = mathutils.Vector([min(p[i] for p in pts) for i in range(3)])
        mx = mathutils.Vector([max(p[i] for p in pts) for i in range(3)])
        c = (mn + mx) / 2
        size = (mx - mn).length
        sc.render.engine = 'BLENDER_WORKBENCH'
        sc.render.resolution_x = S
        sc.render.resolution_y = S
        sh = sc.display.shading
        sh.light = 'STUDIO'
        sh.color_type = 'MATERIAL'
        sh.show_cavity = True
        sh.cavity_type = 'WORLD'
        sh.show_object_outline = True
        sh.show_shadows = True
        sc.world = bpy.data.worlds.new("w")
        sc.world.color = (0.84, 0.92, 0.98)
        cam = bpy.data.objects.new("c", bpy.data.cameras.new("c"))
        bpy.context.collection.objects.link(cam)
        sc.camera = cam
        cam.data.lens = 60
        dv = mathutils.Vector(d).normalized()
        cam.location = c + dv * size * 1.75
        cam.rotation_euler = (c - cam.location).to_track_quat('-Z', 'Y').to_euler()
        bpy.ops.mesh.primitive_plane_add(size=size * 4, location=(c.x, c.y, mn.z - 0.002))
        g = bpy.context.object
        m = bpy.data.materials.new("g")
        m.diffuse_color = (0.62, 0.74, 0.55, 1)
        g.data.materials.append(m)
        sc.render.filepath = os.path.join(OUT, "pv_%s_%s.png" % (n, v))
        bpy.ops.render.render(write_still=True)
