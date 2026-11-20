"""Batch 18: Memory Forest props. Run: OUT=<folder> blender -b -P tools/forest/build_forest.py (optional ONLY=...)
Feet at 0, front Blender -Y (glTF +Z). Glow materials: window_glow, crystal_glow, rune_glow, portal_ring, light_*;
water_fall is its own material so the game can scroll it; the ancient tree's leaves are a separate node "canopy".
"""
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "harbor"))
from hlib import *  # noqa
import bpy, bmesh
from mathutils import Vector, Matrix

ONLY = [s for s in os.environ.get("ONLY", "").split(",") if s]
TAU = 2 * math.pi


def rock(r, loc, m, seed, scale=(1, 1, 1), sub=2, jag=.18, rot=(0, 0, 0)):
    rnd = random.Random(seed)
    o = ball(r, loc, m, sub=sub, scale=scale, rot=rot)
    for v in o.data.vertices:
        v.co *= 1 + rnd.uniform(-jag, jag)
    return o


def keep_origin(o, pivot):
    o.data.transform(Matrix.Translation(-Vector(pivot)))
    o.location = pivot


def M():
    return dict(wood=mat("wood", "#8B5E34", rough=.85), wood2=mat("wood_dark", "#5E3D23", rough=.9), bark=mat("bark", "#6B4A2E", rough=.95),
                stone=mat("stone_grey", "#8C8A84", rough=.95), stone2=mat("stone_dark", "#6B6964", rough=.95), moss=mat("moss", "#6E8A58", rough=.95),
                leaf=mat("leaf_a", "#8DB850", rough=.8), leaf2=mat("leaf_b", "#C9C85A", rough=.8), glow=mat("window_glow", "#FFD58A", emit=2.5),
                lamp=mat("light_lamp", "#FFE3A0", emit=3.5), iron=mat("iron", "#2F3336", rough=.55, metal=.4))


def lantern(loc, m, s=1.0):
    x, y, z = loc
    cyl(.06 * s, .05 * s, (x, y, z + .14 * s), m["iron"], 6)
    cyl(.07 * s, .2 * s, (x, y, z), m["lamp"], 6, r2=.08 * s)
    cyl(.09 * s, .06 * s, (x, y, z - .12 * s), m["iron"], 6)


def tree_ancient():
    reset()
    m = M()
    R, H = 1.5, 14.0
    lathe([(0, 0), (2.0, 0), (1.6, .8), (1.45, 2.0), (1.35, 5.0), (1.2, 8.0), (1.1, 9.5), (0, 9.6)], m["bark"], seg=14)
    rnd = random.Random(1)
    for k in range(7):   # big surface roots
        a = k * TAU / 7 + rnd.uniform(-.2, .2)
        rod((1.2 * math.cos(a), 1.2 * math.sin(a), .9), (3.4 * math.cos(a), 3.4 * math.sin(a), 0), .55, .12, m["bark"], 6)
    for k in range(5):   # bark ridges
        a = k * TAU / 5 + .3
        rod((1.42 * math.cos(a), 1.42 * math.sin(a), .5), (1.15 * math.cos(a + .3), 1.15 * math.sin(a + .3), 8.5), .18, .1, m["wood2"], 5)
    # hollow with a little round door and a glowing window
    cyl(.55, .3, (0, -1.4, 1.0), m["wood2"], 14, rot=(math.pi / 2, 0, 0))
    cyl(.45, .1, (0, -1.56, 1.0), m["glow"], 14, rot=(math.pi / 2, 0, 0))
    for k in range(4):
        box((.04, .04, .85), (-.3 + k * .2, -1.62, 1.0), m["wood"])
    ball(.04, (.28, -1.66, 1.0), mat("brass", "#C9A548", metal=.7, rough=.3), sub=1)
    cyl(.22, .1, (.7, -1.28, 3.2), m["glow"], 10, rot=(math.pi / 2, 0, .45))
    for k in range(5):   # branches into the canopy
        a = k * TAU / 5 + .5
        rod((0, 0, 8.5), (4.2 * math.cos(a), 4.2 * math.sin(a), 10.5), .5, .2, m["bark"], 6)
    # string of fairy lights round the trunk + fireflies
    pts = [Vector((1.5 * math.cos(t * TAU * 1.5), 1.5 * math.sin(t * TAU * 1.5), 2.2 + t * 4)) for t in [i / 16 for i in range(17)]]
    for a, b in zip(pts, pts[1:]):
        beam(tuple(a), tuple(b), .02, m["iron"])
    for p in pts[::2]:
        ball(.08, tuple(p - Vector((0, 0, .08))), m["lamp"], sub=1)
    for k in range(10):
        a, r = rnd.uniform(0, TAU), rnd.uniform(2.5, 6)
        ball(.07, (r * math.cos(a), r * math.sin(a), rnd.uniform(1, 6)), mat("firefly_glow", "#F4FF8A", emit=4.0), sub=1)
    group("trunk")
    for k in range(12):   # wide yellow-green canopy
        a = k * TAU / 11
        r = 0 if k == 11 else 4.3 + rnd.uniform(-.5, .5)
        rock(3.0 if k == 11 else 2.4 + rnd.uniform(-.3, .3), (r * math.cos(a), r * math.sin(a), 11.6 + rnd.uniform(-.6, .8) + (.8 if k == 11 else 0)),
             m["leaf"] if k % 2 else m["leaf2"], k, scale=(1, 1, .7), sub=2, jag=.12)
    o = group("canopy", origin=None)
    keep_origin(o, (0, 0, 9.5))
    export("for_tree_ancient_v01")


