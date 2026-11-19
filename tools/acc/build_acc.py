"""Wearable accessories for Ngọc (chr_ngoc_adventurer_v04), built in place on her rest pose.
Run: OUT=<folder> blender -b -P tools/acc/build_acc.py   (optional ONLY=acc_hat,acc_bag)
Every file keeps Ngọc's coordinates (origin at her feet, front = Blender -Y = glTF +Z), so the game can parent the
mesh to a bone without moving it. Materials: tint_main / tint_trim are light grey (0.8) for the game to colour
(red, blue, yellow, green, pink, purple, black, white, orange, brown); glass = clear lens; metal = buckles, clasps.
Each accessory is <= 800 triangles. The body is read from assets/models/chr_ngoc_adventurer_v04.glb for fitting.
"""
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "harbor"))
from hlib import *  # noqa
import hlib
import bpy
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

ONLY = [s for s in os.environ.get("ONLY", "").split(",") if s]
REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
NGOC = os.path.join(REPO, "assets", "models", "chr_ngoc_adventurer_v04.glb")
HZ = 1.105                                   # head centre (build_ngoc_v03.py)
HAIR_C, HAIR_R = Vector((0, .014, 1.119)), (.309, .291, .282)
EYE_X, EYE_Z = .112, HZ - .046               # eye centres on the face texture (ngoc_face_v03.py)
WRIST = Vector((.294, .007, .578))           # hand.L head
FORE_DIR = (Vector((.363, .011, .486)) - WRIST).normalized()


def body_info():
    """import Ngọc once per build: BVH of the body mesh and the boot extents per foot"""
    bpy.ops.import_scene.gltf(filepath=NGOC)
    body = bpy.data.objects["Ngoc"]
    me = body.data
    vs = [body.matrix_world @ v.co for v in me.vertices]
    tree = BVHTree.FromPolygons(vs, [list(p.vertices) for p in me.polygons])
    bi = [i for i, m in enumerate(me.materials) if m.name == "ngoc_boots"]
    boots = {}
    for s in (1, -1):
        pts = [vs[v] for p in me.polygons if p.material_index in bi for v in p.vertices if vs[v].z < .14 and vs[v].x * s > 0]
        boots[s] = ([min(p[i] for p in pts) for i in range(3)], [max(p[i] for p in pts) for i in range(3)])
    hair = bpy.data.objects["Hair_short"]
    hv = [hair.matrix_world @ v.co for v in hair.data.vertices]
    htree = BVHTree.FromPolygons(hv, [list(p.vertices) for p in hair.data.polygons])
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    return tree, boots, htree


def out_hit(htree, d, extra=0.0):
    """distance from the hair centre to the outside of Hair_short along d (last hit going outwards)"""
    d = d.normalized()
    o = HAIR_C + d * .7
    hit = htree.ray_cast(o, -d, .8)[0]
    return ((hit - HAIR_C).length if hit else .3) + extra


def mats():
    return (mat("tint_main", "#CCCCCC", rough=.6), mat("tint_trim", "#CCCCCC", rough=.5),
            mat("glass", "#DDEFF5", rough=.03, alpha=.3), mat("metal", "#C9B27A", rough=.3, metal=.85))


def transform_since(start, M):
    bpy.context.view_layer.update()          # matrix_world is stale until the view layer updates
    for o in OBJS[start:]:
        o.matrix_world = M @ o.matrix_world


def hair_point(az, el, off=0.0):
    """point on (an inflated copy of) the hair cap; az 0 = face, + towards her left (+X)"""
    d = Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))
    return HAIR_C + Vector((d.x * (HAIR_R[0] + off), d.y * (HAIR_R[1] + off), d.z * (HAIR_R[2] + off)))


