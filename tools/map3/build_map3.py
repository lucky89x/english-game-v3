"""Batch 24: Map 3 "Golden Wind desert" set (prefix map3_). Run: OUT=<folder> blender -b -P tools/map3/build_map3.py (optional ONLY=...)
Flat colours, named materials, feet at 0, front Blender -Y (glTF +Z). Houses: window_glow (night lights) and roof_tint
(grey 0.8, the game recolours roofs); cloth that the game recolours uses tint_main / tint_trim / tint_accent.
The camel and the fennec pet are rigged (helpers from tools/harbor/b5_mobs.py and tools/pets/build_pets.py).
The four desert NPCs are built by tools/chibi05/build_ngoc_v03.py (variants amira, karim, layla, idris).
"""
import os, sys, math, random
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "harbor"))
sys.path.insert(0, os.path.join(HERE, "..", "pets"))
ONLY = [s for s in os.environ.get("ONLY", "").split(",") if s]
os.environ["ONLY"] = "__none__"          # importing build_pets must not build the pets
from hlib import *  # noqa
from b5_mobs import make_rig, clip, q, bind, FPS  # noqa
import build_pets as P
import bpy, bmesh
from mathutils import Vector, Matrix

TAU = 2 * math.pi


def bump(t, a, b):
    return 0.0 if t <= a or t >= b else math.sin(math.pi * (t - a) / (b - a))


def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def M():
    return dict(sand=mat("sandstone", "#E3C28A", rough=.95), sand2=mat("sandstone_dark", "#C9A26A", rough=.95),
                clay=mat("clay", "#D9A066", rough=.9), plaster=mat("plaster", "#F2E2C2", rough=.9),
                wood=mat("wood", "#8B5E34", rough=.85), wood2=mat("wood_dark", "#5E3D23", rough=.9),
                roof=mat("roof_tint", "#CCCCCC", rough=.8), win=mat("window_glow", "#FFD58A", emit=2.0),
                dark=mat("doorway_dark", "#3A2618", rough=1), cloth=mat("tint_main", "#CCCCCC", rough=.85),
                cloth2=mat("tint_trim", "#CCCCCC", rough=.85), cloth3=mat("tint_accent", "#CCCCCC", rough=.85),
                gold=mat("gold", "#E2B04A", rough=.3, metal=.8), green=mat("leaf", "#5FA046", rough=.8),
                rune=mat("rune_glow", "#5AF0E0", emit=2.5), iron=mat("iron", "#2F3336", rough=.55, metal=.4),
                water=mat("water", "#3FC0C8", rough=.05, alpha=.8))


def keep_origin(o, pivot):
    o.data.transform(Matrix.Translation(-Vector(pivot)))
    o.location = pivot


def windows(m, xs, y, z, w=.6, h=.7, face=-1):
    for x in xs:
        box((w + .16, .12, h + .16), (x, y + face * .04, z), m["wood2"], bev=.01)
        box((w, .08, h), (x, y + face * .08, z), m["win"])


def door(m, x, y, h=2.0, w=1.0, face=-1):
    cyl(w / 2, .2, (x, y + face * .02, h - w / 2), m["wood2"], 12, rot=(math.pi / 2, 0, 0), scale=(1, 1, 1))
    box((w, .2, h - w / 2), (x, y + face * .02, (h - w / 2) / 2), m["wood2"])
    box((w - .15, .1, h - .1 - w / 2), (x, y + face * .1, (h - .1 - w / 2) / 2 + .05), m["dark"])


# ------------------------------------------------------------------ houses
def house_sand_a():
    reset()
    m = M()
    W, D, H = 6.0, 5.0, 3.4
    box((W, D, H), (0, 0, H / 2), m["clay"], bev=.08)
    box((W + .2, D + .2, .25), (0, 0, H + .1), m["roof"], bev=.04)            # flat roof with a parapet
    for sx in (-1, 1):
        box((.2, D + .2, .35), (sx * (W / 2), 0, H + .4), m["roof"])
    box((W + .2, .2, .35), (0, D / 2, H + .4), m["roof"])
    for k in range(5):   # wooden beam ends sticking out under the roof
        box((.14, .4, .14), (-2.4 + k * 1.2, -D / 2 - .1, H - .3), m["wood"])
    door(m, -1.2, -D / 2)
    windows(m, (1.2,), -D / 2, 1.8)
    windows(m, (-1.0, 1.0), 0, 1.9, face=0)
    for k in range(7):   # outside stairs up the right wall to the roof
        box((.9, .5, .2), (W / 2 + .45, -1.8 + k * .5, .25 + k * .48), m["sand2"], bev=.02)
    box((.9, 3.6, .2), (W / 2 + .45, .0, -1), m["sand2"])                    # hidden helper, removed below
    OBJS.pop()
    for sx in (-1, 1):   # sun cloth over the roof on four poles
        for sy in (-1, 1):
            cyl(.05, 1.6, (sx * 2.0, sy * 1.6, H + 1.0), m["wood"], 6)
    box((4.2, 3.4, .04), (0, 0, H + 1.8), m["cloth"], rot=(.08, 0, 0))
    group("house_sand_a")
    export("map3_house_sand_a_v01")


