"""Sunny Harbor (Map 2) models for English Quest, built procedurally in headless Blender.
Run: OUT=<folder> blender -b -P tools/harbor/build_harbor.py   (optional ONLY=name,name)
See hlib.py for conventions (front = Blender -Y = glTF +Z, metres, origin at base centre).
"""
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hlib import *  # noqa
from mathutils import Vector

ONLY = [s for s in os.environ.get("ONLY", "").split(",") if s]

CONTAINER_COLORS = {"red": "#C5412F", "blue": "#2E6AB3", "green": "#3C8C4C", "orange": "#E3862A"}


def _shade(h, f):
    c = [int(h[i:i + 2], 16) for i in (1, 3, 5)]
    if f < 1:
        c = [int(x * f) for x in c]
    else:
        c = [int(x + (255 - x) * (f - 1)) for x in c]
    return "#%02X%02X%02X" % tuple(max(0, min(255, x)) for x in c)


# ------------------------------------------------------------------ container (20 ft)
def container(color, ox=0.0, oy=0.0, oz=0.0):
    L, W, H = 6.06, 2.44, 2.59
    hx, hy = L / 2, W / 2
    base = CONTAINER_COLORS[color]
    body = mat("container_" + color, base, rough=0.6)
    frame = mat("container_%s_dark" % color, _shade(base, 0.72), rough=0.6)
    faded = mat("container_%s_faded" % color, _shade(base, 1.28), rough=0.8)
    rust = mat("rust", "#8E4B2A", rough=0.95)
    rust2 = mat("rust_light", "#B0663A", rough=0.95)
    steel = mat("steel", "#8D949A", rough=0.45, metal=0.6)
    hole = mat("steel_dark", "#2B2E31", rough=0.8)
    P = 0.16  # post / rail section
    O = Vector((ox, oy, oz))

    def at(x, y, z):
        return tuple(O + Vector((x, y, z)))

    # corner posts (bevelled, faded edges catch light)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box((P, P, H - 0.24), at(sx * (hx - P / 2), sy * (hy - P / 2), H / 2), frame, bev=0.02)
    # long rails: top rails faded (sun-bleached), bottom rails dark
    for sy in (-1, 1):
        box((L - 0.3, 0.14, P), at(0, sy * (hy - 0.07), H - P / 2), faded, bev=0.02)
        box((L - 0.3, 0.14, 0.2), at(0, sy * (hy - 0.07), 0.1), frame)
    # end rails (front end -X closed, door end +X has a deeper header)
    for sx in (-1, 1):
        box((0.14, W - 0.3, 0.22 if sx > 0 else P), at(sx * (hx - 0.07), 0, H - (0.11 if sx > 0 else P / 2)),
            faded, bev=0.02)
        box((0.14, W - 0.3, 0.2), at(sx * (hx - 0.07), 0, 0.1), frame)
    # corner castings with dark holes
    for sx in (-1, 1):
        for sy in (-1, 1):
            for z in (0.06, H - 0.06):
                box((0.178, 0.162, 0.118), at(sx * (hx - 0.089), sy * (hy - 0.081), z), steel)
                quad(at(sx * (hx - 0.089), sy * (hy + 0.001), z), (-0.04 * sy, 0, 0), (0, 0, 0.028), hole)
                quad(at(sx * (hx + 0.001), sy * (hy - 0.081), z), (0, 0.03 * sx, 0), (0, 0, 0.025), hole)
    # corrugated side walls
    zb, zt = 0.2, H - P
    for sy in (-1, 1):
        y0 = sy * (hy - 0.07)
        panel(-hx + P, hx - P, zb, zt, 0.3, 0.036,
              lambda u, v, d, y0=y0, sy=sy: at(u, y0 + sy * d, v), body, flip=(sy > 0))
    # corrugated front end (-X)
    panel(-hy + P, hy - P, zb, zt, 0.265, 0.03,
          lambda u, v, d: at(-hx + 0.07 - d, u, v), body, flip=True)
    # roof: shallow ribs across the length
    panel(-hx + 0.14, hx - 0.14, -hy + 0.14, hy - 0.14, 0.5, 0.02,
          lambda u, v, d: at(u, v, H - 0.03 + d), body, flip=False)
    # ---- rear double doors (+X)
    xd = hx - 0.125
    for sy in (-1, 1):
        cy = sy * 0.535
        box((0.05, 1.05, H - 0.42), at(xd, cy, H / 2 - 0.01), body, bev=0.012)
        for z in (0.8, 1.8):  # stamped door panels
            box((0.03, 0.9, 0.05), at(xd + 0.035, cy, z), frame)
        for k in range(3):  # hinges on the outer edges
            box((0.06, 0.08, 0.1), at(xd + 0.03, sy * 1.05, 0.5 + k * 0.8), frame)
    # 4 vertical locking bars, cam keepers top/bottom, lever handles
    for yb in (-0.86, -0.22, 0.22, 0.86):
        cyl(0.022, H - 0.42, at(xd + 0.075, yb, H / 2 - 0.01), steel, 6)
        for z in (0.32, H - 0.32):
            box((0.07, 0.09, 0.08), at(xd + 0.06, yb, z), steel)
        s = 1 if yb > 0 else -1
        beam(at(xd + 0.08, yb, 1.15), at(xd + 0.1, yb - s * 0.32, 1.05), 0.035, steel)
        box((0.04, 0.06, 0.05), at(xd + 0.07, yb - s * 0.3, 1.05), frame)
    quad(at(xd + 0.064, 0.535, 1.75), (0, 0.13, 0), (0, 0, 0.08), mat("label_white", "#E9E6DC"))
    # rust streaks running down from the top rail, and rust around the bottom corners
    r = random.Random(hash(color) & 0xFFFF)
    for k in range(7):
        sy = 1 if k % 2 else -1
        x = r.uniform(-hx + 0.6, hx - 0.6)
        ln = r.uniform(0.3, 0.85)
        quad(at(x, sy * (hy - 0.07 + 0.037), zt - ln / 2), (r.uniform(0.02, 0.05) * -sy, 0, 0),
             (0, 0, ln / 2), rust if k % 3 else rust2)
    for sx in (-1, 1):
        for sy in (-1, 1):
            quad(at(sx * (hx - 0.45), sy * (hy + 0.0015), 0.13), (-0.25 * sy, 0, 0), (0, 0, 0.07), rust)


