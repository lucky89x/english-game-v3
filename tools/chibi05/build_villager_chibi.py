"""Build chibi villagers from REF_02_ELDER_NPCS.png.

    python tools/chibi05/build_villager_chibi.py ben   -> assets/npc/models/npc_ben_merchant_v02.glb
    python tools/chibi05/build_villager_chibi.py sam   -> assets/npc/models/npc_sam_fisherman_v02.glb

Ben: cream cap with red band, white moustache, red bow tie, green apron, brown trousers.
Sam: straw hat, white beard, blue neckerchief, leather vest, green knee shorts.
Both: cream shirt with rolled sleeves, belt, chunky boots; Idle/Walk/Run/Talk/Wave clips.
"""
import bpy  # noqa: F401
import math, os, sys
from pathlib import Path
from mathutils import Vector, Quaternion

ROOT = Path(os.environ.get('NGOC_ROOT', os.getcwd()))
sys.path.insert(0, str(ROOT / 'tools/chibi05'))
from chibi_lib import *  # noqa

VAR = (sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else (sys.argv[1] if len(sys.argv) > 1 else 'ben')).lower()
NAME = {'ben': 'npc_ben_merchant_v02', 'sam': 'npc_sam_fisherman_v02'}[VAR]
OUT = ROOT / 'assets/npc/models'
SRC = ROOT / 'art_source/chibi05'
SKIN = (246, 196, 164)
PAL = {
    'skin': ('f6c4a4', .62, 0), 'nose': ('f0a48c', .55, 0),
    'white': ('f4f1ea', .75, 0), 'white_shade': ('dcd6cc', .8, 0), 'white_light': ('fffdf8', .7, 0),
    'shirt': ('f3e8d0', .8, 0), 'shirt_shade': ('ddcca8', .82, 0),
    'apron': ('5f9a3c', .75, 0), 'apron_dark': ('467a2b', .78, 0), 'stitch': ('e8d9a8', .8, 0),
    'trousers': ('7a4a2c', .75, 0), 'shorts': ('5c7d3a', .78, 0), 'shorts_dark': ('46622a', .8, 0),
    'leather': ('8a5430', .55, 0), 'leather_dark': ('5f3519', .6, 0), 'gold': ('e2b04a', .3, .85),
    'boot': ('84502e', .5, 0), 'sole': ('4a2a17', .7, 0),
    'cap': ('efe2c4', .8, 0), 'red': ('c8352e', .7, 0), 'red_dark': ('9a2620', .72, 0),
    'straw': ('d9b66a', .85, 0), 'straw_dark': ('b48d45', .85, 0), 'blue': ('3f7cc4', .72, 0), 'blue_dark': ('2d5c98', .75, 0),
    'fish': ('5aa0d8', .4, 0), 'checker': ('e9e2d6', .8, 0),
}
if VAR == 'ben':
    FA = dict(skin=SKIN, eye_x=.100, eye_z=-.020, eye_w=.070, eye_h=.075, mouth_z=-.122, mouth_w=.038)
    faces = {'happy': paint_face(eyes='happy', mouth='laugh', **FA), 'talk': paint_face(eyes='happy', mouth='talk', **FA),
             'blink': paint_face(eyes='closed', mouth='laugh', **FA)}
else:
    FA = dict(skin=SKIN, eye_x=.100, eye_z=-.025, eye_w=.074, eye_h=.084, mouth_z=-.125, mouth_w=.036, brows=None)
    faces = {'happy': paint_face(eyes='open', mouth='laugh', **FA), 'talk': paint_face(eyes='open', mouth='talk', **FA),
             'blink': paint_face(eyes='closed', mouth='laugh', **FA)}
init(NAME, PAL, OUT, SRC, faces)

HZ = 1.000
HA, HB, HC = .268, .245, .255
SHOULDER = (.175, 0.0, .700)
ARM_DIR = Vector((.62, .0, -.78)).normalized()
UPPER, FORE, HAND = .115, .105, .070
HIP_X = .090

head = make_head('V_Head', (0, 0, HZ), (HA, HB, HC))
finish(ellipsoid('V_Nose', (0, -.248, HZ - .052), (.046, .034, .040), seg=16, rings=10), 'nose', ['head'])
for s in (-1, 1):
    finish(ellipsoid(f'V_Ear_{s}', (s * .262, .0, HZ - .02), (.040, .028, .058), seg=12, rings=8), 'skin', ['head'])
HEAD_TREE = bvh_of(head)


def hdir(az, el):
    az, el = math.radians(az), math.radians(el)
    return Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))


