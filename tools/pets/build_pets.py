"""Chibi pets for English Quest: seagull, otter, hermit crab. About 0.5 m tall, <= 2,500 triangles, simple rigid rig.
Run: OUT=<folder> blender -b -P tools/pets/build_pets.py   (optional ONLY=pet_gull,pet_otter)
Feet at Z=0, front = Blender -Y = glTF +Z (like every model in the game). Clips (lower case, 24 fps):
idle and walk loop; sit, jump, spin, roll, dance, wave are 0.8-1.5 s. Materials are the pets' own colours (no _tint).
Rig helpers (make_rig, clip, q) come from tools/harbor/b5_mobs.py: bones point up with roll 0, rotations are given
around WORLD axes.
"""
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "harbor"))
from hlib import *  # noqa
from b5_mobs import make_rig, clip, q, bind, FPS  # noqa
import bpy
from mathutils import Vector, Quaternion

ONLY = [s for s in os.environ.get("ONLY", "").split(",") if s]
TAU = 2 * math.pi


def finish(name, arm, fname):
    o = group(name, origin=None, smooth=True)
    bind(o, arm)
    bpy.context.scene.render.fps = FPS
    export(fname, objs=[o], anim=True)


def eyes(x, y, z, r, white, black, shine):
    for s in (-1, 1):
        ball(r, (s * x, y, z), white, uv=(10, 6), scale=(1, .6, 1.15))
        ball(r * .62, (s * x, y - r * .45, z - r * .05), black, uv=(8, 5), scale=(1, .5, 1.15))
        ball(r * .2, (s * x + s * r * .12, y - r * .78, z + r * .3), shine, uv=(5, 3))


def roll_offset(ang, h):
    """keep the body centred while the root turns around X (the root bone sits on the ground)"""
    c = Vector((0, 0, h))
    return tuple(c - Quaternion((1, 0, 0), ang) @ c)


def common_clips(arm, h, limbs):
    """the 8 clips; limbs = dict of callables returning extra pose entries: limbs[clip](t) -> {bone: (q, off, scale)}"""
    def mk(name, n, fn):
        clip(arm, name, n, lambda t: {**fn(t), **limbs.get(name, lambda t: {})(t)})
    mk("idle", 32, lambda t: {"body": (None, (0, 0, .006 * math.sin(TAU * t)), (1 + .02 * math.sin(TAU * t), 1, 1 - .02 * math.sin(TAU * t))),
                              "head": (q((0, 1, 0), .08 * math.sin(TAU * t)), None, None)})
    mk("walk", 24, lambda t: {"root": (q((0, 0, 1), .06 * math.sin(TAU * t)), (0, 0, .02 * abs(math.sin(TAU * t))), None),
                              "head": (q((1, 0, 0), .05 * math.sin(2 * TAU * t)), None, None)})
    mk("sit", 24, lambda t: {"body": (q((1, 0, 0), .25 * min(1, t * 1.6)), (0, 0, -h * .18 * min(1, t * 1.6)), None),
                             "head": (q((1, 0, 0), -.2 * min(1, t * 1.6)), None, None)})

    def jump(t):
        crouch = max(0.0, 1 - abs(t - .12) / .12) if t < .25 else max(0.0, 1 - abs(t - .92) / .08)
        air = math.sin(math.pi * min(1, max(0, (t - .2) / .7)))
        return {"root": (None, (0, 0, h * .9 * air), None),
                "body": (None, (0, 0, -h * .1 * crouch), (1 + .12 * crouch, 1 + .12 * crouch, 1 - .15 * crouch + .08 * air))}
    mk("jump", 24, jump)
    mk("spin", 24, lambda t: {"root": (q((0, 0, 1), TAU * (t * t * (3 - 2 * t))), (0, 0, h * .15 * math.sin(math.pi * t)), None)})

    def roll(t):
        a = TAU * (t * t * (3 - 2 * t))
        return {"root": (Quaternion((1, 0, 0), a), tuple(Vector(roll_offset(a, h * .5)) + Vector((0, 0, h * .1 * math.sin(math.pi * t)))), None),
                "body": (None, None, (1, 1, 1 - .15 * math.sin(math.pi * t)))}
    clip(arm, "roll", 32, lambda t: {**_root_world(roll(t)), **limbs.get("roll", lambda t: {})(t)})
    mk("dance", 32, lambda t: {"root": (q((0, 0, 1), .35 * math.sin(TAU * t)), (0, 0, .03 * abs(math.sin(2 * TAU * t))), None),
                               "body": (q((0, 1, 0), .2 * math.sin(TAU * t)), None, None),
                               "head": (q((0, 1, 0), -.25 * math.sin(TAU * t)), None, None)})
    mk("wave", 28, lambda t: {"head": (q((0, 1, 0), .15 * math.sin(math.pi * t)), None, None)})


