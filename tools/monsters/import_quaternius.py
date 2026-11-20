"""CC0 monsters from Quaternius' "Ultimate Monsters" pack (public domain), as mirrored in github.com/511action/descent-3d-assets.

Each one is normalised for the game: 1 m tall (the game scales it with def.fit), feet at the origin, facing +Z (glTF), the
texture atlas cut to 256 px, every clip kept (Idle, Walk, Run, Punch, Weapon, HitReact, Death, ...). Run with bpy 4.2 or Blender:
    /workspace/.bpyenv/bin/python -I tools/monsters/import_quaternius.py -- <models dir> <assets/models>
    blender -b -P tools/monsters/import_quaternius.py -- <models dir> <assets/models>
Other monsters of the pack (batch 22): PACK="Yeti.gltf=mob_yeti_ice_v01,Cactoro.gltf=mob_cactus_thunder_v01" in the environment
(.gltf or .glb, file name = output name without .glb).
"""
import os
import bpy, sys, mathutils

SRC, OUT = sys.argv[sys.argv.index('--') + 1:][:2]
PACK = dict(x.split('=') for x in os.environ['PACK'].split(',')) if os.environ.get('PACK') else {'Demon.gltf': 'mob_imp_fire_v01', 'BlueDemon.gltf': 'mob_goblin_frost_v01', 'Orc.gltf': 'mob_orc_gale_v01'}

for src, name in PACK.items():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=f'{SRC}/{src}')
    objs = list(bpy.data.objects); meshes = [o for o in objs if o.type == 'MESH']; roots = [o for o in objs if o.parent is None]
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ mathutils.Vector(c) for o in meshes for c in o.bound_box]
    lo = mathutils.Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = mathutils.Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    k = 1.0 / (hi.z - lo.z)
    for r in roots:      # scale about the feet, centre on x/y
        r.location = (r.location - mathutils.Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))) * k
        r.scale = r.scale * k
    for img in bpy.data.images:      # smaller texture
        if img.size[0] > 256: img.scale(256, 256)
    for m in bpy.data.materials: m.name = 'mob_' + m.name.lower()      # 'mob_atlas': one material, the game lights it up on a hit
    bpy.ops.export_scene.gltf(filepath=f'{OUT}/{name}.glb', export_format='GLB', export_animations=True, export_apply=False, export_yup=True)
    print(name, 'ok', [a.name for a in bpy.data.actions][:20])