# ------------------------------------------------------------------ head
def hat():
    main, trim, _, metal = mats()
    s = len(OBJS)
    lathe([(0, .315), (.12, .305), (.25, .245), (.30, .16), (.33, .07), (.335, 0), (0, 0)], main, seg=20,
          scale=(1, .94, 1))
    lathe([(.325, .0), (.44, -.012), (.54, -.04), (.565, -.055), (.55, -.07), (.43, -.035), (.325, -.02)], main,
          seg=24, scale=(1, .94, 1))
    lathe([(.338, .0), (.341, .075), (.336, .078), (.333, .002)], trim, seg=20, scale=(1, .94, 1))  # ribbon band
    for sx in (-1, 1):  # flat bow on the band, her left side
        ball(.05, (.31 + .0, sx * .055, .045), trim, uv=(8, 5), scale=(.35, 1.2, .8))
    ball(.025, (.335, 0, .045), metal, uv=(6, 4), scale=(.6, 1, 1))
    transform_since(s, Matrix.Translation((0, .035, 1.30)) @ Matrix.Rotation(math.radians(-12), 4, 'X'))
    group("acc_hat", origin=None)
    export("acc_hat_v01")


def bow(htree):
    main, trim, _, metal = mats()
    n = (hair_point(math.radians(-112), math.radians(32)) - HAIR_C).normalized()   # her right, above and behind the ear
    p = HAIR_C + n * out_hit(htree, n, -.01)
    s = len(OBJS)
    for sx in (-1, 1):  # two loops, two tails, knot; built facing +X then turned onto the hair
        ball(.06, (0, sx * .065, .005), main, uv=(10, 6), scale=(.38, 1.05, .78), rot=(sx * .25, 0, 0))
        ball(.04, (.012, sx * .065, .005), trim, uv=(8, 5), scale=(.3, .8, .55), rot=(sx * .25, 0, 0))
        beam((0, sx * .012, -.01), (.0, sx * .05, -.085), .03, main, .012)
        box((.014, .034, .012), (0, sx * .052, -.09), trim, rot=(sx * .45, 0, 0))
    ball(.028, (.006, 0, 0), main, uv=(8, 5), scale=(.8, 1, 1.1))
    ball(.008, (.03, 0, .0), metal, uv=(5, 3))
    t = Vector((0, 0, 1)).cross(n).normalized()          # local X -> out of the hair, Y -> along the head, Z -> up
    up = n.cross(t)
    R = Matrix((n, t, up)).transposed().to_4x4()
    transform_since(s, Matrix.Translation(p) @ R @ Matrix.Scale(1.9, 4))
    group("acc_bow", origin=None)
    export("acc_bow_v01")


def headband(htree):
    main, trim, _, metal = mats()
    tilt = math.radians(-26)                    # leans back from the ears over the crown, in front of the bun
    rows, n = [], 15
    dirs, dist = [], []
    for i in range(n):
        a = -math.radians(96) + math.radians(192) * i / (n - 1)
        d = (Matrix.Rotation(tilt, 3, 'X') @ Vector((math.sin(a), 0, math.cos(a)))).normalized()
        dirs.append(d)
        dist.append(out_hit(htree, d))
    for i, d in enumerate(dirs):                 # smooth over the curls so the band reads as one clean arc
        w = dist[max(0, i - 2):i + 3]
        r = max(sum(w) / len(w), dist[i] - .015) + .004
        rows.append((HAIR_C + d * r, d))
    verts, faces = [], []
    W, T = .03, .012                             # half width along the head, half thickness
    for c, d in rows:
        side = Vector((1, 0, 0)).cross(d) if abs(d.x) < .99 else Vector((0, 1, 0))
        side = (Matrix.Rotation(tilt, 3, 'X') @ Vector((0, 1, 0)))
        for sw, st in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
            verts.append(c + side * W * sw + d * T * st)
    for i in range(n - 1):
        for k in range(4):
            a, b = i * 4 + k, i * 4 + (k + 1) % 4
            faces.append([a, b, b + 4, a + 4])
    faces.append([3, 2, 1, 0])
    faces.append([(n - 1) * 4 + k for k in range(4)])
    mesh(verts, faces, main)
    for i in range(1, n - 1, 2):                 # little studs along the top
        c, d = rows[i]
        ball(.013, tuple(c + d * .014), trim, uv=(6, 4))
    for i in (0, n - 1):                         # rounded tips behind the ears
        c, d = rows[i]
        ball(.024, tuple(c), main, uv=(8, 5), scale=(1, 1, .5))
    group("acc_headband", origin=None)
    export("acc_headband_v01")