def _root_world(p):
    """roll() builds its root quaternion around the world X axis: convert it to the bone frame like q() does"""
    out = {}
    for k, (qq, off, sc) in p.items():
        if qq is not None and k == "root":
            ax, ang = qq.to_axis_angle()
            qq = q(ax, ang)
        out[k] = (qq, off, sc)
    return out


# ------------------------------------------------------------------ seagull
def build_gull():
    reset()
    white, grey, grey2 = mat("gull_white", "#F6F7F9", rough=.6), mat("gull_grey", "#9AA6B4", rough=.6), mat("gull_grey_dark", "#5E6B7A", rough=.6)
    beak, leg = mat("gull_beak", "#F3A12E", rough=.45), mat("gull_feet", "#F08A2A", rough=.5)
    ew, eb, sh = mat("eye_white", "#FFFFFF", rough=.3), mat("eye_black", "#1B1B22", rough=.2), mat("eye_shine", "#FFFFFF", emit=1.5)
    arm = make_rig("gull", [("root", (0, 0, 0), None), ("body", (0, 0, .22), "root"), ("head", (0, -.04, .36), "body"),
                            ("wing_L", (.13, .0, .3), "body"), ("wing_R", (-.13, .0, .3), "body"),
                            ("leg_L", (.06, .0, .14), "root"), ("leg_R", (-.06, .0, .14), "root")])
    s = len(OBJS)
    ball(.17, (0, .02, .25), white, uv=(16, 10), scale=(1, 1.2, .92))
    ball(.1, (0, .2, .27), grey, uv=(10, 6), scale=(.8, 1.2, .35), rot=(-.4, 0, 0))   # tail
    for k in (-1, 0, 1):
        ball(.04, (k * .035, .29, .24 - abs(k) * .01), grey2, uv=(6, 4), scale=(1, 2, .5), rot=(-.3, 0, 0))
    tag("body", s)
    s = len(OBJS)
    ball(.135, (0, -.06, .42), white, uv=(16, 10))
    cyl(.045, .1, (0, -.21, .41), beak, 10, r2=.012, rot=(math.pi / 2, 0, 0), scale=(1, .8, 1))
    ball(.02, (0, -.25, .395), mat("gull_beak_tip", "#E0563A"), uv=(6, 4))
    eyes(.065, -.17, .46, .038, ew, eb, sh)
    tag("head", s)
    for sd, sn in ((1, "L"), (-1, "R")):
        s = len(OBJS)
        ball(.12, (sd * .17, .04, .29), grey, uv=(12, 6), scale=(.35, 1.15, .7), rot=(.25, sd * .2, 0))
        ball(.06, (sd * .18, .15, .27), grey2, uv=(8, 5), scale=(.3, 1.2, .5), rot=(.3, sd * .15, 0))
        tag("wing_" + sn, s)
        s = len(OBJS)
        rod((sd * .06, .0, .15), (sd * .065, -.01, .03), .014, .012, leg, 6)
        for a in (-.5, 0, .5):
            rod((sd * .065, -.01, .015), (sd * .065 + math.sin(a) * .05, -.06, .01), .012, .008, leg, 5)
        ball(.035, (sd * .065, -.04, .01), leg, uv=(8, 4), scale=(1.2, 1.2, .25))
        tag("leg_" + sn, s)
    flap = lambda sd, a: q((0, 1, 0), -sd * a)
    common_clips(arm, .5, {
        "idle": lambda t: {"wing_L": (flap(1, .05 * math.sin(TAU * t)), None, None), "wing_R": (flap(-1, .05 * math.sin(TAU * t)), None, None)},
        "walk": lambda t: {"leg_L": (q((1, 0, 0), .5 * math.sin(TAU * t)), None, None), "leg_R": (q((1, 0, 0), -.5 * math.sin(TAU * t)), None, None),
                           "wing_L": (flap(1, .15), None, None), "wing_R": (flap(-1, .15), None, None)},
        "jump": lambda t: {"wing_L": (flap(1, 1.1 * abs(math.sin(3 * TAU * t)) * (.2 < t < .9)), None, None),
                           "wing_R": (flap(-1, 1.1 * abs(math.sin(3 * TAU * t)) * (.2 < t < .9)), None, None)},
        "spin": lambda t: {"wing_L": (flap(1, .9 * math.sin(math.pi * t)), None, None), "wing_R": (flap(-1, .9 * math.sin(math.pi * t)), None, None)},
        "dance": lambda t: {"wing_L": (flap(1, .6 + .5 * math.sin(2 * TAU * t)), None, None), "wing_R": (flap(-1, .6 - .5 * math.sin(2 * TAU * t)), None, None),
                            "leg_L": (q((1, 0, 0), .25 * max(0, math.sin(TAU * t))), None, None), "leg_R": (q((1, 0, 0), .25 * max(0, -math.sin(TAU * t))), None, None)},
        "wave": lambda t: {"wing_L": (flap(1, 1.3 * math.sin(math.pi * min(1, t * 1.3))) @ q((1, 0, 0), .4 * math.sin(4 * TAU * t)), None, None)},
        "sit": lambda t: {"leg_L": (q((1, 0, 0), -1.0 * min(1, t * 1.6)), None, None), "leg_R": (q((1, 0, 0), -1.0 * min(1, t * 1.6)), None, None)},
    })
    finish("gull", arm, "pet_gull_v01")


