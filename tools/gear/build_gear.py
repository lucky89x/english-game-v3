"""Gear for Ngọc: swords, body armour, hip charms (batch 14). Run: OUT=<folder> blender -b -P tools/gear/build_gear.py
(optional ONLY=gear_sword_wood,gear_armor_iron).
Swords: origin at the grip centre, blade along Blender +Z (glTF +Y), flat of the blade facing Blender -Y (glTF +Z),
~0.75 m with the grip; materials blade, guard, grip, pommel, glow (crystal_glow / moon_glow on those two swords).
Armour and charms are built in Ngọc's own coordinates (chr_ngoc_adventurer_v04: feet at 0, 1.56 m, front Blender -Y), the
shell is cast onto her torso by ray casting so it hugs the body, leaving neck and arms free.
"""
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "harbor"))
from hlib import *  # noqa
import bpy, bmesh
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

ONLY = [s for s in os.environ.get("ONLY", "").split(",") if s]
REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
NGOC = os.path.join(REPO, "assets", "models", "chr_ngoc_adventurer_v04.glb")


# ------------------------------------------------------------------ swords
def blade(z0, z1, w0, w1, t, m, tip=.08, seg=6, curve=0.0, wave=0.0):
    """flat diamond-section blade from z0 to z1 (half widths w0 -> w1), pointed tip of length `tip`"""
    verts, faces = [], []
    n = seg
    for i in range(n + 1):
        f = i / n
        z = z0 + (z1 - tip - z0) * f
        w = w0 + (w1 - w0) * f + wave * math.sin(f * math.pi * 3)
        x = curve * f * f
        verts += [(x - w, 0, z), (x, -t, z), (x + w, 0, z), (x, t, z)]
    xt = curve
    verts.append((xt, 0, z1))
    top = len(verts) - 1
    for i in range(n):
        a = i * 4
        for k in range(4):
            faces.append([a + k, a + (k + 1) % 4, a + 4 + (k + 1) % 4, a + 4 + k])
    a = n * 4
    for k in range(4):
        faces.append([a + k, a + (k + 1) % 4, top])
    faces.append([3, 2, 1, 0])
    o = mesh(verts, faces, m)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(o.data)
    bm.free()
    return o


def wrap_grip(z0, z1, r, m, m2=None, rings=6):
    cyl(r, z1 - z0, (0, 0, (z0 + z1) / 2), m, 8)
    if m2:
        for k in range(rings):
            z = z0 + (k + .5) * (z1 - z0) / rings
            torus(r + .004, .005, (0, 0, z), m2, 8, 3, rot=(.25 * (1 if k % 2 else -1), 0, 0))


