"""Batch 25: shared-play and seasonal event models (prefix ev_). Run: OUT=<folder> blender -b -P tools/events/build_events.py
(optional ONLY=ev_arena,...). Flat colours, named materials, feet at 0, front Blender -Y (glTF +Z).
Recolourable parts: tint_main / tint_trim (grey 0.8, the game multiplies a colour: red for Tết, orange for Halloween...).
Glowing parts: light_glow, light_flame, light_star, pad_glow, slot_glow, portal_swirl (emissive).
Multi-object files keep each object's origin where the game needs it (slot_1..8 at the plate centre, mannequin_L/R at the
feet, panel_L/R at the panel centre, pad_1/2). Object clips (Dig, Idle of the portal) are NLA tracks exported by name.
Rigged models (Letter Colossus, lion dance, ghost, snowman) use the rigid rig helpers of tools/harbor/b5_mobs.py.
The Ngọc v05 event outfits are in tools/chibi05/build_ngoc_v03.py (EVENT list).
"""
import os, sys, math, random
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "harbor"))
sys.path.insert(0, os.path.join(HERE, "..", "mobs3"))
ONLY = [s for s in os.environ.get("ONLY", "").split(",") if s]
os.environ["ONLY"] = "__none__"          # importing build_mobs3 must not build its monsters
from hlib import *  # noqa
from hlib import _fin
from b5_mobs import make_rig, clip, q, bind, FPS  # noqa
import build_mobs3 as M3
import bpy, bmesh
from mathutils import Vector, Matrix

TAU = 2 * math.pi


def bump(t, a, b):
    return 0.0 if t <= a or t >= b else math.sin(math.pi * (t - a) / (b - a))


def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def tint():
    return mat("tint_main", "#CCCCCC", rough=.7), mat("tint_trim", "#CCCCCC", rough=.6)


def pivot(o, p):
    """keep the mesh where it is but put the object's origin at p"""
    o.data.transform(Matrix.Translation(-Vector(p)))
    o.location = p


def star(c, R, r, depth, m, n=5, axis='y'):
    """flat n-point star prism centred at c, faces along -Y (axis 'y') or up (axis 'z')"""
    verts, faces = [], []
    for side, d in ((0, -depth / 2), (1, depth / 2)):
        verts.append((0, d * 1.6, 0))
        for k in range(2 * n):
            a = math.pi / 2 + k * math.pi / n
            rr = R if k % 2 == 0 else r
            verts.append((rr * math.cos(a), d, rr * math.sin(a)))
    m_ = 2 * n
    for k in range(m_):
        a, b = 1 + k, 1 + (k + 1) % m_
        faces += [(0, b, a), (m_ + 1, m_ + 1 + a, m_ + 1 + b), (a, b, m_ + 1 + b, m_ + 1 + a)]
    if axis == 'z':
        verts = [(x, -z, y) for x, y, z in verts]
    verts = [(x + c[0], y + c[1], z + c[2]) for x, y, z in verts]
    return mesh(verts, faces, m)


def letter(ch, loc, size, depth, m, rz=0.0):
    """raised letter (Blender's built-in font) standing up, facing -Y (turned by rz around Z)"""
    cu = bpy.data.curves.new("txt", 'FONT')
    cu.body, cu.size, cu.extrude = ch, size, depth
    cu.align_x, cu.align_y = 'CENTER', 'CENTER'
    cu.resolution_u = 2
    t = bpy.data.objects.new("txt", cu)
    bpy.context.collection.objects.link(t)
    t.rotation_euler = (math.pi / 2, 0, rz)
    t.location = loc
    bpy.context.view_layer.update()
    me = bpy.data.meshes.new_from_object(t.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    o = bpy.data.objects.new("letter", me)
    bpy.context.collection.objects.link(o)
    o.matrix_world = t.matrix_world
    bpy.data.objects.remove(t)
    me.materials.clear()
    return _fin(o, m)


def obj_clip(o, name, frames, fn):
    """object animation baked into an NLA track called name; fn(t) -> (loc offset, euler offset, scale)"""
    bpy.context.scene.render.fps = 24
    o.rotation_mode = 'XYZ'
    ad = o.animation_data_create()
    act = bpy.data.actions.new(o.name + "_" + name)
    ad.action = act
    bl, br = o.location.copy(), o.rotation_euler.copy()
    for f in range(frames + 1):
        loc, rot, sc = fn(f / frames)
        o.location = bl + Vector(loc)
        o.rotation_euler = (br.x + rot[0], br.y + rot[1], br.z + rot[2])
        o.scale = sc
        for p in ("location", "rotation_euler", "scale"):
            o.keyframe_insert(p, frame=f + 1)
    act.use_fake_user = True
    tr = ad.nla_tracks.new()
    tr.name = name
    tr.strips.new(name, 1, act)
    ad.action = None
    o.location, o.rotation_euler, o.scale = bl, br, (1, 1, 1)


def export_nla(fname):
    bpy.ops.object.select_all(action='DESELECT')
    for o in GROUPS:
        o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, fname + ".glb"), export_format='GLB', export_yup=True, use_selection=True,
                              export_apply=True, export_image_format='NONE', export_animations=True,
                              export_animation_mode='NLA_TRACKS', export_force_sampling=True)
    tot = 0
    for o in GROUPS:
        tot += tris(o)
        print("BUILT", fname, o.name, "tris", tris(o), "size", *[round(x, 2) for x in o.dimensions])
    print("FILE", fname, "tris", tot)


def rig_finish(name, arm, fname):
    o = group(name, origin=None)
    bind(o, arm)
    bpy.context.scene.render.fps = FPS
    export(fname, objs=[o], anim=True)


# ================================================================== shared play
def arena():
    reset()
    tm, tt = tint()
    stone, stone2 = mat("arena_stone", "#B9B2A4", rough=.9), mat("arena_stone_dark", "#8E877A", rough=.9)
    gold, wood = mat("gold", "#E2B04A", rough=.3, metal=.8), mat("wood", "#8B5E34", rough=.85)
    pad = mat("pad_glow", "#FFFFFF", emit=1.5)
    cyl(6.0, .3, (0, 0, .15), stone2, 32)
    cyl(5.6, .04, (0, 0, .32), stone, 32)
    torus(4.2, .1, (0, 0, .33), tm, 32, 4)
    torus(2.0, .1, (0, 0, .33), tt, 24, 4)
    star((0, 0, .34), 1.0, .42, .04, gold, axis='z')
    for k in range(16):    # low wall with four gaps (N, E, S, W)
        a = (k + .5) * TAU / 16
        if k % 4 in (0, 3):
            continue
        box((2.0, .5, .7), (5.75 * math.cos(a), 5.75 * math.sin(a), .65), stone2, rot=(0, 0, a + math.pi / 2), bev=.05)
    for k in range(4):     # banner poles at the gaps
        a = k * TAU / 4
        for sd in (-1, 1):
            b = a + sd * .2
            p = (5.9 * math.cos(b), 5.9 * math.sin(b))
            cyl(.07, 3.2, (p[0], p[1], 1.9), wood, 8)
            ball(.1, (p[0], p[1], 3.55), gold, sub=1)
            box((.04, .6, 1.0), (p[0] * 1.0, p[1] * 1.0, 2.9), tm if sd < 0 else tt,
                rot=(0, 0, b))
    group("arena", origin=None)
    for i, y in ((1, -3.6), (2, 3.6)):
        cyl(.8, .06, (0, y, .35), pad, 24)
        torus(.8, .05, (0, y, .37), gold, 24, 4)
        o = group(f"pad_{i}", origin=None)
        pivot(o, (0, y, .32))
    export("ev_arena_v01")


