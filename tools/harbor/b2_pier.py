"""Batch 2: lighthouse and pier props (bench, bollard, lamp post, crate stack, fish net, quay crane)."""
import math, random
from hlib import *  # noqa
from mathutils import Vector


def build_lighthouse():
    reset()
    stone, stone2 = mat("stone", "#A7A39A", rough=0.95), mat("stone_dark", "#837F77", rough=0.95)
    red, white = mat("paint_red", "#C9362E", rough=0.55), mat("paint_white", "#F2F0EA", rough=0.55)
    iron = mat("iron_dark", "#2F3336", rough=0.6, metal=0.4)
    glass = mat("glass", "#BFE6F2", rough=0.05, alpha=0.35)
    lamp = mat("light_lamp", "#FFE9A8", emit=6.0)
    wood = mat("wood_door", "#7A4E2C", rough=0.8)
    win = mat("window_dark", "#2D4A63", rough=0.3)
    # rocky base: stepped octagonal plinth + loose boulders
    cyl(3.3, 0.6, (0, 0, 0.3), stone2, 8)
    cyl(2.75, 0.7, (0, 0, 0.95), stone, 8, r2=2.55)
    r = random.Random(7)
    for k in range(9):
        a = k * 2 * math.pi / 9 + r.uniform(-0.2, 0.2) + 0.3
        ball(r.uniform(0.45, 0.8), (3.35 * math.cos(a), 3.35 * math.sin(a), 0.2), stone if k % 2 else stone2,
             sub=1, scale=(1, 1, 0.65), jit=0.06, seed=k)
    for i in range(3):  # steps up to the door (front = -Y)
        box((1.6, 0.45, 0.2 * (i + 1)), (0, -3.6 + 0.42 * i, 0.1 * (i + 1)), stone, bev=0.02)
    # tapered tower with red/white bands
    z0, z1, rb, rt = 1.3, 10.6, 1.8, 1.2
    bands = 7
    prof, mats_ = [(0, z0)], [0]
    for i in range(bands + 1):
        prof.append((rb + (rt - rb) * i / bands, z0 + (z1 - z0) * i / bands))
        if i < bands:
            mats_.append(i % 2)
    prof.append((0, z1))
    mats_.append(0)
    lathe(prof, [white, red], seg=16, mats=mats_)

    def rad(z):
        return rb + (rt - rb) * (z - z0) / (z1 - z0)
    # door with stone lintel, small windows up the front and one on the side
    box((1.0, 0.3, 1.9), (0, -rad(2.2) + 0.1, z0 + 0.95), wood, bev=0.02)
    box((1.3, 0.3, 0.2), (0, -rad(2.3) + 0.12, z0 + 2.0), stone, bev=0.02)
    for zw in (4.6, 7.4):
        box((0.5, 0.3, 0.75), (0, -rad(zw) + 0.1, zw), win)
        box((0.66, 0.34, 0.1), (0, -rad(zw) + 0.1, zw - 0.42), white, bev=0.01)
    box((0.3, 0.5, 0.7), (rad(6.0) - 0.1, 0, 6.0), win)
    # gallery deck on a corbel + railing
    cyl(1.25, 0.35, (0, 0, z1 - 0.15), iron, 16, r2=1.95)
    cyl(2.0, 0.25, (0, 0, z1 + 0.12), iron, 16)
    for k in range(16):
        a = k * 2 * math.pi / 16
        cyl(0.03, 0.95, (1.9 * math.cos(a), 1.9 * math.sin(a), z1 + 0.72), iron, 4, cap=False)
    torus(1.9, 0.04, (0, 0, z1 + 1.2), iron, 16, 4)
    torus(1.9, 0.025, (0, 0, z1 + 0.7), iron, 16, 3)
    # lantern room: low wall, glass drum with mullions, lamp
    zl = z1 + 0.25
    cyl(1.1, 0.5, (0, 0, zl + 0.25), red, 12)
    cyl(1.0, 1.7, (0, 0, zl + 1.35), glass, 12, cap=False)
    for k in range(6):
        a = k * math.pi / 3
        beam((1.02 * math.cos(a), 1.02 * math.sin(a), zl + 0.5), (1.02 * math.cos(a), 1.02 * math.sin(a), zl + 2.2),
             0.06, iron)
    cyl(0.25, 0.5, (0, 0, zl + 0.75), iron, 8)
    ball(0.42, (0, 0, zl + 1.35), lamp, sub=2)
    # red cone roof, finial, lightning rod
    cyl(1.25, 0.15, (0, 0, zl + 2.27), iron, 12)
    cyl(1.25, 1.3, (0, 0, zl + 2.99), red, 12, r2=0.08)
    ball(0.16, (0, 0, zl + 3.7), iron, sub=1)
    cyl(0.025, 1.2, (0, 0, zl + 4.3), iron, 4)
    group("lighthouse")
    export("harbor_lighthouse_v01")


