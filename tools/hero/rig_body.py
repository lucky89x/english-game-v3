"""Rig a Tripo body (one static mesh, T-pose, 1 m tall) with Ngọc v05's skeleton so it plays Ngọc's clips in the game.
Run: <python with bpy 4.2> tools/hero/rig_body.py -- <body.glb> <out.glb> [preview_dir]
Joint positions below were measured on the 25/11 body (slice profile, see CLAUDE.md); they are in metres of the 1 m body and are scaled by S."""
import bpy, sys, os, math, numpy as np
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]
BODY, OUT = argv[0], argv[1]; PREV = argv[2] if len(argv) > 2 else None
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
NGOC = os.path.join(ROOT, 'assets/models/chr_ngoc_adventurer_v05.glb')
S = 0.771 / 0.45          # body hip height -> Ngọc's hip height (0.771): her clips move the hips by absolute amounts

# joint heads on the 1 m body (x of the left side, y forward = -y, z up)
J = {'hips': (0, 0, .45), 'spine': (0, 0, .47), 'chest': (0, 0, .54), 'neck': (0, 0, .585), 'head': (0, 0, .62),
     'shoulder': (.04, 0, .615), 'upper_arm': (.08, 0, .62), 'forearm': (.21, 0, .62), 'hand': (.30, 0, .62),
     'thigh': (.055, 0, .45), 'shin': (.07, 0, .235), 'foot': (.082, 0, .05)}
TIP = {'head': (0, 0, .99), 'hand': (.354, 0, .62), 'foot': (.082, -.12, .02)}
def pos(name):
    b = name.split('.')[0]; x, y, z = J[b]; side = -1 if name.endswith('.R') else 1; return Vector((x * side * S, y * S, z * S))
CHILD = {'hips': 'spine', 'spine': 'chest', 'chest': 'neck', 'neck': 'head', 'shoulder': 'upper_arm', 'upper_arm': 'forearm', 'forearm': 'hand', 'thigh': 'shin', 'shin': 'foot'}
def seg_tail(name):
    b = name.split('.')[0]; side = -1 if name.endswith('.R') else 1
    if b in CHILD: return pos(CHILD[b] + name[len(b):])
    x, y, z = TIP[b]; return Vector((x * side * S, y * S, z * S))

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=NGOC)
ng_arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
old = {}
bpy.context.view_layer.objects.active = ng_arm; bpy.ops.object.mode_set(mode='EDIT')
for b in ng_arm.data.edit_bones: old[b.name] = (b.head.copy(), b.tail.copy(), b.roll, b.parent.name if b.parent else None)
bpy.ops.object.mode_set(mode='OBJECT')
actions = list(bpy.data.actions)
# the body
before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=BODY)
body = [o for o in bpy.data.objects if o not in before and o.type == 'MESH'][0]
for o in [o for o in before if o != ng_arm]: bpy.data.objects.remove(o, do_unlink=True)    # drop Ngọc's meshes
body.parent = None; body.matrix_world.identity(); body.name = 'Hero'
bpy.context.view_layer.objects.active = body; body.select_set(True)
for v in body.data.vertices: v.co *= S
body.data.update()

def make_arm(name, real):
    a = bpy.data.objects.new(name, bpy.data.armatures.new(name)); bpy.context.collection.objects.link(a)
    bpy.context.view_layer.objects.active = a; bpy.ops.object.mode_set(mode='EDIT')
    for n, (h, t, roll, par) in old.items():
        e = a.data.edit_bones.new(n); e.head = pos(n)
        e.tail = (e.head + (t - h)) if real else seg_tail(n); e.roll = roll if real else 0
    for n, (h, t, roll, par) in old.items():
        if par: a.data.edit_bones[n].parent = a.data.edit_bones[par]
    bpy.ops.object.mode_set(mode='OBJECT'); return a
# own skinning weights (Blender's bone-heat solver finds no solution on this mesh): inverse distance to each bone's segment, best 3 kept
def seg_dist(P, a, b):
    ab = b - a; t = np.clip(((P - a) @ ab) / (ab @ ab), 0, 1); return np.linalg.norm(P - (a + t[:, None] * ab), axis=1)
