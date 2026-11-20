"""Batch 17: village props. Run: OUT=<folder> blender -b -P tools/village/build_village.py (optional ONLY=vil_fence,...)
Metres, feet at 0, front Blender -Y (glTF +Z). Named sub-objects where the game needs them (arrow_1..3, blades).
"""
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "harbor"))
from hlib import *  # noqa
import bpy, bmesh
from mathutils import Vector, Matrix

ONLY = [s for s in os.environ.get("ONLY", "").split(",") if s]
TAU = 2 * math.pi


def W():
    return mat("wood", "#A8743F", rough=.85), mat("wood_dark", "#7A4E2C", rough=.85), mat("iron", "#2F3336", rough=.55, metal=.4)


def tri2(pts, m, off=.004):
    """double-sided triangle (second face nudged along the normal so the merge pass keeps both)"""
    a, b, c = (Vector(p) for p in pts)
    n = (b - a).cross(c - a).normalized() * off
    return mesh([a, b, c, a - n, b - n, c - n], [[0, 1, 2], [5, 4, 3]], m)


def keep_origin(o, pivot):
    o.data.transform(Matrix.Translation(-Vector(pivot)))
    o.location = pivot


def post(x, y, h, m, cap=None):
    box((.12, .12, h), (x, y, h / 2), m, bev=.012)
    cyl(.09, .1, (x, y, h + .05), cap or m, 4, r2=.0, rot=(0, 0, math.pi / 4))


def fence():
    reset()
    wood, wood2, iron = W()
    for x in (-1.0, 1.0):
        post(x, 0, 1.0, wood2)
    for z, tilt in ((.38, .015), (.75, -.02)):
        box((2.0, .05, .1), (0, -.07, z), wood, rot=(0, tilt, 0), bev=.01)
        for x in (-.95, .95):
            ball(.012, (x, -.1, z), iron, sub=1)
    group("fence")
    export("vil_fence_v01")


def fence_post():
    reset()
    wood, wood2, iron = W()
    post(0, 0, 1.1, wood2, wood)
    box((.16, .16, .05), (0, 0, .82), wood, bev=.01)
    group("fence_post")
    export("vil_fence_post_v01")


def fence_gate():
    reset()
    wood, wood2, iron = W()
    for x in (-.76, .76):
        post(x, 0, 1.2, wood2)
    box((.06, .05, .95), (-.66, -.07, .55), wood, bev=.01)
    box((.06, .05, .95), (.66, -.07, .55), wood, bev=.01)
    for z in (.25, .55, .85):
        box((1.32, .05, .09), (0, -.07, z), wood, bev=.01)
    beam((-.62, -.07, .25), (.62, -.07, .85), .07, wood, .05)                      # brace
    box((.2, .03, .04), (.62, -.11, .62), iron)                                       # latch bar
    box((.04, .05, .1), (.74, -.1, .62), iron)
    for z in (.3, .8):
        box((.12, .03, .04), (-.66, -.1, z), iron)                                    # hinges
    group("fence_gate")
    export("vil_fence_gate_v01")


def lamp():
    reset()
    wood, wood2, iron = W()
    glow, glass = mat("lamp_glow", "#FFE3A0", emit=4.0), mat("glass", "#E8F4F6", rough=.05, alpha=.4)
    lathe([(0, 0), (.2, 0), (.2, .08), (.12, .14), (.1, .4), (0, .4)], iron, seg=10)
    cyl(.045, 2.4, (0, 0, 1.6), iron, 8, r2=.035)
    pts = [(0, 0, 2.7), (.15, 0, 2.86), (.38, 0, 2.86), (.5, 0, 2.78)]           # curled hanging arm
    for a, b in zip(pts, pts[1:]):
        beam(a, b, .03, iron)
    torus(.06, .012, (.08, 0, 2.95), iron, 10, 3, rot=(math.pi / 2, 0, 0))
    lx = .5
    cyl(.012, .1, (lx, 0, 2.72), iron, 6)
    cyl(.12, .06, (lx, 0, 2.64), iron, 6)
    cyl(.1, .28, (lx, 0, 2.47), glass, 6, r2=.13, cap=False)
    ball(.07, (lx, 0, 2.47), glow, sub=2)
    cyl(.15, .14, (lx, 0, 2.66), iron, 6, r2=.03)
    cyl(.09, .04, (lx, 0, 2.32), iron, 6)
    cyl(.06, .1, (0, 0, 3.0), iron, 8, r2=0)
    group("lamp")
    export("vil_lamp_v01")