def kitchen_double():
    reset()
    tm, tt = tint()
    wood, wood2 = mat("wood", "#B07A48", rough=.8), mat("wood_dark", "#6E4A2C", rough=.85)
    top, steel = mat("counter_top", "#EDE6D8", rough=.5), mat("steel", "#B8BEC4", rough=.3, metal=.8)
    black, flame = mat("stove_black", "#2B2B30", rough=.6), mat("light_flame", "#FF8A2A", emit=2.5)
    slot = mat("slot_glow", "#FFE08A", emit=1.2)
    for sd in (-1, 1):     # two counters facing each other across a 1.4 m aisle
        y = sd * 1.1
        box((3.2, .8, .9), (0, y, .45), wood, bev=.03)
        box((3.3, .9, .06), (0, y, .93), top, bev=.01)
        box((3.2, .82, .1), (0, y, .05), wood2)
        for k in range(4):   # drawer fronts with knobs (aisle side)
            x = -1.2 + k * .8
            box((.7, .03, .3), (x, y - sd * .41, .62), tt, bev=.01)
            ball(.03, (x, y - sd * .43, .62), steel, sub=1)
        box((.8, .7, .04), (-1.0 * sd, y, .97), black)     # stove top with 2 burners
        for bx in (-.18, .18):
            torus(.12, .025, (-1.0 * sd + bx, y, 1.0), steel, 16, 4)
            cyl(.08, .01, (-1.0 * sd + bx, y, 1.0), flame, 12)
        box((.5, .35, .02), (1.1 * sd, y + sd * .1, .97), wood2, bev=.005)   # cutting board
        cyl(.15, .14, (-1.0 * sd - .18, y, 1.09), steel, 14)                 # pot
        torus(.15, .015, (-1.0 * sd - .18, y, 1.16), steel, 14, 4)
    box((.08, 2.0, .08), (1.65, 0, 2.2), wood2)        # hanging rack with pans over the aisle
    for sx in (-1.65, 1.65):
        cyl(.04, 2.2, (sx, 1.5, 1.1), wood2, 6)
        cyl(.04, 2.2, (sx, -1.5, 1.1), wood2, 6)
    box((3.3, .08, .08), (0, 1.5, 2.2), wood2)
    box((3.3, .08, .08), (0, -1.5, 2.2), wood2)
    box((.08, 3.0, .08), (0, 0, 2.2), wood2)
    for k, x in enumerate((-1.0, -.3, .4, 1.1)):
        cyl(.16 - .02 * (k % 2), .04, (x, 0, 1.85), steel, 12)
        cyl(.012, .3, (x, 0, 2.03), wood2, 4)
    box((3.4, .1, .5), (0, 0, 2.45), tm, bev=.02)      # banner over the aisle (team colour)
    group("kitchen", origin=None)
    i = 0
    for sd in (-1, 1):
        for x in (-.5, 0.0, .45, .9) if sd < 0 else (-.9, -.45, 0.0, .5):
            i += 1
            p = (x, sd * 1.1 - sd * .15, .965)
            cyl(.14, .015, p, slot, 16)
            o = group(f"slot_{i}", origin=None)
            pivot(o, p)
    export("ev_kitchen_double_v01")


def dig_spot():
    reset()
    sand, sand2 = mat("sand", "#E3C28A", rough=.95), mat("sand_dark", "#C9A26A", rough=.95)
    red, wood, metal = mat("mark_red", "#D83A2E", rough=.6), mat("wood", "#8B5E34", rough=.8), mat("iron", "#9AA0A6", rough=.35, metal=.7)
    ball(.6, (0, 0, 0), sand, uv=(16, 8), scale=(1, 1, .32), jit=.02, seed=4)
    o = OBJS[-1]
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -1e-3], context='VERTS')
    bm.to_mesh(o.data)
    bm.free()
    for a in (.785, -.785):
        box((.55, .09, .02), (0, 0, .2), red, rot=(0, 0, a))
    group("mound", origin=None)
    rnd = random.Random(3)   # dirt clods: they fly out during Dig
    clods = []
    for k in range(5):
        a = k * TAU / 5 + .3
        p = (.22 * math.cos(a), .22 * math.sin(a), .1)
        ball(.06 + .02 * rnd.random(), p, sand2, sub=1, jit=.01, seed=k)
        o = group(f"dirt_{k + 1}", origin=None)
        pivot(o, p)
        clods.append((o, a))
    hp = (.35, .1, .0)        # shovel stuck in the sand next to the X, pivot at the blade tip
    rod((hp[0], hp[1], .0), (hp[0] + .15, hp[1] + .1, 1.0), .025, .025, wood, 8)
    box((.2, .04, .05), (hp[0] + .16, hp[1] + .105, 1.02), wood, rot=(0, 0, .55))
    box((.22, .03, .26), (hp[0] + .01, hp[1] + .005, .08), metal, rot=(-.1, .15, .55), bev=.01)
    sh = group("shovel", origin=None)
    pivot(sh, hp)

    def dig(t):   # 1 s: lift, plunge, scoop out
        lift, plunge, scoop = bump(t, 0, .35), bump(t, .3, .6), bump(t, .55, 1.0)
        return ((0, 0, .25 * lift - .12 * plunge + .1 * scoop), (-.3 * lift + .2 * plunge - .5 * scoop, 0, 0), (1, 1, 1))
    obj_clip(sh, "Dig", 24, dig)
    for o, a in clods:
        def fly(t, a=a):
            u = max(0.0, min(1.0, (t - .55) / .45))
            h = 4 * u * (1 - u)
            return ((.35 * u * math.cos(a), .35 * u * math.sin(a), .35 * h), (2 * u, 0, 0), (1, 1, 1) if u < .95 else (.6, .6, .6))
        obj_clip(o, "Dig", 24, fly)
    export_nla("ev_dig_spot_v01")


def treasure_map():
    reset()
    paper, edge = mat("parchment", "#F0DDB0", rough=.9), mat("parchment_edge", "#C9A86A", rough=.9)
    land, sea, red = mat("map_land", "#9CC27A", rough=.9), mat("map_sea", "#8EC6D6", rough=.9), mat("mark_red", "#D83A2E", rough=.6)
    ink = mat("ink", "#4A3220", rough=.8)
    W, D = .6, .42
    verts, faces = [], []
    nx, ny = 8, 6
    for j in range(ny + 1):
        for i in range(nx + 1):
            x, y = -W / 2 + W * i / nx, -D / 2 + D * j / ny
            verts.append((x, y, .03 + .006 * math.sin(i * 1.3 + j * .7)))
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i
            faces.append((a, a + 1, a + nx + 2, a + nx + 1))
    mesh(verts, faces, paper)
    for sx in (-1, 1):     # rolled ends
        cyl(.03, D + .02, (sx * (W / 2 + .02), 0, .03), edge, 10, rot=(math.pi / 2, 0, 0))
    ball(.13, (-.07, .02, .036), sea, uv=(12, 6), scale=(1.4, 1, .03))
    ball(.08, (-.09, .03, .041), land, uv=(10, 5), scale=(1.3, 1, .04), jit=.008, seed=2)
    ball(.05, (.14, -.07, .041), land, uv=(10, 5), scale=(1.2, 1, .04), jit=.006, seed=3)
    for a in (.785, -.785):
        box((.07, .014, .004), (.15, -.07, .045), red, rot=(0, 0, a))
    for k in range(6):     # dotted path to the X
        t = k / 6
        box((.012, .012, .003), (-.09 + .23 * t, .03 - .1 * t + .03 * math.sin(t * 6), .044), ink)
    star((.2, .12, .04), .045, .015, .004, ink, n=4, axis='z')
    group("treasure_map")
    export("ev_treasure_map_v01")


