"""Build the chibi05 village buildings (REF_04_VILLAGE_SCENE.png, bottom row).

    python tools/chibi05/build_houses_chibi.py            # all buildings
    python tools/chibi05/build_houses_chibi.py hall shop  # selected ones

Output: assets/environment/village/models/bld_<name>_v02.glb (+ .blend in art_source/chibi05/buildings).
Conventions: metres, ground at Z=0, front facade faces Blender -Y (Godot +Z), building centred
on the origin. `BUILDINGS[name]['door']` is the door centre on the facade, reused by Godot.
"""
import bpy  # noqa: F401
import json, math, os, random, sys
from pathlib import Path
from mathutils import Vector, Matrix, Quaternion

ROOT = Path(os.environ.get('NGOC_ROOT', os.getcwd()))
sys.path.insert(0, str(ROOT / 'tools/chibi05'))
from chibi_lib import *  # noqa

OUT = ROOT / 'assets/environment/village/models'
SRC = ROOT / 'art_source/chibi05/buildings'
PAL = {
    'plaster': ('f3e6cc', .9, 0), 'plaster_shade': ('e2d0ad', .9, 0), 'timber': ('6b4024', .8, 0), 'timber_light': ('8c5a32', .8, 0),
    'stone': ('a49aa6', .9, 0), 'stone_light': ('bdb3bd', .9, 0), 'stone_dark': ('7f7584', .9, 0),
    'roof_red': ('d2493a', .7, 0), 'roof_red_dark': ('a83428', .7, 0), 'roof_blue': ('3d6fc6', .7, 0), 'roof_blue_dark': ('2c539a', .7, 0),
    'roof_orange': ('e2843a', .7, 0), 'roof_orange_dark': ('b9632a', .7, 0), 'roof_green': ('4f9a6a', .7, 0), 'roof_green_dark': ('3a7650', .7, 0),
    'roof_slate': ('6f7f95', .7, 0), 'roof_slate_dark': ('56647a', .7, 0),
    'door': ('8a5430', .7, 0), 'door_dark': ('5f3519', .7, 0), 'iron': ('3e3a3c', .5, .6), 'gold': ('e2b04a', .3, .85),
    'shutter_green': ('4f8f5a', .75, 0), 'shutter_blue': ('3f6fb0', .75, 0), 'shutter_red': ('b8432f', .75, 0),
    'planter': ('7a4a2a', .8, 0), 'leaf': ('4d9a3a', .8, 0), 'leaf_light': ('72b84a', .8, 0),
    'flower_pink': ('f08ab0', .7, 0), 'flower_yellow': ('f4d04a', .7, 0), 'flower_red': ('e2483e', .7, 0), 'flower_white': ('f6f2ea', .7, 0),
    'barn_red': ('b8402f', .85, 0), 'trim_white': ('f4efe6', .85, 0), 'hay': ('e0c060', .9, 0),
    'awning_red': ('d84a3a', .8, 0), 'awning_white': ('f6efe2', .8, 0), 'banner': ('2f5aa8', .8, 0),
    'glass': ('ffcf7a', .2, 0), 'crate': ('a8743e', .8, 0), 'apple': ('d8402e', .5, 0), 'pear': ('a8c84a', .5, 0),
}
rnd = random.Random(7)


def M(ob, mat):
    ob.data.transform(mat)
    return ob


def face_frame(face, w, d):
    """matrix mapping facade-local coords (x right, -y outward, z up; y=0 on the wall) to world"""
    ang = {'front': 0, 'right': 90, 'back': 180, 'left': -90}[face]
    half = d / 2 if face in ('front', 'back') else w / 2
    return Matrix.Rotation(math.radians(ang), 4, 'Z') @ Matrix.Translation((0, -half, 0))


