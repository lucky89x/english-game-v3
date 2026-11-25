"""Shared helpers for the hero's accessories (build_hero_acc.py, run inside bpy 4.2).
Every accessory is authored directly in the hero's own coordinates (chr_hero_v01.glb: metres, Blender Z up, front = -Y),
so the game hangs it on a bone with the bone's inverse matrix and it lands exactly where it was drawn (no fitting in code).
Fitting is done against the real body: BVH of the Hero mesh + the dress + the sleeves (`ray`, `onhead`, `ring_at`).
Landmarks measured on the model (tools notes, 25/11): head centre C, eyes at x = C.x +- 0.07, z = 1.316, face plane y ~ -0.21,
ears at x = C.x +- 0.18, z = 1.30, neck axis (0, -0.06), wrist of hand.L at x = 0.45, axis (y -0.058, z 1.08).
"""
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "harbor"))
from hlib import *  # noqa
import hlib
import bpy, bmesh
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
HERO = os.path.join(REPO, "assets", "models", "chr_hero_v01.glb")
C = Vector((-0.007, -0.02, 1.40))            # head centre
TREE = None
V = Vector


def load_body():
    """import the hero once; BVH of the skin + dress + sleeves (what an accessory can touch)"""
    global TREE
    bpy.ops.import_scene.gltf(filepath=HERO)
    keep = ("Hero", "Outfit_dress", "Outfit_sleeve_l", "Outfit_sleeve_r")
    vs, fs = [], []
    for o in bpy.data.objects:
        if o.type == 'MESH' and o.name in keep:
            b = len(vs)
            vs += [o.matrix_world @ v.co for v in o.data.vertices]
            fs += [[b + i for i in p.vertices] for p in o.data.polygons]
    TREE = BVHTree.FromPolygons(vs, fs)
    for o in bpy.data.objects:                # show the bind pose (the pose the accessories are drawn in), not the pose of the rig's nodes
        if o.type == 'MESH':
            o.modifiers.clear()
    for o in bpy.data.objects:                # hide what is not the body in the preview renders
        if o.type == 'MESH' and o.name not in ("Hero", "Outfit_dress", "Outfit_sleeve_l", "Outfit_sleeve_r"):
            o.hide_render = True
            o.hide_viewport = True
    return TREE


def ray(origin, d, far=2.0):
    """first surface hit from origin along d (distance), or None"""
    d = Vector(d).normalized()
    h = TREE.ray_cast(Vector(origin), d, far)
    return h[3] if h[0] is not None else None


def onhead(az, el, off=0.0, origin=None):
    """point on the head surface seen from the head centre: az = degrees from the front towards +X, el = degrees above the horizon"""
    a, e = math.radians(az), math.radians(el)
    d = Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))
    o = origin or C
    r = ray(o, d)
    return o + d * ((r if r else 0.25) + off), d


def around(axis, z, ang, off=0.0, clamp=None, exact=False):
    """point on the body surface at height z, seen horizontally from axis (x, y): ang = degrees from the front towards +X.
    The nearest hit over a few nearby heights and angles (the skin has gaps for a single ray); clamp = (rx, ry) caps the distance
    to that ellipse (the neck is a thin tube: a ray along +X can slip past it onto the shoulder)."""
    best = None
    for dz in ((0.0,) if exact else (-0.02, -0.01, 0.0, 0.01, 0.02)):
        for da in ((0,) if exact else (-3, 0, 3)):
            a = math.radians(ang + da)
            d = Vector((math.sin(a), -math.cos(a), 0))
            r = ray(Vector((axis[0], axis[1], z + dz)), d)
            if r and (best is None or r < best):
                best = r
    a = math.radians(ang)
    d = Vector((math.sin(a), -math.cos(a), 0))
    if best is None:
        best = 0.1
    if clamp:
        rx, ry = clamp
        best = min(best, 1.0 / math.sqrt((d.x / rx) ** 2 + (d.y / ry) ** 2))
    return Vector((axis[0], axis[1], z)) + d * (best + off), d


