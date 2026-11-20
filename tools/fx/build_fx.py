"""Batch 21: spell effects. Run: OUT=<folder> blender -b -P tools/fx/build_fx.py (optional ONLY=fx_fireball,...)
glTF: origin at the effect centre, +Y up, flight direction +Z (= Blender -Y). Materials: fx_core (brightest), fx_glow (element
colour), fx_soft (see-through, alpha 0.5), tint_main (grey 0.8, the game colours it). Strong emission (2-4) for the bloom.
<= 1,200 triangles each. Clips "Spin" (fireball 0.6 s, tornado 0.8 s) are object rotations, sampled every frame.
"""
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "harbor"))
from hlib import *  # noqa
import bpy, bmesh
from mathutils import Vector, Matrix

ONLY = [s for s in os.environ.get("ONLY", "").split(",") if s]
TAU = 2 * math.pi


def fxm(glow_hex, core_hex="#FFF6D8"):
    return (mat("fx_core", core_hex, emit=4.0, rough=.3), mat("fx_glow", glow_hex, emit=3.0, rough=.3),
            mat("fx_soft", glow_hex, emit=2.0, rough=.3, alpha=.5))


def tint():
    return mat("tint_main", "#CCCCCC", emit=2.0, rough=.3)


def spin_clip(o, axis, seconds, fps=25):
    bpy.context.scene.render.fps = fps
    o.rotation_mode = 'XYZ'
    n = int(round(seconds * fps))
    ad = o.animation_data_create()
    act = bpy.data.actions.new("Spin")
    ad.action = act
    for f in range(n + 1):
        e = [0.0, 0.0, 0.0]
        e["XYZ".index(axis)] = TAU * f / n
        o.rotation_euler = e
        o.keyframe_insert("rotation_euler", frame=f + 1)
    act.use_fake_user = True
    tr = ad.nla_tracks.new()
    tr.name = "Spin"
    tr.strips.new("Spin", 1, act)
    ad.action = None
    o.rotation_euler = (0, 0, 0)


def strip(pts, widths, m, up=Vector((0, 0, 1)), two_sided=True):
    """flat ribbon through pts (width varies), lying perpendicular to `up`"""
    verts, faces = [], []
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        side = t.cross(up).normalized() * widths[i] / 2
        verts += [p - side, p + side]
    n = len(pts)
    for i in range(n - 1):
        a = 2 * i
        faces.append([a, a + 2, a + 3, a + 1])
    if two_sided:
        off = up.normalized() * .004
        base = len(verts)
        verts += [v - off for v in verts[:]]
        for i in range(n - 1):
            a = base + 2 * i
            faces.append([a, a + 1, a + 3, a + 2])
    return mesh(verts, faces, m)


def done(name, origin='center', anim=False):
    o = group(name, origin=None)
    bpy.context.view_layer.update()
    return o


def fireball():
    reset()
    core, glow, soft = fxm("#FF7A2A", "#FFF2B0")
    ball(.17, (0, 0, 0), core, sub=3)
    ball(.25, (0, 0, 0), glow, sub=3, jit=.015, seed=1)
    ball(.3, (0, 0, 0), soft, sub=2)
    for k in range(6):   # flame tongues streaming back (+Y Blender = glTF -Z)
        a = k * TAU / 6
        p = Vector((.16 * math.cos(a), .12, .16 * math.sin(a)))
        cyl(.1, .55, tuple(p + Vector((0, .25, 0))), glow if k % 2 else soft, 6, r2=0, rot=(-math.pi / 2, 0, 0), scale=(1, 1, 1))
        bpy.context.view_layer.update()
        OBJS[-1].rotation_euler = (-math.pi / 2 + .25 * math.sin(a), 0, .25 * math.cos(a))
    o = done("fireball")
    spin_clip(o, "Y", .6)
    export("fx_fireball_v01", anim=True)


