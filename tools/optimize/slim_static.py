"""Slim a STATIC game model (no bones, no clips: the Tripo monsters and pets): fewer triangles, ONE material with ONE texture.
Run:  <python with bpy 4.2> tools/optimize/slim_static.py -- <in.glb> <out.glb> <triangles> [tex=1024]
  in and out must be different files (keep the original: git show HEAD:assets/models/x.glb > /tmp/x.glb).
What it does: joins the meshes into one named "Body", welds the vertices glTF split along UV seams, collapses to <triangles>,
stretches the result back onto the original bounding box (same height, feet still at y = 0, nothing is re-centred), then
  - several materials (the lava golem had 16 = 16 draw calls): a new UV layout (Smart UV Project) and the colours of all the old
    textures baked into one <tex> x <tex> atlas (Cycles, CPU, colour only);
  - one material already: its texture is only shrunk to <tex>.
Material after: base colour texture, metallic 0, roughness 0.85 (the game has no environment map). Never use this on a rigged model."""
import bpy, bmesh, sys, os, math
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT, TRIS = a[0], a[1], int(a[2]); TEX = int(a[3]) if len(a) > 3 else 1024
if os.path.abspath(SRC) == os.path.abspath(OUT): raise SystemExit('in and out must differ')
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=SRC)
if any(o.type == 'ARMATURE' for o in bpy.data.objects) or bpy.data.actions: raise SystemExit('this model has bones or clips: not for this tool')
meshes = [o for o in bpy.data.objects if o.type == 'MESH']; bpy.ops.object.select_all(action='DESELECT')
for o in meshes: o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM'); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
if len(meshes) > 1: bpy.ops.object.join()
ob = bpy.context.view_layer.objects.active; ob.name = 'Body'; me = ob.data      # (the mesh keeps its own name)
for o in list(bpy.data.objects):
    if o is not ob: bpy.data.objects.remove(o, do_unlink=True)
tri = lambda: sum(len(p.vertices) - 2 for p in me.polygons)
box = lambda: ([min(v.co[k] for v in me.vertices) for k in range(3)], [max(v.co[k] for v in me.vertices) for k in range(3)])
tris0 = tri(); lo0, hi0 = box(); size = (Vector(hi0) - Vector(lo0)).length; mats0 = len([m for m in me.materials if m])
double_sided = any(m and not m.use_backface_culling for m in me.materials)
# weld, then collapse
bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.triangulate(bm, faces=bm.faces[:]); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=size * 1e-5); bm.to_mesh(me); bm.free()
def image_of(m):
    return next((n.image for n in m.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image), None) if m and m.use_nodes else None

