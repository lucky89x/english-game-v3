"""Batch 23: story models. Run: OUT=<folder> blender -b -P tools/story/build_story.py (optional ONLY=npc_hush_lord,...)
Feet at 0, front Blender -Y (glTF +Z). Rigid rigs via tools/harbor/b5_mobs.py; object clips (compass needle, pieces,
door) are NLA tracks named after the clip and exported with export_animation_mode NLA_TRACKS, so several objects share one
clip. Compass pieces keep their own centre as origin; the custom property fit_offset (glTF extras, metres, glTF axes)
says where each piece sits in the whole compass. Mia the tailor is built by tools/chibi05/build_ngoc_v03.py (variant mia).
"""
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "harbor"))
from hlib import *  # noqa
import hlib
from b5_mobs import make_rig, clip, q, bind, FPS  # noqa
import bpy, bmesh
from mathutils import Vector, Matrix, Quaternion

ONLY = [s for s in os.environ.get("ONLY", "").split(",") if s]
TAU = 2 * math.pi
PIECE_COLS = ["#5CB85C", "#3F8FD8", "#E8C35A", "#E8F4FF", "#E5483A", "#9B6FCF", "#F28AB3", "#3FC0B0", "#F28A3A", "#F5D03A"]


def bump(t, a, b):
    return 0.0 if t <= a or t >= b else math.sin(math.pi * (t - a) / (b - a))


def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def obj_clip(o, name, frames, fn, fps=24):
    """bake an object animation into an NLA track called `name`; fn(t) -> (loc, euler) in the object's parent space"""
    bpy.context.scene.render.fps = fps
    ad = o.animation_data_create()
    act = bpy.data.actions.new(o.name + "_" + name)
    ad.action = act
    base_l, base_r = o.location.copy(), o.rotation_euler.copy()
    for f in range(frames + 1):
        loc, rot, sc = fn(f / frames)
        o.location = base_l + Vector(loc)
        o.rotation_euler = (base_r.x + rot[0], base_r.y + rot[1], base_r.z + rot[2])
        o.scale = sc
        o.keyframe_insert("location", frame=f + 1)
        o.keyframe_insert("rotation_euler", frame=f + 1)
        o.keyframe_insert("scale", frame=f + 1)
    act.use_fake_user = True
    tr = ad.nla_tracks.new()
    tr.name = name
    tr.strips.new(name, 1, act)
    ad.action = None
    o.location, o.rotation_euler, o.scale = base_l, base_r, (1, 1, 1)


def export_nla(fname):
    bpy.ops.object.select_all(action='DESELECT')
    for o in GROUPS:
        o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, fname + ".glb"), export_format='GLB', export_yup=True, use_selection=True,
                              export_apply=True, export_image_format='NONE', export_animations=True,
                              export_animation_mode='NLA_TRACKS', export_force_sampling=True, export_extras=True)
    for o in GROUPS:
        print("BUILT", fname, o.name, "tris", tris(o), "size", *[round(x, 2) for x in o.dimensions])


