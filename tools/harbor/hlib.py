"""Shared helpers for the Sunny Harbor (Map 2) models. Imported by build_harbor.py inside Blender.
Conventions: metres; Blender Z up; front of every model faces Blender -Y, which the glTF exporter
(+Y up) turns into +Z, the facing the game expects (same as the animals and prop_* models).
Origin = centre of the base at Z=0 unless a builder keeps its own Z (the ship keeps its waterline).
"""
import bpy, bmesh, os, math, random, mathutils
from mathutils import Vector

OUT = os.environ.get("OUT", ".")
MATS = {}
OBJS = []      # parts waiting to be joined into one named object
GROUPS = []    # finished named objects for the current file


def lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return [(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in c] + [1.0]


def mat(name, hexc, emit=0.0, rough=0.75, metal=0.0, alpha=1.0):
    """one flat-colour material; emit > 0 makes it glow (used for light_* materials)"""
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = lin(hexc)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = lin(hexc)
        b.inputs['Emission Strength'].default_value = emit
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
        try:
            m.surface_render_method = 'BLENDED'
        except Exception:
            pass
    m.diffuse_color = lin(hexc)[:3] + [alpha]
    MATS[name] = m
    return m


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    MATS.clear()
    OBJS.clear()
    GROUPS.clear()


def _obj_from_bm(bm, name="part"):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    return o


def _fin(o, m, jit=0.0, seed=1):
    if m is not None:
        o.data.materials.append(m)
    if jit:
        r = random.Random(seed)
        for v in o.data.vertices:
            v.co += Vector((r.uniform(-jit, jit), r.uniform(-jit, jit), r.uniform(-jit, jit)))
    OBJS.append(o)
    return o


def box(size, loc, m, rot=(0, 0, 0), bev=0.0):
    """box of full size (sx, sy, sz) centred at loc; bev = chamfer width in metres (1 segment)"""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    if bev:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bev, segments=1, affect='EDGES', profile=0.5)
    o = _obj_from_bm(bm)
    o.location = loc
    o.rotation_euler = rot
    return _fin(o, m)


def quad(center, u, v, m):
    """single flat quad: centre + half-axis vectors u, v (normal = u x v)"""
    c, u, v = Vector(center), Vector(u), Vector(v)
    bm = bmesh.new()
    vs = [bm.verts.new(c - u - v), bm.verts.new(c + u - v), bm.verts.new(c + u + v), bm.verts.new(c - u + v)]
    bm.faces.new(vs)
    return _fin(_obj_from_bm(bm), m)


def cyl(r, h, loc, m, seg=8, r2=None, rot=(0, 0, 0), scale=(1, 1, 1), cap=True):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=seg, radius1=r,
                          radius2=r if r2 is None else r2, depth=h)
    o = _obj_from_bm(bm)
    o.location, o.rotation_euler, o.scale = loc, rot, scale
    return _fin(o, m)


def ball(r, loc, m, sub=1, scale=(1, 1, 1), rot=(0, 0, 0), jit=0, seed=1, uv=None):
    bm = bmesh.new()
    if uv:
        bmesh.ops.create_uvsphere(bm, u_segments=uv[0], v_segments=uv[1], radius=r)
    else:
        bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    o = _obj_from_bm(bm)
    o.location, o.rotation_euler, o.scale = loc, rot, scale
    return _fin(o, m, jit, seed)


def torus(R, r, loc, m, seg=10, mseg=4, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=seg,
                                     minor_segments=mseg, location=loc, rotation=rot)
    return _fin(bpy.context.object, m)


def beam(p1, p2, w, m, w2=None, seg=0):
    """square beam (or seg-sided rod when seg>0) between two points"""
    a, b = Vector(p1), Vector(p2)
    d = b - a
    if seg:
        o = cyl(w / 2, d.length, (a + b) / 2, m, seg)
        OBJS.pop()
    else:
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        for v in bm.verts:
            v.co = Vector((v.co.x * w, v.co.y * (w2 or w), v.co.z * d.length))
        o = _obj_from_bm(bm)
        o.location = (a + b) / 2
        o.data.materials.append(m)
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = d.to_track_quat('Z', 'Y')
    if seg:
        o.data.materials.clear()
        o.data.materials.append(m)
    OBJS.append(o)
    return o


def rod(p1, p2, r1, r2, m, seg=8, cap=True):
    """tapered round rod from p1 (radius r1) to p2 (radius r2)"""
    a, b = Vector(p1), Vector(p2)
    d = b - a
    o = cyl(r1, d.length, (a + b) / 2, m, seg, r2=r2, cap=cap)
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = d.to_track_quat('Z', 'Y')
    return o


def mesh(verts, faces, m, mats=None):
    """raw mesh; mats = list of material per face (index into the list of materials given in m)"""
    bm = bmesh.new()
    vs = [bm.verts.new(v) for v in verts]
    for i, f in enumerate(faces):
        fa = bm.faces.new([vs[k] for k in f])
        if mats:
            fa.material_index = mats[i]
    o = _obj_from_bm(bm)
    for mm in (m if isinstance(m, (list, tuple)) else [m]):
        o.data.materials.append(mm)
    OBJS.append(o)
    return o


