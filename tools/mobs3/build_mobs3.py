"""Batch 22B: element monsters for Memory Forest, the harbour and the Golden Wind desert, plus the sand dragon boss.
Run: OUT=<folder> blender -b -P tools/mobs3/build_mobs3.py (optional ONLY=mob_fox_ember,...)
Rigid rig (tools/harbor/b5_mobs.py helpers), feet at 0 (flyers hover), front Blender -Y. Clips: Idle 2 s, Walk 1 s,
Attack 0.6 s, Hit 0.3 s, Cast 0.8 s (raise arms / open mouth), Death 0.9 s (falls over); the dragon adds Roar 1.5 s.
Every rig has an "fx" bone where spells leave (mouth / hands). Materials: body_main, body_dark, eye_white, eye_dark,
glow (element colour, emission 2). <= 3,000 triangles (dragon <= 7,000). Element colours: fire ff6a2a, ice 6fd0ff,
wind 6fe08a, thunder ffd23c.
"""
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "harbor"))
from hlib import *  # noqa
from b5_mobs import make_rig, clip, q, bind, FPS  # noqa
import bpy
from mathutils import Vector, Quaternion

ONLY = [s for s in os.environ.get("ONLY", "").split(",") if s]
TAU = 2 * math.pi
ELEM = {"fire": "#FF6A2A", "ice": "#6FD0FF", "wind": "#6FE08A", "thunder": "#FFD23C"}


def bump(t, a, b):
    return 0.0 if t <= a or t >= b else math.sin(math.pi * (t - a) / (b - a))


def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def M(main, dark, el):
    return (mat("body_main", main, rough=.55), mat("body_dark", dark, rough=.6), mat("eye_white", "#FFFFFF", rough=.3),
            mat("eye_dark", "#1B1B22", rough=.2), mat("glow", ELEM[el], emit=2.0, rough=.3))


def eyes(x, y, z, r, white, dark, look=(0, -1, 0), sly=0.0):
    for s in (-1, 1):
        ball(r, (s * x, y, z), white, uv=(10, 6), scale=(1, .5, 1.15 - .35 * sly), rot=(0, s * sly * .4, 0))
        ball(r * .55, (s * x, y - r * .42, z - r * .05), dark, uv=(8, 5), scale=(1, .5, 1.1 - .3 * sly))
        ball(r * .18, (s * x + s * r * .15, y - r * .7, z + r * .3), white, uv=(5, 3))


def finish(name, arm, fname, smooth=True):
    o = group(name, origin=None, smooth=smooth)
    bind(o, arm)
    bpy.context.scene.render.fps = FPS
    export(fname, objs=[o], anim=True)


