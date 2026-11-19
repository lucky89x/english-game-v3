"""Batch 13: Map 1 monsters (village fields + Memory Forest), rigged, clips Idle / Walk / Attack / Hit.
Run: OUT=<folder> blender -b -P tools/mobs1/build_mobs1.py   (optional ONLY=mob_slime_green,boss_slime_king)
Front = Blender -Y (glTF +Z); feet on Z=0 (glTF y=0) except the bat, whose body hovers at about 1.2 m.
Material names are fixed (the game flashes them on a hit): see each builder. <= 2,500 triangles, bosses <= 7,000.
Rigid skinning (every part on one bone); rig helpers make_rig / clip / q come from tools/harbor/b5_mobs.py:
bones point up with roll 0 and rotations are given around WORLD axes. The export prints each model's bbox.
"""
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "harbor"))
from hlib import *  # noqa
from b5_mobs import make_rig, clip, q, bind, FPS  # noqa
import bpy
from mathutils import Vector, Quaternion

ONLY = [s for s in os.environ.get("ONLY", "").split(",") if s]
TAU = 2 * math.pi


def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def bump(t, a, b):
    """0 outside [a, b], smooth 0 -> 1 -> 0 inside"""
    if t <= a or t >= b:
        return 0.0
    return math.sin(math.pi * (t - a) / (b - a))


def finish(name, arm, fname, smooth=False):
    o = group(name, origin=None, smooth=smooth)
    bind(o, arm)
    bpy.context.scene.render.fps = FPS
    export(fname, objs=[o], anim=True)


def jag_rock(r, loc, m, seed, scale=(1, 1, 1), sub=2, jag=.18, rot=(0, 0, 0)):
    rnd = random.Random(seed)
    o = ball(r, loc, m, sub=sub, scale=scale, rot=rot)
    for v in o.data.vertices:
        v.co *= 1 + rnd.uniform(-jag, jag)
    return o


def eyes(x, y, z, r, white, black, shine=None, lid=None, brow=None, brow_m=None, angry=0.0):
    for s in (-1, 1):
        ball(r, (s * x, y, z), white, uv=(12, 8), scale=(1, .5, 1.2))
        ball(r * .55, (s * x, y - r * .4, z - r * .1), black, uv=(10, 6), scale=(1, .5, 1.15))
        if shine:
            ball(r * .18, (s * x + s * r * .15, y - r * .62, z + r * .35), shine, uv=(6, 4))
        if lid:   # half-closed lids: haughty look
            ball(r * 1.06, (s * x, y + r * .02, z + r * .35), lid, uv=(12, 6), scale=(1, .55, .55))
        if brow:
            box((r * 1.5, r * .3, r * .32), (s * x, y - r * .3, z + r * 1.35), brow_m, rot=(0, s * angry, 0))


# ------------------------------------------------------------------ slimes
SLIME = [(0, 0), (.46, 0), (.5, .07), (.5, .28), (.44, .55), (.31, .8), (.14, .96), (0, 1.0)]


def slime_body(H, W, body, light, alpha=1.0):
    lathe([(r * W, z * H) for r, z in SLIME], body, seg=24)
    lathe([(.505 * W, .02 * H), (.515 * W, .1 * H), (.47 * W, .14 * H)], light, seg=24)        # glossy foot rim
    ball(.14 * W, (-.27 * W, -.18 * W, .76 * H), light, uv=(10, 6), scale=(.45, .3, 1.5), rot=(.5, .55, .9))   # gloss streak


