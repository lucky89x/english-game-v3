"""Build chibi05 village props (REF_04_VILLAGE_SCENE.png: bridges, lamps, signs, interiors).

    python tools/chibi05/build_props_chibi.py                # all
    python tools/chibi05/build_props_chibi.py bridge lamp    # selected

Outputs assets/environment/village/models/<name>_v02.glb, sources in art_source/chibi05/props.
Same palette family as build_houses_chibi.py. Front = Blender -Y (Godot +Z), ground at Z=0.
Collision is NOT baked into the GLBs; the Godot scenes add simple box proxies.
"""
import bpy  # noqa: F401
import math, os, random, sys
from pathlib import Path
from mathutils import Vector, Matrix, Quaternion

ROOT = Path(os.environ.get('NGOC_ROOT', os.getcwd()))
sys.path.insert(0, str(ROOT / 'tools/chibi05'))
from chibi_lib import *  # noqa
import chibi_lib as L

OUT = ROOT / 'assets/environment/village/models'
SRC = ROOT / 'art_source/chibi05/props'
PAL = {
    'wood': ('9a6436', .8, 0), 'wood_light': ('b97d46', .8, 0), 'wood_dark': ('6b4024', .8, 0), 'wood_grey': ('8a7766', .85, 0),
    'stone': ('a49aa6', .9, 0), 'stone_light': ('bdb3bd', .9, 0), 'stone_dark': ('7f7584', .9, 0),
    'iron': ('3e3a3c', .5, .6), 'brass': ('d39a42', .32, .75), 'gold': ('e2b04a', .3, .85), 'glass': ('ffcf7a', .2, 0),
    'plaster': ('f3e6cc', .9, 0), 'plaster_shade': ('e2d0ad', .9, 0),
    'leaf': ('4d9a3a', .8, 0), 'leaf_light': ('72b84a', .8, 0), 'leaf_dark': ('3a7a2e', .8, 0), 'moss': ('6aa84a', .9, 0),
    'flower_pink': ('f08ab0', .7, 0), 'flower_yellow': ('f4d04a', .7, 0), 'flower_white': ('f6f2ea', .7, 0),
    'rug_blue': ('3d6fc6', .95, 0), 'rug_gold': ('e2b04a', .9, 0), 'rug_red': ('c8402f', .95, 0),
    'quilt': ('2f5aa8', .9, 0), 'quilt_light': ('f2e6c8', .9, 0), 'pillow': ('f6f0e4', .9, 0),
    'book_red': ('c23b30', .8, 0), 'book_green': ('4f8f5a', .8, 0), 'book_blue': ('3f6fb0', .8, 0), 'book_yellow': ('e2b04a', .8, 0),
    'parchment': ('f0ddb0', .85, 0), 'fire': ('ff9a3a', .5, 0), 'soot': ('3a3036', .95, 0), 'potion': ('5ad0e8', .2, 0),
    'cup': ('f4f1ea', .4, 0),
}
rnd = random.Random(11)


def P(ob, mat):
    ob.data.transform(mat)
    return ob


def tube_through(name, pts, r, col, seg=8):
    return finish(tube(name, pts, [r] * len(pts), seg=seg), col, ['x'])


# ------------------------------------------------------------------ curved wooden bridge
BRIDGE_L, BRIDGE_W, BRIDGE_H = 11.5, 2.8, 0.95


def deck_z(y):
    return BRIDGE_H * math.cos(math.pi * y / BRIDGE_L) - .03


GAP = (-1.9, 2.3)   # broken variant: deck planks and rails missing between these y values


def in_gap(y):
    return GAP[0] < y < GAP[1]


