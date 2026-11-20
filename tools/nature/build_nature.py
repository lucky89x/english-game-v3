"""Batch 16: nature set. Run: OUT=<folder> blender -b -P tools/nature/build_nature.py (optional ONLY=nat_pine_a,...)
Feet at 0, centred. Trees: separate materials trunk, leaf_a, leaf_b (two tones, the game may tint them by season).
<= 900 triangles (big trees <= 1,600, background mountains <= 600). Flat facets, low-poly.
"""
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "harbor"))
from hlib import *  # noqa
import bpy, bmesh
from mathutils import Vector, Matrix

ONLY = [s for s in os.environ.get("ONLY", "").split(",") if s]
TAU = 2 * math.pi


def blob(r, loc, m, seed, scale=(1, 1, 1), sub=2, jag=.12):
    rnd = random.Random(seed)
    o = ball(r, loc, m, sub=sub, scale=scale)
    for v in o.data.vertices:
        v.co *= 1 + rnd.uniform(-jag, jag)
    return o


def leaves(a="#3F8F3E", b="#6CB24E"):
    return mat("trunk", "#7A5230", rough=.9), mat("leaf_a", a, rough=.8), mat("leaf_b", b, rough=.8)


def done(name, fname, H=None, z_only=False):
    """join and export; H = exact height to scale the model to (feet stay at 0)"""
    if H:
        bpy.context.view_layer.update()
        top = max((o.matrix_world @ Vector(c)).z for o in OBJS for c in o.bound_box)
        k = H / top
        for o in OBJS:
            o.matrix_world = Matrix.Diagonal((1 if z_only else k, 1 if z_only else k, k, 1)) @ o.matrix_world
    group(name)
    export(fname)


# ------------------------------------------------------------------ pines
def pine(fname, H, tiers, seed):
    reset()
    trunk, la, lb = leaves("#2F7A45", "#5DA860")
    rnd = random.Random(seed)
    cyl(.16 * H / 8, H * .45, (0, 0, H * .225), trunk, 7, r2=.09 * H / 8)
    for k in range(3):   # stubby branch knots
        a = rnd.uniform(0, TAU)
        z = H * rnd.uniform(.08, .25)
        rod((0, 0, z), (.35 * H / 8 * math.cos(a), .35 * H / 8 * math.sin(a), z + .2), .05 * H / 8, .02 * H / 8, trunk, 5)
    z = H * .18
    for i in range(tiers):
        f = i / tiers
        R = (1 - .72 * f) * H * .27
        h = H * (.34 - .1 * f)
        o = cyl(R, h, (0, 0, z + h / 2), la, 12, r2=R * .12)
        for v in o.data.vertices:   # saw-tooth rim
            if v.co.z < 0:
                ang = math.atan2(v.co.y, v.co.x)
                k_ = 1.12 if int(round(ang / (TAU / 12))) % 2 else .92
                v.co.x *= k_
                v.co.y *= k_
                v.co.z -= .06 * H / 8 * (k_ > 1)
        lathe([(R * 1.04, z - .02), (R * .9, z + h * .12), (R * .82, z + h * .1)], lb, seg=12)    # lighter edge
        z += h * .55
    cyl(R * .4, H * .1, (0, 0, z + H * .04), la, 8, r2=0)
    done("pine", fname, H)


