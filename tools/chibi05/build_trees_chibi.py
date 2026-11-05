"""Build chibi05 vegetation (REF_04_VILLAGE_SCENE.png, tree/bush rows).

    python tools/chibi05/build_trees_chibi.py

Outputs assets/environment/village/models/veg_<name>_v02.glb. Sizes match the Quaternius
trees they replace (~7 m trees, ~1.4 m bushes) so existing placements keep their scale.
"""
import bpy  # noqa: F401
import math, os, random, sys
from pathlib import Path
from mathutils import Vector, Quaternion

ROOT = Path(os.environ.get('NGOC_ROOT', os.getcwd()))
sys.path.insert(0, str(ROOT / 'tools/chibi05'))
from chibi_lib import *  # noqa

OUT = ROOT / 'assets/environment/village/models'
SRC = ROOT / 'art_source/chibi05/vegetation'
PAL = {
    'bark': ('8a5a34', .9, 0), 'bark_dark': ('63401f', .9, 0), 'birch': ('efe9dc', .85, 0), 'birch_mark': ('3e3630', .9, 0),
    'leaf_dark': ('3f8a34', .85, 0), 'leaf': ('56a83c', .85, 0), 'leaf_light': ('7cc44a', .8, 0), 'leaf_yellow': ('a8d050', .8, 0),
    'pine_dark': ('2f6e3a', .85, 0), 'pine': ('3f8a46', .85, 0), 'pine_light': ('5aa456', .8, 0),
    'pink': ('f39ab8', .8, 0), 'pink_light': ('fbc2d4', .8, 0), 'pink_dark': ('e07a9c', .8, 0),
    'flower_white': ('f8f4ec', .7, 0), 'flower_yellow': ('f6d24a', .7, 0), 'flower_red': ('e44a40', .7, 0), 'flower_pink': ('f08ab0', .7, 0),
    'grass': ('62b040', .85, 0), 'moss': ('6aa84a', .9, 0),
}


def trunk(height, r0, lean=(0, 0), roots=4, col='bark', seed=0):
    rnd = random.Random(seed)
    pts, rad = [], []
    for i in range(7):
        t = i / 6
        pts.append(Vector((lean[0] * t * t + .05 * math.sin(t * 5 + seed), lean[1] * t * t + .05 * math.cos(t * 4 + seed), height * t)))
        rad.append(r0 * (1.25 - .55 * t) + (r0 * .5 if i == 0 else 0))
    finish(tube('Trunk', pts, rad, seg=10), col, ['x'], subsurf=1)
    for k in range(roots):
        a = 2 * math.pi * k / roots + rnd.uniform(-.3, .3)
        d = Vector((math.cos(a), math.sin(a), 0))
        finish(tube('Root', [Vector((0, 0, .45)), d * r0 * 1.6 + Vector((0, 0, .12)), d * r0 * 2.6 + Vector((0, 0, -.02))], [r0 * .55, r0 * .45, r0 * .2], seg=8),
               col, ['x'])
    return pts[-1]


def branch(a, b, r, col='bark'):
    finish(tube('Branch', [Vector(a), (Vector(a) + Vector(b)) / 2 + Vector((0, 0, .15)), Vector(b)], [r, r * .8, r * .5], seg=8), col, ['x'])