def camp():
    reset()
    m = M()
    green, green2 = mat("tent_green", "#5E8A3E", rough=.85), mat("tent_green_dark", "#43662C", rough=.85)
    crate, pot, fire = mat("wood_crate", "#C79A5B", rough=.85), mat("pot_iron", "#3A3532", rough=.5, metal=.5), mat("light_flame", "#FF8A2A", emit=4.0)
    L, Wd, H = 2.6, 2.2, 1.7
    for sx in (-1, 1):
        a, b, c, d = Vector((-1.3, -L / 2, H)), Vector((-1.3, L / 2, H)), Vector((-1.3 + sx * Wd / 2, L / 2, 0)), Vector((-1.3 + sx * Wd / 2, -L / 2, 0))
        n = (b - a).cross(d - a).normalized() * .004 * sx
        mesh([a, b, c, d, a - n, b - n, c - n, d - n], [[0, 1, 2, 3], [7, 6, 5, 4]], green)
    mesh([(-1.3 - Wd / 2, L / 2, 0), (-1.3 + Wd / 2, L / 2, 0), (-1.3, L / 2, H)], [[0, 1, 2]], green2)
    mesh([(-1.3 - Wd / 2, L / 2 + .004, 0), (-1.3 + Wd / 2, L / 2 + .004, 0), (-1.3, L / 2 + .004, H)], [[2, 1, 0]], green2)
    beam((-1.3, -L / 2 - .1, H), (-1.3, L / 2 + .1, H), .05, m["wood2"])
    box((1.0, .6, .05), (1.0, .6, .72), m["wood"], bev=.01)                  # table
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl(.03, .7, (1.0 + sx * .42, .6 + sy * .24, .35), m["wood2"], 6)
    lantern((1.25, .55, .88), m, 1.0)
    for a in (0, 2.1, 4.2):   # tripod with a pot over the fire
        beam((1.0 + .5 * math.cos(a), -1.0 + .5 * math.sin(a), 0), (1.0, -1.0, 1.3), .05, m["wood2"])
    beam((1.0, -1.0, 1.28), (1.0, -1.0, .75), .012, m["iron"])
    lathe([(0, 0), (.22, .02), (.25, .2), (.23, .3), (0, .3)], pot, seg=12, loc=(1.0, -1.0, .45))
    for k in range(6):
        a = k * TAU / 6
        rock(.1, (1.0 + .38 * math.cos(a), -1.0 + .38 * math.sin(a), .05), m["stone"], k, scale=(1.2, 1, .6))
    for k in range(3):
        cyl(.1 - .02 * k, .35 - .08 * k, (1.0 + .05 * (k - 1), -1.0, .2), fire, 6, r2=0)
    for k, (x, y, s) in enumerate(((-.2, 1.5, .5), (.35, 1.55, .45), (.05, 1.5, .4))):
        box((s, s, s), (x, y, s / 2 + (.5 if k == 2 else 0)), crate, bev=.02)
    group("camp")
    export("for_camp_v01")