# ------------------------------------------------------------------ otter
def build_otter():
    reset()
    brown, brown2 = mat("otter_brown", "#9A6440", rough=.75), mat("otter_brown_dark", "#6E452A", rough=.75)
    cream, nose = mat("otter_cream", "#F2DFC2", rough=.7), mat("otter_nose", "#3A2620", rough=.3)
    ew, eb, sh = mat("eye_white", "#FFFFFF", rough=.3), mat("eye_black", "#1B1B22", rough=.2), mat("eye_shine", "#FFFFFF", emit=1.5)
    pink = mat("otter_pink", "#F2A3A8", rough=.6)
    arm = make_rig("otter", [("root", (0, 0, 0), None), ("body", (0, 0, .14), "root"), ("head", (0, 0, .3), "body"),
                             ("arm_L", (.09, -.02, .27), "body"), ("arm_R", (-.09, -.02, .27), "body"),
                             ("leg_L", (.06, 0, .08), "root"), ("leg_R", (-.06, 0, .08), "root"), ("tail", (0, .1, .1), "body")])
    s = len(OBJS)
    lathe([(0, .05), (.1, .06), (.13, .12), (.125, .2), (.1, .27), (.06, .31), (0, .32)], brown, seg=16, scale=(1, .9, 1))
    ball(.1, (0, -.06, .18), cream, uv=(12, 8), scale=(.85, .5, 1.1))
    tag("body", s)
    s = len(OBJS)
    ball(.13, (0, 0, .39), brown, uv=(16, 10), scale=(1.05, .95, .92))
    ball(.075, (0, -.09, .36), cream, uv=(12, 8), scale=(1.2, .8, .8))
    ball(.022, (0, -.155, .38), nose, uv=(8, 5), scale=(1.2, .8, .8))
    for sd in (-1, 1):
        ball(.035, (sd * .11, .01, .49), brown2, uv=(8, 5), scale=(1, .6, 1))
        ball(.018, (sd * .11, -.008, .49), pink, uv=(6, 4), scale=(1, .5, 1))
        for k in (-1, 1):  # whiskers
            rod((sd * .05, -.14, .36 + k * .01), (sd * .13, -.15, .37 + k * .025), .003, .002, brown2, 4)
        ball(.02, (sd * .04, -.15, .41), pink, uv=(5, 3), scale=(1, .4, .7))
    eyes(.055, -.1, .42, .028, ew, eb, sh)
    tag("head", s)
    for sd, sn in ((1, "L"), (-1, "R")):
        s = len(OBJS)
        rod((sd * .09, -.02, .27), (sd * .1, -.08, .2), .03, .026, brown, 8)
        ball(.03, (sd * .095, -.09, .19), brown2, uv=(8, 5))
        tag("arm_" + sn, s)
        s = len(OBJS)
        rod((sd * .06, 0, .09), (sd * .065, -.01, .03), .04, .035, brown, 8)
        ball(.042, (sd * .065, -.04, .02), brown2, uv=(8, 5), scale=(1, 1.4, .5))
        tag("leg_" + sn, s)
    s = len(OBJS)
    lathe([(0, 0), (.05, .0), (.045, .08), (.03, .16), (0, .2)], brown2, seg=10, loc=(0, .1, .09), scale=(1, .5, 1))
    OBJS[-1].rotation_euler = (math.radians(-110), 0, 0)
    tag("tail", s)
    arm_q = lambda sd, a: q((0, 1, 0), -sd * a)
    common_clips(arm, .5, {
        "walk": lambda t: {"leg_L": (q((1, 0, 0), .5 * math.sin(TAU * t)), None, None), "leg_R": (q((1, 0, 0), -.5 * math.sin(TAU * t)), None, None),
                           "arm_L": (q((1, 0, 0), -.4 * math.sin(TAU * t)), None, None), "arm_R": (q((1, 0, 0), .4 * math.sin(TAU * t)), None, None),
                           "tail": (q((0, 0, 1), .3 * math.sin(TAU * t)), None, None)},
        "idle": lambda t: {"tail": (q((0, 0, 1), .2 * math.sin(TAU * t)), None, None)},
        "sit": lambda t: {"leg_L": (q((1, 0, 0), -1.2 * min(1, t * 1.6)), None, None), "leg_R": (q((1, 0, 0), -1.2 * min(1, t * 1.6)), None, None),
                          "arm_L": (q((1, 0, 0), -.6 * min(1, t * 1.6)), None, None), "arm_R": (q((1, 0, 0), -.6 * min(1, t * 1.6)), None, None)},
        "jump": lambda t: {"arm_L": (arm_q(1, 1.4 * math.sin(math.pi * t)), None, None), "arm_R": (arm_q(-1, 1.4 * math.sin(math.pi * t)), None, None)},
        "dance": lambda t: {"arm_L": (arm_q(1, 1.2 + .6 * math.sin(2 * TAU * t)), None, None), "arm_R": (arm_q(-1, 1.2 - .6 * math.sin(2 * TAU * t)), None, None),
                            "tail": (q((0, 0, 1), .5 * math.sin(2 * TAU * t)), None, None)},
        "wave": lambda t: {"arm_L": (arm_q(1, 2.4 * math.sin(math.pi * min(1, t * 1.25))) @ q((1, 0, 0), .5 * math.sin(4 * TAU * t)), None, None)},
        "spin": lambda t: {"arm_L": (arm_q(1, 1.0 * math.sin(math.pi * t)), None, None), "arm_R": (arm_q(-1, 1.0 * math.sin(math.pi * t)), None, None)},
    })
    finish("otter", arm, "pet_otter_v01")