def std_clips(arm, kind, H, extra=None):
    """kind: 'quad' (4 legs), 'fly' (hover, wings), 'biped' (2 legs, 2 arms)"""
    extra = extra or {}

    def idle(t):
        s = math.sin(TAU * t)
        p = {"body": (None, (0, 0, .015 * H * s), (1 + .02 * s, 1, 1 - .02 * s)), "head": (q((0, 1, 0), .06 * math.sin(TAU * t + 1)), None, None)}
        if kind == "fly":
            p["root"] = (None, (0, 0, .05 * H * s), None)
            p["wing_L"] = (q((0, 1, 0), -.5 * math.sin(TAU * 4 * t)), None, None)
            p["wing_R"] = (q((0, 1, 0), .5 * math.sin(TAU * 4 * t)), None, None)
        if "tail" in BONES:
            p["tail"] = (q((0, 0, 1), .25 * math.sin(TAU * t)), None, None)
        return p

    def walk(t):
        s = math.sin(TAU * t)
        p = {"root": (None, (0, 0, .03 * H * abs(math.cos(TAU * t))), None), "body": (q((0, 0, 1), .06 * s), None, None)}
        if kind == "quad":
            for leg, ph in (("leg_FL", 0), ("leg_BR", 0), ("leg_FR", math.pi), ("leg_BL", math.pi)):
                p[leg] = (q((1, 0, 0), .55 * math.sin(TAU * t + ph)), None, None)
        elif kind == "biped":
            p["leg_L"] = (q((1, 0, 0), .5 * s), None, None)
            p["leg_R"] = (q((1, 0, 0), -.5 * s), None, None)
            p["arm_L"] = (q((1, 0, 0), -.4 * s), None, None)
            p["arm_R"] = (q((1, 0, 0), .4 * s), None, None)
        else:
            p["root"] = (q((1, 0, 0), .2), (0, 0, .08 * H * s), None)
            p["wing_L"] = (q((0, 1, 0), -.8 * math.sin(TAU * 3 * t)), None, None)
            p["wing_R"] = (q((0, 1, 0), .8 * math.sin(TAU * 3 * t)), None, None)
        if "tail" in BONES:
            p["tail"] = (q((0, 0, 1), .35 * s), None, None)
        return p

    def attack(t):
        back, hit = bump(t, 0, .45), bump(t, .35, .85)
        p = {"root": (None, (0, .1 * H * back - .35 * H * hit, 0), None),
             "body": (q((1, 0, 0), -.25 * back + .4 * hit), None, None), "head": (q((1, 0, 0), .2 * hit), None, None)}
        if kind == "biped":
            p["arm_R"] = (q((1, 0, 0), 1.0 * back - 1.8 * hit), None, None)
        if "jaw" in BONES:
            p["jaw"] = (q((1, 0, 0), .6 * hit), None, None)
        if "tail" in BONES and kind == "quad":
            p["tail"] = (q((1, 0, 0), -.8 * hit), None, None)
        return p

    def hit(t):
        k = math.exp(-5 * t) * math.sin(math.pi * min(1, t * 3))
        return {"root": (None, (0, .15 * H * k, 0), None), "body": (q((1, 0, 0), -.35 * k), None, (1 + .1 * k, 1 + .1 * k, 1 - .12 * k)),
                "head": (q((0, 1, 0), .3 * k), None, None)}

    def cast(t):
        up = bump(t, 0, 1)
        p = {"body": (q((1, 0, 0), -.2 * up), None, None), "head": (q((1, 0, 0), -.35 * up), None, None),
             "fx": (None, None, (1 + .8 * up,) * 3)}
        if kind == "biped" or "arm_L" in BONES:
            p["arm_L"] = (q((0, 1, 0), -2.2 * up), None, None)
            p["arm_R"] = (q((0, 1, 0), 2.2 * up), None, None)
        if "jaw" in BONES:
            p["jaw"] = (q((1, 0, 0), .7 * up), None, None)
        if kind == "fly":
            p["wing_L"] = (q((0, 1, 0), -1.0 * up), None, None)
            p["wing_R"] = (q((0, 1, 0), 1.0 * up), None, None)
        return p

    def death(t):
        f = ease(t / .8)
        drop = -extra.get("hover", 0.0) * f
        return {"root": (q((0, 1, 0), 1.45 * f), (0, 0, drop + .25 * H * math.sin(math.pi * min(1, t * 1.6)) * (1 - f)), None),
                "head": (q((1, 0, 0), .4 * f), None, None)}
    clip(arm, "Idle", 48, idle)
    clip(arm, "Walk", 24, walk)
    clip(arm, "Attack", 15, attack, step=1)
    clip(arm, "Hit", 8, hit, step=1)
    clip(arm, "Cast", 20, cast, step=1)
    clip(arm, "Death", 22, death, step=1)
    for name, (n, fn) in extra.get("clips", {}).items():
        clip(arm, name, n, fn)


BONES = []


def rig(name, bones):
    global BONES
    BONES = [b[0] for b in bones]
    return make_rig(name, bones)