def stall_willow():
    reset()
    m = M()
    leafy, leafy2 = mat("leaf_roof", "#5FA040", rough=.8), mat("leaf_roof_dark", "#3E7A33", rough=.8)
    blank, jar = mat("sign_blank", "#E8D2A6", rough=.8), mat("jar_green", "#7FC8A0", rough=.1, alpha=.6)
    X, Y = 2.6, 1.4
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl(.07, 2.3 if sy > 0 else 2.0, (sx * (X / 2 - .1), sy * (Y / 2 - .1), 1.15 if sy > 0 else 1.0), m["wood2"], 6)
    box((X - .1, Y - .3, .08), (0, .05, .9), m["wood"], bev=.015)
    box((X - .2, .05, .82), (0, -Y / 2 + .2, .45), m["wood"], bev=.01)
    rnd = random.Random(4)
    for i in range(9):   # roof of overlapping leaves
        for j in range(3):
            x = -X / 2 - .1 + (i + .5) * (X + .2) / 9
            y = Y / 2 - j * (Y + .5) / 3
            ball(.32, (x, y, 2.3 - j * .18), leafy if (i + j) % 2 else leafy2, uv=(6, 3), scale=(1, 1.2, .25), rot=(-.25, rnd.uniform(-.2, .2), 0))
    for k in range(4):
        lathe([(0, 0), (.09, 0), (.1, .16), (.05, .2), (.06, .24), (0, .24)], jar, seg=8, loc=(-.9 + k * .55, .1, .94))
    box((.6, .04, .35), (.75, -Y / 2 - .05, 1.2), blank, bev=.01)
    lantern((-1.2, -Y / 2 + .1, 1.8), m, 1.0)
    group("stall_willow")
    export("for_stall_willow_v01")


def cave():
    reset()
    m = M()
    dark, crys = mat("cave_dark", "#0E0C0C", rough=1.0), mat("crystal_glow", "#7FE8FF", emit=3.0, rough=.1)
    root = mat("root_brown", "#6B4A2E", rough=.9)
    cyl(1.75, 3.4, (0, .5, 1.6), dark, 14, rot=(math.pi / 2, 0, 0), scale=(1, 1.05, 1))
    for k in range(9):   # stone arch 6 m wide, 4.5 m high
        a = math.pi * (k + .5) / 9
        rock(.62, (2.55 * math.cos(a), -1.25, .3 + 3.55 * math.sin(a)), m["stone"] if k % 2 else m["stone2"], 10 + k, sub=2)
    rock(2.6, (0, 1.4, 1.8), m["stone"], 1, scale=(1.4, 1.0, 1.0), sub=3, jag=.1)
    for k in range(5):
        ball(.6, (-2 + k, -.2 + .3 * (k % 2), 4.0 - .2 * abs(k - 2)), m["moss"], sub=2, scale=(1.2, 1, .35), jit=.03, seed=k)
    for k, (x, z, h) in enumerate(((-.9, .1, .9), (-.6, .1, .55), (.8, .1, .75), (1.1, .1, .45), (.2, .1, .5))):
        cyl(.14, h, (x, -1.0, z + h / 2), crys, 6, r2=.0, rot=(0, (x * .3), 0))
    for k in range(6):   # roots hanging over the mouth
        x = -1.6 + k * .65
        rod((x, -1.3, 3.7), (x + .1, -1.35, 2.7 - .3 * (k % 3)), .04, .015, root, 5)
    group("cave")
    export("for_cave_v01")