# ------------------------------------------------------------------ hermit crab
def build_hermit():
    reset()
    shell, shell2, shell3 = mat("shell_orange", "#F08A3A", rough=.45), mat("shell_cream", "#FBE3C0", rough=.5), mat("shell_dark", "#C9662A", rough=.5)
    red, red2 = mat("claw_red", "#DC3B30", rough=.45), mat("claw_red_dark", "#A82A24", rough=.5)
    body = mat("crab_body", "#F2A57A", rough=.55)
    ew, eb, sh = mat("eye_white", "#FFFFFF", rough=.3), mat("eye_black", "#1B1B22", rough=.2), mat("eye_shine", "#FFFFFF", emit=1.5)
    arm = make_rig("hermit", [("root", (0, 0, 0), None), ("body", (0, -.03, .12), "root"), ("head", (0, -.1, .16), "body"),
                              ("shell", (0, .06, .14), "body"),
                              ("claw_L", (.08, -.12, .1), "body"), ("claw_R", (-.08, -.12, .1), "body"),
                              ("legs_L", (.09, -.02, .08), "root"), ("legs_R", (-.09, -.02, .08), "root")])
    s = len(OBJS)
    ball(.11, (0, -.04, .12), body, uv=(12, 8), scale=(1.1, 1, .8))
    tag("body", s)
    s = len(OBJS)
    for sd in (-1, 1):
        rod((sd * .04, -.12, .16), (sd * .06, -.15, .3), .016, .014, body, 6)
        ball(.042, (sd * .06, -.155, .33), ew, uv=(10, 6))
        ball(.025, (sd * .06, -.19, .335), eb, uv=(8, 5), scale=(1, .6, 1.1))
        ball(.008, (sd * .07, -.205, .35), sh, uv=(4, 3))
    ball(.02, (0, -.15, .13), mat("mouth", "#8A3A3A"), uv=(6, 4), scale=(1.4, .5, .6))
    tag("head", s)
    s = len(OBJS)   # spiral shell: stacked whorls turning up and back, cream bands, dark opening rim
    for k in range(6):
        t = k / 5
        r = .19 - .13 * t
        a = t * 2.4
        ball(r, (math.sin(a) * .03, .08 + .07 * t, .16 + .22 * t), shell if k % 2 == 0 else shell2, uv=(12, 6),
             scale=(1, 1, .8), rot=(-.5, 0, a))
    cone_tip = (0.0, .16, .45)
    cyl(.05, .1, cone_tip, shell3, 10, r2=.0, rot=(-.4, 0, 0))
    torus(.11, .025, (0, -.04, .18), shell3, 14, 5, rot=(math.radians(70), 0, 0))
    tag("shell", s)
    for sd, sn in ((1, "L"), (-1, "R")):
        big = 1.25 if sd < 0 else .9               # one big claw, like a real hermit crab
        s = len(OBJS)
        rod((sd * .08, -.1, .1), (sd * .14, -.18, .12), .025, .03, red, 8)
        c = Vector((sd * .15, -.24, .13))
        ball(.065 * big, tuple(c), red, uv=(10, 6), scale=(.9, 1.2, .75))
        cyl(.035 * big, .1 * big, tuple(c + Vector((0, -.08 * big, .01))), red2, 8, r2=.008, rot=(math.pi / 2, 0, 0), scale=(1, .7, 1))
        cyl(.03 * big, .09 * big, tuple(c + Vector((0, -.075 * big, .045 * big))), red, 8, r2=.008, rot=(math.pi / 2 + .3, 0, 0), scale=(1, .7, 1))
        tag("claw_" + sn, s)
        s = len(OBJS)
        for k in range(3):
            y = -.06 + k * .05
            rod((sd * .08, y, .1), (sd * .17, y + .01, .12), .018, .016, red2, 6)
            rod((sd * .17, y + .01, .12), (sd * .22, y + .02, .0), .016, .006, red2, 6)
        tag("legs_" + sn, s)
    claw = lambda sd, a: q((1, 0, 0), -a)
    common_clips(arm, .4, {
        "idle": lambda t: {"claw_L": (claw(1, .1 * math.sin(TAU * t)), None, None), "claw_R": (claw(-1, .1 * math.sin(TAU * t + 1)), None, None)},
        "walk": lambda t: {"legs_L": (q((0, 0, 1), .3 * math.sin(2 * TAU * t)), (0, 0, .01 * max(0, math.cos(2 * TAU * t))), None),
                           "legs_R": (q((0, 0, 1), -.3 * math.sin(2 * TAU * t)), (0, 0, .01 * max(0, -math.cos(2 * TAU * t))), None),
                           "shell": (q((0, 1, 0), .08 * math.sin(TAU * t)), None, None)},
        "sit": lambda t: {"body": (None, (0, 0, -.06 * min(1, t * 1.6)), None),     # hides in the shell
                          "head": (None, (0, .04 * min(1, t * 1.6), -.06 * min(1, t * 1.6)), (1 - .5 * min(1, t * 1.6),) * 3),
                          "claw_L": (claw(1, -.5 * min(1, t * 1.6)), (0, .05 * min(1, t * 1.6), 0), None),
                          "claw_R": (claw(-1, -.5 * min(1, t * 1.6)), (0, .05 * min(1, t * 1.6), 0), None)},
        "jump": lambda t: {"claw_L": (claw(1, 1.0 * math.sin(math.pi * t)), None, None), "claw_R": (claw(-1, 1.0 * math.sin(math.pi * t)), None, None)},
        "dance": lambda t: {"claw_L": (claw(1, .8 + .6 * math.sin(2 * TAU * t)), None, None), "claw_R": (claw(-1, .8 - .6 * math.sin(2 * TAU * t)), None, None),
                            "shell": (q((0, 1, 0), .2 * math.sin(TAU * t)), None, None)},
        "wave": lambda t: {"claw_R": (claw(-1, 1.3 * math.sin(math.pi * min(1, t * 1.25))) @ q((0, 1, 0), .4 * math.sin(4 * TAU * t)), None, None)},
    })
    finish("hermit_crab", arm, "pet_crab_v01")


for n, f in (("pet_gull", build_gull), ("pet_otter", build_otter), ("pet_crab", build_hermit)):
    if ONLY and n not in ONLY:
        continue
    f()
