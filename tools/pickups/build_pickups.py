"""Batch 15: interactive props. Run: OUT=<folder> blender -b -P tools/pickups/build_pickups.py (optional ONLY=...)
Conventions as tools/harbor/hlib.py (metres, feet at 0, front Blender -Y = glTF +Z). Rig helpers from b5_mobs.
"""
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "harbor"))
from hlib import *  # noqa
from b5_mobs import make_rig, clip, q, bind, FPS  # noqa
import bpy, bmesh
from mathutils import Vector, Matrix

ONLY = [s for s in os.environ.get("ONLY", "").split(",") if s]
TAU = 2 * math.pi


def bump(t, a, b):
    return 0.0 if t <= a or t >= b else math.sin(math.pi * (t - a) / (b - a))


def keep_origin(o, pivot):
    o.data.transform(Matrix.Translation(-Vector(pivot)))
    o.location = pivot


def lid_clip(lid, name="Open"):
    bpy.context.scene.render.fps = 24
    lid.rotation_mode = 'XYZ'
    ad = lid.animation_data_create()
    act = bpy.data.actions.new(name)
    ad.action = act
    for f, a in ((1, 0.0), (5, -.25), (14, -1.8), (17, -1.95), (20, -1.88)):
        lid.rotation_euler = (a, 0, 0)
        lid.keyframe_insert("rotation_euler", frame=f)
    act.use_fake_user = True
    tr = ad.nla_tracks.new()
    tr.name = name
    tr.strips.new(name, 1, act)
    ad.action = None
    lid.rotation_euler = (0, 0, 0)


def chest_locked():
    reset()
    wood, wood2 = mat("wood_chest", "#8E5630", rough=.7), mat("wood_chest_dark", "#5E3519", rough=.75)
    iron, lock = mat("iron_band", "#3E3B38", rough=.45, metal=.6), mat("lock_gold", "#F2C23A", rough=.25, metal=.85)
    coins = mat("light_gold", "#FFD45A", emit=1.6, rough=.3, metal=.6)
    W, D, H = 1.1, .7, .45
    box((W, D, H), (0, 0, H / 2), wood, bev=.02)
    for k in range(3):
        box((W + .01, .01, .03), (0, -D / 2 - .002, .1 + k * .13), wood2)
    for x in (-W / 2 + .12, W / 2 - .12):
        box((.08, D + .02, H + .01), (x, 0, H / 2), iron, bev=.01)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box((.07, .07, H + .02), (sx * (W / 2 - .02), sy * (D / 2 - .02), H / 2), iron, bev=.01)
    box((W - .06, D - .06, .02), (0, 0, H - .07), wood2)
    rnd = random.Random(5)
    ball(.45, (0, 0, H - .07), coins, sub=2, scale=(1.05, .65, .3))
    for k in range(12):
        cyl(.05, .015, (rnd.uniform(-.4, .4), rnd.uniform(-.2, .2), H + .03 + rnd.uniform(-.02, .04)), coins, 10,
            rot=(rnd.uniform(-.5, .5), rnd.uniform(-.5, .5), 0))
    # big padlock hanging on the front hasp
    box((.1, .03, .12), (0, -D / 2 - .015, H - .02), iron, bev=.008)
    box((.2, .07, .17), (0, -D / 2 - .05, H - .17), lock, bev=.02)
    torus(.055, .015, (0, -D / 2 - .05, H - .08), lock, 12, 4, rot=(math.pi / 2, 0, 0))
    cyl(.022, .01, (0, -D / 2 - .087, H - .17), iron, 10, rot=(math.pi / 2, 0, 0))
    box((.012, .01, .04), (0, -D / 2 - .088, H - .2), iron)
    group("chest_base", origin=None)
    hinge = Vector((0, D / 2, H))
    o = cyl(D / 2, W, (0, 0, H), wood, 16, rot=(0, math.pi / 2, 0))
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.x > 1e-4], context='VERTS')
    bm.to_mesh(o.data)
    bm.free()
    box((W, D, .03), (0, 0, H + .015), wood2)
    for x in (-W / 2 + .12, W / 2 - .12):
        lathe([(D / 2 + .012, -.04), (D / 2 + .012, .04)], iron, seg=16, loc=(x, 0, H))
        OBJS[-1].rotation_euler = (0, math.pi / 2, 0)
    lid = group("chest_lid", origin=None)
    bm = bmesh.new()
    bm.from_mesh(lid.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < H - .002], context='VERTS')
    bm.to_mesh(lid.data)
    bm.free()
    keep_origin(lid, hinge)
    lid_clip(lid)
    export("prop_chest_locked_v01", anim=True)