def house_sand_b():
    reset()
    m = M()
    R, H = 2.75, 2.6
    cyl(R, H, (0, 0, H / 2), m["plaster"], 16)
    ball(R * 1.02, (0, 0, H - .1), m["roof"], uv=(16, 8), scale=(1, 1, .7))
    o = OBJS[-1]
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -1e-3], context='VERTS')
    bm.to_mesh(o.data)
    bm.free()
    cyl(.2, .5, (0, 0, H + R * .7 + .2), m["gold"], 8, r2=.02)
    torus(R + .02, .08, (0, 0, H - .05), m["sand2"], 24, 4)
    door(m, 0, -R + .05, 2.0, 1.0)
    for a in (.9, -.9, 2.4, -2.4):
        x, y = (R - .02) * math.sin(a), -(R - .02) * math.cos(a)
        box((.5, .12, .6), (x, y, 1.6), m["win"], rot=(0, 0, a))
    group("house_sand_b")
    export("map3_house_sand_b_v01")


def house_tower():
    reset()
    m = M()
    box((3.0, 3.0, 6.0), (0, 0, 3.0), m["clay"], bev=.06)
    box((3.4, 3.4, .25), (0, 0, 6.1), m["roof"], bev=.03)
    for sx, sy in ((1, 0), (-1, 0), (0, 1), (0, -1)):   # wind catcher with four open slots
        box((2.4 if sx == 0 else .25, .25 if sy == 0 else 2.4, 1.6), (sx * 1.25, sy * 1.25, 7.0), m["clay"])
        box((1.2 if sx == 0 else .3, .3 if sy == 0 else 1.2, 1.0), (sx * 1.27, sy * 1.27, 7.0), m["dark"])
    box((3.0, 3.0, .2), (0, 0, 7.9), m["roof"])
    door(m, 0, -1.5, 2.0, .9)
    windows(m, (0,), -1.5, 3.8, .5, .6)
    windows(m, (0,), -1.5, 5.2, .5, .6)
    cyl(.04, 1.8, (1.2, -1.2, 8.8), m["wood"], 6)
    box((.9, .02, .5), (1.65, -1.2, 9.4), m["cloth"])
    group("house_tower")
    export("map3_house_tower_v01")


def tent_bazaar():
    reset()
    m = M()
    W, D = 4.0, 3.0
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl(.06, 2.5, (sx * (W / 2 - .1), sy * (D / 2 - .1), 1.25), m["wood"], 6)
    for i in range(8):   # striped canopy in three tint colours
        x = -W / 2 + (i + .5) * W / 8
        beam((x, D / 2, 2.5), (x, -D / 2 - .3, 2.15), W / 8, (m["cloth"], m["cloth2"], m["cloth3"])[i % 3], .03)
    box((W - .4, .7, .9), (0, -D / 2 + .5, .45), m["wood"], bev=.02)          # counter
    box((W - .3, .75, .06), (0, -D / 2 + .5, .92), m["cloth2"])
    box((3.0, 2.0, .02), (0, .3, .01), m["cloth3"])                            # rug
    rnd = random.Random(2)
    for k in range(6):   # goods: pots and fruit baskets
        x = -1.5 + k * .6
        lathe([(0, 0), (.15, 0), (.2, .15), (.12, .3), (.14, .32), (0, .32)], m["clay"], seg=8, loc=(x, -D / 2 + .5, .95))
    for x in (-1.6, 1.6):   # lanterns
        beam((x, -D / 2 - .2, 2.2), (x, -D / 2 - .2, 1.9), .02, m["iron"])
        ball(.14, (x, -D / 2 - .2, 1.8), m["win"], uv=(10, 6), scale=(1, 1, 1.2))
    group("tent_bazaar")
    export("map3_tent_bazaar_v01")


def inn_oasis():
    reset()
    m = M()
    W, D, H = 8.0, 6.0, 4.0
    box((W, D, H), (0, 0, H / 2), m["plaster"], bev=.08)
    box((W + .2, D + .2, .3), (0, 0, H + .1), m["roof"], bev=.04)
    for i in range(6):   # cloth roof over a terrace on top
        x = -3 + i * 1.2
        beam((x, D / 2 - .3, H + 1.6), (x, -D / 2 + .3, H + 1.2), 1.2, m["cloth"] if i % 2 else m["cloth2"], .03)
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl(.07, 1.6, (sx * 3.6, sy * 2.6, H + .8), m["wood"], 6)
    door(m, 0, -D / 2, 2.4, 1.4)
    windows(m, (-2.6, 2.6), -D / 2, 2.0, .8, .8)
    windows(m, (-2.6, 0, 2.6), -D / 2, 3.3, .6, .5)
    box((2.2, .1, .6), (0, -D / 2 - .4, 3.0), mat("sign_blank", "#E8D2A6"), bev=.02)       # blank hanging sign
    for sx in (-1, 1):
        beam((sx * .9, -D / 2, 3.5), (sx * .9, -D / 2 - .4, 3.3), .03, m["iron"])
    # small well at the side
    lathe([(0, 0), (.7, 0), (.7, .8), (.55, .8), (.55, .1), (0, .1)], m["sand2"], seg=12, loc=(W / 2 + 1.2, -1.5, 0))
    cyl(.55, .02, (W / 2 + 1.2, -1.5, .6), m["water"], 12)
    for sx in (-1, 1):
        cyl(.05, 1.4, (W / 2 + 1.2 + sx * .6, -1.5, 1.5), m["wood"], 6)
    beam((W / 2 + .6, -1.5, 2.1), (W / 2 + 1.8, -1.5, 2.1), .08, m["wood"])
    group("inn_oasis")
    export("map3_inn_oasis_v01")