def build_bench():
    reset()
    iron = mat("cast_iron", "#2E3A36", rough=0.55, metal=0.35)
    wood = mat("wood_slat", "#B27A45", rough=0.8)
    L = 1.6
    for sx in (-1, 1):  # cast-iron side frames: front leg, back leg rising into the backrest, armrest
        x = sx * (L / 2 - 0.12)
        beam((x, -0.22, 0.0), (x, -0.2, 0.44), 0.05, iron, 0.06)
        beam((x, 0.25, 0.0), (x, 0.18, 0.44), 0.05, iron, 0.06)
        beam((x, 0.18, 0.44), (x, 0.32, 0.9), 0.05, iron, 0.06)
        beam((x, -0.25, 0.42), (x, 0.2, 0.42), 0.05, iron, 0.06)
        beam((x, -0.2, 0.44), (x, -0.25, 0.66), 0.045, iron)
        beam((x, -0.31, 0.66), (x, 0.24, 0.68), 0.06, iron, 0.08)
        box((0.09, 0.12, 0.03), (x, -0.22, 0.015), iron)
        box((0.09, 0.12, 0.03), (x, 0.25, 0.015), iron)
        cyl(0.045, 0.06, (x, -0.32, 0.66), iron, 6, rot=(0, math.pi / 2, 0))  # scroll end of armrest
    beam((-L / 2 + 0.12, 0.0, 0.2), (L / 2 - 0.12, 0.0, 0.2), 0.035, iron)
    for y in (-0.17, -0.03, 0.11):  # 3 seat slats
        box((L, 0.12, 0.04), (0, y, 0.465), wood, bev=0.012)
    for y, z in ((0.23, 0.6), (0.275, 0.78)):  # 2 back slats leaning back
        box((L, 0.035, 0.13), (0, y, z), wood, rot=(-0.3, 0, 0), bev=0.012)
    group("pier_bench")
    export("harbor_pier_bench_v01")


def build_bollard():
    reset()
    iron = mat("cast_iron", "#2E3A36", rough=0.55, metal=0.35)
    rope = mat("rope", "#C9A66B", rough=0.95)
    lathe([(0, 0), (0.36, 0), (0.36, 0.07), (0.24, 0.12), (0.2, 0.3), (0.19, 0.48), (0.27, 0.56), (0.29, 0.64),
           (0.22, 0.7), (0, 0.72)], iron, seg=12)
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        cyl(0.03, 0.04, (0.3 * math.cos(a), 0.3 * math.sin(a), 0.085), iron, 6)
    torus(0.22, 0.035, (0, 0, 0.3), rope, 12, 4)
    torus(0.215, 0.035, (0, 0, 0.38), rope, 12, 4, rot=(0.08, 0, 0))
    for k, rr in enumerate((0.26, 0.2, 0.14)):  # coil on the ground
        torus(rr, 0.035, (0.5, -0.35, 0.035 + 0.06 * k), rope, 12, 4)
    beam((0.19, -0.1, 0.32), (0.42, -0.3, 0.12), 0.06, rope)
    beam((-0.15, 0.15, 0.36), (-0.6, 0.5, 0.04), 0.06, rope)
    beam((-0.6, 0.5, 0.04), (-0.9, 0.55, 0.035), 0.06, rope)
    group("bollard")
    export("harbor_bollard_v01")


