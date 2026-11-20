"""Build npc_tom_elder_v03 — chibi village elder Tom (docs/reference_art/03_characters_village_elders.jpg, first figure).
v03 (20/11): high bald forehead with hair swept back into a wave, smoother white beard, wider A-line robe with a cape
behind and blue/gold lapels, chevrons on the cream front, wide bell sleeves, thicker gnarled staff, bigger lantern.

Run from the repository root:  python tools/chibi05/build_tom_chibi.py   (bpy module)
                          or:  blender --background --python tools/chibi05/build_tom_chibi.py
Blue robe with gold trim open over a cream under-robe, leather belt and pouch, gold
medallion, fluffy white hair/eyebrows/moustache/beard, round nose, laughing face and a
gnarled wooden staff with a glowing lantern in his right hand.
"""
import bpy  # noqa: F401  (must load before mathutils)
import math, os, sys
from pathlib import Path
from mathutils import Vector, Quaternion, Matrix

ROOT = Path(os.environ.get('NGOC_ROOT', os.getcwd()))
sys.path.insert(0, str(ROOT / 'tools/chibi05'))
from chibi_lib import *  # noqa
import chibi_lib as L

NAME = 'npc_tom_elder_v03'
OUT = ROOT / 'assets/npc/models'
SRC = ROOT / 'art_source/chibi05'
SKIN = (249, 185, 142)
PAL = {   # v03: colours measured on the reference (royal-blue robe, violet cape, warm cream, peach skin, red-brown wood/leather)
    'skin': ('f9b98e', .62, 0), 'skin_dark': ('ee9e74', .62, 0), 'nose': ('f6a080', .55, 0),
    'white': ('fbf3e6', .75, 0), 'white_shade': ('e6d6c4', .8, 0), 'white_light': ('fffaf0', .7, 0),
    'robe': ('3b55b8', .7, 0), 'robe_dark': ('5a4aa6', .75, 0), 'cream': ('f6e2b8', .8, 0), 'cream_shade': ('e8c890', .8, 0),
    'gold': ('f0bc48', .3, .85), 'gold_dark': ('c88e2a', .35, .8),
    'leather': ('8c3e1a', .55, 0), 'leather_dark': ('62280e', .6, 0), 'shoe': ('6a3216', .5, 0), 'sole': ('3a1a0a', .7, 0),
    'wood': ('9a5434', .7, 0), 'wood_dark': ('6e3820', .75, 0), 'brass': ('d8a040', .32, .75), 'glass': ('ffc860', .2, 0),
    'tassel': ('4963bb', .7, 0),
}
FACE_ARGS = dict(skin=SKIN, eye_x=.100, eye_z=-.018, eye_w=.084, eye_h=.080, mouth_z=-.112, mouth_w=.050, blush=(240, 120, 110, 190))
faces = {
    'happy': paint_face(eyes='happy', mouth='laugh', **FACE_ARGS),
    'talk': paint_face(eyes='happy', mouth='talk', **FACE_ARGS),
    'blink': paint_face(eyes='closed', mouth='laugh', **FACE_ARGS),
}
init(NAME, PAL, OUT, SRC, faces)

HZ = 1.02
HA, HB, HC = .270, .245, .255
SHOULDER = (.165, 0.0, .700)
ARM_DIR = Vector((.62, .0, -.78)).normalized()
UPPER, FORE, HAND = .115, .105, .070
HIP_X = .085

# ---------------------------------------------------------------- head & face
head = make_head('Tom_Head', (0, 0, HZ), (HA, HB, HC), nose=None)
nose = ellipsoid('Tom_Nose', (0, -.250, HZ - .055), (.056, .040, .047), seg=16, rings=10)
finish(nose, 'nose', ['head'])
for s in (-1, 1):
    finish(ellipsoid(f'Tom_Ear_{s}', (s * .262, .0, HZ - .02), (.040, .028, .058), seg=12, rings=8), 'skin', ['head'])