def sword(kind):
    reset()
    if kind == "wood":
        bl, gd = mat("blade", "#D9B07A", rough=.7), mat("guard", "#9A6A3E", rough=.7)
        gp, pm = mat("grip", "#6B4428", rough=.8), mat("pommel", "#9A6A3E", rough=.7)
        cord = mat("cord", "#E8D8B0", rough=.9)
        blade(.11, .64, .032, .028, .012, bl, tip=.07)
        box((.16, .04, .035), (0, 0, .09), gd, bev=.008)
        wrap_grip(-.08, .07, .016, gp, cord)
        ball(.03, (0, 0, -.1), pm, uv=(10, 6))
    elif kind == "iron":
        bl, gd = mat("blade", "#C9CED6", rough=.18, metal=.95), mat("guard", "#B5823A", rough=.3, metal=.8)
        gp, pm = mat("grip", "#3A2A22", rough=.7), mat("pommel", "#B5823A", rough=.3, metal=.8)
        blade(.11, .65, .028, .02, .008, bl, tip=.1)
        box((.012, .004, .4), (0, -.008, .32), mat("blade_fuller", "#9AA0A8", rough=.3, metal=.9))
        box((.012, .004, .4), (0, .008, .32), mat("blade_fuller", "#9AA0A8"))
        cyl(.012, .2, (0, 0, .09), gd, 8, rot=(0, math.pi / 2, 0))
        for s in (-1, 1):
            ball(.018, (s * .1, 0, .09), gd, uv=(8, 5))
        wrap_grip(-.08, .07, .015, gp, gp, 5)
        ball(.026, (0, 0, -.1), pm, uv=(10, 6), scale=(1, .8, 1))
    elif kind == "crystal":
        bl = mat("crystal_glow", "#7FD0FF", rough=.05, emit=1.2, alpha=.8)
        gd, gp, pm = mat("guard", "#D8DDE4", rough=.2, metal=.9), mat("grip", "#2A3E66", rough=.6), mat("pommel", "#D8DDE4", rough=.2, metal=.9)
        blade(.11, .66, .034, .022, .014, bl, tip=.12, seg=4)
        box((.14, .04, .03), (0, 0, .09), gd, bev=.008)
        for s in (-1, 1):
            cyl(.02, .06, (s * .085, 0, .11), bl, 6, r2=0, rot=(0, s * .5, 0))
        wrap_grip(-.08, .07, .015, gp, gd, 4)
        cyl(.03, .05, (0, 0, -.11), pm, 6, r2=.0, rot=(math.pi, 0, 0))
        ball(.018, (0, 0, -.085), bl, uv=(8, 5))
    elif kind == "oak":
        bl, gd = mat("blade", "#A8502E", rough=.6), mat("guard", "#6E3F20", rough=.7)
        gp, pm = mat("grip", "#4A2E18", rough=.8), mat("pommel", "#6E3F20", rough=.7)
        grain, leaf = mat("blade_grain", "#7A3820", rough=.7), mat("leaf_oak", "#5FA040", rough=.7)
        blade(.11, .65, .034, .026, .013, bl, tip=.08, wave=.004)
        for k, x in enumerate((-.014, .0, .014)):
            for s in (-1, 1):
                box((.003, .003, .3 + .08 * (k % 2)), (x, s * .0075, .32), grain)
        box((.15, .045, .04), (0, 0, .09), gd, bev=.012)
        wrap_grip(-.08, .07, .016, gp, gd, 4)
        ball(.028, (0, 0, -.1), pm, uv=(8, 5))
        for a in (-1, 0, 1):   # oak leaves fanned on the pommel
            ball(.035, (a * .03, 0, -.13 - .01 * (a == 0)), leaf, uv=(8, 4), scale=(.55, .2, 1), rot=(0, a * .7, 0))
        ball(.012, (0, 0, -.125), mat("acorn", "#8A5A2A"), uv=(6, 4))
    elif kind == "moon":
        bl = mat("blade", "#E6F2FF", rough=.12, metal=.6)
        glow = mat("moon_glow", "#BFE6FF", emit=2.0, rough=.2)
        gd, gp, pm = mat("guard", "#D8DDE4", rough=.2, metal=.9), mat("grip", "#2C3E66", rough=.6), mat("pommel", "#D8DDE4", rough=.2, metal=.9)
        blade(.12, .67, .03, .02, .009, bl, tip=.12, curve=.025)
        box((.006, .006, .44), (.0, -.009, .36), glow)
        o = torus(.06, .012, (0, 0, .1), gd, 16, 4, rot=(math.pi / 2, 0, 0))        # crescent moon guard
        bm = bmesh.new()
        bm.from_mesh(o.data)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.y > .015], context='VERTS')
        bm.to_mesh(o.data)
        bm.free()
        ball(.02, (0, -.0, .06), glow, uv=(8, 5))
        wrap_grip(-.08, .055, .015, gp, gd, 4)
        ball(.024, (0, 0, -.1), pm, uv=(10, 6))
        ball(.012, (0, -.022, -.1), glow, uv=(6, 4))
    group("sword_" + kind, origin=None)
    export("gear_sword_%s_v01" % kind)


# ------------------------------------------------------------------ armour cast on Ngọc's torso
def body_tree():
    bpy.ops.import_scene.gltf(filepath=NGOC)
    body = bpy.data.objects["Ngoc"]
    vs = [body.matrix_world @ v.co for v in body.data.vertices]
    tree = BVHTree.FromPolygons(vs, [list(p.vertices) for p in body.data.polygons])
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    return tree