def mannequin_pair():
    reset()
    tm, tt = tint()
    body, wood, gold = mat("mannequin", "#EFE4D2", rough=.6), mat("wood_dark", "#6E4A2C", rough=.8), mat("gold", "#E2B04A", rough=.3, metal=.8)
    cyl(1.7, .25, (0, 0, .125), tm, 32)
    torus(1.7, .05, (0, 0, .25), gold, 32, 4)
    for sd in (-1, 1):
        box((.35, .5, .02), (sd * 1.45, -1.2, .26), tt)
    group("stage", origin=None)
    for nm, x in (("mannequin_L", .65), ("mannequin_R", -.65)):
        cyl(.22, .05, (x, 0, .275), wood, 16)
        cyl(.025, .55, (x, 0, .55), gold, 8)
        lathe([(0, .0), (.12, .0), (.16, .12), (.13, .3), (.17, .5), (.13, .62), (.05, .66), (0, .66)], body, seg=14, loc=(x, 0, .8))
        cyl(.045, .1, (x, 0, 1.5), body, 8)
        ball(.17, (x, 0, 1.66), body, uv=(14, 8), scale=(1, .95, 1.1))
        for s in (-1, 1):
            rod((x + s * .15, 0, 1.3), (x + s * .22, 0, 1.08), .04, .035, body, 8)
        o = group(nm, origin=None)
        pivot(o, (x, 0, .25))
    export("ev_mannequin_pair_v01")


def scoreboard():
    reset()
    tm, tt = tint()
    wood, frame, blank = mat("wood_dark", "#6E4A2C", rough=.8), mat("frame_navy", "#2A3550", rough=.6), mat("board_blank", "#F4EFE4", rough=.9)
    gold, bulb = mat("gold", "#E2B04A", rough=.3, metal=.8), mat("light_glow", "#FFE6A0", emit=2.5)
    for sx in (-1.4, 1.4):
        box((.16, .16, 2.6), (sx, 0, 1.3), wood, bev=.02)
    box((3.4, .25, 1.6), (0, 0, 2.3), frame, bev=.04)
    box((1.65, .08, .3), (-.85, -.12, 2.95), tm, bev=.02)
    box((1.65, .08, .3), (.85, -.12, 2.95), tt, bev=.02)
    cyl(.22, .08, (0, -.14, 2.25), gold, 16, rot=(math.pi / 2, 0, 0))
    letter("VS", (0, -.19, 2.25), .2, .01, frame)
    for k in range(9):
        ball(.06, (-1.6 + k * .4, -.05, 3.18), bulb, sub=1)
    box((3.4, .3, .08), (0, 0, 3.12), frame)
    group("scoreboard", origin=None)
    for nm, x in (("panel_L", -.82), ("panel_R", .82)):
        box((1.35, .04, 1.0), (x, -.13, 2.2), blank)
        o = group(nm, origin=None)
        pivot(o, (x, -.15, 2.2))
    export("ev_scoreboard_v01")


def portal_coop():
    reset()
    tm, tt = tint()
    stone, stone2 = mat("rune_stone", "#7E8794", rough=.85), mat("rune_stone_dark", "#5A6270", rough=.9)
    glow, swirl = mat("rune_glow", "#8AF0FF", emit=2.5), mat("portal_swirl", "#B58CFF", emit=2.0, alpha=.8)
    pad = mat("pad_glow", "#FFFFFF", emit=1.5)
    cyl(2.6, .3, (0, 0, .15), stone2, 24)
    for sx in (-1, 1):     # two pillars holding the ring
        box((.5, .6, 3.6), (sx * 2.1, 0, 2.0), stone, bev=.05)
        box((.7, .8, .3), (sx * 2.1, 0, 3.9), stone2, bev=.03)
        ball(.15, (sx * 2.1, -.31, 3.0), glow, sub=1, scale=(1, .4, 1))
    group("portal_frame", origin=None)
    for i, (x, m) in enumerate(((-.9, tm), (.9, tt))):
        cyl(.55, .05, (x, -1.6, .33), pad, 20)
        torus(.55, .05, (x, -1.6, .35), m, 20, 4)
        o = group(f"pad_{i + 1}", origin=None)
        pivot(o, (x, -1.6, .3))
    C = (0, 0, 2.2)
    torus(1.75, .16, C, stone, 32, 6, rot=(math.pi / 2, 0, 0))
    for k in range(8):
        a = k * TAU / 8
        box((.18, .4, .18), (1.75 * math.cos(a), 0, 2.2 + 1.75 * math.sin(a)), glow, rot=(0, -a, 0))
    ring = group("portal_ring", origin=None)
    pivot(ring, C)
    cyl(1.6, .04, C, swirl, 32, rot=(math.pi / 2, 0, 0))
    for k in range(3):
        torus(.5 + .4 * k, .04, (0, -.03, 2.2), glow, 24, 3, rot=(math.pi / 2, 0, 0))
    sw = group("portal_swirl", origin=None)
    pivot(sw, C)
    obj_clip(ring, "Idle", 72, lambda t: ((0, 0, 0), (0, TAU * t / 4, 0), (1, 1, 1)))
    obj_clip(sw, "Idle", 72, lambda t: ((0, 0, 0), (0, -TAU * t, 0), (1 + .05 * math.sin(TAU * t), 1, 1 + .05 * math.sin(TAU * t))))
    export_nla("ev_portal_coop_v01")