HEAD_TREE = bvh_of(head)
HC_W = Vector((0, 0, HZ))


def hdir(az, el):
    return Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))


def on_head(az, el, off=0.0):
    return surf(HEAD_TREE, HC_W, hdir(math.radians(az), math.radians(el)), off)


# white hair: receding cap swept back + fluffy side puffs over the ears
def cap_ridges(p, v):
    d = p.normalized()
    az = math.atan2(d.x, -d.y)
    el = math.asin(max(-1, min(1, d.z)))
    ridge = (.5 + .5 * math.cos(11 * az + 2.0 * math.sin(el * 2))) ** 2
    return lumpy(p + d * (.010 * ridge * smoothstep(-.4, .3, el)), d, .014, 7, .5)


cap = ellipsoid('Tom_HairCap', (0, .015, HZ + .012), (HA + .022, HB + .030, HC + .022), seg=56, rings=28, deform=cap_ridges)
cut_faces(cap, lambda c, n: (math.atan2(abs(c.x), -c.y) < 1.3 and c.z - HZ < .225) or (c.z - HZ < -.100 and c.y < .05)
          or c.z - HZ < -.17)
finish(cap, 'white', ['head'])
for s in (-1, 1):
    for k, (az, el, r) in enumerate([(78, 8, .085), (96, -6, .080), (112, 10, .075), (128, -4, .07)]):
        p, n = on_head(az * s, el, .025)
        puff = ellipsoid(f'Tom_SidePuff_{s}_{k}', p, (r * .8, r * .72, r * .85), seg=14, rings=9,
                         deform=lambda q, v, k=k: lumpy(q, v, .006, 5, k))
        finish(puff, ['white_light', 'white'][k % 2], ['head'])
# hairline: a few soft puffs only at the temples (the forehead stays bare, like the reference)
for s_ in (-1, 1):
    for k, (az, el) in enumerate([(62, 22), (74, 12)]):
        p, n = on_head(s_ * az, el, .020)
        hp_ = ellipsoid(f'Tom_Temple_{s_}_{k}', p, (.050, .042, .046), seg=12, rings=8,
                        rot=Vector((0, 0, 1)).rotation_difference(n), deform=lambda q, v, k=k: lumpy(q, v, .005, 5, k))
        finish(hp_, 'white_light', ['head'])
# hair swept back over the crown: thick tapering locks from the hairline to the nape
for k, az in enumerate((-48, -24, 0, 24, 48)):
    pts = [on_head(az * (1 - .25 * t), 60 + 100 * t, .030 + .012 * math.sin(math.pi * t))[0] for t in [i_ / 8 for i_ in range(9)]]
    finish(curve_tube(f'Tom_Lock_{k}', pts, .050 - .006 * abs(k - 2), .018), ['white_light', 'white'][k % 2], ['head'])
# the big wave rising off the top-front of the head
p, n = on_head(-6, 66, .055)
wave = ellipsoid('Tom_Wave', p, (.115, .085, .062), seg=20, rings=12,
                 rot=Vector((0, 0, 1)).rotation_difference(n) @ Quaternion((0, 0, 1), math.radians(-14)), deform=lambda q, v: lumpy(q, v, .006, 4, 2))
finish(wave, 'white_light', ['head'])
p, n = on_head(18, 62, .045)
finish(ellipsoid('Tom_Wave2', p, (.080, .065, .050), seg=16, rings=10, rot=Vector((0, 0, 1)).rotation_difference(n)), 'white', ['head'])
# bushy eyebrows
for s in (-1, 1):
    p, n = on_head(s * 23, 10, .010)
    br = ellipsoid(f'Tom_Brow_{s}', p, (.050, .022, .020), seg=12, rings=8,
                   rot=Vector((0, 0, 1)).rotation_difference(n) @ Quaternion((0, 0, 1), math.radians(-12 * s)),
                   deform=lambda q, v: lumpy(q, v, .006, 7, 1))
    finish(br, 'white', ['head'])
