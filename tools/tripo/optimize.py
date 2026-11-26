"""Shrink a raw Tripo model (1-2 million triangles, 50 MB) into a game model (<= ~15k triangles, 1-3 MB).
Run: <python with bpy 4.2> tools/tripo/optimize.py -- <in.glb> <out.glb> <tris> <height_m> [tex=1024] [cut=0.0] [preview.png]
  tris    target triangle count (Decimate collapse, UVs kept)
  height  final height in metres (the game scales models by def.fit/def.size, so author them at their real size)
  tex     longest side of each texture after shrinking (JPEG)
  cut     0..1 fraction of the height to slice off the bottom (Tripo "statue" models stand on a round base)
Result: origin at the centre of the feet, facing +Z in glTF (Blender -Y), only the base-colour texture is kept (metallic 0, rough 0.85:
the game has no environment map, so Tripo's metal maps would turn into black metal)."""
import bpy, bmesh, sys, os
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT, TRIS, HEIGHT = a[0], a[1], int(a[2]), float(a[3])
TEX = int(a[4]) if len(a) > 4 else 1024
CUT = float(a[5]) if len(a) > 5 else 0.0
PREV = a[6] if len(a) > 6 else None
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
for o in bpy.data.objects:
    if o.type != 'MESH': o.select_set(False)
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:
    o.select_set(True)
    if o.parent: o.parent = None;
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
if len(meshes) > 1: bpy.ops.object.join()
ob = bpy.context.view_layer.objects.active; ob.name = 'Body'
for o in list(bpy.data.objects):
    if o is not ob: bpy.data.objects.remove(o, do_unlink=True)
for m in list(ob.modifiers): ob.modifiers.remove(m)
tris0 = sum(len(p.vertices) - 2 for p in ob.data.polygons)
# slice the base off, then size it
zs = [v.co.z for v in ob.data.vertices]; z0, z1 = min(zs), max(zs)
if CUT > 0:
    bm = bmesh.new(); bm.from_mesh(ob.data); zc = z0 + (z1 - z0) * CUT
    geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
    bmesh.ops.bisect_plane(bm, geom=geom, plane_co=(0, 0, zc), plane_no=(0, 0, 1), clear_inner=True)
    bm.to_mesh(ob.data); bm.free(); zs = [v.co.z for v in ob.data.vertices]; z0, z1 = min(zs), max(zs)
k = HEIGHT / (z1 - z0)
cx = sum(v.co.x for v in ob.data.vertices) / len(ob.data.vertices); cy = sum(v.co.y for v in ob.data.vertices) / len(ob.data.vertices)
for v in ob.data.vertices: v.co = Vector(((v.co.x - cx) * k, (v.co.y - cy) * k, (v.co.z - z0) * k))
ob.data.update()
# glTF splits vertices along every UV/normal seam: weld them (UV stays per loop) or the collapse cannot cross the seams and stalls
bm = bmesh.new(); bm.from_mesh(ob.data); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=HEIGHT * 1e-5); bm.to_mesh(ob.data); bm.free()
cur = sum(len(p.vertices) - 2 for p in ob.data.polygons)
mod = ob.modifiers.new('dec', 'DECIMATE'); mod.decimate_type = 'COLLAPSE'; mod.ratio = min(1.0, TRIS / max(cur, 1)); mod.use_collapse_triangulate = True
bpy.ops.object.modifier_apply(modifier='dec')
# materials: base colour only
for m in ob.data.materials:
    if not m or not m.use_nodes: continue
    nt = m.node_tree; pb = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if not pb: continue
    for name in ('Normal', 'Metallic', 'Roughness'):
        for l in list(pb.inputs[name].links): nt.links.remove(l)
    pb.inputs['Metallic'].default_value = 0.0; pb.inputs['Roughness'].default_value = 0.85
    for n in list(nt.nodes):
        if n.type in ('NORMAL_MAP',): nt.nodes.remove(n)
for im in bpy.data.images:
    if im.size[0] > TEX or im.size[1] > TEX:
        s = TEX / max(im.size); im.scale(max(1, int(im.size[0] * s)), max(1, int(im.size[1] * s)))
tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_animations=False, export_skins=False, export_image_format='JPEG', export_jpeg_quality=85, export_apply=True)
print('RESULT', os.path.basename(SRC)[:24], 'tris', tris0, '->', tris, 'mats', len(ob.data.materials), 'size', [round(d, 2) for d in ob.dimensions], 'KB', os.path.getsize(OUT) // 1024)