def canopy(center, radius, clusters, cols, seed=0, squash=.85, bump=.16):
    rnd = random.Random(seed)
    c0 = Vector(center)
    finish(ellipsoid('CanopyCore', c0, (radius * .82, radius * .82, radius * .72 * squash), seg=16, rings=10,
                     deform=lambda q, v: lumpy(q, v, radius * .05, 5, seed)), cols[0], ['x'])
    for k in range(clusters):
        # Fibonacci-ish spread on the upper hemisphere + a lower ring
        y = 1 - (k + .5) / clusters * 1.35
        r = math.sqrt(max(0, 1 - y * y))
        a = k * 2.399 + seed
        d = Vector((math.cos(a) * r, math.sin(a) * r, y * squash))
        s = radius * rnd.uniform(.42, .58)
        col = cols[1] if d.z > .25 else (cols[2] if d.z < -.2 else rnd.choice(cols[:2]))
        if d.z > .55:
            col = cols[3] if len(cols) > 3 else cols[1]
        finish(ellipsoid('Clump', c0 + d * radius * .72, (s, s, s * .85), seg=12, rings=8,
                         deform=lambda q, v, k=k: lumpy(q, v, s * bump, 6, k + seed)), col, ['x'])
        # smaller leaf tufts on the clump surface give the scalloped, leafy silhouette
        for j in range(1):
            e = (d + Vector((rnd.uniform(-.5, .5), rnd.uniform(-.5, .5), rnd.uniform(-.2, .4)))).normalized()
            ts = s * rnd.uniform(.38, .5)
            finish(ellipsoid('Tuft', c0 + d * radius * .72 + e * s * .78, (ts, ts, ts * .8), seg=8, rings=5,
                             deform=lambda q, v, j=j: lumpy(q, v, ts * .15, 7, j + k)), col if d.z < .45 else cols[min(len(cols) - 1, 3)], ['x'])


def dots(center, radius, n, colors, size=.12, seed=0, upper=.0):
    rnd = random.Random(seed + 99)
    for k in range(n):
        while True:
            d = Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(upper, 1)))
            if .2 < d.length <= 1:
                break
        d.normalize()
        p = Vector(center) + Vector((d.x, d.y, d.z * .85)) * radius
        finish(ellipsoid('Blossom', p, (size, size, size * .8), seg=8, rings=6), rnd.choice(colors), ['x'])


def build(name, fn):
    init(f'veg_{name}_v02', PAL, OUT, SRC)
    fn()
    join_static(f'veg_{name}_v02')
    export(OUT / f'veg_{name}_v02.glb', SRC / f'veg_{name}_v02.blend')


def oak_a():
    top = trunk(3.6, .32, seed=1)
    for a in (0.4, 2.6, 4.5):
        branch(top - Vector((0, 0, .8)), top + Vector((math.cos(a) * 1.3, math.sin(a) * 1.3, .4)), .14)
    canopy(top + Vector((0, 0, 1.2)), 2.6, 16, ['leaf', 'leaf_light', 'leaf_dark', 'leaf_yellow'], seed=1)


def oak_b():
    top = trunk(3.2, .30, lean=(.4, .2), seed=3)
    canopy(top + Vector((0, 0, 1.4)), 2.3, 13, ['leaf_dark', 'leaf', 'leaf_dark', 'leaf_light'], seed=3)
    canopy(top + Vector((.9, .4, .3)), 1.3, 7, ['leaf', 'leaf_light', 'leaf_dark'], seed=4)
    canopy(top + Vector((-1.0, -.3, .5)), 1.2, 7, ['leaf', 'leaf_light', 'leaf_dark'], seed=5)


def oak_wide():
    top = trunk(2.7, .40, seed=7)
    for a in (0.0, 1.6, 3.2, 4.7):
        branch(top - Vector((0, 0, .5)), top + Vector((math.cos(a) * 2.0, math.sin(a) * 2.0, .5)), .16)
    canopy(top + Vector((0, 0, 1.2)), 2.4, 14, ['leaf', 'leaf_light', 'leaf_dark', 'leaf_yellow'], seed=7, squash=.75)
    for a in (0.0, 1.6, 3.2, 4.7):
        canopy(top + Vector((math.cos(a) * 2.2, math.sin(a) * 2.2, .7)), 1.3, 6, ['leaf', 'leaf_light', 'leaf_dark'], seed=8 + a)


def blossom():
    top = trunk(3.0, .30, lean=(-.3, .2), seed=11, col='bark_dark')
    canopy(top + Vector((0, 0, 1.3)), 2.4, 15, ['pink', 'pink_light', 'pink_dark', 'pink_light'], seed=11)
    dots(top + Vector((0, 0, 1.3)), 2.5, 26, ['flower_white', 'pink_light'], size=.13, seed=11, upper=-.3)