# moustache: two big curled puffs under the nose
for s in (-1, 1):
    m = ellipsoid(f'Tom_Moustache_{s}', (s * .060, -.252, HZ - .082), (.070, .036, .032), seg=16, rings=10,
                  rot=Quaternion((0, 1, 0), math.radians(-14 * s)) @ Quaternion((0, 0, 1), math.radians(-18 * s)),
                  deform=lambda q, v: lumpy(q, v, .006, 6, 2))
    finish(m, 'white_light', ['head'])
    tip = curve_tube(f'Tom_MoustacheCurl_{s}', helix((s * .122, -.232, HZ - .092), (s, .3, .5), .03, .014, .9, n=12, phase=0 if s > 0 else math.pi), .018, .008)
    finish(tip, 'white', ['head'])
# beard: big lumpy mass below the mouth plus cheek tufts
beard = ellipsoid('Tom_Beard', (0, -.130, HZ - .290), (.240, .150, .175), seg=30, rings=18,
                  deform=lambda q, v: lumpy(q + Vector((0, 0, -.05 * max(0, -v.z) ** 2)), v, .007, 5, 3))
finish(beard, 'white_light', ['head'])
for s in (-1, 1):
    for k, (x, y, z, r) in enumerate([(.200, -.080, -.150, .095), (.150, -.150, -.230, .090), (.090, -.200, -.330, .080)]):
        t = ellipsoid(f'Tom_BeardTuft_{s}_{k}', (s * x, y, HZ + z), (r, r * .9, r), seg=14, rings=9,
                      deform=lambda q, v, k=k: lumpy(q, v, .006, 5, k + s))
        finish(t, ['white', 'white_light', 'white'][k], ['head'])
tipb = ellipsoid('Tom_BeardTip', (0, -.170, HZ - .445), (.095, .080, .075), seg=14, rings=9)
finish(tipb, 'white', ['head'])

# ---------------------------------------------------------------- body: robe, belt, medallion
ROBE_BONES = [('hips', 6.0), 'spine', 'chest', 'thigh.L', 'thigh.R']
ROBE = [((0, .010, .055), .335, .305), ((0, .010, .140), .310, .282), ((0, .008, .280), .268, .240), ((0, .000, .420), .228, .205),
        ((0, -.005, .530), .214, .192), ((0, .000, .630), .196, .170), ((0, .004, .700), .165, .140), ((0, .006, .750), .110, .095),
        ((0, .006, .780), .060, .060)]


def hem_wave(a, i):
    return 1 + (.035 * math.sin(a * 7) if i == 0 else 0)


inner = loft('Tom_UnderRobe', [(c, ra * .965, rb * .965) for c, ra, rb in ROBE], seg=32, caps=(True, True), ref=Vector((1, 0, 0)))
finish(inner, 'cream', ROBE_BONES, subsurf=1)
INNER_TREE = bvh_of(inner)
robe = loft('Tom_Robe', ROBE, seg=32, caps=(True, False), ref=Vector((1, 0, 0)), shape=hem_wave)
GAP = math.radians(20)
cut_faces(robe, lambda c, n: abs(math.atan2(c.x, -c.y)) < GAP + .05 * (c.z < .6) and c.z < .69 and c.y < 0)
finish(robe, 'robe', ROBE_BONES, subsurf=1)
ROBE_TREE = bvh_of(robe)
for s in (-1, 1):
    pts = [surf(ROBE_TREE, (0, 0, z), (math.sin(s * (GAP + .03)), -math.cos(GAP + .03), 0), .006)[0] for z in [.07 + i * .08 for i in range(8)]]
    finish(tube(f'Tom_Trim_{s}', pts, [.016] * len(pts), seg=8), 'gold', ROBE_BONES)
    pts2 = [surf(ROBE_TREE, (0, 0, z), (math.sin(s * (GAP + .32)), -math.cos(GAP + .32), 0), .008)[0] for z in [.07 + i * .08 for i in range(8)]]
    finish(tube(f'Tom_Trim2_{s}', pts2, [.012] * len(pts2), seg=8), 'gold', ROBE_BONES)
    for z in (.2, .36, .52):     # small gold stars on the lapel
        pp, nn = surf(ROBE_TREE, (0, 0, z), (math.sin(s * (GAP + .17)), -math.cos(GAP + .17), 0), .006)
        finish(ellipsoid(f'Tom_LapelStar_{s}_{z}', pp, (.016, .016, .016), seg=8, rings=5), 'gold', ROBE_BONES)
    # gold zig-zag motif near the hem
    for k in range(3):
        a = s * (GAP + .35 + k * .45)
        p, n = surf(ROBE_TREE, (0, 0, .16), (math.sin(a), -math.cos(a), 0), .004)
        tri = loft(f'Tom_HemMotif_{s}_{k}', [(p + Vector((0, 0, -.04)), .004, .028, 0, n), (p + Vector((0, 0, .03)), .004, .004, 0, n)], seg=6)
        finish(tri, 'gold', ROBE_BONES)