def temple_gate():
    reset()
    m = M()
    for sx in (-1, 1):   # two carved columns, half buried
        cyl(.55, 6.2, (sx * 2.5, 0, 3.1), m["sand"], 10)
        for k in range(6):
            box((.12, .03, .35), (sx * 2.5, -.55, 1.4 + k * .75), m["rune"])
        box((1.4, 1.4, .4), (sx * 2.5, 0, 6.3), m["sand2"], bev=.04)
    box((6.4, 1.4, .8), (0, 0, 6.9), m["sand"], bev=.05)
    box((2.0, .1, .5), (0, -.71, 6.9), m["rune"])
    ball(4.0, (0, -.5, -.6), m["sand2"], sub=3, scale=(1.3, .6, .32), jit=.05)   # sand drift over the base
    group("temple_gate")
    export("map3_temple_gate_v01")


def house_home():
    reset()
    m = M()
    W, D, H = 7.0, 6.4, 3.6
    box((W, D, H), (0, 0, H / 2), m["plaster"], bev=.08)
    box((W + .3, D + .3, .3), (0, 0, H + .15), m["roof"], bev=.04)
    ball(2.4, (1.2, .6, H + .2), m["roof"], uv=(16, 8), scale=(1, 1, .75))
    o = OBJS[-1]
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -1e-3], context='VERTS')
    bm.to_mesh(o.data)
    bm.free()
    cyl(.15, .5, (1.2, .6, H + 2.2), m["gold"], 8, r2=.02)
    door(m, -1.4, -D / 2, 2.2, 1.2)
    windows(m, (1.2, 2.6), -D / 2, 1.9, .7, .7)
    windows(m, (-2, 2), D / 2, 1.9, .7, .7, face=1)
    for k in range(3):   # pots of flowers by the door
        lathe([(0, 0), (.2, 0), (.26, .4), (0, .4)], m["clay"], seg=8, loc=(-2.6 + k * .5 * 0, -D / 2 - .4, 0))
        ball(.25, (-2.6, -D / 2 - .4, .6), m["green"], sub=2)
        break
    box((2.6, .06, .9), (-1.4, -D / 2 - .7, 2.6), m["cloth"], rot=(.6, 0, 0))    # awning over the door
    group("house_home")
    export("map3_house_home_v01")


# ------------------------------------------------------------------ outdoor props
def well():
    reset()
    m = M()
    lathe([(0, 0), (.8, 0), (.8, .9), (.62, .9), (.62, .15), (0, .15)], m["sand2"], seg=14)
    cyl(.62, .02, (0, 0, .7), mat("water_glow", "#5AD8F0", emit=1.5, alpha=.8), 14)
    for sx in (-1, 1):
        box((.12, .12, 1.8), (sx * .7, 0, 1.6), m["wood"], bev=.01)
    beam((-.8, 0, 2.4), (.8, 0, 2.4), .1, m["wood"])
    cyl(.12, .3, (0, 0, 2.2), m["wood2"], 10, rot=(0, math.pi / 2, 0))         # pulley
    beam((0, 0, 2.1), (0, 0, 1.3), .015, mat("rope", "#C9A66B"))
    lathe([(0, 0), (.15, 0), (.18, .25), (0, .25)], m["wood"], seg=8, loc=(0, 0, 1.05))
    group("well")
    export("map3_well_v01")


def oasis_pool():
    reset()
    m = M()
    cyl(1.0, .05, (0, 0, .05), m["water"], 24, scale=(3.5, 2.5, 1))
    rnd = random.Random(4)
    for k in range(18):   # stone rim
        a = k * TAU / 18
        ball(.35, (3.6 * math.cos(a), 2.6 * math.sin(a), .1), m["sand2"], sub=2, scale=(1.2, 1, .5), jit=.04, seed=k)
    for k in range(3):   # reeds
        x, y = rnd.uniform(-2.5, 2.5), rnd.uniform(1.5, 2.2)
        for j in range(4):
            cyl(.02, .9 + .2 * j, (x + .06 * j, y, .45 + .1 * j), m["green"], 4, r2=0, rot=(rnd.uniform(-.15, .15), rnd.uniform(-.15, .15), 0))
        cyl(.04, .2, (x, y, 1.2), m["wood2"], 6)
    group("oasis_pool")
    export("map3_oasis_pool_v01")


def palm_date(fname, lean, seed):
    reset()
    m = M()
    trunk, leaf, leaf2 = mat("palm_bark", "#9C7A4E", rough=.9), mat("leaf", "#4FA83D", rough=.75), mat("leaf_dark", "#3A8A33", rough=.75)
    dates = mat("dates", "#8A3A1A", rough=.5)
    rnd = random.Random(seed)
    H = 5.5
    pts = [Vector((lean * t * t, 0, H * t)) for t in [i / 8 for i in range(9)]]
    for i in range(8):
        rod(tuple(pts[i]), tuple(pts[i + 1]), .2 - .06 * i / 8, .2 - .06 * (i + 1) / 8, trunk, 8)
        torus(.2 - .06 * i / 8, .03, tuple(pts[i]), mat("palm_ring", "#7A5C38"), 8, 3)
    top = pts[-1]
    for k in range(9):   # fronds
        a = k / 9 * TAU + rnd.uniform(-.2, .2)
        d = Vector((math.cos(a), math.sin(a), 0))
        side = Vector((-d.y, d.x, 0))
        verts, f1, f2 = [], [], []
        for i in range(7):
            t = i / 6
            c = top + d * 2.4 * t + Vector((0, 0, .5 * math.sin(math.pi * t * .7) - 1.2 * t * t))
            w = .35 * math.sin(math.pi * min(1, t * 1.1)) + .02
            verts += [c + side * w, c, c - side * w]
        for i in range(6):
            a0 = i * 3
            f1 += [[a0, a0 + 3, a0 + 4, a0 + 1], [a0 + 1, a0 + 4, a0 + 5, a0 + 2]]
            f2 += [[a0 + 1, a0 + 4, a0 + 3, a0], [a0 + 2, a0 + 5, a0 + 4, a0 + 1]]
        mesh(verts, f1, leaf if k % 2 else leaf2)
        mesh([v - Vector((0, 0, .012)) for v in verts], f2, leaf if k % 2 else leaf2)
    for k in range(3):   # hanging date clusters
        a = k * 2.1
        c = top + Vector((.3 * math.cos(a), .3 * math.sin(a), -.4))
        for j in range(6):
            ball(.06, tuple(c + Vector((.06 * math.cos(j), .06 * math.sin(j), -.08 * (j % 3)))), dates, sub=1)
    ball(.5, (0, 0, .05), m["sand"], sub=1, scale=(1, 1, .25))
    group("palm_date")
    export(fname)