# ------------------------------------------------------------------ Lord Hush
def hush_lord():
    reset()
    cloak, trim = mat("hush_cloak", "#2A1F3D", rough=.8), mat("hush_trim", "#7A4BD1", rough=.6)
    eye, zipm, paper = mat("eye_glow", "#C49BFF", emit=3.0), mat("zip_silver", "#C9CED6", rough=.25, metal=.9), mat("paper_cream", "#F1E2C0", rough=.9)
    dark = mat("hood_inside", "#0C0812", rough=1.0)
    arm = make_rig("hush", [("root", (0, 0, 0), None), ("body", (0, 0, .1), "root"), ("hem", (0, 0, .25), "body"),
                            ("head", (0, 0, 1.45), "body"), ("arm_L", (.32, 0, 1.3), "body"), ("arm_R", (-.32, 0, 1.3), "body"),
                            ("scroll", (-.55, -.3, 1.2), "root"), ("fx", (.5, -.35, 1.25), "arm_L")])
    s = len(OBJS)   # long cloak body
    lathe([(0, .5), (.45, .5), (.4, .9), (.3, 1.35), (.22, 1.42), (0, 1.43)], cloak, seg=14)
    for k in range(4):
        torus(.33 - .03 * k, .012, (0, 0, .95 + .12 * k), trim, 14, 3)
    tag("body", s)
    s = len(OBJS)   # tattered hem down to the ground
    o = lathe([(0, .52), (.46, .52), (.55, .02), (0, .02)], cloak, seg=16)
    for v in o.data.vertices:
        if v.co.z < .1:
            a = math.atan2(v.co.y, v.co.x)
            v.co.z += .08 * (int(round(a / (TAU / 16))) % 2)
    tag("hem", s)
    s = len(OBJS)   # deep hood, two glowing eyes, a zipped mouth
    ball(.42, (0, .02, 1.75), cloak, uv=(16, 10), scale=(1, 1, 1.05))
    cyl(.15, .5, (0, .1, 2.15), cloak, 8, r2=.0, rot=(.6, 0, 0))
    ball(.3, (0, -.17, 1.72), dark, uv=(14, 8), scale=(1, .55, 1))
    torus(.32, .03, (0, -.23, 1.73), trim, 18, 4, rot=(math.pi / 2 + .15, 0, 0))
    for sd in (-1, 1):
        ball(.06, (sd * .11, -.33, 1.8), eye, uv=(10, 6), scale=(1, .4, .8))
    for k in range(7):
        box((.02, .01, .025), (-.09 + k * .03, -.34, 1.6), zipm)
    box((.2, .008, .01), (0, -.345, 1.6), zipm)
    box((.025, .01, .04), (.11, -.35, 1.59), zipm)
    tag("head", s)
    for sd, sn in ((1, "L"), (-1, "R")):
        s = len(OBJS)
        rod((sd * .3, 0, 1.3), (sd * .5, -.1, .95), .09, .13, cloak, 8)
        ball(.06, (sd * .52, -.12, .9), mat("hand_pale", "#BFB4D6", rough=.6), uv=(8, 5))
        tag("arm_" + sn, s)
    s = len(OBJS)   # torn scroll floating by his right hand
    cyl(.035, .3, (-.6, -.3, 1.15), paper, 8, rot=(0, math.pi / 2, .2))
    box((.28, .005, .22), (-.6, -.32, 1.02), paper, rot=(.1, 0, .2))
    for k in range(3):
        box((.18, .003, .012), (-.6, -.325, 1.08 - k * .05), mat("ink_purple", "#5A3A8A"), rot=(.1, 0, .2))
    tag("scroll", s)
    s = len(OBJS)
    ball(.01, (.5, -.35, 1.25), eye, sub=1)
    tag("fx", s)

    def idle(t):   # 3 s, cloak sways
        s_ = math.sin(TAU * t)
        return {"hem": (q((0, 0, 1), .06 * s_) @ q((1, 0, 0), .04 * math.sin(TAU * 2 * t)), None, None),
                "body": (q((0, 1, 0), .03 * s_), None, None), "head": (q((0, 0, 1), .1 * math.sin(TAU * t + 1)), None, None),
                "scroll": (q((0, 0, 1), .2 * s_), (0, 0, .05 * math.sin(TAU * 2 * t)), None)}

    def talk(t):
        s_ = math.sin(TAU * 2 * t)
        return {"arm_L": (q((1, 0, 0), -.4 - .25 * s_), None, None), "arm_R": (q((1, 0, 0), -.2 + .2 * s_), None, None),
                "head": (q((1, 0, 0), .08 * s_), None, None), "scroll": (None, (0, 0, .04 * s_), None)}

    def cast(t):
        up = bump(t, 0, 1)
        return {"arm_L": (q((0, 1, 0), -2.3 * up), None, None), "arm_R": (q((0, 1, 0), 1.2 * up), None, None),
                "head": (q((1, 0, 0), -.25 * up), None, None), "hem": (q((0, 0, 1), TAU * .5 * ease(t)), None, (1 + .2 * up,) * 3),
                "fx": (None, None, (1 + 3 * up,) * 3)}

    def laugh(t):   # silent laugh: shoulders shake, head thrown back
        sh = math.sin(TAU * 6 * t)
        return {"body": (None, (0, 0, .03 * abs(sh)), None), "head": (q((1, 0, 0), -.25 + .06 * sh), None, None),
                "arm_L": (q((1, 0, 0), -.5 + .1 * sh), None, None), "arm_R": (q((1, 0, 0), -.5 - .1 * sh), None, None)}

    def vanish(t):
        f = ease(t)
        k = max(.001, 1 - f)
        return {"root": (q((0, 0, 1), TAU * 1.5 * f), (0, 0, .3 * f), (k, k, k))}
    clip(arm, "Idle", 72, idle)
    clip(arm, "Talk", 24, talk)
    clip(arm, "Cast", 22, cast, step=1)
    clip(arm, "Laugh", 29, laugh, step=1)
    clip(arm, "Vanish", 29, vanish, step=1)
    o = group("hush_lord", origin=None, smooth=True)
    bind(o, arm)
    export("npc_hush_lord_v01", objs=[o], anim=True)