def boss_giant():
    """Letter Colossus: 6 m giant of wooden alphabet blocks; 4 word-shield sockets on the chest."""
    reset()
    main, dark, white, eye, glow = M3.M("#E8D2A8", "#9A7448", "thunder")
    cols = [mat("letter_red", "#D8463A", rough=.5), mat("letter_blue", "#3A7AD8", rough=.5), mat("letter_green", "#3AA858", rough=.5),
            mat("letter_yellow", "#F2B630", rough=.5)]
    slot = mat("shield_slot", "#FFE08A", emit=1.2)
    S = [(.5, -.78, 3.35), (-.5, -.78, 3.35), (.5, -.78, 2.55), (-.5, -.78, 2.55)]
    arm = M3.rig("letter_colossus", [("root", (0, 0, 0), None), ("body", (0, 0, 1.9), "root"), ("head", (0, 0, 4.05), "body"),
                                     ("arm_L", (1.35, 0, 3.6), "body"), ("arm_R", (-1.35, 0, 3.6), "body"),
                                     ("leg_L", (.55, 0, 1.8), "root"), ("leg_R", (-.55, 0, 1.8), "root"), ("fx", (0, -.75, 4.75), "head")] +
                    [(f"shield_slot_{i + 1}", p, "body") for i, p in enumerate(S)])

    def block(c, s, ch, ci, faces=(-1,)):
        box((s, s, s), c, main, bev=.06)
        for f in faces:     # raised letter on the front (and maybe a side)
            if f == -1:
                letter(ch, (c[0], c[1] - s / 2 - .015, c[2]), s * .7, .03, cols[ci])
            else:
                letter(ch, (c[0] + f * (s / 2 + .015), c[1], c[2]), s * .6, .03, cols[ci], rz=f * math.pi / 2)
    s = len(OBJS)
    box((2.2, 1.5, 2.1), (0, 0, 2.95), main, bev=.1)     # torso block
    box((2.4, 1.6, .3), (0, 0, 1.95), dark, bev=.05)     # belt / hips
    box((2.0, .05, 1.7), (0, -.76, 2.95), dark)
    letter("A", (-.75, .78, 3.0), .9, .04, cols[0], rz=math.pi)
    for i, p in enumerate(S):
        torus(.27, .05, p, slot, 16, 4, rot=(math.pi / 2, 0, 0))
    tag("body", s)
    s = len(OBJS)
    block((0, 0, 4.7), 1.3, "Q", 3)
    for sd in (-1, 1):
        ball(.13, (sd * .3, -.67, 4.85), glow, sub=1, scale=(1, .4, 1))
    box((.6, .06, .1), (0, -.68, 4.42), dark)
    for k, ch in enumerate("ABC"):    # crown of three small letter blocks
        block((-.42 + .42 * k, 0, 5.55), .38, ch, k)
    tag("head", s)
    for nm, sd in (("arm_L", 1), ("arm_R", -1)):
        s = len(OBJS)
        for k, ch in enumerate(("XYZ" if sd > 0 else "MNO")):
            block((sd * 1.5, 0, 3.55 - .8 * k), .78 - .06 * k, ch, (k + (sd > 0)) % 4)
        tag(nm, s)
    for nm, sd in (("leg_L", 1), ("leg_R", -1)):
        s = len(OBJS)
        block((sd * .55, 0, 1.35), .9, "E" if sd > 0 else "W", 2 if sd > 0 else 1)
        block((sd * .55, -.05, .45), .9, "S" if sd > 0 else "N", 0 if sd > 0 else 3)
        tag(nm, s)
    s = len(OBJS)
    ball(.02, (0, -.75, 4.75), glow, sub=1)
    tag("fx", s)
    for i in range(4):     # tiny sockets for the word shields (the game parents the shields here)
        s = len(OBJS)
        ball(.01, S[i], slot, sub=0)
        tag(f"shield_slot_{i + 1}", s)

    def roar(t):
        up = bump(t, .05, .95)
        sh = math.sin(TAU * 8 * t) * up
        return {"head": (q((1, 0, 0), -.35 * up) @ q((0, 0, 1), .06 * sh), None, None), "body": (q((1, 0, 0), -.12 * up), (0, .03 * sh, 0), None),
                "arm_L": (q((0, 1, 0), -1.6 * up), None, None), "arm_R": (q((0, 1, 0), 1.6 * up), None, None), "fx": (None, None, (1 + up,) * 3)}
    M3.std_clips(arm, "biped", 6.0, {"clips": {"Roar": (36, roar)}})
    o = group("letter_colossus", origin=None)
    bind(o, arm)
    bpy.context.scene.render.fps = FPS
    export("ev_boss_giant_v01", objs=[o], anim=True)


# ================================================================== Mid-Autumn
def lantern_star():
    reset()
    tm, tt = tint()
    bamboo, gold, core = mat("bamboo", "#C9A45A", rough=.7), mat("gold", "#E2B04A", rough=.3, metal=.8), mat("light_glow", "#FFD27A", emit=2.5)
    rod((0, 0, 0), (0, .1, 1.7), .02, .016, bamboo, 8)          # bamboo pole
    rod((0, .1, 1.7), (0, -.35, 1.85), .016, .012, bamboo, 8)
    star((0, -.35, 1.32), .38, .16, .14, tm)                      # paper star (tint_main: red / yellow)
    star((0, -.35, 1.32), .41, .18, .1, tt)                       # edge frame
    ball(.09, (0, -.43, 1.32), core, sub=1)
    rod((0, -.35, 1.85), (0, -.35, 1.7), .006, .006, gold, 4)
    for k in (-1, 0, 1):   # tassels
        rod((k * .12, -.35, 1.0 + .02 * abs(k)), (k * .14, -.35, .78), .02, .006, tt, 6)
    group("lantern_star")
    export("ev_lantern_star_v01")


def lantern_fish():
    reset()
    tm, tt = tint()
    bamboo, core = mat("bamboo", "#C9A45A", rough=.7), mat("light_glow", "#FFD27A", emit=2.5)
    white, black = mat("eye_white", "#FFFFFF", rough=.3), mat("eye_dark", "#1B1B22", rough=.2)
    rod((0, .5, 0), (0, .4, 1.7), .02, .016, bamboo, 8)
    rod((0, .4, 1.7), (0, 0, 1.9), .016, .012, bamboo, 8)
    rod((0, 0, 1.9), (0, 0, 1.55), .005, .005, tt, 4)
    o = lathe([(0, -.45), (.12, -.4), (.2, -.25), (.22, -.05), (.18, .15), (.08, .32), (.05, .38)], tm, seg=14)   # carp body along Y
    o.rotation_euler = (-math.pi / 2, 0, 0)
    o.location = (0, 0, 1.38)
    o.scale = (.85, 1, 1)
    ball(.12, (0, -.1, 1.38), core, sub=1, scale=(1, 2, 1))
    for sd in (-1, 1):
        ball(.05, (sd * .15, -.33, 1.43), white, uv=(10, 6), scale=(.5, 1, 1))
        ball(.028, (sd * .17, -.35, 1.43), black, uv=(8, 5), scale=(.5, 1, 1))
        mesh([(sd * .16, -.05, 1.3), (sd * .34, .05, 1.18), (sd * .16, .15, 1.3)], [(0, 1, 2) if sd > 0 else (2, 1, 0)], tt)   # side fins
    mesh([(0, .36, 1.38), (0, .62, 1.6), (0, .55, 1.38), (0, .62, 1.14)], [(0, 1, 2, 3)], tt)   # tail
    mesh([(0, .37, 1.38), (0, .63, 1.14), (0, .56, 1.38), (0, .63, 1.6)], [(0, 1, 2, 3)], tt)
    mesh([(0, -.15, 1.56), (0, .05, 1.68), (0, .2, 1.52)], [(0, 1, 2)], tt)                     # dorsal fin
    mesh([(0, -.149, 1.56), (0, .2, 1.52), (0, .051, 1.68)], [(0, 1, 2)], tt)
    for k in range(4):    # scale rings
        torus(.2 - .02 * abs(k - 1), .012, (0, -.15 + .1 * k, 1.38), tt, 14, 3, rot=(math.pi / 2, 0, 0))
    group("lantern_fish")
    export("ev_lantern_fish_v01")