def ice_spear():
    reset()
    core, glow, soft = fxm("#7FD0FF", "#E8FAFF")
    lathe([(0, -.7), (.09, -.45), (.1, .45), (.05, .7), (0, .72)], soft, seg=6)
    o = OBJS[-1]
    o.rotation_euler = (math.pi / 2, 0, 0)            # lathe axis Z -> Blender -Y is the tip (glTF +Z)
    lathe([(0, -.68), (.045, -.4), (.05, .4), (0, .6)], core, seg=6)
    OBJS[-1].rotation_euler = (math.pi / 2, 0, 0)
    for k in range(3):   # spikes on the rear collar
        a = k * TAU / 3
        cyl(.04, .2, (.1 * math.cos(a), .45, .1 * math.sin(a)), glow, 4, r2=0, rot=(-math.pi / 2 + .5 * math.sin(a), .5 * math.cos(a), 0))
    rnd = random.Random(3)
    for k in range(7):   # small shards around
        a, r = rnd.uniform(0, TAU), rnd.uniform(.2, .32)
        cyl(.025, .1, (r * math.cos(a), rnd.uniform(-.4, .6), r * math.sin(a)), glow, 4, r2=0, rot=(rnd.uniform(0, 3), rnd.uniform(0, 3), 0))
    done("ice_spear")
    export("fx_ice_spear_v01")


def wind_blade():
    reset()
    core, glow, soft = fxm("#6FE08A", "#F2FFF4")
    n = 16
    pts = [Vector((.8 * math.sin(t), .35 * (1 - math.cos(t)) - .35, 0)) for t in [(-1 + 2 * i / (n - 1)) * 1.3 for i in range(n)]]
    w = [.02 + .26 * math.sin(math.pi * i / (n - 1)) for i in range(n)]
    strip(pts, w, glow)
    strip([p + Vector((0, -.04, .004)) for p in pts], [x * .45 for x in w], core)
    for k in range(3):   # thin trailing gusts
        sc = 1 - .18 * (k + 1)
        pp = [Vector((p.x * sc, p.y + .22 * (k + 1), (k - 1) * .05)) for p in pts]
        strip(pp, [x * .2 for x in w], soft)
    done("wind_blade")
    export("fx_wind_blade_v01")


def meteor():
    reset()
    core, glow, soft = fxm("#FF8A2A", "#FFE08A")
    rock_m = mat("rock_hot", "#3A2620", rough=.9)
    rnd = random.Random(4)
    o = ball(.45, (0, 0, 0), rock_m, sub=2)
    for v in o.data.vertices:
        v.co *= 1 + rnd.uniform(-.18, .18)
    for k in range(8):   # glowing cracks over the surface
        a, e = rnd.uniform(0, TAU), rnd.uniform(-1, 1)
        d = Vector((math.cos(a) * math.cos(e), math.sin(a) * math.cos(e), math.sin(e)))
        side = d.cross(Vector((0, 0, 1))).normalized()
        beam(tuple(d * .47 - side * .12), tuple(d * .47 + side * .12), .03, glow, .015)
    ball(.52, (0, 0, .06), soft, sub=2, scale=(1, 1, 1.1))
    for k in range(5):   # long fire tail streaming up (+Z Blender = glTF +Y): it falls down
        a = k * TAU / 5
        cyl(.32 - .04 * k, 2.5 - .25 * k, (.12 * math.cos(a), .12 * math.sin(a), 1.25 - .12 * k), glow if k % 2 else soft, 6, r2=.0)
    cyl(.15, 1.4, (0, 0, .75), core, 6, r2=0)
    done("meteor")
    export("fx_meteor_v01")