# ------------------------------------------------------------------ round / oak-like trees
def round_tree(fname, H, n, seed, colors=("#3F8F3E", "#6CB24E"), blossom=False):
    reset()
    trunk, la, lb = leaves(*colors)
    rnd = random.Random(seed)
    hT = H * .45
    pts = [Vector((0, 0, 0))]
    for i in range(1, 5):   # gently twisting trunk
        pts.append(Vector((.12 * math.sin(i * 1.3 + seed), .1 * math.cos(i * 1.1), hT * i / 4)))
    r0 = H * .05
    for i in range(4):
        rod(tuple(pts[i]), tuple(pts[i + 1]), r0 * (1 - .15 * i), r0 * (1 - .15 * (i + 1)), trunk, 7)
    for k in range(4):   # surface roots
        a = k * TAU / 4 + .4
        rod((0, 0, .25), (H * .11 * math.cos(a), H * .11 * math.sin(a), 0), r0 * .6, r0 * .2, trunk, 5)
    top = pts[-1]
    for k in range(3 if not blossom else 5):   # main branches
        a = k * TAU / 3 + seed
        end = top + Vector((H * .14 * math.cos(a), H * .14 * math.sin(a), H * .12))
        rod(tuple(top - Vector((0, 0, .2))), tuple(end), r0 * .55, r0 * .2, trunk, 5)
    cr = H * .2
    centers = [top + Vector((0, 0, cr * .9))]
    for k in range(n - 1):
        a = k * TAU / (n - 1) + rnd.uniform(-.2, .2)
        rr = cr * rnd.uniform(.85, 1.15)
        centers.append(top + Vector((rr * math.cos(a), rr * math.sin(a), cr * rnd.uniform(.2, 1.1))))
    for k, c in enumerate(centers):
        s = cr * (.95 if k == 0 else rnd.uniform(.62, .8))
        blob(s, tuple(c), la if k % 2 else lb, seed + k, sub=2, jag=.14)
    if blossom:   # a few petals falling and on the ground
        for k in range(14):
            a, r = rnd.uniform(0, TAU), rnd.uniform(.4, H * .35)
            z = rnd.uniform(.02, H * .5) if k % 2 else .02
            ball(.06, (r * math.cos(a), r * math.sin(a), z), lb, sub=1, scale=(1, 1, .25), rot=(rnd.uniform(0, 3), 0, 0))
    done("tree", fname, H)


# ------------------------------------------------------------------ bushes
def bush(fname, kind, seed):
    reset()
    trunk, la, lb = leaves()
    rnd = random.Random(seed)
    H = {"a": .9, "b": 1.0, "c": 1.1}[kind]
    for k in range(5):
        a = k * TAU / 5
        r = H * .28 if k else 0
        blob(H * (.42 if k == 0 else .32), (r * math.cos(a), r * math.sin(a), H * (.5 if k == 0 else .35)), la if k % 2 else lb, seed + k)
    if kind == "b":
        berry = mat("berry_red", "#D8322E", rough=.35)
        for k in range(14):
            a, e = rnd.uniform(0, TAU), rnd.uniform(.1, 1.1)
            ball(.05, (H * .48 * math.cos(a) * math.cos(e), H * .45 * math.sin(a) * math.cos(e), H * .45 + H * .4 * math.sin(e)), berry, sub=1)
    if kind == "c":
        pink, yellow = mat("flower_pink", "#F28AB3", rough=.6), mat("flower_yellow", "#F5C842", rough=.6)
        for k in range(10):
            a, e = rnd.uniform(0, TAU), rnd.uniform(.2, 1.2)
            c = Vector((H * .48 * math.cos(a) * math.cos(e), H * .45 * math.sin(a) * math.cos(e), H * .45 + H * .42 * math.sin(e)))
            n = (c - Vector((0, 0, H * .45))).normalized()
            cyl(.07, .015, tuple(c), pink if k % 2 else yellow, 5, rot=n.to_track_quat('Z', 'Y').to_euler())      # 5-petal flower disc
            ball(.025, tuple(c + n * .012), yellow if k % 2 else pink, sub=1)
    done("bush", fname)


# ------------------------------------------------------------------ rocks
def rock_mats():
    return mat("rock_grey", "#8C8A84", rough=.95), mat("rock_light", "#B4B0A6", rough=.95), mat("rock_moss", "#6E8A58", rough=.95)


def rock(H, loc, seed, sub=2, flat=.75):
    grey, light, moss = rock_mats()
    rnd = random.Random(seed)
    o = ball(H / (2 * flat), loc, grey, sub=sub, scale=(1, .85, flat))
    for v in o.data.vertices:
        v.co *= 1 + rnd.uniform(-.2, .2)
    o.data.materials.append(light)
    o.data.materials.append(moss)
    side = rnd.uniform(0, TAU)
    for p in o.data.polygons:   # pale tops, moss on one side
        n = p.normal
        if n.z > .55:
            p.material_index = 1
        elif n.x * math.cos(side) + n.y * math.sin(side) > .45 and n.z > -.3:
            p.material_index = 2
    return o


def rock_single(fname, H, seed):
    reset()
    rock(H, (0, 0, H / 2), seed, sub=2 if H < 2 else 3)
    done("rock", fname, H)


