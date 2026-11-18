"""Batch 3: boutique mannequins (bare + 3 dressed) and display props, each a separate named object."""
import math
from hlib import *  # noqa
from mathutils import Vector, Matrix


def _mannequin(ox, cloth=None):
    """one mannequin standing at (ox, 0); cloth in (None, 'dress', 'jeans', 'coat')"""
    skin = mat("porcelain_cream", "#F1E6D3", rough=0.28)
    joint = mat("porcelain_joint", "#DCCDB5", rough=0.3)
    chrome = mat("chrome", "#B9BEC4", rough=0.2, metal=0.9)
    O = Vector((ox, 0, 0))

    def p(x, y, z):
        return tuple(O + Vector((x, y, z)))
    # metal base disc and support pole into the back of the left calf
    lathe([(0, 0), (0.2, 0), (0.2, 0.015), (0.17, 0.035), (0, 0.035)], chrome, seg=16, loc=p(0, 0.02, 0))
    rod(p(-0.06, 0.06, 0.03), p(-0.08, 0.04, 0.32), 0.011, 0.011, chrome, 6)
    # legs: left straight (weight), right relaxed with the knee forward
    L = dict(hip=(-0.095, 0.0, 0.9), knee=(-0.09, 0.0, 0.5), ank=(-0.085, 0.0, 0.1))
    R = dict(hip=(0.095, 0.0, 0.9), knee=(0.085, -0.06, 0.5), ank=(0.11, 0.0, 0.11))
    for leg in (L, R):
        rod(p(*leg['hip']), p(*leg['knee']), 0.078, 0.056, skin, 10)
        ball(0.052, p(*leg['knee']), joint, uv=(10, 6))
        rod(p(*leg['knee']), p(*leg['ank']), 0.054, 0.034, skin, 10)
        a = leg['ank']
        ball(0.06, p(a[0], a[1] - 0.04, 0.07), skin, uv=(8, 5), scale=(0.75, 1.75, 0.6))
    # torso (hips, waist, chest, shoulders) as one lathe, flattened front-to-back
    torso = [(0, 0.84), (0.13, 0.86), (0.165, 0.94), (0.15, 1.02), (0.118, 1.12), (0.13, 1.22), (0.15, 1.31),
             (0.152, 1.38), (0.12, 1.44), (0.05, 1.475), (0, 1.48)]
    lathe(torso, skin, seg=14, loc=p(0, 0, 0), scale=(1, 0.68, 1))
    rod(p(0, 0, 1.44), p(0, 0.005, 1.56), 0.045, 0.04, skin, 8)
    ball(0.105, p(0, -0.005, 1.645), skin, uv=(14, 9), scale=(0.86, 0.95, 1.13), rot=(0.08, 0.1, 0))
    # arms: left hangs relaxed, right forearm bent forward elegantly
    A = [dict(sh=(-0.185, 0.0, 1.4), el=(-0.225, 0.02, 1.13), wr=(-0.235, -0.02, 0.88)),
         dict(sh=(0.185, 0.0, 1.4), el=(0.22, 0.03, 1.13), wr=(0.17, -0.2, 1.02))]
    for arm in A:
        ball(0.048, p(*arm['sh']), joint, uv=(10, 6))
        rod(p(*arm['sh']), p(*arm['el']), 0.044, 0.036, skin, 8)
        ball(0.037, p(*arm['el']), joint, uv=(8, 5))
        rod(p(*arm['el']), p(*arm['wr']), 0.034, 0.026, skin, 8)
        d = (Vector(arm['wr']) - Vector(arm['el'])).normalized()
        h = Vector(arm['wr']) + d * 0.07
        ball(0.06, p(*h), skin, uv=(8, 5), scale=(0.45, 0.75, 1.1),
             rot=(0, 0, 0) if arm['wr'][2] < 0.95 else (1.1, 0, 0.3))
    if cloth == 'dress':
        pink = mat("dress_pink", "#F097B5", rough=0.6)
        pink2 = mat("dress_pink_dark", "#D46F93", rough=0.6)
        lathe([(0.123, 1.1), (0.138, 1.22), (0.158, 1.31), (0.158, 1.37), (0.13, 1.4)], pink, seg=14,
              scale=(1, 0.7, 1), loc=p(0, 0, 0))
        lathe([(0.14, 1.11), (0.16, 1.02), (0.2, 0.9), (0.27, 0.72), (0.33, 0.52), (0.34, 0.5)], pink, seg=16,
              scale=(1, 0.78, 1), loc=p(0, 0, 0))
        torus(0.125, 0.018, p(0, 0, 1.11), pink2, 14, 4)
        for sx in (-1, 1):  # straps and a bow at the waist
            rod(p(sx * 0.1, -0.08, 1.39), p(sx * 0.12, 0.0, 1.45), 0.012, 0.012, pink, 4)
        ball(0.035, p(0.06, -0.095, 1.11), pink2, uv=(6, 4), scale=(1.4, 0.5, 0.8))
        ball(0.035, p(0.11, -0.085, 1.11), pink2, uv=(6, 4), scale=(1.4, 0.5, 0.8))
    elif cloth == 'jeans':
        white = mat("shirt_white", "#F6F5F1", rough=0.65)
        denim = mat("denim_blue", "#41618F", rough=0.85)
        brown = mat("belt_brown", "#6A4428", rough=0.6)
        lathe([(0.17, 0.97), (0.13, 1.08), (0.13, 1.22), (0.163, 1.31), (0.165, 1.38), (0.13, 1.45), (0.06, 1.48)],
              white, seg=14, scale=(1, 0.7, 1), loc=p(0, 0, 0))
        for sx in (-1, 1):  # collar points
            box((0.06, 0.02, 0.05), p(sx * 0.035, -0.06, 1.46), white, rot=(0.3, 0, sx * 0.6))
        for k in range(4):
            ball(0.008, p(0, -0.105 + 0.002 * k, 1.38 - k * 0.08), mat("button_pearl", "#D9D6CC"), uv=(4, 3))
        for arm in A:
            rod(p(*arm['sh']), p(*arm['el']), 0.056, 0.047, white, 8)
            rod(p(*arm['el']), p(*arm['wr']), 0.046, 0.038, white, 8)
        lathe([(0.175, 0.85), (0.178, 0.94), (0.172, 1.0), (0.165, 1.04)], denim, seg=14, scale=(1, 0.7, 1),
              loc=p(0, 0, 0))
        torus(0.168, 0.018, p(0, 0, 1.0), brown, 14, 4)
        box((0.04, 0.012, 0.03), p(0, -0.12, 1.0), mat("brass", "#C9A548", rough=0.35, metal=0.7))
        for leg in (L, R):
            rod(p(*leg['hip']), p(*leg['knee']), 0.092, 0.068, denim, 10)
            rod(p(*leg['knee']), p(*leg['ank']), 0.066, 0.056, denim, 10)
    elif cloth == 'coat':
        coat = mat("coat_yellow", "#EEC13E", rough=0.7)
        coat2 = mat("coat_yellow_dark", "#C99A22", rough=0.7)
        btn = mat("button_dark", "#4A3A28", rough=0.5)
        lathe([(0.2, 0.52), (0.2, 0.7), (0.19, 0.9), (0.175, 1.02), (0.15, 1.12), (0.16, 1.22), (0.178, 1.31),
               (0.18, 1.38), (0.145, 1.45), (0.07, 1.49), (0.06, 1.52)], coat, seg=16, scale=(1, 0.74, 1),
              loc=p(0, 0, 0))
        for sx in (-1, 1):  # lapels, pocket flaps
            box((0.07, 0.015, 0.2), p(sx * 0.05, -0.128, 1.35), coat2, rot=(-0.1, 0, sx * -0.35))
            box((0.11, 0.015, 0.035), p(sx * 0.1, -0.15, 0.92), coat2, rot=(0, 0, 0))
        for k in range(3):
            ball(0.012, p(0.03, -0.14, 1.2 - k * 0.12), btn, uv=(5, 3))
        torus(0.17, 0.02, p(0, 0, 1.12), coat2, 16, 4, rot=(0, 0, 0))
        for arm in A:
            rod(p(*arm['sh']), p(*arm['el']), 0.064, 0.054, coat, 8)
            rod(p(*arm['el']), p(*arm['wr']), 0.054, 0.05, coat, 8)
            rod(p(*arm['wr']), p(*(Vector(arm['wr']) - (Vector(arm['wr']) - Vector(arm['el'])).normalized() * 0.04)),
                0.056, 0.056, coat2, 8)
    return "mannequin" + ("_" + cloth if cloth else "")


