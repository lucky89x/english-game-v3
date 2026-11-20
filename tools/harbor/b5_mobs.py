"""Batch 5: rigged Map 2 monsters with "Idle" and "Walk" clips: crab, jellyfish, little pirate, octopus boss.
Rigid skinning: every part is weighted 1.0 to one bone. All bones point up (+Z) with roll 0, so a bone's
local frame is world X, Z, -Y; rotations below are given as world axes and converted by q().
"""
import bpy, math
from hlib import *  # noqa
from mathutils import Vector, Quaternion

FPS = 24


def q(axis, ang):
    """quaternion for a rotation about a WORLD axis, expressed in the bone's local frame"""
    a = Vector(axis).normalized()
    return Quaternion((a.x, a.z, -a.y), ang)


def lw(v):
    """world-space offset -> bone-local translation"""
    return (v[0], v[2], -v[1])


def make_rig(name, bones):
    """bones: [(name, head, parent)]; each bone points up 0.1 m from its head"""
    arm_data = bpy.data.armatures.new(name + "_rig")
    arm = bpy.data.objects.new(name + "_rig", arm_data)
    bpy.context.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')
    for bn, head, parent in bones:
        eb = arm_data.edit_bones.new(bn)
        eb.head = head
        eb.tail = Vector(head) + Vector((0, 0, 0.1))
        eb.roll = 0.0
        if parent:
            eb.parent = arm_data.edit_bones[parent]
    bpy.ops.object.mode_set(mode='OBJECT')
    for pb in arm.pose.bones:
        pb.rotation_mode = 'QUATERNION'
    return arm


def bind(mesh_obj, arm):
    mesh_obj.parent = arm
    md = mesh_obj.modifiers.new("Armature", 'ARMATURE')
    md.object = arm


def clip(arm, name, length, fn, step=2):
    """bake a clip: fn(t in [0,1)) -> {bone: (quat|None, world_offset|None, scale|None)}"""
    ad = arm.animation_data_create()
    act = bpy.data.actions.new(name)
    ad.action = act
    for f in range(0, length + 1, step):
        t = (f % length) / length
        pose = fn(t)
        for pb in arm.pose.bones:
            qq, off, sc = pose.get(pb.name, (None, None, None))
            pb.rotation_quaternion = qq or Quaternion()
            pb.location = lw(off) if off else (0, 0, 0)
            pb.scale = (sc[0], sc[2], sc[1]) if sc else (1, 1, 1)     # world (x, y, z) -> bone frame (x, z, y)
            pb.keyframe_insert("rotation_quaternion", frame=f + 1)
            pb.keyframe_insert("location", frame=f + 1)
            pb.keyframe_insert("scale", frame=f + 1)
    act.use_fake_user = True
    tr = ad.nla_tracks.new()
    tr.name = name
    tr.strips.new(name, 1, act)
    ad.action = None
    return act


def finish_rig(name, arm, fname):
    o = group(name, origin=None)
    bind(o, arm)
    bpy.context.scene.render.fps = FPS
    export(fname, objs=[o], anim=True)


S2 = 2 * math.pi


