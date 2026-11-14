"""Shared toolkit for EnglishQuestV3 chibi characters and props (Blender 4.2+/5.x, bpy).

A build script calls `init(...)`, models parts with the geometry helpers and `finish()`,
then `build_rig()`, `skin_and_join()`, `make_action()` and `export()`.
Conventions: metres, feet at Z=0, characters face Blender -Y (glTF +Z / Godot +Z).
Every non-face part samples one flat palette cell, so a character renders with one body
material plus an optional painted face material.
"""
import bpy, bmesh, math, os
from pathlib import Path
from mathutils import Vector, Matrix, Quaternion, Euler
from mathutils.bvhtree import BVHTree

ROOT = Path(os.environ.get('NGOC_ROOT', os.getcwd()))
PALETTE = {}
NAMES = []
GRID, CELL = 16, 16
PARTS = []
MAT_BODY = MAT_FACE = None
STATE = {}


def srgb_hex(h):
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def init(name, palette, out_dir, src_dir, faces=None):
    """faces: {'key': PIL.Image} — first key becomes the embedded face texture."""
    global PALETTE, NAMES, MAT_BODY, MAT_FACE
    from PIL import Image
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = 24
    PARTS.clear()
    PALETTE = dict(palette)
    NAMES = list(PALETTE)
    out_dir, src_dir = Path(out_dir), Path(src_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    src_dir.mkdir(parents=True, exist_ok=True)
    STATE.update(name=name, out=out_dir, src=src_dir)
    size = CELL * GRID
    alb = Image.new('RGB', (size, size), (255, 0, 255))
    orm = Image.new('RGB', (size, size), (255, 200, 0))
    for i, (n, (hx, rough, metal)) in enumerate(PALETTE.items()):
        x, y = (i % GRID) * CELL, (i // GRID) * CELL
        alb.paste(srgb_hex(hx), (x, y, x + CELL, y + CELL))
        orm.paste((255, int(rough * 255), int(metal * 255)), (x, y, x + CELL, y + CELL))
    pa, po = src_dir / f'{name}_palette_albedo.png', src_dir / f'{name}_palette_orm.png'
    alb.save(pa)
    orm.save(po)
    MAT_BODY = _material(f'{name}_Body', pa, po)
    MAT_FACE = None
    if faces:
        first = None
        for key, img in faces.items():
            p = src_dir / f'{name}_face_{key}.png'
            img.save(p)
            img.save(out_dir / f'{name}_face_{key}.png')
            first = first or p
        MAT_FACE = _material(f'{name}_Face', first, None)
    return MAT_BODY, MAT_FACE


def _material(name, albedo, orm):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = bpy.data.images.load(str(albedo))
    tex.interpolation = 'Closest' if orm else 'Linear'
    nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    if orm:
        t2 = nt.nodes.new('ShaderNodeTexImage')
        t2.image = bpy.data.images.load(str(orm))
        t2.image.colorspace_settings.name = 'Non-Color'
        t2.interpolation = 'Closest'
        sep = nt.nodes.new('ShaderNodeSeparateColor')
        nt.links.new(t2.outputs['Color'], sep.inputs['Color'])
        nt.links.new(sep.outputs['Green'], bsdf.inputs['Roughness'])
        nt.links.new(sep.outputs['Blue'], bsdf.inputs['Metallic'])
    else:
        bsdf.inputs['Roughness'].default_value = .62
    return m


def emissive_cell(color_name, strength=2.0):
    """returns a separate emissive material using the given palette colour (lantern glass etc.)"""
    m = bpy.data.materials.new(f"{STATE['name']}_Glow")
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    c = tuple(_lin(v / 255) for v in srgb_hex(PALETTE[color_name][0]))
    b.inputs['Base Color'].default_value = (*c, 1)
    b.inputs['Emission Color'].default_value = (*c, 1)
    b.inputs['Emission Strength'].default_value = strength
    return m


def _lin(c):
    return c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4


def cell_uv(name):
    i = NAMES.index(name)
    return ((i % GRID + .5) / GRID, 1 - (i // GRID + .5) / GRID)


# ------------------------------------------------------------------------------ geometry
def link(obj):
    bpy.context.collection.objects.link(obj)
    return obj


def mesh_obj(name, verts, faces):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], faces)
    me.validate()
    me.update()
    return link(bpy.data.objects.new(name, me))


def paint(obj, color, faces=None):
    me = obj.data
    if not me.uv_layers:
        me.uv_layers.new(name='UVMap')
    if not me.materials:
        me.materials.append(MAT_BODY)
    uv = me.uv_layers.active.data
    u = cell_uv(color)
    polys = me.polygons if faces is None else [me.polygons[i] for i in faces]
    for p in polys:
        for li in p.loop_indices:
            uv[li].uv = u
    return obj


def apply_mod(obj, mod):
    with bpy.context.temp_override(object=obj, active_object=obj):
        bpy.ops.object.modifier_apply(modifier=mod.name)


def finish(obj, color, bones, subsurf=0, smooth=True, material=None):
    if obj.matrix_world != Matrix.Identity(4):
        obj.data.transform(obj.matrix_world)
        obj.matrix_world = Matrix.Identity(4)
    if subsurf:
        mod = obj.modifiers.new('sub', 'SUBSURF')
        mod.levels = mod.render_levels = subsurf
        apply_mod(obj, mod)
    if smooth:
        for p in obj.data.polygons:
            p.use_smooth = True
    if material is not None:
        obj.data.materials.clear()
        obj.data.materials.append(material)
        if not obj.data.uv_layers:
            obj.data.uv_layers.new(name='UVMap')
    elif color:
        paint(obj, color)
    PARTS.append((obj, bones))
    return obj


def frame_from(t, ref=None):
    t = t.normalized()
    ref = ref or (Vector((0, 0, 1)) if abs(t.z) < .9 else Vector((1, 0, 0)))
    u = ref - t * ref.dot(t)
    if u.length < 1e-6:
        u = Vector((0, 1, 0)) - t * t.y
    u.normalize()
    return u, t.cross(u)


def loft(name, rings, seg=24, caps=(True, True), ref=None, shape=None, cap_bulge=.25):
    """rings: (center, ra, rb[, twist[, ref]]) ellipse cross sections along a path;
    shape(theta, ring_index) -> radial factor."""
    verts, faces = [], []
    n = len(rings)
    centers = [Vector(r[0]) for r in rings]
    prev_u = None
    for i, r in enumerate(rings):
        c, ra, rb = centers[i], r[1], r[2]
        tw = r[3] if len(r) > 3 else 0
        rref = r[4] if len(r) > 4 else None
        t = centers[min(i + 1, n - 1)] - centers[max(i - 1, 0)]
        u, v = frame_from(t, rref if rref is not None else (ref if ref is not None else prev_u))
        prev_u = u
        for j in range(seg):
            a = 2 * math.pi * j / seg + tw
            k = shape(a, i) if shape else 1
            verts.append(c + (u * math.cos(a) * ra + v * math.sin(a) * rb) * k)
    for i in range(n - 1):
        for j in range(seg):
            a, b = i * seg + j, i * seg + (j + 1) % seg
            faces.append((a, b, b + seg, a + seg))
    if caps[0]:
        verts.append(centers[0] - (centers[1] - centers[0]).normalized() * min(rings[0][1], rings[0][2]) * cap_bulge)
        ci = len(verts) - 1
        faces += [(ci, (j + 1) % seg, j) for j in range(seg)]
    if caps[1]:
        verts.append(centers[-1] + (centers[-1] - centers[-2]).normalized() * min(rings[-1][1], rings[-1][2]) * cap_bulge)
        ci = len(verts) - 1
        base = (n - 1) * seg
        faces += [(ci, base + j, base + (j + 1) % seg) for j in range(seg)]
    return mesh_obj(name, verts, faces)


def ellipsoid(name, center, radii, seg=24, rings=14, rot=None, deform=None):
    verts, faces = [], []
    for i in range(1, rings):
        th = math.pi * i / rings
        for j in range(seg):
            ph = 2 * math.pi * j / seg
            verts.append(Vector((math.sin(th) * math.cos(ph), math.sin(th) * math.sin(ph), math.cos(th))))
    verts += [Vector((0, 0, 1)), Vector((0, 0, -1))]
    top, bot = len(verts) - 2, len(verts) - 1
    for i in range(rings - 2):
        for j in range(seg):
            a, b = i * seg + j, i * seg + (j + 1) % seg
            faces.append((a, b, b + seg, a + seg))
    faces += [(top, j, (j + 1) % seg) for j in range(seg)]
    last = (rings - 2) * seg
    faces += [(bot, last + (j + 1) % seg, last + j) for j in range(seg)]
    rm = rot.to_matrix() if rot else Matrix.Identity(3)
    out = []
    for v in verts:
        p = Vector((v.x * radii[0], v.y * radii[1], v.z * radii[2]))
        if deform:
            p = deform(p, v)
        out.append(Vector(center) + rm @ p)
    ob = mesh_obj(name, out, [tuple(reversed(f)) for f in faces])
    recalc(ob)  # pole fans must wind like the quads, or they render as dark holes
    return ob


def torus(name, center, R, r, seg=32, rseg=10, rot=None, sx=1, sy=1):
    verts, faces = [], []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        for j in range(rseg):
            b = 2 * math.pi * j / rseg
            verts.append(Vector(((R + r * math.cos(b)) * math.cos(a) * sx, (R + r * math.cos(b)) * math.sin(a) * sy, r * math.sin(b))))
    for i in range(seg):
        for j in range(rseg):
            a = i * rseg + j
            b = i * rseg + (j + 1) % rseg
            c = ((i + 1) % seg) * rseg + (j + 1) % rseg
            d = ((i + 1) % seg) * rseg + j
            faces.append((a, d, c, b))
    rm = rot.to_matrix() if rot else Matrix.Identity(3)
    return mesh_obj(name, [Vector(center) + rm @ v for v in verts], faces)


def box(name, center, size, bevel=0.0, rot=None, segments=2):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    if bevel:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, segments=segments, affect='EDGES', profile=.5)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = link(bpy.data.objects.new(name, me))
    rm = (rot.to_matrix() if rot else Matrix.Identity(3)).to_4x4()
    ob.data.transform(Matrix.Translation(Vector(center)) @ rm)
    return ob


def cylinder(name, a, b, r0, r1=None, seg=16, caps=True):
    r1 = r0 if r1 is None else r1
    ob = loft(name, [(Vector(a), r0, r0), (Vector(b), r1, r1)], seg=seg, caps=(caps, caps), cap_bulge=0.0)
    recalc(ob)
    return ob


def tube(name, pts, radii, seg=12, caps=(True, True), ref=None):
    return loft(name, [(p, r, r) for p, r in zip(pts, radii)], seg=seg, caps=caps, ref=ref)


def curve_tube(name, pts, r0, r1, bevel_res=2, taper_pow=1.0):
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = 1.0
    cu.bevel_resolution = bevel_res
    cu.use_fill_caps = True
    sp = cu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    n = len(pts)
    for i, (p, cp) in enumerate(zip(pts, sp.points)):
        cp.co = (*p, 1)
        cp.radius = r0 + (r1 - r0) * ((i / (n - 1)) ** taper_pow)
    ob = link(bpy.data.objects.new(name, cu))
    for o in bpy.context.view_layer.objects:
        o.select_set(o == ob)
    bpy.context.view_layer.objects.active = ob
    with bpy.context.temp_override(selected_objects=[ob], selected_editable_objects=[ob], active_object=ob, object=ob):
        bpy.ops.object.convert(target='MESH')
    ob = bpy.context.view_layer.objects.active
    ob.name = name
    return ob


def bezier_pts(ctrl, n=20):
    pts = []
    for i in range(n):
        t = i / (n - 1)
        q = [Vector(c) for c in ctrl]
        while len(q) > 1:
            q = [q[k].lerp(q[k + 1], t) for k in range(len(q) - 1)]
        pts.append(q[0])
    return pts


def helix(base, axis, length, radius, turns, n=26, phase=0.0, shrink=.5):
    axis = Vector(axis).normalized()
    u, v = frame_from(axis)
    pts = []
    for i in range(n):
        t = i / (n - 1)
        a = phase + 2 * math.pi * turns * t
        r = radius * (1 - shrink * t)
        pts.append(Vector(base) + axis * length * t + (u * math.cos(a) + v * math.sin(a)) * r)
    return pts


def smoothstep(e0, e1, x):
    t = max(0, min(1, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


def gauss(d, s):
    return math.exp(-(d / s) ** 2)


def bvh_of(*objs):
    dg = bpy.context.evaluated_depsgraph_get()
    verts, polys = [], []
    for o in objs:
        e = o.evaluated_get(dg)
        m = e.to_mesh()
        off = len(verts)
        verts += [o.matrix_world @ v.co for v in m.vertices]
        polys += [[off + i for i in p.vertices] for p in m.polygons]
        e.to_mesh_clear()
    return BVHTree.FromPolygons(verts, polys)


def surf(tree, origin, direction, offset=0.0):
    origin, direction = Vector(origin), Vector(direction).normalized()
    hit, n, _, _ = tree.ray_cast(origin, direction, 3.0)
    if hit is None:
        return origin + direction * .2, direction
    if n.dot(direction) < 0:
        n = -n
    return hit + n * offset, n


def wrap_band(name, tree, center, normal, heights, offset, seg=56, thick=.006, prof=None):
    normal = Vector(normal).normalized()
    u, v = frame_from(normal, Vector((1, 0, 0)) if abs(normal.x) < .9 else Vector((0, 1, 0)))
    rows = []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        d = u * math.cos(a) + v * math.sin(a)
        rows.append([surf(tree, Vector(center) + normal * h, d, offset + (prof(k) if prof else 0)) for k, h in enumerate(heights)])
    verts, faces = [], []
    nh = len(heights)
    for row in rows:
        verts += [p + n * thick * .5 for p, n in row]
        verts += [p - n * thick * .5 for p, n in row]
    stride = 2 * nh
    for i in range(seg):
        j = (i + 1) % seg
        for k in range(nh - 1):
            a, b = i * stride + k, j * stride + k
            faces.append((a, a + 1, b + 1, b))
            faces.append((a + nh, b + nh, b + nh + 1, a + nh + 1))
        faces.append((i * stride, j * stride, j * stride + nh, i * stride + nh))
        t = nh - 1
        faces.append((i * stride + t, i * stride + nh + t, j * stride + nh + t, j * stride + t))
    ob = mesh_obj(name, verts, faces)
    recalc(ob)
    return ob


def recalc(ob):
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(ob.data)
    bm.free()


def cut_faces(obj, predicate):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    kill = [f for f in bm.faces if predicate(f.calc_center_median(), f.normal)]
    bmesh.ops.delete(bm, geom=kill, context='FACES')
    bm.to_mesh(obj.data)
    bm.free()


def lumpy(p, v, amount=.02, freq=5.0, seed=0.0):
    """organic bumps for beards/foliage: displace along the unit-sphere direction"""
    n = math.sin(v.x * freq + seed) * math.sin(v.y * freq * 1.3 + seed * 2) * math.sin(v.z * freq * .9 + seed * 3)
    return p + v * amount * n


def make_head(name, center, radii, face_span=.30, nose=None, seg=48, rings=30, front_limit=.26):
    """ellipsoid head whose front faces use the painted face material (front projection)"""
    HZ = center[2]

    def deform(p, v):
        x, y, z = p
        cheek = smoothstep(.15, -.55, v.z) * smoothstep(.2, -.6, v.y)
        x *= 1 + .07 * cheek
        if v.y > 0:
            y *= 1 - .06 * v.y
        if nose:
            nz, depth, size = nose
            d = (Vector((x, z)) - Vector((0, nz))).length
            y -= depth * gauss(d, size) * (v.y < -.7)
        return Vector((x, y, z))

    head = ellipsoid(name, center, radii, seg=seg, rings=rings, deform=deform)
    me = head.data
    me.materials.append(MAT_BODY)
    if MAT_FACE:
        me.materials.append(MAT_FACE)
    uvl = me.uv_layers.new(name='UVMap').data
    su = cell_uv('skin')
    for p in me.polygons:
        c = p.center
        front = MAT_FACE is not None and p.normal.y < -.15 and c.y < center[1] - .05 and abs(c.z - HZ) < front_limit
        p.material_index = 1 if front else 0
        for li in p.loop_indices:
            if front:
                co = me.vertices[me.loops[li].vertex_index].co
                uvl[li].uv = ((co.x - center[0]) / (2 * face_span) + .5, (co.z - HZ) / (2 * face_span) + .5)
            else:
                uvl[li].uv = su
        p.use_smooth = True
    PARTS.append((head, ['head']))
    return head


# ------------------------------------------------------------------------------ rig
def build_rig(name, bones):
    """bones: list of (name, head, tail, parent or None, deform)"""
    arm = bpy.data.armatures.new(name)
    rig = link(bpy.data.objects.new(name, arm))
    bpy.context.view_layer.objects.active = rig
    for o in bpy.context.view_layer.objects:
        o.select_set(o == rig)
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.edit_bones
    for bn, h, t, parent, deform in bones:
        b = eb.new(bn)
        b.head, b.tail = Vector(h), Vector(t)
        b.roll = 0
        b.use_deform = deform
        if parent:
            b.parent = eb[parent]
    for b in eb:
        if b.parent and (b.head - b.parent.tail).length < 1e-4:
            b.use_connect = True
    bpy.ops.object.mode_set(mode='OBJECT')
    STATE['rig'] = rig
    STATE['segs'] = {b.name: (b.head_local.copy(), b.tail_local.copy()) for b in arm.bones}
    STATE['rest_q'] = {b.name: b.matrix_local.to_quaternion() for b in arm.bones}
    STATE['bones'] = [b.name for b in arm.bones]
    for pb in rig.pose.bones:
        pb.rotation_mode = 'QUATERNION'
    return rig


def humanoid_bones(shoulder, arm_dir, upper, fore, hand, hip_x, hips_z, spine_z, chest_z, neck_z, head_z, head_top,
                   knee_z, ankle_z, toe_y=-.11, extra=()):
    B = [('root', (0, 0, 0), (0, -.12, 0), None, False),
         ('hips', (0, 0, hips_z), (0, 0, spine_z), 'root', True),
         ('spine', (0, 0, spine_z), (0, 0, chest_z), 'hips', True),
         ('chest', (0, 0, chest_z), (0, 0, neck_z), 'spine', True),
         ('neck', (0, 0, neck_z), (0, 0, head_z), 'chest', True),
         ('head', (0, 0, head_z), (0, 0, head_top), 'neck', True)]
    for s, side in ((1, 'L'), (-1, 'R')):
        sh = Vector((s * shoulder[0], shoulder[1], shoulder[2]))
        d = Vector((s * arm_dir[0], arm_dir[1], arm_dir[2])).normalized()
        B += [(f'shoulder.{side}', (s * .04, 0, shoulder[2] + .012), sh, 'chest', True),
              (f'upper_arm.{side}', sh, sh + d * upper, f'shoulder.{side}', True),
              (f'forearm.{side}', sh + d * upper, sh + d * (upper + fore), f'upper_arm.{side}', True),
              (f'hand.{side}', sh + d * (upper + fore), sh + d * (upper + fore + hand), f'forearm.{side}', True),
              (f'thigh.{side}', (s * hip_x, .008, hips_z - .02), (s * hip_x, .006, knee_z), 'hips', True),
              (f'shin.{side}', (s * hip_x, .006, knee_z), (s * hip_x, .004, ankle_z), f'thigh.{side}', True),
              (f'foot.{side}', (s * hip_x, .004, ankle_z), (s * hip_x, toe_y, .03), f'shin.{side}', True)]
    return B + list(extra)


def hand_point(side, shoulder, arm_dir, upper, fore, hand, t=.5):
    s = 1 if side == 'L' else -1
    sh = Vector((s * shoulder[0], shoulder[1], shoulder[2]))
    d = Vector((s * arm_dir[0], arm_dir[1], arm_dir[2])).normalized()
    return sh + d * (upper + fore + hand * t), d


def _seg_dist(p, a, b):
    ab = b - a
    t = max(0, min(1, (p - a).dot(ab) / ab.length_squared))
    return (p - (a + ab * t)).length


def skin_and_join(mesh_name):
    rig = STATE['rig']
    segs = STATE['segs']
    for obj, spec in PARTS:
        # entries are bone names or (bone, bias) pairs; bias > 1 pulls weight towards that bone
        bias = {(b if isinstance(b, str) else b[0]): (1.0 if isinstance(b, str) else b[1]) for b in spec}
        bones = list(bias)
        groups = {b: obj.vertex_groups.new(name=b) for b in bones}
        for v in obj.data.vertices:
            if len(bones) == 1:
                groups[bones[0]].add([v.index], 1.0, 'REPLACE')
                continue
            ws = sorted(((b, bias[b] / (_seg_dist(v.co, *segs[b]) + .012) ** 5) for b in bones), key=lambda x: -x[1])[:3]
            tot = sum(w for _, w in ws)
            for b, w in ws:
                if w / tot > .02:
                    groups[b].add([v.index], w / tot, 'REPLACE')
    objs = [o for o, _ in PARTS]
    # the object holding the most materials becomes the join target (keeps slot order)
    target = max(objs, key=lambda o: len(o.data.materials))
    for o in bpy.context.view_layer.objects:
        o.select_set(o in objs)
    bpy.context.view_layer.objects.active = target
    with bpy.context.temp_override(active_object=target, selected_editable_objects=objs, selected_objects=objs):
        bpy.ops.object.join()
    body = target
    body.name = body.data.name = mesh_name
    body.parent = rig
    mod = body.modifiers.new('Rig', 'ARMATURE')
    mod.object = rig
    bpy.context.view_layer.objects.active = body
    with bpy.context.temp_override(object=body, active_object=body):
        bpy.ops.object.vertex_group_normalize_all(lock_active=False)
        bpy.ops.object.vertex_group_limit_total(limit=4)
    STATE['body'] = body
    STATE['tris'] = sum(len(p.vertices) - 2 for p in body.data.polygons)
    print('materials', [m.name for m in body.data.materials], 'triangles', STATE['tris'])
    return body


def join_static(mesh_name):
    """join all parts into one static mesh (props/buildings), no skinning"""
    objs = [o for o, _ in PARTS]
    target = max(objs, key=lambda o: len(o.data.materials))
    for o in bpy.context.view_layer.objects:
        o.select_set(o in objs)
    bpy.context.view_layer.objects.active = target
    with bpy.context.temp_override(active_object=target, selected_editable_objects=objs, selected_objects=objs):
        bpy.ops.object.join()
    target.name = target.data.name = mesh_name
    STATE['body'] = target
    STATE['tris'] = sum(len(p.vertices) - 2 for p in target.data.polygons)
    return target


# ------------------------------------------------------------------------------ animation
def arm_q(x=0, y=0, z=0):
    return (Quaternion((0, 0, 1), math.radians(z)) @ Quaternion((0, 1, 0), math.radians(y)) @
            Quaternion((1, 0, 0), math.radians(x)))


def apply_pose(pose, frame):
    rig = STATE['rig']
    for name in STATE['bones']:
        pb = rig.pose.bones[name]
        x, y, z = pose.get(name, (0, 0, 0))
        rq = STATE['rest_q'][name]
        pb.rotation_quaternion = rq.inverted() @ arm_q(x, y, z) @ rq
        pb.keyframe_insert('rotation_quaternion', frame=frame, group=name)
        if name in ('hips', 'root'):
            pb.location = rq.inverted() @ Vector(pose.get(name + '_loc', (0, 0, 0)))
            pb.keyframe_insert('location', frame=frame, group=name)


def add(p, bone, x=0, y=0, z=0):
    a = p.get(bone, (0, 0, 0))
    p[bone] = (a[0] + x, a[1] + y, a[2] + z)


def arms(p, side, abduct=0, swing=0, elbow=0, twist=0, wrist=0, raise_fore=0):
    """abduct>0 raises sideways, swing>0 moves back, elbow<0 bends forward,
    raise_fore lifts the forearm further in the abduction plane"""
    s = 1 if side == 'L' else -1
    add(p, f'upper_arm.{side}', swing, -s * abduct, twist * s)
    add(p, f'forearm.{side}', elbow, -s * raise_fore, 0)
    add(p, f'hand.{side}', wrist, 0, 0)


def legs(p, side, thigh=0, knee=0, foot=None, spread=0):
    s = 1 if side == 'L' else -1
    add(p, f'thigh.{side}', thigh, -s * spread, 0)
    add(p, f'shin.{side}', knee, 0, 0)
    add(p, f'foot.{side}', -(thigh + knee) * .9 if foot is None else foot, 0, 0)


def lerp_pose(a, b, t):
    return {k: tuple(x + (y - x) * t for x, y in zip(a.get(k, (0, 0, 0)), b.get(k, (0, 0, 0)))) for k in set(a) | set(b)}


def ease(t):
    return t * t * (3 - 2 * t)


def keyed(keys):
    def fn(t, f):
        for (t0, p0), (t1, p1) in zip(keys, keys[1:]):
            if t0 <= t <= t1:
                return lerp_pose(p0, p1, ease((t - t0) / max(1e-6, t1 - t0)))
        return keys[-1][1]
    return fn


def make_action(name, frames, fn, loop=True):
    rig = STATE['rig']
    act = bpy.data.actions.new(name)
    act.use_fake_user = True
    rig.animation_data_create()
    rig.animation_data.action = act
    for f in range(0, frames + 1):
        apply_pose(fn(f / frames, f), f)
    act.frame_range = (0, frames)
    act.use_frame_range = True
    act.use_cyclic = loop
    tr = rig.animation_data.nla_tracks.new()
    tr.name = name
    tr.strips.new(name, 0, act)
    tr.mute = True
    rig.animation_data.action = None
    STATE.setdefault('actions', {})[name] = act
    return act


def export(glb_path, blend_path, objects=None):
    rig = STATE.get('rig')
    body = STATE['body']
    if rig and STATE.get('actions'):
        rig.animation_data.action = STATE['actions'].get('Idle')
        bpy.context.scene.frame_set(0)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    sel = objects or [o for o in (rig, body) if o]
    for o in bpy.context.view_layer.objects:
        o.select_set(o in sel)
    kw = dict(filepath=str(glb_path), export_format='GLB', use_selection=True, export_apply=False,
              export_animations=bool(rig), export_animation_mode='ACTIONS', export_nla_strips=True,
              export_force_sampling=True, export_frame_step=1, export_def_bones=True, export_skins=True,
              export_morph=False, export_yup=True, export_texcoords=True, export_normals=True,
              export_image_format='AUTO', export_materials='EXPORT', export_extras=False,
              export_anim_single_armature=True, export_reset_pose_bones=True, export_optimize_animation_size=False)
    props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    bpy.ops.export_scene.gltf(**{k: v for k, v in kw.items() if k in props})
    print('exported', glb_path, 'triangles', STATE['tris'])


# ------------------------------------------------------------------------------ faces
def paint_face(skin=(246, 200, 166), eyes='open', mouth='smile', iris=((44, 22, 10), (150, 82, 34)),
               eye_x=.105, eye_z=-.040, eye_w=.078, eye_h=.090, mouth_z=-.140, mouth_w=.040,
               blush=(242, 128, 118, 170), lashes=False, brows=None, span=.30, size=1024):
    """generic painted chibi face (front projection, same layout as ngoc_face)"""
    from PIL import Image, ImageDraw, ImageFilter
    SS = 2
    S = size * SS

    def P(x, z):
        return ((x / (2 * span) + .5) * S, (.5 - z / (2 * span)) * S)

    def L(m):
        return m / (2 * span) * S

    def ell(d, cx, cz, rx, rz, fill):
        x0, y0 = P(cx - rx, cz + rz)
        x1, y1 = P(cx + rx, cz - rz)
        d.ellipse([x0, y0, x1, y1], fill=fill)

    def arc(cx, cz, rx, rz, a0, a1, t0, t1, n=40):
        o, i_ = [], []
        for k in range(n + 1):
            t = k / n
            a = math.radians(a0 + (a1 - a0) * t)
            th = t0 + (t1 - t0) * t
            ox, oz = cx + rx * math.cos(a), cz + rz * math.sin(a)
            o.append(P(ox + math.cos(a) * th / 2, oz + math.sin(a) * th / 2))
            i_.append(P(ox - math.cos(a) * th / 2, oz - math.sin(a) * th / 2))
        return o + i_[::-1]

    img = Image.new('RGBA', (S, S), tuple(skin) + (255,))

    def soft(fn, blur, color):
        m = Image.new('L', img.size, 0)
        fn(ImageDraw.Draw(m))
        m = m.filter(ImageFilter.GaussianBlur(blur))
        lay = Image.new('RGBA', img.size, color[:3] + (255,))
        lay.putalpha(m.point(lambda a: a * color[3] // 255))
        img.alpha_composite(lay)

    if blush:
        soft(lambda d: [ell(d, s * (eye_x + .058), eye_z - .058, .036, .020, 255) for s in (-1, 1)], L(.012), blush)
    d = ImageDraw.Draw(img)
    dark = (40, 18, 10, 255)
    for s in (-1, 1):
        cx = eye_x * s
        if eyes == 'open':
            ell(d, cx, eye_z, eye_w / 2, eye_h / 2, (255, 250, 244, 255))
            steps = 28
            for k in range(steps):
                t = k / (steps - 1)
                col = tuple(int(iris[0][c] + (iris[1][c] - iris[0][c]) * t ** 1.6) for c in range(3)) + (255,)
                kk = 1 - t * .55
                ell(d, cx, eye_z - eye_h * .45 * (1 - kk) * .9, eye_w * .45 * kk, eye_h * .45 * kk, col)
            ell(d, cx, eye_z + eye_h * .04, eye_w * .19, eye_h * .23, (24, 10, 6, 255))
            ell(d, cx + eye_w * .16 * s, eye_z + eye_h * .20, eye_w * .15, eye_h * .14, (255, 255, 255, 255))
            ell(d, cx - eye_w * .17 * s, eye_z - eye_h * .20, eye_w * .075, eye_h * .065, (255, 255, 255, 235))
            th = .016 if lashes else .010
            d.polygon(arc(cx, eye_z + eye_h * .02, eye_w * .53, eye_h * .50, 20, 160, th, th), fill=dark)
            if lashes:
                ox, oz = cx + s * eye_w * .5, eye_z + eye_h * .22
                d.polygon([P(ox - s * .008, oz - .004), P(ox + s * .024, oz + .020), P(ox - s * .004, oz + .008)], fill=dark)
        elif eyes == 'happy':
            d.polygon(arc(cx, eye_z - .016, eye_w * .52, eye_h * .40, 18, 162, .014, .014), fill=dark)
        else:  # closed (blink)
            d.polygon(arc(cx, eye_z + .018, eye_w * .52, eye_h * .32, 200, 340, .012, .012), fill=dark)
        if brows:
            d.polygon(arc(cx, eye_z + eye_h * .5 + .028, .032, .014, 35, 145, .010, .010, 20), fill=brows)
    mz = mouth_z
    if mouth in ('smile', 'laugh'):
        w, h = mouth_w, (.050 if mouth == 'laugh' else .040)
        pts = [P(-w * math.cos(math.pi * k / 40), mz + .010 - h * math.sin(math.pi * k / 40) ** .9) for k in range(41)]
        top = [P(w * (1 - 2 * k / 20), mz + .010 + .006 * abs(1 - 2 * k / 20) ** 2) for k in range(21)]
        poly = pts + top
        d.polygon(poly, fill=(112, 30, 34, 255))
        mask = Image.new('L', img.size, 0)
        ImageDraw.Draw(mask).polygon(poly, fill=255)
        t = Image.new('RGBA', img.size, (0, 0, 0, 0))
        ell(ImageDraw.Draw(t), 0, mz - h * .65, w * .65, h * .45, (236, 112, 112, 255))
        img.paste(t, (0, 0), Image.composite(t, Image.new('RGBA', img.size, (0, 0, 0, 0)), mask).split()[3])
        d = ImageDraw.Draw(img)
    elif mouth == 'talk':
        ell(d, 0, mz - .010, mouth_w * .55, .024, (112, 30, 34, 255))
        ell(d, 0, mz - .022, mouth_w * .38, .010, (236, 112, 112, 255))
    else:
        d.polygon(arc(0, mz + .004, mouth_w * .75, .018, 200, 340, .006, .006), fill=(150, 56, 50, 255))
    return img.resize((size, size), Image.LANCZOS).convert('RGB')


def patch_glb_materials(path, fn):
    """rewrite the JSON chunk of a .glb so fn(material_dict) can set alphaMode/doubleSided etc."""
    import json, struct
    data = bytearray(open(path, 'rb').read())
    jlen = struct.unpack_from('<I', data, 12)[0]
    doc = json.loads(data[20:20 + jlen].decode('utf-8'))
    for m in doc.get('materials', []):
        fn(m)
    js = json.dumps(doc, separators=(',', ':')).encode('utf-8')
    js += b' ' * ((4 - len(js) % 4) % 4)
    rest = data[20 + jlen:]
    out = bytearray(data[:12]) + struct.pack('<I', len(js)) + b'JSON' + js + rest
    struct.pack_into('<I', out, 8, len(out))
    open(path, 'wb').write(out)