def mooncake_stall():
    reset()
    tm, tt = tint()
    wood, wood2 = mat("wood", "#A86A3A", rough=.8), mat("wood_dark", "#6E4A2C", rough=.85)
    cake, cake2 = mat("mooncake", "#C98A3E", rough=.6), mat("mooncake_top", "#E0A858", rough=.55)
    sign, core = mat("sign_blank", "#F4EFE4", rough=.9), mat("light_glow", "#FFD27A", emit=2.5)
    box((2.6, .9, .95), (0, 0, .475), wood, bev=.03)
    box((2.7, 1.0, .06), (0, 0, .98), wood2)
    box((2.4, .03, .7), (0, -.46, .5), tm)
    for sx in (-1.25, 1.25):
        for sy in (-.4, .4):
            cyl(.05, 2.5, (sx, sy, 1.25), wood2, 6)
    for i in range(8):    # striped awning
        x = -1.35 + (i + .5) * 2.7 / 8
        beam((x, .5, 2.55), (x, -.75, 2.25), 2.7 / 8, tm if i % 2 == 0 else tt, .03)
    for k, x in enumerate((-.9, -.3, .3, .9)):   # trays of mooncakes with a flower print on top
        cyl(.26, .03, (x, -.05, 1.02), wood2, 16)
        for j, (dx, dy) in enumerate(((-.1, -.08), (.1, -.08), (0, .1))):
            cyl(.08, .05, (x + dx, -.05 + dy, 1.06), cake, 12)
            cyl(.065, .012, (x + dx, -.05 + dy, 1.09), cake2, 12)
            torus(.04, .008, (x + dx, -.05 + dy, 1.096), cake, 10, 3)
    box((1.0, .05, .32), (0, -.78, 2.2), sign, bev=.01)
    box((1.08, .04, .4), (0, -.76, 2.2), wood2)
    for x in (-1.0, 1.0):   # two small star lanterns hanging from the awning
        rod((x, -.65, 2.3), (x, -.65, 2.05), .005, .005, wood2, 4)
        star((x, -.65, 1.9), .14, .06, .06, tm)
        ball(.035, (x, -.69, 1.9), core, sub=1)
    group("mooncake_stall")
    export("ev_mooncake_stall_v01")


def lion_dance():
    reset()
    tm, tt = tint()
    fur, eye_w, eye_d = mat("fur_white", "#F6F1E6", rough=.9), mat("eye_white", "#FFFFFF", rough=.3), mat("eye_dark", "#1B1B22", rough=.2)
    mirror, gold = mat("mirror", "#DDE6EE", rough=.05, metal=1.0), mat("gold", "#E2B04A", rough=.3, metal=.8)
    pants, shoe = mat("pants_tint", "#CCCCCC", rough=.8), mat("shoe_black", "#2A2A2E", rough=.6)
    arm = make_rig("lion", [("root", (0, 0, 0), None), ("body1", (0, 0, 1.0), "root"), ("head", (0, -.75, 1.15), "body1"),
                            ("jaw", (0, -1.0, 1.05), "head"), ("body2", (0, .7, .95), "body1"), ("tail", (0, 1.35, .9), "body2"),
                            ("leg_FL", (.18, -.45, .8), "root"), ("leg_FR", (-.18, -.45, .8), "root"),
                            ("leg_BL", (.18, .9, .8), "root"), ("leg_BR", (-.18, .9, .8), "root")])
    s = len(OBJS)     # big head: face, eyes with lashes, horn, mirror, fur trim
    ball(.52, (0, -.9, 1.38), tm, uv=(16, 10), scale=(1.15, .95, 1.0))
    ball(.34, (0, -1.25, 1.2), tt, uv=(14, 8), scale=(1, .6, .65))            # snout
    for sd in (-1, 1):
        ball(.15, (sd * .24, -1.28, 1.55), eye_w, uv=(12, 8), scale=(1, .5, .9))
        ball(.08, (sd * .24, -1.35, 1.54), eye_d, uv=(10, 6), scale=(1, .5, 1))
        torus(.15, .03, (sd * .24, -1.3, 1.58), fur, 14, 3, rot=(math.pi / 2 - .3, 0, 0))   # furry brows
        ball(.14, (sd * .5, -.8, 1.75), tm, uv=(10, 6), scale=(.6, .5, 1))       # ears
        ball(.08, (sd * .52, -.84, 1.77), fur, uv=(8, 5), scale=(.5, .4, .9))
        ball(.07, (sd * .38, -1.3, 1.2), fur, sub=1, scale=(1, .6, 1.4))          # whisker tufts
    cyl(.07, .3, (0, -1.1, 1.95), gold, 8, r2=.02, rot=(-.4, 0, 0))             # horn
    cyl(.09, .02, (0, -1.4, 1.78), mirror, 12, rot=(math.pi / 2 - .3, 0, 0))    # mirror on the forehead
    torus(.55, .09, (0, -.62, 1.38), fur, 22, 5, rot=(math.pi / 2, 0, 0))      # fur ruff around the head
    tag("head", s)
    s = len(OBJS)
    ball(.3, (0, -1.15, .98), tm, uv=(12, 6), scale=(1, .85, .4))
    ball(.18, (0, -1.25, 1.0), mat("mouth_pink", "#E06A7A", rough=.6), uv=(10, 6), scale=(1, .7, .3))
    for k in range(5):
        cyl(.022, .07, (-.14 + .07 * k, -1.38, 1.05), eye_w, 5, r2=.0, rot=(math.pi, 0, 0))
    tag("jaw", s)
    s = len(OBJS)     # cloth body (front half)
    rod((0, -.5, 1.15), (0, .35, 1.05), .4, .42, tm, 14)
    for k in range(3):
        torus(.41, .03, (0, -.3 + .25 * k, 1.1), tt, 16, 3, rot=(math.pi / 2, 0, 0))
    tag("body1", s)
    s = len(OBJS)
    rod((0, .35, 1.05), (0, 1.2, .95), .42, .36, tm, 14)
    for k in range(3):
        ball(.08, (0, .45 + .3 * k, 1.47 - .05 * k), fur, sub=1, scale=(1.4, 1, .6))   # fur spine tufts
    tag("body2", s)
    s = len(OBJS)
    rod((0, 1.2, .95), (0, 1.5, .85), .3, .1, tm, 10)
    ball(.14, (0, 1.55, .85), fur, sub=1, scale=(1, 1.4, 1))
    tag("tail", s)
    for leg, x, y in (("leg_FL", .18, -.45), ("leg_FR", -.18, -.45), ("leg_BL", .18, .9), ("leg_BR", -.18, .9)):
        s = len(OBJS)
        rod((x, y, .8), (x, y, .12), .09, .07, pants, 8)
        ball(.08, (x, y - .05, .06), shoe, uv=(8, 5), scale=(1, 1.5, .7))
        for k in range(3):
            ball(.03, (x + (k - 1) * .04, y - .07, .25), fur, sub=0)
        tag(leg, s)

    def dance(t):     # 1.2 s: bob, side tilt, snap the jaw twice, the cloth body waves, dancers step
        s1 = math.sin(TAU * t)
        p = {"root": (None, (0, 0, .04 * abs(math.sin(TAU * 2 * t))), None),
             "head": (q((1, 0, 0), .25 * math.sin(TAU * 2 * t)) @ q((0, 1, 0), .3 * s1), (0, 0, .08 * s1), None),
             "jaw": (q((1, 0, 0), .35 * max(0.0, math.sin(TAU * 2 * t))), None, None),
             "body1": (q((0, 0, 1), .1 * s1), None, None), "body2": (q((0, 0, 1), -.18 * s1) @ q((1, 0, 0), .08 * math.cos(TAU * t)), None, None),
             "tail": (q((0, 0, 1), .5 * math.sin(TAU * t + 1)), None, None)}
        for leg, ph in (("leg_FL", 0), ("leg_BR", 0), ("leg_FR", math.pi), ("leg_BL", math.pi)):
            p[leg] = (q((1, 0, 0), .35 * math.sin(TAU * 2 * t + ph)), None, None)
        return p

    def idle(t):
        return {"head": (q((0, 1, 0), .08 * math.sin(TAU * t)), (0, 0, .02 * math.sin(TAU * t)), None),
                "tail": (q((0, 0, 1), .2 * math.sin(TAU * t)), None, None)}
    clip(arm, "Idle", 48, idle)
    clip(arm, "Dance", 29, dance)
    rig_finish("lion_dance", arm, "ev_lion_dance_v01")