def ruins():
    reset()
    m = M()
    rune, vine = mat("rune_glow", "#5AF0E0", emit=3.0), mat("vine_green", "#3F8A3A", rough=.8)
    for k in range(3):   # steps
        box((4.0 - k * .5, 1.6 - k * .4, .2), (0, -1.8 + k * .2, .1 + k * .2), m["stone"], bev=.03)
    for sx in (-1, 1):   # half-collapsed arch: one side stands
        box((.7, .7, 3.6 if sx < 0 else 1.6), (sx * 1.6, 0, 1.8 if sx < 0 else .8), m["stone"], bev=.05)
        box((.12, .02, .5), (sx * 1.6, -.36, 1.3), rune)
    for k in range(5):
        a = math.pi * (k + .5) / 7
        if k > 3:
            continue
        box((.7, .7, .6), (-1.6 + 1.6 - 1.6 * math.cos(a), 0, 3.6 + .9 * math.sin(a)), m["stone2"], rot=(0, a - math.pi / 2, 0), bev=.04)
    for k, (x, y, h, tilt) in enumerate(((-3.2, 1.8, 2.2, 0), (3.2, 1.8, 1.2, .2), (-3.2, -2.2, 1.0, 0), (3.2, -2.2, 1.6, -.15))):   # broken columns
        cyl(.35, h, (x, y, h / 2), m["stone"], 8, rot=(tilt, 0, 0))
        cyl(.45, .25, (x, y, .12), m["stone2"], 8)
        box((.1, .02, .35), (x, y - .36, h * .5), rune)
    cyl(.35, 1.4, (2.2, 2.6, .35), m["stone"], 8, rot=(math.pi / 2, 0, .4))         # fallen drum
    rnd = random.Random(2)
    for k in range(8):   # vines and grass tufts
        x = rnd.uniform(-3.5, 3.5)
        rod((x, rnd.uniform(-2, 2), 0), (x + rnd.uniform(-.3, .3), rnd.uniform(-2, 2), rnd.uniform(.3, .7)), .04, .01, vine, 4)
    for k in range(6):
        rod((-1.6 + .37, -.2 + .1 * k, 3.4 - .4 * k), (-1.6 + .37, -.2 + .1 * k + .05, 3.0 - .4 * k), .03, .02, vine, 4)
    group("ruins")
    export("for_ruins_v01")


def portal():
    reset()
    m = M()
    ring, rune = mat("portal_ring", "#B98AFF", emit=3.5, rough=.1), mat("rune_glow", "#5AF0E0", emit=3.0)
    for sx in (-1, 1):
        box((.6, .6, 3.6), (sx * 1.6, 0, 1.8), m["stone"], bev=.05)
        box((.8, .8, .3), (sx * 1.6, 0, .15), m["stone2"], bev=.04)
        cyl(.25, .5, (sx * 1.6, 0, 3.85), m["stone2"], 8, r2=.05)
        for z in (1.0, 1.8, 2.6):
            box((.2, .02, .12), (sx * 1.6, -.31, z), rune)
    torus(1.25, .09, (0, 0, 2.0), ring, 32, 6, rot=(math.pi / 2, 0, 0))
    torus(1.05, .03, (0, 0, 2.0), ring, 32, 4, rot=(math.pi / 2, 0, 0))
    cyl(1.0, .02, (0, 0, 2.0), mat("portal_veil", "#D9C2FF", emit=1.5, alpha=.5), 24, rot=(math.pi / 2, 0, 0))
    for k in range(6):
        a = k * TAU / 6
        box((.12, .05, .12), (1.38 * math.cos(a), 0, 2.0 + 1.38 * math.sin(a)), rune, rot=(0, -a, 0))
    group("portal")
    export("for_portal_v01")


def tower():
    reset()
    m = M()
    H, P = 8.0, 5.2
    for k in range(9):   # rocky footing instead of a flat slab
        a = k * TAU / 9
        rock(.45, (1.5 * math.cos(a), 1.5 * math.sin(a), .15), m["stone"], k, scale=(1.2, 1, .6))
    for sx in (-1, 1):
        for sy in (-1, 1):
            beam((sx * 1.6, sy * 1.6, 0), (sx * 1.0, sy * 1.0, P), .18, m["wood2"])
    for z in (1.8, 3.6):   # cross braces
        for sx in (-1, 1):
            beam((sx * (1.6 - .6 * z / P), -(1.6 - .6 * z / P), z), (sx * (1.6 - .6 * (z + 1.6) / P), (1.6 - .6 * (z + 1.6) / P), z + 1.6), .08, m["wood"])
            beam((-(1.6 - .6 * z / P), sx * (1.6 - .6 * z / P), z), ((1.6 - .6 * (z + 1.6) / P), sx * (1.6 - .6 * (z + 1.6) / P), z + 1.6), .08, m["wood"])
    box((2.8, 2.8, .15), (0, 0, P), m["wood"], bev=.02)
    for sx in (-1, 1):   # railing
        box((2.8, .08, .08), (0, sx * 1.36, P + 1.0), m["wood2"])
        box((.08, 2.8, .08), (sx * 1.36, 0, P + 1.0), m["wood2"])
        for k in range(5):
            box((.06, .06, 1.0), (-1.3 + k * .65, sx * 1.36, P + .5), m["wood2"])
            box((.06, .06, 1.0), (sx * 1.36, -1.3 + k * .65, P + .5), m["wood2"])
    for sx in (-1, 1):
        for sy in (-1, 1):
            box((.1, .1, 1.9), (sx * 1.3, sy * 1.3, P + .95), m["wood2"])
    cyl(2.1, 1.1, (0, 0, P + 2.45), mat("roof_plank", "#7A4A2C", rough=.85), 4, r2=.05, rot=(0, 0, math.pi / 4))
    for k in range(4):   # plank lines on the roof
        cyl(2.1 - k * .45, .05, (0, 0, P + 1.95 + k * .27), m["wood2"], 4, r2=2.1 - (k + 1) * .45, rot=(0, 0, math.pi / 4))
    for k in range(15):   # ladder on the front
        z = .3 + k * .35
        beam((-.25, -1.75 + .5 * z / P, z), (.25, -1.75 + .5 * z / P, z), .04, m["wood"])
    for sx in (-1, 1):
        beam((sx * .25, -1.85, 0), (sx * .25, -1.3, P + .9), .06, m["wood2"])
    lantern((1.25, -1.25, P + 1.6), m, 1.2)
    group("tower")
    export("for_tower_v01")