def hush_wraith():
    reset()
    dark, light = mat("smoke_dark", "#2A1F3D", rough=.8), mat("smoke_light", "#7A6A9A", rough=.8, alpha=.7)
    eye, zipm = mat("eye_glow", "#C49BFF", emit=3.0), mat("zip_silver", "#C9CED6", rough=.25, metal=.9)
    Z = .6
    arm = make_rig("wraith", [("root", (0, 0, 0), None), ("body", (0, 0, Z + .3), "root"), ("tail", (0, 0, Z), "body"),
                              ("arm_L", (.22, -.05, Z + .45), "body"), ("arm_R", (-.22, -.05, Z + .45), "body"), ("fx", (0, -.35, Z + .45), "body")])
    s = len(OBJS)
    lathe([(0, Z + .15), (.2, Z + .25), (.28, Z + .45), (.25, Z + .62), (.15, Z + .72), (0, Z + .75)], dark, seg=14)
    lathe([(0, Z + .2), (.22, Z + .3), (.3, Z + .48), (.26, Z + .66), (0, Z + .78)], light, seg=12)
    for sd in (-1, 1):
        ball(.06, (sd * .09, -.25, Z + .55), eye, uv=(10, 6), scale=(1, .4, 1))
    for k in range(5):
        box((.018, .01, .022), (-.06 + k * .03, -.28, Z + .42), zipm)
    box((.15, .006, .008), (0, -.285, Z + .42), zipm)
    tag("body", s)
    s = len(OBJS)   # pointed smoky tail
    lathe([(0, 0.0), (.06, .15), (.14, .35), (.2, Z + .2), (0, Z + .22)], dark, seg=12, loc=(0, 0, 0))
    o = OBJS[-1]
    for v in o.data.vertices:
        v.co.x += .05 * math.sin(v.co.z * 8)
    tag("tail", s)
    for sd, sn in ((1, "L"), (-1, "R")):
        s = len(OBJS)
        rod((sd * .22, -.05, Z + .45), (sd * .38, -.15, Z + .3), .035, .02, dark, 6)
        ball(.035, (sd * .39, -.16, Z + .28), light, uv=(6, 4))
        tag("arm_" + sn, s)
    s = len(OBJS)
    ball(.01, (0, -.35, Z + .45), eye, sub=1)
    tag("fx", s)
    sw = lambda t, a: math.sin(TAU * a * t)
    clip(arm, "Idle", 48, lambda t: {"root": (None, (0, 0, .06 * sw(t, 1)), None), "tail": (q((0, 1, 0), .2 * sw(t, 1)), None, None),
                                     "arm_L": (q((0, 1, 0), -.2 * sw(t, 1)), None, None), "arm_R": (q((0, 1, 0), .2 * sw(t, 1)), None, None)})
    clip(arm, "Walk", 24, lambda t: {"root": (q((1, 0, 0), .25), (0, 0, .08 * sw(t, 1)), None), "tail": (q((1, 0, 0), .35 + .15 * sw(t, 2)), None, None)})
    clip(arm, "Attack", 15, lambda t: {"root": (None, (0, .1 * bump(t, 0, .45) - .5 * bump(t, .35, .9), 0), None),
                                       "arm_L": (q((1, 0, 0), -1.5 * bump(t, .35, .9)), None, None),
                                       "arm_R": (q((1, 0, 0), -1.5 * bump(t, .35, .9)), None, None)}, step=1)
    clip(arm, "Hit", 8, lambda t: {"root": (None, (0, .2 * bump(t, 0, 1), 0), None), "body": (None, None, (1 + .15 * bump(t, 0, 1), 1, 1 - .15 * bump(t, 0, 1)))},
         step=1)
    clip(arm, "Cast", 20, lambda t: {"arm_L": (q((0, 1, 0), -1.8 * bump(t, 0, 1)), None, None), "arm_R": (q((0, 1, 0), 1.8 * bump(t, 0, 1)), None, None),
                                     "fx": (None, None, (1 + 2 * bump(t, .3, 1),) * 3)}, step=1)
    clip(arm, "Death", 22, lambda t: {"root": (q((0, 0, 1), TAU * ease(t)), (0, 0, .5 * ease(t)), (max(.001, 1 - ease(t)),) * 3)}, step=1)
    o = group("hush_wraith", origin=None, smooth=True)
    bind(o, arm)
    export("mob_hush_wraith_v01", objs=[o], anim=True)


