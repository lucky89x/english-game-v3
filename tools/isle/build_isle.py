"""Treasure Isle props for English Quest, built procedurally in headless Blender.
Run: OUT=<folder> blender -b -P tools/isle/build_isle.py   (optional ONLY=isle_chest,isle_palm_v02)
Conventions as tools/harbor/hlib.py: metres, base at Z=0, centred, front = Blender -Y = glTF +Z.
Glowing materials start with light_ (light_gold, light_flame); palm fronds use `leaf`; the flag cloth is its own
object (flag_cloth) so the game can wave it; the chest lid (chest_lid) opens with the clip "Open" (0.8 s).
"""
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "harbor"))
from hlib import *  # noqa
import bpy, bmesh
from mathutils import Vector, Matrix

ONLY = [s for s in os.environ.get("ONLY", "").split(",") if s]


def rock(r, loc, m, seed, scale=(1, 1, 1), sub=1, jag=.25, rot=(0, 0, 0)):
    """jagged boulder: icosphere with random radial pushes, flat shaded"""
    rnd = random.Random(seed)
    o = ball(r, loc, m, sub=sub + 1, scale=scale, rot=rot)   # bmesh: subdivisions=1 is the bare icosahedron
    for v in o.data.vertices:
        v.co *= 1 + rnd.uniform(-jag, jag)
    return o


def keep_origin(o, pivot):
    """move an object's origin to pivot without moving its mesh"""
    o.data.transform(Matrix.Translation(-Vector(pivot)))
    o.location = pivot


# ------------------------------------------------------------------ treasure chest
def build_chest():
    reset()
    wood, wood2 = mat("wood_chest", "#9A5E32", rough=.7), mat("wood_chest_dark", "#6E3F20", rough=.75)
    gold = mat("gold_trim", "#E2B04A", rough=.3, metal=.85)
    iron = mat("iron_dark", "#3A3532", rough=.5, metal=.5)
    coins = mat("light_gold", "#FFD45A", emit=1.6, rough=.3, metal=.6)
    W, D, H = 1.0, .62, .5
    box((W, D, H), (0, 0, H / 2), wood, bev=.02)
    for x in (-W / 2 + .1, W / 2 - .1):                      # gold bands
        box((.08, D + .02, H + .01), (x, 0, H / 2), gold, bev=.01)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box((.07, .07, H + .02), (sx * (W / 2 - .02), sy * (D / 2 - .02), H / 2), iron, bev=.01)
    box((W - .06, D - .06, .02), (0, 0, H - .07), wood2)    # inside floor near the top: gold heap sits on it
    rnd = random.Random(3)
    ball(.42, (0, 0, H - .06), coins, sub=2, scale=(1.05, .62, .32))
    for k in range(14):
        x, y = rnd.uniform(-.38, .38), rnd.uniform(-.2, .2)
        cyl(.05, .015, (x, y, H + .05 + rnd.uniform(-.02, .04)), coins, 10, rot=(rnd.uniform(-.5, .5), rnd.uniform(-.5, .5), 0))
    ball(.07, (.2, .05, H + .1), mat("light_gem", "#FF5A8A", emit=2.0), sub=1)
    ball(.05, (-.25, -.05, H + .08), mat("light_gem_blue", "#5AC8FF", emit=2.0), sub=1)
    box((.16, .03, .2), (0, -D / 2 - .01, H - .08), gold, bev=.01)  # lock plate
    group("chest_base", origin=None)
    # lid: half-barrel top, built in place and pivoted on the back hinge
    hinge = Vector((0, D / 2, H))
    s = len(OBJS)
    o = cyl(D / 2, W, (0, 0, H), wood, 16, rot=(0, math.pi / 2, 0))
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.x > 1e-4], context='VERTS')  # keep the upper half (local -X = up)
    bm.to_mesh(o.data)
    bm.free()
    box((W, D, .03), (0, 0, H + .015), wood2)
    for x in (-W / 2 + .1, W / 2 - .1):
        lathe([(D / 2 + .01, -.04), (D / 2 + .01, .04)], gold, seg=16, loc=(x, 0, H))
        OBJS[-1].rotation_euler = (0, math.pi / 2, 0)
    box((.12, .04, .14), (0, -D / 2 - .01, H + .04), gold, bev=.01)
    ball(.025, (0, -D / 2 - .035, H + .02), iron, sub=1)
    lid = group("chest_lid", origin=None)
    # the half-cylinder lathe for the bands is a full ring: trim the lower half from the joined lid
    bm = bmesh.new()
    bm.from_mesh(lid.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < H - .002], context='VERTS')
    bm.to_mesh(lid.data)
    bm.free()
    keep_origin(lid, hinge)
    bpy.context.scene.render.fps = 24
    lid.rotation_mode = 'XYZ'
    ad = lid.animation_data_create()
    act = bpy.data.actions.new("Open")
    ad.action = act
    for f, a in ((1, 0.0), (5, -.25), (14, -1.8), (17, -1.95), (20, -1.88)):   # a little bounce at the end
        lid.rotation_euler = (a, 0, 0)
        lid.keyframe_insert("rotation_euler", frame=f)
    act.use_fake_user = True
    tr = ad.nla_tracks.new()
    tr.name = "Open"
    tr.strips.new("Open", 1, act)
    ad.action = None
    lid.rotation_euler = (0, 0, 0)
    export("isle_chest_v01", anim=True)