# ================================================================== Tết
def blossom_tree(fname, flower_hex, five=False):
    reset()
    tm, tt = tint()
    bark, gold = mat("bark", "#5E3D23", rough=.9), mat("gold", "#E2B04A", rough=.3, metal=.8)
    fl, fl2 = mat("blossom", flower_hex, rough=.6), mat("blossom_core", "#F6D86A" if not five else "#E07A2A", rough=.6)
    lathe([(0, 0), (.24, 0), (.3, .32), (.32, .36), (.26, .38), (0, .38)], tm, seg=16)     # pot (tint_main, red for Tết)
    torus(.3, .022, (0, 0, .3), gold, 20, 3)
    cyl(.25, .02, (0, 0, .36), mat("soil", "#4A3322", rough=1), 16)
    rnd = random.Random(11 if five else 7)
    tips = []

    def branch(p, d, L, r, depth):
        e = p + d * L
        rod(p, e, r, r * .7, bark, 6)
        if depth == 0:
            tips.append(e)
            return
        for k in range(3):
            a = k * TAU / 3 + rnd.uniform(-.5, .5)
            nd = (d * .8 + Vector((math.cos(a) * rnd.uniform(.7, 1.1), math.sin(a) * rnd.uniform(.5, .9), rnd.uniform(.1, .5)))).normalized()
            branch(e, nd, L * .74, r * .68, depth - 1)
        tips.append(e)
    branch(Vector((0, 0, .36)), Vector((0, 0, 1)), .5, .065, 3)
    for k, p in enumerate(tips):    # blossom clusters on every twig end and fork
        if k < 4:
            continue
        for j in range(2):
            c = p + Vector((rnd.uniform(-.1, .1), rnd.uniform(-.1, .1), rnd.uniform(-.05, .08)))
            ball(.07 + .03 * rnd.random(), c, fl, sub=0, jit=.01, seed=k * 3 + j)
            if j == 0:
                ball(.022, c + Vector((0, -.07, .02)), fl2, sub=0)
    if five:   # Tết apricot (mai): a few red envelopes hanging on the twigs
        env = mat("tint_trim", "#CCCCCC", rough=.6)
        for p in tips[2:9:3]:
            box((.05, .006, .09), (p.x, p.y - .02, p.z - .1), env)
            box((.02, .008, .02), (p.x, p.y - .025, p.z - .08), gold)
    group(fname.replace("_v01", ""))
    export(fname)


def red_envelope():
    reset()
    tm, tt = tint()
    gold = mat("gold", "#E2B04A", rough=.3, metal=.8)
    box((.09, .006, .16), (0, 0, .08), tm, bev=.001)
    mesh([(-.045, -.0035, .16), (.045, -.0035, .16), (0, -.0035, .125)], [(0, 1, 2)], tt)    # flap
    cyl(.024, .002, (0, -.004, .075), gold, 16, rot=(math.pi / 2, 0, 0))
    torus(.024, .002, (0, -.005, .075), tt, 16, 3, rot=(math.pi / 2, 0, 0))
    for z in (.012, .148):
        box((.08, .002, .004), (0, -.0035, z), gold)
    group("red_envelope")
    export("ev_red_envelope_v01")


def banh_chung():
    reset()
    tm, tt = tint()
    leaf, leaf2 = mat("leaf_dong", "#3E8A3A", rough=.7), mat("leaf_dong_dark", "#2C6A2A", rough=.75)
    plate = mat("plate", "#F4F1EA", rough=.4)
    cyl(.24, .02, (0, 0, .01), plate, 24)
    box((.26, .26, .09), (0, 0, .065), leaf, bev=.008)
    for k in range(3):   # leaf seams on top
        box((.24, .006, .002), (0, -.08 + .08 * k, .111), leaf2)
    for x in (-.06, .06):    # bamboo strings, two each way (tint_main)
        box((.012, .272, .096), (x, 0, .065), tm)
        box((.272, .012, .096), (0, x, .065), tm)
    group("banh_chung")
    export("ev_banh_chung_v01")


def firecracker_light():
    reset()
    tm, tt = tint()
    gold, cord, bulb = mat("gold", "#E2B04A", rough=.3, metal=.8), mat("cord", "#8E1620", rough=.7), mat("light_glow", "#FFE08A", emit=2.5)
    rod((0, 0, .05), (0, 0, 1.55), .008, .008, cord, 6)
    torus(.05, .015, (0, 0, 1.6), tt, 12, 4, rot=(math.pi / 2, 0, 0))
    for sd in (-1, 1):
        rod((0, 0, 1.6), (sd * .08, 0, 1.75), .01, .01, tt, 6)
    for k in range(12):     # crackers in pairs, angled out, gold caps, glowing tips
        z = 1.45 - k * .11
        for sd in (-1, 1):
            a = sd * (.9 + .1 * (k % 2))
            d = Vector((math.sin(a), 0, -math.cos(a) * .3)).normalized()
            p = Vector((0, 0, z)) + d * .09
            rod(p - d * .07, p + d * .07, .028, .028, tm, 8)
            rod(p + d * .07, p + d * .085, .029, .022, gold, 8)
            ball(.014, p + d * .095, bulb, sub=0)
    for k in (-1, 0, 1):   # tassel at the bottom
        rod((k * .02, 0, .1), (k * .03, 0, -.08), .012, .004, tt, 5)
    group("firecracker_light")
    export("ev_firecracker_light_v01")