def tube(pts, r, m, seg=6, closed=False):
    """round tube along a polyline; r = radius or a list of radii"""
    n = len(pts)
    rs = r if isinstance(r, (list, tuple)) else [r] * n
    verts, faces = [], []
    for i, p in enumerate(pts):
        t = (pts[(i + 1) % n] - pts[(i - 1) % n]) if closed else (pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)])
        t = t.normalized()
        a = Vector((0, 0, 1)) if abs(t.z) < 0.9 else Vector((1, 0, 0))
        u = t.cross(a).normalized()
        v = t.cross(u).normalized()
        for k in range(seg):
            g = 2 * math.pi * k / seg
            verts.append(p + (u * math.cos(g) + v * math.sin(g)) * rs[i])
    rings = n if closed else n - 1
    for i in range(rings):
        j = (i + 1) % n
        for k in range(seg):
            k2 = (k + 1) % seg
            faces.append([i * seg + k, j * seg + k, j * seg + k2, i * seg + k2])
    if not closed:
        faces.append(list(range(seg))[::-1])
        faces.append([(n - 1) * seg + k for k in range(seg)])
    return mesh(verts, faces, m)


def ribbon(pts, sides, m, thick=0.0):
    """flat band along pts; sides[i] = half-width vector at point i (so the band lies on a surface); optional thickness along the normal"""
    n = len(pts)
    verts, faces = [], []
    for p, s in zip(pts, sides):
        verts += [tuple(p - s), tuple(p + s)]
    for i in range(n - 1):
        a = 2 * i
        faces.append([a, a + 2, a + 3, a + 1])
    return mesh(verts, faces, m)


def plate(poly, th, m, scale=1.0, center=(0, 0, 0)):
    """flat shape: poly = [(x, z), ...] in the XZ plane, thickness th along Y, centred on `center`, facing -Y"""
    cx, cy, cz = center
    n = len(poly)
    verts = [(cx + x * scale, cy + th / 2, cz + z * scale) for x, z in poly] + [(cx + x * scale, cy - th / 2, cz + z * scale) for x, z in poly]
    faces = [list(range(n))[::-1], list(range(n, 2 * n))]
    for i in range(n):
        j = (i + 1) % n
        faces.append([i, j, n + j, n + i])
    return mesh(verts, faces, m)


def heart_poly(k=24):
    pts = []
    for i in range(k):
        t = 2 * math.pi * i / k
        pts.append((16 * math.sin(t) ** 3 / 17.0, (13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t) + 2.5) / 17.0))
    return pts


def star_poly(points=5, ro=1.0, ri=0.45):
    pts = []
    for i in range(points * 2):
        r = ro if i % 2 == 0 else ri
        a = math.pi / 2 + math.pi * i / points
        pts.append((r * math.cos(a), r * math.sin(a)))
    return pts


def place(start, pos, nrm, roll=0.0, up='Z'):
    """move every part built since index `start` from a model drawn at the origin facing -Y (up = +Z) to pos, facing nrm"""
    bpy.context.view_layer.update()          # matrix_world is stale until the view layer updates
    q = Vector(nrm).to_track_quat('-Y', up)
    M = Matrix.Translation(pos) @ q.to_matrix().to_4x4() @ Matrix.Rotation(roll, 4, 'Y')
    for o in OBJS[start:]:
        o.matrix_world = M @ o.matrix_world


def mirror(start, x=0.0):
    """copy the parts built since `start` mirrored across the plane X = x (same material), for left/right pairs"""
    new = []
    bpy.context.view_layer.update()
    for o in list(OBJS[start:]):
        c = o.copy()
        c.data = o.data.copy()
        bpy.context.collection.objects.link(c)
        c.matrix_world = Matrix.Translation((2 * x, 0, 0)) @ Matrix.Scale(-1, 4, (1, 0, 0)) @ o.matrix_world
        bm = bmesh.new()
        bm.from_mesh(c.data)
        bm.to_mesh(c.data)
        bm.free()
        new.append(c)
    OBJS.extend(new)


def bend(o, z0, k, axis=1):
    """shear the object's vertices above z0 sideways along `axis` (0 = x, 1 = y) by k * (z - z0)^2 (a bent hat tip)"""
    for v in o.data.vertices:
        if v.co.z > z0:
            v.co[axis] += k * (v.co.z - z0) ** 2


def hmats():
    return dict(main=mat("tint_main", "#CCCCCC", rough=.6), trim=mat("tint_trim", "#CCCCCC", rough=.5),
                glass=mat("glass", "#DDEFF5", rough=.03, alpha=.3), metal=mat("metal", "#C9B27A", rough=.3, metal=.85),
                dark=mat("dark", "#1b1b26", rough=.12), leaf=mat("leaf", "#58a640", rough=.7), pearl=mat("pearl", "#f4efe6", rough=.25))


def start():
    return len(OBJS)