def cactus(fname, H, arms, flower=False):
    reset()
    g, g2 = mat("cactus_green", "#5FA046", rough=.7), mat("cactus_dark", "#3E7A33", rough=.7)
    pink = mat("flower_pink", "#F28AB3", rough=.6)
    lathe([(0, 0), (.25, 0), (.28, .3), (.27, H - .3), (.2, H - .08), (0, H)], g, seg=10)
    for k in range(10):
        a = k * TAU / 10
        beam((.27 * math.cos(a), .27 * math.sin(a), .2), (.25 * math.cos(a), .25 * math.sin(a), H - .2), .04, g2)
    for i, (sd, z, ln) in enumerate(arms):
        rod((sd * .25, 0, z), (sd * .55, 0, z), .14, .14, g, 8)
        rod((sd * .55, 0, z), (sd * .58, 0, z + ln), .14, .12, g, 8)
        ball(.12, (sd * .58, 0, z + ln), g, uv=(8, 5))
    if flower:
        for k in range(5):
            a = k * TAU / 5
            ball(.08, (.08 * math.cos(a), .08 * math.sin(a), H + .03), pink, uv=(6, 4), scale=(1, 1, .5))
        ball(.05, (0, 0, H + .06), mat("flower_yellow", "#F5C842"), uv=(6, 4))
    group("cactus")
    export(fname)


def dune_rock(fname, H, seed):
    reset()
    m = M()
    rnd = random.Random(seed)
    z = 0.0
    k = 0
    while z < H - .05:   # stacked sandstone slabs, each a little offset
        h = rnd.uniform(.25, .45) * H / 2
        r = (1 - .5 * z / H) * H * .6
        cyl(r, h, (rnd.uniform(-.1, .1) * H, rnd.uniform(-.1, .1) * H, z + h / 2), m["sand"] if k % 2 else m["sand2"], 7, r2=r * .9,
            rot=(0, 0, rnd.uniform(0, 1)))
        z += h
        k += 1
    group("dune_rock")
    export(fname)


def dry_bush():
    reset()
    br = mat("dry_twig", "#9C7A4E", rough=.9)
    rnd = random.Random(7)
    for k in range(16):
        a, e = rnd.uniform(0, TAU), rnd.uniform(.4, 1.2)
        L = rnd.uniform(.4, .7)
        rod((0, 0, .05), (L * math.cos(a) * math.cos(e), L * math.sin(a) * math.cos(e), .05 + L * math.sin(e)), .025, .006, br, 4)
    ball(.12, (0, 0, .05), mat("dry_leaf", "#B8A060"), sub=1, scale=(1, 1, .5))
    group("dry_bush")
    export("map3_dry_bush_v01")


def skeleton():
    reset()
    bone = mat("bone_cream", "#F2E8D2", rough=.7)
    for k in range(9):   # spine
        ball(.09, (0, -.8 + k * .2, .2 + .08 * math.sin(k * .5)), bone, uv=(8, 5))
    for k in range(5):   # ribs
        for sd in (-1, 1):
            pts = [Vector((sd * .05, -.4 + k * .16, .25)), Vector((sd * .3, -.4 + k * .16, .18)), Vector((sd * .32, -.4 + k * .16, 0))]
            for a_, b_ in zip(pts, pts[1:]):
                rod(tuple(a_), tuple(b_), .03, .025, bone, 6)
    ball(.25, (0, -1.1, .2), bone, uv=(12, 8), scale=(1, 1.3, .8))        # friendly round skull
    for sd in (-1, 1):
        ball(.07, (sd * .1, -1.33, .27), mat("eye_hole", "#5A4632"), uv=(8, 5), scale=(1, .4, 1))
        rod((sd * .12, -1.0, .35), (sd * .35, -.9, .6), .05, .02, bone, 6)       # little horns
    ball(.04, (0, -1.4, .15), mat("flower_pink", "#F28AB3"), sub=1)
    group("skeleton")
    export("map3_skeleton_v01")


def obelisk():
    reset()
    m = M()
    box((1.2, 1.2, .3), (0, 0, .15), m["sand2"], bev=.03)
    cyl(.5, 2.4, (0, 0, 1.5), m["sand"], 4, r2=.38, rot=(0, 0, math.pi / 4))
    cyl(.38, .4, (0, 0, 2.9), m["sand2"], 4, r2=0, rot=(0, 0, math.pi / 4))
    box((.5, .02, 1.5), (0, -.39, 1.5), mat("sign_blank", "#EAD6AA", rough=.9), rot=(.04, 0, 0))   # blank face for words
    for z in (.4, 2.4):
        box((.55, .02, .06), (0, -.4, z), m["rune"])
    group("obelisk")
    export("map3_obelisk_v01")