for k, zc in enumerate((.17, .25)):      # gold chevrons on the cream front
    pts = [surf(INNER_TREE, (0, 0, zc + .055 * abs(x) / .085), (x, -1, 0), .004)[0] for x in (-.085, -.04, 0, .04, .085)]
    finish(tube(f'Tom_Chevron_{k}', pts, [.012] * 5, seg=6), 'gold', ROBE_BONES)
CAPE = [((0, .035, .750), .175, .150), ((0, .045, .640), .225, .200), ((0, .050, .480), .262, .238), ((0, .050, .300), .300, .272),
        ((0, .050, .120), .345, .318), ((0, .050, .050), .352, .325)]
cape = loft('Tom_Cape', CAPE, seg=32, caps=(False, False), ref=Vector((1, 0, 0)), shape=lambda a, i: 1 + (.03 * math.sin(a * 6) if i >= 4 else 0))
cut_faces(cape, lambda c, n: c.y < .0 - .12 * (c.z > .6))
finish(cape, 'robe_dark', ROBE_BONES, subsurf=1)
hem = torus('Tom_HemTrim', (0, .01, .062), .328, .011, seg=48, rseg=6, sy=.298 / .328)
finish(hem, 'gold', ROBE_BONES)
inner_hem = torus('Tom_InnerHem', (0, .01, .052), .322, .010, seg=48, rseg=6, sy=.295 / .322)
finish(inner_hem, 'cream_shade', ROBE_BONES)
belt = torus('Tom_Belt', (0, .0, .430), .226, .024, seg=48, rseg=8, sy=.198 / .218)
for v in belt.data.vertices:
    v.co.z += (v.co.z - .430) * .5
finish(belt, 'leather', ['hips', 'spine'])
finish(torus('Tom_Buckle', (0, -.212, .430), .040, .010, seg=4, rseg=6, rot=Quaternion((1, 0, 0), math.radians(90)) @ Quaternion((0, 0, 1), math.radians(45))),
       'gold', ['hips'], smooth=False)
PC = Vector((.180, -.135, .380))
finish(loft('Tom_Pouch', [(PC + Vector((0, 0, -.045)), .050, .028), (PC, .055, .032), (PC + Vector((0, 0, .045)), .052, .030)], seg=14,
            ref=Vector((.8, -.6, 0))), 'leather', ['hips'], subsurf=1)
finish(ellipsoid('Tom_PouchFlap', PC + Vector((.010, -.030, .030)), (.052, .014, .026), seg=12, rings=8,
                 rot=Quaternion((0, 0, 1), math.radians(35))), 'leather_dark', ['hips'])
