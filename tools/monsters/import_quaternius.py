"""Import Quaternius CC0 monsters (glTF/GLB), normalise and export them for the game.
Run: PACK="Bunny.gltf=mob_bunny_ice_v01,..." blender -b -P tools/monsters/import_quaternius.py -- <source folder> <dest folder>
Each model: scaled so it is HEIGHT m tall (default 1.0; per file with name:height, e.g. "Dragon.glb=boss_dragon_fire_v01:2.5"),
feet on the ground, front kept at glTF +Z, clip names cleaned ("CharacterArmature|Idle" -> "Idle"; "TRex_Walk" -> "Walk"),
exported with its skin and every clip. Prints height, triangles and clips so the result can be checked.
"""
import bpy, os, sys, re
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
SRC, DST = argv[0], argv[1]
H_DEFAULT = float(os.environ.get("HEIGHT", "1.0"))
for item in [p for p in os.environ["PACK"].split(",") if p]:
    src, dst = item.split("=")
    h = H_DEFAULT
    if ":" in dst:
        dst, h = dst.split(":")
        h = float(h)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    path = os.path.join(SRC, src)
    if not os.path.exists(path):
        print("MISSING", src)
        continue
    bpy.ops.import_scene.gltf(filepath=path)
    roots = [o for o in bpy.data.objects if o.parent is None]
    bpy.context.view_layer.update()
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    mn = Vector([min(p[i] for p in pts) for i in range(3)])
    mx = Vector([max(p[i] for p in pts) for i in range(3)])
    k = h / (mx.z - mn.z)
    for r in roots:   # scale about the origin, then put the lowest point on the ground
        r.scale = r.scale * k
        r.location = r.location * k
        r.location.z -= mn.z * k
    for a in bpy.data.actions:
        name = a.name.split("|")[-1]
        name = re.sub(r"^(TRex|Parasaurolophus|Triceratops|Velociraptor|Stegosaurus|Frog|Dragon)_", "", name)
        a.name = name.replace("HitRecieve", "HitReact")
    names = {a.name for a in bpy.data.actions}
    for alias, src_name in (("Idle", "Flying_Idle"), ("Walk", "Fast_Flying"), ("Attack", "Bite_Front")):
        if alias not in names and src_name in names:      # flyers: give the game the usual Idle / Walk names too
            c = bpy.data.actions[src_name].copy()
            c.name = alias
            c.use_fake_user = True
    for o in bpy.data.objects:
        if o.animation_data:
            o.animation_data.action = None
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=os.path.join(DST, dst + ".glb"), export_format='GLB', export_yup=True, use_selection=True,
                              export_animations=True, export_animation_mode='ACTIONS', export_skins=True, export_apply=False)
    tri = sum(len(p.vertices) - 2 for o in meshes for p in o.data.polygons)
    print("IMPORTED", dst, "height", round((mx.z - mn.z) * k, 2), "tris", tri, "clips", sorted(a.name for a in bpy.data.actions),
          "KB", os.path.getsize(os.path.join(DST, dst + ".glb")) // 1024)