def rock_cluster(fname):
    reset()
    rnd = random.Random(12)
    for k, (h, x, y) in enumerate(((1.4, 0, 0), (.8, 1.0, .3), (.6, -.9, .4), (.5, .3, -.9), (.35, -.5, -.7))):
        rock(h, (x, y, h * .45), 30 + k, sub=2)
    grass = mat("grass_green", "#5FA040", rough=.8)
    for k in range(10):
        a, r = rnd.uniform(0, TAU), rnd.uniform(.6, 1.6)
        cyl(.05, .3, (r * math.cos(a), r * math.sin(a), .15), grass, 3, r2=0, rot=(rnd.uniform(-.3, .3), rnd.uniform(-.3, .3), 0))
    done("rock_cluster", fname)


# ------------------------------------------------------------------ logs, stumps, mushrooms
def log():
    reset()
    trunk, ring = mat("trunk", "#7A5230", rough=.9), mat("wood_ring", "#D9B07A", rough=.85)
    cap, dots, stem = mat("cap_red", "#D8352E", rough=.5), mat("cap_dots", "#FFF8EC", rough=.6), mat("stem_cream", "#F2E2C2", rough=.7)
    cyl(.3, 2.2, (0, 0, .3), trunk, 10, rot=(0, math.pi / 2, 0))
    for s in (-1, 1):
        cyl(.27, .02, (s * 1.105, 0, .3), ring, 10, rot=(0, math.pi / 2, 0))
        torus(.15, .015, (s * 1.115, 0, .3), trunk, 10, 3, rot=(0, math.pi / 2, 0))
    rod((.4, .1, .45), (.6, .45, .75), .06, .03, trunk, 5)
    for k, (x, y) in enumerate(((-.5, -.26), (-.3, -.28), (.2, -.27))):
        cyl(.02, .08, (x, y, .32), stem, 6)
        ball(.06 - .01 * k, (x, y - .01, .37), cap, uv=(8, 4), scale=(1, 1, .55))
        ball(.012, (x + .02, y - .04, .39), dots, sub=1)
    done("log", "nat_log_v01")


def stump():
    reset()
    trunk, ring, ring2 = mat("trunk", "#7A5230", rough=.9), mat("wood_ring", "#D9B07A", rough=.85), mat("wood_ring_dark", "#B08650", rough=.85)
    cyl(.45, .55, (0, 0, .275), trunk, 10, r2=.4)
    prof, mats_ = [(0, .551)], []
    for k, r in enumerate((.07, .14, .21, .28, .35, .39)):
        prof.append((r, .551))
        mats_.append(k % 2)
    lathe(prof + [(.39, .54)], [ring, ring2], seg=10, mats=mats_ + [0])
    for k in range(5):
        a = k * TAU / 5
        rod((.3 * math.cos(a), .3 * math.sin(a), .2), (.7 * math.cos(a), .7 * math.sin(a), 0), .12, .03, trunk, 5)
    done("stump", "nat_stump_v01")


def mushroom(r, loc, cap_m, dots, stem, h=None, seed=1, ndots=6, seg=12):
    x, y, z = loc
    h = h or r * 1.3
    lathe([(0, 0), (r * .38, 0), (r * .42, h * .6), (r * .32, h), (0, h)], stem, seg=max(6, seg - 2), loc=(x, y, z))
    lathe([(0, h - .02 * r), (r, h + .05 * r), (r * 1.04, h + .18 * r), (r * .85, h + .55 * r), (r * .45, h + .85 * r), (0, h + .95 * r)],
          cap_m, seg=seg, loc=(x, y, z))
    rnd = random.Random(seed)
    for k in range(ndots):
        a, e = k * TAU / ndots + rnd.uniform(-.3, .3), rnd.uniform(.35, .9)
        ball(r * .13, (x + r * .88 * math.cos(a) * math.cos(e), y + r * .88 * math.sin(a) * math.cos(e), z + h + .1 * r + r * .75 * math.sin(e)),
             dots, sub=1, scale=(1, 1, .4))


def mushroom_big():
    reset()
    mushroom(.55, (0, 0, 0), mat("cap_red", "#D8352E", rough=.5), mat("cap_dots", "#FFF8EC", rough=.6),
             mat("stem_cream", "#F2E2C2", rough=.7), h=.62, ndots=9)
    done("mushroom_big", "nat_mushroom_big_v01", 1.2)