# ================================================================== Halloween
def pumpkin_lantern():
    reset()
    tm, tt = tint()
    stem, leaf, flame = mat("stem_green", "#4E7A2E", rough=.8), mat("leaf", "#5FA046", rough=.8), mat("light_flame", "#FFB040", emit=3.0)
    o = ball(.3, (0, 0, .25), tm, uv=(24, 12), scale=(1.15, 1.1, .85))
    for v in o.data.vertices:    # ribs
        a = math.atan2(v.co.y, v.co.x)
        k = 1 + .07 * math.cos(10 * a) * (1 - abs(v.co.z / .3) ** 2)
        v.co.x *= k
        v.co.y *= k
    rod((0, 0, .5), (.03, .02, .62), .05, .035, stem, 8)
    ball(.08, (.1, .03, .54), leaf, uv=(8, 4), scale=(1.2, .6, .15), rot=(0, .3, .4))
    for sd in (-1, 1):   # cute face: rounded triangle eyes, smile with one tooth gap
        mesh([(sd * .12 - .055, -.395, .32), (sd * .12 + .055, -.395, .32), (sd * .12, -.385, .4)], [(0, 1, 2)], flame)
    verts = []
    for k in range(9):
        x = -.15 + .3 * k / 8
        verts.append((x, -.4 + .15 * x * x, .2 - .06 * math.cos(math.pi * (k / 8 - .5)) + .02))
    for k in range(9):
        x = -.15 + .3 * k / 8
        verts.append((x, -.4 + .15 * x * x, .2 - .1 * math.cos(math.pi * (k / 8 - .5)) + .02))
    faces = [(k, k + 1, 10 + k, 9 + k)[::-1] for k in range(8) if k != 5]
    mesh(verts, faces, flame)
    group("pumpkin_lantern")
    export("ev_pumpkin_lantern_v01")


def ghost_friendly():
    reset()
    tm, tt = tint()
    sheet, blush = mat("ghost_white", "#F4F6FF", emit=.25, rough=.6), mat("blush_pink", "#F2A0B0", rough=.6)
    dark = mat("eye_dark", "#1B1B22", rough=.2)
    arm = make_rig("ghost", [("root", (0, 0, 0), None), ("body", (0, 0, .5), "root"), ("arm_L", (.3, -.05, .8), "body"),
                             ("arm_R", (-.3, -.05, .8), "body"), ("hem", (0, 0, .35), "body")])
    s = len(OBJS)
    lathe([(0, 1.25), (.18, 1.22), (.3, 1.1), (.36, .9), (.37, .7), (.38, .55)], sheet, seg=18)
    for sd in (-1, 1):
        ball(.06, (sd * .13, -.32, 1.0), dark, uv=(10, 6), scale=(.8, .5, 1.1))
        ball(.018, (sd * .13 + .02, -.36, 1.03), mat("eye_white", "#FFFFFF", rough=.3), uv=(6, 4))
        ball(.05, (sd * .22, -.31, .9), blush, uv=(8, 5), scale=(1, .3, .6))
    ball(.035, (0, -.35, .9), dark, uv=(8, 5), scale=(1.2, .4, .8))
    ball(.1, (.18, .0, 1.22), tm, uv=(10, 6), scale=(1, .6, .7))      # bow (tint_main)
    ball(.1, (.34, .0, 1.17), tm, uv=(10, 6), scale=(1, .6, .7))
    ball(.04, (.26, .0, 1.2), tt, uv=(8, 5))
    tag("body", s)
    s = len(OBJS)
    o = lathe([(.38, .55), (.4, .35), (.42, .2)], sheet, seg=18)
    for v in o.data.vertices:
        if v.co.z < .21:
            v.co.z += .07 * math.sin(6 * math.atan2(v.co.y, v.co.x))
    tag("hem", s)
    for nm, sd in (("arm_L", 1), ("arm_R", -1)):
        s = len(OBJS)
        ball(.09, (sd * .4, -.05, .75), sheet, uv=(10, 6), scale=(1.3, .8, .7))
        tag(nm, s)
    def idle(t):
        s1 = math.sin(TAU * t)
        return {"root": (None, (0, 0, .2 + .06 * s1), None), "hem": (q((0, 0, 1), .15 * s1), None, (1 + .04 * s1, 1 + .04 * s1, 1)),
                "arm_L": (q((0, 1, 0), -.2 * s1), None, None), "arm_R": (q((0, 1, 0), .2 * s1), None, None)}

    def wave(t):
        s1 = math.sin(TAU * t)
        return {"root": (None, (0, 0, .2 + .04 * s1), None), "body": (q((0, 1, 0), -.08 * s1), None, None),
                "arm_R": (q((0, 1, 0), 1.6 * bump(t, 0, 1)) @ q((1, 0, 0), .5 * math.sin(TAU * 3 * t)), (-.05, 0, .1 * bump(t, 0, 1)), None)}
    clip(arm, "Idle", 48, idle)
    clip(arm, "Wave", 24, wave)
    rig_finish("ghost_friendly", arm, "ev_ghost_friendly_v01")


def candy_bucket():
    reset()
    tm, tt = tint()
    face, handle = mat("face_dark", "#2A1A12", rough=.7), mat("handle_black", "#2A2A2E", rough=.5)
    cols = [mat(n, h, rough=.35) for n, h in (("candy_pink", "#F27AB0"), ("candy_blue", "#5AB4F2"), ("candy_green", "#6AD06A"),
                                               ("candy_yellow", "#F6D040"), ("candy_purple", "#A06AE0"))]
    o = lathe([(.0, .0), (.16, .0), (.2, .06), (.22, .16), (.2, .26), (.17, .3), (.15, .3), (.17, .26), (.18, .16), (.16, .07), (0, .05)], tm, seg=20)
    for v in o.data.vertices:
        a = math.atan2(v.co.y, v.co.x)
        v.co.x *= 1 + .05 * math.cos(8 * a)
        v.co.y *= 1 + .05 * math.cos(8 * a)
    for sd in (-1, 1):
        mesh([(sd * .07 - .035, -.215, .17), (sd * .07 + .035, -.215, .17), (sd * .07, -.217, .22)], [(0, 1, 2)], face)
    mesh([(-.08, -.21, .1), (.08, -.21, .1), (.05, -.215, .07), (-.05, -.215, .07)], [(0, 1, 2, 3)], face)
    o = torus(.17, .012, (0, 0, .3), handle, 20, 4, rot=(math.pi / 2, 0, 0))
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.y < -.02], context='VERTS')   # keep the upper half (local y -> world z)
    bm.to_mesh(o.data)
    bm.free()
    rnd = random.Random(5)
    for k in range(9):    # wrapped candies and two lollipops poking out of the top
        a = rnd.uniform(0, TAU)
        r = rnd.uniform(0, .1)
        p = Vector((r * math.cos(a), r * math.sin(a), .28 + rnd.uniform(0, .04)))
        m = cols[k % 5]
        ball(.025, p, m, uv=(8, 5), scale=(1.3, 1, 1))
        for sd in (-1, 1):
            cyl(.02, .025, p + Vector((sd * .04, 0, 0)), m, 6, r2=.004, rot=(0, sd * math.pi / 2, 0))
    for k, (x, y) in enumerate(((.05, .04), (-.06, -.02))):
        rod((x, y, .22), (x * 1.6, y * 1.6, .45), .006, .006, mat("stick_white", "#F4F1EA"), 5)
        cyl(.05, .015, (x * 1.6, y * 1.6, .48), cols[(k + 3) % 5], 14, rot=(math.pi / 2, 0, k))
    group("candy_bucket")
    export("ev_candy_bucket_v01")