def build_lamp_post():
    reset()
    iron = mat("cast_iron", "#2E3A36", rough=0.55, metal=0.35)
    glass = mat("glass", "#E8F4F6", rough=0.05, alpha=0.4)
    lamp = mat("light_lamp", "#FFE3A0", emit=5.0)
    gold = mat("brass", "#C9A548", rough=0.35, metal=0.7)
    lathe([(0, 0), (0.22, 0), (0.22, 0.1), (0.15, 0.16), (0.12, 0.45), (0.09, 0.55), (0.07, 0.6), (0, 0.6)],
          iron, seg=10)
    cyl(0.045, 2.0, (0, 0, 1.6), iron, 8, r2=0.035)
    torus(0.06, 0.02, (0, 0, 1.0), gold, 8, 3)
    torus(0.05, 0.02, (0, 0, 2.55), gold, 8, 3)
    zc = 2.62
    cyl(0.12, 0.08, (0, 0, zc), iron, 4, rot=(0, 0, math.pi / 4))
    cyl(0.17, 0.42, (0, 0, zc + 0.25), glass, 4, r2=0.22, rot=(0, 0, math.pi / 4), cap=False)
    for k in range(4):
        a = k * math.pi / 2
        beam((0.17 * math.cos(a), 0.17 * math.sin(a), zc + 0.04),
             (0.22 * math.cos(a), 0.22 * math.sin(a), zc + 0.46), 0.025, iron)
    ball(0.1, (0, 0, zc + 0.24), lamp, sub=1)
    cyl(0.27, 0.16, (0, 0, zc + 0.54), iron, 4, r2=0.05, rot=(0, 0, math.pi / 4))
    ball(0.04, (0, 0, zc + 0.66), gold, sub=1)
    for sx in (-1, 1):  # scroll bracket arms
        beam((0, 0, 2.2), (sx * 0.22, 0, 2.42), 0.025, iron)
        ball(0.03, (sx * 0.22, 0, 2.43), gold, sub=1)
    group("lamp_post")
    export("harbor_lamp_post_v01")


def _crate(loc, s, wood, wood2, rot=0.0):
    x, y, z = loc
    c, sn = math.cos(rot), math.sin(rot)

    def at(px, py, pz):
        return (x + px * c - py * sn, y + px * sn + py * c, z + pz)
    box((s, s, s), at(0, 0, s / 2), wood, rot=(0, 0, rot), bev=0.015)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box((0.07, 0.07, s + 0.01), at(sx * (s / 2 - 0.03), sy * (s / 2 - 0.03), s / 2), wood2, rot=(0, 0, rot))
    for f in (-1, 1):
        for zz in (0.3, 0.7):
            box((s - 0.1, 0.03, 0.07), at(0, f * (s / 2 + 0.01), s * zz), wood2, rot=(0, 0, rot))
            box((0.03, s - 0.1, 0.07), at(f * (s / 2 + 0.01), 0, s * zz), wood2, rot=(0, 0, rot))


def build_crate_stack():
    reset()
    wood, wood2 = mat("wood_crate", "#C79A5B", rough=0.85), mat("wood_crate_dark", "#94693A", rough=0.85)
    sack = mat("burlap", "#CDB384", rough=1.0)
    twine = mat("rope", "#A07F4E", rough=0.95)
    _crate((-0.35, 0.0, 0), 0.8, wood, wood2)
    _crate((0.5, 0.1, 0), 0.7, wood, wood2, 0.2)
    _crate((-0.3, 0.05, 0.8), 0.6, wood, wood2, -0.15)
    for k, (x, y, z, rz) in enumerate(((0.45, -0.68, 0.0, 0.3), (1.05, -0.4, 0.0, -0.5), (0.75, -0.55, 0.36, 0.1))):
        ball(0.3, (x, y, z + 0.17), sack, uv=(10, 6), scale=(1.3, 0.85, 0.58), rot=(0, 0, rz), jit=0.008, seed=k)
        ball(0.1, (x + 0.38 * math.cos(rz), y + 0.38 * math.sin(rz), z + 0.2), sack, uv=(6, 4),
             scale=(1.3, 1, 1), rot=(0, 0, rz), jit=0.01, seed=k + 5)
        torus(0.08, 0.018, (x + 0.29 * math.cos(rz), y + 0.29 * math.sin(rz), z + 0.24), twine, 8, 3,
              rot=(0, math.pi / 2, rz))
    group("crate_stack")
    export("harbor_crate_stack_v01")