finish(ellipsoid('Tom_PouchStud', PC + Vector((.022, -.046, .018)), (.010, .006, .010), seg=8, rings=6), 'gold', ['hips'])
# medallion on a gold chain, resting on the beard/chest
finish(torus('Tom_Medallion', (0, -.222, .515), .054, .014, seg=24, rseg=8, rot=Quaternion((1, 0, 0), math.radians(80))), 'gold', ['chest'])
finish(ellipsoid('Tom_MedallionFace', (0, -.228, .515), (.046, .010, .046), seg=16, rings=8), 'gold_dark', ['chest'])
finish(tube('Tom_Tassel', [(0, -.232, .405), (0, -.236, .330)], [.012, .030], seg=8), 'tassel', ['hips'])
# collar
col = torus('Tom_Collar', (0, .005, .755), .110, .030, seg=32, rseg=8, sy=.9)
finish(col, 'robe_dark', ['chest', 'neck'])
# folded hood behind the neck
hood = ellipsoid('Tom_Hood', (0, .105, .770), (.180, .105, .085), seg=22, rings=12, deform=lambda q, v: lumpy(q, v, .008, 5, 4))
finish(hood, 'robe', ['chest', 'neck'])
finish(torus('Tom_HoodTrim', (0, .105, .770), .150, .014, seg=32, rseg=6, sy=.6, rot=Quaternion((1, 0, 0), math.radians(-60))), 'gold', ['chest', 'neck'])

# ---------------------------------------------------------------- arms: bell sleeves + hands
for s, side in ((1, 'L'), (-1, 'R')):
    sh = Vector((s * SHOULDER[0], SHOULDER[1], SHOULDER[2]))
    d = Vector((s * ARM_DIR.x, ARM_DIR.y, ARM_DIR.z))
    sleeve = loft(f'Tom_Sleeve_{s}', [(sh - d * .04, .062, .062), (sh + d * .04, .074, .072), (sh + d * .13, .088, .084),
                                       (sh + d * .21, .125, .118)], seg=18, caps=(True, False))
    finish(sleeve, 'robe', ['chest', f'upper_arm.{side}', f'forearm.{side}'], subsurf=1)
    finish(torus(f'Tom_SleeveCuff_{s}', sh + d * .205, .118, .026, seg=22, rseg=6, rot=Vector((0, 0, 1)).rotation_difference(d)),
           'cream', [f'forearm.{side}'])
    finish(loft(f'Tom_SleeveLining_{s}', [(sh + d * .14, .090, .086), (sh + d * .205, .114, .108)], seg=18, caps=(False, False)),
           'cream', [f'forearm.{side}'])
    finish(torus(f'Tom_SleeveInCuff_{s}', sh + d * .182, .112, .009, seg=22, rseg=5, rot=Vector((0, 0, 1)).rotation_difference(d)),
           'gold', [f'forearm.{side}'])
    wrist = sh + d * (UPPER + FORE)
    finish(tube(f'Tom_Wrist_{s}', [wrist - d * .06, wrist + d * .01], [.030, .030], seg=10), 'skin', [f'forearm.{side}', f'hand.{side}'])
    hc = wrist + d * .040
    q = Vector((0, 0, 1)).rotation_difference(d)
    finish(ellipsoid(f'Tom_Hand_{s}', hc, (.040, .030, .048), seg=14, rings=10, rot=q), 'skin', [f'hand.{side}'])
    finish(ellipsoid(f'Tom_Thumb_{s}', hc + Vector((0, -.030, .010)) - d * .010, (.014, .014, .026), seg=10, rings=8,
                     rot=Vector((0, 0, 1)).rotation_difference((d + Vector((0, -.6, 0))).normalized())), 'skin', [f'hand.{side}'])

# shoes peeking under the robe
for s, side in ((1, 'L'), (-1, 'R')):
    shoe = ellipsoid(f'Tom_Shoe_{s}', (s * .090, -.075, .045), (.068, .110, .055), seg=18, rings=10,
                     deform=lambda p, v: Vector((p.x, p.y, p.z if p.z > 0 else p.z * .5)))
    finish(shoe, 'shoe', [f'foot.{side}'])
    finish(loft(f'Tom_Sole_{s}', [((s * .090, .02, .010), .066, .010), ((s * .090, -.08, .010), .070, .010), ((s * .090, -.175, .012), .050, .010)],
                seg=14, ref=Vector((1, 0, 0))), 'sole', [f'foot.{side}'])