def slime_clips(arm, H, W, king=False):
    def idle(t):
        s = math.sin(TAU * t)
        return {"body": (None, None, (1 + .04 * s, 1 + .04 * s, 1 - .05 * s))}

    def walk(t):
        up = math.sin(math.pi * t)                       # one hop per cycle
        land = max(0.0, 1 - min(t, 1 - t) / .14)
        return {"root": (None, (0, 0, .28 * H * up), None),
                "body": (q((1, 0, 0), .1 * math.sin(TAU * t)), None,
                         (1 + .15 * land - .05 * up, 1 + .15 * land - .05 * up, 1 - .22 * land + .1 * up))}

    def attack(t):
        if not king:                                     # wind up back, lunge forward with a headbutt, return
            back = bump(t, 0, .4)
            hit = bump(t, .35, .8)
            return {"root": (None, (0, .18 * W * back - .75 * W * hit, .12 * H * hit), None),
                    "body": (q((1, 0, 0), -.25 * back + .35 * hit), None,
                             (1 + .12 * back, 1 + .12 * back - .1 * hit, 1 - .2 * back + .15 * hit))}
        crouch = bump(t, 0, .3)                           # crouch, jump high, slam down flat
        air = bump(t, .22, .72)
        slam = bump(t, .66, 1.0)
        return {"root": (None, (0, -.3 * W * air, 1.2 * H * air), None),
                "body": (None, None, (1 + .2 * crouch + .35 * slam, 1 + .2 * crouch + .35 * slam, 1 - .3 * crouch + .15 * air - .45 * slam))}

    def hit(t):
        k = math.exp(-5 * t) * math.sin(math.pi * min(1, t * 3))
        return {"root": (None, (0, .25 * W * k, 0), None),
                "body": (q((1, 0, 0), -.3 * k), None, (1 + .25 * k, 1 + .25 * k, 1 - .3 * k))}
    clip(arm, "Idle", 48, idle)
    clip(arm, "Walk", 24, walk)
    clip(arm, "Attack", 28 if not king else 36, attack)
    clip(arm, "Hit", 14, hit)


def build_slime_green():
    reset()
    body, light = mat("slime_green", "#5CC85A", rough=.15), mat("slime_green_light", "#B6F29A", rough=.1)
    white, black = mat("eye_white", "#FFFFFF", rough=.3), mat("eye_black", "#1B1B22", rough=.2)
    H, W = .9, 1.0
    arm = make_rig("slime_green", [("root", (0, 0, 0), None), ("body", (0, 0, .02), "root")])
    s = len(OBJS)
    slime_body(H, W, body, light)
    eyes(.16, -.41, .5, .1, white, black, light)
    for a in (-.5, 0, .5):   # small smile
        p = Vector((.06 * math.sin(a), -.46, .36 - .025 * math.cos(a)))
        ball(.022, tuple(p), black, uv=(6, 4), scale=(1.4, .6, .8))
    tag("body", s)
    slime_clips(arm, H, W)
    finish("slime_green", arm, "mob_slime_green_v01", smooth=True)


def build_slime_red():
    reset()
    body, light = mat("slime_red", "#E2532E", rough=.15), mat("slime_red_light", "#FFB08A", rough=.1)
    white, black = mat("eye_white", "#FFFFFF", rough=.3), mat("eye_black", "#1B1B22", rough=.2)
    horn = mat("horn_cream", "#F4E2B8", rough=.5)
    H, W = 1.1, 1.08
    arm = make_rig("slime_red", [("root", (0, 0, 0), None), ("body", (0, 0, .02), "root")])
    s = len(OBJS)
    slime_body(H, W, body, light)
    eyes(.17, -.44, .6, .1, white, black, light, brow=True, brow_m=black, angry=-.45)
    for a in (-.5, 0, .5):   # frown
        p = Vector((.07 * math.sin(a), -.5, .42 + .03 * math.cos(a)))
        ball(.024, tuple(p), black, uv=(6, 4), scale=(1.4, .6, .8))
    for sx in (-1, 1):       # two small horns
        cyl(.07, .2, (sx * .2, -.12, H * .93), horn, 10, r2=.008, rot=(-.2, sx * .45, 0))
    tag("body", s)
    slime_clips(arm, H, W)
    finish("slime_red", arm, "mob_slime_red_v01", smooth=True)


def build_slime_king():
    reset()
    body = mat("slime_blue", "#4F8FE6", rough=.08, alpha=.86)
    light = mat("slime_blue_light", "#A9D2FF", rough=.05)
    white, black = mat("eye_white", "#FFFFFF", rough=.3), mat("eye_black", "#1B1B22", rough=.2)
    gold, gem = mat("gold", "#E2B04A", rough=.25, metal=.85), mat("gem_red", "#E0263A", rough=.1, emit=.6)
    H, W = 2.25, 2.5
    arm = make_rig("slime_king", [("root", (0, 0, 0), None), ("body", (0, 0, .05), "root"), ("crown", (0, 0, H * .95), "body")])
    s = len(OBJS)
    slime_body(H, W, body, light)
    lid = mat("slime_blue_light", "#A9D2FF")
    eyes(.4, -1.03, 1.25, .22, white, black, light, lid=body)
    for a in (-.55, -.2, .15, .5):   # one-sided smug smile
        p = Vector((.16 * math.sin(a) + .05, -1.13, .9 - .04 * math.cos(a) + .05 * a))
        ball(.045, tuple(p), black, uv=(6, 4), scale=(1.5, .6, .7))
    tag("body", s)
    s = len(OBJS)
    zc = H * .955
    lathe([(.42, 0), (.44, .14), (.43, .16), (.41, .02)], gold, seg=20, loc=(0, 0, zc))
    for k in range(8):
        a = k / 8 * TAU
        cyl(.07, .22, (.42 * math.cos(a), .42 * math.sin(a), zc + .24), gold, 4, r2=.0)
        ball(.035, (.42 * math.cos(a), .42 * math.sin(a), zc + .36), gold, uv=(6, 4))
    ball(.09, (0, -.44, zc + .08), gem, uv=(10, 6), scale=(1, .6, 1.2))
    for k in (-1, 1):
        ball(.05, (k * .3, -.31, zc + .08), gem, uv=(8, 5), scale=(1, .6, 1.1))
    tag("crown", s)
    slime_clips(arm, H, W, king=True)
    finish("slime_king", arm, "boss_slime_king_v01", smooth=True)