# ================================================================== Christmas
def tree_xmas():
    reset()
    tm, tt = tint()
    pine, pine2 = mat("pine_green", "#2E7A3E", rough=.8), mat("pine_green_dark", "#215C2E", rough=.85)
    bark, gold = mat("bark", "#5E3D23", rough=.9), mat("gold", "#E2B04A", rough=.3, metal=.8)
    starm, bulb = mat("light_star", "#FFE070", emit=3.0), mat("light_glow", "#FFF2C0", emit=2.5)
    box((.6, .6, .35), (0, 0, .175), tm, bev=.02)    # planter box (tint_main)
    box((.64, .64, .05), (0, 0, .37), tt, bev=.01)
    cyl(.1, .4, (0, 0, .5), bark, 8)
    tiers = [(.95, .6, .75), (.78, 1.05, .7), (.6, 1.5, .62), (.42, 1.92, .55)]
    for k, (r, z, h) in enumerate(tiers):
        cyl(r, h, (0, 0, z + h / 2), pine if k % 2 == 0 else pine2, 12, r2=.04)
    rnd = random.Random(9)
    for k, (r, z, h) in enumerate(tiers):   # baubles around the bottom of each tier
        for j in range(7 - k):
            a = j * TAU / (7 - k) + k * .4
            ball(.06, (r * .85 * math.cos(a), r * .85 * math.sin(a), z + .1), (tm, tt, gold)[(j + k) % 3], uv=(8, 5))
    for i in range(36):     # light garland spiralling up
        t = i / 36
        z = .7 + 1.7 * t
        r = .9 * (1 - t) + .15
        a = t * TAU * 3.2
        ball(.025, (r * math.cos(a), r * math.sin(a), z), bulb, sub=0)
    star((0, 0, 2.6), .2, .08, .06, starm)
    group("tree_xmas")
    export("ev_tree_xmas_v01")


def snowman():
    reset()
    tm, tt = tint()
    snow, coal, carrot = mat("snow_white", "#F6F8FC", rough=.8), mat("coal", "#22222A", rough=.7), mat("carrot", "#F08A24", rough=.6)
    hat, wood = mat("hat_black", "#2A2A30", rough=.6), mat("wood", "#6E4A2C", rough=.85)
    arm = make_rig("snowman", [("root", (0, 0, 0), None), ("body", (0, 0, .4), "root"), ("head", (0, 0, 1.0), "body"),
                               ("arm_L", (.32, 0, .85), "body"), ("arm_R", (-.32, 0, .85), "body")])
    s = len(OBJS)
    ball(.4, (0, 0, .38), snow, uv=(16, 10), scale=(1, 1, .92))
    ball(.3, (0, 0, .85), snow, uv=(16, 10))
    for k in range(3):
        ball(.03, (0, -.29 - .01 * (k == 1), .95 - .12 * k), coal, uv=(8, 5))
    o = torus(.2, .06, (0, 0, 1.06), tm, 18, 6)     # scarf (tint_main) with a hanging end
    box((.1, .04, .32), (.12, -.2, .92), tm, rot=(.15, 0, -.2), bev=.01)
    for k in range(2):
        box((.1, .045, .02), (.12, -.2 - .005, .82 + .1 * k), tt)
    tag("body", s)
    s = len(OBJS)
    ball(.22, (0, 0, 1.3), snow, uv=(14, 10))
    for sd in (-1, 1):
        ball(.028, (sd * .08, -.2, 1.36), coal, uv=(8, 5))
        ball(.03, (sd * .13, -.18, 1.25), mat("blush_pink", "#F2A0B0", rough=.6), uv=(6, 4), scale=(1, .4, .6))
    rod((0, -.2, 1.3), (0, -.42, 1.28), .035, .004, carrot, 8)
    for k in range(5):
        a = math.pi * (k / 4)
        ball(.012, (.07 * math.cos(a) * -1, -.205, 1.2 - .03 * math.sin(a)), coal, sub=0)
    cyl(.22, .03, (0, 0, 1.49), hat, 16)
    cyl(.14, .22, (0, 0, 1.61), hat, 14)
    cyl(.145, .05, (0, 0, 1.53), tt, 14)
    tag("head", s)
    for nm, sd in (("arm_L", 1), ("arm_R", -1)):
        s = len(OBJS)
        rod((sd * .3, 0, .85), (sd * .65, 0, 1.08), .02, .012, wood, 6)
        for k in range(2):
            rod((sd * .55, 0, 1.02), (sd * (.62 + .03 * k), 0, 1.15 - .05 * k), .01, .006, wood, 5)
        tag(nm, s)

    def idle(t):
        s1 = math.sin(TAU * t)
        return {"head": (q((0, 1, 0), .06 * s1), None, None), "body": (None, None, (1 + .015 * s1, 1 + .015 * s1, 1 - .015 * s1))}

    def wave(t):
        up = bump(t, 0, 1)
        return {"arm_R": (q((0, 1, 0), .9 * up) @ q((1, 0, 0), .4 * math.sin(TAU * 3 * t)), None, None), "head": (q((0, 1, 0), -.15 * up), None, None)}
    clip(arm, "Idle", 48, idle)
    clip(arm, "Wave", 29, wave)
    rig_finish("snowman", arm, "ev_snowman_v01")


def gift_box():
    reset()
    tm, tt = tint()
    box((.5, .5, .4), (0, 0, .2), tm, bev=.01)
    box((.54, .54, .1), (0, 0, .43), tm, bev=.01)
    box((.08, .545, .505), (0, 0, .252), tt)
    box((.545, .08, .505), (0, 0, .252), tt)
    for sd in (-1, 1):   # bow: two loops and two tails
        torus(.07, .022, (sd * .07, 0, .53), tt, 14, 5, rot=(math.pi / 2, sd * .5, 0))
        box((.04, .005, .14), (sd * .05, -.05, .44), tt, rot=(0, sd * .4, 0))
    ball(.035, (0, 0, .5), tt, uv=(8, 5))
    group("gift_box")
    export("ev_gift_box_v01")


BUILDERS = {"ev_arena": arena, "ev_kitchen_double": kitchen_double, "ev_dig_spot": dig_spot, "ev_treasure_map": treasure_map,
            "ev_mannequin_pair": mannequin_pair, "ev_scoreboard": scoreboard, "ev_portal_coop": portal_coop, "ev_boss_giant": boss_giant,
            "ev_lantern_star": lantern_star, "ev_lantern_fish": lantern_fish, "ev_mooncake_stall": mooncake_stall, "ev_lion_dance": lion_dance,
            "ev_peach_blossom": lambda: blossom_tree("ev_peach_blossom_v01", "#F4A6C0"),
            "ev_apricot_blossom": lambda: blossom_tree("ev_apricot_blossom_v01", "#F6CE3A", five=True),
            "ev_red_envelope": red_envelope, "ev_banh_chung": banh_chung, "ev_firecracker_light": firecracker_light,
            "ev_pumpkin_lantern": pumpkin_lantern, "ev_ghost_friendly": ghost_friendly, "ev_candy_bucket": candy_bucket,
            "ev_tree_xmas": tree_xmas, "ev_snowman": snowman, "ev_gift_box": gift_box}
for n, f in BUILDERS.items():
    if not ONLY or n in ONLY:
        f()