def ruin_pillar():
    reset()
    m = M()
    box((1.0, 1.0, .3), (0, 0, .15), m["sand2"], bev=.03)
    cyl(.38, 1.8, (0, 0, 1.2), m["sand"], 10, rot=(.08, .05, 0))
    o = OBJS[-1]
    for v in o.data.vertices:   # broken top
        if v.co.z > 0:
            v.co.z -= .25 * (1 + math.sin(v.co.x * 9))
    cyl(.38, .6, (.9, .4, .3), m["sand"], 10, rot=(math.pi / 2, 0, .6))
    group("ruin_pillar")
    export("map3_ruin_pillar_v01")


def ruin_arch():
    reset()
    m = M()
    for sx in (-1, 1):
        box((.8, .8, 2.6 if sx < 0 else 1.6), (sx * 1.6, 0, 1.3 if sx < 0 else .8), m["sand"], bev=.05)
    for k in range(6):
        a = math.pi * (k + .5) / 8
        box((.8, .8, .55), (1.6 * math.cos(math.pi - a) * -1 if False else -1.6 + 1.6 * (1 - math.cos(a)), 0, 2.6 + 1.4 * math.sin(a)),
            m["sand2"], rot=(0, a - math.pi / 2, 0), bev=.04)
    ball(2.8, (0, 0, -.6), m["sand2"], sub=3, scale=(1.4, .7, .35), jit=.05)
    group("ruin_arch")
    export("map3_ruin_arch_v01")


def sandstorm_post():
    reset()
    m = M()
    cyl(.06, 3.2, (0, 0, 1.6), m["wood"], 8)
    ball(.08, (0, 0, 3.25), m["gold"], sub=2)
    for k in range(5):
        ball(.2, (.35 * math.cos(k * 1.3), .35 * math.sin(k * 1.3), .08), m["sand2"], sub=1, scale=(1.2, 1, .6))
    group("sandstorm_post", origin=None)
    verts, faces = [], []
    nx, nz = 8, 4
    for side, off in ((0, .005), (1, -.005)):
        base = len(verts)
        for j in range(nz + 1):
            for i in range(nx + 1):
                verts.append((.06 + 1.0 * i / nx, off, 2.5 + .6 * j / nz))
        for j in range(nz):
            for i in range(nx):
                a = base + j * (nx + 1) + i
                f = [a, a + 1, a + nx + 2, a + nx + 1]
                faces.append(f if side == 0 else f[::-1])
    mesh(verts, faces, mat("flag_yellow", "#F5C842", rough=.8))
    flag = group("storm_flag", origin=None)
    flag.data.transform(Matrix.Translation((-.06, 0, -2.5)))
    flag.location = (.06, 0, 2.5)
    bpy.context.scene.render.fps = 24
    ad = flag.animation_data_create()   # Wave: the flag swings on the pole (2 s loop)
    act = bpy.data.actions.new("Wave")
    ad.action = act
    for f in range(0, 49, 2):
        t = f / 48
        flag.rotation_euler = (0, 0, .35 * math.sin(TAU * t))
        flag.scale = (1, 1, 1 + .05 * math.sin(TAU * 2 * t))
        flag.keyframe_insert("rotation_euler", frame=f + 1)
        flag.keyframe_insert("scale", frame=f + 1)
    act.use_fake_user = True
    tr = ad.nla_tracks.new()
    tr.name = "Wave"
    tr.strips.new("Wave", 1, act)
    ad.action = None
    flag.rotation_euler, flag.scale = (0, 0, 0), (1, 1, 1)
    export("map3_sandstorm_post_v01", anim=True)


def lantern_pole():
    reset()
    m = M()
    lathe([(0, 0), (.18, 0), (.18, .1), (.08, .2), (0, .2)], m["iron"], seg=8)
    cyl(.04, 2.8, (0, 0, 1.6), m["iron"], 8)
    beam((0, 0, 2.9), (.45, 0, 2.9), .03, m["iron"])
    beam((.45, 0, 2.9), (.45, 0, 2.75), .015, m["iron"])
    ball(.2, (.45, 0, 2.55), mat("lantern_red", "#E8603A", rough=.6), uv=(12, 8), scale=(1, 1, 1.15))
    ball(.12, (.45, 0, 2.55), m["win"], uv=(8, 5))
    cyl(.08, .05, (.45, 0, 2.78), m["gold"], 8)
    cyl(.06, .05, (.45, 0, 2.31), m["gold"], 8)
    group("lantern_pole")
    export("map3_lantern_pole_v01")


def carpet():
    reset()
    m = M()
    box((2.0, 1.4, .02), (0, 0, .01), m["cloth"])
    box((1.6, 1.0, .022), (0, 0, .012), m["cloth2"])
    box((.8, .4, .024), (0, 0, .014), m["cloth3"])
    for k in range(12):   # fringe on the short ends
        for sx in (-1, 1):
            box((.06, .012, .004), (sx * 1.03, -.6 + k * .11, .004), m["cloth2"])
    group("carpet")
    export("map3_carpet_v01")