# ------------------------------------------------------------------ creatures
def wisp():
    reset()
    main, dark, white, eye, glow = M("#FFE07A", "#C9A23A", "thunder")
    Z = .8
    arm = rig("wisp", [("root", (0, 0, 0), None), ("body", (0, 0, Z), "root"), ("head", (0, 0, Z + .1), "body"),
                       ("wing_L", (.12, .05, Z + .12), "body"), ("wing_R", (-.12, .05, Z + .12), "body"), ("tail", (0, .2, Z), "body"),
                       ("fx", (0, -.2, Z), "body")])
    s = len(OBJS)
    ball(.22, (0, 0, Z), main, uv=(16, 10))
    ball(.12, (0, 0, Z), glow, uv=(10, 6))
    eyes(.08, -.18, Z + .04, .055, white, eye)
    for k in range(3):
        cyl(.02, .08, (-.05 + .05 * k, -.05, Z + .23), dark, 5, r2=0, rot=(0, (k - 1) * .4, 0))
    tag("body", s)
    s = len(OBJS)
    tag("head", s)
    for sd, sn in ((1, "L"), (-1, "R")):
        s = len(OBJS)
        for k, (a, ln) in enumerate(((.5, .32), (-.1, .26))):
            ball(ln / 2, (sd * (.12 + ln * .45), .06, Z + .12 + a * .2), mat("wing_clear", "#F6FBFF", emit=.6, alpha=.45), uv=(10, 4),
                 scale=(1, .12, .45), rot=(0, sd * -a, 0))
        tag("wing_" + sn, s)
    s = len(OBJS)
    pts = [Vector((0, .2, Z)), Vector((.06, .32, Z - .05)), Vector((-.04, .4, Z - .1)), Vector((.05, .52, Z - .18))]
    for a_, b_ in zip(pts, pts[1:]):
        beam(tuple(a_), tuple(b_), .05, glow, .02)
    tag("tail", s)
    s = len(OBJS)
    ball(.01, (0, -.2, Z), glow, sub=1)
    tag("fx", s)
    std_clips(arm, "fly", .6, {"hover": Z - .15})
    finish("wisp_thunder", arm, "mob_wisp_thunder_v01")


def fox(name, fname, el, main_c, dark_c, H=.9, big_ears=False):
    reset()
    main, dark, white, eye, glow = M(main_c, dark_c, el)
    k = H / .9
    P = lambda x, y, z: (x * k, y * k, z * k)
    arm = rig(name, [("root", (0, 0, 0), None), ("body", P(0, 0, .35), "root"), ("head", P(0, -.25, .5), "body"),
                     ("jaw", P(0, -.4, .45), "head"), ("tail", P(0, .3, .4), "body"),
                     ("leg_FL", P(.1, -.15, .25), "body"), ("leg_FR", P(-.1, -.15, .25), "body"),
                     ("leg_BL", P(.1, .17, .25), "body"), ("leg_BR", P(-.1, .17, .25), "body"), ("fx", P(0, -.5, .48), "head")])
    s = len(OBJS)
    ball(.2 * k, P(0, 0, .35), main, uv=(14, 10), scale=(.85, 1.5, .8))
    ball(.14 * k, P(0, -.08, .3), white, uv=(10, 6), scale=(.8, 1.4, .6))
    tag("body", s)
    s = len(OBJS)
    ball(.2 * k, P(0, -.3, .58), main, uv=(16, 10), scale=(1.15, 1, .95))
    ball(.11 * k, P(0, -.44, .52), white, uv=(10, 6), scale=(1, 1.1, .8))
    ball(.025 * k, P(0, -.55, .54), eye, uv=(6, 4))
    eyes(.085 * k, -.45 * k, .62 * k, .045 * k, white, eye, sly=.6)
    for sd in (-1, 1):
        ear = .2 if big_ears else .13
        cyl(.07 * k * (1.4 if big_ears else 1), ear * k, P(sd * .12, -.28, .78 + ear * .3), main, 4, r2=.005, rot=(0, sd * .35, 0), scale=(1, .45, 1))
        cyl(.04 * k * (1.4 if big_ears else 1), ear * k * .8, P(sd * .12, -.30, .77 + ear * .3), white, 4, r2=.005, rot=(0, sd * .35, 0), scale=(1, .3, 1))
    tag("head", s)
    s = len(OBJS)
    tag("jaw", s)
    for leg, x, y in (("leg_FL", .1, -.15), ("leg_FR", -.1, -.15), ("leg_BL", .1, .17), ("leg_BR", -.1, .17)):
        s = len(OBJS)
        rod(P(x, y, .28), P(x, y - .02, .04), .045 * k, .035 * k, main, 8)
        ball(.045 * k, P(x, y - .04, .03), dark, uv=(8, 5), scale=(1, 1.4, .6))
        tag(leg, s)
    s = len(OBJS)
    tail_m = glow if el == "fire" else main
    pts = [Vector(P(0, .25, .4)), Vector(P(0, .42, .5)), Vector(P(0, .52, .65)), Vector(P(0, .5, .8))]
    for i, (a_, b_) in enumerate(zip(pts, pts[1:])):
        rod(tuple(a_), tuple(b_), (.08 + .03 * i) * k, (.09 + .03 * i) * k, tail_m if i else main, 8)
    if el == "fire":
        for j in range(3):
            cyl(.07 * k, .2 * k, P(.04 * (j - 1), .5, .85 + .03 * j), glow, 6, r2=0)
    else:
        ball(.09 * k, tuple(pts[-1]), white, uv=(8, 5))
    tag("tail", s)
    s = len(OBJS)
    ball(.01, P(0, -.5, .48), glow, sub=1)
    tag("fx", s)
    std_clips(arm, "quad", H)
    finish(name, arm, fname)