def lantern_hang():
    reset()
    wood, wood2, iron = W()
    glow, paper = mat("lamp_glow", "#FFE3A0", emit=3.0), mat("lantern_red", "#D8432E", rough=.7)
    beam((0, 0, .65), (0, 0, .5), .01, iron)
    torus(.03, .006, (0, 0, .67), iron, 8, 3, rot=(math.pi / 2, 0, 0))
    cyl(.07, .04, (0, 0, .48), iron, 8)
    ball(.16, (0, 0, .32), paper, uv=(12, 8), scale=(1, 1, 1.05))
    ball(.1, (0, 0, .32), glow, uv=(8, 5))
    cyl(.07, .04, (0, 0, .15), iron, 8)
    cyl(.015, .12, (0, 0, .07), mat("tassel_gold", "#E2B04A"), 6)
    group("lantern_hang")
    export("vil_lantern_hang_v01")


def sign_post():
    reset()
    wood, wood2, iron = W()
    blank = mat("sign_blank", "#E8D2A6", rough=.8)
    box((.14, .14, 2.2), (0, 0, 1.1), wood2, bev=.015)
    cyl(.11, .12, (0, 0, 2.26), wood2, 4, r2=0, rot=(0, 0, math.pi / 4))
    group("sign_pole")
    for k, (z, ang) in enumerate(((1.95, .4), (1.6, -1.2), (1.25, 2.4))):
        L = .9
        verts = [(-.05, 0, -.13), (L - .18, 0, -.13), (L, 0, 0), (L - .18, 0, .13), (-.05, 0, .13)]
        s = len(OBJS)
        for off, rev in ((-.035, False), (.035, True)):   # two faces of the arrow board + edge
            mesh([(x, off, z0) for x, _, z0 in verts], [list(range(5))[::-1] if not rev else list(range(5))], wood)
        sides = []
        for i in range(5):
            j = (i + 1) % 5
            a, b = verts[i], verts[j]
            mesh([(a[0], -.035, a[2]), (b[0], -.035, b[2]), (b[0], .035, b[2]), (a[0], .035, a[2])], [[0, 1, 2, 3]], wood)
        mesh([(x * .85 + .03, -.037, z0 * .7) for x, _, z0 in verts], [list(range(5))[::-1]], blank)   # blank face for text
        mesh([(x * .85 + .03, .037, z0 * .7) for x, _, z0 in verts], [list(range(5))], blank)
        bpy.context.view_layer.update()
        for o in OBJS[s:]:
            o.matrix_world = Matrix.Translation((0, 0, z)) @ Matrix.Rotation(ang, 4, 'Z') @ o.matrix_world
        o = group("arrow_%d" % (k + 1), origin=None)
        keep_origin(o, (0, 0, z))
    export("vil_sign_post_v01")