def on_head(az, el, off=0.0):
    return surf(HEAD_TREE, (0, 0, HZ), hdir(az, el), off)


W3 = ['white', 'white_light', 'white_shade']
# white hair puffs around the sides/back (cap or hat covers the top)
for k, az in enumerate(range(60, 301, 20)):
    p, n = on_head(az if az <= 180 else az - 360, -2 + 8 * math.sin(k), .020)
    finish(ellipsoid(f'V_HairPuff_{k}', p, (.075, .065, .070), seg=12, rings=8, deform=lambda q, v, k=k: lumpy(q, v, .012, 6, k)),
           W3[k % 3], ['head'])
finish(ellipsoid('V_HairBack', (0, .060, HZ + .020), (HA + .018, HB - .010, HC + .010), seg=28, rings=16,
                 deform=lambda q, v: lumpy(q, v, .012, 6, 1)), 'white', ['head'])
for s in (-1, 1):
    p, n = on_head(s * 23, 10, .010)
    finish(ellipsoid(f'V_Brow_{s}', p, (.048, .020, .018), seg=12, rings=8,
                     rot=Vector((0, 0, 1)).rotation_difference(n) @ Quaternion((0, 0, 1), math.radians(-12 * s)),
                     deform=lambda q, v: lumpy(q, v, .005, 7, 1)), 'white', ['head'])
# moustache
for s in (-1, 1):
    finish(ellipsoid(f'V_Moustache_{s}', (s * .062, -.250, HZ - .084), (.074, .036, .032), seg=16, rings=10,
                     rot=Quaternion((0, 1, 0), math.radians(-16 * s)) @ Quaternion((0, 0, 1), math.radians(-18 * s)),
                     deform=lambda q, v: lumpy(q, v, .006, 6, 2)), 'white_light', ['head'])
    if VAR == 'ben':
        finish(curve_tube(f'V_MoustacheCurl_{s}', helix((s * .128, -.232, HZ - .090), (s, .2, .7), .035, .016, 1.0, n=14,
                                                         phase=0 if s > 0 else math.pi), .020, .008), 'white', ['head'])
if VAR == 'ben':  # short tidy chin beard
    finish(ellipsoid('V_ChinBeard', (0, -.190, HZ - .215), (.120, .080, .080), seg=18, rings=10,
                     deform=lambda q, v: lumpy(q, v, .010, 6, 3)), 'white_shade', ['head'])
else:  # full fluffy beard
    finish(ellipsoid('V_Beard', (0, -.120, HZ - .300), (.225, .145, .180), seg=24, rings=14,
                     deform=lambda q, v: lumpy(q + Vector((0, 0, -.04 * max(0, -v.z) ** 2)), v, .018, 6, 3)), 'white', ['head'])
    for s in (-1, 1):
        for k, (x, y, z, r) in enumerate([(.200, -.070, -.150, .090), (.140, -.150, -.240, .085)]):
            finish(ellipsoid(f'V_BeardTuft_{s}_{k}', (s * x, y, HZ + z), (r, r * .9, r), seg=12, rings=8,
                             deform=lambda q, v, k=k: lumpy(q, v, .012, 6, k + s)), W3[k], ['head'])

# ---- headwear
if VAR == 'ben':
    cap = ellipsoid('V_Cap', (0, .010, HZ + .130), (HA + .040, HB + .045, .150), seg=32, rings=14,
                    deform=lambda q, v: Vector((q.x, q.y, q.z * (1 if v.z > 0 else .2))))
    cut_faces(cap, lambda c, n: c.z < HZ + .085)
    finish(cap, 'cap', ['head'], subsurf=1)
    finish(torus('V_CapBand', (0, .010, HZ + .110), HA + .036, .024, seg=40, rseg=8, sy=(HB + .041) / (HA + .036)), 'red', ['head'])
    brim = ellipsoid('V_CapBrim', (0, -.255, HZ + .095), (.190, .090, .016), seg=24, rings=8,
                     rot=Quaternion((1, 0, 0), math.radians(-12)))
    finish(brim, 'cap', ['head'])
    finish(ellipsoid('V_CapButton', (0, .010, HZ + .282), (.026, .026, .016), seg=10, rings=6), 'red_dark', ['head'])