def gull_storm():
    reset()
    main, dark, white, eye, glow = M("#E8EDF2", "#7D8894", "wind")
    Z = 1.2
    arm = rig("gull_storm", [("root", (0, 0, 0), None), ("body", (0, 0, Z), "root"), ("head", (0, -.22, Z + .18), "body"),
                             ("jaw", (0, -.38, Z + .16), "head"), ("wing_L", (.18, 0, Z + .08), "body"), ("wing_R", (-.18, 0, Z + .08), "body"),
                             ("fx", (0, -.48, Z + .16), "head")])
    s = len(OBJS)
    ball(.25, (0, 0, Z), main, uv=(14, 10), scale=(.9, 1.4, .85))
    for k in (-1, 0, 1):
        ball(.07, (k * .06, .38, Z + .02), dark, uv=(6, 4), scale=(1, 2, .4))
    for sd in (-1, 1):
        rod((sd * .07, .05, Z - .2), (sd * .08, .0, Z - .34), .02, .015, mat("feet_orange", "#F08A2A"), 6)
    tag("body", s)
    s = len(OBJS)
    ball(.18, (0, -.25, Z + .2), main, uv=(14, 10))
    cyl(.06, .16, (0, -.44, Z + .18), mat("beak", "#F3A12E", rough=.4), 8, r2=.01, rot=(math.pi / 2, 0, 0))
    eyes(.08, -.37, Z + .25, .045, white, eye, sly=.4)
    for k, (x, z, r) in enumerate(((-.08, .48, .09), (.04, .51, .11), (.13, .47, .08))):   # little storm cloud over the head
        ball(r, (x, -.22, Z + z), dark, uv=(10, 6))
    beam((.02, -.24, Z + .4), (.05, -.26, Z + .32), .025, glow, .01)
    tag("head", s)
    s = len(OBJS)
    tag("jaw", s)
    for sd, sn in ((1, "L"), (-1, "R")):
        s = len(OBJS)
        ball(.3, (sd * .42, .02, Z + .08), dark, uv=(12, 6), scale=(1.3, .55, .14), rot=(0, sd * -.15, 0))
        ball(.2, (sd * .55, .05, Z + .085), glow, uv=(10, 4), scale=(1.3, .4, .1), rot=(0, sd * -.15, 0))
        tag("wing_" + sn, s)
    s = len(OBJS)
    ball(.01, (0, -.48, Z + .16), glow, sub=1)
    tag("fx", s)
    std_clips(arm, "fly", 1.0, {"hover": Z - .35})
    finish("gull_storm", arm, "mob_gull_storm_v01")


def seal():
    reset()
    main, dark, white, eye, glow = M("#B8C8D6", "#6E8296", "ice")
    arm = rig("seal", [("root", (0, 0, 0), None), ("body", (0, 0, .3), "root"), ("head", (0, -.3, .7), "body"), ("jaw", (0, -.5, .62), "head"),
                       ("arm_L", (.25, -.15, .35), "body"), ("arm_R", (-.25, -.15, .35), "body"), ("tail", (0, .4, .15), "body"),
                       ("fx", (0, -.58, .64), "head")])
    s = len(OBJS)
    ball(.32, (0, 0, .32), main, uv=(16, 10), scale=(1, 1.5, .95))
    ball(.24, (0, -.12, .28), white, uv=(12, 8), scale=(.9, 1.3, .8))
    tag("body", s)
    s = len(OBJS)
    ball(.26, (0, -.32, .72), main, uv=(16, 10))
    ball(.11, (0, -.52, .64), white, uv=(10, 6), scale=(1.2, .8, .8))
    ball(.035, (0, -.6, .67), eye, uv=(6, 4))
    eyes(.1, -.5, .78, .055, white, eye)
    lathe([(0, .9), (.2, .9), (.2, .95), (.05, 1.15), (0, 1.15)], glow, seg=8)     # pointed ice cap
    for sd in (-1, 1):
        for k in range(3):   # crystal whiskers
            cyl(.006, .14, (sd * .14, -.6, .64 + .02 * (k - 1)), glow, 4, r2=0, rot=(0, sd * (math.pi / 2 - .1 * (k - 1)), 0))
    tag("head", s)
    s = len(OBJS)
    tag("jaw", s)
    for sd, sn in ((1, "L"), (-1, "R")):
        s = len(OBJS)
        ball(.12, (sd * .32, -.18, .2), dark, uv=(8, 5), scale=(.4, 1.2, .3), rot=(0, sd * .3, 0))
        tag("arm_" + sn, s)
    s = len(OBJS)
    for sd in (-1, 1):
        ball(.13, (sd * .1, .48, .1), dark, uv=(8, 5), scale=(.9, 1.3, .3), rot=(0, 0, sd * .5))
    tag("tail", s)
    s = len(OBJS)
    ball(.01, (0, -.58, .64), glow, sub=1)
    tag("fx", s)
    std_clips(arm, "quad", 1.1)
    finish("seal_frost", arm, "mob_seal_frost_v01")