def stall_market():
    reset()
    wood, wood2, iron = W()
    red, white = mat("awning_red", "#D23A33", rough=.8), mat("awning_white", "#F6F2EA", rough=.8)
    apple, orange, cab = mat("fruit_apple", "#D8352E", rough=.5), mat("fruit_orange", "#F28A1E", rough=.5), mat("fruit_cabbage", "#8CC85A", rough=.7)
    basket, blank = mat("wicker", "#C99A5A", rough=.9), mat("sign_blank", "#E8D2A6", rough=.8)
    X, Y = 3.0, 1.6
    for sx in (-1, 1):
        for sy in (-1, 1):
            box((.1, .1, 2.4 if sy > 0 else 2.0), (sx * (X / 2 - .08), sy * (Y / 2 - .08), 1.2 if sy > 0 else 1.0), wood2, bev=.01)
    box((X - .1, Y - .3, .08), (0, .05, .9), wood, bev=.015)                 # counter top
    box((X - .2, .05, .82), (0, -Y / 2 + .2, .45), wood, bev=.01)
    for k in range(3):
        box((X - .2, .02, .04), (0, -Y / 2 + .17, .2 + k * .25), wood2)
    n = 10
    for i in range(n):   # striped canvas sloping from the back down to the front
        x = -X / 2 - .1 + (i + .5) * (X + .2) / n
        beam((x, Y / 2 + .05, 2.45), (x, -Y / 2 - .3, 2.0), (X + .2) / n, red if i % 2 == 0 else white, .03)
        cyl(.16, .16, (x, -Y / 2 - .32, 1.93), red if i % 2 == 0 else white, 3, rot=(math.pi / 2, 0, math.pi), scale=(1, 1, .1))
    rnd = random.Random(2)
    for k, (x, m) in enumerate(((-1.0, apple), (0, orange), (1.0, cab))):
        lathe([(0, 0), (.3, 0), (.36, .16), (.34, .17), (.3, .02)], basket, seg=12, loc=(x, .1, .94))
        for j in range(7 if m is not cab else 4):
            a, r = j * 2.4, (.15 if j else 0) * (1 if m is not cab else .9)
            sz = .07 if m is not cab else .13
            ball(sz, (x + r * math.cos(a), .1 + r * math.sin(a), 1.08 + (.04 if j == 0 else 0)), m, sub=2 if m is cab else 1, jit=.01, seed=j)
    box((.6, .04, .4), (1.05, -Y / 2 - .05, 1.25), blank, bev=.01)            # blank price board
    box((.66, .03, .46), (1.05, -Y / 2 - .03, 1.25), wood2)
    group("stall_market")
    export("vil_stall_market_v01")


def windmill():
    reset()
    white, stone = mat("wall_white", "#F2EDE2", rough=.9), mat("stone", "#A7A39A", rough=.95)
    roof, wood, wood2 = mat("roof_brown", "#7A4A2C", rough=.8), mat("wood", "#A8743F"), mat("wood_dark", "#7A4E2C")
    glow, sail = mat("window_glow", "#FFE3A0", emit=2.0), mat("sail_cream", "#F4E8CC", rough=.9)
    lathe([(0, 0), (2.1, 0), (2.1, .7), (1.9, .75), (1.5, 5.6), (0, 5.6)], [stone, stone, white, white, white], seg=12,
          mats=[0, 0, 1, 1, 1])
    cyl(1.75, 1.6, (0, 0, 6.3), roof, 12, r2=.12)
    ball(.12, (0, 0, 7.12), wood2, sub=2)
    box((.9, .3, 1.5), (0, -1.95, .9), wood2, bev=.02)
    for z, r in ((2.6, 1.78), (4.2, 1.6)):
        box((.45, .2, .55), (0, -r, z), glow, rot=(.1, 0, 0))
        box((.6, .22, .08), (0, -r - .02, z - .32), wood)
    box((.3, .2, .45), (1.65, -.6, 3.4), glow, rot=(0, 0, .35))
    cyl(.16, .5, (0, -1.6, 5.5), wood2, 8, rot=(math.pi / 2, 0, 0))              # axle into the cap
    group("windmill")
    hub = Vector((0, -1.9, 5.5))
    cyl(.24, .25, tuple(hub), wood2, 8, rot=(math.pi / 2, 0, 0))
    for k in range(4):
        a = k * math.pi / 2 + .3
        d = Vector((math.cos(a), 0, math.sin(a)))
        side = Vector((-math.sin(a), 0, math.cos(a)))
        beam(tuple(hub + d * .2), tuple(hub + d * 3.4), .12, wood2, .08)
        c = hub + d * 2.0 + side * .32 + Vector((0, -.02, 0))
        box((2.6, .04, .55), tuple(c), sail, rot=(0, -a, 0))
        for j in range(4):
            beam(tuple(hub + d * (1.0 + .65 * j)), tuple(hub + d * (1.0 + .65 * j) + side * .62), .035, wood)
    o = group("blades", origin=None)
    keep_origin(o, hub)
    export("vil_windmill_v01")