def bridge(broken=False):
    glow = emissive_cell('glass', 2.4)
    L_, W = BRIDGE_L, BRIDGE_W
    y = -L_ / 2 + .16
    k = 0
    while y < L_ / 2 - .1:
        z = deck_z(y)
        slope = -BRIDGE_H * math.pi / L_ * math.sin(math.pi * y / L_)
        if broken and in_gap(y):
            # a couple of loose planks hang from the broken edges
            if abs(y - GAP[0]) < .35 or abs(y - GAP[1]) < .35:
                edge = GAP[0] if y < 0 else GAP[1]
                tilt = math.radians(55 if y < 0 else -55)
                hang = box('LoosePlank', (0, 0, 0), (W * .55, .29, .10), bevel=.025)
                finish(P(hang, Matrix.Translation((rnd.uniform(-.5, .5), edge, deck_z(edge) - .45)) @ Matrix.Rotation(tilt, 4, 'X')),
                       'wood_dark', ['x'])
            y += .32
            k += 1
            continue
        plank = box('Plank', (0, 0, 0), (W + rnd.uniform(-.06, .06), .29, .10), bevel=.025)
        finish(P(plank, Matrix.Translation((rnd.uniform(-.03, .03), y, z - .05)) @ Matrix.Rotation(math.atan(slope), 4, 'X')),
               ['wood', 'wood_light', 'wood', 'wood_dark'][k % 4], ['x'])
        y += .32
        k += 1
    ys = [-L_ / 2 + i * L_ / 24 for i in range(25)]
    for sx in (-1, 1):
        # stringer under the plank ends, arch rib below, handrail and mid rail on top
        tube_through('Stringer', [Vector((sx * (W / 2 - .05), yy, deck_z(yy) - .16)) for yy in ys], .10, 'wood_dark')
        arch = [Vector((sx * (W / 2 - .25), yy * .92, (BRIDGE_H - .05) * math.cos(math.pi * yy / L_) - .55 - .25 * (1 - math.cos(math.pi * yy / L_))))
                for yy in ys]
        tube_through('ArchRib', arch, .13, 'wood_dark', seg=10)
        rails = [Vector((sx * (W / 2 + .02), yy, deck_z(yy) + .92)) for yy in ys[1:-1]]
        parts = [rails] if not broken else [[r for r in rails if r.y <= GAP[0]], [r for r in rails if r.y >= GAP[1]]]
        for part in parts:
            if len(part) >= 2:
                tube_through('Handrail', part, .065, 'wood_light', seg=10)
                tube_through('MidRail', [p + Vector((0, 0, -.45)) for p in part], .04, 'wood')
        for i in range(1, 24, 2):
            yy = ys[i]
            if broken and in_gap(yy):
                continue
            base = Vector((sx * (W / 2 + .02), yy, deck_z(yy) - .05))
            finish(cylinder('Post', base, base + Vector((0, 0, .99)), .075, seg=10), 'wood', ['x'])
            finish(ellipsoid('PostCap', base + Vector((0, 0, 1.0)), (.09, .09, .06), seg=10, rings=6), 'wood_dark', ['x'])
        # under-deck cross braces between arch rib and stringer
        for i in range(3, 22, 3):
            yy = ys[i]
            finish(cylinder('Strut', Vector((sx * (W / 2 - .15), yy, deck_z(yy) - .2)), arch[i] + Vector((0, 0, .05)), .06, seg=6), 'wood_dark', ['x'])
        # end posts with lanterns
        for sy in (-1, 1):
            base = Vector((sx * (W / 2 + .08), sy * (L_ / 2 - .25), -.05))
            finish(cylinder('EndPost', base, base + Vector((0, 0, 1.35)), .13, seg=12), 'wood_dark', ['x'])
            top = base + Vector((0, 0, 1.38))
            finish(box('LampCap', top + Vector((0, 0, .26)), (.26, .26, .06), bevel=.02), 'iron', ['x'])
            finish(box('LampGlass', top + Vector((0, 0, .12)), (.20, .20, .24), bevel=.02), None, ['x'], material=glow)
            finish(box('LampBase', top, (.24, .24, .05), bevel=.02), 'iron', ['x'])
    # stone abutments under each end
    for sy in (-1, 1):
        finish(box('Abutment', (0, sy * (L_ / 2 - .1), -.35), (W + .7, 1.3, .8), bevel=.12), 'stone', ['x'])
        for sx in (-1, 0, 1):
            finish(ellipsoid('AbutStone', (sx * 1.05, sy * (L_ / 2 + .5), -.08), (.42, .22, .2), seg=10, rings=6),
                   rnd.choice(['stone_light', 'stone_dark']), ['x'])
    # a few flowers on the abutments
    for sy in (-1, 1):
        for sx in (-1, 1):
            finish(ellipsoid('Bush', (sx * 1.75, sy * (L_ / 2 - .2), .15), (.28, .28, .22), seg=10, rings=6,
                             deform=lambda q, v: lumpy(q, v, .03, 6, sx + sy)), 'leaf', ['x'])
            for f in range(4):
                a = f * 1.6
                finish(ellipsoid('Flower', (sx * 1.75 + .18 * math.cos(a), sy * (L_ / 2 - .2) + .18 * math.sin(a), .33), (.05, .05, .04),
                                 seg=6, rings=4), 'flower_pink' if f % 2 else 'flower_yellow', ['x'])