else:
    crown = ellipsoid('V_HatCrown', (0, .010, HZ + .195), (HA + .020, HB + .030, .120), seg=30, rings=14,
                      deform=lambda q, v: lumpy(q, v, .006, 8, 2))
    finish(crown, 'straw', ['head'])
    brim = torus('V_HatBrim', (0, .010, HZ + .120), .330, .030, seg=48, rseg=8, sy=.95)
    for v in brim.data.vertices:  # gentle wavy straw brim, lifted at the back
        a = math.atan2(v.co.y, v.co.x)
        v.co.z += .018 * math.sin(a * 5) + .025 * max(0, v.co.y / .3)
    finish(brim, 'straw', ['head'], subsurf=1)
    finish(ellipsoid('V_HatBrimFill', (0, .010, HZ + .118), (.320, .305, .018), seg=40, rings=8), 'straw_dark', ['head'])
    finish(torus('V_HatBand', (0, .010, HZ + .135), HA + .022, .020, seg=36, rseg=6, sy=(HB + .032) / (HA + .022)), 'blue', ['head'])
    fish = ellipsoid('V_HatFish', (.215, -.160, HZ + .165), (.020, .055, .022), seg=12, rings=8, rot=Quaternion((0, 0, 1), math.radians(35)))
    finish(fish, 'fish', ['head'])

# ---- torso & clothing
TORSO = [((0, .010, .400), .210, .185), ((0, .000, .480), .225, .200), ((0, -.010, .570), .225, .200), ((0, -.004, .660), .200, .175),
         ((0, .004, .730), .160, .135), ((0, .006, .775), .090, .080), ((0, .006, .800), .055, .055)]
torso = loft('V_Shirt', TORSO, seg=28, ref=Vector((1, 0, 0)))
finish(torso, 'shirt', ['hips', 'spine', 'chest', 'neck'], subsurf=1)
TT = bvh_of(torso)
finish(torus('V_Belt', (0, .006, .440), .222, .018, seg=40, rseg=8, sy=.197 / .222), 'leather', ['hips'])
if VAR != 'ben':
    finish(torus('V_Buckle', (0, -.200, .440), .026, .007, seg=4, rseg=6, rot=Quaternion((1, 0, 0), math.radians(90)) @ Quaternion((0, 0, 1), math.radians(45))),
           'gold', ['hips'], smooth=False)
if VAR == 'ben':
    # long green apron from chest to the knees, with pocket and neck strap
    rings = []
    for k, z in enumerate([.70, .62, .52, .42, .32, .22, .15]):
        w = .120 + .050 * smoothstep(.70, .42, z) + .015 * smoothstep(.42, .15, z)
        p, n = surf(TT, (0, 0, min(z, .72)), (0, -1, 0), .014) if z > .40 else (Vector((0, -.205 - .03 * (.40 - z), z)), Vector((0, -1, 0)))
        rings.append((p, .008, w, 0, n))
    finish(loft('V_Apron', rings, seg=12), 'apron', ['hips', 'spine', 'chest', 'thigh.L', 'thigh.R'], subsurf=1)
    finish(box('V_ApronPocket', (0, -.235, .330), (.150, .012, .080), bevel=.010), 'apron_dark', ['hips', 'thigh.L', 'thigh.R'])
    for s in (-1, 1):
        finish(tube(f'V_ApronStrap_{s}', [surf(TT, (0, 0, .70), (s * .45, -1, .2), .012)[0], surf(TT, (0, 0, .76), (s * .5, -.2, 1), .010)[0],
                                          surf(TT, (0, 0, .70), (s * .3, 1, .4), .010)[0]], [.010] * 3, seg=6), 'apron_dark', ['chest'])
    for s in (-1, 1):  # bow tie
        finish(ellipsoid(f'V_Bow_{s}', (s * .040, -.150, .770), (.040, .016, .026), seg=12, rings=8, rot=Quaternion((0, 1, 0), math.radians(12 * s))),
               'red', ['chest'])
    finish(ellipsoid('V_BowKnot', (0, -.160, .770), (.016, .014, .018), seg=8, rings=6), 'red_dark', ['chest'])
    # small checked cloth tucked in the belt
    finish(box('V_Cloth', (.180, -.130, .380), (.060, .010, .090), bevel=.008, rot=Quaternion((0, 0, 1), math.radians(40))), 'red', ['hips'])
else:
    # leather vest open at the front
    vest = loft('V_Vest', [(c, ra + .012, rb + .012) for c, ra, rb in TORSO[:5]], seg=28, caps=(False, False), ref=Vector((1, 0, 0)))
    cut_faces(vest, lambda c, n: abs(math.atan2(c.x, -c.y)) < .45 and c.y < 0)
    finish(vest, 'leather', ['hips', 'spine', 'chest'], subsurf=1)
    for s in (-1, 1):
        finish(ellipsoid(f'V_VestPocket_{s}', surf(TT, (0, 0, .55), (s * .75, -1, 0), .022)[0], (.045, .014, .040), seg=10, rings=6),
               'leather_dark', ['spine'])
    # blue neckerchief knotted at the front
    finish(torus('V_Neckerchief', (0, .0, .770), .110, .030, seg=32, rseg=8, sy=.9), 'blue', ['chest', 'neck'])
    finish(loft('V_KerchiefTip', [((0, -.130, .760), .008, .070), ((0, -.150, .700), .008, .030), ((0, -.155, .665), .008, .006)], seg=8,
                ref=Vector((0, -1, 0))), 'blue_dark', ['chest'])