# ------------------------------------------------------------------ crab
def build_crab():
    reset()
    red = mat("crab_red", "#D9443A", rough=0.5)
    red2 = mat("crab_red_dark", "#A82E2B", rough=0.55)
    belly = mat("crab_belly", "#F3D9B5", rough=0.6)
    tip = mat("crab_tip", "#3A2A2A", rough=0.5)
    white = mat("eye_white", "#FFFFFF", rough=0.3)
    black = mat("eye_black", "#1B1B22", rough=0.3)
    legs = []
    bones = [("root", (0, 0, 0), None), ("body", (0, 0, 0.3), "root")]
    for side, sn in ((-1, "L"), (1, "R")):
        bones += [("arm_" + sn, (side * 0.36, -0.18, 0.32), "body"),
                  ("pincer_" + sn, (side * 0.6, -0.62, 0.47), "arm_" + sn)]
        for k, y in enumerate((-0.02, 0.13, 0.27)):
            bones.append(("leg_%s%d" % (sn, k + 1), (side * 0.36, y, 0.3), "body"))
            legs.append((side, sn, k + 1, y))
    arm = make_rig("crab", bones)
    s = len(OBJS)
    ball(0.4, (0, 0, 0.33), red, uv=(16, 8), scale=(1.18, 0.86, 0.5))
    ball(0.36, (0, 0.0, 0.26), belly, uv=(12, 6), scale=(1.1, 0.8, 0.33))
    for k in range(5):  # shell ridge bumps and side spikes
        x = (k - 2) * 0.13
        ball(0.06, (x, -0.06 + abs(x) * 0.3, 0.52 - abs(x) * 0.25), red2, sub=1, scale=(1, 1, 0.6))
    for side in (-1, 1):
        for k in range(3):
            cyl(0.05, 0.12, (side * (0.44 + k * 0.01), -0.12 + k * 0.12, 0.35), red2, 4, r2=0.0,
                rot=(0, side * math.pi / 2, 0))
        rod((side * 0.09, -0.24, 0.44), (side * 0.12, -0.28, 0.62), 0.025, 0.02, red, 6)
        ball(0.065, (side * 0.12, -0.29, 0.66), white, uv=(10, 6))
        ball(0.034, (side * 0.125, -0.345, 0.67), black, uv=(8, 5))
        box((0.09, 0.02, 0.025), (side * 0.12, -0.33, 0.745), black, rot=(0, side * 0.35, 0))  # brow
    box((0.12, 0.03, 0.02), (0, -0.33, 0.3), black)  # mouth line
    tag("body", s)
    for side, sn in ((-1, "L"), (1, "R")):
        s = len(OBJS)
        rod((side * 0.36, -0.18, 0.32), (side * 0.55, -0.42, 0.36), 0.06, 0.07, red, 8)
        ball(0.2, (side * 0.6, -0.62, 0.4), red, uv=(12, 7), scale=(0.9, 1.25, 0.7))
        cyl(0.09, 0.3, (side * 0.6, -0.86, 0.36), red, 6, r2=0.02, rot=(math.pi / 2, 0, 0), scale=(1, 0.7, 1))
        ball(0.03, (side * 0.6, -1.0, 0.36), tip, sub=1)
        tag("arm_" + sn, s)
        s = len(OBJS)
        cyl(0.08, 0.3, (side * 0.6, -0.85, 0.5), red2, 6, r2=0.02, rot=(math.pi / 2 + 0.25, 0, 0),
            scale=(1, 0.7, 1))
        ball(0.028, (side * 0.6, -0.99, 0.53), tip, sub=1)
        tag("pincer_" + sn, s)
    for side, sn, k, y in legs:
        s = len(OBJS)
        kn = (side * 0.62, y + 0.06, 0.4)
        ft = (side * 0.76, y + 0.1, 0.0)
        rod((side * 0.36, y, 0.3), kn, 0.045, 0.04, red, 6)
        ball(0.042, kn, red2, sub=1)
        rod(kn, ft, 0.038, 0.012, red, 6)
        tag("leg_%s%d" % (sn, k), s)

    def idle(t):
        p = {"body": (None, (0, 0, 0.015 * math.sin(S2 * t)), (1 + 0.02 * math.sin(S2 * t), 1, 1))}
        for side, sn in ((-1, "L"), (1, "R")):
            snap = max(0.0, math.sin(S2 * (2 * t + (0.25 if side > 0 else 0))))
            p["pincer_" + sn] = (q((1, 0, 0), -0.45 * snap), None, None)
            p["arm_" + sn] = (q((0, 1, 0), side * -0.12 * math.sin(S2 * t)), None, None)
        for side, sn, k, y in legs:
            p["leg_%s%d" % (sn, k)] = (q((0, 1, 0), side * 0.04 * math.sin(S2 * t + k)), None, None)
        return p

    def walk(t):
        p = {"body": (q((0, 0, 1), 0.06 * math.sin(S2 * t)), (0, 0, 0.03 * abs(math.sin(S2 * t))), None)}
        for side, sn in ((-1, "L"), (1, "R")):
            p["arm_" + sn] = (q((1, 0, 0), 0.15 * math.sin(S2 * t + (0 if side < 0 else math.pi))), None, None)
            p["pincer_" + sn] = (q((1, 0, 0), -0.2 - 0.2 * math.sin(S2 * t * 2)), None, None)
        for side, sn, k, y in legs:
            ph = S2 * t + (0 if (k + (side > 0)) % 2 else math.pi)
            yaw = 0.35 * math.sin(ph)
            lift = 0.3 * max(0.0, math.cos(ph))
            p["leg_%s%d" % (sn, k)] = (q((0, 0, 1), -side * yaw) @ q((0, 1, 0), side * -lift), None, None)
        return p
    clip(arm, "Idle", 48, idle)
    clip(arm, "Walk", 24, walk)
    finish_rig("crab", arm, "harbor_mob_crab_v01")