def scarecrow():
    reset()
    wood, wood2, iron = W()
    straw, shirt, shirt2, hat = mat("straw", "#E3C26A", rough=1), mat("shirt_plaid", "#C8463A", rough=.9), mat("shirt_plaid_dark", "#8E2E28", rough=.9), mat("hat_straw", "#C9A04A", rough=.9)
    cyl(.05, 1.9, (0, 0, .95), wood2, 6)
    beam((-.75, 0, 1.4), (.75, 0, 1.4), .07, wood2)
    box((.5, .26, .55), (0, 0, 1.2), shirt, bev=.04)
    for k in range(3):
        box((.52, .27, .04), (0, 0, 1.03 + k * .17), shirt2)
    for sx in (-1, 1):
        box((.4, .2, .2), (sx * .42, 0, 1.4), shirt, bev=.03)
        for j in range(4):
            cyl(.025, .2, (sx * .68, -.03 + .02 * j, 1.33), straw, 3, r2=0, rot=(math.pi, 0, sx * .3 * j))
    for j in range(6):
        cyl(.03, .3, (-.15 + j * .06, 0, .85), straw, 3, r2=0, rot=(math.pi, 0, 0))
    ball(.2, (0, 0, 1.68), mat("sack", "#D8C09A", rough=1), sub=2, scale=(1, .9, 1.05))
    for sx in (-1, 1):
        box((.05, .02, .05), (sx * .07, -.18, 1.72), mat("stitch_dark", "#3A2A20"), rot=(0, .78, 0))
    box((.14, .02, .015), (0, -.185, 1.6), mat("stitch_dark", "#3A2A20"))
    lathe([(0, 1.82), (.45, 1.82), (.47, 1.85), (.2, 1.87), (.17, 2.02), (0, 2.03)], hat, seg=14)
    group("scarecrow")
    export("vil_scarecrow_v01")


def dummy():
    reset()
    wood, wood2, iron = W()
    straw, rope, cut = mat("straw", "#E3C26A", rough=1), mat("rope", "#C9A66B", rough=.95), mat("cut_mark", "#8A6A2A", rough=1)
    box((.8, .8, .12), (0, 0, .06), wood, bev=.02)
    cyl(.06, 1.0, (0, 0, .6), wood2, 8)
    cyl(.25, .8, (0, 0, 1.15), straw, 10, r2=.22)
    for z in (.85, 1.15, 1.45):
        torus(.255, .02, (0, 0, z), rope, 12, 3)
    ball(.2, (0, 0, 1.73), straw, sub=2)
    torus(.18, .02, (0, 0, 1.62), rope, 12, 3)
    beam((-.55, 0, 1.3), (.55, 0, 1.3), .1, wood2)
    for k, (z, a) in enumerate(((1.25, .6), (1.05, -.5), (1.35, -.3))):
        box((.2, .02, .025), (.02 * k, -.245, z), cut, rot=(0, a, 0))
    group("dummy")
    export("vil_dummy_v01")