def tornado():
    reset()
    core, glow, soft = fxm("#9FE8B0", "#FFFFFF")
    H, rt, rb = 4.5, 1.7, .3
    for layer, (m, ph, w) in enumerate(((soft, 0, .32), (glow, 2.1, .22), (soft, 4.2, .18))):
        n = 40
        pts = []
        for i in range(n):
            t = i / (n - 1)
            r = (rb + (rt - rb) * t ** 1.3) * (1 - .12 * layer)
            a = ph + t * TAU * 3.2
            pts.append(Vector((r * math.cos(a), r * math.sin(a), H * t)))
        strip(pts, [w * (.6 + t) for t in [i / (n - 1) for i in range(n)]], m, up=Vector((0, 0, 1)) * 0 + Vector((.0, .0, 1)))
    rnd = random.Random(8)
    leaf, stone = mat("debris_leaf", "#6FB04A", rough=.7), mat("debris_stone", "#8C8A84", rough=.9)
    for k in range(10):
        t = rnd.uniform(.1, .95)
        r = rb + (rt - rb) * t ** 1.3 + .25
        a = rnd.uniform(0, TAU)
        p = (r * math.cos(a), r * math.sin(a), H * t)
        if k % 2:
            ball(.08, p, leaf, sub=1, scale=(1, .4, .15), rot=(rnd.uniform(0, 3), 0, a))
        else:
            ball(.07, p, stone, sub=1, jit=.01, seed=k)
    o = done("tornado")
    spin_clip(o, "Z", .8)
    export("fx_tornado_v01", anim=True)


def snowflake(c, r, m):
    """flat 6-armed flake, two-sided, 36 triangles"""
    verts = [Vector(c)]
    for k in range(12):
        a = k * math.pi / 6
        rr = r if k % 2 == 0 else r * .32
        verts.append(Vector(c) + Vector((rr * math.cos(a), rr * math.sin(a), 0)))
    n = len(verts)
    verts += [v - Vector((0, 0, .004)) for v in verts]
    faces = [[0, 1 + k, 1 + (k + 1) % 12] for k in range(12)] + [[n, n + 1 + (k + 1) % 12, n + 1 + k] for k in range(12)]
    mesh(verts, faces, m)


def snowflake_old(c, r, m):
    for k in range(6):
        a = k * math.pi / 3
        d = Vector((math.cos(a), math.sin(a), 0))
        beam(tuple(c), tuple(c + d * r), r * .16, m, r * .05)
        for s in (-1, 1):
            e = Vector((math.cos(a + s * .7), math.sin(a + s * .7), 0))
            beam(tuple(c + d * r * .55), tuple(c + d * r * .55 + e * r * .35), r * .1, m, r * .04)


def blizzard_ring():
    reset()
    core, glow, soft = fxm("#7FD0FF", "#F2FCFF")
    lathe([(0, .02), (6.0, .02), (6.0, 0), (0, 0)], soft, seg=36)
    rnd = random.Random(9)
    for k in range(24):   # crystal ridge round the rim
        a = k * TAU / 24 + rnd.uniform(-.05, .05)
        h = rnd.uniform(.3, .7)
        cyl(.14, h, (6.0 * math.cos(a), 6.0 * math.sin(a), h / 2), glow, 4, r2=0, rot=(rnd.uniform(-.3, .3), rnd.uniform(-.3, .3), 0))
    torus(6.0, .05, (0, 0, .03), core, 36, 3)
    group("blizzard_ring", origin=None)
    for k in range(12):
        a, r = k * TAU / 12, rnd.uniform(1.5, 5.2)
        snowflake(Vector((0, 0, 0)), .22, core)
        o = group("snowflake_%d" % (k + 1), origin=None)
        o.location = (r * math.cos(a), r * math.sin(a), rnd.uniform(1.5, 4.0))
        o.rotation_euler = (rnd.uniform(-.6, .6), rnd.uniform(-.6, .6), rnd.uniform(0, 3))
    export("fx_blizzard_ring_v01")