# ------------------------------------------------------------------ boat wreck
def build_wreck():
    reset()
    plank, plank2 = mat("wood_wet", "#7A5638", rough=.85), mat("wood_wet_dark", "#5A3E28", rough=.9)
    sand = mat("sand", "#E8D3A2", rough=1.0)
    weed = mat("seaweed", "#4E8A4A", rough=.8)
    L, Wd, Hh = 3.4, 1.25, .62
    st = 9

    def P(t, side, k):   # hull surface point: t along the boat (0 bow .. 1 stern), k = plank row 0 keel .. 1 gunwale
        y = -L / 2 + L * t
        hw = Wd / 2 * (math.sin(math.pi * min(1, t * 1.15)) ** .7) * (.25 + .75 * k ** .6)
        if t > .87:
            hw = max(hw, Wd / 2 * .55 * (.25 + .75 * k ** .6))
        z = Hh * k + .25 * (1 - t) ** 3 * k
        return Vector((side * hw, y, z))
    rnd = random.Random(5)
    rows = 5
    for side in (-1, 1):
        for r in range(rows):
            k0 = (r + .5) / rows
            for i in range(st - 1):
                if side > 0 and r in (1, 2) and i in (3, 4):
                    continue                                 # a hole in the starboard side
                if r == rows - 1 and i == 6 and side < 0:
                    continue                                 # broken gunwale
                a, b = P(i / (st - 1), side, k0), P((i + 1) / (st - 1), side, k0)
                beam(tuple(a), tuple(b), .05, plank if (r + i) % 3 else plank2, .2)
    for i in range(st):                                      # keel
        if i < st - 1:
            beam(tuple(P(i / (st - 1), 1, 0)), tuple(P((i + 1) / (st - 1), 1, 0)), .1, plank2)
    for i in (2, 4, 6):                                      # ribs
        t = i / (st - 1)
        pts = [P(t, -1, 1), P(t, -1, .5), P(t, 1, 0), P(t, 1, .5), P(t, 1, 1)]
        for a, b in zip(pts, pts[1:]):
            beam(tuple(a), tuple(b), .05, plank2)
    box((Wd * .8, .22, .05), (0, .1, Hh * .7), plank, rot=(0, .15, 0))          # thwart, cracked and sagging
    cyl(.06, .7, (0, -.2, Hh * .6 + .3), plank2, 6, rot=(.25, .1, 0))            # broken mast stump
    for k in range(4):
        beam((rnd.uniform(-.4, .4), rnd.uniform(-1, 1), .7), (rnd.uniform(-.4, .4), rnd.uniform(-1, 1), .9), .04, weed)
    # tilt it over and sink it into a sand drift
    s0 = 0
    M = Matrix.Translation((0, 0, -.06)) @ Matrix.Rotation(math.radians(-18), 4, 'Y') @ Matrix.Rotation(math.radians(6), 4, 'X')
    for o in OBJS[s0:]:
        bpy.context.view_layer.update()
        o.matrix_world = M @ o.matrix_world
    ball(1.0, (0, .1, -.05), sand, sub=3, scale=(1.25, 2.1, .2), jit=.02)
    for k in range(3):
        rock(.22, (rnd.uniform(-1, 1), rnd.uniform(-1.6, 1.6), .03), mat("rock_grey", "#8C8A84", rough=.95), k, scale=(1, 1, .6))
    group("boat_wreck")
    export("isle_boat_wreck_v01")