# ------------------------------------------------------------------ golems
def golem(name, fname, H, m, ancient=False):
    k = H / 1.8
    rock, dark, moss = m["main"], m["dark"], m["moss"]
    glow = m["glow"]
    P = lambda x, y, z: (x * k, y * k, z * k)
    bones = [("root", (0, 0, 0), None), ("hips", P(0, 0, .7), "root"), ("chest", P(0, 0, .9), "hips"),
             ("head", P(0, 0, 1.5), "chest")]
    for sd, sn in ((1, "L"), (-1, "R")):
        bones += [("arm_" + sn, P(sd * .62, 0, 1.35), "chest"), ("fore_" + sn, P(sd * .7, 0, 1.0), "arm_" + sn),
                  ("leg_" + sn, P(sd * .22, 0, .62), "hips")]
    arm = make_rig(name, bones)
    seed = [0]

    def R(r, loc, mm, scale=(1, 1, 1), sub=2, jag=.16):
        seed[0] += 1
        return jag_rock(r * k, P(*loc), mm, seed[0] + (50 if ancient else 0), scale=scale, sub=sub, jag=jag)
    for sd, sn in ((1, "L"), (-1, "R")):
        s = len(OBJS)
        R(.17, (sd * .22, 0, .46), rock, (1, 1, 1.1))
        R(.2, (sd * .23, -.04, .135), dark, (1, 1.25, .55))
        tag("leg_" + sn, s)
    s = len(OBJS)
    R(.3, (0, 0, .72), dark, (1.15, .8, .55))
    tag("hips", s)
    s = len(OBJS)
    R(.5, (0, 0, 1.13), rock, (1.12, .78, .82), sub=3, jag=.08)
    R(.33, (0, .02, 1.42), moss, (1.25, .85, .32), sub=2, jag=.1)
    for sd in (-1, 1):
        R(.21, (sd * .55, 0, 1.38), dark)
        R(.13, (sd * .58, 0, 1.55), moss, (1.2, 1.2, .45))
    tag("chest", s)
    s = len(OBJS)
    box((.36 * k, .32 * k, .3 * k), P(0, -.03, 1.66), rock, bev=.03 * k)
    R(.14, (0, .02, 1.83), moss, (1.3, 1.1, .35))
    for sd in (-1, 1):
        box((.08 * k, .03 * k, .05 * k), P(sd * .08, -.195, 1.67), glow)
    box((.26 * k, .05 * k, .05 * k), P(0, -.19, 1.76), dark, rot=(0, 0, 0))   # heavy brow
    tag("head", s)
    for sd, sn in ((1, "L"), (-1, "R")):
        s = len(OBJS)
        R(.15, (sd * .66, 0, 1.12), rock, (1, 1, 1.25))
        tag("arm_" + sn, s)
        s = len(OBJS)
        R(.15, (sd * .7, -.02, .9), dark, (1, 1, 1.1))
        R(.26, (sd * .73, -.06, .62), rock, (1.05, 1.05, 1.0), sub=3, jag=.1)     # big fist
        tag("fore_" + sn, s)
    if ancient:   # vines and glowing runes
        vine = m["vine"]
        s = len(OBJS)
        pts = [P(-.45, -.3, 1.4), P(-.2, -.4, 1.2), P(.1, -.38, 1.0), P(.4, -.3, .85), P(.5, -.1, .75)]
        for a, b in zip(pts, pts[1:]):
            rod(a, b, .035 * k, .03 * k, vine, 6)
        for j in range(4):
            ball(.06 * k, tuple(Vector(pts[j]) + Vector((0, -.03 * k, 0))), vine, uv=(6, 4), scale=(1.4, .5, .7))
        cyl(.13 * k, .02 * k, P(0, -.395, 1.18), glow, 16, rot=(math.pi / 2, 0, 0))
        cyl(.09 * k, .025 * k, P(0, -.4, 1.18), rock, 16, rot=(math.pi / 2, 0, 0))
        for a in range(3):
            ang = a * TAU / 3 + .5
            box((.025 * k, .02 * k, .12 * k), P(.17 * math.cos(ang), -.39, 1.18 + .17 * math.sin(ang)), glow, rot=(0, -ang, 0))
        tag("chest", s)
        for sd, sn in ((1, "L"), (-1, "R")):
            s = len(OBJS)
            for j in range(3):
                box((.04 * k, .02 * k, .03 * k), P(sd * .72, -.31, .58 + j * .07), glow)
            rod(P(sd * .6, -.15, .85), P(sd * .85, -.05, .7), .025 * k, .025 * k, vine, 6)
            tag("fore_" + sn, s)
            s = len(OBJS)
            box((.03 * k, .02 * k, .1 * k), P(sd * .66, -.16, 1.12), glow)
            tag("arm_" + sn, s)

    arm_x = lambda a: q((1, 0, 0), a)

    def idle(t):
        s = math.sin(TAU * t)
        return {"chest": (q((1, 0, 0), .03 * s), None, None), "head": (q((0, 0, 1), .12 * math.sin(TAU * t + 1)), None, None),
                "arm_L": (arm_x(.05 * s), None, None), "arm_R": (arm_x(-.05 * s), None, None)}

    def walk(t):
        s = math.sin(TAU * t)
        return {"root": (None, (0, 0, .05 * k * abs(math.cos(TAU * t))), None),
                "hips": (q((0, 0, 1), .08 * s), None, None), "chest": (q((0, 0, 1), -.1 * s) @ q((1, 0, 0), .06), None, None),
                "leg_L": (q((1, 0, 0), .45 * s), None, None), "leg_R": (q((1, 0, 0), -.45 * s), None, None),
                "arm_L": (arm_x(-.35 * s), None, None), "arm_R": (arm_x(.35 * s), None, None)}

    def attack(t):
        if not ancient:                                   # both arms up overhead, slam down
            up = ease(t / .45) if t < .45 else 1 - ease((t - .45) / .15) * .62 if t < .6 else .38 * (1 - ease((t - .75) / .25))
            lean = bump(t, .45, 1.0)
            a = -2.7 * up if t < .6 else -1.0 - 1.7 * 0 if t < .75 else -1.0 * (1 - ease((t - .75) / .25))
            if t >= .45 and t < .6:
                a = -2.7 + 1.7 * ease((t - .45) / .15)
            return {"chest": (q((1, 0, 0), -.2 * bump(t, 0, .5) + .35 * lean), None, None),
                    "arm_L": (arm_x(a), None, None), "arm_R": (arm_x(a), None, None),
                    "fore_L": (arm_x(-.3 * bump(t, 0, .6)), None, None), "fore_R": (arm_x(-.3 * bump(t, 0, .6)), None, None),
                    "root": (None, (0, 0, -.05 * k * lean), None)}
        wind = bump(t, 0, .45)                            # both fists pulled back, then a two-handed punch forward
        punch = bump(t, .38, .85)
        a = .5 * wind - 1.55 * punch
        return {"chest": (q((1, 0, 0), -.15 * wind + .3 * punch), None, None),
                "arm_L": (arm_x(a), None, None), "arm_R": (arm_x(a), None, None),
                "fore_L": (arm_x(-.6 * wind + .2 * punch), None, None), "fore_R": (arm_x(-.6 * wind + .2 * punch), None, None),
                "root": (None, (0, -.25 * k * punch, 0), None)}

    def hit(t):
        kk = math.exp(-5 * t) * math.sin(math.pi * min(1, t * 3))
        return {"chest": (q((1, 0, 0), -.3 * kk), None, None), "head": (q((0, 1, 0), .25 * kk), None, None),
                "root": (None, (0, .12 * k * kk, 0), None),
                "arm_L": (arm_x(.3 * kk), None, None), "arm_R": (arm_x(.3 * kk), None, None)}
    clip(arm, "Idle", 48, idle)
    clip(arm, "Walk", 32, walk)
    clip(arm, "Attack", 32, attack)
    clip(arm, "Hit", 14, hit)
    finish(name, arm, fname)


