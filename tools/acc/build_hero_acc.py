"""Accessories for the hero (Ruby), 4 new styles per kind (the old Ngoc-era model is style 1, fitted in code by HERO_FIT).
Run:  OUT=assets/models /workspace/.bpyenv/bin/python tools/acc/build_hero_acc.py      (ONLY=acc_hat_cap,... to build a few;
PREVIEW=<folder> also renders front / side shots of each piece on the hero). Each file <= ~700 triangles; materials:
tint_main / tint_trim (grey, coloured by the game), glass, metal, dark, leaf, pearl. Coordinates = the hero's (see hero_lib.py).
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hero_lib import *  # noqa
import hero_lib

ONLY = [s for s in os.environ.get("ONLY", "").split(",") if s]
PREVIEW = os.environ.get("PREVIEW", "")
M = None
BUILDERS = {}
rad = math.radians


def model(name):
    def deco(fn):
        BUILDERS[name] = fn
        return fn
    return deco


# ------------------------------------------------------------------ HEAD: hats
HX, HY = C.x, -0.005      # axis of the hat crowns


def hat_ring(z, r, rm, ry_k=1.24):
    return (r, z)


@model("acc_hat_cap")
def cap():
    m = M
    prof = [(0.215, 1.47), (0.225, 1.53), (0.218, 1.60), (0.19, 1.66), (0.135, 1.70), (0.065, 1.72), (0.0, 1.727)]
    lathe(prof, m['main'], seg=14, loc=(HX, HY, 0), scale=(1, 1.24, 1))
    # visor: a curved fan in front
    verts, faces = [], []
    angs = [-72, -48, -24, 0, 24, 48, 72]
    for i, a in enumerate(angs):
        for rr, dz in ((0.25, 0.0), (0.33, -0.012), (0.43, -0.04)):
            ar = rad(a)
            verts.append((HX + math.sin(ar) * rr * 0.92, HY - math.cos(ar) * rr * 1.02, 1.49 + dz))
    for i in range(len(angs) - 1):
        for j in range(2):
            a, b = i * 3 + j, (i + 1) * 3 + j
            faces.append([a, b, b + 1, a + 1])
    mesh(verts, faces, m['trim'])
    ball(0.02, (HX, HY, 1.727), m['trim'], sub=1)
    # seam stripes
    for a in (-60, 60, 0):
        pts = []
        for t in range(6):
            ar = rad(a)
            z = 1.50 + 0.04 * t
            rr = [0.226, 0.229, 0.222, 0.2, 0.15, 0.08][t]
            pts.append(V((HX + math.sin(ar) * rr, HY - math.cos(ar) * rr * 1.24, z)))
        tube(pts, 0.004, m['trim'], seg=4)


@model("acc_hat_beanie")
def beanie():
    m = M
    prof = [(0.222, 1.452), (0.240, 1.454), (0.240, 1.53), (0.232, 1.532), (0.236, 1.585), (0.222, 1.66), (0.186, 1.725), (0.115, 1.77), (0.04, 1.793), (0.0, 1.797)]
    lathe(prof, [m['trim'], m['main']], seg=14, loc=(HX, HY, 0), scale=(1, 1.22, 1), mats=[0, 0, 0, 1, 1, 1, 1, 1, 1])
    ball(0.055, (HX, HY, 1.835), m['trim'], sub=2)


@model("acc_hat_bucket")
def bucket():
    m = M
    prof = [(0.222, 1.5), (0.228, 1.56), (0.222, 1.64), (0.19, 1.705), (0.12, 1.735), (0.0, 1.745)]
    lathe(prof, m['main'], seg=14, loc=(HX, HY, 0), scale=(1, 1.22, 1))
    br = [(0.226, 1.512), (0.30, 1.48), (0.36, 1.43), (0.37, 1.425)]       # short brim slopes down
    lathe(br, m['trim'], seg=14, loc=(HX, HY, 0), scale=(1, 1.15, 1))
    lathe([(0.2255, 1.53), (0.2285, 1.545)], m['trim'], seg=14, loc=(HX, HY, 0), scale=(1, 1.22, 1))
    tube([V((HX + math.sin(rad(a)) * 0.2300, HY - math.cos(rad(a)) * 0.2300 * 1.22, 1.545)) for a in range(0, 360, 30)] + [V((HX, HY - 0.2300 * 1.22, 1.545))], 0.006, m['metal'], seg=4)


@model("acc_hat_wizard")
def wizard():
    m = M
    br = lathe([(0.22, 1.505), (0.32, 1.50), (0.42, 1.47), (0.44, 1.455)], m['trim'], seg=16, loc=(HX, HY, 0), scale=(1, 1.1, 1))
    prof = [(0.222, 1.50), (0.21, 1.58), (0.18, 1.68), (0.14, 1.79), (0.1, 1.9), (0.06, 2.0), (0.03, 2.07), (0.0, 2.11)]
    cone = lathe(prof, m['main'], seg=14, loc=(HX, HY + 0.015, 0), scale=(1, 1.12, 1))
    bend(cone, 1.75, 1.1, axis=1)
    lathe([(0.219, 1.505), (0.2265, 1.535), (0.221, 1.58)], m['trim'], seg=14, loc=(HX, HY, 0), scale=(1, 1.12, 1))
    box((0.07, 0.01, 0.06), (HX, HY - 0.255, 1.545), m['metal'])
    for k, (x, z) in enumerate([(-0.07, 1.72), (0.06, 1.86), (-0.02, 1.95)]):
        plate(star_poly(5, 1.0, 0.45), 0.004, m['metal'], scale=0.022, center=(HX + x, HY - 0.17 + 0.05 * k - 0.05, z))


# ------------------------------------------------------------------ FACE: glasses
FY = -0.232                     # glasses plane in front of the eyes
EZ, EX, LR = 1.316, 0.072, 0.062        # eye height, half spacing, lens radius


def temples(m, ytop=FY + 0.02, tr=0.0045, dz=0.0):
    for s in (-1, 1):
        pts = [V((s * (EX + LR - 0.005) + C.x, ytop, EZ + 0.01 + dz)), V((s * 0.17 + C.x, -0.16, EZ + 0.012 + dz)), V((s * 0.205 + C.x, -0.085, EZ + 0.005 + dz)), V((s * 0.208 + C.x, -0.05, EZ - 0.03 + dz))]
        tube(pts, tr, m['main'], seg=5)


@model("acc_glasses_round")
def g_round():
    m = M
    for s in (-1, 1):
        torus(LR, 0.0055, (C.x + s * EX, FY, EZ), m['main'], seg=18, mseg=5, rot=(rad(90), 0, 0))
        ball(LR - 0.004, (C.x + s * EX, FY, EZ), m['glass'], sub=2, scale=(1, 0.05, 1))
    tube([V((C.x - 0.016, FY - 0.004, EZ + 0.02)), V((C.x, FY - 0.014, EZ + 0.032)), V((C.x + 0.016, FY - 0.004, EZ + 0.02))], 0.0045, m['main'], seg=5)
    temples(m)


@model("acc_glasses_sun")
def g_sun():
    m = M
    sq = [(-1, -.7), (-.8, -.9), (.8, -.9), (1, -.7), (1, .55), (.75, .8), (-.75, .8), (-1, .55)]
    for s in (-1, 1):
        plate(sq, 0.012, m['main'], scale=LR * 1.12, center=(C.x + s * EX, FY, EZ + 0.004))
        plate(sq, 0.004, m['dark'], scale=LR * 0.98, center=(C.x + s * EX, FY - 0.0085, EZ + 0.004))
    box((0.05, 0.012, 0.014), (C.x, FY, EZ + 0.03), m['main'])
    temples(m, tr=0.0055)


@model("acc_glasses_heart")
def g_heart():
    m = M
    hp = heart_poly()
    for s in (-1, 1):
        plate(hp, 0.012, m['main'], scale=LR * 1.28, center=(C.x + s * EX, FY, EZ - 0.012))
        plate(hp, 0.004, m['glass'], scale=LR * 1.12, center=(C.x + s * EX, FY - 0.0085, EZ - 0.01))
    box((0.03, 0.01, 0.012), (C.x, FY, EZ + 0.01), m['main'])
    temples(m, dz=0.0)


@model("acc_glasses_star")
def g_star():
    m = M
    sp = star_poly(5, 1.0, 0.5)
    for s in (-1, 1):
        plate(sp, 0.012, m['main'], scale=LR * 1.28, center=(C.x + s * EX, FY, EZ))
        plate(sp, 0.004, m['glass'], scale=LR * 1.08, center=(C.x + s * EX, FY - 0.0085, EZ))
    box((0.03, 0.01, 0.012), (C.x, FY, EZ + 0.01), m['main'])
    temples(m)


# ------------------------------------------------------------------ HAIR: headbands
def band_pts(phi0, phi1, tilt, off, n=16):
    pts = []
    for i in range(n + 1):
        phi = phi0 + (phi1 - phi0) * i / n
        a = rad(phi)
        d = V((math.sin(a), 0, math.cos(a)))
        d = Matrix.Rotation(rad(tilt), 3, 'X') @ d
        r = ray(C, d)
        pts.append(C + d * ((r if r else 0.25) + off))
    return pts


@model("acc_headband_cat")
def hb_cat():
    m = M
    pts = band_pts(-98, 98, 18, 0.012)
    tube(pts, 0.011, m['main'], seg=6)
    for s in (-1, 1):
        base = band_pts(s * 50, s * 50, 18, 0.012, 1)[0]
        d = (base - C).normalized()
        st = start()
        w, h, t = 0.058, 0.125, 0.013            # ear: triangle in the Y-Z plane (apex along -Y = out of the head), thin along X
        tri = [(0, 0, -w), (0, 0, w), (0, -h, 0)]
        mesh([(t, y, z) for _, y, z in tri] + [(-t, y, z) for _, y, z in tri], [[0, 1, 2], [3, 5, 4], [0, 3, 4, 1], [1, 4, 5, 2], [2, 5, 3, 0]], m['main'])
        mesh([(t + 0.001, y * 0.7 - 0.005 if y else -0.004, z * 0.55) for _, y, z in tri], [[0, 1, 2]], m['trim'])
        mesh([(-t - 0.001, y * 0.7 - 0.005 if y else -0.004, z * 0.55) for _, y, z in tri], [[2, 1, 0]], m['trim'])
        place(st, base + d * 0.003, d, roll=0)


@model("acc_headband_bunny")
def hb_bunny():
    m = M
    pts = band_pts(-98, 98, 18, 0.012)
    tube(pts, 0.011, m['main'], seg=6)
    for s in (-1, 1):
        base = band_pts(s * 30, s * 30, 18, 0.012, 1)[0]
        d = (base - C).normalized()
        st = start()
        ball(0.04, (0, -0.13, 0), m['main'], sub=2, scale=(0.5, 3.3, 0.85))
        ball(0.026, (0.016 * 0.4, -0.135, 0), m['trim'], sub=1, scale=(0.4, 3.0, 0.65))
        place(st, base + d * 0.005, d, roll=0)


@model("acc_headband_sport")
def hb_sport():
    m = M
    top, bot = [], []
    pts, sides = [], []
    for i in range(0, 25):
        az = -118 + 236 * i / 24
        p, d = onhead(az, 24, 0.012)
        pts.append(p)
        sides.append(V((0, 0, 0.03)))
    ribbon(pts, sides, m['main'])
    # thickness: a second, slightly bigger ring behind it, plus the white stripes
    pts2 = [p + (p - C).normalized() * 0.004 for p in pts]
    for dz, mm in ((0.012, m['trim']), (-0.012, m['trim'])):
        tube([q + V((0, 0, dz)) + (q - C).normalized() * 0.006 for q in pts], 0.004, mm, seg=4)


@model("acc_headband_pearl")
def hb_pearl():
    m = M
    pts = band_pts(-98, 98, 18, 0.016)
    tube(pts, 0.004, m['metal'], seg=4)
    for i in range(1, len(pts) - 1, 2):
        ball(0.016, pts[i], m['pearl'], sub=1)
    ball(0.026, pts[len(pts) // 2], m['trim'], sub=1)


# ------------------------------------------------------------------ HAIR: bows
def bow_parts(m, size=1.0, tails=True):
    """a bow drawn at the origin facing -Y: two loops, a knot, two tails"""
    s = size
    for k in (-1, 1):
        ball(0.04 * s, (k * 0.05 * s, 0, 0), m['main'], sub=2, scale=(1.5, 0.45, 1.0), rot=(0, k * rad(18), 0))
        ball(0.028 * s, (k * 0.05 * s, -0.006 * s, 0), m['trim'], sub=1, scale=(1.2, 0.3, 0.7), rot=(0, k * rad(18), 0))
    ball(0.02 * s, (0, -0.005 * s, 0), m['main'], sub=1)
    if tails:
        for k in (-1, 1):
            mesh([(k * 0.004 * s, 0, -0.01 * s), (k * 0.028 * s, 0, -0.01 * s), (k * 0.052 * s, 0, -0.07 * s), (k * 0.026 * s, 0, -0.075 * s)], [[0, 1, 2, 3]], m['main'])


@model("acc_bow_side")
def bow_side():
    st = start()
    bow_parts(M, 1.0)
    p, d = onhead(62, 33, 0.012)
    place(st, p, d, roll=rad(-25))


@model("acc_bow_top")
def bow_top():
    st = start()
    bow_parts(M, 1.35)
    p, d = onhead(-6, 52, 0.012)
    place(st, p, d, roll=0)


@model("acc_bow_pair")
def bow_pair():
    st = start()
    bow_parts(M, 0.8)
    p, d = onhead(70, 34, 0.012)
    place(st, p, d, roll=rad(-15))
    st2 = start()
    bow_parts(M, 0.8)
    p, d = onhead(-70, 34, 0.012)
    place(st2, p, d, roll=rad(15))


@model("acc_bow_ribbon")
def bow_ribbon():
    m = M
    pts, sides = [], []
    for i in range(0, 21):
        az = -118 + 236 * i / 20
        p, d = onhead(az, 28, 0.010)
        pts.append(p)
        sides.append(V((0, 0, 0.016)))
    ribbon(pts, sides, m['main'])
    st = start()
    bow_parts(m, 1.0)
    p, d = onhead(-96, 28, 0.016)
    place(st, p, d, roll=rad(-90))


# ------------------------------------------------------------------ HEAD jewellery: crowns
def crown_ring(z, off, a0=-180, a1=180, n=30):
    """a level ring around the dome of the head at height z (a little lower at the front), a0..a1 degrees from the front"""
    pts = []
    for i in range(n + 1):
        ang = a0 + (a1 - a0) * i / n
        f = (1 + math.cos(rad(ang))) / 2
        p, d = around((C.x, -0.005), z - 0.03 * f, ang, off, (0.235, 0.275), exact=True)
        pts.append(p)
    return pts


@model("acc_tiara_crown")
def crown():
    m = M
    ring = crown_ring(1.585, 0.014, -180, 180, 24)
    tube(ring[:-1], 0.011, m['main'], seg=5, closed=True)
    for i in range(0, 24, 4):
        p = ring[i]
        d = (p - C).normalized()
        st = start()
        mesh([(-0.034, 0, 0), (0.034, 0, 0), (0, 0, 0.115)], [[0, 1, 2]], m['main'])
        mesh([(-0.034, 0.008, 0), (0.034, 0.008, 0), (0, 0.008, 0.115)], [[2, 1, 0]], m['main'])
        ball(0.019, (0, 0, 0.122), m['trim'], sub=1)
        q = Vector(d.x, d.y, 0).normalized() if False else V((d.x, d.y, 0)).normalized()
        place(st, p + V((0, 0, 0.0)), q, roll=0)


@model("acc_tiara_flower")
def flowers():
    m = M
    ring = crown_ring(1.56, 0.012, -150, 150, 18)
    tube(ring, 0.005, m['leaf'], seg=4)
    for i in range(1, len(ring) - 1, 3):
        p = ring[i]
        d = (p - C).normalized()
        st = start()
        for k in range(5):
            a = 2 * math.pi * k / 5
            ball(0.015, (math.cos(a) * 0.022, -0.006, math.sin(a) * 0.022), m['trim'], sub=1, scale=(1, 0.5, 1))
        ball(0.014, (0, -0.012, 0), m['main'], sub=1)
        place(st, p + d * 0.004, d, roll=rad(i * 13))
        st = start()
        ball(0.012, (0, 0, 0), m['leaf'], sub=1, scale=(2.2, 0.35, 0.9))
        place(st, ring[i + 1] + (ring[i + 1] - C).normalized() * 0.002, (ring[i + 1] - C).normalized(), roll=rad(20))


@model("acc_tiara_laurel")
def laurel():
    m = M
    ring = crown_ring(1.56, 0.01, -165, 165, 24)
    tube(ring, 0.004, m['main'], seg=4)
    for i in range(1, len(ring) - 1):
        p = ring[i]
        d = (p - C).normalized()
        t = (ring[i + 1] - ring[i - 1]).normalized()
        for side in (1, -1):
            st = start()
            ball(0.02, (0, 0, 0), m['main'], sub=1, scale=(1.0, 0.25, 0.45))
            place(st, p + V((0, 0, side * 0.012)) + d * 0.004, d, roll=rad(side * 40))


@model("acc_tiara_stars")
def stars():
    m = M
    ring = crown_ring(1.575, 0.012, -125, 125, 20)
    tube(ring, 0.006, m['main'], seg=5)
    for i, (scale, dz) in zip(range(2, 19, 4), [(0.026, 0.0), (0.03, 0.01), (0.044, 0.02), (0.03, 0.01), (0.026, 0.0)]):
        p = ring[i]
        d = (p - C).normalized()
        st = start()
        plate(star_poly(5, 1.0, 0.46), 0.008, m['main'], scale=scale, center=(0, 0, scale * 0.9 + 0.004))
        ball(scale * 0.35, (0, -0.006, scale * 0.9 + 0.004), m['trim'], sub=1)
        place(st, p, d, roll=0)


# ------------------------------------------------------------------ HAIR clips
@model("acc_hairclip_star")
def clip_star():
    st = start()
    plate(star_poly(5, 1.0, 0.45), 0.014, M['main'], scale=0.065)
    ball(0.016, (0, -0.008, 0), M['trim'], sub=1)
    p, d = onhead(55, 30, 0.012)
    place(st, p, d, roll=rad(-15))


@model("acc_hairclip_flower")
def clip_flower():
    st = start()
    for k in range(6):
        a = 2 * math.pi * k / 6
        ball(0.026, (math.cos(a) * 0.036, -0.004, math.sin(a) * 0.036), M['trim'], sub=1, scale=(1, 0.5, 1))
    ball(0.026, (0, -0.012, 0), M['main'], sub=1)
    p, d = onhead(55, 30, 0.012)
    place(st, p, d, roll=rad(10))


@model("acc_hairclip_butterfly")
def clip_butterfly():
    m = M
    st = start()
    for sx in (-1, 1):
        ball(0.04, (sx * 0.04, 0, 0.026), m['trim'], sub=2, scale=(1.0, 0.18, 1.1), rot=(0, sx * rad(-20), 0))
        ball(0.03, (sx * 0.034, 0, -0.026), m['main'], sub=2, scale=(1.0, 0.18, 0.9), rot=(0, sx * rad(20), 0))
    ball(0.012, (0, -0.004, 0), m['main'], sub=1, scale=(0.7, 0.8, 3.5))
    p, d = onhead(55, 30, 0.012)
    place(st, p, d, roll=rad(-12))


@model("acc_hairclip_heart")
def clip_heart():
    st = start()
    plate(heart_poly(), 0.014, M['main'], scale=0.075, center=(0, 0, -0.03))
    plate(heart_poly(), 0.004, M['trim'], scale=0.05, center=(0, -0.008, -0.02))
    p, d = onhead(55, 30, 0.012)
    place(st, p, d, roll=rad(-12))


# ------------------------------------------------------------------ EARS: earrings
EAR = lambda s: V((C.x + s * 0.186, -0.055, 1.292))


@model("acc_earrings_hoop")
def e_hoop():
    st = start()
    torus(0.05, 0.0075, (0, 0, -0.05), M['main'], seg=14, mseg=5, rot=(0, rad(90), 0))
    place(st, EAR(1), V((1, 0, 0)))
    mirror(st, C.x)


@model("acc_earrings_stud")
def e_stud():
    st = start()
    ball(0.03, (0, 0, -0.01), M['main'], sub=1)
    ball(0.02, (0.018, 0, -0.01), M['trim'], sub=1)
    place(st, EAR(1), V((1, 0, 0)))
    mirror(st, C.x)


@model("acc_earrings_drop")
def e_drop():
    st = start()
    ball(0.018, (0, 0, 0), M['main'], sub=1)
    tube([V((0, 0, 0)), V((0, 0, -0.04))], 0.0045, M['main'], seg=4)
    ball(0.032, (0, 0, -0.08), M['trim'], sub=2, scale=(0.9, 0.9, 1.5))
    place(st, EAR(1), V((1, 0, 0)))
    mirror(st, C.x)


@model("acc_earrings_star")
def e_star():
    st = start()
    ball(0.016, (0, 0, 0), M['main'], sub=1)
    tube([V((0, 0, 0)), V((0, 0, -0.045))], 0.0045, M['main'], seg=4)
    plate(star_poly(5, 1.0, 0.45), 0.012, M['trim'], scale=0.04, center=(0, 0, -0.088))
    place(st, EAR(1), V((1, 0, 0)))
    mirror(st, C.x)


# ------------------------------------------------------------------ NECK: necklaces and scarves
NX, NY = 0.0, -0.058
NECK = (0.128, 0.085)      # ellipse capping the neck rays


def neck_ring(z_back, z_front, off, n=24, a0=0, a1=360, power=2.0):
    pts = []
    for i in range(n):
        ang = a0 + (a1 - a0) * i / n
        f = (1 + math.cos(rad(ang))) / 2            # 1 at the front
        z = z_back + (z_front - z_back) * f ** power
        p, d = around((NX, NY), z, ang, off, NECK)
        pts.append(p)
    return pts


@model("acc_necklace_pearl")
def n_pearl():
    m = M
    pts = neck_ring(1.1, 1.0, 0.014, 28)
    for i, p in enumerate(pts):
        ball(0.017, p, m['pearl'], sub=1)
    ball(0.03, pts[0] + V((0, -0.0, -0.035)), m['trim'], sub=2, scale=(1, 0.8, 1.2))


@model("acc_necklace_heart")
def n_heart():
    m = M
    pts = neck_ring(1.1, 1.0, 0.012, 24)
    tube(pts, 0.0055, m['main'], seg=4, closed=True)
    st = start()
    plate(heart_poly(), 0.016, m['trim'], scale=0.075, center=(0, 0, -0.04))
    place(st, pts[0] + V((0, -0.008, -0.0)), V((0, -1, 0.1)))


@model("acc_necklace_choker")
def n_choker():
    m = M
    pts, sides = [], []
    for i in range(0, 25):
        ang = -180 + 360 * i / 24
        p, d = around((NX, NY), 1.085, ang, 0.01, NECK)
        pts.append(p)
        sides.append(V((0, 0, 0.018)))
    ribbon(pts, sides, m['main'])
    tube([q + V((0, 0, 0.0125)) + (q - V((NX, NY, q.z))).normalized() * 0.0015 for q in pts], 0.0025, m['main'], seg=4)
    p, d = around((NX, NY), 1.075, 0, 0.014, NECK)
    ball(0.03, p, m['trim'], sub=2)
    for k in range(2):
        ball(0.012, p + V((0.05 * (k * 2 - 1), 0.006, 0.0)), m['metal'], sub=1)


@model("acc_necklace_star")
def n_star():
    m = M
    pts = neck_ring(1.1, 0.97, 0.012, 26, power=1.5)
    tube(pts, 0.0055, m['main'], seg=4, closed=True)
    st = start()
    plate(star_poly(5, 1.0, 0.45), 0.014, m['trim'], scale=0.05, center=(0, 0, -0.03))
    place(st, pts[0] + V((0, -0.006, 0)), V((0, -1, 0.12)))


@model("acc_scarf_muffler")
def s_muffler():
    m = M
    pts = neck_ring(1.1, 1.07, 0.03, 24, power=1.0)
    tube(pts, 0.045, m['main'], seg=6, closed=True)
    tube(neck_ring(1.125, 1.095, 0.034, 20, power=1.0), 0.02, m['trim'], seg=4, closed=True)
    p0, d0 = around((NX, NY), 1.05, -30, 0.04, NECK)
    for k, (dx, ln) in enumerate([(0, 0.2), (0.05, 0.15)]):
        a = p0 + V((dx, -0.02, 0))
        mesh([tuple(a + V((-0.04, 0, 0))), tuple(a + V((0.04, 0, 0))), tuple(a + V((0.04 + 0.012 * (k + 1), -0.05, -ln))), tuple(a + V((-0.04 + 0.012 * (k + 1), -0.05, -ln)))], [[0, 1, 2, 3]], m['main'] if k == 0 else m['trim'])


@model("acc_scarf_bandana")
def s_bandana():
    m = M
    pts, sides = [], []
    for i in range(0, 25):
        ang = -180 + 360 * i / 24
        p, d = around((NX, NY), 1.115, ang, 0.012, NECK)
        pts.append(p)
        sides.append(V((0, 0, 0.022)))
    ribbon(pts, sides, m['main'])
    p, d = around((NX, NY), 1.1, 0, 0.012, NECK)
    mesh([tuple(p + V((-0.095, 0.002, 0.012))), tuple(p + V((0.095, 0.002, 0.012))), tuple(p + V((0.0, -0.045, -0.115)))], [[0, 1, 2]], m['main'])
    for dx in (-0.045, 0, 0.045):
        ball(0.008, p + V((dx, -0.012, -0.03 - abs(dx) * 0.5)), m['trim'], sub=1)
    ball(0.016, p + V((0, -0.01, -0.108)), m['trim'], sub=1)


@model("acc_scarf_ribbon")
def s_ribbon():
    m = M
    pts, sides = [], []
    for i in range(0, 25):
        ang = -180 + 360 * i / 24
        p, d = around((NX, NY), 1.118, ang, 0.008, NECK)
        pts.append(p)
        sides.append(V((0, 0, 0.012)))
    ribbon(pts, sides, m['trim'])
    st = start()
    bow_parts(m, 1.7)
    p, d = around((NX, NY), 1.1, 0, 0.012, NECK)
    place(st, p + V((0, -0.0, 0)), V((0, -1, 0.0)))


@model("acc_scarf_fluffy")
def s_fluffy():
    m = M
    for k, ang in enumerate(range(-180, 180, 24)):
        p, d = around((NX, NY), 1.115, ang, 0.026, NECK)
        ball(0.033, p, m['main'] if k % 2 == 0 else m['trim'], sub=1, scale=(1, 1, 0.9))
    for k, ang in enumerate(range(-168, 180, 24)):
        p, d = around((NX, NY), 1.14, ang, 0.018, NECK)
        ball(0.026, p, m['trim'] if k % 2 == 0 else m['main'], sub=1)


# ------------------------------------------------------------------ WRIST: bracelets (hand.L; the T-pose arm runs along +X)
WRX, WRY, WRZ = 0.36, -0.052, 1.082


def wrist(x=WRX, off=0.0):
    return V((x, WRY, WRZ))


def wring(x, ry, rz, n=18):
    return [wrist(x) + V((0, -math.sin(2 * math.pi * i / n) * ry, math.cos(2 * math.pi * i / n) * rz)) for i in range(n)]


@model("acc_bracelet_hero")           # plain bangle (the hero's version of the first bracelet)
def b_bangle():
    tube(wring(WRX, 0.05, 0.047), 0.013, M['main'], seg=6, closed=True)
    tube(wring(WRX + 0.026, 0.05, 0.047), 0.005, M['trim'], seg=4, closed=True)


@model("acc_bracelet_beads")
def b_beads():
    m = M
    for i, p in enumerate(wring(WRX, 0.056, 0.052, 12)):
        ball(0.0165, p, m['main'] if i % 2 == 0 else m['trim'], sub=1)
    tube(wring(WRX, 0.056, 0.052, 12), 0.004, m['metal'], seg=4, closed=True)


@model("acc_bracelet_watch")
def b_watch():
    m = M
    tube(wring(WRX, 0.05, 0.047), 0.0105, m['trim'], seg=4, closed=True)
    top = wrist(WRX) + V((0, 0, 0.05))
    cyl(0.032, 0.014, tuple(top), m['metal'], seg=12)
    cyl(0.026, 0.017, tuple(top), m['dark'], seg=12)
    cyl(0.0035, 0.02, tuple(top + V((0, 0, 0.0))), m['main'], seg=4)
    box((0.004, 0.004, 0.02), tuple(top + V((0, 0, 0.006))), m['metal'])


@model("acc_bracelet_charm")
def b_charm():
    m = M
    tube(wring(WRX, 0.05, 0.047, 16), 0.0035, m['metal'], seg=4, closed=True)
    tube(wring(WRX + 0.014, 0.05, 0.047, 16), 0.0035, m['metal'], seg=4, closed=True)
    for k, (dx, c) in enumerate([(0, 'main'), (0.02, 'trim'), (-0.02, 'main')]):
        p = wrist(WRX + dx) + V((0, 0.0, -0.05))
        ball(0.016, p + V((0, 0, -0.02)), m[c], sub=1)
        tube([p, p + V((0, 0, -0.012))], 0.002, m['metal'], seg=4)
    plate(heart_poly(), 0.01, m['trim'], scale=0.03, center=tuple(wrist(WRX) + V((0, -0.05, -0.0))))


@model("acc_bracelet_cuff")
def b_cuff():
    m = M
    for dx, c in ((-0.022, 'main'), (0.0, 'main'), (0.022, 'main')):
        tube(wring(WRX + dx, 0.052, 0.049), 0.0125, m[c], seg=6, closed=True)
    tube(wring(WRX + 0.0, 0.0535, 0.0505, 18), 0.004, m['metal'], seg=4, closed=True)
    ball(0.02, tuple(wrist(WRX) + V((0, 0, 0.056))), m['trim'], sub=2, scale=(1.2, 1, 0.7))


# ------------------------------------------------------------------ BACK: bags (chest bone). Back of the torso is y ~ +0.03.
def torso_back(z):
    p, d = around((0.0, -0.07), z, 180, 0.0)
    return p.y


@model("acc_bag_satchel")
def bag_satchel():
    m = M
    yb = torso_back(0.9) + 0.002
    box((0.26, 0.09, 0.2), (0.0, yb + 0.05, 0.86), m['main'], bev=0.012)
    box((0.27, 0.095, 0.075), (0.0, yb + 0.05, 0.915), m['trim'], bev=0.01)
    box((0.05, 0.1, 0.03), (0.0, yb + 0.055, 0.89), m['metal'])
    # strap across the chest from the right shoulder to the left hip
    p1, _ = around((0.0, -0.07), 1.03, 90, 0.012)
    pts = [V((0.07, yb + 0.012, 1.075)), V((0.11, -0.06, 1.07)), V((0.0, -0.17, 0.95)), V((-0.13, -0.15, 0.82)), V((-0.14, yb + 0.02, 0.84)), V((-0.1, yb + 0.07, 0.86))]
    tube(pts, 0.011, m['trim'], seg=4)


@model("acc_bag_pack")
def bag_pack():
    m = M
    yb = torso_back(0.95) + 0.002
    box((0.25, 0.11, 0.32), (0.0, yb + 0.06, 0.95), m['main'], bev=0.02)
    box((0.2, 0.05, 0.12), (0.0, yb + 0.13, 0.88), m['trim'], bev=0.012)
    box((0.15, 0.03, 0.08), (0.0, yb + 0.14, 1.04), m['trim'], bev=0.01)
    for s in (-1, 1):
        tube([V((s * 0.08, yb + 0.01, 1.1)), V((s * 0.09, -0.12, 1.07)), V((s * 0.08, -0.12, 0.92)), V((s * 0.07, yb + 0.01, 0.8))], 0.012, m['trim'], seg=4)


@model("acc_bag_round")
def bag_round():
    m = M
    yb = torso_back(0.9) + 0.002
    cyl(0.12, 0.08, (0.0, yb + 0.05, 0.9), m['main'], seg=14, rot=(rad(90), 0, 0))
    cyl(0.095, 0.01, (0.0, yb + 0.093, 0.9), m['trim'], seg=14, rot=(rad(90), 0, 0))
    ball(0.02, (0.0, yb + 0.1, 0.9), m['metal'], sub=1)
    for s in (-1, 1):
        tube([V((s * 0.08, yb + 0.01, 1.1)), V((s * 0.095, -0.12, 1.06)), V((s * 0.085, -0.12, 0.92)), V((s * 0.075, yb + 0.02, 0.82))], 0.01, m['trim'], seg=4)


@model("acc_bag_wings")
def bag_wings():
    m = M
    yb = torso_back(1.0) + 0.002
    box((0.18, 0.08, 0.24), (0.0, yb + 0.045, 0.98), m['trim'], bev=0.015)
    for s in (-1, 1):
        for k, (ln, ang) in enumerate([(0.34, 25), (0.28, 5), (0.22, -15)]):
            st = start()
            ball(0.045, (0, 0, 0), m['main'], sub=1, scale=(ln / 0.045 * 0.5, 0.18, 1.0))
            for o in OBJS[st:]:
                o.location = (s * (0.12 + ln * 0.5 * math.cos(rad(ang))), yb + 0.1, 1.1 + ln * 0.5 * math.sin(rad(ang)) - 0.03 * k)
                o.rotation_euler = (0, s * rad(-ang), 0)
    for s in (-1, 1):
        tube([V((s * 0.08, yb + 0.01, 1.1)), V((s * 0.09, -0.12, 1.07)), V((s * 0.08, -0.12, 0.92)), V((s * 0.07, yb + 0.01, 0.84))], 0.01, m['trim'], seg=4)


# ------------------------------------------------------------------ build / preview
def clear_parts():
    for o in list(bpy.data.objects):
        if o.name.startswith("acc_") or o.name.startswith("part") or o.type == 'MESH' and o.name.startswith("Cube") or o.name.startswith("Icosphere.") or o.name.startswith("Cylinder") or o.name.startswith("Torus"):
            if o.name not in ("Hero", "Outfit_dress", "Outfit_sleeve_l", "Outfit_sleeve_r"):
                bpy.data.objects.remove(o, do_unlink=True)


def setup_render():
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = 6
    sc.cycles.device = 'CPU'
    sc.render.resolution_x = 360
    sc.render.resolution_y = 360
    w = bpy.data.worlds.new('w')
    w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (0.9, 0.93, 1, 1)
    w.node_tree.nodes['Background'].inputs[1].default_value = 1.2
    sc.world = w
    cam = bpy.data.cameras.new('c')
    cam.type = 'ORTHO'
    co = bpy.data.objects.new('cam', cam)
    sc.collection.objects.link(co)
    sc.camera = co
    sun = bpy.data.lights.new('sun', 'SUN')
    sun.energy = 2.5
    so = bpy.data.objects.new('sun', sun)
    so.rotation_euler = (rad(50), 0, rad(-30))
    sc.collection.objects.link(so)
    return co


VIEWS = {  # name: (centre, ortho scale, camera direction (from), )
    'head': ((C.x, 0, 1.45), 0.95), 'neck': ((0, 0, 1.0), 0.95), 'wrist': ((0.4, 0, 1.08), 0.5), 'back': ((0, 0, 0.95), 1.2)}


def kind_of(name):
    for k in ('hat', 'glasses', 'headband', 'bow', 'tiara', 'hairclip', 'earrings'):
        if name.startswith('acc_' + k):
            return 'head'
    if name.startswith(('acc_necklace', 'acc_scarf')):
        return 'neck'
    if name.startswith('acc_bracelet'):
        return 'wrist'
    return 'back'


def shoot(cam, name, view, tag):
    ctr, sc_ = VIEWS[view]
    scene = bpy.context.scene
    cam.data.ortho_scale = sc_
    shots = [('f', (0, -3, 0), (90, 0, 0)), ('s', (3, 0, 0), (90, 0, 90))]
    if view in ('back',):
        shots = [('b', (0, 3, 0), (90, 0, 180)), ('s', (3, 0, 0), (90, 0, 90))]
    if view == 'wrist':
        shots = [('t', (0, 0, 3), (0, 0, 0)), ('f', (0, -3, 0), (90, 0, 0))]
    for t, off, rot in shots:
        cam.location = (ctr[0] + off[0], ctr[1] + off[1], ctr[2] + off[2])
        cam.rotation_euler = [rad(r) for r in rot]
        scene.render.filepath = os.path.join(PREVIEW, f"{name}_{t}.png")
        bpy.ops.render.render(write_still=True)


def main():
    global M
    load_body()
    M = hmats()
    cam = setup_render() if PREVIEW else None
    if PREVIEW:
        os.makedirs(PREVIEW, exist_ok=True)
    for name, fn in BUILDERS.items():
        if ONLY and name not in ONLY:
            continue
        OBJS.clear()
        hlib.GROUPS.clear()
        fn()
        o = group(name, origin=None)
        bm = bmesh.new()
        bm.from_mesh(o.data)
        bm.to_mesh(o.data)
        bm.free()
        export(name + "_v01")
        if PREVIEW:
            shoot(cam, name, kind_of(name), 'x')
        bpy.data.objects.remove(o, do_unlink=True)
        clear_parts()


main()