def scorpion():
    reset()
    main, dark, white, eye, glow = M("#D9A65A", "#8A5A2A", "fire")
    arm = rig("scorpion", [("root", (0, 0, 0), None), ("body", (0, 0, .25), "root"), ("head", (0, -.35, .3), "body"),
                           ("jaw", (0, -.5, .3), "head"), ("tail", (0, .35, .35), "body"),
                           ("arm_L", (.22, -.35, .28), "body"), ("arm_R", (-.22, -.35, .28), "body"),
                           ("leg_FL", (.2, -.05, .2), "body"), ("leg_FR", (-.2, -.05, .2), "body"),
                           ("leg_BL", (.2, .15, .2), "body"), ("leg_BR", (-.2, .15, .2), "body"), ("fx", (0, .3, 1.2), "tail")])
    s = len(OBJS)
    for k in range(4):
        ball(.22 - .02 * k, (0, -.15 + k * .15, .25), main if k % 2 == 0 else dark, uv=(12, 6), scale=(1.15, .8, .55))
    tag("body", s)
    s = len(OBJS)
    ball(.17, (0, -.38, .32), main, uv=(12, 8), scale=(1.1, 1, .8))
    eyes(.07, -.5, .38, .045, white, eye, sly=.3)
    tag("head", s)
    s = len(OBJS)
    tag("jaw", s)
    for sd, sn in ((1, "L"), (-1, "R")):
        s = len(OBJS)
        rod((sd * .2, -.35, .28), (sd * .32, -.6, .3), .05, .055, main, 8)
        ball(.11, (sd * .34, -.72, .32), dark, uv=(10, 6), scale=(.9, 1.3, .7))
        cyl(.04, .13, (sd * .36, -.86, .34), main, 6, r2=.01, rot=(math.pi / 2, 0, 0))
        tag("arm_" + sn, s)
    for leg, x, y in (("leg_FL", .2, -.05), ("leg_FR", -.2, -.05), ("leg_BL", .2, .15), ("leg_BR", -.2, .15)):
        s = len(OBJS)
        sd = 1 if x > 0 else -1
        for dy in (-.04, .04):
            rod((x, y + dy, .22), (x + sd * .16, y + dy, .26), .025, .02, dark, 6)
            rod((x + sd * .16, y + dy, .26), (x + sd * .24, y + dy, 0), .02, .01, dark, 6)
        tag(leg, s)
    s = len(OBJS)
    pts = [Vector(p) for p in ((0, .35, .35), (0, .5, .6), (0, .48, .85), (0, .35, 1.05), (0, .22, 1.15))]
    for i, (a_, b_) in enumerate(zip(pts, pts[1:])):
        ball(.09 - .01 * i, tuple(a_), main if i % 2 else dark, uv=(10, 6))
        rod(tuple(a_), tuple(b_), .07 - .01 * i, .06 - .01 * i, main, 8)
    ball(.08, (0, .2, 1.18), glow, uv=(10, 6))
    cyl(.07, .25, (0, .17, 1.32), glow, 6, r2=0)
    tag("tail", s)
    s = len(OBJS)
    ball(.01, (0, .3, 1.2), glow, sub=1)
    tag("fx", s)
    std_clips(arm, "quad", 1.2)
    finish("scorpion_sand", arm, "mob_scorpion_sand_v01")