def crate_sack():
    reset()
    m = M()
    box((.8, .8, .8), (-.3, 0, .4), m["wood"], bev=.02)
    for z in (.2, .6):
        box((.82, .82, .06), (-.3, 0, z), m["wood2"])
    burlap = mat("burlap", "#CDB384", rough=1.0)
    for k, (x, y) in enumerate(((.5, -.2), (.55, .35))):
        ball(.32, (x, y, .28), burlap, uv=(10, 6), scale=(1, .9, .9), jit=.01, seed=k)
        ball(.1, (x, y, .58), burlap, uv=(6, 4))
        torus(.08, .015, (x, y, .52), mat("rope", "#A07F4E"), 8, 3)
    group("crate_sack")
    export("map3_crate_sack_v01")


def chest():
    reset()
    m = M()
    wood, gold = mat("wood_chest", "#A86A3A", rough=.7), m["gold"]
    coins = mat("light_gold", "#FFD45A", emit=1.6, rough=.3, metal=.6)
    W, D, H = 1.0, .62, .48
    box((W, D, H), (0, 0, H / 2), wood, bev=.02)
    for x in (-W / 2 + .1, W / 2 - .1):
        box((.08, D + .02, H + .01), (x, 0, H / 2), gold, bev=.01)
    box((W - .06, D - .06, .02), (0, 0, H - .07), m["wood2"])
    ball(.42, (0, 0, H - .06), coins, sub=2, scale=(1.05, .62, .32))
    box((.14, .03, .18), (0, -D / 2 - .01, H - .08), gold, bev=.01)
    group("chest_base", origin=None)
    o = cyl(D / 2, W, (0, 0, H), wood, 16, rot=(0, math.pi / 2, 0))
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.x > 1e-4], context='VERTS')
    bm.to_mesh(o.data)
    bm.free()
    for x in (-W / 2 + .1, W / 2 - .1):   # curved gold bands
        o2 = cyl(D / 2 + .012, .08, (x, 0, H), gold, 16, rot=(0, math.pi / 2, 0), cap=False)
        bm = bmesh.new()
        bm.from_mesh(o2.data)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.x > 1e-4], context='VERTS')
        bm.to_mesh(o2.data)
        bm.free()
    box((W, D, .03), (0, 0, H + .015), m["wood2"])
    lid = group("chest_lid", origin=None)
    keep_origin(lid, (0, D / 2, H))
    bpy.context.scene.render.fps = 24
    lid.rotation_mode = 'XYZ'
    ad = lid.animation_data_create()
    act = bpy.data.actions.new("Open")
    ad.action = act
    for f, a in ((1, 0.0), (5, -.25), (14, -1.8), (17, -1.95), (20, -1.88)):
        lid.rotation_euler = (a, 0, 0)
        lid.keyframe_insert("rotation_euler", frame=f)
    act.use_fake_user = True
    tr = ad.nla_tracks.new()
    tr.name = "Open"
    tr.strips.new("Open", 1, act)
    ad.action = None
    lid.rotation_euler = (0, 0, 0)
    export("map3_chest_v01", anim=True)


def signpost():
    reset()
    m = M()
    blank = mat("sign_blank", "#EAD6AA", rough=.8)
    box((.14, .14, 2.3), (0, 0, 1.15), m["wood2"], bev=.015)
    for k, (z, a) in enumerate(((2.0, .3), (1.65, -1.4), (1.3, 2.6))):
        L = .9
        c, s = math.cos(a), math.sin(a)
        pts = [(-.05, -.13), (L - .18, -.13), (L, 0), (L - .18, .13), (-.05, .13)]
        for off in (-.035, .035):
            mesh([(x * c, x * s + off * c * 0 + off, z + y) for x, y in pts], [list(range(5)) if off > 0 else list(range(5))[::-1]], m["wood"])
        mesh([(x * c * .85 + .03 * c, x * s * .85 - .037, z + y * .7) for x, y in pts], [list(range(5))[::-1]], blank)
    group("signpost")
    export("map3_signpost_v01")