# ------------------------------------------------------------------ lamp post
def lamp():
    glow = emissive_cell('glass', 2.6)
    finish(cylinder('Base', (0, 0, 0), (0, 0, .28), .22, .18, seg=10), 'stone', ['x'])
    finish(cylinder('Pole', (0, 0, .25), (0, 0, 2.45), .07, .055, seg=10), 'wood_dark', ['x'])
    for z in (.9, 1.9):
        finish(torus('Band', (0, 0, z), .065, .018, seg=12, rseg=4), 'iron', ['x'])
    arm = [Vector((0, 0, 2.3)), Vector((0, -.15, 2.55)), Vector((0, -.42, 2.6)), Vector((0, -.55, 2.5))]
    tube_through('Arm', bezier_pts(arm, 10), .03, 'iron', seg=6)
    lp = Vector((0, -.55, 2.22))
    finish(cylinder('Chain', lp + Vector((0, 0, .26)), lp + Vector((0, 0, .18)), .01, seg=4), 'iron', ['x'])
    finish(loft('Roof', [(lp + Vector((0, 0, .14)), .16, .16, math.radians(45)), (lp + Vector((0, 0, .24)), .02, .02, math.radians(45))], seg=4),
           'iron', ['x'], smooth=False)
    finish(box('Glass', lp, (.18, .18, .24), bevel=.02), None, ['x'], material=glow)
    for sx in (-1, 1):
        for sy in (-1, 1):
            finish(cylinder('Frame', lp + Vector((sx * .09, sy * .09, -.12)), lp + Vector((sx * .09, sy * .09, .13)), .012, seg=4), 'iron', ['x'])
    finish(box('Bottom', lp + Vector((0, 0, -.13)), (.2, .2, .03)), 'iron', ['x'])
    finish(ellipsoid('Finial', (0, 0, 2.5), (.06, .06, .07), seg=8, rings=6), 'brass', ['x'])


# ------------------------------------------------------------------ signpost (post only) + board
def signpost():
    finish(cylinder('Post', (0, 0, -.1), (0, 0, 2.45), .085, .075, seg=10), 'wood', ['x'])
    finish(loft('Cap', [((0, 0, 2.42), .14, .14, math.radians(45)), ((0, 0, 2.6), .02, .02, math.radians(45))], seg=4), 'wood_dark', ['x'], smooth=False)
    for k in range(5):
        a = k * 1.25
        finish(ellipsoid('Grass', (.18 * math.cos(a), .18 * math.sin(a), .08), (.12, .12, .14), seg=8, rings=5), 'leaf' if k % 2 else 'leaf_light', ['x'])