# collar
for s in (-1, 1):
    finish(ellipsoid(f'V_Collar_{s}', (s * .050, -.090, .775), (.050, .012, .030), seg=12, rings=8,
                     rot=Quaternion((1, 0, 0), math.radians(-25)) @ Quaternion((0, 1, 0), math.radians(-28 * s))), 'shirt_shade', ['chest'])

# ---- legs: trousers (Ben) or knee shorts (Sam) + boots
for s, side in ((1, 'L'), (-1, 'R')):
    if VAR == 'ben':
        leg = loft(f'V_Trouser_{s}', [((s * .085, .010, .420), .105, .100), ((s * .090, .008, .300), .092, .088), ((s * .090, .006, .180), .082, .080),
                                      ((s * .090, .004, .120), .080, .078)], seg=18, caps=(False, False))
        finish(leg, 'trousers', [('hips', 1.5), f'thigh.{side}', f'shin.{side}'], subsurf=1)
    else:
        leg = loft(f'V_Short_{s}', [((s * .085, .010, .420), .108, .102), ((s * .092, .008, .300), .100, .096), ((s * .094, .006, .230), .098, .094)],
                   seg=18, caps=(False, False))
        finish(leg, 'shorts', [('hips', 1.5), f'thigh.{side}', f'shin.{side}'], subsurf=1)
        finish(torus(f'V_ShortCuff_{s}', (s * .094, .006, .232), .094, .014, seg=20, rseg=6), 'shorts_dark', [f'thigh.{side}', f'shin.{side}'])
        finish(tube(f'V_Calf_{s}', [(s * .092, .006, .26), (s * .092, .004, .13)], [.052, .048], seg=12), 'skin', [f'shin.{side}'])
    finish(loft(f'V_BootShaft_{s}', [((s * .092, .004, .060), .070, .074), ((s * .092, .004, .150), .068, .068)], seg=18, caps=(False, False)),
           'boot', [f'shin.{side}', f'foot.{side}'], subsurf=1)
    finish(torus(f'V_BootCuff_{s}', (s * .092, .004, .150), .070, .018, seg=20, rseg=6), 'leather_dark', [f'shin.{side}'])
    finish(ellipsoid(f'V_BootFoot_{s}', (s * .094, -.045, .055), (.074, .120, .062), seg=18, rings=10,
                     deform=lambda p, v: Vector((p.x, p.y, p.z if p.z > 0 else p.z * .55))), 'boot', [f'foot.{side}', f'shin.{side}'])
    finish(loft(f'V_Sole_{s}', [((s * .094, .06, .012), .072, .010), ((s * .094, -.05, .012), .078, .010), ((s * .095, -.150, .014), .058, .010)],
                seg=14, ref=Vector((1, 0, 0))), 'sole', [f'foot.{side}'])

# ---- arms: rolled sleeves + bare forearms + hands
for s, side in ((1, 'L'), (-1, 'R')):
    sh = Vector((s * SHOULDER[0], SHOULDER[1], SHOULDER[2]))
    d = Vector((s * ARM_DIR.x, ARM_DIR.y, ARM_DIR.z))
    finish(loft(f'V_Sleeve_{s}', [(sh - d * .04, .058, .058), (sh + d * .04, .072, .070), (sh + d * .10, .070, .068), (sh + d * .13, .062, .060)],
                seg=18, caps=(True, False)), 'shirt', ['chest', f'upper_arm.{side}'], subsurf=1)
    finish(torus(f'V_SleeveRoll_{s}', sh + d * .125, .060, .018, seg=20, rseg=6, rot=Vector((0, 0, 1)).rotation_difference(d)),
           'shirt_shade', [f'upper_arm.{side}', f'forearm.{side}'])
    finish(tube(f'V_Forearm_{s}', [sh + d * .10, sh + d * (UPPER + FORE)], [.042, .036], seg=12), 'skin', [f'upper_arm.{side}', f'forearm.{side}'])
    hc = sh + d * (UPPER + FORE + .040)
    q = Vector((0, 0, 1)).rotation_difference(d)
    finish(ellipsoid(f'V_Hand_{s}', hc, (.042, .031, .050), seg=14, rings=10, rot=q), 'skin', [f'hand.{side}'])
    finish(ellipsoid(f'V_Thumb_{s}', hc + Vector((0, -.032, .010)) - d * .010, (.015, .015, .027), seg=10, rings=8,
                     rot=Vector((0, 0, 1)).rotation_difference((d + Vector((0, -.6, 0))).normalized())), 'skin', [f'hand.{side}'])