# ------------------------------------------------------------------ the Word Compass
R_C = .45
TILT = math.radians(20)


def jag(k, n=6, seed=17):
    """broken edge k (shared by pieces k-1 and k): angle offsets along the radius"""
    rnd = random.Random(seed + k * 31)
    return [(R_C * i / n, (rnd.uniform(-.06, .06) if 0 < i < n else 0.0)) for i in range(n + 1)]


def piece_outline(k):
    a0, a1 = k * TAU / 10, (k + 1) * TAU / 10
    pts = []
    for r, da in jag(k):
        a = a0 + (da / max(r, .05) * .3 if r > 0 else 0)
        pts.append(Vector((r * math.cos(a), r * math.sin(a), 0)))
    for i in range(1, 6):
        a = a0 + (a1 - a0) * i / 6
        pts.append(Vector((R_C * math.cos(a), R_C * math.sin(a), 0)))
    back = []
    for r, da in jag(k + 1 if k < 9 else 0):
        a = a1 + (da / max(r, .05) * .3 if r > 0 else 0)
        back.append(Vector((r * math.cos(a), r * math.sin(a), 0)))
    pts += list(reversed(back))[:-1]
    return pts


def prism(pts, z0, z1, m, side_m=None):
    n = len(pts)
    verts = [Vector((p.x, p.y, z0)) for p in pts] + [Vector((p.x, p.y, z1)) for p in pts]
    faces = [list(range(n))[::-1], list(range(n, 2 * n))]
    for i in range(n):
        j = (i + 1) % n
        faces.append([i, j, n + j, n + i])
    o = mesh(verts, faces, [m, side_m or m], [0, 0] + [1] * n)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(o.data)
    bm.free()
    return o


def compass_whole():
    reset()
    gold, glass = mat("gold", "#E2B04A", rough=.25, metal=.85), mat("glass_blue", "#3F8FD8", rough=.05, emit=.4, alpha=.85)
    red, white, rune = mat("needle_red", "#E5483A", emit=2.0), mat("needle_white", "#F6F8FA", emit=2.0), mat("rune_glow", "#5AF0E0", emit=2.5)
    lathe([(0, 0), (.16, 0), (.16, .05), (.06, .08), (.05, .3), (0, .3)], gold, seg=10)     # small stand
    s = len(OBJS)
    cyl(R_C - .03, .03, (0, 0, 0), glass, 32)
    torus(R_C, .03, (0, 0, .01), gold, 40, 6)
    cyl(R_C + .01, .02, (0, 0, -.02), gold, 32)
    for k in range(10):   # ten raised word marks round the rim
        a = k * TAU / 10
        box((.05, .02, .012), ((R_C - .07) * math.cos(a), (R_C - .07) * math.sin(a), .02), rune, rot=(0, 0, a))
    ball(.03, (0, 0, .03), gold, uv=(8, 5))
    bpy.context.view_layer.update()
    M = Matrix.Translation((0, .03, .52)) @ Matrix.Rotation(math.pi / 2 - TILT, 4, 'X')   # face looks forward, tilted 20 deg up
    for o in OBJS[s:]:
        o.matrix_world = M @ o.matrix_world
    group("compass", origin=None)
    beam((0, -.3, 0), (0, .3, 0), .05, red, .012)
    OBJS[-1].data.transform(Matrix.Scale(1, 4))
    bm_obj = OBJS[-1]
    bm = bmesh.new()   # make it a two-coloured diamond: north half red, south half white
    bm.from_mesh(bm_obj.data)
    for v in bm.verts:
        v.co.x *= (1 - abs(v.co.y) / .3)
    bm.to_mesh(bm_obj.data)
    bm.free()
    bm_obj.data.materials.append(white)
    for p in bm_obj.data.polygons:
        if p.center.y > 0:
            p.material_index = 1
    needle = group("needle", origin=None)
    needle.location = M @ Vector((0, 0, .035))
    needle.data.transform(Matrix.Rotation(0, 4, 'Z'))
    needle.rotation_mode = 'ZYX'
    needle.rotation_euler = (math.pi / 2 - TILT, 0, 0)
    obj_clip(needle, "Spin", 96, lambda t: ((0, 0, 0), (0, 0, TAU * t), (1, 1, 1)))
    export_nla("prop_compass_whole_v01")