def build_golem():
    reset()
    golem("golem_stone", "mob_golem_stone_v01", 1.8,
          dict(main=mat("rock_grey", "#8C8A84", rough=.95), dark=mat("rock_dark", "#6B6964", rough=.95),
               moss=mat("rock_moss", "#6E8A58", rough=.95), glow=mat("eye_glow", "#FFD23A", emit=4.0)))


def build_golem_ancient():
    reset()
    golem("golem_ancient", "boss_golem_ancient_v01", 3.2,
          dict(main=mat("rock_brown", "#7A5C44", rough=.95), dark=mat("rock_brown", "#7A5C44", rough=.95),
               moss=mat("rock_moss", "#6E8A58", rough=.95), glow=mat("rune_glow", "#5AF0E0", emit=4.0),
               vine=mat("vine_green", "#3F8A3A", rough=.8)), ancient=True)


# ------------------------------------------------------------------ shadow bat (hovers)
def build_bat():
    reset()
    purple, wing = mat("bat_purple", "#4A2E6A", rough=.6), mat("bat_wing", "#7A4E9A", rough=.7)
    eye, black = mat("eye_yellow", "#FFD23A", emit=1.2, rough=.3), mat("eye_black", "#1B1B22", rough=.2)
    fang = mat("fang_white", "#FFFFFF", rough=.4)
    Z = 1.2
    arm = make_rig("bat", [("root", (0, 0, 0), None), ("body", (0, 0, Z), "root"),
                           ("wing_L", (.12, 0, Z + .05), "body"), ("wing_R", (-.12, 0, Z + .05), "body")])
    s = len(OBJS)
    ball(.17, (0, .02, Z), purple, uv=(12, 8), scale=(1, .9, 1.1))
    ball(.14, (0, -.05, Z + .19), purple, uv=(12, 8))
    for sd in (-1, 1):
        cyl(.08, .24, (sd * .09, -.02, Z + .38), purple, 8, r2=.005, rot=(0, sd * .35, 0), scale=(1, .5, 1))
        cyl(.05, .16, (sd * .09, -.045, Z + .36), wing, 8, r2=.004, rot=(0, sd * .35, 0), scale=(1, .3, 1))
        ball(.04, (sd * .055, -.17, Z + .22), eye, uv=(8, 5), scale=(1, .5, 1.1))
        ball(.015, (sd * .055, -.19, Z + .22), black, uv=(6, 4), scale=(.6, .5, 1.4))
        cyl(.012, .05, (sd * .025, -.17, Z + .1), fang, 5, r2=0, rot=(math.pi, 0, 0))
        rod((sd * .06, .03, Z - .17), (sd * .07, .03, Z - .27), .015, .008, purple, 5)     # feet claws
    ball(.02, (0, -.185, Z + .16), wing, uv=(6, 4))
    tag("body", s)
    for sd, sn in ((1, "L"), (-1, "R")):
        s = len(OBJS)
        S = Vector((sd * .12, 0, Z + .05))
        E = Vector((sd * .36, .0, Z + .2))
        tips = [Vector((sd * .7, .04, Z + .14)), Vector((sd * .6, .1, Z - .1)), Vector((sd * .4, .1, Z - .24))]
        back = Vector((sd * .14, .06, Z - .15))
        outline = [E, tips[0]]
        for a, b in zip(tips, tips[1:] + [back]):
            outline += [a.lerp(b, .5) + (S - a.lerp(b, .5)) * .22, b]
        for off, flip in ((.006, False), (-.006, True)):
            vs = [S + Vector((0, off, 0))] + [p + Vector((0, off, 0)) for p in outline]
            fs = [[0, i, i + 1] for i in range(1, len(vs) - 1)]
            if (sd > 0) == flip:
                fs = [f[::-1] for f in fs]
            mesh(vs, fs, wing)
        rod(tuple(S), tuple(E), .025, .02, purple, 6)
        for tp in tips:
            rod(tuple(E), tuple(tp), .015, .006, purple, 5)
        tag("wing_" + sn, s)
    flap = lambda sd, a: q((0, 1, 0), -sd * a)

    def flaps(t, n, amp, base=0.0):
        a = base + amp * math.sin(TAU * n * t)
        return {"wing_L": (flap(1, a), None, None), "wing_R": (flap(-1, a), None, None),
                "body": (None, (0, 0, -.05 * math.sin(TAU * n * t + .8)), None)}

    def attack(t):
        dive = bump(t, .15, .85)
        p = flaps(t, 3, .7)
        p["body"] = (q((1, 0, 0), .5 * dive), (0, -.55 * dive, -.35 * dive), None)
        if .3 < t < .7:
            p["wing_L"] = (flap(1, -.6), None, None)
            p["wing_R"] = (flap(-1, -.6), None, None)
        return p

    def hit(t):
        kk = math.exp(-5 * t) * math.sin(math.pi * min(1, t * 3))
        p = flaps(t, 2, .4, -.3)
        p["body"] = (q((0, 1, 0), .6 * kk) @ q((1, 0, 0), -.4 * kk), (0, .3 * kk, .15 * kk), None)
        return p
    clip(arm, "Idle", 24, lambda t: flaps(t, 2, .55, .1))
    clip(arm, "Walk", 16, lambda t: {**flaps(t, 2, .8), "root": (q((1, 0, 0), .25), None, None)})
    clip(arm, "Attack", 24, attack)
    clip(arm, "Hit", 14, hit)
    finish("bat_shadow", arm, "mob_bat_shadow_v01")