# ------------------------------------------------------------------ stone hut, thatched roof
def build_hut():
    reset()
    stone, stone2 = mat("stone", "#A7A39A", rough=.95), mat("stone_dark", "#837F77", rough=.95)
    thatch, thatch2 = mat("thatch", "#D8B25E", rough=1.0), mat("thatch_dark", "#B08A40", rough=1.0)
    wood, dark = mat("wood_door", "#7A4E2C", rough=.8), mat("hut_dark", "#2A2220", rough=1.0)
    W, D, H = 3.8, 3.2, 2.1
    box((W, D, H), (0, 0, H / 2), stone, bev=.04)
    rnd = random.Random(9)
    for k in range(30):  # stones standing out of the wall
        face = k % 4
        if face < 2:
            x, y = rnd.uniform(-W / 2 + .2, W / 2 - .2), (-1 if face == 0 else 1) * (D / 2 + .02)
            if face == 0 and abs(x) < .6:
                continue
        else:
            x, y = (-1 if face == 2 else 1) * (W / 2 + .02), rnd.uniform(-D / 2 + .2, D / 2 - .2)
        z = rnd.uniform(.15, H - .2)
        box((rnd.uniform(.25, .45), rnd.uniform(.25, .45), rnd.uniform(.16, .26)), (x, y, z), stone2 if k % 3 else stone,
            rot=(0, 0, rnd.uniform(-.1, .1)), bev=.03)
    box((W + .2, D + .2, .2), (0, 0, .1), stone2, bev=.03)
    box((1.0, .1, 1.7), (0, -D / 2 - .01, .85 + .1), dark)                       # doorway
    box((.12, .2, 1.85), (-.56, -D / 2 - .03, .92), wood, bev=.02)
    box((.12, .2, 1.85), (.56, -D / 2 - .03, .92), wood, bev=.02)
    box((1.3, .22, .16), (0, -D / 2 - .03, 1.88), wood, bev=.02)
    box((.48, .2, .9), (-.23, -D / 2 - .25, .85), wood, rot=(0, 0, .9), bev=.02)  # door leaf swung open
    box((.55, .1, .45), (1.25, -D / 2 - .01, 1.3), dark)                          # window
    box((.7, .14, .08), (1.25, -D / 2 - .04, 1.05), wood)
    # hipped thatch roof in three overlapping tiers
    for i, (z, sx, sy, h) in enumerate(((H - .05, 2.95, 2.6, .9), (H + .55, 2.35, 2.05, .8), (H + 1.05, 1.6, 1.4, .8))):
        o = cyl(1, h, (0, 0, z + h / 2), thatch if i % 2 == 0 else thatch2, 4, r2=.35 if i < 2 else .05,
                rot=(0, 0, math.pi / 4), scale=(sx / 1.414 * 1.414, sy / 1.414 * 1.414, 1))
        for v in o.data.vertices:
            v.co.z += rnd.uniform(-.03, .03)
    cyl(.18, .35, (0, 0, H + 2.0), thatch2, 6, r2=.04)
    for k in range(10):  # straw ends hanging over the eaves
        a = k / 10 * 2 * math.pi
        cyl(.12, .3, (2.0 * math.cos(a), 1.75 * math.sin(a), H - .1), thatch2, 4, r2=.02, rot=(math.pi, 0, 0))
    group("hut")
    export("isle_hut_v01")


# ------------------------------------------------------------------ cave mouth
def build_cave():
    reset()
    r1, r2, r3 = mat("rock_grey", "#8C8A84", rough=.95), mat("rock_dark", "#6B6964", rough=.95), mat("rock_moss", "#6E8A58", rough=.95)
    dark = mat("cave_dark", "#0E0C0C", rough=1.0)
    rnd = random.Random(21)
    # tunnel: dark half-tube going in, closed at the back
    o = cyl(1.3, 3.2, (0, .9, 1.05), dark, 14, rot=(math.pi / 2, 0, 0), scale=(1, .85, 1))
    # the hill: big boulders behind and around the opening
    rock(2.4, (0, 1.6, 1.3), r1, 1, scale=(1.35, 1.0, .85), sub=2, jag=.12)
    rock(1.5, (-2.0, .3, .8), r2, 2, scale=(1, 1, .8), sub=2, jag=.15)
    rock(1.5, (2.1, .4, .8), r1, 3, scale=(1, 1, .85), sub=2, jag=.15)
    for k in range(7):  # arch of stones framing the mouth
        a = math.pi * (k + .5) / 7
        rock(.5, (1.75 * math.cos(a), -.75, .25 + 1.75 * math.sin(a)), r2 if k % 2 else r1, 10 + k, sub=1, jag=.2)
    for k in range(6):
        rock(rnd.uniform(.3, .55), ((1 if k % 2 else -1) * rnd.uniform(1.9, 2.9), rnd.uniform(-1.4, -.8), .1), r1, 30 + k, scale=(1, 1, .6), sub=1)
    for k in range(5):  # moss caps
        ball(rnd.uniform(.4, .7), (rnd.uniform(-1.8, 1.8), rnd.uniform(.6, 2.2), rnd.uniform(2.5, 3.0)), r3, sub=1,
             scale=(1, 1, .3), jit=.05, seed=k)
    group("cave")
    export("isle_cave_v01")