def lathe(profile, m, seg=12, loc=(0, 0, 0), mats=None, scale=(1, 1, 1)):
    """revolve [(r, z), ...] around Z. mats: material index per profile segment."""
    verts, faces, fm = [], [], []
    n = len(profile)
    for s in range(seg):
        a = 2 * math.pi * s / seg
        for r, z in profile:
            verts.append((r * math.cos(a), r * math.sin(a), z))
    for s in range(seg):
        s2 = (s + 1) % seg
        for i in range(n - 1):
            if profile[i][0] < 1e-5 and profile[i + 1][0] < 1e-5:
                continue
            faces.append([s * n + i, s2 * n + i, s2 * n + i + 1, s * n + i + 1])
            fm.append(mats[i] if mats else 0)
    o = mesh(verts, faces, m, fm if mats else None)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=1e-5)
    bm.to_mesh(o.data)
    bm.free()
    o.location, o.scale = loc, scale
    return o


def panel(u0, u1, v0, v1, pitch, depth, mp, m, flip=False):
    """corrugated sheet: profile along u, straight along v. mp(u, v, d) -> world point.
    d = 0 at the valley, depth at the ridge."""
    pts = []
    u, k = u0, 0
    seq = [(0.38, depth), (0.12, None), (0.38, 0.0), (0.12, None)]
    while u < u1 - 1e-6:
        pts.append((u, depth if k % 4 < 2 else 0.0))
        step = seq[k % 4][0] * pitch
        u = min(u1, u + step)
        k += 1
    pts.append((u1, pts[-1][1]))
    verts = []
    for uu, d in pts:
        verts.append(mp(uu, v0, d))
        verts.append(mp(uu, v1, d))
    faces = []
    for i in range(len(pts) - 1):
        a, b = 2 * i, 2 * i + 2
        f = [a, b, b + 1, a + 1]
        faces.append(f[::-1] if flip else f)
    return mesh(verts, faces, m)


def assign_bone(o, bone):
    """rigid-skin a part to one bone (used before group() so the vertex group survives the join)"""
    vg = o.vertex_groups.new(name=bone)
    vg.add([v.index for v in o.data.vertices], 1.0, 'REPLACE')


def tag(bone, start):
    """assign every part created since index start to bone"""
    for o in OBJS[start:]:
        if not o.vertex_groups:
            assign_bone(o, bone)


def group(name, origin='base', smooth=False, keep_loc=False):
    """join pending parts into one object `name`; origin 'base' = centre of the base at z=0,
    'xy' = centre in x/y but keep z, None = keep world coordinates."""
    bpy.ops.object.select_all(action='DESELECT')
    for o in OBJS:
        o.select_set(True)
    bpy.context.view_layer.objects.active = OBJS[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    if len(OBJS) > 1:
        bpy.ops.object.join()
    o = bpy.context.object
    o.name = name
    o.data.name = name
    for p in o.data.polygons:
        p.use_smooth = smooth
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0003)
    bm.to_mesh(o.data)
    bm.free()
    # drop material slots no face uses
    used = {p.material_index for p in o.data.polygons}
    for i in reversed(range(len(o.data.materials))):
        if i not in used:
            o.active_material_index = i
            bpy.ops.object.material_slot_remove()
    if origin:
        pts = [v.co for v in o.data.vertices]
        cx = (min(p.x for p in pts) + max(p.x for p in pts)) / 2
        cy = (min(p.y for p in pts) + max(p.y for p in pts)) / 2
        cz = min(p.z for p in pts) if origin == 'base' else 0.0
        for v in o.data.vertices:
            v.co -= Vector((cx, cy, cz))
        o.location = (cx, cy, cz) if keep_loc else (0, 0, 0)
    OBJS.clear()
    GROUPS.append(o)
    return o


def tris(o):
    return sum(len(p.vertices) - 2 for p in o.data.polygons)


def export(fname, objs=None, anim=False):
    objs = objs or GROUPS
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
        for c in o.children:
            c.select_set(True)
        if o.parent:
            o.parent.select_set(True)
    kw = dict(filepath=os.path.join(OUT, fname + ".glb"), export_format='GLB', export_yup=True,
              export_apply=True, use_selection=True, export_image_format='NONE')
    if anim:
        kw.update(export_animations=True, export_animation_mode='ACTIONS', export_skins=True,
                  export_force_sampling=True)
    else:
        kw.update(export_animations=False)
    bpy.ops.export_scene.gltf(**kw)
    tot = 0
    for o in objs:
        if o.type == 'MESH':
            d = o.dimensions
            t = tris(o)
            tot += t
            print("BUILT", fname, o.name, "tris", t, "size", round(d.x, 2), round(d.y, 2), round(d.z, 2))
    print("FILE", fname, "tris", tot)