def sign_board():
    """arrow board pointing +X (Godot +X), 1.3 m long, centred at its post end (origin)"""
    Lb, Hb, T = 1.25, .28, .06
    verts = []
    shape = [(0.0, -Hb / 2), (Lb - .22, -Hb / 2), (Lb, 0.0), (Lb - .22, Hb / 2), (0.0, Hb / 2)]
    for y in (-T / 2, T / 2):
        for x, z in shape:
            verts.append((x + .05, y, z))
    n = len(shape)
    faces = [tuple(range(n))[::-1], tuple(range(n, 2 * n))]
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, j, n + j, n + i))
    ob = mesh_obj('Board', verts, faces)
    recalc(ob)
    finish(ob, 'wood_light', ['x'], smooth=False)
    for x in (.18, Lb - .38):
        finish(cylinder('Nail', (x, -T / 2 - .01, 0), (x, -T / 2 + .01, 0), .018, seg=6), 'iron', ['x'])
        finish(cylinder('NailB', (x, T / 2 - .01, 0), (x, T / 2 + .01, 0), .018, seg=6), 'iron', ['x'])


# ------------------------------------------------------------------ forest gate (chapter II, closed)
def forest_gate():
    glow = emissive_cell('glass', 2.2)
    span = 4.6
    for sx in (-1, 1):
        x = sx * span / 2
        pts = [Vector((x + .05 * math.sin(i), .03 * math.cos(i * 1.3), i * .45)) for i in range(9)]
        finish(tube('Log', pts, [.30, .28, .27, .26, .25, .25, .24, .24, .23], seg=12), 'wood_dark', ['x'], subsurf=1)
        for k in range(3):
            a = k * 2.1 + sx
            finish(tube('Root', [Vector((x, 0, .35)), Vector((x + .55 * math.cos(a), .55 * math.sin(a), -.05))], [.15, .06], seg=6), 'wood_dark', ['x'])
        finish(ellipsoid('Moss', (x, -.05, 2.2), (.33, .33, .55), seg=12, rings=8, deform=lambda q, v: lumpy(q, v, .05, 6, sx)), 'moss', ['x'])
        # lanterns on each log
        lp = Vector((x - sx * .35, -.25, 2.55))
        finish(box('LampCap', lp + Vector((0, 0, .2)), (.24, .24, .05), bevel=.02), 'iron', ['x'])
        finish(box('LampGlass', lp + Vector((0, 0, .07)), (.18, .18, .22), bevel=.02), None, ['x'], material=glow)
        finish(box('LampBase', lp + Vector((0, 0, -.06)), (.22, .22, .04), bevel=.02), 'iron', ['x'])
    beam = bezier_pts([(-span / 2 - .5, 0, 3.5), (0, 0, 4.25), (span / 2 + .5, 0, 3.5)], 16)
    finish(tube('TopBeam', beam, [.24] * 16, seg=12), 'wood', ['x'], subsurf=1)
    finish(tube('Crossbar', [Vector((-span / 2, -.02, 3.0)), Vector((span / 2, -.02, 3.0))], [.13, .13], seg=10), 'wood_dark', ['x'])
    # leafy vines along the beam
    for i in range(14):
        t = i / 13
        p = Vector(beam[int(t * 15)]) + Vector((rnd.uniform(-.15, .15), rnd.uniform(-.2, .2), rnd.uniform(.05, .3)))
        s = rnd.uniform(.22, .36)
        finish(ellipsoid('Vine', p, (s, s, s * .8), seg=10, rings=6, deform=lambda q, v, i=i: lumpy(q, v, s * .15, 6, i)),
               ['leaf', 'leaf_light', 'leaf_dark'][i % 3], ['x'])
        if i % 3 == 0:
            finish(ellipsoid('Bloom', p + Vector((0, -s * .8, s * .3)), (.07, .05, .07), seg=6, rings=4), 'flower_white', ['x'])
    # hanging sign board (text added in Godot as Label3D)
    for sx in (-1, 1):
        finish(cylinder('Rope', (sx * .9, -.05, 3.0), (sx * .9, -.05, 2.55), .02, seg=4), 'wood_grey', ['x'])
    finish(box('SignBoard', (0, -.08, 2.32), (2.4, .1, .55), bevel=.05), 'wood_light', ['x'])
    # closed double gate
    for sx in (-1, 1):
        cx = sx * span / 4
        for i in range(5):
            x = cx - span / 4 + .25 + i * (span / 2 - .5) / 4
            finish(box('GatePlank', (x, .05, 1.05), (.36, .08, 1.9 + .12 * math.sin(i * 1.3)), bevel=.03), ['wood', 'wood_light'][i % 2], ['x'])
        for z in (.45, 1.65):
            finish(box('GateRail', (cx, -.02, z), (span / 2 - .2, .07, .14), bevel=.02), 'wood_dark', ['x'])
        finish(tube('GateBrace', [Vector((cx - sx * (span / 4 - .2), -.04, .5)), Vector((cx + sx * (span / 4 - .25), -.04, 1.6))], [.05, .05], seg=6),
               'wood_dark', ['x'])
        finish(torus('Ring', (sx * .22, -.08, 1.05), .08, .015, seg=12, rseg=4, rot=Quaternion((1, 0, 0), math.radians(90))), 'brass', ['x'])