# ------------------------------------------------------------------ palms
def palm(name, lean, curve, nfr, seed, height=5.6):
    reset()
    bark, bark2 = mat("palm_bark", "#9C7A4E", rough=.9), mat("palm_bark_dark", "#7A5C38", rough=.9)
    leaf, leaf2 = mat("leaf", "#4FA83D", rough=.75), mat("leaf_dark", "#3A8A33", rough=.75)
    nut = mat("coconut", "#6B4A2A", rough=.8)
    rnd = random.Random(seed)
    n = 9
    pts = []
    for i in range(n + 1):
        t = i / n
        pts.append(Vector((lean * t + curve * math.sin(math.pi * t) * .4, 0, height * t)))
    for i in range(n):  # stacked trunk rings, slightly bulged at the joints
        r0, r1 = .2 - .07 * i / n, .2 - .07 * (i + 1) / n
        rod(tuple(pts[i]), tuple(pts[i + 1]), r0 + .02, r1, bark if i % 2 else bark2, 8)
    top = pts[-1]
    ball(.28, tuple(top), bark2, sub=1, scale=(1, 1, .7))
    for k in range(3):
        a = k * 2.1 + .5
        ball(.14, tuple(top + Vector((.17 * math.cos(a), .17 * math.sin(a), -.18))), nut, sub=1)
    for k in range(nfr):  # fronds: arching V-shaped ribbons with notched leaflets
        a = k / nfr * 2 * math.pi + rnd.uniform(-.15, .15)
        d = Vector((math.cos(a), math.sin(a), 0))
        side = Vector((-d.y, d.x, 0))
        L = rnd.uniform(2.1, 2.6)
        droop = rnd.uniform(.9, 1.4)
        m = leaf if k % 2 else leaf2
        seg = 7
        verts, front, back = [], [], []
        for i in range(seg + 1):
            t = i / seg
            c = top + d * L * t + Vector((0, 0, .5 * math.sin(math.pi * t * .8) - droop * t * t))
            w = .38 * math.sin(math.pi * min(1, t * 1.1)) * (1 - .3 * t) + .02
            notch = .08 if i % 2 else 0
            verts += [c + side * (w - notch) + Vector((0, 0, -.06)), c, c - side * (w - notch) + Vector((0, 0, -.06))]
        for i in range(seg):
            a0 = i * 3
            front += [[a0, a0 + 3, a0 + 4, a0 + 1], [a0 + 1, a0 + 4, a0 + 5, a0 + 2]]
            back += [[a0 + 1, a0 + 4, a0 + 3, a0], [a0 + 2, a0 + 5, a0 + 4, a0 + 1]]     # underside (two-sided leaf)
        mesh(verts, front, m)
        mesh([v - Vector((0, 0, .012)) for v in verts], back, m)
    ball(.45, (0, 0, .05), mat("sand", "#E8D3A2", rough=1.0), sub=1, scale=(1, 1, .25))
    group(name.replace("isle_", "").replace("_v0", "_"))
    export(name)


# ------------------------------------------------------------------ flag, campfire, rock
def build_flag():
    reset()
    wood, rope = mat("wood_pole", "#8B5E34", rough=.85), mat("rope", "#C9A66B", rough=.95)
    gold, stone = mat("gold_trim", "#E2B04A", rough=.3, metal=.85), mat("rock_grey", "#8C8A84", rough=.95)
    red = mat("flag_red", "#D8322E", rough=.8)
    cyl(.06, 4.0, (0, 0, 2.0), wood, 10, r2=.045)
    ball(.08, (0, 0, 4.05), gold, sub=2)
    for k in range(7):
        a = k / 7 * 2 * math.pi
        rock(.22, (.3 * math.cos(a), .3 * math.sin(a), .1), stone, k, scale=(1, 1, .7))
    beam((.07, 0, .5), (.07, 0, 3.95), .015, rope)
    box((.06, .03, .12), (.08, 0, .55), wood)
    group("flag_pole", origin=None)
    # cloth: 12 x 8 grid, both sides, attached at the pole (x = 0.06) from z 3.1 to 3.9
    nx, nz, W, Hc, z0 = 12, 8, 1.2, .8, 3.1
    verts, faces = [], []
    for side, off in ((0, .006), (1, -.006)):
        base = len(verts)
        for j in range(nz + 1):
            for i in range(nx + 1):
                x = .07 + W * i / nx
                y = off + .04 * math.sin(i / nx * math.pi * 1.5) * (i / nx)
                verts.append((x, y, z0 + Hc * j / nz))
        for j in range(nz):
            for i in range(nx):
                a = base + j * (nx + 1) + i
                f = [a, a + 1, a + nx + 2, a + nx + 1]
                faces.append(f if side == 0 else f[::-1])
    mesh(verts, faces, red)
    group("flag_cloth", origin=None)
    export("isle_flag_v01")