# ------------------------------------------------------------------ angry mushroom
def mushroom_cap(r, z0, h, m, dots, seg=20, n_dots=9, seed=1):
    lathe([(0, z0 - .02), (r * .55, z0 - .01), (r, z0 + .04), (r * 1.02, z0 + .1), (r * .88, z0 + h * .45), (r * .55, z0 + h * .85),
           (0, z0 + h)], m, seg=seg)
    rnd = random.Random(seed)
    for k in range(n_dots):
        a = k / n_dots * TAU + rnd.uniform(-.2, .2)
        e = rnd.uniform(.25, .9) if k else 1.4
        rr = r * (.85 * math.cos(e) + .1)
        zz = z0 + .1 + (h - .1) * math.sin(e) * .9
        d = Vector((math.cos(a) * math.cos(e), math.sin(a) * math.cos(e), math.sin(e)))
        ball(r * .14, (rr * math.cos(a), rr * math.sin(a), zz), dots, uv=(8, 4), scale=(1, 1, .35),
             rot=d.to_track_quat('Z', 'Y').to_euler())


def build_shroom():
    reset()
    cap, dots, stem = mat("cap_red", "#D8352E", rough=.5), mat("cap_dots", "#FFF8EC", rough=.6), mat("stem_cream", "#F2E2C2", rough=.7)
    white, black = mat("eye_white", "#FFFFFF", rough=.3), mat("eye_black", "#1B1B22", rough=.2)
    arm = make_rig("shroom", [("root", (0, 0, 0), None), ("body", (0, 0, .1), "root"), ("cap", (0, 0, .6), "body"),
                              ("arm_L", (.24, 0, .42), "body"), ("arm_R", (-.24, 0, .42), "body"),
                              ("leg_L", (.1, 0, .12), "root"), ("leg_R", (-.1, 0, .12), "root")])
    s = len(OBJS)
    lathe([(0, .08), (.22, .09), (.26, .25), (.25, .45), (.21, .6), (0, .62)], stem, seg=16)
    eyes(.085, -.215, .4, .055, white, black, brow=True, brow_m=black, angry=-.5)
    for a in (-.5, 0, .5):   # frown
        ball(.016, (.05 * math.sin(a), -.25, .28 + .02 * math.cos(a)), black, uv=(6, 4), scale=(1.4, .6, .8))
    tag("body", s)
    s = len(OBJS)
    mushroom_cap(.58, .56, .64, cap, dots, seed=3)
    lathe([(.52, .58), (.25, .54), (.2, .58)], stem, seg=20)                       # gills under the cap
    tag("cap", s)
    for sd, sn in ((1, "L"), (-1, "R")):
        s = len(OBJS)
        rod((sd * .24, 0, .42), (sd * .36, -.04, .28), .045, .04, stem, 8)
        ball(.055, (sd * .37, -.05, .26), stem, uv=(8, 5))
        tag("arm_" + sn, s)
        s = len(OBJS)
        ball(.09, (sd * .1, -.04, .06), stem, uv=(10, 6), scale=(1, 1.3, .7))
        tag("leg_" + sn, s)

    def idle(t):
        s_ = math.sin(TAU * t)
        return {"body": (None, None, (1 + .02 * s_, 1 + .02 * s_, 1 - .03 * s_)), "cap": (q((0, 1, 0), .06 * s_), None, None)}

    def walk(t):
        s_ = math.sin(TAU * t)
        return {"root": (q((0, 1, 0), .12 * s_), (0, 0, .04 * abs(math.cos(TAU * t))), None),
                "leg_L": (q((1, 0, 0), .5 * s_), None, None), "leg_R": (q((1, 0, 0), -.5 * s_), None, None),
                "arm_L": (q((1, 0, 0), -.5 * s_), None, None), "arm_R": (q((1, 0, 0), .5 * s_), None, None),
                "cap": (q((0, 1, 0), -.08 * s_), None, None)}

    def attack(t):
        back = bump(t, 0, .4)
        butt = bump(t, .35, .8)
        return {"body": (q((1, 0, 0), -.3 * back + .75 * butt), None, None),
                "root": (None, (0, .1 * back - .45 * butt, 0), None),
                "arm_L": (q((1, 0, 0), .6 * butt), None, None), "arm_R": (q((1, 0, 0), .6 * butt), None, None)}

    def hit(t):
        kk = math.exp(-5 * t) * math.sin(math.pi * min(1, t * 3))
        return {"body": (q((1, 0, 0), -.35 * kk), None, (1 + .1 * kk, 1 + .1 * kk, 1 - .12 * kk)), "root": (None, (0, .15 * kk, 0), None),
                "cap": (q((0, 1, 0), .3 * kk), None, None)}
    clip(arm, "Idle", 40, idle)
    clip(arm, "Walk", 24, walk)
    clip(arm, "Attack", 26, attack)
    clip(arm, "Hit", 14, hit)
    finish("shroom_angry", arm, "mob_shroom_angry_v01", smooth=True)