# ------------------------------------------------------------------ jellyfish
def build_jellyfish():
    reset()
    bell_m = mat("jelly_purple", "#A86FE0", rough=0.25)
    bell2 = mat("jelly_purple_light", "#D2A8F5", rough=0.25)
    glow = mat("light_glow", "#F0C8FF", emit=2.5)
    tent = mat("jelly_tentacle", "#C79AF0", rough=0.3)
    black = mat("eye_black", "#1B1B22", rough=0.3)
    white = mat("eye_white", "#FFFFFF", rough=0.3)
    N = 6
    bones = [("root", (0, 0, 0), None), ("bell", (0, 0, 0.62), "root")]
    for i in range(N):
        a = i * S2 / N + 0.3
        r = 0.27
        bones += [("tent_%da" % i, (r * math.cos(a), r * math.sin(a), 0.56), "bell"),
                  ("tent_%db" % i, (r * 1.1 * math.cos(a), r * 1.1 * math.sin(a), 0.3), "tent_%da" % i)]
    bones += [("arms", (0, 0, 0.6), "bell")]
    arm = make_rig("jellyfish", bones)
    s = len(OBJS)
    lathe([(0.0, 1.06), (0.16, 1.04), (0.28, 0.98), (0.36, 0.86), (0.39, 0.72), (0.37, 0.62), (0.3, 0.6),
           (0.22, 0.64), (0.0, 0.64)], [bell_m, bell2], seg=16, mats=[0, 0, 0, 0, 0, 1, 1, 1])
    ball(0.17, (0, 0, 0.78), glow, uv=(10, 6), scale=(1, 1, 0.8))
    for k in range(6):  # glowing spots on the bell
        a = k * S2 / 6
        ball(0.04, (0.27 * math.cos(a), 0.27 * math.sin(a), 0.96), glow, sub=1, scale=(1, 1, 0.5))
    for i in range(8):  # scalloped rim
        a = i * S2 / 8
        ball(0.07, (0.36 * math.cos(a), 0.36 * math.sin(a), 0.62), bell2, sub=1, scale=(1, 1, 0.6))
    for side in (-1, 1):
        ball(0.055, (side * 0.13, -0.34, 0.78), white, uv=(8, 5), scale=(1, 0.6, 1.1))
        ball(0.032, (side * 0.13, -0.37, 0.77), black, uv=(8, 5), scale=(1, 0.6, 1.2))
    tag("bell", s)
    for i in range(N):
        a = i * S2 / N + 0.3
        c, sn = math.cos(a), math.sin(a)
        r = 0.27
        pts = [(r * c, r * sn, 0.58), (r * 1.08 * c, r * 1.08 * sn, 0.44), (r * 1.1 * c, r * 1.1 * sn, 0.3),
               (r * 1.0 * c + 0.03, r * 1.0 * sn, 0.16), (r * 1.05 * c, r * 1.05 * sn, 0.03)]
        s = len(OBJS)
        rod(pts[0], pts[1], 0.032, 0.028, tent, 6)
        rod(pts[1], pts[2], 0.028, 0.024, tent, 6)
        tag("tent_%da" % i, s)
        s = len(OBJS)
        rod(pts[2], pts[3], 0.024, 0.016, tent, 6)
        rod(pts[3], pts[4], 0.016, 0.006, tent, 6)
        ball(0.02, pts[4], glow, sub=1)
        tag("tent_%db" % i, s)
    s = len(OBJS)
    for i in range(4):  # frilly oral arms in the middle
        a = i * S2 / 4
        for k in range(4):
            ball(0.06 - k * 0.008, (0.07 * math.cos(a), 0.07 * math.sin(a), 0.55 - k * 0.1), bell2, sub=1,
                 scale=(1.3, 0.5, 1), rot=(0, 0, a + k * 0.6))
    tag("arms", s)

    def idle(t):
        pulse = math.sin(S2 * t)
        p = {"root": (None, (0, 0, 0.06 * math.sin(S2 * t)), None),
             "bell": (None, None, (1 + 0.06 * pulse, 1 - 0.05 * pulse, 1 + 0.06 * pulse))}
        for i in range(N):
            a = i * S2 / N + 0.3
            ax = (-math.sin(a), math.cos(a), 0)
            p["tent_%da" % i] = (q(ax, 0.12 * math.sin(S2 * t + i)), None, None)
            p["tent_%db" % i] = (q(ax, 0.2 * math.sin(S2 * t + i + 0.8)), None, None)
        p["arms"] = (q((0, 0, 1), 0.3 * math.sin(S2 * t)), None, None)
        return p

    def walk(t):
        pulse = math.sin(S2 * t * 2)
        p = {"root": (q((1, 0, 0), -0.18), (0, 0, 0.08 + 0.05 * pulse), None),
             "bell": (None, None, (1 + 0.1 * pulse, 1 - 0.08 * pulse, 1 + 0.1 * pulse))}
        for i in range(N):
            a = i * S2 / N + 0.3
            ax = (-math.sin(a), math.cos(a), 0)
            trail = 0.25 * max(0.0, math.sin(a))  # tentacles at the back trail more
            p["tent_%da" % i] = (q((1, 0, 0), 0.2) @ q(ax, 0.15 * math.sin(S2 * 2 * t + i) + trail), None, None)
            p["tent_%db" % i] = (q((1, 0, 0), 0.25) @ q(ax, 0.25 * math.sin(S2 * 2 * t + i + 1)), None, None)
        p["arms"] = (q((1, 0, 0), 0.25), None, None)
        return p
    clip(arm, "Idle", 48, idle)
    clip(arm, "Walk", 24, walk)
    finish_rig("jellyfish", arm, "harbor_mob_jellyfish_v01")