def shell(tree, z0, z1, rows, cols, off, m, a0=0.0, a1=2 * math.pi, thick=.014, closed=True, bulge=None):
    """surface hugging the torso between heights z0..z1 and angles a0..a1 (0 = front, + towards her left)"""
    grid = []
    for r in range(rows + 1):
        z = z0 + (z1 - z0) * r / rows
        row = []
        nc = cols if closed else cols + 1
        for c in range(nc):
            a = a0 + (a1 - a0) * c / cols
            d = Vector((math.sin(a), -math.cos(a), 0))
            o = Vector((0, .005, z))
            hit = tree.ray_cast(o, d, .6)[0]
            p = hit if hit else o + d * .15
            ex = off + (bulge(a, (z - z0) / (z1 - z0)) if bulge else 0)
            row.append(p + d * ex)
        grid.append(row)
    for c in range(len(grid[0])):   # smooth jitter from straps/potion bumps between rows
        for r in range(1, rows):
            grid[r][c] = (grid[r - 1][c] + grid[r][c] * 2 + grid[r + 1][c]) / 4
    verts, faces = [], []
    nc = len(grid[0])
    for row in grid:
        verts += row
    for r in range(rows):
        for c in range(nc if closed else nc - 1):
            c2 = (c + 1) % nc
            faces.append([r * nc + c, r * nc + c2, (r + 1) * nc + c2, (r + 1) * nc + c])
    o = mesh(verts, faces, m)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if not closed:
        for f in bm.faces:   # open shells: make normals point away from the body axis
            cc = f.calc_center_median()
            if f.normal.dot(Vector((cc.x, cc.y, 0))) < 0:
                f.normal_flip()
    else:
        for f in bm.faces:
            cc = f.calc_center_median()
            if f.normal.dot(Vector((cc.x, cc.y - .005, 0))) < 0:
                f.normal_flip()
    bmesh.ops.solidify(bm, geom=list(bm.faces), thickness=thick)
    bm.to_mesh(o.data)
    bm.free()
    return o, grid


def rim(points, w, m, close=True, step=2):
    pts = points[::step] + ([points[0]] if close else ([points[-1]] if (len(points) - 1) % step else []))
    for a, b in zip(pts, pts[1:]):
        beam(tuple(a), tuple(b), w, m, w * .6)


def vest_leather(tree):
    lea, dark, metal = mat("leather_brown", "#8C5631", rough=.7), mat("leather_dark", "#5F3519", rough=.75), mat("metal", "#C9B27A", rough=.3, metal=.85)
    o, g = shell(tree, .5, .79, 5, 12, .022, lea, a0=.28, a1=2 * math.pi - .28, closed=False)
    rim(g[-1], .018, dark, close=False)
    rim(g[0], .02, dark, close=False)
    for k in range(3):   # laces across the front opening
        z = .55 + k * .08
        l, r = g[int(round((z - .5) / .29 * 5))][0], g[int(round((z - .5) / .29 * 5))][-1]
        beam(tuple(l + Vector((0, -.006, 0))), tuple(r + Vector((0, -.006, .025))), .008, dark)
        beam(tuple(l + Vector((0, -.006, .025))), tuple(r + Vector((0, -.006, 0))), .008, dark)
        for p in (l, r):
            ball(.008, tuple(p + Vector((0, -.008, .012))), metal, uv=(5, 3))
    for c in (3, 9):   # two side buckles
        p = g[2][c]
        box((.03, .012, .025), tuple(p + (p - Vector((0, 0, p.z))).normalized() * .012), metal, bev=.003)
    group("vest_leather", origin=None)
    export("gear_vest_leather_v01")