V = np.array([v.co[:] for v in body.data.vertices]); names = list(old)
segs = {}
for n in names:
    h, t = pos(n), seg_tail(n)
    if n == 'hips': h = h - Vector((0, 0, 0.10 * S))              # the pelvis reaches down to the crotch
    if n == 'head': h = h + Vector((0, 0, 0.03 * S))
    segs[n] = (np.array(h[:]), np.array(t[:]))
D = np.stack([seg_dist(V, *segs[n]) for n in names], 1)
Wt = 1.0 / (D + 0.015 * S) ** 4
# (25/11 fix "the face is warped") the head is far wider than its bone, so plain distance gave the face and the side locks up to
# half their weight from the shoulders and arms: lowering the arms dragged the face. Now the head, the face and every hair or bow
# vertex (texture green < 0.45: brown hair, red bow; skin and the suit are > 0.6) follow the head bone only, the neck blends in
# under the chin, and nothing below the neck takes the head bone.
me = body.data; img = next(n.image for m in me.materials for n in m.node_tree.nodes if n.type == 'TEX_IMAGE' and 'basecolor' in n.image.name.lower())
Wd, Hd = img.size; px = np.array(img.pixels[:]).reshape(Hd, Wd, 4)
uv = np.zeros((len(me.vertices), 2)); uv[np.array([l.vertex_index for l in me.loops])] = np.array([d.uv[:] for d in me.uv_layers.active.data])
green = px[np.clip((uv[:, 1] * Hd).astype(int), 0, Hd - 1), np.clip((uv[:, 0] * Wd).astype(int), 0, Wd - 1), 1]
z, ax = V[:, 2] / S, np.abs(V[:, 0]) / S
hair = green < 0.45
is_head = hair | (z >= 0.66) | ((z >= 0.60) & (ax < 0.075))
hi, ni = names.index('head'), names.index('neck')
Wt[~is_head, hi] = 0
Wt[is_head] = 0; Wt[is_head, hi] = 1.0
chin = is_head & ~hair & (z < 0.64) & (ax < 0.075); t = np.clip((z[chin] - 0.58) / 0.06, 0, 1)
Wt[chin, hi] = t; Wt[chin, ni] = 1 - t + 1e-6
print('head-only vertices', int(is_head.sum()), 'hair', int(hair.sum()), 'chin blend', int(chin.sum()))
keep = np.argsort(-Wt, 1)[:, :3]
for n in names: body.vertex_groups.new(name=n)
for vi in range(len(V)):
    ids = keep[vi]; w = Wt[vi, ids]; w = w / max(w.sum(), 1e-9)
    for k, wi in zip(ids, w):
        if wi > 0.02: body.vertex_groups[names[k]].add([vi], float(wi), 'REPLACE')
mod = body.modifiers.new('Armature', 'ARMATURE')
real = make_arm('CharacterRig', True)
mod.object = real
bpy.data.objects.remove(ng_arm, do_unlink=True)
body.parent = real; body.matrix_parent_inverse.identity()
print('mods after', [(m.type, m.object.name if getattr(m, 'object', None) else None) for m in body.modifiers])
# Ngọc's clips on the new rig (same bone names; rest directions are identical)
real.animation_data_create()
for act in actions:
    act.name = act.name.replace('_CharacterRig', '')
    tr = real.animation_data.nla_tracks.new(); tr.name = act.name; st = tr.strips.new(act.name, 0, act); st.action = act
print('clips', [a.name for a in actions])
# tidy: decimate to ~30k triangles keeping UVs
mod = body.modifiers.new('dec', 'DECIMATE'); mod.ratio = float(os.environ.get('HERO_RATIO', '0.55'))
bpy.ops.object.select_all(action='DESELECT'); body.select_set(True); bpy.context.view_layer.objects.active = body
# keep armature modifier order: decimate must go first
bpy.ops.object.modifier_move_to_index(modifier='dec', index=0); bpy.ops.object.modifier_apply(modifier='dec')
print('tris', sum(len(p.vertices) - 2 for p in body.data.polygons))
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_animations=True, export_animation_mode='NLA_TRACKS', export_skins=True, export_apply=False, export_image_format='JPEG', export_jpeg_quality=88)
print('exported', OUT, os.path.getsize(OUT) // 1024, 'KB')
