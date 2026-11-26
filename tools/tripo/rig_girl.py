"""Re-rig a Tripo character that came with Tripo's own skeleton (Hip, Pelvis, L_Thigh, ... + twist bones, T-pose) onto Ngoc v05's
19-bone skeleton, so it plays Ngoc's ten clips in the game (same idea as tools/hero/rig_body.py, but the joint positions and the skin
weights come from Tripo's rig instead of being guessed).
Run: <python with bpy 4.2> tools/tripo/rig_girl.py -- <src.glb> <out.glb> [tex=1024] [max_tris=60000]
 - the joints are read from the source skeleton and made symmetric (Tripo's left and right bones differ by a centimetre or two),
   the character is centred on the hip and scaled so the hip height is Ngoc's 0.771 (her clips move the hips by absolute amounts)
 - Tripo's weights are merged onto Ngoc's bones (twist bones go to their limb bone); the head and neck bones keep the face and hair
 - meshes stay separate (Tripo splits hair, top, legs...), only the base-colour texture is kept (metallic 0, rough 0.85)
"""
import bpy, sys, os, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT = argv[0], argv[1]
TEX = int(argv[2]) if len(argv) > 2 else 1024
MAXTRI = int(argv[3]) if len(argv) > 3 else 60000
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
NGOC = os.path.join(ROOT, 'assets/models/chr_ngoc_adventurer_v05.glb')
HIP_Z = 0.771

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=NGOC)
ng = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
old = {}
bpy.context.view_layer.objects.active = ng; bpy.ops.object.mode_set(mode='EDIT')
for b in ng.data.edit_bones: old[b.name] = (b.head.copy(), b.tail.copy(), b.roll, b.parent.name if b.parent else None)
bpy.ops.object.mode_set(mode='OBJECT')
actions = list(bpy.data.actions)

before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=SRC)
new = [o for o in bpy.data.objects if o not in before]
sa = next(o for o in new if o.type == 'ARMATURE')
meshes = [o for o in new if o.type == 'MESH' and len(o.data.polygons) > 100]          # Tripo adds a stray 80-face icosphere
for o in [o for o in before if o != ng]: bpy.data.objects.remove(o, do_unlink=True)    # Ngoc's meshes
for o in new:
    if o.type == 'MESH' and o not in meshes: bpy.data.objects.remove(o, do_unlink=True)
bpy.context.view_layer.update()
H = lambda n: sa.matrix_world @ sa.data.bones[n].head_local
def sym(n):                       # left-side joint position, averaged with the right side
    a, b = H('L_' + n), H('R_' + n); return Vector(((abs(a.x) + abs(b.x)) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2))
hip = H('Hip'); cx, cy = hip.x, hip.y
S = HIP_Z / hip.z
allv = [o.matrix_world @ v.co for o in meshes for v in o.data.vertices]
ztop = max(v.z for v in allv)
J = {'hips': Vector((0, hip.y, hip.z)), 'spine': H('Spine01'), 'chest': H('Spine02'), 'neck': H('NeckTwist01'), 'head': H('Head'),
     'shoulder': sym('Clavicle'), 'upper_arm': sym('Upperarm'), 'forearm': sym('Forearm'), 'hand': sym('Hand'),
     'thigh': sym('Thigh'), 'shin': sym('Calf'), 'foot': sym('Foot')}
for k in ('spine', 'chest', 'neck', 'head'): J[k] = Vector((0, J[k].y, J[k].z))
J['thigh'].z = hip.z; J['thigh'].y = hip.y                       # the leg swings from the hip line
J['shoulder'].z = J['upper_arm'].z; J['forearm'].z = J['upper_arm'].z; J['hand'].z = J['upper_arm'].z       # T-pose: the arm is one level line
J['forearm'].y = J['upper_arm'].y; J['hand'].y = J['upper_arm'].y
J['shin'].y = J['thigh'].y; J['foot'].y = J['thigh'].y; J['foot'].x = J['shin'].x = J['thigh'].x
TIP = {'head': Vector((0, J['head'].y, ztop)), 'hand': J['hand'] + Vector((0.06, 0, 0)), 'foot': Vector((J['foot'].x, J['foot'].y - 0.10, 0.02))}
CHILD = {'hips': 'spine', 'spine': 'chest', 'chest': 'neck', 'neck': 'head', 'shoulder': 'upper_arm', 'upper_arm': 'forearm', 'forearm': 'hand', 'thigh': 'shin', 'shin': 'foot'}
def pos(name):
    b = name.split('.')[0]; v = J[b]; side = -1 if name.endswith('.R') else 1
    return Vector(((v.x - cx) * side * S, (v.y - cy) * S, v.z * S))
print('joints (m, scaled)', {k: tuple(round(x, 3) for x in pos(k + ('.L' if k in ('shoulder', 'upper_arm', 'forearm', 'hand', 'thigh', 'shin', 'foot') else ''))) for k in J}, 'S', round(S, 3), 'height', round(ztop * S, 3))