class Bld:
    def __init__(s, w, d, storeys, roof, shutter='shutter_green', storey_h=2.7, found=.45, pitch=2.5, ov=.45, wall='plaster'):
        s.w, s.d, s.n, s.roof, s.sh, s.h, s.found, s.rh, s.ov, s.wall = w, d, storeys, roof, shutter, storey_h, found, pitch, ov, wall
        s.top = found + storeys * storey_h
        s.glow = emissive_cell('glass', 2.2)

    # ------------------------------------------------------------ shell
    def foundation(s):
        w, d, f = s.w + .30, s.d + .30, s.found
        finish(box('Found', (0, 0, f / 2), (w, d, f), bevel=.06), 'stone', ['x'])
        # chunky cartoon stones along the base
        for face, L in (('front', w), ('back', w), ('left', d), ('right', d)):
            Fm = face_frame(face, s.w + .30, s.d + .30)
            x = -L / 2 + .18
            while x < L / 2 - .1:
                sw = rnd.uniform(.32, .55)
                for row, z in enumerate((.12, .32)):
                    xx = x + (sw * .5 if row else 0)
                    if xx + sw / 2 > L / 2:
                        continue
                    st = ellipsoid('Stone', (xx, -.01, z), (sw / 2 * .92, .07, .10), seg=10, rings=6)
                    finish(M(st, Fm), rnd.choice(['stone', 'stone_light', 'stone_dark']), ['x'])
                x += sw

    def walls(s):
        H = s.n * s.h
        finish(box('Walls', (0, 0, s.found + H / 2), (s.w, s.d, H), bevel=.05), s.wall, ['x'])
        t = .20
        for sx in (-1, 1):
            for sy in (-1, 1):
                finish(box('Post', (sx * (s.w / 2), sy * (s.d / 2), s.found + H / 2), (t, t, H + .05), bevel=.03), 'timber', ['x'])
        for k in range(1, s.n + 1):
            z = s.found + k * s.h - (.08 if k == s.n else 0)
            for face, L in (('front', s.w), ('back', s.w), ('left', s.d), ('right', s.d)):
                finish(M(box('Beam', (0, -.05, z), (L + .1, .14, .18), bevel=.03), face_frame(face, s.w, s.d)), 'timber', ['x'])
        if s.n >= 2:  # half-timbered upper storey: X braces between windows on front/back
            for face, L in (('front', s.w), ('back', s.w)):
                Fm = face_frame(face, s.w, s.d)
                z0, z1 = s.found + s.h + .1, s.found + 2 * s.h - .2
                for x0 in (-L / 2 + .25, L / 2 - .25):
                    xa, xb = (x0, x0 + .6 * (1 if x0 < 0 else -1))
                    for (a, b) in (((xa, z0), (xb, z1)), ((xb, z0), (xa, z1))):
                        p0, p1 = Vector((a[0], -.04, a[1])), Vector((b[0], -.04, b[1]))
                        finish(M(tube('Brace', [p0, p1], [.06, .06], seg=4), Fm), 'timber', ['x'], smooth=False)

    def gable_roof(s, color=None, dark=None, chimney=True, ridge_x=True):
        color = color or s.roof
        dark = dark or color + '_dark'
        w, d, ov, rh, zt = s.w, s.d, s.ov, s.rh, s.top
        half = d / 2 + ov
        th = math.atan2(rh, half)
        L = math.hypot(rh, half)
        for side in (-1, 1):  # -1 front slope, +1 back slope
            ang = th if side < 0 else -th
            R = Matrix.Rotation(ang, 4, 'X')
            mid = Vector((0, side * half / 2, zt + rh / 2 - .05))
            slab = box('RoofSlab', (0, 0, 0), (w + 2 * ov, L + .15, .26), bevel=.06)
            finish(M(slab, Matrix.Translation(mid) @ R), dark, ['x'])
            n = R.to_3x3() @ Vector((0, 0, 1))
            t_dir = R.to_3x3() @ Vector((0, -side, 0)) * -1  # along slope, eave -> ridge
            rows = max(5, int(L / .34))
            for k in range(rows):
                t = (k + .55) / rows
                c = Vector((0, side * half, zt - .05)) + (Vector((0, -side * half, rh)) * t) + n * .13
                tile = loft('TileRow', [(c + Vector((-(w / 2 + ov + .02), 0, 0)), .09, .20, 0, n), (c + Vector((w / 2 + ov + .02, 0, 0)), .09, .20, 0, n)],
                            seg=10, caps=(True, True))
                finish(tile, color, ['x'])
        finish(cylinder('Ridge', (-(w / 2 + ov + .05), 0, zt + rh + .08), (w / 2 + ov + .05, 0, zt + rh + .08), .17, seg=12), dark, ['x'])
        # gable end walls with a round attic window
        for sx in (-1, 1):
            x = sx * s.w / 2
            v = [(x - .1 * sx, -d / 2, zt - .02), (x - .1 * sx, d / 2, zt - .02), (x - .1 * sx, 0, zt + rh * (d / 2) / half - .05),
                 (x + .05 * sx, -d / 2, zt - .02), (x + .05 * sx, d / 2, zt - .02), (x + .05 * sx, 0, zt + rh * (d / 2) / half - .05)]
            g = mesh_obj('Gable', v, [(0, 1, 2), (5, 4, 3), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)])
            recalc(g)
            finish(g, s.wall, ['x'], smooth=False)
            Fm = face_frame('right' if sx > 0 else 'left', s.w, s.d)
            zc = zt + rh * .32
            finish(M(torus('AtticRim', (0, -.08, zc), .30, .06, seg=20, rseg=6, rot=Quaternion((1, 0, 0), math.radians(90))), Fm), 'timber', ['x'])
            finish(M(cylinder('AtticGlass', (0, -.02, zc), (0, -.09, zc), .27, seg=18), Fm), None, ['x'], material=s.glow)
            finish(M(box('AtticBarH', (0, -.10, zc), (.56, .04, .05)), Fm), 'timber', ['x'])
            finish(M(box('AtticBarV', (0, -.10, zc), (.05, .04, .56)), Fm), 'timber', ['x'])
        if chimney:
            cx, cy = s.w / 2 - .9, d / 4
            zb = zt + rh * (1 - cy / half) - .3
            finish(box('Chimney', (cx, cy, zb + .75), (.6, .6, 1.6), bevel=.05), 'stone', ['x'])
            finish(box('ChimneyCap', (cx, cy, zb + 1.58), (.78, .78, .18), bevel=.05), 'stone_dark', ['x'])

    # ------------------------------------------------------------ openings & dressing
    def window(s, face, x, z, ww=.85, wh=1.05, flowers=True, shutters=True):
        Fm = face_frame(face, s.w, s.d)
        P = lambda ob: finish(M(ob, Fm), None, ['x']) if False else ob  # noqa: E731
        fw = .11
        parts = [
            (box('WinFrameT', (x, -.05, z + wh / 2 + fw / 2), (ww + 2 * fw, .14, fw), bevel=.03), 'timber'),
            (box('WinFrameB', (x, -.05, z - wh / 2 - fw / 2), (ww + 2 * fw, .14, fw), bevel=.03), 'timber'),
            (box('WinFrameL', (x - ww / 2 - fw / 2, -.05, z), (fw, .14, wh), bevel=.03), 'timber'),
            (box('WinFrameR', (x + ww / 2 + fw / 2, -.05, z), (fw, .14, wh), bevel=.03), 'timber'),
            (box('WinMullV', (x, -.06, z), (.06, .05, wh), bevel=.01), 'timber'),
            (box('WinMullH', (x, -.06, z + .05), (ww, .05, .06), bevel=.01), 'timber'),
            (box('WinSill', (x, -.14, z - wh / 2 - .10), (ww + .40, .26, .10), bevel=.03), 'timber_light'),
        ]
        for ob, col in parts:
            finish(M(ob, Fm), col, ['x'])
        finish(M(box('WinGlass', (x, -.02, z), (ww, .04, wh)), Fm), None, ['x'], material=s.glow)
        if shutters:
            for sx in (-1, 1):
                sh = box('Shutter', (0, 0, 0), (ww * .52, .06, wh + .1), bevel=.02)
                Mx = Matrix.Translation((x + sx * (ww / 2 + .12 + ww * .26 * .9), -.18, z)) @ Matrix.Rotation(math.radians(-25 * sx), 4, 'Z')
                finish(M(sh, Fm @ Mx), s.sh, ['x'])
                for zz in (-.25, .25):
                    finish(M(box('ShutterSlat', (0, -.04, zz * wh), (ww * .44, .03, .05)), Fm @ Mx), 'timber', ['x'])
        if flowers:
            bz = z - wh / 2 - .28
            finish(M(box('Planter', (x, -.24, bz), (ww + .30, .30, .26), bevel=.04), Fm), 'planter', ['x'])
            for k in range(7):
                fx = x - (ww + .2) / 2 + k * (ww + .2) / 6
                finish(M(ellipsoid('Leaf', (fx, -.26, bz + .17), (.11, .09, .08), seg=8, rings=6), Fm), rnd.choice(['leaf', 'leaf_light']), ['x'])
                finish(M(ellipsoid('Flower', (fx + .03, -.33, bz + .24), (.055, .045, .045), seg=8, rings=6), Fm),
                       rnd.choice(['flower_pink', 'flower_yellow', 'flower_red', 'flower_white']), ['x'])

    def door(s, x, dw=1.5, dh=2.35, face='front', double=False, steps=2):
        Fm = face_frame(face, s.w, s.d)
        z0 = s.found
        r = dw / 2
        flat = dh - r
        finish(M(box('DoorFrameL', (x - r - .11, -.05, z0 + flat / 2), (.22, .16, flat), bevel=.03), Fm), 'stone_light', ['x'])
        finish(M(box('DoorFrameR', (x + r + .11, -.05, z0 + flat / 2), (.22, .16, flat), bevel=.03), Fm), 'stone_light', ['x'])
        arch = torus('DoorArch', (x, -.05, z0 + flat), r + .11, .11, seg=28, rseg=6, rot=Quaternion((1, 0, 0), math.radians(90)))
        cut_faces(arch, lambda c, n: c.z < z0 + flat - .02)
        finish(M(arch, Fm), 'stone_light', ['x'])
        finish(M(box('Door', (x, -.03, z0 + flat / 2), (dw, .10, flat)), Fm), 'door', ['x'])
        top = cylinder('DoorTop', (x, .02, z0 + flat), (x, -.08, z0 + flat), r, seg=24)
        finish(M(top, Fm), 'door', ['x'])
        for k in range(1, 4 if not double else 5):
            px = x - r + k * dw / (4 if not double else 5)
            finish(M(box('Plank', (px, -.085, z0 + (flat + r * .7) / 2), (.03, .02, flat + r * .7)), Fm), 'door_dark', ['x'])
        for zz in (.45, flat - .25):
            finish(M(box('Strap', (x, -.09, z0 + zz), (dw * .92, .03, .07)), Fm), 'iron', ['x'])
        for kx in ((x + r * .55,) if not double else (x - .12, x + .12)):
            finish(M(ellipsoid('Knob', (kx, -.12, z0 + 1.05), (.05, .04, .05), seg=8, rings=6), Fm), 'gold', ['x'])
        for k in range(steps):
            sw = dw + .9 - k * .25
            finish(M(box('Step', (x, -.25 - (steps - 1 - k) * .32 - .16, (k + 1) * z0 / steps - z0 / steps / 2), (sw, .70 + (steps - 1 - k) * .64, z0 / steps), bevel=.04),
                     Fm), 'stone_light' if k % 2 else 'stone', ['x'])
        # lantern on a bracket beside the door
        lx = x + r + .55
        finish(M(box('LanternArm', (lx, -.22, z0 + 2.0), (.06, .40, .06)), Fm), 'iron', ['x'])
        finish(M(box('LanternCap', (lx, -.40, z0 + 1.88), (.24, .24, .06), bevel=.02), Fm), 'iron', ['x'])
        finish(M(box('LanternGlass', (lx, -.40, z0 + 1.72), (.18, .18, .26), bevel=.02), Fm), None, ['x'], material=s.glow)
        finish(M(box('LanternBase', (lx, -.40, z0 + 1.57), (.22, .22, .05), bevel=.02), Fm), 'iron', ['x'])
        return Fm @ Vector((x, 0, 0))

    def pot(s, pos, color='flower_pink'):
        finish(cylinder('Pot', (pos[0], pos[1], 0), (pos[0], pos[1], .42), .22, .28, seg=12), 'planter', ['x'])
        finish(ellipsoid('PotBush', (pos[0], pos[1], .55), (.30, .30, .24), seg=12, rings=8, deform=lambda q, v: lumpy(q, v, .03, 6, pos[0])),
               'leaf', ['x'])
        for k in range(5):
            a = k * 1.3
            finish(ellipsoid('PotFlower', (pos[0] + .2 * math.cos(a), pos[1] + .2 * math.sin(a), .66 + .05 * (k % 2)), (.06, .06, .05), seg=8, rings=6),
                   color, ['x'])

    def barrel(s, pos):
        finish(loft('Barrel', [((pos[0], pos[1], 0), .26, .26), ((pos[0], pos[1], .35), .31, .31), ((pos[0], pos[1], .70), .26, .26)], seg=14),
               'crate', ['x'])
        for z in (.12, .58):
            finish(torus('Hoop', (pos[0], pos[1], z), .29, .025, seg=16, rseg=4), 'iron', ['x'])

    def crate(s, pos, fruit='apple', size=.55):
        finish(box('Crate', (pos[0], pos[1], size / 2), (size, size * .8, size), bevel=.04), 'crate', ['x'])
        for k in range(6):
            finish(ellipsoid('Fruit', (pos[0] - size * .3 + (k % 3) * size * .3, pos[1] - size * .15 + (k // 3) * size * .3, size + .06), (.08, .08, .08),
                             seg=8, rings=6), fruit, ['x'])


BUILDINGS = {}


def make(name, fn, collision, door):
    BUILDINGS[name] = {'collision': collision, 'door': door}
    init(f'bld_{name}_v02', PAL, OUT, SRC)
    fn()
    join_static(f'bld_{name}_v02')
    export(OUT / f'bld_{name}_v02.glb', SRC / f'bld_{name}_v02.blend')


def cottage_red():
    b = Bld(5.0, 4.6, 1, 'roof_red', shutter='shutter_green', pitch=2.3)
    b.foundation(); b.walls(); b.gable_roof()
    b.door(-1.0)
    b.window('front', 1.1, b.found + 1.45)
    b.window('left', 0, b.found + 1.45)
    b.window('right', -.5, b.found + 1.45)
    b.window('back', 0, b.found + 1.45, flowers=False)
    b.pot((-2.15, -2.75)); b.barrel((2.2, -2.6))


def house_blue():
    b = Bld(5.6, 5.0, 2, 'roof_blue', shutter='shutter_red', pitch=2.4)
    b.foundation(); b.walls(); b.gable_roof()
    b.door(-1.0)
    b.window('front', 1.3, b.found + 1.45)
    for x in (-1.3, 1.3):
        b.window('front', x, b.found + b.h + 1.35)
        b.window('back', x, b.found + b.h + 1.35, flowers=False)
    for f in ('left', 'right'):
        b.window(f, 0, b.found + 1.45, flowers=False)
        b.window(f, 0, b.found + b.h + 1.35)
    b.pot((-2.4, -3.0), 'flower_yellow'); b.pot((2.5, -2.9))


def shop_orange():
    b = Bld(6.0, 5.2, 2, 'roof_orange', shutter='shutter_blue', pitch=2.4)
    b.foundation(); b.walls(); b.gable_roof()
    b.door(-1.0)
    b.window('front', 1.5, b.found + 1.40, ww=1.5, wh=1.15, flowers=False, shutters=False)
    for x in (-1.4, 1.4):
        b.window('front', x, b.found + b.h + 1.35)
    for f in ('left', 'right', 'back'):
        b.window(f, 0, b.found + b.h + 1.35, flowers=f != 'back')
    # striped awning over the shop window
    Fm = face_frame('front', b.w, b.d)
    ax, aw, az = 1.5, 2.3, b.found + 2.35
    stripes = 8
    for k in range(stripes):
        x = ax - aw / 2 + (k + .5) * aw / stripes
        sl = box('Awning', (0, 0, 0), (aw / stripes, 1.0, .06))
        finish(M(sl, Fm @ Matrix.Translation((x, -.50, az - .22)) @ Matrix.Rotation(math.radians(-24), 4, 'X')), 'awning_red' if k % 2 else 'awning_white', ['x'])
        finish(M(ellipsoid('Scallop', (x, -.97, az - .47), (aw / stripes / 2, .05, .12), seg=10, rings=6), Fm),
               'awning_red' if k % 2 else 'awning_white', ['x'])
    for sx in (-1, 1):
        finish(M(cylinder('AwningPole', (ax + sx * aw / 2, -.95, 0), (ax + sx * aw / 2, -.95, az - .4), .04, seg=8), Fm), 'iron', ['x'])
    # fruit stall crates and sign
    b.crate((1.0, -3.4), 'apple'); b.crate((1.75, -3.35), 'pear'); b.crate((2.45, -3.4), 'apple', .45)
    finish(M(box('Sign', (-1.0, -.20, b.found + 2.95), (1.4, .08, .45), bevel=.04), Fm), 'timber_light', ['x'])
    finish(M(ellipsoid('SignStar', (-1.0, -.25, b.found + 2.95), (.14, .03, .14), seg=10, rings=6), Fm), 'gold', ['x'])
    b.barrel((-2.5, -2.9))


def library_green():
    b = Bld(5.2, 5.4, 2, 'roof_green', shutter='shutter_blue', pitch=2.4)
    b.foundation(); b.walls(); b.gable_roof(chimney=False)
    b.door(-1.0)
    b.window('front', 1.2, b.found + 1.45)
    for x in (-1.2, 1.2):
        b.window('front', x, b.found + b.h + 1.35)
    for f in ('left', 'right'):
        b.window(f, -1.0, b.found + 1.45, flowers=False)
        b.window(f, 1.0, b.found + 1.45, flowers=False)
        b.window(f, 0, b.found + b.h + 1.35)
    for x in (-1.2, 1.2):
        b.window('back', x, b.found + 1.45)
        b.window('back', x, b.found + b.h + 1.35)
    Fm = face_frame('front', b.w, b.d)
    finish(M(box('BookSign', (-1.0, -.20, b.found + 2.95), (1.0, .08, .42), bevel=.04), Fm), 'timber_light', ['x'])
    finish(M(box('BookIcon', (-1.0, -.26, b.found + 2.95), (.36, .04, .26), bevel=.02), Fm), 'shutter_red', ['x'])
    b.pot((1.2, -3.3), 'flower_white')


def hall_blue():
    b = Bld(8.6, 6.8, 2, 'roof_blue', shutter='shutter_blue', pitch=3.2, storey_h=2.9, found=.6)
    b.foundation(); b.walls(); b.gable_roof()
    b.door(0.0, dw=2.0, dh=2.7, double=True, steps=3)
    for x in (-2.8, 2.8):
        b.window('front', x, b.found + 1.5)
    for x in (-2.8, -1.0, 1.0, 2.8):
        b.window('front', x, b.found + b.h + 1.4)
        b.window('back', x, b.found + b.h + 1.4, flowers=False)
    for f in ('left', 'right'):
        for x in (-1.6, 1.6):
            b.window(f, x, b.found + 1.5, flowers=False)
            b.window(f, x, b.found + b.h + 1.4)
    Fm = face_frame('front', b.w, b.d)
    # banner with a golden emblem and two ridge flags
    finish(M(box('Banner', (0, -.10, b.found + b.h + 1.2), (1.1, .06, 1.9), bevel=.03), Fm), 'banner', ['x'])
    finish(M(torus('Emblem', (0, -.16, b.found + b.h + 1.35), .26, .05, seg=20, rseg=6, rot=Quaternion((1, 0, 0), math.radians(90))), Fm), 'gold', ['x'])
    finish(M(ellipsoid('EmblemStar', (0, -.17, b.found + b.h + 1.35), (.16, .03, .16), seg=10, rings=6), Fm), 'gold', ['x'])
    finish(M(box('BannerRod', (0, -.12, b.found + b.h + 2.18), (1.4, .08, .08)), Fm), 'gold', ['x'])
    for sx in (-1, 1):
        x = sx * (b.w / 2 + b.ov - .2)
        z = b.top + b.rh + .1
        finish(cylinder('FlagPole', (x, 0, z), (x, 0, z + 1.4), .04, seg=8), 'iron', ['x'])
        finish(mesh_obj('Flag', [(x, 0, z + 1.35), (x + .7 * sx, 0, z + 1.17), (x, 0, z + 1.0)], [(0, 1, 2) if sx > 0 else (2, 1, 0)]), 'shutter_red', ['x'], smooth=False)
    b.pot((-1.6, -4.1)); b.pot((1.6, -4.1), 'flower_yellow')


def barn_red():
    b = Bld(4.8, 6.2, 1, 'roof_slate', storey_h=3.0, pitch=2.2, wall='barn_red', found=.25)
    b.walls(); b.gable_roof(chimney=False)
    Fm = face_frame('front', b.w, b.d)
    # big double barn door with white X bracing
    dw, dh = 2.4, 2.4
    finish(M(box('BarnDoor', (0, -.04, b.found + dh / 2), (dw, .10, dh), bevel=.03), Fm), 'barn_red', ['x'])
    for sx in (-1, 1):
        finish(M(box('BarnTrim', (sx * dw / 2, -.10, b.found + dh / 2), (.14, .06, dh + .1)), Fm), 'trim_white', ['x'])
    finish(M(box('BarnTrimTop', (0, -.10, b.found + dh), (dw + .1, .06, .14)), Fm), 'trim_white', ['x'])
    finish(M(box('BarnTrimMid', (0, -.10, b.found + .05), (dw + .1, .06, .12)), Fm), 'trim_white', ['x'])
    for sx in (-1, 1):
        p0, p1 = Vector((sx * dw / 2 - sx * .1, -.11, b.found + .1)), Vector((0, -.11, b.found + dh - .1))
        finish(M(tube('BarnX', [Vector((-dw / 2 + .1, -.11, b.found + .1)) if sx < 0 else Vector((dw / 2 - .1, -.11, b.found + .1)),
                                Vector((dw / 2 - .1, -.11, b.found + dh - .1)) if sx < 0 else Vector((-dw / 2 + .1, -.11, b.found + dh - .1))],
                      [.06, .06], seg=4), Fm), 'trim_white', ['x'], smooth=False)
    for (x, y) in ((-2.0, -3.6), (1.9, -3.7)):
        finish(loft('Hay', [((x, y, 0), .40, .30), ((x, y, .5), .42, .32)], seg=12, ref=Vector((1, 0, 0))), 'hay', ['x'], subsurf=1)
    b.window('left', 0, b.found + 1.6, flowers=False)
    b.window('right', 0, b.found + 1.6, flowers=False)


def store_slate():
    b = Bld(3.8, 4.2, 1, 'roof_slate', shutter='shutter_blue', pitch=2.0)
    b.foundation(); b.walls(); b.gable_roof(chimney=False)
    b.door(-.6, dw=1.4)
    b.window('front', 1.05, b.found + 1.5, ww=.7, wh=.9, flowers=False)
    b.window('left', 0, b.found + 1.5, ww=.7, wh=.9)
    b.crate((1.4, -2.7), 'pear', .5); b.barrel((-1.6, -2.6))


def tower():
    b = Bld(3.2, 3.2, 1, 'roof_red', storey_h=5.2, found=.4, wall='stone')
    b.foundation()
    H = 5.2
    finish(box('TowerBase', (0, 0, b.found + H / 2), (3.2, 3.2, H), bevel=.10), 'stone', ['x'])
    for k in range(int(H / .45)):  # staggered stone courses
        z = b.found + .25 + k * .45
        for face in ('front', 'back', 'left', 'right'):
            Fm = face_frame(face, 3.2, 3.2)
            x = -1.45 + (.35 if k % 2 else 0)
            while x < 1.35:
                if rnd.random() < .55:
                    finish(M(box('TStone', (x + .3, -.02, z), (.56, .06, .36), bevel=.05), Fm), rnd.choice(['stone_light', 'stone_dark']), ['x'])
                x += .7
    top = b.found + H
    finish(box('Lookout', (0, 0, top + 1.1), (3.7, 3.7, 2.2), bevel=.06), 'timber_light', ['x'])
    for face in ('front', 'back', 'left', 'right'):
        Fm = face_frame(face, 3.7, 3.7)
        finish(M(box('LookoutWin', (0, -.02, top + 1.2), (2.0, .08, 1.1), bevel=.03), Fm), None, ['x'], material=b.glow)
        for x in (-.66, 0, .66):
            finish(M(box('LookoutBar', (x, -.07, top + 1.2), (.08, .06, 1.15)), Fm), 'timber', ['x'])
        finish(M(box('Rail', (0, -.25, top + .35), (3.9, .14, .14)), Fm), 'timber', ['x'])
    finish(box('Balcony', (0, 0, top + .05), (4.3, 4.3, .2), bevel=.04), 'timber', ['x'])
    roof = loft('TowerRoof', [((0, 0, top + 2.15), 3.1, 3.1, math.radians(45)), ((0, 0, top + 3.0), 2.0, 2.0, math.radians(45)),
                               ((0, 0, top + 4.6), .12, .12, math.radians(45))], seg=4, caps=(True, True))
    finish(roof, 'roof_red', ['x'], smooth=False)
    for k in range(5):  # tile bands
        z = top + 2.25 + k * .48
        r = 3.0 - k * .55
        finish(loft('TowerTiles', [((0, 0, z), r * .98, r * .98, math.radians(45)), ((0, 0, z + .14), r * .93, r * .93, math.radians(45))], seg=4), 'roof_red_dark', ['x'],
               smooth=False)
    finish(cylinder('TFlagPole', (0, 0, top + 4.5), (0, 0, top + 5.6), .05, seg=8), 'iron', ['x'])
    finish(mesh_obj('TFlag', [(0, 0, top + 5.55), (.8, 0, top + 5.35), (0, 0, top + 5.15)], [(0, 1, 2)]), 'shutter_blue', ['x'], smooth=False)
    Fm = face_frame('front', 3.2, 3.2)
    b.door(0.0, dw=1.3, dh=2.2, steps=1)


ALL = {
    'cottage_red': (cottage_red, (5.3, 3.3, 4.9), (-1.0, 2.3 + .30)),
    'house_blue': (house_blue, (5.9, 6.0, 5.3), (-1.0, 2.5 + .30)),
    'shop_orange': (shop_orange, (6.3, 6.0, 5.5), (-1.0, 2.6 + .30)),
    'library_green': (library_green, (5.5, 6.0, 5.7), (-1.0, 2.7 + .30)),
    'hall_blue': (hall_blue, (8.9, 6.6, 7.1), (0.0, 3.4 + .30)),
    'barn_red': (barn_red, (4.9, 3.3, 6.3), (0.0, 3.1)),
    'store_slate': (store_slate, (4.1, 3.2, 4.5), (-.6, 2.1 + .30)),
    'tower': (tower, (3.6, 8.0, 3.6), (0.0, 1.6 + .30)),
}
if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('-')]
    for name, (fn, col, door) in ALL.items():
        if args and name not in args:
            continue
        make(name, fn, col, door)
    meta = OUT / 'buildings_v02.json'
    data = json.loads(meta.read_text()) if meta.exists() else {}
    data.update({k: {'collision': list(v[1]), 'door': list(v[2])} for k, v in ALL.items()})
    meta.write_text(json.dumps(data, indent=1))