# ------------------------------------------------------------------ Tom's house interior (10 x 10 m room)
def tom_interior():
    glow = emissive_cell('glass', 1.8)
    fire = emissive_cell('fire', 3.2)
    S, H = 10.0, 3.2
    # floor planks
    for i in range(20):
        x = -S / 2 + .25 + i * .5
        finish(box('Floor', (x, 0, -.05), (.49, S, .1), bevel=.01), ['wood', 'wood_light', 'wood', 'wood_dark'][i % 4], ['x'])
    # walls: back (-Z Godot = +Y Blender) and sides, low front wall
    finish(box('BackWall', (0, S / 2, H / 2), (S, .2, H)), 'plaster', ['x'])
    for sx in (-1, 1):
        finish(box('SideWall', (sx * S / 2, 0, H / 2), (.2, S, H)), 'plaster', ['x'])
    finish(box('FrontWall', (0, -S / 2, .5), (S, .2, 1.0)), 'plaster', ['x'])
    # wainscot, beams, posts
    finish(box('WainBack', (0, S / 2 - .12, .5), (S, .06, 1.0)), 'wood', ['x'])
    for sx in (-1, 1):
        finish(box('WainSide', (sx * (S / 2 - .12), 0, .5), (.06, S, 1.0)), 'wood', ['x'])
        for yy in (-S / 2 + .15, 0, S / 2 - .15):
            finish(box('Post', (sx * (S / 2 - .15), yy, H / 2), (.24, .24, H)), 'wood_dark', ['x'])
    # no ceiling beams: the interior camera looks down from above
    finish(box('TopTrim', (0, S / 2 - .14, H - .3), (S, .08, .16)), 'wood_dark', ['x'])
    # round window on each side wall
    for sx in (-1, 1):
        c = Vector((sx * (S / 2 - .12), 1.0, 1.9))
        q = Quaternion((0, 1, 0), math.radians(90))
        finish(torus('WinRim', c, .5, .08, seg=20, rseg=6, rot=q), 'wood_dark', ['x'])
        finish(cylinder('WinGlass', c - Vector((sx * .02, 0, 0)), c + Vector((sx * .02, 0, 0)), .46, seg=18), None, ['x'], material=glow)
        finish(box('WinBarH', c, (.06, .95, .05)), 'wood_dark', ['x'])
        finish(box('WinBarV', c, (.06, .05, .95)), 'wood_dark', ['x'])
    # stone fireplace in the back wall
    fx, fy = 1.6, S / 2 - .45
    finish(box('Hearth', (fx, fy, .9), (2.2, .7, 1.8), bevel=.08), 'stone', ['x'])
    finish(box('HearthOpen', (fx, fy - .32, .55), (1.1, .12, .8), bevel=.05), 'soot', ['x'])
    finish(box('Mantel', (fx, fy - .1, 1.85), (2.5, .9, .14), bevel=.04), 'wood_dark', ['x'])
    finish(box('Chimney', (fx, fy + .1, 2.55), (1.4, .5, 1.3)), 'stone_light', ['x'])
    for k in range(10):
        a = rnd.uniform(0, 1)
        finish(ellipsoid('HearthStone', (fx - 1.0 + a * 2.0, fy - .36, rnd.uniform(.2, 1.6)), (.16, .04, .1), seg=8, rings=4),
               rnd.choice(['stone_light', 'stone_dark']), ['x'])
    for k in range(3):
        finish(cylinder('Log', (fx - .35 + k * .3, fy - .35, .22), (fx - .35 + k * .3 + .1, fy - .1, .22), .07, seg=8), 'wood_dark', ['x'])
    finish(ellipsoid('Flame', (fx, fy - .28, .45), (.32, .14, .3), seg=12, rings=8), None, ['x'], material=fire)
    finish(ellipsoid('FlameCore', (fx, fy - .32, .4), (.18, .1, .18), seg=10, rings=6), 'flower_yellow', ['x'])
    for k, col in enumerate(['potion', 'flower_pink', 'gold']):
        finish(ellipsoid('MantelJar', (fx - .8 + k * .8, fy - .2, 2.02), (.1, .1, .12), seg=10, rings=6), col, ['x'])
    # bookshelf on the back-left
    bx, by = -3.0, S / 2 - .4
    finish(box('Shelf', (bx, by, 1.3), (2.2, .55, 2.6), bevel=.03), 'wood_dark', ['x'])
    for level in range(4):
        z = .3 + level * .62
        finish(box('Board', (bx, by - .05, z), (2.1, .5, .05)), 'wood', ['x'])
        x = bx - .95
        while x < bx + .95:
            w = rnd.uniform(.06, .12)
            h = rnd.uniform(.32, .48)
            finish(box('Book', (x + w / 2, by - .12, z + .03 + h / 2), (w, .34, h), bevel=.008),
                   rnd.choice(['book_red', 'book_green', 'book_blue', 'book_yellow', 'parchment']), ['x'])
            x += w + .01
    # round table with map, candle, tea; two stools  (Godot: table centre at z=-1.5 -> Blender y=+1.5)
    tx, ty = 0.0, 1.5
    finish(cylinder('TableTop', (tx, ty, .78), (tx, ty, .86), 1.0, seg=28), 'wood_light', ['x'])
    finish(cylinder('TableLeg', (tx, ty, 0), (tx, ty, .8), .14, .2, seg=12), 'wood_dark', ['x'])
    finish(cylinder('TableFoot', (tx, ty, 0), (tx, ty, .06), .5, seg=16), 'wood_dark', ['x'])
    finish(box('Map', (tx - .2, ty, .87), (.8, .55, .01)), 'parchment', ['x'])
    finish(cylinder('MapRoll', (tx + .2, ty - .3, .9), (tx + .2, ty + .3, .9), .04, seg=8), 'parchment', ['x'])
    finish(cylinder('Candle', (tx + .5, ty + .3, .86), (tx + .5, ty + .3, 1.06), .04, seg=8), 'pillow', ['x'])
    finish(ellipsoid('CandleFlame', (tx + .5, ty + .3, 1.11), (.025, .025, .05), seg=6, rings=4), None, ['x'], material=fire)
    finish(cylinder('Cup', (tx - .55, ty - .3, .86), (tx - .55, ty - .3, .96), .06, .07, seg=10), 'cup', ['x'])
    for sx in (-1, 1):
        finish(cylinder('Stool', (sx * 1.5, ty, 0), (sx * 1.5, ty, .48), .28, .32, seg=14), 'wood', ['x'])
        finish(cylinder('Cushion', (sx * 1.5, ty, .48), (sx * 1.5, ty, .56), .30, seg=14), 'rug_red', ['x'])
    # round rug
    finish(cylinder('Rug', (0, .3, 0), (0, .3, .015), 2.2, seg=40), 'rug_blue', ['x'])
    finish(torus('RugTrim', (0, .3, .016), 2.0, .06, seg=40, rseg=4, sy=1), 'rug_gold', ['x'])
    # Tom's bed on the right, blue quilt
    bdx, bdy = 3.4, 2.6
    finish(box('BedFrame', (bdx, bdy, .3), (1.6, 2.4, .5), bevel=.05), 'wood_dark', ['x'])
    finish(box('Mattress', (bdx, bdy, .62), (1.45, 2.2, .2), bevel=.06), 'pillow', ['x'])
    finish(box('Quilt', (bdx, bdy - .25, .74), (1.55, 1.6, .1), bevel=.05), 'quilt', ['x'])
    finish(box('QuiltBand', (bdx, bdy + .5, .76), (1.56, .18, .1), bevel=.03), 'quilt_light', ['x'])
    finish(ellipsoid('Pillow', (bdx, bdy + .85, .82), (.55, .25, .12), seg=12, rings=6), 'pillow', ['x'])
    finish(box('Headboard', (bdx, bdy + 1.2, .9), (1.7, .12, 1.2), bevel=.06), 'wood', ['x'])
    # chest at the foot of the bed
    finish(box('Chest', (bdx, bdy - 1.6, .3), (1.0, .6, .6), bevel=.06), 'wood', ['x'])
    finish(box('ChestBand', (bdx, bdy - 1.6, .3), (1.04, .64, .08)), 'brass', ['x'])
    # potted plants and a wall banner with the village emblem
    for (px, py) in ((-4.3, -4.0), (4.3, -4.0)):
        finish(cylinder('Pot', (px, py, 0), (px, py, .45), .24, .3, seg=12), 'rug_red', ['x'])
        finish(ellipsoid('Plant', (px, py, .78), (.38, .38, .42), seg=12, rings=8, deform=lambda q, v: lumpy(q, v, .05, 6, px)), 'leaf', ['x'])
    finish(box('Banner', (-0.9, S / 2 - .14, 2.1), (.8, .04, 1.1), bevel=.02), 'quilt', ['x'])
    finish(torus('Emblem', (-0.9, S / 2 - .18, 2.2), .2, .04, seg=16, rseg=4, rot=Quaternion((1, 0, 0), math.radians(90))), 'gold', ['x'])
    # hanging lantern
    finish(cylinder('LanternChain', (0, 0, H - .2), (0, 0, H - .7), .015, seg=4), 'iron', ['x'])
    finish(box('LanternGlass', (0, 0, H - .85), (.3, .3, .32), bevel=.03), None, ['x'], material=glow)
    finish(box('LanternCap', (0, 0, H - .66), (.36, .36, .06), bevel=.02), 'iron', ['x'])


ALL = {'bridge': ('prop_bridge_curved', bridge), 'bridge_broken': ('prop_bridge_broken', lambda: bridge(True)), 'lamp': ('prop_lamp_post', lamp), 'signpost': ('prop_signpost', signpost),
       'sign_board': ('prop_sign_board', sign_board), 'gate': ('prop_forest_gate', forest_gate), 'interior': ('int_tom_house', tom_interior)}
if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('-')]
    for key, (name, fn) in ALL.items():
        if args and key not in args:
            continue
        init(f'{name}_v02', PAL, OUT, SRC)
        fn()
        join_static(f'{name}_v02')
        export(OUT / f'{name}_v02.glb', SRC / f'{name}_v02.blend')