def target():
    reset()
    wood, wood2, iron = W()
    red, white = mat("target_red", "#D8322E", rough=.6), mat("target_white", "#F6F2EA", rough=.6)
    prof, mats_ = [(0, .0)], []
    for k, r in enumerate((.12, .24, .36, .48, .6)):
        prof.append((r, 0))
        mats_.append(k % 2)
    lathe(prof + [(.6, -.06), (0, -.06)], [red, white], seg=24, mats=mats_ + [1, 1], loc=(0, 0, 0))
    bpy.context.view_layer.update()
    OBJS[-1].matrix_world = Matrix.Translation((0, -.05, 1.15)) @ Matrix.Rotation(math.pi / 2, 4, 'X')
    for a in (-.5, .5):
        beam((math.sin(a) * .5, .0, 0), (0, .05, 1.6), .06, wood2)
    beam((0, .6, 0), (0, .05, 1.6), .06, wood2)
    group("target")
    export("vil_target_v01")


def tent():
    reset()
    wood, wood2, iron = W()
    blue, cream, rope = mat("tent_blue", "#4F86C6", rough=.85), mat("tent_cream", "#F1E6CC", rough=.85), mat("rope", "#C9A66B", rough=.95)
    L, Wd, H = 3.0, 2.4, 1.9
    for sx in (-1, 1):   # two sloped canvas sides, ridge along y
        a, b, c, d = Vector((0, -L / 2, H)), Vector((0, L / 2, H)), Vector((sx * Wd / 2, L / 2, 0)), Vector((sx * Wd / 2, -L / 2, 0))
        n = (b - a).cross(d - a).normalized() * .004 * sx
        mesh([a, b, c, d, a - n, b - n, c - n, d - n], [[0, 1, 2, 3], [7, 6, 5, 4]], blue)
    tri2([(-Wd / 2, L / 2, 0), (Wd / 2, L / 2, 0), (0, L / 2, H)], cream)           # back wall
    for sx in (-1, 1):   # front flaps tied open
        tri2([(0, -L / 2, H), (sx * .15, -L / 2 - .02, .05), (sx * Wd / 2, -L / 2, 0)], cream)
    for sy in (-1, 1):
        box((.06, .06, H + .15), (0, sy * L / 2, (H + .15) / 2), wood2)
    beam((0, -L / 2, H), (0, L / 2, H), .05, wood2)
    for sx in (-1, 1):
        for sy in (-1, 1):
            beam((sx * Wd / 4, sy * L / 2, H / 2), (sx * (Wd / 2 + .7), sy * (L / 2 + .2), 0), .015, rope)
            cyl(.025, .25, (sx * (Wd / 2 + .7), sy * (L / 2 + .2), .08), wood, 5, rot=(0, sx * .3, 0))
    group("tent")
    export("vil_tent_v01")


def campfire_logs():
    reset()
    wood, wood2, iron = W()
    ash, stone = mat("ash_grey", "#6E6A66", rough=1), mat("stone", "#8C8A84", rough=.95)
    ball(.5, (0, 0, 0), ash, sub=2, scale=(1, 1, .12))
    for k in range(8):
        a = k * TAU / 8
        ball(.12, (.6 * math.cos(a), .6 * math.sin(a), .06), stone, sub=2, scale=(1.2, 1, .7), jit=.02, seed=k)
    for k in range(4):   # log benches around the fire pit
        a = k * TAU / 4 + .4
        c = Vector((1.6 * math.cos(a), 1.6 * math.sin(a), .22))
        cyl(.22, 1.3, tuple(c), wood2, 10, rot=(0, math.pi / 2, a + math.pi / 2))
        for s in (-1, 1):
            cyl(.19, .02, tuple(c + Vector((-math.sin(a), math.cos(a), 0)) * .655 * s), wood, 10, rot=(0, math.pi / 2, a + math.pi / 2))
    group("campfire_logs")
    export("vil_campfire_logs_v01")