def build_fish_net():
    reset()
    wood, wood2 = mat("wood_post", "#8B5E34", rough=0.85), mat("wood_post_dark", "#6B4627", rough=0.85)
    net = mat("net_green", "#3E6E5C", rough=0.9)
    floatm = mat("float_orange", "#EE7A2A", rough=0.6)
    W, Hb = 2.6, 1.85
    for sx in (-1, 1):  # A-frame trestles
        x = sx * W / 2
        beam((x, -0.45, 0), (x, 0.0, Hb + 0.05), 0.09, wood)
        beam((x, 0.45, 0), (x, 0.0, Hb + 0.05), 0.09, wood)
        beam((x, -0.3, 0.6), (x, 0.3, 0.6), 0.06, wood2)
    beam((-W / 2 - 0.2, 0, Hb), (W / 2 + 0.2, 0, Hb), 0.11, wood)
    nx = 9

    def P(i, t, side):  # sagging net over the top beam, front side hangs longer
        x = -1.15 + 2.3 * i / (nx - 1)
        sag = 0.12 * math.sin(math.pi * i / (nx - 1))
        drop = (1.25 if side < 0 else 0.85) * t
        y = side * (0.07 + 0.32 * t + 0.06 * math.sin(3 * i + 2 * t) * t)
        return (x, y, Hb + 0.05 - drop - sag * t * 2)

    def cord(a, b):  # thin double-sided ribbon
        a, b = Vector(a), Vector(b)
        sd = (b - a).cross(Vector((0, 1, 0)))
        if sd.length < 1e-6:
            sd = Vector((1, 0, 0))
        sd = sd.normalized() * 0.016
        nn = sd.cross(b - a).normalized() * 0.003
        mesh([a - sd, a + sd, b + sd, b - sd, a - sd - nn, a + sd - nn, b + sd - nn, b - sd - nn],
             [[0, 1, 2, 3], [7, 6, 5, 4]], net)
    for side in (-1, 1):
        nt = 6 if side < 0 else 4
        for i in range(nx):
            for j in range(nt - 1):
                cord(P(i, j / (nt - 1), side), P(i, (j + 1) / (nt - 1), side))
        for j in range(1, nt):
            for i in range(nx - 1):
                cord(P(i, j / (nt - 1), side), P(i + 1, j / (nt - 1), side))
    for i in range(0, nx, 2):  # cork floats along the hem
        p = P(i, 1.0, -1)
        ball(0.07, (p[0], p[1] - 0.02, p[2] - 0.05), floatm, sub=1, scale=(1, 1, 0.75))
    group("fish_net")
    export("harbor_fish_net_v01")