def build_mannequins():
    reset()
    for i, cl in enumerate((None, 'dress', 'jeans', 'coat')):
        name = _mannequin(i * 0.9, cl)
        group(name, keep_loc=True)
    export("harbor_mannequin_v01")


def build_boutique_props():
    reset()
    chrome = mat("chrome", "#B9BEC4", rough=0.2, metal=0.9)
    gold = mat("gold", "#D4AF47", rough=0.3, metal=0.85)
    wood = mat("wood_white", "#F3EEE6", rough=0.6)
    dark = mat("rubber_dark", "#2E2E33", rough=0.8)
    mirror = mat("mirror", "#CFE3EC", rough=0.03, metal=1.0)
    marble = mat("marble_white", "#F4F1EC", rough=0.35)
    # --- clothes rack with 6 hangers (x around -2.3)
    x0 = -2.4
    for sx in (-1, 1):
        x = x0 + sx * 0.75
        cyl(0.016, 1.62, (x, 0, 0.87), chrome, 6)
        beam((x, -0.25, 0.07), (x, 0.25, 0.07), 0.035, chrome)
        for sy in (-1, 1):
            ball(0.035, (x, sy * 0.25, 0.035), dark, uv=(6, 4))
    cyl(0.016, 1.54, (x0, 0, 1.67), chrome, 6, rot=(0, math.pi / 2, 0))
    colors = [("cloth_coral", "#F07C6C"), ("cloth_mint", "#7FD1B4"), ("cloth_lavender", "#B49BE0"),
              ("cloth_yellow", "#F4CF55"), ("cloth_sky", "#7DB8EC"), ("cloth_white", "#F5F3EE")]
    for i, (n, c) in enumerate(colors):
        m = mat(n, c, rough=0.75)
        x = x0 - 0.6 + i * 0.24
        torus(0.025, 0.006, (x, 0, 1.67), chrome, 6, 3, rot=(0, math.pi / 2, 0))
        beam((x, 0, 1.645), (x, 0, 1.6), 0.008, chrome)
        if i % 2 == 0:  # shirt: body + sleeves
            box((0.05, 0.38, 0.6), (x, 0, 1.28), m, bev=0.01)
            for sy in (-1, 1):
                box((0.045, 0.12, 0.32), (x, sy * 0.22, 1.42), m, rot=(sy * 0.45, 0, 0))
        else:  # dress: tapered skirt
            cyl(0.15, 0.85, (x, 0, 1.16), m, 4, r2=0.12, rot=(0, 0, math.pi / 4), scale=(0.25, 1.35, 1))
        for sy in (-1, 1):
            beam((x, 0, 1.6), (x, sy * 0.19, 1.56), 0.012, gold if i % 2 else chrome)
    # --- shoe shelf, 3 tiers (x around -0.6)
    x1 = -0.6
    for sx in (-1, 1):
        box((0.04, 0.36, 1.05), (x1 + sx * 0.5, 0, 0.525), wood, bev=0.01)
    box((1.04, 0.02, 1.05), (x1, 0.17, 0.525), wood)
    shoe_cols = [("shoe_red", "#C9363A"), ("shoe_tan", "#C08A55"), ("shoe_black", "#2B2A2E"),
                 ("shoe_white", "#EDEBE6"), ("shoe_pink", "#EE9BB6"), ("shoe_navy", "#2C3E66"),
                 ("shoe_mint", "#86CDB0")]
    k = 0
    for t, z in enumerate((0.06, 0.42, 0.78)):
        box((0.98, 0.34, 0.03), (x1, 0, z), wood, bev=0.008)
        npairs = 3 if t != 1 else 2
        for j in range(npairs):
            n, c = shoe_cols[k % len(shoe_cols)]
            m = mat(n, c, rough=0.5)
            k += 1
            cx = x1 + (j - (npairs - 1) / 2) * 0.3
            for sx in (-0.045, 0.045):
                box((0.075, 0.24, 0.025), (cx + sx, -0.01, z + 0.028), dark)
                ball(0.04, (cx + sx, -0.09, z + 0.055), m, uv=(6, 4), scale=(0.95, 1.2, 0.75))
                box((0.07, 0.12, 0.08), (cx + sx, 0.05, z + 0.08), m, bev=0.01)
    # --- standing mirror with gold oval frame (x around 0.6)
    x2 = 0.6
    torus(0.33, 0.035, (x2, 0, 1.05), gold, 20, 4, rot=(math.pi / 2, 0, 0))
    OBJS[-1].data.transform(Matrix.Diagonal((1.0, 2.05, 1.0, 1.0)))  # stretch the ring into a tall oval
    cyl(0.31, 0.012, (x2, 0.005, 1.05), mirror, 20, rot=(math.pi / 2, 0, 0), scale=(1, 2.03, 1))
    beam((x2, 0.03, 1.4), (x2, 0.45, 0.0), 0.04, gold)
    for sx in (-1, 1):
        beam((x2 + sx * 0.3, -0.02, 0.4), (x2 + sx * 0.36, -0.12, 0.0), 0.035, gold)
    # --- round display podium, 3 tiers with gold rims (x around 1.9)
    x3 = 1.9
    for i, (r, z) in enumerate(((0.62, 0.0), (0.47, 0.16), (0.32, 0.32))):
        cyl(r, 0.16, (x3, 0, z + 0.08), marble, 20)
        torus(r, 0.014, (x3, 0, z + 0.155), gold, 20, 3)
    # name and group each prop: re-split by building order using bounds
    parts = list(OBJS)
    OBJS.clear()
    buckets = {"clothes_rack": [], "shoe_shelf": [], "standing_mirror": [], "display_podium": []}
    for o in parts:
        x = o.location.x if o.type == 'MESH' else 0
        key = ("clothes_rack" if x < -1.4 else "shoe_shelf" if x < 0.0 else
               "standing_mirror" if x < 1.2 else "display_podium")
        buckets[key].append(o)
    for name, objs in buckets.items():
        OBJS.extend(objs)
        group(name, keep_loc=True)
    export("harbor_boutique_props_v01")


BUILDERS = {"harbor_mannequin": build_mannequins, "harbor_boutique_props": build_boutique_props}
