"""Pip, the little river spirit (chibi05): big round glowing head, leaf hat, leaf wings, wisp tail.

    python tools/chibi05/build_pip_chibi.py

Output assets/npc/models/npc_pip_spirit_v02.glb (static mesh, ~0.55 m tall, origin at the tail tip).
Front = Blender -Y (Godot +Z). Godot floats, bobs and tilts it (systems/bridge_repair_quest.gd).
"""
import bpy  # noqa: F401
import math, os, sys
from pathlib import Path
from mathutils import Quaternion

ROOT = Path(os.environ.get('NGOC_ROOT', os.getcwd()))
sys.path.insert(0, str(ROOT / 'tools/chibi05'))
from chibi_lib import *  # noqa

OUT = ROOT / 'assets/npc/models'
SRC = ROOT / 'art_source/chibi05/npc'
PAL = {
    'spirit': ('bff1ff', .35, 0), 'spirit_dark': ('7fd3f0', .4, 0), 'ink': ('1f2a3a', .3, 0), 'shine': ('ffffff', .2, 0),
    'blush': ('ff9ec0', .6, 0), 'leaf': ('5fb64a', .7, 0), 'leaf_dark': ('3f8a35', .7, 0), 'wing': ('b8f0a0', .5, 0),
}


def pip():
    glow = emissive_cell('spirit', 1.4)
    wing_glow = emissive_cell('wing', .8)
    # wisp tail -> body -> big head (chibi proportions)
    finish(ellipsoid('Tail', (0, .03, .07), (.045, .045, .09), seg=12, rings=8), None, ['x'], material=glow)
    finish(ellipsoid('Body', (0, 0, .17), (.11, .10, .11), seg=16, rings=10), 'spirit_dark', ['x'])
    finish(ellipsoid('Head', (0, 0, .36), (.20, .185, .18), seg=24, rings=14), None, ['x'], material=glow)
    # face (front = -Y)
    for sx in (-1, 1):
        finish(ellipsoid('Eye', (sx * .072, -.165, .37), (.034, .02, .05), seg=12, rings=8), 'ink', ['x'])
        finish(ellipsoid('Shine', (sx * .062, -.183, .393), (.012, .008, .015), seg=8, rings=6), 'shine', ['x'])
        finish(ellipsoid('Blush', (sx * .12, -.15, .315), (.032, .01, .018), seg=8, rings=6), 'blush', ['x'])
        # little arms
        finish(ellipsoid('Arm', (sx * .12, -.02, .17), (.035, .03, .05), seg=8, rings=6,
                         rot=Quaternion((0, 1, 0), sx * math.radians(35))), 'spirit_dark', ['x'])
        # leaf wings on the back
        finish(ellipsoid('Wing', (sx * .19, .09, .30), (.16, .018, .075), seg=14, rings=8,
                         rot=Quaternion((0, 0, 1), sx * math.radians(-25)) @ Quaternion((0, 1, 0), sx * math.radians(25))),
               None, ['x'], material=wing_glow)
    finish(ellipsoid('Mouth', (0, -.178, .315), (.024, .008, .009), seg=8, rings=6), 'ink', ['x'])
    # leaf hat with a stem
    finish(cylinder('Stem', (0, 0, .53), (.02, .0, .6), .012, seg=6), 'leaf_dark', ['x'])
    finish(ellipsoid('Leaf', (.0, .02, .55), (.08, .17, .018), seg=14, rings=8,
                     rot=Quaternion((1, 0, 0), math.radians(-18))), 'leaf', ['x'])
    finish(ellipsoid('LeafVein', (.0, .02, .562), (.008, .15, .006), seg=6, rings=4,
                     rot=Quaternion((1, 0, 0), math.radians(-18))), 'leaf_dark', ['x'])


if __name__ == '__main__':
    name = 'npc_pip_spirit_v02'
    init(name, PAL, OUT, SRC)
    pip()
    join_static(name)
    export(OUT / f'{name}.glb', SRC / f'{name}.blend')