def container_lite(color, loc, rotz=0.0):
    """cheap stand-in for stacks far from the camera (ship deck): box + frame rings + door lines"""
    L, W, H = 6.06, 2.44, 2.59
    base = CONTAINER_COLORS[color]
    body = mat("container_" + color, base, rough=0.6)
    frame = mat("container_%s_dark" % color, _shade(base, 0.72), rough=0.6)
    c, s = math.cos(rotz), math.sin(rotz)
    O = Vector(loc)

    def at(x, y, z):
        return tuple(O + Vector((x * c - y * s, x * s + y * c, z)))

    box((L - 0.04, W - 0.06, H - 0.04), at(0, 0, H / 2), body, rot=(0, 0, rotz), bev=0.03)
    for sx in (-1, 1):
        box((0.14, W, H), at(sx * (L / 2 - 0.07), 0, H / 2), frame, rot=(0, 0, rotz))
    for k in range(5):  # a few ribs read as corrugation from afar
        x = -2.2 + k * 1.1
        for sy in (-1, 1):
            box((0.14, 0.02, H - 0.3), at(x, sy * (W / 2 - 0.02), H / 2), frame, rot=(0, 0, rotz))


def build_containers():
    for col in CONTAINER_COLORS:
        reset()
        container(col)
        group("container_" + col)
        export("harbor_container_%s_v01" % col)


