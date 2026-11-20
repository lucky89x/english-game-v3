"""Review scenes for batch 25 event models, with sample season colours on the grey tint_main / tint_trim materials.
Run: DIR=<folder with ev_*.glb> OUT=<folder> blender -b -P tools/events/preview_events.py -> <OUT>/ev_scene_<group>.png (1280x720)
Optional ONLY=shared,trungthu,tet,halloween,xmas. The camera frames all models of a scene from the front-right.
"""
import bpy, os, math, mathutils
from mathutils import Vector

DIR, OUT = os.environ["DIR"], os.environ["OUT"]
ONLY = [s for s in os.environ.get("ONLY", "").split(",") if s]
SCENES = {   # name: (tint_main, tint_trim, sky, [(file, x, y, rot deg)], camera direction, lens)
    "shared": ("3a7ad8", "d8463a", "cfe3f2", [("ev_arena_v01", 0, 0, 0), ("ev_boss_giant_v01", 0, 1.5, 0), ("ev_portal_coop_v01", 10, 7, -20),
                                              ("ev_scoreboard_v01", -9, 7, 20), ("ev_kitchen_double_v01", 10, -5, 0),
                                              ("ev_mannequin_pair_v01", -9, -4, 0), ("ev_dig_spot_v01", 3, -9, 0), ("ev_treasure_map_v01", 1.5, -9.5, 15)],
               (.5, -1, .55), 35),
    "trungthu": ("d8463a", "f2c84b", "2a3060", [("ev_mooncake_stall_v01", 0, 1, 0), ("ev_lion_dance_v01", 2.4, -1.6, 35),
                                                ("ev_lantern_star_v01", -2.0, -1.0, 10), ("ev_lantern_fish_v01", -1.0, -2.2, -20)], (.45, -1, .3), 40),
    "tet": ("c8202a", "f2c84b", "f6e6d0", [("ev_peach_blossom_v01", -1.3, .3, 0), ("ev_apricot_blossom_v01", 1.3, .3, 40),
                                           ("ev_banh_chung_v01", -.1, -1.0, 15), ("ev_red_envelope_v01", .45, -1.25, -20),
                                           ("ev_firecracker_light_v01", -2.6, .4, 0)], (.4, -1, .35), 40),
    "halloween": ("f08a24", "6a3a9a", "3a2a50", [("ev_pumpkin_lantern_v01", -.8, 0, 10), ("ev_ghost_friendly_v01", .7, .4, -15),
                                                 ("ev_candy_bucket_v01", 0, -.8, 0)], (.4, -1, .3), 45),
    "xmas": ("c8202a", "f4f4f4", "dfe8f4", [("ev_tree_xmas_v01", 0, 0, 0), ("ev_snowman_v01", 1.6, -.5, -20),
                                            ("ev_gift_box_v01", -.9, -.9, 15), ("ev_gift_box_v01", -.45, -1.4, -30)], (.4, -1, .35), 40),
}


def lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4) for x in c] + [1]


for name, (tmain, ttrim, sky, layout, cdir, lens) in SCENES.items():
    if ONLY and name not in ONLY:
        continue
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for fname, x, y, r in layout:
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=os.path.join(DIR, fname + ".glb"))
        new = set(bpy.data.objects) - before
        for o in new:     # rest pose: drop clips
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
        h = {"tint_main": tmain, "tint_trim": ttrim, "pants_tint": "3a3a44"}.get(m.name.split(".")[0])
        if h and m.use_nodes:
            next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED').inputs['Base Color'].default_value = lin(h)
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in bpy.data.objects if o.type == 'MESH' for c in o.bound_box]
    mn = Vector([min(p[i] for p in pts) for i in range(3)])
    mx = Vector([max(p[i] for p in pts) for i in range(3)])
    sc = bpy.context.scene
    for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        try:
            sc.render.engine = eng
            break
        except TypeError:
            pass
    sc.render.resolution_x, sc.render.resolution_y = 1280, 720
    sc.world = bpy.data.worlds.new("w")
    sc.world.use_nodes = True
    bg = next(n for n in sc.world.node_tree.nodes if n.type == 'BACKGROUND')
    bg.inputs['Color'].default_value = lin(sky)
    bg.inputs['Strength'].default_value = 1.0
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", 'SUN'))
    sun.data.energy = 3.5
    sun.rotation_euler = (math.radians(48), 0, math.radians(-35))
    sc.collection.objects.link(sun)
    bpy.ops.mesh.primitive_plane_add(size=300)
    g = bpy.data.materials.new("ground")
    g.use_nodes = True
    next(n for n in g.node_tree.nodes if n.type == 'BSDF_PRINCIPLED').inputs['Base Color'].default_value = lin("d8d2c4" if name != "xmas" else "f2f4f8")
    bpy.context.object.data.materials.append(g)
    cam = bpy.data.objects.new("c", bpy.data.cameras.new("c"))
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.data.lens = lens
    tgt = (mn + mx) / 2
    rad = (mx - mn).length / 2
    d = Vector(cdir).normalized()
    cam.location = tgt + d * rad / (18 / lens * 9 / 16) * .55    # fit the bounding sphere in the vertical field of view
    cam.rotation_euler = (tgt - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(OUT, "ev_scene_%s.png" % name)
    bpy.ops.render.render(write_still=True)