def star():
    reset()
    gold, rim_m, base = mat("star_gold", "#FFD23A", emit=1.4, rough=.25, metal=.6), mat("star_rim", "#FFF2B0", emit=2.5), mat("star_base", "#FFE68A", emit=1.8)
    R, r, t, zc = .3, .13, .09, .42
    verts, faces = [], []
    for side in (-1, 1):   # 5-point star prism, bevelled to a ridge in the middle
        for i in range(10):
            a = math.pi / 2 + i * math.pi / 5
            rr = R if i % 2 == 0 else r
            verts.append((rr * math.cos(a), side * t / 2, zc + rr * math.sin(a)))
        verts.append((0, side * t, zc))
    c0, c1 = 10, 21
    for i in range(10):
        j = (i + 1) % 10
        faces.append([c0, j, i])
        faces.append([c1, 11 + i, 11 + j])
        faces.append([i, j, 11 + j, 11 + i])
    o = mesh(verts, faces, gold)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(o.data)
    bm.free()
    for i in range(10):   # glowing outline along the star's edge
        a0, a1 = math.pi / 2 + i * math.pi / 5, math.pi / 2 + (i + 1) * math.pi / 5
        r0, r1 = (R if i % 2 == 0 else r), (R if (i + 1) % 2 == 0 else r)
        beam((r0 * math.cos(a0) * 1.02, 0, zc + r0 * math.sin(a0) * 1.02), (r1 * math.cos(a1) * 1.02, 0, zc + r1 * math.sin(a1) * 1.02),
             .02, rim_m, .05)
    group("star", origin=None)
    lathe([(0, 0), (.16, 0), (.17, .02), (.13, .05), (0, .05)], base, seg=20)
    torus(.19, .012, (0, 0, .015), rim_m, 20, 3)
    group("star_base", origin=None)
    export("prop_star_v01")


def crystal():
    reset()
    tint = mat("crystal_tint", "#CCCCCC", rough=.08, emit=.5)
    core, stone, rune = mat("crystal_core", "#FFFFFF", emit=3.0), mat("rune_stone", "#7E7A72", rough=.95), mat("rune_glow", "#9AE8FF", emit=2.5)
    lathe([(0, 0), (.42, 0), (.46, .1), (.4, .2), (0, .22)], stone, seg=8)
    for k in range(8):
        a = k / 8 * TAU + TAU / 16
        box((.06, .015, .03), (.43 * math.cos(a), .43 * math.sin(a), .12), rune, rot=(0, 0, a + math.pi / 2))

    def prism(r, h, loc, rot, m, tip=.3):
        o = lathe([(0, 0), (r, 0), (r, h * (1 - tip)), (0, h)], m, seg=6, loc=loc)
        o.rotation_euler = rot
        return o
    prism(.2, 1.2, (0, 0, .2), (0, 0, 0), tint, .3)
    prism(.1, .95, (0, 0, .23), (0, 0, 0), core, .25)
    prism(.11, .62, (.2, .05, .18), (0, .45, .3), tint, .35)
    prism(.09, .5, (-.17, -.08, .18), (.3, -.45, 0), tint, .35)
    group("crystal")
    export("prop_crystal_v01")