def armor_iron(tree):
    iron, bronze = mat("iron", "#B4BAC2", rough=.25, metal=.9), mat("bronze_trim", "#B5823A", rough=.3, metal=.8)
    o, g = shell(tree, .52, .79, 4, 14, .03, iron, bulge=lambda a, f: .015 * math.cos(a) ** 2 * math.sin(math.pi * f))
    rim(g[-1], .018, bronze)
    rim(g[0], .02, bronze)
    rim([g[r][0] for r in range(len(g))], .012, bronze, close=False)
    for s in (-1, 1):   # pauldrons: two stacked shell plates over each shoulder
        for k, (r, z) in enumerate(((.12, .8), (.1, .76))):
            ob = ball(r, (s * .2, .005, z), iron, uv=(10, 4), scale=(1.05, 1.15, .6), rot=(0, s * .5, 0))
            bm = bmesh.new()
            bm.from_mesh(ob.data)
            bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -.2 * r], context='VERTS')
            bm.to_mesh(ob.data)
            bm.free()
            torus(r * 1.02, .008, (s * .2, .005, z - .002), bronze, 8, 3, rot=(0, s * .5, 0))
            OBJS[-1].scale = (1.05, 1.15, 1)
        ball(.015, (s * .2 + s * .05, -.0, .86), bronze, uv=(6, 4))
    group("armor_iron", origin=None)
    export("gear_armor_iron_v01")


def cloak_ranger(tree):
    green, green2 = mat("cloak_green", "#5E7A3E", rough=.85), mat("cloak_green_dark", "#43592A", rough=.85)
    gold, leaf = mat("metal", "#C9A548", rough=.3, metal=.8), mat("leaf_pin", "#7DBA52", rough=.6)
    # shoulder mantle around the upper torso
    o, g = shell(tree, .7, .81, 2, 18, .03, green, a0=.45, a1=2 * math.pi - .45, closed=False)
    # cape: hangs from the shoulders down the back, flaring out
    rows, cols = 7, 9
    verts, faces = [], []
    for r in range(rows + 1):
        f = r / rows
        z = .8 - .48 * f
        for c in range(cols + 1):
            u = c / cols * 2 - 1
            wdt = .2 + .12 * f
            y = .16 + .07 * f + .04 * (1 - u * u)
            verts.append((u * wdt, y + .02 * math.sin(c * 1.7 + r), z))
    for r in range(rows):
        for c in range(cols):
            a = r * (cols + 1) + c
            faces.append([a, a + 1, a + cols + 2, a + cols + 1])
    cape = mesh(verts, faces, green2)
    bm = bmesh.new()
    bm.from_mesh(cape.data)
    for f in bm.faces:
        if f.normal.y < 0:
            f.normal_flip()
    bmesh.ops.solidify(bm, geom=list(bm.faces), thickness=.012)
    bm.to_mesh(cape.data)
    bm.free()
    # lowered hood bunched behind the neck
    ball(.11, (0, .14, .85), green, uv=(12, 6), scale=(1.3, .7, .55))
    ball(.08, (0, .19, .8), green2, uv=(10, 5), scale=(1.2, .6, .6))
    # leaf brooch at the front
    ball(.03, (.06, -.15, .79), leaf, uv=(8, 4), scale=(.7, .25, 1.2), rot=(0, .5, 0))
    ball(.012, (.06, -.16, .77), gold, uv=(6, 4))
    group("cloak_ranger", origin=None)
    export("gear_cloak_ranger_v01")


def armor_bark(tree):
    bark, bark2 = mat("bark_brown", "#7A5230", rough=.95), mat("bark_dark", "#563821", rough=.95)
    moss, leaf = mat("moss", "#6E8A58", rough=.9), mat("leaf_green", "#5FA040", rough=.7)
    o, g = shell(tree, .5, .79, 5, 12, .02, bark2)
    rnd = random.Random(3)
    for r in range(0, 5, 1):   # overlapping bark plates on top of the shell
        for c in range(0, 12, 2):
            cc = c + (r % 2)
            p = (g[r][cc % 12] + g[r + 1][(cc + 1) % 12]) / 2
            n = Vector((p.x, p.y - .005, 0)).normalized()
            box((.07, .016, .055), tuple(p + n * .012), bark if (r + c) % 3 else bark2,
                rot=(0, 0, math.atan2(n.x, -n.y)))
    for k in range(3):
        c = rnd.randrange(12)
        p = g[rnd.randrange(1, 5)][c]
        n = Vector((p.x, p.y, 0)).normalized()
        ball(.035, tuple(p + n * .025), moss, sub=1, scale=(1, 1, .5))
    for s in (-1, 1):   # leafy shoulders
        ball(.07, (s * .19, .0, .8), moss, sub=1, scale=(1.1, 1.1, .5))
        for k in range(3):
            a = k * 2.1
            ball(.05, (s * .19 + .05 * math.cos(a), .05 * math.sin(a), .83), leaf, uv=(6, 3), scale=(.55, 1, .15),
                 rot=(.4, s * .3, a))
    group("armor_bark", origin=None)
    export("gear_armor_bark_v01")