# ---------------------------------------------------------------- staff with lantern (right hand)
BASE_R = dict(abduct=-8, elbow=-48)          # right arm pose used in every clip (holds the staff)
q_up = arm_q(0, -(-1) * BASE_R['abduct'], 0)
q_fo = arm_q(BASE_R['elbow'], 0, 0)
sh_r = Vector((-SHOULDER[0], SHOULDER[1], SHOULDER[2]))
d_r = Vector((-ARM_DIR.x, ARM_DIR.y, ARM_DIR.z))
elbow_rest = sh_r + d_r * UPPER
hand_rest = elbow_rest + d_r * (FORE + HAND * .55)
elbow_pose = sh_r + q_up @ (d_r * UPPER)
hand_pose = elbow_pose + (q_up @ q_fo) @ (d_r * (FORE + HAND * .55))
to_rest = Matrix.Translation(hand_rest) @ (q_up @ q_fo).inverted().to_matrix().to_4x4() @ Matrix.Translation(-hand_pose)
staff_parts = []
hp = hand_pose
shaft_pts = [Vector((hp.x + .01 * math.sin(i * 1.3), hp.y + .012 * math.cos(i), z)) for i, z in enumerate([.02, .35, .70, 1.0, 1.30])]
for k, z in enumerate((.28, .55, .86, 1.12)):      # knots on the shaft
    staff_parts.append(finish(ellipsoid(f'Tom_Knot_{k}', (hp.x + .03 * (-1) ** k, hp.y - .01, z), (.024, .022, .03), seg=8, rings=5), 'wood_dark', ['hand.R']))
staff_parts.append(finish(tube('Tom_Staff', shaft_pts, [.032, .036, .030, .036, .038], seg=10), 'wood', ['hand.R']))
top = Vector((hp.x, hp.y, 1.30))
hook = [top + Vector((.13 * math.sin(t * 3.9) * (1 - .3 * t), 0, .13 * (1 - math.cos(t * 3.9)) * .8 + .07 * t)) for t in [i / 16 for i in range(17)]]
staff_parts.append(finish(curve_tube('Tom_StaffHook', hook, .038, .020), 'wood_dark', ['hand.R']))
for z in (.62, .98):
    staff_parts.append(finish(torus(f'Tom_StaffBand_{z}', (hp.x, hp.y, z), .025, .006, seg=12, rseg=4), 'leather_dark', ['hand.R']))
LP = hook[-1] + Vector((0, 0, -.17))
staff_parts.append(finish(tube('Tom_LanternChain', [hook[-1], LP + Vector((0, 0, .09))], [.004, .004], seg=6), 'brass', ['hand.R']))
staff_parts.append(finish(box('Tom_LanternCap', LP + Vector((0, 0, .080)), (.095, .095, .024), bevel=.006), 'brass', ['hand.R']))
staff_parts.append(finish(box('Tom_LanternBase', LP + Vector((0, 0, -.075)), (.095, .095, .024), bevel=.006), 'brass', ['hand.R']))
for sx in (-1, 1):
    for sy in (-1, 1):
        staff_parts.append(finish(tube(f'Tom_LanternPost_{sx}{sy}', [LP + Vector((sx * .040, sy * .040, -.065)), LP + Vector((sx * .040, sy * .040, .072))],
                                       [.005, .005], seg=6), 'brass', ['hand.R']))
GLOW = emissive_cell('glass', 3.0)
staff_parts.append(finish(box('Tom_LanternGlass', LP, (.072, .072, .125), bevel=.008), None, ['hand.R'], material=GLOW))
staff_parts.append(finish(ellipsoid('Tom_LanternTop', LP + Vector((0, 0, .108)), (.030, .030, .030), seg=10, rings=6), 'brass', ['hand.R']))
for ob in staff_parts:
    ob.data.transform(to_rest)