def owl():
    reset()
    brown, brown2, cream = mat("owl_brown", "#8A5A34", rough=.8), mat("owl_brown_dark", "#5E3B20", rough=.8), mat("owl_cream", "#F1E2C4", rough=.8)
    eye, black, beak = mat("eye_yellow", "#FFC93A", rough=.2, emit=.4), mat("eye_black", "#1B1B22", rough=.2), mat("beak_orange", "#E8962E", rough=.5)
    shine, navy, tassel, frame = mat("eye_shine", "#FFFFFF", emit=1.5), mat("cap_navy", "#1F2D4F", rough=.6), mat("tassel_gold", "#E2B04A", rough=.4, metal=.6), mat("frame_gold", "#D4AF47", rough=.3, metal=.85)
    arm = make_rig("owl", [("root", (0, 0, 0), None), ("body", (0, 0, .1), "root"), ("head", (0, 0, .62), "body"),
                           ("beak_low", (0, -.36, .66), "head"), ("lid_L", (.15, -.3, .78), "head"), ("lid_R", (-.15, -.3, .78), "head"),
                           ("wing_L", (.32, 0, .5), "body"), ("wing_R", (-.32, 0, .5), "body")])
    s = len(OBJS)
    ball(.38, (0, 0, .42), brown, uv=(18, 12), scale=(1, .9, 1.05))
    ball(.28, (0, -.12, .36), cream, uv=(14, 10), scale=(1, .6, 1.05))
    for k in range(9):   # belly feather chevrons
        x, z = (k % 3 - 1) * .1, .22 + (k // 3) * .1
        ball(.025, (x, -.285, z), brown2, uv=(6, 4), scale=(1.4, .4, .6))
    for sx in (-1, 1):   # feet
        for t in (-1, 0, 1):
            ball(.03, (sx * .12 + t * .03, -.18, .04), beak, uv=(6, 4), scale=(.6, 1.6, .6))
    tag("body", s)
    s = len(OBJS)
    ball(.33, (0, 0, .82), brown, uv=(18, 12), scale=(1.1, .9, .9))
    for sx in (-1, 1):
        ball(.14, (sx * .14, -.22, .8), cream, uv=(12, 8), scale=(1, .4, 1))           # face discs
        ball(.105, (sx * .14, -.27, .8), eye, uv=(14, 10), scale=(1, .45, 1))
        ball(.055, (sx * .135, -.31, .79), black, uv=(10, 6), scale=(1, .4, 1))
        ball(.02, (sx * .12, -.33, .82), shine, uv=(6, 4))
        torus(.115, .012, (sx * .14, -.32, .8), frame, 16, 4, rot=(math.pi / 2, 0, 0))   # round glasses
        cyl(.04, .14, (sx * .27, -.02, 1.08), brown2, 6, r2=.0, rot=(0, sx * .4, 0))      # ear tufts
    beam((-.03, -.33, .81), (.03, -.33, .81), .01, frame)
    cyl(.04, .09, (0, -.31, .7), beak, 6, r2=.0, rot=(math.pi / 2 + .5, 0, 0))            # upper beak
    box((.44, .44, .05), (0, .04, 1.19), navy, rot=(-.12, 0, math.pi / 4))                 # graduation cap
    cyl(.17, .12, (0, .04, 1.12), navy, 12)
    ball(.02, (0, .04, 1.22), tassel, uv=(6, 4))
    beam((0, .04, 1.22), (.2, -.1, 1.17), .012, tassel)
    cyl(.025, .09, (.2, -.1, 1.11), tassel, 6, r2=.035)
    tag("head", s)
    s = len(OBJS)
    cyl(.03, .07, (0, -.33, .67), beak, 6, r2=.0, rot=(math.pi / 2 + .9, 0, 0))
    tag("beak_low", s)
    for sx, sn in ((1, "L"), (-1, "R")):
        s = len(OBJS)
        ball(.11, (sx * .14, -.255, .83), brown, uv=(12, 6), scale=(1.05, .5, .55))   # eyelid, hidden up in the brow
        tag("lid_" + sn, s)
        s = len(OBJS)
        ball(.22, (sx * .34, .02, .38), brown2, uv=(12, 8), scale=(.35, .8, 1.15), rot=(0, sx * .15, 0))
        tag("wing_" + sn, s)
    bpy.context.view_layer.update()
    lid = lambda c: (None, (0, 0, -.06 * c), (1, 1, 1 + 1.0 * c))     # closed lid slides down over the eye

    def idle(t):
        blink = bump(t, .46, .54)
        return {"head": (q((0, 0, 1), .25 * math.sin(TAU * t)) @ q((0, 1, 0), .08 * math.sin(TAU * t * 2)), None, None),
                "lid_L": lid(blink), "lid_R": lid(blink),
                "body": (None, None, (1 + .015 * math.sin(TAU * t * 2), 1, 1 - .01 * math.sin(TAU * t * 2)))}

    def talk(t):
        o = abs(math.sin(TAU * 3 * t))
        return {"beak_low": (q((1, 0, 0), .5 * o), None, None),
                "wing_L": (q((0, 1, 0), -.5 * max(0, math.sin(TAU * t))), None, None),
                "wing_R": (q((0, 1, 0), .5 * max(0, math.sin(TAU * t + 2))), None, None),
                "head": (q((0, 1, 0), .1 * math.sin(TAU * t)), None, None)}

    def hoot(t):
        puff = bump(t, .1, .9)
        return {"body": (None, (0, 0, .03 * puff), (1 + .15 * puff, 1 + .2 * puff, 1 + .08 * puff)),
                "head": (q((1, 0, 0), -.25 * puff), None, None), "beak_low": (q((1, 0, 0), .6 * bump(t, .3, .8)), None, None),
                "wing_L": (q((0, 1, 0), -.3 * puff), None, None), "wing_R": (q((0, 1, 0), .3 * puff), None, None)}
    clip(arm, "Idle", 72, idle)
    clip(arm, "Talk", 24, talk)
    clip(arm, "Hoot", 30, hoot)
    o = group("owl", origin=None, smooth=True)
    bind(o, arm)
    export("npc_owl_v01", objs=[o], anim=True)


def board():
    reset()
    wood, wood2, roofm = mat("wood_post", "#8B5E34", rough=.85), mat("wood_board", "#B98A55", rough=.85), mat("roof_red", "#A8432E", rough=.7)
    blank, paper, pin = mat("board_blank", "#D9BC8A", rough=.9), mat("paper_cream", "#F6EAD0", rough=.9), mat("pin_red", "#D23A33", rough=.4)
    steel, grip = mat("steel", "#C9CED6", rough=.2, metal=.9), mat("grip", "#3A2A22", rough=.7)
    for sx in (-1, 1):
        box((.14, .14, 2.25), (sx * 1.0, 0, 1.125), wood, bev=.02)
        box((.24, .24, .12), (sx * 1.0, 0, .06), wood, bev=.02)
    box((1.9, .08, 1.15), (0, 0, 1.45), wood2, bev=.02)
    box((1.98, .1, .07), (0, 0, 2.05), wood, bev=.01)
    box((1.98, .1, .07), (0, 0, .87), wood, bev=.01)
    box((.9, .02, .7), (0, -.05, 1.45), blank)              # empty centre panel for the game's text
    for k, (x, z, rz) in enumerate(((-.68, 1.6, .06), (.68, 1.62, -.05), (-.68, 1.18, -.04))):
        box((.3, .01, .36), (x, -.05, z), paper, rot=(0, rz, 0))
        ball(.018, (x, -.065, z + .15), pin, uv=(6, 4))
        for j in range(3):
            box((.2, .004, .012), (x, -.056, z + .06 - j * .06), mat("ink_brown", "#8A6A4A"), rot=(0, rz, 0))
    # one sword hung across the lower right corner
    beam((.45, -.07, 1.0), (.95, -.07, 1.35), .03, steel, .008)
    beam((.38, -.07, .95), (.47, -.07, 1.01), .03, grip)
    beam((.41, -.07, 1.06), (.5, -.07, .94), .02, mat("guard_gold", "#C9A548", metal=.8, rough=.3))
    for sy in (-1, 1):   # small pitched roof
        box((2.5, .45, .05), (0, sy * .2, 2.27), roofm, rot=(-sy * .45, 0, 0), bev=.01)
    box((2.52, .06, .06), (0, 0, 2.37), wood)
    group("board_quest")
    export("prop_board_quest_v01")


def jar():
    reset()
    glass = mat("jar_glass", "#DDEFF5", rough=.03, alpha=.3)
    cork, scroll, glow = mat("cork_wood", "#B98A55", rough=.8), mat("scroll_cream", "#F6EAD0", rough=.9), mat("firefly_glow", "#FFE88A", emit=4.0)
    ribbon = mat("ribbon_red", "#C2312C", rough=.6)
    lathe([(0, 0), (.28, 0), (.36, .1), (.4, .3), (.36, .55), (.22, .7), (.2, .76), (.22, .78), (0, .78)], glass, seg=20)
    cyl(.2, .14, (0, 0, .82), cork, 12, r2=.21)
    torus(.205, .012, (0, 0, .76), ribbon, 16, 4)
    rnd = random.Random(6)
    for k in range(14):   # rolled paper slips piled inside
        a, r = rnd.uniform(0, TAU), rnd.uniform(0, .26)
        z = .08 + rnd.uniform(0, .25) + (.26 - r) * .3
        cyl(.025, .14, (r * math.cos(a), r * math.sin(a), z), scroll, 8, rot=(rnd.uniform(0, 3), rnd.uniform(0, 3), 0))
        if k % 3 == 0:
            torus(.027, .006, (r * math.cos(a), r * math.sin(a), z), ribbon, 8, 3, rot=(rnd.uniform(0, 3), rnd.uniform(0, 3), 0))
    for k in range(7):   # fireflies drifting above the slips
        a, r = rnd.uniform(0, TAU), rnd.uniform(.05, .25)
        ball(.018, (r * math.cos(a), r * math.sin(a), rnd.uniform(.4, .65)), glow, uv=(6, 4))
    group("word_jar")
    export("prop_word_jar_v01")


BUILDERS = {"prop_chest_locked": chest_locked, "prop_star": star, "prop_crystal": crystal, "npc_owl": owl,
            "prop_board_quest": board, "prop_word_jar": jar}
for n, f in BUILDERS.items():
    if not ONLY or n in ONLY:
        f()