# ------------------------------------------------------------------ little pirate
def build_pirate():
    reset()
    skin = mat("skin_tan", "#E9B48C", rough=0.6)
    red = mat("bandana_red", "#D23A33", rough=0.6)
    red2 = mat("vest_red", "#8E2A2E", rough=0.7)
    navy = mat("stripe_navy", "#2C3E66", rough=0.7)
    white = mat("shirt_white", "#F6F5F1", rough=0.65)
    pants = mat("pants_brown", "#6A4B34", rough=0.8)
    boot = mat("boot_black", "#2A2626", rough=0.6)
    belt = mat("belt_brown", "#4A3220", rough=0.6)
    gold = mat("gold", "#D4AF47", rough=0.3, metal=0.85)
    wood = mat("wood_sword", "#B98550", rough=0.8)
    wood2 = mat("wood_sword_dark", "#7A5230", rough=0.8)
    black = mat("eye_black", "#1B1B22", rough=0.3)
    ewhite = mat("eye_white", "#FFFFFF", rough=0.3)
    hair = mat("hair_dark", "#3B2A22", rough=0.7)
    bones = [("root", (0, 0, 0), None), ("hips", (0, 0, 0.48), "root"), ("spine", (0, 0, 0.56), "hips"),
             ("head", (0, 0, 0.8), "spine"),
             ("arm_L", (-0.19, 0, 0.75), "spine"), ("arm_R", (0.19, 0, 0.75), "spine"),
             ("leg_L", (-0.085, 0, 0.47), "hips"), ("leg_R", (0.085, 0, 0.47), "hips")]
    arm = make_rig("pirate", bones)
    for side, sn in ((-1, "L"), (1, "R")):
        s = len(OBJS)
        rod((side * 0.085, 0, 0.48), (side * 0.095, 0, 0.18), 0.068, 0.058, pants, 8)
        rod((side * 0.095, 0, 0.2), (side * 0.095, 0, 0.04), 0.068, 0.07, boot, 8)
        ball(0.075, (side * 0.095, -0.06, 0.045), boot, uv=(8, 5), scale=(0.95, 1.5, 0.6))
        torus(0.07, 0.015, (side * 0.095, 0, 0.2), boot, 8, 3)
        tag("leg_" + sn, s)
    s = len(OBJS)
    ball(0.15, (0, 0, 0.5), pants, uv=(10, 6), scale=(1.1, 0.85, 0.6))
    torus(0.15, 0.025, (0, 0, 0.52), belt, 12, 4, rot=(0, 0, 0))
    OBJS[-1].scale = (1.05, 0.82, 1)
    box((0.08, 0.02, 0.06), (0, -0.13, 0.52), gold, bev=0.006)
    tag("hips", s)
    s = len(OBJS)
    prof = [(0, 0.52), (0.155, 0.52)] + [(0.155 - 0.012 * k, 0.54 + k * 0.045) for k in range(6)] + [(0.07, 0.8),
                                                                                                    (0, 0.81)]
    lathe(prof, [white, navy], seg=12, scale=(1, 0.8, 1), mats=[0, 0, 1, 0, 1, 0, 1, 0, 0])
    for sx in (-1, 1):  # open vest panels
        box((0.1, 0.03, 0.26), (sx * 0.1, -0.11, 0.66), red2, rot=(0, 0, sx * -0.25), bev=0.008)
        box((0.07, 0.2, 0.26), (sx * 0.15, 0.02, 0.66), red2, bev=0.008)
    box((0.24, 0.04, 0.26), (0, 0.12, 0.66), red2, bev=0.008)
    tag("spine", s)
    s = len(OBJS)
    hz = 0.98
    ball(0.175, (0, 0, hz), skin, uv=(14, 9), scale=(1, 0.95, 0.98))
    lathe([(0.0, hz + 0.19), (0.1, hz + 0.17), (0.165, hz + 0.1), (0.183, hz + 0.03), (0.183, hz + 0.0),
           (0.0, hz + 0.0)], red, seg=14, scale=(1, 1, 1))
    for k in range(5):  # white polka dots on the bandana
        a = k * 1.25 + 0.4
        ball(0.018, (0.15 * math.cos(a), 0.15 * math.sin(a) * 0.9 - 0.02, hz + 0.1), white, sub=1,
             scale=(1, 1, 0.5))
    ball(0.045, (0.0, 0.18, hz + 0.06), red, sub=1)  # knot at the back + two tails
    rod((0.0, 0.2, hz + 0.05), (0.06, 0.3, hz - 0.08), 0.03, 0.015, red, 5)
    rod((0.0, 0.2, hz + 0.05), (-0.05, 0.28, hz - 0.1), 0.03, 0.015, red, 5)
    for sx in (-1, 1):  # hair tufts under the bandana
        ball(0.05, (sx * 0.15, 0.03, hz - 0.02), hair, sub=1, scale=(0.6, 1, 1))
    ball(0.04, (-0.065, -0.155, hz - 0.01), ewhite, uv=(8, 5), scale=(1, 0.5, 1.2))  # left eye
    ball(0.024, (-0.065, -0.172, hz - 0.015), black, uv=(6, 4), scale=(1, 0.5, 1.2))
    ball(0.045, (0.07, -0.152, hz - 0.005), black, uv=(8, 5), scale=(1, 0.4, 0.9))  # eye patch
    rod((0.07, -0.16, hz + 0.03), (-0.17, -0.02, hz + 0.08), 0.008, 0.008, black, 4)
    box((0.05, 0.015, 0.012), (-0.065, -0.165, hz + 0.055), hair, rot=(0, 0.25, 0))  # brow
    ball(0.025, (0.0, -0.177, hz - 0.05), skin, sub=1)  # nose
    box((0.06, 0.012, 0.012), (0.01, -0.165, hz - 0.1), black, rot=(0, -0.2, 0))  # smirk
    torus(0.018, 0.005, (-0.178, -0.0, hz - 0.06), gold, 8, 3, rot=(0, math.pi / 2, 0))  # earring
    tag("head", s)
    for side, sn in ((-1, "L"), (1, "R")):
        s = len(OBJS)
        sh = (side * 0.17, 0, 0.75)
        el = (side * 0.24, 0.0, 0.6)
        wr = (side * 0.25, -0.06 if side > 0 else 0.0, 0.47)
        rod(sh, el, 0.055, 0.048, white, 8)
        rod(el, wr, 0.046, 0.04, white, 8)
        ball(0.05, wr, skin, uv=(8, 5))
        if side > 0:  # wooden sword in the right hand, pointing forward and up
            g0 = Vector(wr)
            d = Vector((0.0, -0.75, 0.6)).normalized()
            rod(g0 - d * 0.07, g0 + d * 0.05, 0.02, 0.02, wood2, 6)
            box((0.15, 0.03, 0.04), tuple(g0 + d * 0.07), wood2, rot=(math.atan2(-d.y, d.z), 0, 0))
            bl0, bl1 = g0 + d * 0.09, g0 + d * 0.5
            beam(tuple(bl0), tuple(bl1), 0.07, wood, 0.02)
            cyl(0.035, 0.07, tuple(bl1 + d * 0.03), wood, 4, r2=0.0, rot=(-math.atan2(d.y, d.z) + 0, 0, 0),
                scale=(1, 0.3, 1))
        tag("arm_" + sn, s)

    def idle(t):
        b = math.sin(S2 * t)
        return {"spine": (q((0, 0, 1), 0.05 * b), None, (1, 1, 1 + 0.015 * b)),
                "head": (q((0, 0, 1), 0.15 * math.sin(S2 * t + 1)) @ q((1, 0, 0), 0.04 * b), None, None),
                "arm_L": (q((0, 1, 0), 0.06 * b), None, None),
                "arm_R": (q((1, 0, 0), -0.12 - 0.08 * b), None, None),
                "hips": (None, (0, 0, -0.006 * b), None)}

    def walk(t):
        sw = math.sin(S2 * t)
        return {"hips": (q((0, 0, 1), 0.1 * sw), (0, 0, 0.025 * abs(math.cos(S2 * t))), None),
                "spine": (q((0, 0, 1), -0.14 * sw) @ q((1, 0, 0), -0.06), None, None),
                "head": (q((0, 0, 1), 0.06 * sw), None, None),
                "leg_L": (q((1, 0, 0), 0.55 * sw), None, None),
                "leg_R": (q((1, 0, 0), -0.55 * sw), None, None),
                "arm_L": (q((1, 0, 0), -0.5 * sw), None, None),
                "arm_R": (q((1, 0, 0), -0.25 + 0.25 * sw), None, None)}
    clip(arm, "Idle", 48, idle)
    clip(arm, "Walk", 24, walk)
    finish_rig("pirate", arm, "harbor_mob_pirate_v01")