def compass_piece(k):
    reset()
    gold, glass = mat("gold", "#E2B04A", rough=.25, metal=.85), mat("piece_main", PIECE_COLS[k], rough=.08, emit=.5, alpha=.9)
    pts = piece_outline(k)
    prism(pts, 0, .035, glass, gold)
    a0, a1 = k * TAU / 10, (k + 1) * TAU / 10
    arc = [Vector(((R_C + .012) * math.cos(a0 + (a1 - a0) * i / 6), (R_C + .012) * math.sin(a0 + (a1 - a0) * i / 6), .02)) for i in range(7)]
    for p, q_ in zip(arc, arc[1:]):
        beam(tuple(p), tuple(q_), .04, gold, .05)
    o = group("piece_%02d" % (k + 1), origin=None)
    c = sum((Vector(v.co) for v in o.data.vertices), Vector()) / len(o.data.vertices)
    c.z = 0
    o.data.transform(Matrix.Translation(-c))
    o["fit_offset"] = [round(c.x, 4), 0.0, round(-c.y, 4)]      # glTF axes: Blender (x, y, z) -> (x, z, -y)
    obj_clip(o, "Float", 48, lambda t: ((0, 0, .03 + .03 * math.sin(TAU * t)), (0, 0, TAU * t / 4), (1, 1, 1)))
    export_nla("prop_compass_piece_%02d_v01" % (k + 1))


def pedestal():
    reset()
    stone, stone2 = mat("stone", "#B4B0A6", rough=.9), mat("stone_dark", "#8C8A84", rough=.9)
    gold, slotm = mat("gold", "#E2B04A", rough=.25, metal=.85), mat("slot_glow", "#5AF0E0", emit=.3)
    cyl(.5, .12, (0, 0, .06), stone2, 8, rot=(0, 0, math.pi / 8))
    cyl(.38, .66, (0, 0, .45), stone, 8, r2=.34, rot=(0, 0, math.pi / 8))
    for k in range(8):   # light carving on the faces
        a = k * TAU / 8
        box((.12, .02, .3), (.36 * math.cos(a), .36 * math.sin(a), .45), stone2, rot=(0, 0, a + math.pi / 2))
    cyl(.52, .08, (0, 0, .82), stone, 8, rot=(0, 0, math.pi / 8))
    torus(.5, .015, (0, 0, .865), gold, 32, 3)
    cyl(.03, .08, (0, 0, .9), gold, 8)
    group("pedestal", origin=None)
    for k in range(10):   # ten recessed slots, one per compass piece
        pts = [p * .96 for p in piece_outline(k)]
        prism(pts, .855, .862, slotm)
        group("slot_%02d" % (k + 1), origin=None)
    export("prop_compass_pedestal_v01")


