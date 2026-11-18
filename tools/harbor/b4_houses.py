"""Batch 4: three two-storey harbour shops (boutique, cafe, salon), 8 x 6 m, front door toward -Y."""
import math
from hlib import *  # noqa
from mathutils import Vector

STYLES = {
    "boutique": dict(wall="#F5A9C0", accent="#D9577F", roof="#A9465A", tag="pink"),
    "cafe": dict(wall="#A3DDC9", accent="#3E9C82", roof="#2F6F73", tag="mint"),
    "salon": dict(wall="#CDB8E8", accent="#8C64C2", roof="#5B4A86", tag="lavender"),
}


def _flowers(x, y, z, w, seed, cols):
    """flower box under a window / planter top: leaves + coloured blooms"""
    leaf = mat("leaf_green", "#4FA046", rough=0.85)
    for k in range(4):
        xx = x + (k - 1.5) * w / 4
        ball(0.13, (xx, y, z + 0.08), leaf, sub=1, scale=(1.1, 0.9, 0.8), jit=0.015, seed=seed + k)
        ball(0.06, (xx + 0.04, y - 0.07, z + 0.17), cols[(k + seed) % len(cols)], sub=1)


def _window(x, y, z, w, h, trim, accent, win, shutters=True, flowerbox=True, seed=0, face=-1, cols=None):
    """window on a wall facing `face` (-1 = -Y front). x along the wall, y = wall plane."""
    o = face * 0.06
    box((w + 0.2, 0.12, h + 0.2), (x, y + o, z), trim, bev=0.02)
    box((w, 0.06, h), (x, y + o * 2, z), win)
    box((0.06, 0.05, h), (x, y + o * 2.4, z), trim)  # mullion
    box((w, 0.05, 0.06), (x, y + o * 2.4, z + h * 0.15), trim)
    if shutters:
        for sx in (-1, 1):
            box((w * 0.5, 0.06, h + 0.05), (x + sx * (w * 0.75 + 0.12), y + o * 1.5, z), accent, bev=0.015)
            for k in range(3):
                box((w * 0.42, 0.03, 0.04), (x + sx * (w * 0.75 + 0.12), y + o * 2.2, z - h / 3 + k * h / 3), trim)
    box((w + 0.35, 0.22, 0.08), (x, y + face * 0.12, z - h / 2 - 0.1), trim, bev=0.015)
    if flowerbox:
        box((w + 0.1, 0.26, 0.2), (x, y + face * 0.2, z - h / 2 - 0.25), mat("planter_wood", "#8D5B36"), bev=0.015)
        _flowers(x, y + face * 0.2, z - h / 2 - 0.15, w, seed, cols)


def _side_window(x, y, z, w, h, trim, win, face):
    """window on a side wall (normal along x)"""
    o = face * 0.06
    box((0.12, w + 0.2, h + 0.2), (x + o, y, z), trim, bev=0.02)
    box((0.06, w, h), (x + o * 2, y, z), win)
    box((0.05, 0.06, h), (x + o * 2.4, y, z), trim)
    box((0.22, w + 0.35, 0.08), (x + face * 0.12, y, z - h / 2 - 0.1), trim, bev=0.015)


def _pot(x, y, cols, seed):
    terra = mat("pot_terracotta", "#C46A43", rough=0.85)
    leaf = mat("leaf_green", "#4FA046", rough=0.85)
    lathe([(0, 0), (0.2, 0), (0.27, 0.5), (0.3, 0.52), (0.3, 0.58), (0, 0.58)], terra, seg=10, loc=(x, y, 0))
    ball(0.33, (x, y, 0.82), leaf, sub=1, scale=(1, 1, 1.15), jit=0.03, seed=seed)
    for k in range(5):
        a = k * 1.3 + seed
        ball(0.07, (x + 0.27 * math.cos(a), y + 0.27 * math.sin(a), 0.75 + 0.18 * (k % 3)), cols[k % len(cols)], sub=1)


def _chair(x, y, rz, metal, seat):
    c, s = math.cos(rz), math.sin(rz)

    def at(px, py, pz):
        return (x + px * c - py * s, y + px * s + py * c, pz)
    for px, py in ((-0.18, -0.18), (0.18, -0.18), (-0.18, 0.18), (0.18, 0.18)):
        beam(at(px, py, 0), at(px, py, 0.45), 0.03, metal)
    box((0.44, 0.44, 0.05), at(0, 0, 0.47), seat, rot=(0, 0, rz), bev=0.01)
    for px in (-0.18, 0.18):
        beam(at(px, 0.2, 0.47), at(px, 0.22, 0.9), 0.03, metal)
    box((0.42, 0.04, 0.22), at(0, 0.22, 0.78), seat, rot=(0, 0, rz), bev=0.01)