# ------------------------------------------------------------------ boss: giant octopus captain
def build_octopus():
    reset()
    skin = mat("octo_magenta", "#C2416B", rough=0.45)
    skin2 = mat("octo_magenta_light", "#E57C98", rough=0.45)
    sucker = mat("octo_sucker", "#F6D2C8", rough=0.5)
    white = mat("eye_white", "#FFFFFF", rough=0.3)
    black = mat("eye_black", "#1B1B22", rough=0.3)
    gold = mat("gold", "#D4AF47", rough=0.3, metal=0.85)
    navy = mat("hat_navy", "#1F2D4F", rough=0.6)
    hatw = mat("hat_white", "#F4F2EC", rough=0.6)
    visor = mat("visor_black", "#15161A", rough=0.3)
    NT = 8
    bones = [("root", (0, 0, 0), None), ("body", (0, 0, 1.3), "root"), ("head", (0, 0, 2.2), "body")]
    paths = []
    for i in range(NT):
        a = i * S2 / NT + S2 / 16
        c, s_ = math.cos(a), math.sin(a)
        pts = [(0.75 * c, 0.75 * s_, 1.3), (1.55 * c, 1.55 * s_, 0.55), (2.25 * c, 2.25 * s_, 0.2),
               (2.75 * c, 2.75 * s_, 0.42), (2.85 * c, 2.85 * s_, 0.75)]
        rads = [0.42, 0.3, 0.2, 0.11, 0.035]
        paths.append((a, pts, rads))
        bones += [("tent_%d_1" % i, pts[0], "body"), ("tent_%d_2" % i, pts[1], "tent_%d_1" % i),
                  ("tent_%d_3" % i, pts[2], "tent_%d_2" % i)]
    bones.append(("fx", (0, -1.35, 1.45), "body"))
    arm = make_rig("octopus", bones)
    s = len(OBJS)
    lathe([(0.0, 0.95), (0.85, 1.0), (1.05, 1.3), (1.15, 1.7)], skin, seg=18, scale=(1, 0.95, 1))
    tag("body", s)
    s = len(OBJS)
    lathe([(1.15, 1.7), (1.3, 2.2), (1.32, 2.7), (1.2, 3.15), (0.9, 3.5), (0.45, 3.68), (0.0, 3.72)], skin,
          seg=18, scale=(1, 0.95, 1))
    for k, (a, z, r) in enumerate(((0.6, 3.0, 0.12), (2.0, 2.8, 0.1), (2.7, 3.2, 0.09), (4.0, 2.6, 0.13),
                                   (5.2, 3.1, 0.1), (3.3, 2.4, 0.11))):  # lighter spots on the mantle
        ball(r, (1.25 * math.cos(a) * (0.95 if z < 3.1 else 0.85), 1.2 * math.sin(a) * (0.95 if z < 3.1 else 0.85),
                 z), skin2, sub=1, scale=(1, 1, 0.55))
    for side in (-1, 1):  # big eyes with heavy brows
        ball(0.34, (side * 0.48, -1.07, 2.25), white, uv=(14, 8), scale=(1, 0.55, 1.15))
        ball(0.17, (side * 0.45, -1.24, 2.2), black, uv=(10, 6), scale=(1, 0.5, 1.2))
        ball(0.05, (side * 0.41, -1.3, 2.3), white, sub=1)
        box((0.55, 0.14, 0.11), (side * 0.5, -1.15, 2.68), skin2, rot=(0.25, side * 0.3, 0), bev=0.03)
    rod((0, -1.0, 1.55), (0, -1.3, 1.45), 0.16, 0.12, skin2, 10)  # siphon / mouth
    ball(0.09, (0, -1.32, 1.45), black, sub=1, scale=(1, 0.4, 1))
    # captain's hat: crown, gold band, white top, black visor, anchor badge
    hz = 3.38
    lathe([(0.0, hz), (0.86, hz), (0.95, hz + 0.32), (1.12, hz + 0.6), (1.12, hz + 0.7), (0.0, hz + 0.72)],
          [navy, hatw], seg=18, mats=[0, 0, 0, 1, 1])
    torus(0.9, 0.06, (0, 0, hz + 0.1), gold, 18, 4)
    ball(0.8, (0, -0.55, hz - 0.02), visor, uv=(12, 4), scale=(1.05, 0.75, 0.13), rot=(-0.2, 0, 0))
    box((0.28, 0.06, 0.28), (0, -0.95, hz + 0.32), gold, rot=(0.35, 0, 0), bev=0.02)
    cyl(0.02, 0.2, (0, -0.99, hz + 0.33), navy, 4, rot=(0.35, 0, 0))
    tag("head", s)
    for i, (a, pts, rads) in enumerate(paths):
        for seg in range(3):
            s = len(OBJS)
            p0, p1 = pts[seg], pts[seg + 1]
            rod(p0, p1, rads[seg], rads[seg + 1], skin, 10)
            ball(rads[seg + 1] * 1.01, p1, skin, uv=(10, 6))
            if seg == 2:
                rod(pts[3], pts[4], rads[3], rads[4], skin, 8)
            for k in (0.3, 0.7):  # suckers on the underside
                pp = Vector(p0).lerp(Vector(p1), k)
                rr = rads[seg] + (rads[seg + 1] - rads[seg]) * k
                ball(rr * 0.42, (pp.x, pp.y, pp.z - rr * 0.82), sucker, uv=(8, 4), scale=(1, 1, 0.35))
            tag("tent_%d_%d" % (i, seg + 1), s)

    def idle(t):
        b = math.sin(S2 * t)
        p = {"body": (None, (0, 0, 0.05 * b), (1 + 0.02 * b, 1, 1 - 0.015 * b)),
             "head": (q((0, 1, 0), 0.04 * math.sin(S2 * t + 1)), None, None)}
        for i, (a, pts, rads) in enumerate(paths):
            ax = (-math.sin(a), math.cos(a), 0)
            for seg in range(3):
                w = math.sin(S2 * t + i * 0.8 + seg * 0.9)
                p["tent_%d_%d" % (i, seg + 1)] = (q(ax, -0.08 * w * (seg + 1)), None, None)
        return p

    def walk(t):
        sw = math.sin(S2 * t)
        p = {"body": (q((0, 0, 1), 0.08 * sw) @ q((1, 0, 0), -0.06), (0, 0, 0.1 * abs(sw)), None),
             "head": (q((0, 1, 0), 0.06 * sw), None, None)}
        for i, (a, pts, rads) in enumerate(paths):
            ax = (-math.sin(a), math.cos(a), 0)
            ph = S2 * t + (0 if i % 2 else math.pi)
            lift = 0.25 * max(0.0, math.sin(ph))
            for seg in range(3):
                curl = 0.12 * math.sin(ph + seg * 1.1)
                p["tent_%d_%d" % (i, seg + 1)] = (q(ax, (-lift if seg == 0 else 0.0) + curl), None, None)
        return p
    clip(arm, "Idle", 48, idle)
    clip(arm, "Walk", 32, walk)

    def bump(t, a, b):
        return 0.0 if t <= a or t >= b else math.sin(math.pi * (t - a) / (b - a))

    def cast(t):   # v02: rears up and squirts burning ink from the siphon (fx bone)
        up = bump(t, 0, 1)
        p = {"body": (q((1, 0, 0), -.25 * up), (0, 0, .25 * up), None), "head": (q((1, 0, 0), -.15 * up), None, None),
             "fx": (None, None, (1 + 2 * bump(t, .35, 1),) * 3)}
        for i, (a, pts, rads) in enumerate(paths):
            ax = (-math.sin(a), math.cos(a), 0)
            p["tent_%d_1" % i] = (q(ax, -.35 * up), None, None)
        return p

    def death(t):   # deflates and the tentacles go limp
        f = min(1.0, t / .85)
        f = f * f * (3 - 2 * f)
        p = {"body": (None, (0, 0, -.5 * f), (1 + .2 * f, 1 + .2 * f, max(.45, 1 - .55 * f))), "head": (q((0, 1, 0), .35 * f), None, None)}
        for i, (a, pts, rads) in enumerate(paths):
            ax = (-math.sin(a), math.cos(a), 0)
            for seg in range(3):
                p["tent_%d_%d" % (i, seg + 1)] = (q(ax, .25 * f), None, None)
        return p
    clip(arm, "Cast", 24, cast, step=1)
    clip(arm, "Death", 29, death, step=1)
    finish_rig("octopus_boss", arm, "harbor_boss_octopus_v02")


BUILDERS = {"harbor_mob_crab": build_crab, "harbor_mob_jellyfish": build_jellyfish,
            "harbor_mob_pirate": build_pirate, "harbor_boss_octopus": build_octopus}