def djinn():
    reset()
    main, dark, white, eye, glow = M("#E8C88A", "#A8844A", "wind")
    Z = .7
    arm = rig("djinn", [("root", (0, 0, 0), None), ("body", (0, 0, Z), "root"), ("head", (0, -.05, Z + .55), "body"),
                        ("jaw", (0, -.25, Z + .48), "head"), ("arm_L", (.28, 0, Z + .38), "body"), ("arm_R", (-.28, 0, Z + .38), "body"),
                        ("wing_L", (.3, .1, Z + .3), "body"), ("wing_R", (-.3, .1, Z + .3), "body"), ("tail", (0, 0, .3), "root"),
                        ("fx", (0, -.4, Z + .4), "body")])
    s = len(OBJS)
    lathe([(0, Z - .05), (.18, Z), (.27, Z + .2), (.28, Z + .35), (.2, Z + .45), (0, Z + .48)], main, seg=14)
    torus(.21, .03, (0, 0, Z + .05), dark, 14, 4)
    ball(.06, (0, -.25, Z + .3), glow, uv=(8, 5))
    tag("body", s)
    s = len(OBJS)
    ball(.25, (0, -.05, Z + .7), main, uv=(16, 10))
    eyes(.09, -.25, Z + .74, .055, white, eye, sly=.5)
    lathe([(0, Z + .82), (.27, Z + .84), (.2, Z + .98), (.04, Z + 1.04), (0, Z + 1.05)], glow, seg=12)       # turban
    ball(.04, (0, -.25, Z + .9), mat("gem", "#F05AA0", emit=1.0), uv=(6, 4))
    tag("head", s)
    s = len(OBJS)
    tag("jaw", s)
    for sd, sn in ((1, "L"), (-1, "R")):
        s = len(OBJS)
        rod((sd * .27, 0, Z + .38), (sd * .42, -.08, Z + .18), .06, .05, main, 8)
        ball(.07, (sd * .44, -.1, Z + .14), main, uv=(8, 5))
        torus(.06, .015, (sd * .41, -.07, Z + .21), glow, 10, 3, rot=(0, sd * .5, 0))
        tag("arm_" + sn, s)
        s = len(OBJS)
        tag("wing_" + sn, s)
    s = len(OBJS)   # lower half: a small tornado
    for k in range(3):
        n = 14
        pts = [Vector(((.05 + .2 * t) * math.cos(t * TAU * 2 + k * 2.1), (.05 + .2 * t) * math.sin(t * TAU * 2 + k * 2.1), .02 + (Z - .02) * t)) for t in [i / (n - 1) for i in range(n)]]
        for a_, b_ in zip(pts, pts[1:]):
            beam(tuple(a_), tuple(b_), .05, glow if k == 1 else dark, .015)
    lathe([(.02, 0), (.1, .25), (.2, Z - .05), (0, Z)], mat("dust", "#E8D3A2", alpha=.5), seg=10)
    tag("tail", s)
    s = len(OBJS)
    ball(.01, (0, -.4, Z + .4), glow, sub=1)
    tag("fx", s)
    std_clips(arm, "fly", 1.6, {"hover": 0.0})
    finish("djinn_dust", arm, "mob_djinn_dust_v01")