def dock(fname, L, Wd, fishing=False):
    reset()
    wood, wood2, iron = W()
    rope, crate = mat("rope", "#C9A66B", rough=.95), mat("wood_crate", "#C79A5B", rough=.85)
    n = int(L / .3)
    for i in range(n):
        box((Wd, .27, .06), (0, -L / 2 + (i + .5) * L / n, .5), wood if i % 3 else wood2, rot=(0, (i % 2 - .5) * .02, 0), bev=.008)
    for sx in (-1, 1):
        for y in ((-L / 2 + .2, L / 2 - .2) if L < 4 else (-L / 2 + .2, 0, L / 2 - .2)):
            cyl(.1, 1.2, (sx * (Wd / 2 - .05), y, .2), wood2, 8)
        box((.1, L, .12), (sx * (Wd / 2 - .05), 0, .4), wood2)
    if not fishing:
        for k in range(4):   # ladder down to the water at the far end
            box((.5, .05, .04), (Wd / 2 - .4, -L / 2 - .03, .38 - k * .25), wood2)
        for sx in (-1, 1):
            box((.05, .05, 1.1), (Wd / 2 - .4 + sx * .25, -L / 2 - .03, .0), wood2)
        box((.5, .5, .5), (-Wd / 2 + .4, L / 2 - .5, .78), crate, bev=.02)
        box((.4, .4, .4), (-Wd / 2 + .4, L / 2 - 1.05, .73), crate, bev=.02)
        for k, rr in enumerate((.25, .19, .13)):
            torus(rr, .035, (Wd / 2 - .45, L / 2 - .6, .56 + .06 * k), rope, 12, 4)
    else:
        rod((Wd / 2 - .2, -L / 2 + .4, .53), (Wd / 2 + .6, -L / 2 - .9, 2.0), .02, .008, wood2, 5)
        beam((Wd / 2 + .6, -L / 2 - .9, 2.0), (Wd / 2 + .7, -L / 2 - 1.2, .0), .004, mat("line", "#E8E8E8"))
        lathe([(0, 0), (.15, 0), (.18, .25), (.17, .26), (0, .02)], mat("bucket_blue", "#4F86C6", rough=.5), seg=10, loc=(-.3, -.4, .53))
        ball(.06, (-.3, -.4, .75), mat("fish_silver", "#B8C8D8", rough=.3, metal=.5), sub=1, scale=(1.8, .6, .7))
    group("dock")
    export(fname)


def bunting():
    reset()
    rope = mat("rope", "#C9A66B", rough=.95)
    cols = [mat("flag_red", "#E5484D"), mat("flag_yellow", "#F5C842"), mat("flag_blue", "#4F86C6"), mat("flag_green", "#5CB85C"),
            mat("flag_pink", "#F28AB3")]
    L, sag, n = 4.0, .35, 10
    P = lambda t: Vector((-L / 2 + L * t, 0, -sag * 4 * t * (1 - t)))
    for i in range(12):
        beam(tuple(P(i / 12)), tuple(P((i + 1) / 12)), .015, rope)
    for i in range(n):
        t0, t1 = (i + .15) / n, (i + .85) / n
        a, b = P(t0), P(t1)
        tip = (a + b) / 2 + Vector((0, 0, -.32))
        tri2([a, b, tip], cols[i % 5])
    group("bunting", origin=None)
    export("vil_bunting_v01")


BUILDERS = {"vil_fence": fence, "vil_fence_post": fence_post, "vil_fence_gate": fence_gate, "vil_lamp": lamp,
            "vil_lantern_hang": lantern_hang, "vil_sign_post": sign_post, "vil_stall_market": stall_market,
            "vil_windmill": windmill, "vil_scarecrow": scarecrow, "vil_dummy": dummy, "vil_target": target, "vil_tent": tent,
            "vil_campfire_logs": campfire_logs, "vil_dock": lambda: dock("vil_dock_v01", 6.0, 2.4),
            "vil_dock_fishing": lambda: dock("vil_dock_fishing_v01", 3.0, 1.4, True), "vil_bunting": bunting}
for n, f in BUILDERS.items():
    if not ONLY or n in ONLY:
        f()