def magic_door():
    reset()
    wood, glow = mat("door_wood", "#CCCCCC", rough=.75), mat("door_glow", "#A98AFF", emit=2.5, alpha=.8)
    gold, vine = mat("gold", "#E2B04A", rough=.25, metal=.85), mat("vine_green", "#4F9A3E", rough=.8)
    starm = mat("star_gold", "#FFD23A", emit=2.0)
    W, H = 1.3, 2.2
    for sx in (-1, 1):
        box((.16, .22, H - .45), (sx * (W / 2 - .02), 0, (H - .45) / 2), wood, bev=.02)
    pts = [Vector(((W / 2 - .02) * math.cos(a), 0, H - .45 + .5 * math.sin(a))) for a in [math.pi * i / 10 for i in range(11)]]
    for a, b in zip(pts, pts[1:]):
        beam(tuple(a), tuple(b), .16, wood, .22)
    box((W + .2, .3, .1), (0, 0, .05), wood, bev=.02)
    rnd = random.Random(2)
    for sx in (-1, 1):   # vines and little flowers up both sides
        for k in range(6):
            z = .2 + k * .32
            rod((sx * (W / 2 + .06), -.06, z), (sx * (W / 2 + .03 + .04 * (k % 2)), -.08, z + .32), .02, .02, vine, 5)
            ball(.035, (sx * (W / 2 + .08), -.1, z + .1), mat("flower_pink", "#F28AB3"), sub=1, scale=(1, .5, 1))
    group("door_frame", origin=None)
    for sx, nm in ((-1, "door_L"), (1, "door_R")):   # two glowing leaves, hinged on the outer posts
        s = len(OBJS)
        verts = []
        for i in range(7):
            a = math.pi / 2 * i / 6
            x = sx * ((W / 2 - .1) * (1 - math.cos(a)) if False else 0)
        box(((W - .2) / 2, .04, H - .5), (sx * (W - .2) / 4, -.01, (H - .5) / 2 + .05), glow)
        ob = cyl((W - .2) / 2, .04, (0, -.01, H - .45), glow, 12, rot=(math.pi / 2, 0, 0))
        bm = bmesh.new()
        bm.from_mesh(ob.data)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.y < -1e-4 or (v.co.x * sx < -1e-4)], context='VERTS')
        bm.to_mesh(ob.data)
        bm.free()
        ball(.04, (sx * .1, -.06, 1.0), gold, uv=(8, 5))
        o = group(nm, origin=None)
        hinge = Vector((sx * (W / 2 - .1), 0, 0))
        o.data.transform(Matrix.Translation(-hinge))
        o.location = hinge
        obj_clip(o, "Open", 19, lambda t, sx=sx: ((0, 0, 0), (0, 0, sx * 1.6 * ease(t)), (1, 1, 1)))
        obj_clip(o, "Idle", 72, lambda t: ((0, 0, 0), (0, 0, 0), (1, 1, 1)))
    s = len(OBJS)   # light burst that flashes when the door opens
    cyl(.5, .02, (0, -.05, 1.0), mat("light_burst", "#FFFFFF", emit=4.0, alpha=.6), 16, rot=(math.pi / 2, 0, 0))
    burst = group("door_flash", origin=None)
    burst.location = (0, 0, 0)
    obj_clip(burst, "Open", 19, lambda t: ((0, 0, 0), (0, 0, 0), (max(.001, bump(t, 0, .8) * 2.5),) * 3))
    obj_clip(burst, "Idle", 72, lambda t: ((0, 0, 0), (0, 0, 0), (.001, .001, .001)))
    for k, sx in enumerate((-1, 1)):   # two floating stars
        verts = []
        for i in range(10):
            a = math.pi / 2 + i * math.pi / 5
            r = .1 if i % 2 == 0 else .045
            verts.append((r * math.cos(a), 0, r * math.sin(a)))
        n = len(verts)
        mesh(verts + [(0, -.02, 0), (0, .02, 0)], [[n, i, (i + 1) % n] for i in range(n)] + [[n + 1, (i + 1) % n, i] for i in range(n)], starm)
        o = group("star_%d" % (k + 1), origin=None)
        o.location = (sx * (W / 2 + .35), -.1, H - .3 + .15 * k)
        obj_clip(o, "Idle", 72, lambda t, k=k: ((0, 0, .08 * math.sin(TAU * t + k * 2)), (0, TAU * t, 0), (1, 1, 1)))
        obj_clip(o, "Open", 19, lambda t: ((0, 0, .2 * bump(t, 0, 1)), (0, TAU * t, 0), (1, 1, 1)))
    for nm in ("door_frame",):
        pass
    export_nla("prop_magic_door_v01")


BUILDERS = {"npc_hush_lord": hush_lord, "mob_hush_wraith": hush_wraith, "prop_compass_whole": compass_whole,
            "prop_compass_pedestal": pedestal, "prop_magic_door": magic_door}
BUILDERS.update({"prop_compass_piece_%02d" % (k + 1): (lambda k=k: compass_piece(k)) for k in range(10)})
for n, f in BUILDERS.items():
    if not ONLY or n in ONLY:
        f()