# ---- rig & clips
build_rig(f'{NAME}_Rig', humanoid_bones(SHOULDER, ARM_DIR, UPPER, FORE, HAND, HIP_X, .420, .520, .640, .760, .800, 1.18, .240, .075, toe_y=-.13))
skin_and_join(NAME)
TAU = 2 * math.pi


def base():
    p = {}
    arms(p, 'L', abduct=-12, elbow=-14)
    arms(p, 'R', abduct=-12, elbow=-14)
    return p


def idle(t, f):
    p = base()
    a = TAU * t
    p['hips_loc'] = (0, 0, .004 * math.sin(2 * a))
    add(p, 'spine', -1 + 1.4 * math.sin(2 * a))
    add(p, 'chest', 0, 0, 2 * math.sin(a))
    add(p, 'head', 2 * math.sin(2 * a + .5), 3 * math.sin(a), 3 * math.sin(a + 1))
    arms(p, 'L', abduct=2 * math.sin(2 * a), swing=2 * math.sin(a))
    arms(p, 'R', abduct=2 * math.sin(2 * a + .4), swing=-2 * math.sin(a))
    return p


def walk(t, f):
    p = base()
    a = TAU * t
    sa, ca = math.sin(a), math.cos(a)
    legs(p, 'L', thigh=-26 * sa, knee=8 + 36 * max(0, ca) ** 1.5)
    legs(p, 'R', thigh=26 * sa, knee=8 + 36 * max(0, -ca) ** 1.5)
    p['hips_loc'] = (0, 0, -.008 + .014 * math.cos(2 * a) ** 2)
    add(p, 'hips', 0, 3 * ca, 6 * sa)
    add(p, 'spine', 3, 0, -4 * sa)
    add(p, 'head', -2 + 2 * math.cos(2 * a), -2 * ca, -2 * sa)
    arms(p, 'L', swing=24 * sa, elbow=-10)
    arms(p, 'R', swing=-24 * sa, elbow=-10)
    return p


def run(t, f):
    p = base()
    a = TAU * t
    sa, ca = math.sin(a), math.cos(a)
    legs(p, 'L', thigh=-40 * sa - 6, knee=15 + 60 * max(0, ca) ** 1.4)
    legs(p, 'R', thigh=40 * sa - 6, knee=15 + 60 * max(0, -ca) ** 1.4)
    p['hips_loc'] = (0, 0, -.015 + .025 * abs(ca))
    add(p, 'spine', 10, 0, -5 * sa)
    add(p, 'head', -9)
    arms(p, 'L', swing=38 * sa, abduct=5, elbow=-65)
    arms(p, 'R', swing=-38 * sa, abduct=5, elbow=-65)
    return p


def talk(t, f):
    p = idle(t, f)
    a = TAU * t
    add(p, 'head', 4 * math.sin(2 * a) + 2 * math.sin(6 * a), 3 * math.sin(a), 6 * math.sin(a + .5))
    arms(p, 'R', swing=-22 - 6 * math.sin(2 * a), abduct=30 + 6 * math.sin(a), raise_fore=40 + 12 * math.sin(2 * a + .5))
    arms(p, 'L', swing=-8, abduct=6 + 6 * math.sin(a + 2), elbow=-25)
    return p


def wave_pose(k):
    p = base()
    arms(p, 'R', abduct=80, swing=-40, raise_fore=38 + 24 * k)
    add(p, 'hand.R', 0, 16 * k, 0)
    add(p, 'head', -3, 5, -8)
    add(p, 'chest', 0, 4, -6)
    return p


I0 = idle(0, 0)
make_action('Idle', 48, idle)
make_action('Walk', 18, walk)
make_action('Run', 13, run)
make_action('Talk', 48, talk)
make_action('Wave', 36, keyed([(0, I0), (.16, wave_pose(0)), (.28, wave_pose(1)), (.40, wave_pose(-1)), (.52, wave_pose(1)),
                               (.64, wave_pose(-1)), (.76, wave_pose(.6)), (1, I0)]), loop=False)
export(OUT / f'{NAME}.glb', SRC / f'{NAME}.blend')