# ------------------------------------------------------------------ camel, fennec pet, sand skiff
def camel():
    reset()
    fur, fur2 = mat("camel_fur", "#D9AE72", rough=.85), mat("camel_dark", "#A87E48", rough=.85)
    saddle, saddle2 = mat("tint_main", "#CCCCCC", rough=.7), mat("tint_trim", "#CCCCCC", rough=.7)
    ew, eb = mat("eye_white", "#FFFFFF", rough=.3), mat("eye_black", "#1B1B22", rough=.2)
    arm = make_rig("camel", [("root", (0, 0, 0), None), ("body", (0, 0, 1.0), "root"), ("neck", (0, -.55, 1.15), "body"),
                             ("head", (0, -.8, 1.65), "neck"), ("jaw", (0, -1.05, 1.6), "head"),
                             ("leg_FL", (.22, -.4, .9), "body"), ("leg_FR", (-.22, -.4, .9), "body"),
                             ("leg_BL", (.22, .45, .9), "body"), ("leg_BR", (-.22, .45, .9), "body"), ("tail", (0, .7, 1.1), "body")])
    s = len(OBJS)
    ball(.45, (0, 0, 1.05), fur, uv=(14, 10), scale=(.8, 1.45, .75))
    ball(.32, (0, .05, 1.42), fur, uv=(12, 8), scale=(.9, 1.1, .9))        # hump
    box((.75, .8, .12), (0, .05, 1.36), saddle, bev=.03)
    box((.8, .1, .5), (0, .05, 1.15), saddle2, bev=.02)
    for sd in (-1, 1):
        box((.06, .5, .35), (sd * .38, .05, 1.1), saddle2, bev=.02)
    P.tag("body", s) if False else tag("body", s)
    s = len(OBJS)
    rod((0, -.5, 1.15), (0, -.78, 1.6), .17, .13, fur, 8)
    tag("neck", s)
    s = len(OBJS)
    ball(.2, (0, -.88, 1.7), fur, uv=(12, 8), scale=(.85, 1.2, .85))
    ball(.13, (0, -1.06, 1.62), fur2, uv=(10, 6), scale=(1, 1.1, .8))
    for sd in (-1, 1):
        ball(.05, (sd * .1, -.98, 1.78), ew, uv=(8, 5), scale=(1, .6, 1))
        ball(.03, (sd * .1, -1.01, 1.78), eb, uv=(6, 4))
        ball(.045, (sd * .12, -.78, 1.86), fur2, uv=(6, 4), scale=(.6, 1, 1.3))
    tag("head", s)
    s = len(OBJS)
    tag("jaw", s)
    for leg, x, y in (("leg_FL", .22, -.4), ("leg_FR", -.22, -.4), ("leg_BL", .22, .45), ("leg_BR", -.22, .45)):
        s = len(OBJS)
        rod((x, y, .9), (x, y, .45), .09, .07, fur, 8)
        rod((x, y, .45), (x, y - .02, .05), .065, .055, fur, 8)
        ball(.08, (x, y - .04, .04), fur2, uv=(8, 5), scale=(1.1, 1.3, .5))
        tag(leg, s)
    s = len(OBJS)
    rod((0, .7, 1.1), (0, .78, .75), .03, .02, fur2, 5)
    tag("tail", s)

    def idle(t):
        s_ = math.sin(TAU * t)
        return {"neck": (q((1, 0, 0), .05 * s_), None, None), "head": (q((0, 0, 1), .15 * math.sin(TAU * t + 1)), None, None),
                "jaw": (q((1, 0, 0), .1 * max(0, math.sin(TAU * 3 * t))), None, None), "tail": (q((0, 0, 1), .3 * s_), None, None)}

    def walk(t):
        s_ = math.sin(TAU * t)
        p = {"root": (None, (0, 0, .03 * abs(math.cos(TAU * t))), None), "neck": (q((1, 0, 0), .12 * s_), None, None)}
        for leg, ph in (("leg_FL", 0), ("leg_BL", 0), ("leg_FR", math.pi), ("leg_BR", math.pi)):   # camels pace
            p[leg] = (q((1, 0, 0), .45 * math.sin(TAU * t + ph)), None, None)
        return p

    def sit(t):
        f = ease(t * 1.4)
        return {"body": (None, (0, 0, -.55 * f), None), "neck": (q((1, 0, 0), -.2 * f), None, None),
                **{leg: (q((1, 0, 0), (-1.4 if leg[4] == "F" else 1.4) * f), (0, 0, 0), None) for leg in ("leg_FL", "leg_FR", "leg_BL", "leg_BR")}}

    def spit(t):
        k = bump(t, .3, .7)
        return {"neck": (q((1, 0, 0), -.25 * bump(t, 0, .35) + .3 * k), None, None), "jaw": (q((1, 0, 0), .5 * k), None, None)}
    clip(arm, "Idle", 48, idle)
    clip(arm, "Walk", 24, walk)
    clip(arm, "Sit", 30, sit)
    clip(arm, "Spit", 24, spit)
    o = group("camel", origin=None, smooth=True)
    bind(o, arm)
    export("map3_camel_v01", objs=[o], anim=True)