def glasses(tree):
    main, trim, glass, metal = mats()
    for sx in (-1, 1):
        x = sx * EYE_X
        hit = tree.ray_cast(Vector((x, 0, EYE_Z)), Vector((0, -1, 0)), 1.0)[0]
        y = (hit.y if hit else -.23) - .03
        torus(.064, .009, (x, y, EYE_Z), main, 18, 5, rot=(math.pi / 2, 0, 0))
        cyl(.058, .004, (x, y, EYE_Z), glass, 18, rot=(math.pi / 2, 0, 0))
        hinge = Vector((x + sx * .066, y + .004, EYE_Z + .012))
        box((.016, .02, .016), tuple(hinge), metal)
        ear = Vector((sx * .286, .005, EYE_Z + .025))
        beam(tuple(hinge), tuple(ear), .011, main, .007)
        beam(tuple(ear), (sx * .28, .05, EYE_Z - .03), .011, trim, .007)
        nose = tree.ray_cast(Vector((sx * .03, 0, EYE_Z - .03)), Vector((0, -1, 0)), 1.0)[0]
        if nose:
            ball(.008, tuple(nose + Vector((0, -.006, 0))), metal, uv=(6, 4))
            beam(tuple(nose + Vector((0, -.006, 0))), (sx * .055, y, EYE_Z - .02), .004, metal)
    yb = (tree.ray_cast(Vector((0, 0, EYE_Z + .02)), Vector((0, -1, 0)), 1.0)[0] or Vector((0, -.25, 0))).y - .03
    pts = [Vector((-.05, yb + .005, EYE_Z + .02)), Vector((0, yb - .004, EYE_Z + .035)), Vector((.05, yb + .005, EYE_Z + .02))]
    beam(tuple(pts[0]), tuple(pts[1]), .01, main, .008)
    beam(tuple(pts[1]), tuple(pts[2]), .01, main, .008)
    group("acc_glasses", origin=None)
    export("acc_glasses_v01")


# ------------------------------------------------------------------ body
def scarf():
    main, trim, _, metal = mats()
    o = torus(.158, .05, (0, .005, .825), main, 16, 6, rot=(math.radians(-6), 0, 0))
    o.scale = (1.08, 1.0, .85)
    for k in range(5):  # knit ridges on the loop
        a = -math.pi / 2 + (k - 2) * .45
        torus(.052, .008, (.165 * math.cos(a), .005 + .155 * math.sin(a), .83), trim, 10, 3,
              rot=(0, math.pi / 2, a))
    kn = Vector((-.07, -.17, .80))
    ball(.05, tuple(kn), main, uv=(10, 6), scale=(1, .8, 1))
    for k, (end, w) in enumerate((((-.07, -.20, .56), .085), ((-.14, -.17, .62), .075))):
        e = Vector(end)
        beam(tuple(kn + Vector((0, -.01, -.03))), tuple(e), w, main, .022)
        box((w * 1.02, .026, .03), tuple(e + Vector((0, 0, .02))), trim)
        for f in range(4):  # fringe
            fx = (f - 1.5) * w / 4
            beam(tuple(e + Vector((fx, 0, 0))), tuple(e + Vector((fx * 1.1, -.005, -.045))), .012, trim)
    group("acc_scarf", origin=None)
    export("acc_scarf_v01")