# ---------------------------------------------------------------- rig & animation
rig = build_rig('TomRig', humanoid_bones(SHOULDER, ARM_DIR, UPPER, FORE, HAND, HIP_X, .400, .500, .620, .760, .800, 1.18,
                                         .230, .070, toe_y=-.13))
skin_and_join('Tom')
TAU = 2 * math.pi


def base():
    p = {}
    arms(p, 'L', abduct=-14, elbow=-15)
    arms(p, 'R', **BASE_R)
    return p


def idle(t, f):
    p = base()
    a = TAU * t
    p['hips_loc'] = (0, 0, .004 * math.sin(2 * a))
    add(p, 'spine', -1 + 1.2 * math.sin(2 * a))
    add(p, 'chest', 0, 0, 2 * math.sin(a))
    add(p, 'head', 2 * math.sin(2 * a + .5), 3 * math.sin(a), 2 * math.sin(a + 1))
    arms(p, 'L', abduct=2 * math.sin(2 * a), swing=2 * math.sin(a))
    arms(p, 'R', swing=1.5 * math.sin(a))
    return p


def walk(t, f):
    p = base()
    a = TAU * t
    sa, ca = math.sin(a), math.cos(a)
    legs(p, 'L', thigh=-22 * sa, knee=8 + 30 * max(0, ca) ** 1.5)
    legs(p, 'R', thigh=22 * sa, knee=8 + 30 * max(0, -ca) ** 1.5)
    p['hips_loc'] = (0, 0, -.006 + .012 * math.cos(2 * a) ** 2)
    add(p, 'hips', 0, 3 * ca, 5 * sa)
    add(p, 'spine', 3, 0, -3 * sa)
    add(p, 'head', -2 + 2 * math.cos(2 * a), -2 * ca, 0)
    arms(p, 'L', swing=20 * sa, elbow=-8)
    arms(p, 'R', swing=-6 * sa)
    return p


def run(t, f):
    p = base()
    a = TAU * t
    sa, ca = math.sin(a), math.cos(a)
    legs(p, 'L', thigh=-34 * sa - 6, knee=15 + 50 * max(0, ca) ** 1.4)
    legs(p, 'R', thigh=34 * sa - 6, knee=15 + 50 * max(0, -ca) ** 1.4)
    p['hips_loc'] = (0, 0, -.012 + .022 * abs(ca))
    add(p, 'spine', 9, 0, -5 * sa)
    add(p, 'head', -8)
    arms(p, 'L', swing=32 * sa, abduct=6, elbow=-55)
    arms(p, 'R', swing=-10 * sa)
    return p


def talk(t, f):
    p = idle(t, f)
    a = TAU * t
    add(p, 'head', 4 * math.sin(2 * a) + 2 * math.sin(6 * a), 3 * math.sin(a), 6 * math.sin(a + .5))
    add(p, 'chest', 0, 0, 4 * math.sin(a))
    arms(p, 'L', swing=-22 - 6 * math.sin(2 * a), abduct=34 + 6 * math.sin(a), raise_fore=40 + 12 * math.sin(2 * a + .5))
    return p


def wave_pose(k):
    p = base()
    arms(p, 'L', abduct=80, swing=-40, raise_fore=38 + 24 * k)
    add(p, 'hand.L', 0, -16 * k, 0)
    add(p, 'head', -3, -5, 8)
    add(p, 'chest', 0, -4, 6)
    add(p, 'spine', 0, -4, 0)
    return p


I0 = idle(0, 0)
make_action('Idle', 48, idle)
make_action('Walk', 20, walk)
make_action('Run', 14, run)
make_action('Talk', 48, talk)
make_action('Wave', 36, keyed([(0, I0), (.16, wave_pose(0)), (.28, wave_pose(1)), (.40, wave_pose(-1)), (.52, wave_pose(1)),
                               (.64, wave_pose(-1)), (.76, wave_pose(.6)), (1, I0)]), loop=False)
export(OUT / f'{NAME}.glb', SRC / f'{NAME}.blend')