def woodpile():
    reset()
    m = M()
    ring, blade = mat("wood_ring", "#D9B07A", rough=.85), mat("steel", "#C9CED6", rough=.2, metal=.9)
    for row, n in enumerate((5, 4, 3)):
        for i in range(n):
            x = (i - (n - 1) / 2) * .3
            cyl(.15, 1.4, (x, 0, .15 + row * .27), m["bark"], 8, rot=(math.pi / 2, 0, 0))
            for s in (-1, 1):
                cyl(.13, .01, (x, s * .705, .15 + row * .27), ring, 8, rot=(math.pi / 2, 0, 0))
    cyl(.35, .5, (1.3, -.2, .25), m["bark"], 10)
    cyl(.33, .01, (1.3, -.2, .505), ring, 10)
    beam((1.3, -.2, .48), (1.55, -.35, 1.1), .045, m["wood"])                       # axe handle
    box((.22, .03, .14), (1.3, -.2, .55), blade, rot=(0, .35, -.5))
    group("woodpile")
    export("for_woodpile_v01")


def bridge():
    reset()
    m = M()
    L, Wd, rise, n = 6.0, 1.8, .7, 16
    P = lambda t: Vector((0, -L / 2 + L * t, .3 + rise * math.sin(math.pi * t)))
    for i in range(n):
        t = (i + .5) / n
        p = P(t)
        ang = math.atan(rise * math.pi / L * math.cos(math.pi * t))
        box((Wd, L / n * .92, .07), tuple(p), m["wood2"], rot=(ang, 0, 0))
    for sx in (-1, 1):
        for i in range(n):
            a, b = P(i / n), P((i + 1) / n)
            beam(tuple(a + Vector((sx * Wd / 2, 0, -.05))), tuple(b + Vector((sx * Wd / 2, 0, -.05))), .12, m["bark"])   # stringer
            beam(tuple(a + Vector((sx * (Wd / 2 - .05), 0, .85))), tuple(b + Vector((sx * (Wd / 2 - .05), 0, .85))), .07, m["wood"])
        for i in range(0, n + 1, 3):
            p = P(i / n)
            box((.08, .08, .9), tuple(p + Vector((sx * (Wd / 2 - .05), 0, .45))), m["wood2"])
        for t in (0.0, 1.0):
            p = P(t)
            box((.14, .14, 1.4), tuple(p + Vector((sx * (Wd / 2 - .05), 0, .55))), m["wood2"], bev=.02)
            if sx > 0:
                lantern(tuple(p + Vector((sx * (Wd / 2 - .05), 0, 1.38))), m, 1.0)
    group("bridge_wood")
    export("for_bridge_wood_v01")