def mushroom_group():
    reset()
    dots, stem = mat("cap_dots", "#FFF8EC", rough=.6), mat("stem_cream", "#F2E2C2", rough=.7)
    caps = [mat("cap_red", "#D8352E"), mat("cap_orange", "#F08A3A"), mat("cap_purple", "#9B6FCF"), mat("cap_blue", "#5B9BD5"), mat("cap_yellow", "#F2C84B")]
    rnd = random.Random(3)
    for k in range(5):
        a, r = k * TAU / 5 + rnd.uniform(-.3, .3), rnd.uniform(.12, .32) if k else 0
        mushroom(rnd.uniform(.08, .15) if k else .17, (r * math.cos(a), r * math.sin(a), 0), caps[k % 5], dots, stem, seed=k, ndots=2, seg=8)
    done("mushroom_group", "nat_mushroom_group_v01")


# ------------------------------------------------------------------ background mountains
def mountain(fname, seed):
    reset()
    rockm, snow = mat("mountain_rock", "#7D8C9A", rough=.95), mat("snow", "#F6F8FA", rough=.8)
    rnd = random.Random(seed)
    W, D, H = 60.0, 22.0, 28.0
    peaks = [(-18 + k * 12 + rnd.uniform(-3, 3), rnd.uniform(-2, 2), rnd.uniform(.55, .85) * H, rnd.uniform(13, 18)) for k in range(4)]
    i0 = rnd.randrange(1, 3)
    peaks[i0] = (peaks[i0][0], 0, H, 18)
    nx, ny = 17, 8
    verts, faces = [], []
    for j in range(ny + 1):
        for i in range(nx + 1):
            x, y = -W / 2 + W * i / nx, -D / 2 + D * j / ny
            edge = min(1.0, (min(i, nx - i) / 3)) * min(1.0, (min(j, ny - j) / 2.0))
            z = max(h * max(0.0, 1 - math.hypot(x - px, (y - py) * 1.6) / r) ** 1.05 for px, py, h, r in peaks) * edge
            z += rnd.uniform(-.6, .6) * (z > 1)
            verts.append((x, y, max(0.0, z)))
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i
            faces.append([a, a + 1, a + nx + 2])
            faces.append([a, a + nx + 2, a + nx + 1])
    o = mesh(verts, faces, [rockm, snow], [0] * len(faces))
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        if f.normal.z < 0:
            f.normal_flip()
        if f.calc_center_median().z > H * .58:
            f.material_index = 1
    bm.to_mesh(o.data)
    bm.free()
    done("mountain", fname, H, z_only=True)


BUILDERS = {
    "nat_pine_a": lambda: pine("nat_pine_a_v01", 6, 4, 1), "nat_pine_b": lambda: pine("nat_pine_b_v01", 8, 5, 2),
    "nat_pine_c": lambda: pine("nat_pine_c_v01", 10, 5, 3),
    "nat_oak_a": lambda: round_tree("nat_oak_a_v01", 5, 6, 1), "nat_oak_b": lambda: round_tree("nat_oak_b_v01", 6.5, 8, 2),
    "nat_oak_c": lambda: round_tree("nat_oak_c_v01", 8, 9, 3),
    "nat_autumn": lambda: round_tree("nat_autumn_v01", 6, 8, 4, ("#E0782A", "#F2B83A")),
    "nat_blossom": lambda: round_tree("nat_blossom_v01", 6, 8, 5, ("#F2A3C2", "#FBD3E2"), blossom=True),
    "nat_bush_a": lambda: bush("nat_bush_a_v01", "a", 1), "nat_bush_b": lambda: bush("nat_bush_b_v01", "b", 2),
    "nat_bush_c": lambda: bush("nat_bush_c_v01", "c", 3),
    "nat_rock_a": lambda: rock_single("nat_rock_a_v01", 1.0, 1), "nat_rock_b": lambda: rock_single("nat_rock_b_v01", 1.8, 2),
    "nat_rock_c": lambda: rock_single("nat_rock_c_v01", 3.0, 3), "nat_rock_cluster": lambda: rock_cluster("nat_rock_cluster_v01"),
    "nat_log": log, "nat_stump": stump, "nat_mushroom_big": mushroom_big, "nat_mushroom_group": mushroom_group,
    "nat_mountain_a": lambda: mountain("nat_mountain_a_v01", 4), "nat_mountain_b": lambda: mountain("nat_mountain_b_v01", 9),
}
for n, f in BUILDERS.items():
    if not ONLY or n in ONLY:
        f()