def fennec():
    reset()
    fur, cream = mat("fennec_sand", "#E8C88A", rough=.75), mat("fennec_cream", "#FBF0DC", rough=.7)
    inner, nose = mat("fennec_ear_pink", "#F2B6A8", rough=.6), mat("fennec_nose", "#2A1E1A", rough=.3)
    ew, eb, sh = mat("eye_white", "#FFFFFF", rough=.3), mat("eye_black", "#1B1B22", rough=.2), mat("eye_shine", "#FFFFFF", emit=1.5)
    arm = make_rig("fennec", [("root", (0, 0, 0), None), ("body", (0, 0, .12), "root"), ("head", (0, -.06, .24), "body"),
                              ("arm_L", (.06, -.07, .16), "body"), ("arm_R", (-.06, -.07, .16), "body"),
                              ("leg_L", (.05, .04, .08), "root"), ("leg_R", (-.05, .04, .08), "root"), ("tail", (0, .1, .12), "body")])
    s = len(OBJS)
    ball(.1, (0, 0, .14), fur, uv=(12, 8), scale=(.9, 1.15, 1))
    ball(.065, (0, -.05, .13), cream, uv=(10, 6), scale=(.8, .6, 1.1))
    tag("body", s)
    s = len(OBJS)
    ball(.11, (0, -.06, .29), fur, uv=(14, 10), scale=(1.05, 1, .92))
    ball(.05, (0, -.15, .27), cream, uv=(10, 6), scale=(1.1, 1, .8))
    ball(.014, (0, -.2, .28), nose, uv=(6, 4))
    P.eyes(.045, -.14, .31, .022, ew, eb, sh)
    for sd in (-1, 1):   # very big ears
        cyl(.06, .2, (sd * .08, -.04, .44), fur, 4, r2=.005, rot=(0, sd * .35, 0), scale=(1, .45, 1))
        cyl(.04, .16, (sd * .08, -.06, .43), inner, 4, r2=.004, rot=(0, sd * .35, 0), scale=(1, .3, 1))
    tag("head", s)
    for sd, sn in ((1, "L"), (-1, "R")):
        s = len(OBJS)
        rod((sd * .06, -.07, .16), (sd * .065, -.09, .05), .02, .018, fur, 6)
        tag("arm_" + sn, s)
        s = len(OBJS)
        rod((sd * .05, .04, .08), (sd * .055, .02, .02), .025, .022, fur, 6)
        ball(.024, (sd * .055, .0, .015), cream, uv=(6, 4), scale=(1, 1.3, .5))
        tag("leg_" + sn, s)
    s = len(OBJS)
    rod((0, .1, .12), (0, .2, .2), .03, .05, fur, 8)
    ball(.05, (0, .22, .22), cream, uv=(8, 5))
    tag("tail", s)
    side = lambda sd, a: q((0, 1, 0), -sd * a)
    P.common_clips(arm, .4, {
        "walk": lambda t: {"leg_L": (q((1, 0, 0), .5 * math.sin(TAU * t)), None, None), "leg_R": (q((1, 0, 0), -.5 * math.sin(TAU * t)), None, None),
                           "arm_L": (q((1, 0, 0), -.4 * math.sin(TAU * t)), None, None), "arm_R": (q((1, 0, 0), .4 * math.sin(TAU * t)), None, None),
                           "tail": (q((0, 0, 1), .3 * math.sin(TAU * t)), None, None)},
        "idle": lambda t: {"tail": (q((0, 0, 1), .2 * math.sin(TAU * t)), None, None)},
        "sit": lambda t: {"leg_L": (q((1, 0, 0), -1.2 * min(1, t * 1.6)), None, None), "leg_R": (q((1, 0, 0), -1.2 * min(1, t * 1.6)), None, None)},
        "dance": lambda t: {"arm_L": (side(1, 1.2 + .6 * math.sin(2 * TAU * t)), None, None), "arm_R": (side(-1, 1.2 - .6 * math.sin(2 * TAU * t)), None, None)},
        "wave": lambda t: {"arm_L": (side(1, 2.4 * math.sin(math.pi * min(1, t * 1.25))) @ q((1, 0, 0), .5 * math.sin(4 * TAU * t)), None, None)},
    })
    P.finish("fennec", arm, "pet_fennec_v01")


def sand_skiff():
    reset()
    m = M()
    hull, sail = mat("skiff_wood", "#B0703E", rough=.8), mat("tint_main", "#CCCCCC", rough=.8)
    lathe([(0, 0), (.45, .02), (.55, .22), (.55, .35), (0, .35)], hull, seg=10, scale=(1, 3.0, 1))
    box((.9, 2.4, .04), (0, .1, .3), m["wood2"])
    for sd in (-1, 1):   # two runners on the sand
        beam((sd * .45, -1.4, .02), (sd * .45, 1.4, .02), .06, m["wood2"], .06)
        beam((sd * .45, -1.4, .02), (sd * .42, -1.6, .2), .06, m["wood2"], .06)
    cyl(.05, 3.0, (0, -.3, 1.8), m["wood"], 8)
    mesh([(0, -.32, .6), (0, -.32, 3.2), (0, .9, .6)], [[0, 1, 2]], sail)
    mesh([(0, -.28, .6), (0, -.28, 3.2), (0, .94, .6)], [[2, 1, 0]], sail)
    beam((0, -.3, .65), (0, 1.0, .65), .05, m["wood"])
    box((.3, .3, .3), (0, .9, .5), m["wood"], bev=.02)
    group("sand_skiff")
    export("map3_sand_skiff_v01")


BUILDERS = {"map3_house_sand_a": house_sand_a, "map3_house_sand_b": house_sand_b, "map3_house_tower": house_tower,
            "map3_tent_bazaar": tent_bazaar, "map3_inn_oasis": inn_oasis, "map3_temple_gate": temple_gate, "map3_house_home": house_home,
            "map3_well": well, "map3_oasis_pool": oasis_pool,
            "map3_palm_date_a": lambda: palm_date("map3_palm_date_a_v01", .5, 1), "map3_palm_date_b": lambda: palm_date("map3_palm_date_b_v01", -.9, 2),
            "map3_cactus_a": lambda: cactus("map3_cactus_a_v01", 2.5, [(1, 1.0, .7), (-1, 1.4, .6)]),
            "map3_cactus_b": lambda: cactus("map3_cactus_b_v01", 1.6, [(1, .7, .4)]),
            "map3_cactus_flower": lambda: cactus("map3_cactus_flower_v01", 1.2, [], flower=True),
            "map3_dune_rock_a": lambda: dune_rock("map3_dune_rock_a_v01", 1.0, 1), "map3_dune_rock_b": lambda: dune_rock("map3_dune_rock_b_v01", 2.0, 2),
            "map3_dune_rock_c": lambda: dune_rock("map3_dune_rock_c_v01", 3.0, 3), "map3_dry_bush": dry_bush, "map3_skeleton": skeleton,
            "map3_obelisk": obelisk, "map3_ruin_pillar": ruin_pillar, "map3_ruin_arch": ruin_arch, "map3_sandstorm_post": sandstorm_post,
            "map3_lantern_pole": lantern_pole, "map3_carpet": carpet, "map3_crate_sack": crate_sack, "map3_chest": chest,
            "map3_signpost": signpost, "map3_camel": camel, "pet_fennec": fennec, "map3_sand_skiff": sand_skiff}
for n, f in BUILDERS.items():
    if not ONLY or n in ONLY:
        f()
