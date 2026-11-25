"""Fit the parts of a segmented Tripo outfit (one static GLB, 1 m tall character) onto the rigged hero body and skin them with the same bones.
Run: <python with bpy 4.2> tools/hero/fit_outfit.py -- <outfit.glb> <rigged_body.glb> <out.glb>
PARTS: Tripo part -> (name, z-map kind). The outfit character was generated separately, so its proportions differ from the body's: heights are warped piecewise."""
import bpy, sys, os, numpy as np
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]; OUTFIT, BODY, OUT = argv[:3]
S = 0.771 / 0.45
RATIO = {'dress': .12, 'sleeve_l': .1, 'sleeve_r': .1, 'boot_a': .07, 'boot_b': .07, 'scarf': .15, 'bag': .12, 'bag_strap': .15, 'strap': .2, 'pouch': .25, 'potion': .3, 'goggles': .15}      # outfit parts are 40-200k triangles as made: keep ~3-9k each
PARTS = {'part_2': ('dress', 'torso'), 'part_12': ('sleeve_l', 'arm'), 'part_3': ('sleeve_r', 'arm'), 'part_4': ('scarf', 'torso'), 'part_1': ('boot_a', 'id'), 'part_11': ('boot_b', 'id'),
         'part_5': ('bag', 'torso'), 'part_8': ('bag_strap', 'torso'), 'part_14': ('strap', 'torso'), 'part_10': ('pouch', 'torso'), 'part_9': ('potion', 'torso'), 'part_7': ('goggles', 'head')}
Z_TORSO = [(0, 0), (.24, .235), (.36, .36), (.71, .615), (.74, .64), (1.0, 1.0)]
Z_SCARF = [(0, 0), (.44, .40), (.70, .565), (.74, .60), (1.0, 1.0)]
Z_HEAD = [(0, 0), (.71, .65), (1.0, 1.0)]
def zmap(z, table): return np.interp(z, [a for a, b in table], [b for a, b in table])

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=BODY)
rig = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]; hero = [o for o in bpy.data.objects if o.type == 'MESH'][0]
before = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=OUTFIT)
new = [o for o in bpy.data.objects if o not in before]
# bone segments (world) from the rig, for the skin weights
bones = {}
for b in rig.data.bones:
    bones[b.name] = (np.array((rig.matrix_world @ b.head_local)[:]), np.array((rig.matrix_world @ b.tail_local)[:]))
# joints of the real bones point +Z for a fixed length, so rebuild proper segments from head to child head
child = {'hips': 'spine', 'spine': 'chest', 'chest': 'neck', 'neck': 'head', 'shoulder': 'upper_arm', 'upper_arm': 'forearm', 'forearm': 'hand', 'thigh': 'shin', 'shin': 'foot'}
tips = {'head': (0, 0, .99), 'hand': (.354, 0, .62), 'foot': (.082, -.12, .02)}
segs = {}
for n, (h, t) in bones.items():
    b = n.split('.')[0]; sd = n[len(b):]
    if b in child: segs[n] = (h, bones[child[b] + sd][0])
    else:
        x, y, z = tips[b]; sg = -1 if sd == '.R' else 1; segs[n] = (h, np.array((x * sg * S, y * S, z * S)))
def seg_dist(P, a, b):
    ab = b - a; t = np.clip(((P - a) @ ab) / (ab @ ab), 0, 1); return np.linalg.norm(P - (a + t[:, None] * ab), axis=1)
names = list(segs)
for o in new:
    key = o.name.replace('tripo_part_', 'part_')
    if o.type != 'MESH' or key not in PARTS: bpy.data.objects.remove(o, do_unlink=True); continue
    nm, kind = PARTS[key]; o.name = nm; mw = o.matrix_world.copy(); o.parent = None; o.matrix_world.identity()
    me = o.data; P = np.array([(mw @ v.co)[:] for v in me.vertices])    # Blender space: x right, y depth (-y front), z up
    P = P.copy()
    if kind in ('torso', 'head'):
        z0 = P[:, 2].copy(); P[:, 2] = zmap(z0, Z_HEAD if kind == 'head' else Z_SCARF if nm == 'scarf' else Z_TORSO)
        if nm == 'scarf': f = np.interp(z0, [.44, .72], [1.0, 1.3]); P[:, 0] *= f; P[:, 1] *= f
        if kind == 'torso' and nm in ('dress', 'strap'):
            f = np.interp(z0, [.36, .5, .71], [1.0, .85, .8]); P[:, 0] *= f; P[:, 1] *= np.interp(z0, [.36, .71], [1.0, .85])
        if kind == 'head': P[:, 0] *= 1.15; P[:, 1] *= 1.1
    elif kind == 'arm':
        P[:, 2] -= .035; sg = np.sign(np.mean(P[:, 0])); P[:, 0] = np.where(np.abs(P[:, 0]) > .06, sg * (.06 + (np.abs(P[:, 0]) - .06) * .93), P[:, 0])
    P *= S
    for v, p in zip(me.vertices, P): v.co = Vector(p)
    me.update()
    D = np.stack([seg_dist(P, *segs[n]) for n in names], 1); Wt = 1.0 / (D + 0.015 * S) ** 4; keep = np.argsort(-Wt, 1)[:, :3]
    for n in names: o.vertex_groups.new(name=n)
    for vi in range(len(P)):
        ids = keep[vi]; w = Wt[vi, ids]; w = w / w.sum()
        for k, wi in zip(ids, w):
            if wi > .02: o.vertex_groups[names[k]].add([vi], float(wi), 'REPLACE')
    m = o.modifiers.new('Armature', 'ARMATURE'); m.object = rig; o.parent = rig; o.matrix_parent_inverse.identity()
    d = o.modifiers.new('dec', 'DECIMATE'); d.ratio = RATIO[nm]; o.name = 'Gear_goggles' if nm == 'goggles' else 'Outfit_' + nm
    bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_move_to_index(modifier='dec', index=0); bpy.ops.object.modifier_apply(modifier='dec')
    print('part', nm, len(o.data.polygons), 'tris')
# lighten for the game: base colour only (the normal / metal-rough maps triple the download), parts at 1024 px, body at 2048
for mat in bpy.data.materials:
    if not mat.use_nodes: continue
    bsdf = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if not bsdf or mat.name.startswith('tripo_mat'): continue      # the body keeps its normal and metal-rough maps (they give the eyes their shine)
    for name in ('Normal', 'Metallic', 'Roughness'):
        for l in list(bsdf.inputs[name].links): mat.node_tree.links.remove(l)
    bsdf.inputs['Metallic'].default_value = 0.0; bsdf.inputs['Roughness'].default_value = 0.72
for img in bpy.data.images:
    if img.size[0] > 1024 and 'basecolor' in img.name and 'tripo_part' in ' '.join(m.name for m in bpy.data.materials if m.use_nodes and any(n.type == 'TEX_IMAGE' and n.image == img for n in m.node_tree.nodes)) and not any(o.name == 'Hero' and o.data.materials and img in [n.image for n in o.data.materials[0].node_tree.nodes if n.type == 'TEX_IMAGE'] for o in bpy.data.objects): img.scale(1024, 1024)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_animations=True, export_skins=True, export_image_format='JPEG', export_jpeg_quality=85)
print('exported', OUT, os.path.getsize(OUT) // 1024, 'KB')