def pine(tiers=5, h=7.3, r=2.5, seed=0):
    finish(tube('PineTrunk', [Vector((0, 0, 0)), Vector((0, 0, 1.6))], [.32, .26], seg=10), 'bark', ['x'])
    for k in range(3):
        a = k * 2.1
        finish(tube('PineRoot', [Vector((0, 0, .35)), Vector((math.cos(a) * .55, math.sin(a) * .55, -.02))], [.16, .06], seg=6), 'bark', ['x'])
    z0 = 1.2
    tier_h = (h - z0) / tiers * 1.35
    for k in range(tiers):
        t = k / (tiers - 1)
        rr = r * (1 - .72 * t)
        zb = z0 + k * (h - z0 - tier_h * .5) / tiers
        cols = ['pine_dark', 'pine', 'pine_light']
        skirt = loft('Tier', [((0, 0, zb), rr, rr), ((0, 0, zb + tier_h * .18), rr * .97, rr * .97), ((0, 0, zb + tier_h * .55), rr * .55, rr * .55),
                              ((0, 0, zb + tier_h), rr * .08, rr * .08)], seg=24, caps=(True, True),
                     shape=lambda a, i, k=k: 1 + (.10 * math.cos(a * 9 + k) if i < 2 else .04 * math.cos(a * 9 + k)))
        finish(skirt, cols[min(2, k % 3)] if k else 'pine_dark', ['x'], subsurf=1)
    finish(ellipsoid('PineTip', (0, 0, h - .1), (.18, .18, .26), seg=8, rings=6), 'pine_light', ['x'])


def pine_a():
    pine(5, 7.3, 2.5, 0)


def pine_b():
    pine(4, 6.4, 2.2, 1)


def birch():
    top = trunk(4.6, .22, lean=(.2, -.1), roots=3, col='birch', seed=21)
    rnd = random.Random(21)
    for k in range(9):
        z = .5 + k * .45
        a = rnd.uniform(0, 6.28)
        finish(ellipsoid('BirchMark', (math.cos(a) * .24 * (1.2 - .1 * k / 2), math.sin(a) * .24 * (1.2 - .1 * k / 2), z), (.10, .10, .035), seg=8, rings=4,
                         rot=Quaternion((0, 0, 1), a)), 'birch_mark', ['x'])
    canopy(top + Vector((0, 0, 1.1)), 1.8, 11, ['leaf_light', 'leaf_yellow', 'leaf', 'leaf_yellow'], seed=21, squash=1.05)
    canopy(top + Vector((.3, 0, 2.3)), 1.1, 6, ['leaf_yellow', 'leaf_light', 'leaf'], seed=22)


def bush():
    for k, (x, y, r) in enumerate([(0, 0, .65), (.55, .2, .48), (-.5, .15, .5), (.1, -.45, .45)]):
        finish(ellipsoid('Bush', (x, y, r * .8), (r, r, r * .85), seg=12, rings=8, deform=lambda q, v, k=k: lumpy(q, v, r * .12, 6, k)),
               ['leaf', 'leaf_dark', 'leaf_light', 'leaf'][k], ['x'])


def bush_flower():
    bush()
    dots((0, 0, .55), .78, 16, ['flower_pink', 'flower_white', 'flower_yellow'], size=.09, seed=3, upper=-.1)


def bush_red():
    bush()
    dots((0, 0, .55), .78, 14, ['flower_red'], size=.10, seed=5, upper=-.1)


ALL = {'oak_a': oak_a, 'oak_b': oak_b, 'oak_wide': oak_wide, 'blossom': blossom, 'pine_a': pine_a, 'pine_b': pine_b, 'birch': birch,
       'bush': bush, 'bush_flower': bush_flower, 'bush_red': bush_red}
if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('-')]
    for n, fn in ALL.items():
        if not args or n in args:
            build(n, fn)