def cactus():
    reset()
    main, dark, white, eye, glow = M("#5FA046", "#3E7A33", "thunder")
    arm = rig("cactus", [("root", (0, 0, 0), None), ("body", (0, 0, .25), "root"), ("head", (0, 0, 1.0), "body"), ("jaw", (0, -.2, .85), "head"),
                         ("arm_L", (.22, 0, .8), "body"), ("arm_R", (-.22, 0, .8), "body"), ("leg_L", (.1, 0, .25), "root"),
                         ("leg_R", (-.1, 0, .25), "root"), ("fx", (0, -.25, 1.3), "head")])
    s = len(OBJS)
    lathe([(0, .2), (.2, .22), (.24, .5), (.23, .9), (0, .95)], main, seg=10)
    for k in range(10):   # ribs + glowing spines
        a = k * TAU / 10
        beam((.23 * math.cos(a), .23 * math.sin(a), .3), (.22 * math.cos(a), .22 * math.sin(a), .9), .03, dark)
        for z in (.45, .7):
            cyl(.01, .07, (.26 * math.cos(a), .26 * math.sin(a), z), glow, 4, r2=0, rot=(0, math.pi / 2, a))
    eyes(.08, -.22, .75, .05, white, eye)
    ball(.025, (0, -.24, .62), eye, uv=(6, 4), scale=(1.5, .5, .7))
    tag("body", s)
    s = len(OBJS)
    lathe([(0, .9), (.22, .92), (.18, 1.25), (0, 1.3)], main, seg=10)
    for k in range(4):   # pink flower crown
        a = k * TAU / 4
        ball(.06, (.06 * math.cos(a), .06 * math.sin(a), 1.32), mat("flower_pink", "#F28AB3"), uv=(6, 4), scale=(1, 1, .5))
    ball(.035, (0, 0, 1.34), glow, uv=(6, 4))
    tag("head", s)
    s = len(OBJS)
    tag("jaw", s)
    for sd, sn in ((1, "L"), (-1, "R")):
        s = len(OBJS)
        rod((sd * .2, 0, .75), (sd * .4, 0, .75), .08, .08, main, 8)
        rod((sd * .4, 0, .75), (sd * .42, 0, 1.05), .08, .07, main, 8)
        cyl(.01, .07, (sd * .48, 0, .95), glow, 4, r2=0, rot=(0, sd * math.pi / 2, 0))
        tag("arm_" + sn, s)
        s = len(OBJS)
        rod((sd * .1, 0, .25), (sd * .1, -.02, .04), .07, .06, dark, 8)
        ball(.07, (sd * .1, -.06, .035), dark, uv=(8, 5), scale=(1, 1.4, .5))
        tag("leg_" + sn, s)
    s = len(OBJS)
    ball(.01, (0, -.25, 1.3), glow, sub=1)
    tag("fx", s)
    std_clips(arm, "biped", 1.5)
    finish("cactus_spark", arm, "mob_cactus_spark_v01")