# ------------------------------------------------------------------ hip charms (worn on her left hip)
HIP = Vector((.2, -.07, .42))


def charm_clover():
    reset()
    green, gold = mat("clover_green", "#4FB04A", rough=.5), mat("cord_gold", "#E2B04A", rough=.3, metal=.8)
    beam(tuple(HIP + Vector((0, 0, .1))), tuple(HIP + Vector((0, 0, .03))), .006, gold)
    torus(.012, .004, tuple(HIP + Vector((0, 0, .1))), gold, 8, 3, rot=(math.pi / 2, 0, 0))
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        for s in (-1, 1):   # each leaf is a heart: two lobes
            b = a + s * .35
            ball(.016, tuple(HIP + Vector((.022 * math.cos(b), -.003, .022 * math.sin(b)))), green, uv=(8, 5), scale=(1, .35, 1))
    ball(.006, tuple(HIP + Vector((0, -.006, 0))), gold, uv=(6, 4))
    beam(tuple(HIP), tuple(HIP + Vector((.006, 0, -.035))), .005, green)
    group("charm_clover", origin=None)
    export("gear_charm_clover_v01")


def charm_owlfeather():
    reset()
    brown, cream, dot = mat("feather_brown", "#8A5A34", rough=.8), mat("feather_cream", "#F1E2C4", rough=.8), mat("feather_dot", "#4A2E1A", rough=.8)
    cord = mat("cord", "#C9A66B", rough=.9)
    beam(tuple(HIP + Vector((0, 0, .1))), tuple(HIP + Vector((0, 0, .05))), .005, cord)
    torus(.01, .004, tuple(HIP + Vector((0, 0, .05))), cord, 8, 3)
    beam(tuple(HIP + Vector((0, 0, .055))), tuple(HIP + Vector((.01, 0, -.06))), .004, cream)          # quill
    ball(.022, tuple(HIP + Vector((.006, -.002, .0))), brown, uv=(8, 5), scale=(1, .25, 2.4))
    ball(.016, tuple(HIP + Vector((.009, -.005, -.02))), cream, uv=(8, 5), scale=(1, .2, 1.6))
    for k in range(4):
        ball(.004, tuple(HIP + Vector((.004 + .003 * (k % 2), -.008, .03 - k * .018))), dot, uv=(4, 3))
    group("charm_owlfeather", origin=None)
    export("gear_charm_owlfeather_v01")


BUILDERS = {**{"gear_sword_" + k: (lambda k=k: sword(k)) for k in ("wood", "iron", "crystal", "oak", "moon")}}
TREE_BUILDERS = {"gear_vest_leather": vest_leather, "gear_armor_iron": armor_iron, "gear_cloak_ranger": cloak_ranger,
                 "gear_armor_bark": armor_bark}
BUILDERS.update({"gear_charm_clover": charm_clover, "gear_charm_owlfeather": charm_owlfeather})

if __name__ == "__main__":
    for n, f in BUILDERS.items():
        if not ONLY or n in ONLY:
            f()
    for n, f in TREE_BUILDERS.items():
        if not ONLY or n in ONLY:
            reset()
            f(body_tree())
    extra = os.path.join(os.path.dirname(os.path.abspath(__file__)), "build_gear2.py")
    if os.path.exists(extra):          # batch 20 (weapons of the four elements, element armour, amulets)
        exec(compile(open(extra, encoding="utf8").read(), extra, "exec"))