def build_campfire():
    reset()
    stone, stone2 = mat("rock_grey", "#8C8A84", rough=.95), mat("rock_dark", "#6B6964", rough=.95)
    log, log2 = mat("wood_log", "#7A4E2C", rough=.85), mat("wood_char", "#3A2A20", rough=.9)
    f1, f2, f3 = mat("light_flame", "#FF8A2A", emit=4.0), mat("light_flame_core", "#FFD45A", emit=5.0), mat("light_ember", "#FF4A1A", emit=3.0)
    for k in range(10):
        a = k / 10 * 2 * math.pi
        rock(.17, (.62 * math.cos(a), .62 * math.sin(a), .09), stone if k % 2 else stone2, k, scale=(1.1, 1, .75))
    for k in range(5):
        a = k / 5 * 2 * math.pi
        rod((.45 * math.cos(a), .45 * math.sin(a), .05), (.05 * math.cos(a), .05 * math.sin(a), .45), .07, .055,
            log if k % 2 else log2, 7)
    cyl(.4, .04, (0, 0, .02), log2, 12)
    for k, (h, r, m, d) in enumerate(((.72, .15, f1, 0), (.55, .12, f1, .13), (.5, .11, f1, .13), (.46, .1, f1, .13),
                                      (.5, .11, f1, .13), (.42, .09, f2, .05), (.36, .08, f2, .07))):
        a = k * 1.25
        x, y = d * math.cos(a), d * math.sin(a)
        o = cyl(r, h, (x, y, .14 + h / 2), m, 7, r2=.005)
        for v in o.data.vertices:                     # lean outwards and wiggle towards the tip
            t = (v.co.z + h / 2) / h
            v.co.x += (x * 1.2 + .03 * math.sin(t * 7 + k)) * t
            v.co.y += y * 1.2 * t
    for k in range(8):
        a = k * .8
        ball(.04, (.25 * math.cos(a), .25 * math.sin(a), .05), f3, sub=1)
    group("campfire")
    export("isle_campfire_v01")


def build_rock():
    reset()
    r1, r2, r3 = mat("rock_grey", "#8C8A84", rough=.95), mat("rock_dark", "#6B6964", rough=.95), mat("rock_light", "#A9A69E", rough=.95)
    rock(1.9, (0, 0, 1.6), r1, 4, scale=(1.0, .8, 1.05), sub=2, jag=.18)
    rock(1.1, (1.2, -.3, 2.6), r3, 5, scale=(.7, .7, 1.1), sub=1, jag=.25, rot=(.2, .3, 0))
    rock(1.0, (-1.3, .2, 2.3), r2, 6, scale=(.8, .7, 1.2), sub=1, jag=.25, rot=(-.2, -.3, 0))
    rock(.7, (.2, .1, 3.5), r1, 7, scale=(.7, .6, 1.2), sub=1, jag=.3)
    for k in range(5):
        a = k * 1.3
        rock(.45, (2.0 * math.cos(a), 1.6 * math.sin(a), .2), r2, 20 + k, scale=(1, 1, .7), sub=1, jag=.25)
    group("rock")
    export("isle_rock_v01")


BUILDERS = {"isle_chest": build_chest, "isle_boat_wreck": build_wreck, "isle_hut": build_hut, "isle_cave": build_cave,
            "isle_palm_v01": lambda: palm("isle_palm_v01", .9, .9, 8, 1),
            "isle_palm_v02": lambda: palm("isle_palm_v02", -.4, -1.4, 7, 2, 6.2),
            "isle_flag": build_flag, "isle_campfire": build_campfire, "isle_rock": build_rock}
for n, f in BUILDERS.items():
    if ONLY and n not in ONLY:
        continue
    f()