def thunder_strike():
    reset()
    core, glow, soft = fxm("#FFD23C", "#FFFFFF")
    rnd = random.Random(10)
    pts = [Vector((0, 0, 12.0))]
    for i in range(1, 11):
        pts.append(Vector((rnd.uniform(-.5, .5), rnd.uniform(-.5, .5), 12.0 - 1.2 * i)))
    pts[-1] = Vector((0, 0, 0))
    for a, b in zip(pts, pts[1:]):
        beam(tuple(a), tuple(b), .14, core)
        beam(tuple(a), tuple(b), .34, soft)
    for start in (3, 6):   # two side branches
        p = pts[start]
        q_ = p
        for j in range(3):
            n_ = q_ + Vector((rnd.uniform(.4, .8) * (1 if start == 3 else -1), rnd.uniform(-.3, .3), -1.0))
            beam(tuple(q_), tuple(n_), .07, glow)
            q_ = n_
    for k in range(10):   # ground crack ring, radius 1.5
        a = k * TAU / 10
        p0 = Vector((.3 * math.cos(a), .3 * math.sin(a), .02))
        p1 = Vector((1.5 * math.cos(a + .2), 1.5 * math.sin(a + .2), .02))
        beam(tuple(p0), tuple((p0 + p1) / 2 + Vector((.1, .1, 0))), .06, glow, .02)
        beam(tuple((p0 + p1) / 2 + Vector((.1, .1, 0))), tuple(p1), .05, glow, .02)
    torus(1.5, .04, (0, 0, .02), glow, 24, 3)
    ball(.6, (0, 0, .1), soft, sub=2, scale=(1, 1, .3))
    group("thunder_strike", origin=None)
    export("fx_thunder_strike_v01")


def slash_arc():
    reset()
    m = tint()
    n = 24
    pts = [Vector((2.2 * math.sin(a), -2.2 * math.cos(a), 0)) for a in [math.radians(-80 + 160 * i / (n - 1)) for i in range(n)]]
    strip(pts, [.04 + .42 * math.sin(math.pi * i / (n - 1)) ** 1.2 for i in range(n)], m)
    strip([p * .93 for p in pts], [.02 + .16 * math.sin(math.pi * i / (n - 1)) for i in range(n)], m)
    group("slash_arc", origin=None)
    export("fx_slash_arc_v01")


def whirlwind_ring():
    reset()
    m = tint()
    for k in range(3):
        n = 18
        a0 = k * TAU / 3
        pts = [Vector((3.2 * math.cos(a), 3.2 * math.sin(a), .4 + .5 * k + .3 * math.sin(a * 2))) for a in [a0 + 1.6 * i / (n - 1) for i in range(n)]]
        strip(pts, [.03 + .3 * math.sin(math.pi * i / (n - 1)) for i in range(n)], m, up=Vector((0, 0, 1)))
    group("whirlwind_ring", origin=None)
    export("fx_whirlwind_ring_v01")


def hit_spark():
    reset()
    m = tint()
    rnd = random.Random(11)
    for k in range(8):
        a, e = k * TAU / 8 + rnd.uniform(-.2, .2), rnd.uniform(-.5, .5)
        d = Vector((math.cos(a) * math.cos(e), -abs(math.sin(e)) * .3, math.sin(a) * math.cos(e)))
        cyl(.035, .3 if k % 2 else .22, tuple(d * .15), m, 4, r2=0, rot=d.to_track_quat('Z', 'Y').to_euler())
    ball(.06, (0, 0, 0), m, sub=2)
    group("hit_spark", origin=None)
    export("fx_hit_spark_v01")


BUILDERS = {"fx_fireball": fireball, "fx_ice_spear": ice_spear, "fx_wind_blade": wind_blade, "fx_meteor": meteor, "fx_tornado": tornado,
            "fx_blizzard_ring": blizzard_ring, "fx_thunder_strike": thunder_strike, "fx_slash_arc": slash_arc,
            "fx_whirlwind_ring": whirlwind_ring, "fx_hit_spark": hit_spark}
for n, f in BUILDERS.items():
    if not ONLY or n in ONLY:
        f()