def build_crane():
    reset()
    yel = mat("crane_yellow", "#E8B52C", rough=0.55)
    yel2 = mat("crane_yellow_dark", "#C48F1C", rough=0.6)
    dark = mat("steel_dark", "#2B2E31", rough=0.8)
    white = mat("paint_white", "#F2F0EA", rough=0.55)
    win = mat("light_window", "#FFE7A3", emit=2.0)
    red = mat("paint_red", "#C9362E", rough=0.55)
    X, Yl, Zp, Zb = 6.0, 5.0, 12.0, 13.0  # leg half-span (x, along the rails), half-gauge (y), portal, boom
    for sy in (-1, 1):  # sill beams + wheel bogies + buffers
        box((2 * X + 1.6, 0.9, 0.7), (0, sy * Yl, 1.05), yel2, bev=0.03)
        for sx in (-1, 1):
            for k in (-0.6, 0.6):
                box((1.0, 0.7, 0.7), (sx * X + k, sy * Yl, 0.35), dark)
            box((0.3, 0.95, 0.4), (sx * (X + 0.95), sy * Yl, 1.2), red)
    for sx in (-1, 1):  # legs, portal beams, braces
        for sy in (-1, 1):
            box((0.9, 0.9, Zp - 1.4), (sx * X, sy * Yl, 1.4 + (Zp - 1.4) / 2), yel, bev=0.03)
        beam((sx * X, -Yl, 6.5), (sx * X, Yl, 6.5), 0.6, yel)
        beam((sx * X, -Yl, 1.6), (sx * X, Yl, 6.3), 0.3, yel2)
        beam((sx * X, Yl, 1.6), (sx * X, -Yl, 6.3), 0.3, yel2)
        beam((sx * X, -Yl, Zp), (sx * X, Yl, Zp), 0.8, yel)
    for sy in (-1, 1):
        beam((-X, sy * Yl, Zp), (X, sy * Yl, Zp), 0.9, yel)
    yo, ybk = -24.0, 13.0  # boom: outreach over the water (-y) to backreach (+y)
    for sx in (-1, 1):
        beam((sx * 1.8, yo, Zb), (sx * 1.8, ybk, Zb), 0.6, yel, 1.0)
    for k in range(10):
        y = yo + 0.6 + k * (ybk - yo - 1.2) / 9
        beam((-1.8, y, Zb + 0.45), (1.8, y, Zb + 0.45), 0.25, yel2)
    for sx in (-1, 1):
        beam((sx * X, -Yl, Zp + 0.4), (sx * 1.8, -Yl, Zb), 0.5, yel)
        beam((sx * X, Yl, Zp + 0.4), (sx * 1.8, Yl, Zb), 0.5, yel)
    apex = Vector((0, 2.0, 18.4))  # A-frame with forestays and backstays
    for sx in (-1, 1):
        beam((sx * X, -Yl + 1.0, Zp + 0.4), apex, 0.55, yel)
        beam((sx * X, Yl, Zp + 0.4), apex, 0.55, yel)
        for yy in (yo + 3.0, -8.0, ybk - 1.0):
            beam(apex + Vector((sx * 0.3, 0, 0)), (sx * 1.8, yy, Zb + 0.5), 0.14, dark)
    box((1.4, 1.0, 0.6), (0, 2.0, 18.4), yel)
    ball(0.15, (0, 2.0, 18.85), mat("light_beacon", "#FF5A3C", emit=4.0), sub=1)
    box((4.2, 5.0, 2.6), (0, 9.5, Zb + 1.8), white, bev=0.04)  # machinery house
    box((4.4, 5.2, 0.15), (0, 9.5, Zb + 3.15), yel2)
    for k in range(3):
        box((0.05, 0.6, 0.5), (2.12, 8.0 + k * 1.5, Zb + 2.0), win)
    yt = -12.0  # trolley, operator cabin, hoist ropes, spreader
    box((3.3, 2.4, 0.9), (0, yt, Zb - 0.7), yel2, bev=0.03)
    box((1.8, 2.0, 1.8), (1.2, yt - 0.8, Zb - 2.1), white, bev=0.04)
    box((1.75, 0.05, 1.1), (1.2, yt - 1.82, Zb - 2.0), win)
    box((0.05, 1.6, 1.0), (2.12, yt - 0.8, Zb - 2.0), win)
    zs = 5.0
    for sx in (-1, 1):
        for sy in (-1, 1):
            beam((sx * 0.9, yt + sy * 0.7, Zb - 1.15), (sx * 1.0, yt + sy * 0.9, zs + 0.3), 0.05, dark)
    box((2.6, 6.1, 0.35), (0, yt, zs), yel, bev=0.03)
    box((1.4, 1.6, 0.4), (0, yt, zs + 0.35), yel2)
    for sy in (-1, 1):
        for sx in (-1, 1):
            box((0.25, 0.25, 0.25), (sx * 1.15, yt + sy * 2.9, zs - 0.3), dark)
    for k in range(12):  # ladder up a land-side leg
        beam((X + 0.5, Yl - 0.3, 1.6 + k * 0.85), (X + 0.5, Yl + 0.3, 1.6 + k * 0.85), 0.04, dark)
    for sy in (-0.3, 0.3):
        beam((X + 0.5, Yl + sy, 1.4), (X + 0.5, Yl + sy, Zp), 0.06, dark)
    group("crane", origin=None)
    export("harbor_crane_v01")


BUILDERS = {
    "harbor_lighthouse": build_lighthouse, "harbor_pier_bench": build_bench, "harbor_bollard": build_bollard,
    "harbor_lamp_post": build_lamp_post, "harbor_crate_stack": build_crate_stack,
    "harbor_fish_net": build_fish_net, "harbor_crane": build_crane,
}