# ------------------------------------------------------------------ mushroom queen
def build_queen():
    reset()
    cap, dots, stem = mat("cap_pink", "#F08AB0", rough=.5), mat("cap_dots", "#FFF8EC", rough=.6), mat("stem_cream", "#F2E2C2", rough=.7)
    white, black = mat("eye_white", "#FFFFFF", rough=.3), mat("eye_black", "#1B1B22", rough=.2)
    gold, gem = mat("gold", "#E2B04A", rough=.25, metal=.85), mat("gem_pink", "#FF5A9A", rough=.1, emit=.6)
    lip = mat("lip_rose", "#C2416B", rough=.4)
    arm = make_rig("queen", [("root", (0, 0, 0), None), ("body", (0, 0, .1), "root"), ("torso", (0, 0, 1.4), "body"),
                             ("head", (0, 0, 1.95), "torso"), ("arm_L", (.3, 0, 1.82), "torso"), ("arm_R", (-.3, 0, 1.82), "torso"),
                             ("spores", (0, 0, 1.2), "root")])
    s = len(OBJS)   # layered gill skirt: three frilled tiers, pink over cream
    for i, (z0, z1, r0, r1, m) in enumerate(((0, .75, 1.05, .72, cap), (.55, 1.12, .86, .55, stem), (.95, 1.48, .66, .38, cap))):
        o = lathe([(r0 * .96, z0), (r0, z0 + .04), (r1, z1), (0, z1)], m, seg=28)
        for v in o.data.vertices:
            a = math.atan2(v.co.y, v.co.x)
            f = 1 + .07 * math.cos(14 * a + i)
            v.co.x *= f
            v.co.y *= f
        for k in range(10 if i != 1 else 0):
            a = k / 10 * TAU + i * .3
            rr = (r0 + r1) / 2 * .98
            ball(.06, (rr * math.cos(a), rr * math.sin(a), (z0 + z1) / 2), dots, uv=(6, 4), scale=(1, 1, .5),
                 rot=(0, math.atan2(r0 - r1, z1 - z0), a))
    tag("body", s)
    s = len(OBJS)
    lathe([(0, 1.4), (.3, 1.42), (.33, 1.6), (.27, 1.8), (.2, 1.9), (0, 1.92)], stem, seg=18)
    torus(.3, .03, (0, 0, 1.47), gold, 18, 4)
    ball(.06, (0, -.32, 1.6), gem, uv=(8, 5), scale=(1, .5, 1.2))
    tag("torso", s)
    s = len(OBJS)
    ball(.3, (0, 0, 2.1), stem, uv=(16, 10), scale=(1, .95, 1.05))
    eyes(.11, -.26, 2.12, .065, white, black, lid=stem)
    for sd in (-1, 1):
        for j in range(3):   # lashes
            box((.012, .01, .04), (sd * (.08 + j * .03), -.28, 2.2 + .01 * j), black, rot=(0, sd * (.4 + j * .3), 0))
    ball(.035, (0, -.29, 1.99), lip, uv=(8, 5), scale=(1.4, .5, .6))
    mushroom_cap(.95, 2.24, .62, cap, dots, seg=24, n_dots=11, seed=7)
    lathe([(.88, 2.26), (.35, 2.22), (.3, 2.26)], stem, seg=24)
    zc = 2.84
    lathe([(.15, 0), (.16, .07), (.15, .08), (.14, .01)], gold, seg=14, loc=(0, 0, zc))
    for k in range(5):
        a = k / 5 * TAU
        cyl(.03, .12, (.15 * math.cos(a), .15 * math.sin(a), zc + .13), gold, 4, r2=0)
    ball(.035, (0, -.155, zc + .04), gem, uv=(6, 4))
    tag("head", s)
    for sd, sn in ((1, "L"), (-1, "R")):
        s = len(OBJS)
        rod((sd * .3, 0, 1.82), (sd * .42, -.06, 1.5), .06, .05, stem, 8)
        rod((sd * .42, -.06, 1.5), (sd * .45, -.2, 1.3), .05, .04, stem, 8)
        ball(.06, (sd * .46, -.22, 1.27), stem, uv=(8, 5))
        tag("arm_" + sn, s)
    s = len(OBJS)   # spore puffs: scaled to nothing except during the attack
    rnd = random.Random(4)
    for k in range(14):
        a = k / 14 * TAU
        r = rnd.uniform(1.0, 1.6)
        ball(rnd.uniform(.05, .09), (r * math.cos(a), r * math.sin(a), 1.2 + rnd.uniform(-.6, .9)), dots if k % 2 else cap, sub=2)
    tag("spores", s)
    TINY = (.001, .001, .001)
    side = lambda sd, a: q((0, 1, 0), -sd * a)

    def idle(t):
        s_ = math.sin(TAU * t)
        return {"body": (None, None, (1 + .02 * s_, 1 + .02 * s_, 1 - .015 * s_)), "head": (q((0, 1, 0), .06 * s_), None, None),
                "arm_L": (side(1, .12 + .05 * s_), None, None), "arm_R": (side(-1, .12 + .05 * s_), None, None),
                "spores": (None, None, TINY)}

    def walk(t):   # she glides: the skirt sways, no legs
        s_ = math.sin(TAU * t)
        return {"root": (q((0, 1, 0), .05 * s_), (0, 0, .04 * abs(s_)), None), "body": (q((0, 0, 1), .1 * s_), None, None),
                "torso": (q((0, 0, 1), -.08 * s_), None, None), "arm_L": (q((1, 0, 0), -.25 * s_), None, None),
                "arm_R": (q((1, 0, 0), .25 * s_), None, None), "spores": (None, None, TINY)}

    def attack(t):
        spin = ease((t - .15) / .65)
        out = bump(t, .05, .95)
        puff = bump(t, .35, 1.0)
        return {"root": (q((0, 0, 1), TAU * spin), None, None),
                "arm_L": (side(1, 1.3 * out), None, None), "arm_R": (side(-1, 1.3 * out), None, None),
                "body": (None, None, (1 + .12 * out, 1 + .12 * out, 1 - .06 * out)),
                "spores": (q((0, 0, 1), -2 * TAU * t), None, (max(.001, puff),) * 3)}

    def hit(t):
        kk = math.exp(-5 * t) * math.sin(math.pi * min(1, t * 3))
        return {"torso": (q((1, 0, 0), -.25 * kk), None, None), "head": (q((0, 1, 0), .2 * kk), None, None),
                "root": (None, (0, .15 * kk, 0), None), "spores": (None, None, TINY)}
    clip(arm, "Idle", 48, idle)
    clip(arm, "Walk", 32, walk)
    clip(arm, "Attack", 36, attack)
    clip(arm, "Hit", 14, hit)
    finish("mushroom_queen", arm, "boss_mushroom_queen_v01", smooth=True)


BUILDERS = {"mob_slime_green": build_slime_green, "mob_slime_red": build_slime_red, "mob_golem_stone": build_golem,
            "boss_slime_king": build_slime_king, "boss_golem_ancient": build_golem_ancient, "mob_bat_shadow": build_bat,
            "mob_shroom_angry": build_shroom, "boss_mushroom_queen": build_queen}
for n, f in BUILDERS.items():
    if ONLY and n not in ONLY:
        continue
    f()