# ------------------------------------------------------------------ cargo ship
def _hw(u):
    """half-width factor along the hull, u = 0 at the bow tip, 1 at the stern"""
    if u < 0.32:
        t = u / 0.32
        return 0.04 + 0.96 * (1 - (1 - t) ** 2.2)
    if u > 0.9:
        return 1 - 0.5 * ((u - 0.9) / 0.1) ** 2 * 0.3
    return 1.0


def build_ship():
    reset()
    HW, Y0, Y1 = 4.0, -20.0, 20.0
    red = mat("hull_red", "#A5302A", rough=0.7)
    black = mat("hull_black", "#24262B", rough=0.6)
    white = mat("paint_white", "#F2F0EA", rough=0.55)
    deckm = mat("deck_green", "#5E7A5A", rough=0.85)
    hatch = mat("hatch_grey", "#7D8A86", rough=0.7)
    steel = mat("steel", "#8D949A", rough=0.45, metal=0.6)
    dark = mat("steel_dark", "#2B2E31", rough=0.8)
    yellow = mat("crane_yellow", "#E8B52C", rough=0.55)
    win = mat("light_window", "#FFE7A3", emit=2.0)
    blue = mat("funnel_blue", "#2D5D9F", rough=0.5)
    lifebuoy = mat("lifebuoy_orange", "#F05A28", rough=0.6)
    navl = mat("light_mast", "#FFF6D8", emit=4.0)

    # hull loft: levels (z, width factor) x stations; bow and stern rake with height
    levels = [(-2.0, 0.78), (-1.6, 0.95), (-0.8, 1.0), (0.0, 1.0), (0.35, 1.0), (1.6, 1.0), (3.0, 1.0)]
    mats_lv = [0, 0, 0, 1, 2, 2]  # red below the waterline, white boot-top stripe, black topsides
    us = [0, 0.015, 0.035, 0.06, 0.09, 0.13, 0.18, 0.24, 0.31, 0.4, 0.5, 0.6, 0.7, 0.78, 0.85, 0.9, 0.94,
          0.97, 1.0]
    verts, faces, fm = [], [], []
    nL, nS = len(levels), len(us)

    def ytip(z):  # bow stem leans forward at the top
        return Y0 + 2.2 * (3.0 - z) / 5.0

    def ystern(z):
        return Y1 - 2.6 * max(0.0, (0.5 - z)) / 2.5

    def deckz(u):
        return 3.0 + (0.9 * (1 - u / 0.25) ** 2 if u < 0.25 else 0.0)

    idx = {}
    for side in (1, -1):
        for i, (z, wf) in enumerate(levels):
            for j, u in enumerate(us):
                y = ytip(z) + (ystern(z) - ytip(z)) * u
                zz = deckz(u) if i == nL - 1 else z
                x = side * HW * wf * _hw(u)
                idx[(side, i, j)] = len(verts)
                verts.append((x, y, zz))
    for side in (1, -1):
        for i in range(nL - 1):
            for j in range(nS - 1):
                f = [idx[(side, i, j)], idx[(side, i, j + 1)], idx[(side, i + 1, j + 1)], idx[(side, i + 1, j)]]
                faces.append(f if side > 0 else f[::-1])
                fm.append(mats_lv[i])
    for i in range(nL - 1):  # transom and bow seam
        for j, rev in ((nS - 1, False), (0, True)):
            f = [idx[(1, i, j)], idx[(-1, i, j)], idx[(-1, i + 1, j)], idx[(1, i + 1, j)]]
            faces.append(f[::-1] if rev else f)
            fm.append(mats_lv[i])
    top = [idx[(1, nL - 1, j)] for j in range(nS)] + [idx[(-1, nL - 1, j)] for j in reversed(range(nS))]
    faces.append(top)
    fm.append(3)
    bot = [idx[(1, 0, j)] for j in range(nS)] + [idx[(-1, 0, j)] for j in reversed(range(nS))]
    faces.append(bot[::-1])
    fm.append(0)
    hull = mesh(verts, faces, [red, white, black, deckm], fm)
    import bmesh as _b
    bm = _b.new()
    bm.from_mesh(hull.data)
    _b.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    _b.ops.recalc_face_normals(bm, faces=bm.faces)
    _b.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4])
    bm.to_mesh(hull.data)
    bm.free()

    def half(y, z=3.0):
        u = (y - ytip(z)) / (ystern(z) - ytip(z))
        return HW * _hw(max(0.0, min(1.0, u))), u

    # bulbous bow
    ball(1.0, (0, Y0 + 2.0, -1.15), red, uv=(10, 6), scale=(0.75, 2.1, 0.62))
    # deck sheer strake (white rubbing line at deck edge) and bulwark rail
    posts = []
    for k in range(40):
        y = Y0 + 2.6 + k * (Y1 - Y0 - 3.2) / 39
        hwy, u = half(y)
        posts.append((y, hwy - 0.12, deckz(u)))
    for side in (1, -1):
        for (y, x, z) in posts:
            cyl(0.035, 1.0, (side * x, y, z + 0.5), white, 4, cap=False)
        for a, b in zip(posts, posts[1:]):
            for h in (1.0, 0.55):
                beam((side * a[1], a[0], a[2] + h), (side * b[1], b[0], b[2] + h), 0.05, white)
    # bow rail closing across the stem
    yb, xb, zb = posts[0]
    beam((xb, yb, zb + 1.0), (-xb, yb, zb + 1.0), 0.05, white)
    # anchors and hawse pipes on both bow flanks
    for side in (1, -1):
        y = Y0 + 4.2
        hwy, u = half(y, 2.0)
        x = side * (hwy + 0.04)
        cyl(0.3, 0.12, (x, y, 2.2), dark, 8, rot=(0, math.pi / 2, 0))
        beam((x + side * 0.06, y, 2.1), (x + side * 0.1, y + 0.1, 0.9), 0.14, dark)
        beam((x + side * 0.1, y - 0.45, 1.05), (x + side * 0.1, y + 0.6, 1.05), 0.12, dark)
        beam((x + side * 0.1, y - 0.45, 1.05), (x + side * 0.1, y - 0.6, 1.4), 0.1, dark)
        beam((x + side * 0.1, y + 0.6, 1.05), (x + side * 0.1, y + 0.75, 1.4), 0.1, dark)
    # hatch covers and the container stacks (2 high)
    bays = [(-10.05, 2), (-2.47, 3), (5.11, 3)]
    cols = list(CONTAINER_COLORS)
    n = 0
    plan = {0: [(2, 2)], 1: [(3, 2)], 2: [(3, 2)]}
    tops = {0: [0, 1], 1: [0, 1, 2], 2: [0, 2]}  # which columns carry a second tier
    for b, (yc, ncol) in enumerate(bays):
        box((ncol * 2.5 + 0.4, 6.4, 0.18), (0, yc, 3.09), hatch, bev=0.02)
        for c in range(ncol):
            x = (c - (ncol - 1) / 2) * 2.5
            container_lite(cols[(n * 3 + b) % 4], (x, yc, 3.18), rotz=math.pi / 2)
            n += 1
        for c in tops[b]:
            x = (c - (ncol - 1) / 2) * 2.5
            container_lite(cols[(n * 3 + b + 1) % 4], (x, yc, 3.18 + 2.6), rotz=math.pi / 2)
            n += 1
    print("SHIP containers", n)
    # deck cranes between the bays
    for (yc, ang) in ((-6.3, -0.55), (1.32, 0.6)):
        cyl(0.55, 3.2, (0, yc, 4.6), yellow, 10)
        box((1.3, 1.3, 1.2), (0, yc, 6.7), yellow, bev=0.03)
        box((0.9, 0.05, 0.5), (0, yc - 0.66, 6.85), win)
        base = Vector((0, yc, 6.6))
        tip = base + Vector((math.sin(ang) * 8.5, -math.cos(ang) * 1.2, 5.2))
        beam(base, tip, 0.32, yellow, 0.22)
        beam(base + Vector((0, 0.3, 0.7)), tip, 0.06, dark)  # luffing wire
        beam(tip, (tip.x, tip.y, 7.6), 0.04, dark)  # hoist wire
        box((0.3, 0.3, 0.35), (tip.x, tip.y, 7.45), dark)
    # superstructure at the stern: 4 white decks, windows forward and on the sides
    tiers = [(3.0, 2.5, 7.4, 7.0), (5.5, 2.4, 6.8, 6.2), (7.9, 2.4, 6.2, 5.6), (10.3, 2.3, 8.4, 5.0)]
    yS = 14.3
    for k, (z0, h, w, d) in enumerate(tiers):
        box((w, d, h), (0, yS, z0 + h / 2), white, bev=0.03)
        box((w + 0.25, d + 0.25, 0.12), (0, yS, z0 + h), white)  # deck lip
        nwin = 6 if k < 3 else 9
        for i in range(nwin):
            x = (i - (nwin - 1) / 2) * (w - 0.8) / max(1, nwin - 1)
            box((0.55 if k < 3 else 0.7, 0.05, 0.75), (x, yS - d / 2 - 0.01, z0 + h * 0.55), win)
        for side in (1, -1):
            for i in range(3):
                y = yS - d / 2 + 1.0 + i * (d - 2.0) / 2
                box((0.05, 0.55, 0.7), (side * (w / 2 + 0.01), y, z0 + h * 0.55), win)
    box((0.9, 0.06, 1.8), (2.6, yS - 3.51, 3.95), dark)  # door, main deck
    # bridge wing railings and roof gear
    zR = 10.3 + 2.3 + 0.12
    box((3.2, 2.0, 0.4), (0, yS + 0.3, zR + 0.2), white)
    cyl(0.07, 3.2, (0, yS + 0.3, zR + 2.0), steel, 6)
    beam((-1.0, yS + 0.3, zR + 3.0), (1.0, yS + 0.3, zR + 3.0), 0.12, dark)
    ball(0.12, (0, yS + 0.3, zR + 3.65), navl, sub=1)
    for side in (1, -1):
        ball(0.12, (side * 4.1, yS - 2.4, 10.9), navl, sub=1)
    # lifebuoys on the superstructure sides
    for side in (1, -1):
        for y in (yS - 1.6, yS + 1.6):
            torus(0.32, 0.08, (side * 3.73, y, 4.4), lifebuoy, 10, 4, rot=(0, math.pi / 2, 0))
            for a in range(4):
                ang = a * math.pi / 2 + math.pi / 4
                box((0.04, 0.12, 0.2), (side * 3.75, y + 0.32 * math.cos(ang), 4.4 + 0.32 * math.sin(ang)),
                    white, rot=(-ang, 0, 0))
    # funnel behind the bridge: blue body, white band, black top
    yF = 18.0
    lathe([(0, 7.9), (1.05, 7.9), (1.05, 11.6), (1.05, 12.4), (1.05, 13.4), (0.95, 13.9), (0.0, 13.9)],
          [blue, white, black], seg=12, loc=(0, yF, 0), mats=[0, 0, 1, 0, 2, 2], scale=(0.82, 1.15, 1))
    cyl(0.18, 0.8, (0.3, yF + 0.2, 14.2), dark, 6)
    cyl(0.14, 0.7, (-0.3, yF + 0.3, 14.1), dark, 6)
    # stern rail across the transom
    yb, xb, zb = posts[-1]
    beam((xb, yb, zb + 1.0), (-xb, yb, zb + 1.0), 0.05, white)
    group("cargo_ship", origin='xy')
    export("harbor_cargo_ship_v01")


BUILDERS = {
    "harbor_container": build_containers,
    "harbor_cargo_ship": build_ship,
}
for _mod in ("b2_pier", "b3_boutique", "b4_houses", "b5_mobs"):
    try:
        BUILDERS.update(__import__(_mod).BUILDERS)
    except ModuleNotFoundError:
        pass

for n, f in BUILDERS.items():
    if ONLY and n not in ONLY:
        continue
    f()