def build_house(kind):
    reset()
    st = STYLES[kind]
    wall = mat("wall_" + st["tag"], st["wall"], rough=0.9)
    accent = mat("accent_" + st["tag"], st["accent"], rough=0.6)
    roof = mat("roof_" + st["tag"], st["roof"], rough=0.7)
    trim = mat("trim_white", "#F7F4EE", rough=0.6)
    stone = mat("stone", "#A7A39A", rough=0.95)
    win = mat("light_window", "#FFE7A3", emit=1.6)
    door = mat("wood_door", "#7A4E2C", rough=0.8)
    sign = mat("sign_blank", "#F3E7CC", rough=0.7)
    brass = mat("brass", "#C9A548", rough=0.35, metal=0.7)
    cols = [mat("flower_red", "#E5484D"), mat("flower_yellow", "#F5C842"), mat("flower_white", "#FAF7F0"),
            mat("flower_" + st["tag"], st["accent"])]
    W, D = 8.0, 6.0
    hx, hy = W / 2, D / 2
    z1, z2, zt = 3.3, 3.5, 6.3  # ground floor top, upper floor start, eaves
    # plinth, walls, floor band, corner pilasters, cornice
    box((W + 0.3, D + 0.3, 0.35), (0, 0, 0.175), stone, bev=0.03)
    box((W, D, z1 - 0.35), (0, 0, 0.35 + (z1 - 0.35) / 2), wall)
    box((W + 0.18, D + 0.18, 0.22), (0, 0, z1 + 0.09), trim, bev=0.02)
    box((W, D, zt - z2 + 0.2), (0, 0, z2 - 0.2 + (zt - z2 + 0.2) / 2), wall)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box((0.3, 0.3, zt - 0.35), (sx * (hx - 0.1), sy * (hy - 0.1), 0.35 + (zt - 0.35) / 2), trim, bev=0.02)
    box((W + 0.45, D + 0.45, 0.25), (0, 0, zt + 0.1), trim, bev=0.03)
    # gable roof (ridge along x) with tile courses, ridge cap, gable ends, chimney
    rh, ov = 2.5, 0.45
    a = math.atan2(rh, hy)
    sl = math.hypot(hy + ov, rh * (hy + ov) / hy)
    for sy in (-1, 1):
        cy = sy * (hy + ov) / 2
        cz = zt + 0.22 + rh - rh * ((hy + ov) / 2) / hy
        box((W + 0.9, sl, 0.16), (0, cy, cz), roof, rot=(-sy * a, 0, 0), bev=0.02)
        for k in range(1, 5):
            t = k / 5
            yy = sy * (hy + ov) * t
            zz = zt + 0.22 + rh - rh * (hy + ov) * t / hy + 0.1
            box((W + 0.92, 0.1, 0.06), (0, yy, zz), mat("roof_%s_dark" % st["tag"], _dark(st["roof"])),
                rot=(-sy * a, 0, 0))
    box((W + 1.0, 0.36, 0.22), (0, 0, zt + 0.22 + rh + 0.06), mat("roof_%s_dark" % st["tag"], _dark(st["roof"])),
        bev=0.03)
    for sx in (-1, 1):
        x = sx * (hx - 0.02)
        mesh([(x, -hy, zt + 0.2), (x, hy, zt + 0.2), (x, 0, zt + 0.2 + rh - 0.05)],
             [[0, 1, 2] if sx > 0 else [2, 1, 0]], wall)
        _side_window(sx * hx, 0, zt + 0.95, 0.6, 0.7, trim, win, sx) if kind != "cafe" else None
    box((0.7, 0.7, 2.0), (2.4, 1.2, zt + rh + 0.2), mat("brick", "#B4553F", rough=0.9), bev=0.02)
    box((0.85, 0.85, 0.15), (2.4, 1.2, zt + rh + 1.2), trim)
    # upper floor: 3 front windows with shutters + flower boxes, 2 at the back, 1 on each side
    for i, x in enumerate((-2.6, 0.0, 2.6)):
        _window(x, -hy, 4.9, 1.0, 1.35, trim, accent, win, seed=i, cols=cols)
    for x in (-2.0, 2.0):
        _window(x, hy, 4.9, 1.0, 1.35, trim, accent, win, flowerbox=False, face=1)
    for sx in (-1, 1):
        _side_window(sx * hx, 0, 4.9, 1.0, 1.35, trim, win, sx)
        _side_window(sx * hx, 0.8, 1.9, 1.0, 1.4, trim, win, sx)
    # ground floor front: door, windows, blank sign, striped awning, wall lamps, pots
    yf = -hy
    box((1.5, 0.16, 2.6), (0, yf - 0.06, 0.35 + 1.3), trim, bev=0.02)
    if kind == "boutique":  # glazed shop door + two big display windows
        box((1.2, 0.08, 2.35), (0, yf - 0.12, 0.35 + 1.18), win)
        box((0.08, 0.1, 2.35), (0, yf - 0.16, 0.35 + 1.18), trim)
        for sx in (-1, 1):
            box((2.5, 0.16, 2.2), (sx * 2.25, yf - 0.06, 1.6), trim, bev=0.02)
            box((2.3, 0.08, 2.0), (sx * 2.25, yf - 0.12, 1.6), win)
            box((2.6, 0.3, 0.12), (sx * 2.25, yf - 0.15, 0.48), trim, bev=0.015)
    else:
        box((1.2, 0.1, 2.35), (0, yf - 0.12, 0.35 + 1.18), door, bev=0.015)
        box((0.7, 0.04, 0.8), (0, yf - 0.18, 0.35 + 1.75), win)  # glass panel in the door
        for sx in (-1, 1):
            _window(sx * 2.4, yf, 1.75, 1.4, 1.4, trim, accent, win, shutters=False, flowerbox=(kind == "salon"),
                    seed=3 + sx, cols=cols)
    ball(0.045, (0.45, yf - 0.2, 1.4), brass, sub=1)
    # blank sign board above the door
    box((2.8, 0.14, 0.62), (0, yf - 0.1, 3.82), sign, bev=0.02)
    box((2.95, 0.1, 0.75), (0, yf - 0.03, 3.82), accent, bev=0.02)
    # striped canvas awning across the front + scalloped valance
    n = 13
    aw0, aw1 = 3.18, 2.55
    for i in range(n):
        x = -3.25 + (i + 0.5) * 6.5 / n
        m = accent if i % 2 == 0 else trim
        beam((x, yf, aw0), (x, yf - 1.25, aw1), 6.5 / n, m, 0.04)
        cyl(0.25, 0.25, (x, yf - 1.27, aw1 - 0.1), m, 3, rot=(math.pi / 2, 0, math.pi), scale=(1, 1, 0.12))
    for sx in (-1, 1):
        beam((sx * 3.25, yf, aw0 - 0.2), (sx * 3.25, yf - 1.2, aw1 - 0.05), 0.04, mat("iron_dark", "#2F3336"))
        box((0.12, 0.2, 0.3), (sx * 0.95, yf - 0.1, 2.3), mat("iron_dark", "#2F3336"))  # wall lamps
        ball(0.11, (sx * 0.95, yf - 0.25, 2.25), mat("light_lamp", "#FFE3A0", emit=4.0), sub=1)
        _pot(sx * 1.25, yf - 0.55, cols, seed=sx + 5)
    if kind == "cafe":  # two little bistro tables with chairs on the terrace
        metal = mat("iron_dark", "#2F3336")
        seat = mat("accent_" + st["tag"], st["accent"])
        top = trim
        for tx in (-2.6, 2.6):
            ty = yf - 2.1
            cyl(0.04, 0.72, (tx, ty, 0.36), metal, 6)
            cyl(0.25, 0.04, (tx, ty, 0.02), metal, 8)
            cyl(0.42, 0.05, (tx, ty, 0.745), top, 14)
            ball(0.06, (tx + 0.1, ty, 0.82), mat("cup_white", "#FFFFFF"), sub=1, scale=(1, 1, 1.2))
            _chair(tx - 0.65, ty, -math.pi / 2, metal, seat)
            _chair(tx + 0.65, ty, math.pi / 2, metal, seat)
    if kind == "salon":  # barber pole beside the door
        red, blue, wh = mat("pole_red", "#D33A3A"), mat("pole_blue", "#3466B8"), trim
        chrome = mat("chrome", "#B9BEC4", rough=0.2, metal=0.9)
        px, py = 1.95, yf - 0.3
        box((0.12, 0.25, 0.08), (px, py + 0.15, 2.65), chrome)
        box((0.12, 0.25, 0.08), (px, py + 0.15, 1.2), chrome)
        prof = [(0.13, 1.2 + k * 0.12) for k in range(13)]
        lathe([(0, 1.2)] + prof + [(0, 1.2 + 12 * 0.12)], [wh, red, blue], seg=10, loc=(px, py, 0),
              mats=[0] + [(0, 1, 0, 2)[k % 4] for k in range(12)] + [0])
        ball(0.15, (px, py, 2.72), chrome, uv=(10, 6))
        cyl(0.15, 0.08, (px, py, 1.17), chrome, 10)
    group("house_" + kind)
    export("harbor_house_%s_v01" % kind)


def _dark(h):
    c = [int(int(h[i:i + 2], 16) * 0.75) for i in (1, 3, 5)]
    return "#%02X%02X%02X" % tuple(c)


BUILDERS = {
    "harbor_house_boutique": lambda: build_house("boutique"),
    "harbor_house_cafe": lambda: build_house("cafe"),
    "harbor_house_salon": lambda: build_house("salon"),
}