# where the texture is busy (eyes, nose, mouth, markings) the shape must stay: those vertices are collapsed last
def detail_weights():
    import numpy as np
    w = np.zeros(len(me.vertices), dtype=np.float32); uv = me.uv_layers.active
    if not uv: return None
    maps = {}
    for mi, m in enumerate(me.materials):
        im = image_of(m)
        if not im or not im.size[0]: continue
        W, H = im.size; px = np.empty(W * H * 4, dtype=np.float32); im.pixels.foreach_get(px); px = px.reshape(H, W, 4)
        k = max(1, W // 256); lum = (px[:, :, 0] * 0.3 + px[:, :, 1] * 0.6 + px[:, :, 2] * 0.1)[:H // k * k, :W // k * k].reshape(H // k, k, W // k, k).mean(axis=(1, 3))
        def blur(a, r):
            c = np.cumsum(np.cumsum(np.pad(a, ((r + 1, r), (r + 1, r)), mode='edge'), axis=0), axis=1); n = 2 * r + 1
            return (c[n:, n:] - c[:-n, n:] - c[n:, :-n] + c[:-n, :-n]) / (n * n)
        maps[mi] = blur(np.abs(lum - blur(lum, 6)), 3)       # local contrast, in a ~256 px wide picture
    if not maps: return None
    top = max(float(np.percentile(c, 97)) for c in maps.values()) or 1.0
    for p in me.polygons:
        c = maps.get(p.material_index)
        if c is None: continue
        h, wd = c.shape
        for li in p.loop_indices:
            u, v = uv.data[li].uv; x = min(wd - 1, max(0, int((u % 1.0) * wd))); y = min(h - 1, max(0, int((v % 1.0) * h))); vi = me.loops[li].vertex_index
            w[vi] = max(w[vi], min(1.0, float(c[y, x]) / top))
    return w
dw = detail_weights() if os.environ.get('DETAIL', '1') != '0' else None
if dw is not None:
    vg = ob.vertex_groups.new(name='plain')
    for i, d in enumerate(dw): vg.add([i], 1.0 - float(d), 'REPLACE')
want = TRIS
for _ in range(5):
    cur = tri()
    if cur <= TRIS: break
    mod = ob.modifiers.new('dec', 'DECIMATE'); mod.decimate_type = 'COLLAPSE'; mod.ratio = want / cur; mod.use_collapse_triangulate = True
    if dw is not None: mod.vertex_group = 'plain'; mod.vertex_group_factor = float(os.environ.get('DETAIL_K', 0.6))
    bpy.ops.object.modifier_apply(modifier='dec'); want = int(want * 0.97)
lo1, hi1 = box()
for v in me.vertices:                                     # back onto the original bounding box
    for k in range(3):
        d = hi1[k] - lo1[k]
        if d > 0 and 0.9 < (hi0[k] - lo0[k]) / d < 1.1: v.co[k] = lo0[k] + (v.co[k] - lo1[k]) * (hi0[k] - lo0[k]) / d
if me.has_custom_normals: bpy.ops.mesh.customdata_custom_splitnormals_clear()
for p in me.polygons: p.use_smooth = True
me.update()

if mats0 > 1:
    src_name = me.uv_layers.active.name; me.uv_layers.new(name='atlas')      # (a layer reference dies when a layer is added: look them up by name)
    me.uv_layers.active = me.uv_layers['atlas']; me.uv_layers[src_name].active_render = True
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.004, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.uv.pack_islands(margin=0.004); bpy.ops.object.mode_set(mode='OBJECT')
    img = bpy.data.images.new('atlas', TEX, TEX, alpha=False); img.colorspace_settings.name = 'sRGB'
    for m in me.materials:
        if not m: continue
        n = m.node_tree.nodes.new('ShaderNodeTexImage'); n.image = img; m.node_tree.nodes.active = n; n.select = True
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 4; sc.render.bake.margin = 8
    sc.render.bake.use_pass_direct = False; sc.render.bake.use_pass_indirect = False; sc.render.bake.use_pass_color = True; sc.render.bake.use_selected_to_active = False
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.object.bake(type='DIFFUSE'); img.pack()
    me.uv_layers.remove(me.uv_layers[src_name]); me.uv_layers[0].name = 'UVMap'; me.uv_layers[0].active_render = True
    mat = bpy.data.materials.new('painted'); mat.use_nodes = True; nt = mat.node_tree; pb = nt.nodes['Principled BSDF']
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = img; nt.links.new(t.outputs['Color'], pb.inputs['Base Color'])
    pb.inputs['Metallic'].default_value = 0.0; pb.inputs['Roughness'].default_value = 0.85; mat.use_backface_culling = not double_sided
    me.materials.clear(); me.materials.append(mat)
    for p in me.polygons: p.material_index = 0
else:
    for m in me.materials:
        im = image_of(m)
        if im and max(im.size) > TEX: k = TEX / max(im.size); im.scale(max(1, round(im.size[0] * k)), max(1, round(im.size[1] * k)))
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_animations=False, export_skins=False, export_image_format='JPEG', export_jpeg_quality=88, export_apply=True)
print('RESULT', os.path.basename(OUT), 'tris', tris0, '->', tri(), 'materials', mats0, '->', len(me.materials), 'KB', os.path.getsize(SRC) // 1024, '->', os.path.getsize(OUT) // 1024)