def bag():
    main, trim, _, metal = mats()
    c = Vector((0, .245, .63))
    box((.27, .17, .30), tuple(c), main, bev=.03)
    box((.29, .19, .11), tuple(c + Vector((0, .0, .145))), trim, bev=.025)          # flap
    box((.18, .05, .13), tuple(c + Vector((0, .095, -.06))), main, bev=.02)          # front pocket
    box((.19, .02, .035), tuple(c + Vector((0, .12, .0))), trim)
    for sx in (-1, 1):
        box((.03, .012, .07), (sx * .06, c.y + .1, c.z + .1), trim)                  # flap straps
        box((.036, .012, .028), (sx * .06, c.y + .105, c.z + .07), metal)            # buckles
        # shoulder straps: pack top -> over the shoulder -> down the chest -> under the arm -> pack bottom
        pts = [(sx * .085, .17, .76), (sx * .10, .06, .835), (sx * .11, -.07, .82), (sx * .12, -.14, .70),
               (sx * .15, -.12, .57), (sx * .16, .02, .52), (sx * .11, .17, .52)]
        for a, b in zip(pts, pts[1:]):
            beam(a, b, .036, trim, .012)
        box((.04, .014, .03), (sx * .118, -.145, .72), metal)
    torus(.03, .008, tuple(c + Vector((0, -.02, .19))), trim, 8, 3, rot=(math.pi / 2, 0, 0))   # top handle
    group("acc_bag", origin=None)
    export("acc_bag_v01")


def bracelet():
    main, trim, _, metal = mats()
    ctr = WRIST - FORE_DIR * .03
    R = Vector((0, 0, 1)).rotation_difference(-FORE_DIR).to_matrix().to_4x4()
    s = len(OBJS)
    torus(.050, .011, (0, 0, 0), main, 16, 5)
    for k in range(6):  # beads
        a = k * math.pi / 3
        ball(.012, (.056 * math.cos(a), .056 * math.sin(a), 0), trim, uv=(6, 4))
    ball(.012, (0, -.066, -.012), metal, uv=(6, 4))     # charm on the clasp
    box((.02, .006, .022), (0, -.072, -.03), metal, rot=(0, 0, math.pi / 4))
    transform_since(s, Matrix.Translation(ctr) @ R)
    group("acc_bracelet", origin=None)
    export("acc_bracelet_v01")


def shoes(boots):
    main, trim, _, metal = mats()
    for s, nm in ((1, "shoe_L"), (-1, "shoe_R")):
        mn, mx = boots[s]
        cx, L = (mn[0] + mx[0]) / 2, (mx[1] - mn[1]) + .03
        W = (mx[0] - mn[0]) + .02
        cy = (mn[1] + mx[1]) / 2 - .005
        box((W + .01, L + .01, .04), (cx, cy, .02), trim, bev=.012)                          # sole
        box((W * .96, L * .6, .13), (cx, cy + L * .17, .1), main, bev=.03)                      # heel + quarter
        ball(W / 2, (cx, cy - L * .25, .06), main, uv=(10, 6), scale=(.96, 1.45, .55))         # toe box
        ball(W / 2 * .92, (cx, cy - L * .31, .045), trim, uv=(10, 5), scale=(1.0, 1.3, .42))  # toe cap
        box((W * .55, L * .3, .03), (cx, cy - L * .06, .135), trim, rot=(-.35, 0, 0))         # tongue
        for k in range(3):                                                                  # laces
            box((W * .62, .012, .01), (cx, cy - L * .14 + k * .028, .125 + k * .012), trim, rot=(-.35, 0, 0))
        for sx in (-1, 1):                                                                  # side stripe
            box((.006, L * .35, .022), (cx + sx * (W / 2 + .002), cy + L * .05, .08), trim, rot=(.3, 0, 0))
        cyl(.008, .004, (cx + s * (W / 2 + .004), cy + L * .3, .1), metal, 6, rot=(0, math.pi / 2, 0))  # eyelet badge
        group(nm, origin=None)
    export("acc_shoes_v01")


BUILD = ["acc_hat", "acc_bow", "acc_headband", "acc_glasses", "acc_scarf", "acc_bag", "acc_bracelet", "acc_shoes"]
for name in BUILD:
    if ONLY and name not in ONLY:
        continue
    reset()
    if name in ("acc_glasses", "acc_shoes", "acc_bow", "acc_headband"):
        tree, boots, htree = body_info()
        {"acc_glasses": lambda: glasses(tree), "acc_shoes": lambda: shoes(boots),
         "acc_bow": lambda: bow(htree), "acc_headband": lambda: headband(htree)}[name]()
    else:
        globals()[name[4:]]()