def dragon():
    reset()
    main, dark, white, eye, glow = M("#D9A65A", "#8A5A2A", "fire")
    belly = mat("body_belly", "#F2D9A0", rough=.6)
    k = 4.0 / 1.0
    arm = rig("sand_dragon", [("root", (0, 0, 0), None), ("body", (0, 0, 1.2), "root"), ("neck", (0, -.7, 2.0), "body"),
                              ("head", (0, -1.0, 3.1), "neck"), ("jaw", (0, -1.55, 2.95), "head"), ("tail", (0, 1.0, 1.0), "body"),
                              ("tail2", (0, 2.0, .6), "tail"), ("wing_L", (.6, .1, 2.2), "body"), ("wing_R", (-.6, .1, 2.2), "body"),
                              ("leg_FL", (.55, -.6, 1.0), "body"), ("leg_FR", (-.55, -.6, 1.0), "body"),
                              ("leg_BL", (.55, .6, 1.0), "body"), ("leg_BR", (-.55, .6, 1.0), "body"), ("fx", (0, -1.95, 2.95), "head"),
                              ("shield_1", (0, -1.0, 1.9), "body"), ("shield_2", (.55, -.75, 1.8), "body"), ("shield_3", (-.55, -.75, 1.8), "body")])
    s = len(OBJS)
    ball(1.0, (0, 0, 1.45), main, uv=(18, 12), scale=(.85, 1.35, .8))
    ball(.8, (0, -.25, 1.25), belly, uv=(14, 10), scale=(.75, 1.2, .7))
    for kk in range(6):   # back spikes
        cyl(.14, .4, (0, -.6 + kk * .3, 2.15 - .05 * abs(kk - 2)), dark, 4, r2=0)
    tag("body", s)
    s = len(OBJS)
    rod((0, -.6, 1.8), (0, -.95, 2.8), .45, .35, main, 12)
    for kk in range(3):
        cyl(.1, .3, (0, -.7 - .12 * kk, 2.2 + .25 * kk), dark, 4, r2=0, rot=(-.4, 0, 0))
    tag("neck", s)
    s = len(OBJS)
    ball(.55, (0, -1.1, 3.15), main, uv=(16, 10), scale=(1, 1.1, .85))
    ball(.35, (0, -1.55, 3.08), main, uv=(12, 8), scale=(1, 1.2, .7))
    eyes(.28, -1.42, 3.35, .14, white, eye, sly=.6)
    for sd in (-1, 1):
        cyl(.1, .55, (sd * .3, -.85, 3.65), dark, 6, r2=.01, rot=(.6, sd * .35, 0))
        ball(.04, (sd * .12, -1.88, 3.12), eye, uv=(6, 4))
    tag("head", s)
    s = len(OBJS)
    ball(.3, (0, -1.5, 2.88), belly, uv=(12, 6), scale=(.9, 1.25, .35))
    for sd in (-1, 1):
        cyl(.03, .1, (sd * .15, -1.85, 2.98), white, 5, r2=0, rot=(math.pi, 0, 0))
    tag("jaw", s)
    s = len(OBJS)
    rod((0, .9, 1.2), (0, 2.0, .7), .45, .3, main, 10)
    tag("tail", s)
    s = len(OBJS)
    rod((0, 2.0, .7), (0, 3.0, .35), .3, .1, main, 10)
    cyl(.25, .45, (0, 3.15, .4), glow, 6, r2=0, rot=(-1.4, 0, 0))
    tag("tail2", s)
    for sd, sn in ((1, "L"), (-1, "R")):
        s = len(OBJS)
        rod((sd * .6, .1, 2.2), (sd * 1.6, .3, 3.0), .1, .06, dark, 8)
        rod((sd * 1.6, .3, 3.0), (sd * 2.4, .6, 2.2), .06, .03, dark, 6)
        verts = [(sd * .6, .1, 2.2), (sd * 1.6, .3, 3.0), (sd * 2.4, .6, 2.2), (sd * 1.8, .9, 1.7), (sd * 1.1, .8, 1.75), (sd * .7, .6, 1.9)]
        mesh([tuple(v) for v in verts] + [(v[0], v[1] + .02, v[2]) for v in verts],
             [[0, 1, 2, 3, 4, 5], [11, 10, 9, 8, 7, 6]] if sd > 0 else [[5, 4, 3, 2, 1, 0], [6, 7, 8, 9, 10, 11]], glow)
        tag("wing_" + sn, s)
    for leg, x, y in (("leg_FL", .55, -.6), ("leg_FR", -.55, -.6), ("leg_BL", .55, .6), ("leg_BR", -.55, .6)):
        s = len(OBJS)
        rod((x, y, 1.1), (x * 1.05, y - .1, .15), .26, .2, main, 10)
        ball(.25, (x * 1.05, y - .22, .12), dark, uv=(10, 6), scale=(1, 1.4, .5))
        tag(leg, s)
    for i, b in enumerate(("shield_1", "shield_2", "shield_3")):   # three word-shield sockets on the chest
        s = len(OBJS)
        p = {"shield_1": (0, -1.08, 1.75), "shield_2": (.55, -.88, 1.7), "shield_3": (-.55, -.88, 1.7)}[b]
        cyl(.22, .05, p, mat("shield_slot", "#FFE08A", emit=1.2), 12, rot=(math.pi / 2 - .3, 0, (p[0]) * .6))
        tag(b, s)
    s = len(OBJS)
    ball(.02, (0, -1.95, 2.95), glow, sub=1)
    tag("fx", s)

    def roar(t):
        up = bump(t, .05, .95)
        shake = math.sin(TAU * 8 * t) * up
        return {"neck": (q((1, 0, 0), -.45 * up), None, None), "head": (q((1, 0, 0), -.3 * up) @ q((0, 0, 1), .05 * shake), None, None),
                "jaw": (q((1, 0, 0), .8 * up), None, None), "wing_L": (q((0, 1, 0), -.8 * up), None, None),
                "wing_R": (q((0, 1, 0), .8 * up), None, None), "body": (None, (0, .05 * shake, 0), None), "fx": (None, None, (1 + up,) * 3)}
    std_clips(arm, "quad", 4.0, {"clips": {"Roar": (36, roar)}})
    finish("sand_dragon", arm, "boss_sand_dragon_v01")


BUILDERS = {"mob_wisp_thunder": wisp,
            "mob_fox_ember": lambda: fox("fox_ember", "mob_fox_ember_v01", "fire", "#E8763A", "#8A3A1E"),
            "mob_gull_storm": gull_storm, "mob_seal_frost": seal, "mob_scorpion_sand": scorpion, "mob_djinn_dust": djinn,
            "mob_cactus_spark": cactus,
            "mob_fox_moon": lambda: fox("fox_moon", "mob_fox_moon_v01", "ice", "#DCE6F2", "#6E82A0", H=1.0, big_ears=True),
            "boss_sand_dragon": dragon}
for n, f in BUILDERS.items():
    if not ONLY or n in ONLY:
        f()