def waterfall():
    reset()
    m = M()
    water, foam = mat("water_fall", "#9FD8F0", rough=.1, emit=.3, alpha=.85), mat("foam_white", "#F2FAFF", rough=.6)
    pool = mat("water", "#5AA8D0", rough=.05, alpha=.85)
    rnd = random.Random(7)
    for k in range(9):   # facet cliff 12 m wide, 9 m high, with a notch for the fall
        x = -5 + k * 1.25
        if abs(x) < .8:
            continue
        rock(2.2, (x, 1.2, 1.6 + rnd.uniform(0, 1)), m["stone"], k, scale=(.7, 1, 1.6), sub=2, jag=.15)
        rock(1.8, (x * .9, 1.6, 6.3 + rnd.uniform(-.5, .8)), m["stone2"], 20 + k, scale=(.8, 1, 1.4), sub=2, jag=.15)
    rock(2.0, (0, 2.1, 7.5), m["stone"], 40, scale=(1.2, 1, .7), sub=2)
    for k in range(6):
        ball(.9, (-4 + k * 1.6, 1.0, 8.6 - .3 * (k % 2)), m["moss"], sub=2, scale=(1.2, 1, .35), jit=.05, seed=k)
    # falling water ribbon (scrolls in the game), splash and pool
    rows = 10
    verts, faces = [], []
    for r in range(rows + 1):
        z = 8.6 - 8.4 * r / rows
        y = .2 - .9 * (r / rows) ** 2 - .2
        for x in (-.8, -.27, .27, .8):
            verts.append((x * (1 + .15 * r / rows), y, z))
    for r in range(rows):
        for c in range(3):
            a = r * 4 + c
            faces.append([a, a + 1, a + 5, a + 4])
    mesh(verts, faces, water)
    ellipse = ball(3.2, (0, -1.6, .02), pool, uv=(20, 3), scale=(1, .65, .02))
    for k in range(10):
        a = k * TAU / 10
        ball(.35, (.8 * math.cos(a), -1.1 + .4 * math.sin(a), .15), foam, sub=2, scale=(1, 1, .5), jit=.03, seed=k)
    for k in range(10):
        a = k * TAU / 10
        rock(.4, (3.2 * math.cos(a), -1.6 + 2.1 * math.sin(a), .1), m["stone"], 60 + k, scale=(1.2, 1, .6))
    for x in (-5.2, 4.8):   # two small trees on the ledges
        cyl(.12, 1.4, (x, .4, 9.0), m["bark"], 6)
        rock(.8, (x, .4, 10.0), m["leaf"], int(x * 10), sub=2, scale=(1, 1, .9))
    group("waterfall")
    export("for_waterfall_v01")


def gate_arch():
    reset()
    m = M()
    blank, rune = mat("sign_blank", "#E8D2A6", rough=.8), mat("rune_glow", "#5AF0E0", emit=2.5)
    for sx in (-1, 1):
        rod((sx * 2.2, 0, 0), (sx * 2.0, 0, 3.6), .35, .25, m["bark"], 8)
        for k in range(3):
            rod((sx * 2.2, 0, .1), (sx * (2.6 + .3 * k), (k - 1) * .4, 0), .2, .05, m["bark"], 5)
    pts = [Vector((2.0 * math.cos(a), 0, 3.4 + 1.0 * math.sin(a))) for a in [math.pi * i / 8 for i in range(9)]]
    for a, b in zip(pts, pts[1:]):
        rod(tuple(a), tuple(b), .25, .25, m["bark"], 8)
    rnd = random.Random(3)
    for k in range(8):
        p = pts[k]
        ball(.6, tuple(p + Vector((0, 0, .3))), m["leaf"] if k % 2 else m["leaf2"], sub=2, scale=(1, .8, .6), jit=.05, seed=k)
    box((2.2, .1, .55), (0, -.3, 3.3), blank, bev=.02)
    box((2.35, .08, .68), (0, -.25, 3.3), m["wood2"])
    for sx in (-1, 1):
        lantern((sx * 1.4, -.3, 2.7), m, 1.0)
        box((.1, .02, .4), (sx * 2.1, -.33, 1.5), rune)
    group("gate_arch")
    export("for_gate_arch_v01")


BUILDERS = {"for_tree_ancient": tree_ancient, "for_camp": camp, "for_stall_willow": stall_willow, "for_cave": cave,
            "for_ruins": ruins, "for_portal": portal, "for_tower": tower, "for_woodpile": woodpile, "for_bridge_wood": bridge,
            "for_waterfall": waterfall, "for_gate_arch": gate_arch}
for n, f in BUILDERS.items():
    if not ONLY or n in ONLY:
        f()