# merge map: Tripo bone -> Ngoc bone
def target(n):
    side = '.R' if n.startswith('R_') else '.L'; b = n[2:] if n[:2] in ('L_', 'R_') else n
    for key, tgt in (('Clavicle', 'shoulder'), ('Upperarm', 'upper_arm'), ('Forearm', 'forearm'), ('Hand', 'hand'), ('Thigh', 'thigh'), ('Calf', 'shin'), ('Foot', 'foot'), ('ToeBase', 'foot')):
        if b.startswith(key): return tgt + side
    return {'Root': 'hips', 'Hip': 'hips', 'Pelvis': 'hips', 'Waist': 'hips', 'Spine01': 'spine', 'Spine02': 'chest', 'NeckTwist01': 'neck', 'NeckTwist02': 'neck', 'Head': 'head'}.get(n, 'hips')

def make_arm():
    a = bpy.data.objects.new('CharacterRig', bpy.data.armatures.new('CharacterRig')); bpy.context.collection.objects.link(a)
    bpy.context.view_layer.objects.active = a; bpy.ops.object.mode_set(mode='EDIT')
    for n, (h, t, roll, par) in old.items():
        e = a.data.edit_bones.new(n); e.head = pos(n); e.tail = e.head + (t - h); e.roll = roll
    for n, (h, t, roll, par) in old.items():
        if par: a.data.edit_bones[n].parent = a.data.edit_bones[par]
    bpy.ops.object.mode_set(mode='OBJECT'); return a
rig = make_arm()

bpy.ops.object.select_all(action='DESELECT')
for o in meshes:
    mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
    for m in list(o.modifiers): o.modifiers.remove(m)
    # weights: copy Tripo's, merged onto Ngoc's bones
    src_names = {g.index: g.name for g in o.vertex_groups}
    acc = [dict() for _ in o.data.vertices]
    for v in o.data.vertices:
        for g in v.groups:
            t = target(src_names[g.group]); acc[v.index][t] = acc[v.index].get(t, 0) + g.weight
    for g in list(o.vertex_groups): o.vertex_groups.remove(g)
    for n in old: o.vertex_groups.new(name=n)
    for v in o.data.vertices:
        w = sorted(acc[v.index].items(), key=lambda kv: -kv[1])[:4]; tot = sum(x for _, x in w) or 1.0
        for n, x in w:
            if x / tot > 0.01: o.vertex_groups[n].add([v.index], x / tot, 'REPLACE')
    # centre on the hip, scale, bake
    for v in o.data.vertices:
        p = o.matrix_world @ v.co; v.co = Vector(((p.x - cx) * S, (p.y - cy) * S, p.z * S))
    o.matrix_world.identity(); o.data.update()
    o.select_set(True)
    o.modifiers.new('Armature', 'ARMATURE').object = rig
    o.parent = rig; o.matrix_parent_inverse.identity()
bpy.data.objects.remove(sa, do_unlink=True); bpy.data.objects.remove(ng, do_unlink=True)

# mesh budget: decimate the biggest pieces (weights are kept) when the total is over MAXTRI
tri = lambda o: sum(len(p.vertices) - 2 for p in o.data.polygons)
total = sum(tri(o) for o in meshes)
if total > MAXTRI:
    r = MAXTRI / total
    for o in meshes:
        if tri(o) < 3000: continue
        bpy.context.view_layer.objects.active = o
        d = o.modifiers.new('dec', 'DECIMATE'); d.ratio = r
        bpy.ops.object.modifier_move_to_index(modifier='dec', index=0); bpy.ops.object.modifier_apply(modifier='dec')
# materials: base colour only
for m in bpy.data.materials:
    if not m.use_nodes: continue
    nt = m.node_tree; pb = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if not pb: continue
    for name in ('Normal', 'Metallic', 'Roughness'):
        for l in list(pb.inputs[name].links): nt.links.remove(l)
    pb.inputs['Metallic'].default_value = 0.0; pb.inputs['Roughness'].default_value = 0.85
    for n in list(nt.nodes):
        if n.type == 'NORMAL_MAP': nt.nodes.remove(n)
for im in bpy.data.images:
    if im.size[0] > TEX or im.size[1] > TEX:
        s = TEX / max(im.size); im.scale(max(1, int(im.size[0] * s)), max(1, int(im.size[1] * s)))
rig.animation_data_create()
for act in actions:
    act.name = act.name.replace('_CharacterRig', '')
    tr = rig.animation_data.nla_tracks.new(); tr.name = act.name; st = tr.strips.new(act.name, 0, act); st.action = act
for i, o in enumerate(meshes): o.name = 'Hero' if len(meshes) == 1 else f'Part{i}_{o.name.replace("tripo_", "")[:12]}'
print('meshes', [(o.name, tri(o)) for o in meshes], 'total', sum(tri(o) for o in meshes))
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_animations=True, export_animation_mode='NLA_TRACKS', export_skins=True, export_apply=False, export_image_format='JPEG', export_jpeg_quality=88)
print('exported', OUT, os.path.getsize(OUT) // 1024, 'KB')
