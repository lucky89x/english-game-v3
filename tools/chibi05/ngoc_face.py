"""Procedural face textures for chr_ngoc_adventurer_v02 (front-projected onto the head).

Texture space: 1024x1024 covers x in [-0.30, 0.30] m and z in [-0.30, 0.30] m around the
head centre, seen from the front (viewer right = +X = Ngoc's left).
"""
from PIL import Image, ImageDraw, ImageFilter
import math

SIZE = 1024
SS = 2                      # supersampling factor
SPAN = 0.30                 # half extent in metres
SKIN = (246, 200, 166)

EYE_X, EYE_Z, EYE_W, EYE_H = 0.108, -0.040, 0.084, 0.098
MOUTH_Z = -0.138


def P(x, z):
    """metres -> supersampled pixel"""
    s = SIZE * SS
    return ((x / (2 * SPAN) + 0.5) * s, (0.5 - z / (2 * SPAN)) * s)


def L(m):
    return m / (2 * SPAN) * SIZE * SS


def ellipse(d, cx, cz, rx, rz, fill):
    x0, y0 = P(cx - rx, cz + rz)
    x1, y1 = P(cx + rx, cz - rz)
    d.ellipse([x0, y0, x1, y1], fill=fill)


def soft_layer(img, draw_fn, blur, color):
    """draw an alpha mask, blur it, and composite a flat colour through it (no dark fringes)"""
    mask = Image.new('L', img.size, 0)
    draw_fn(ImageDraw.Draw(mask))
    mask = mask.filter(ImageFilter.GaussianBlur(blur))
    layer = Image.new('RGBA', img.size, color[:3] + (255,))
    layer.putalpha(mask.point(lambda a: a * color[3] // 255))
    img.alpha_composite(layer)


def arc_poly(cx, cz, rx, rz, a0, a1, thick0, thick1, n=40):
    """thick crescent following an ellipse arc (angles in degrees, 0 = +x, 90 = up)"""
    outer, inner = [], []
    for i in range(n + 1):
        t = i / n
        a = math.radians(a0 + (a1 - a0) * t)
        th = thick0 + (thick1 - thick0) * t
        ox, oz = cx + rx * math.cos(a), cz + rz * math.sin(a)
        outer.append(P(ox + math.cos(a) * th * 0.5, oz + math.sin(a) * th * 0.5))
        inner.append(P(ox - math.cos(a) * th * 0.5, oz - math.sin(a) * th * 0.5))
    return outer + inner[::-1]


def draw_open_eye(img, side):
    cx = EYE_X * side
    cz = EYE_Z
    d = ImageDraw.Draw(img)
    # eye white
    ellipse(d, cx, cz, EYE_W / 2, EYE_H / 2, (255, 250, 244, 255))
    # iris: vertical gradient dark chocolate -> warm amber
    iris = Image.new('RGBA', img.size, (0, 0, 0, 0))
    idr = ImageDraw.Draw(iris)
    irx, irz = EYE_W * 0.47, EYE_H * 0.47
    steps = 40
    for i in range(steps):
        t = i / (steps - 1)
        col = (int(44 + (150 - 44) * t ** 1.6), int(22 + (82 - 22) * t ** 1.6), int(10 + (34 - 10) * t ** 1.6), 255)
        k = 1 - t * 0.55
        ellipse(idr, cx, cz - irz * (1 - k) * 0.9, irx * k, irz * k, col)
    mask = Image.new('L', img.size, 0)
    ellipse(ImageDraw.Draw(mask), cx, cz - EYE_H * 0.015, irx, irz, 255)
    img.paste(iris, (0, 0), Image.composite(iris, Image.new('RGBA', img.size, (0, 0, 0, 0)), mask).split()[3])
    d = ImageDraw.Draw(img)
    # pupil
    ellipse(d, cx, cz + EYE_H * 0.04, EYE_W * 0.20, EYE_H * 0.24, (24, 10, 6, 255))
    # glints
    ellipse(d, cx + EYE_W * 0.16 * side, cz + EYE_H * 0.20, EYE_W * 0.15, EYE_H * 0.14, (255, 255, 255, 255))
    ellipse(d, cx - EYE_W * 0.17 * side, cz - EYE_H * 0.20, EYE_W * 0.075, EYE_H * 0.065, (255, 255, 255, 235))
    ellipse(d, cx + EYE_W * 0.02 * side, cz - EYE_H * 0.30, EYE_W * 0.05, EYE_H * 0.03, (255, 236, 200, 200))
    # thick upper lash line with outer flick
    lash = (40, 18, 10, 255)
    a0, a1 = (25, 168) if side > 0 else (12, 155)
    t0, t1 = (0.024, 0.013) if side > 0 else (0.013, 0.024)
    d.polygon(arc_poly(cx, cz + EYE_H * 0.02, EYE_W * 0.53, EYE_H * 0.50, a0, a1, t0, t1), fill=lash)
    outer = 1 if side > 0 else -1
    ox = cx + outer * EYE_W * 0.50
    oz = cz + EYE_H * 0.22
    for k, (dx, dz, w) in enumerate([(0.026, 0.020, 0.008), (0.020, 0.032, 0.006)]):
        d.polygon([P(ox - outer * 0.008, oz - 0.004 + k * 0.012), P(ox + outer * dx, oz + dz),
                   P(ox - outer * 0.004, oz + 0.008 + k * 0.012)], fill=lash)
    # small lower lash accent
    d.polygon(arc_poly(cx, cz, EYE_W * 0.50, EYE_H * 0.50, 225, 315, 0.003, 0.003, 20), fill=(150, 80, 55, 255))


def draw_closed_eye(img, side, happy=False):
    cx, cz = EYE_X * side, EYE_Z
    d = ImageDraw.Draw(img)
    lash = (40, 18, 10, 255)
    if happy:   # ^ ^ shaped
        d.polygon(arc_poly(cx, cz - 0.012, EYE_W * 0.5, EYE_H * 0.36, 20, 160, 0.014, 0.014), fill=lash)
    else:       # relaxed closed lid (curve downward)
        d.polygon(arc_poly(cx, cz + 0.020, EYE_W * 0.52, EYE_H * 0.34, 200, 340, 0.013, 0.013), fill=lash)
        outer = 1 if side > 0 else -1
        ox, oz = cx + outer * EYE_W * 0.50, cz + 0.010
        d.polygon([P(ox - outer * 0.006, oz - 0.002), P(ox + outer * 0.022, oz + 0.008), P(ox, oz + 0.008)], fill=lash)


def draw_brows(img):
    d = ImageDraw.Draw(img)
    for side in (-1, 1):
        cx = (EYE_X + 0.004) * side
        d.polygon(arc_poly(cx, 0.040, 0.034, 0.016, 30 if side > 0 else 50, 130 if side > 0 else 150, 0.010, 0.010, 20),
                  fill=(92, 46, 22, 255))


def draw_mouth(img, kind):
    d = ImageDraw.Draw(img)
    dark = (112, 30, 34, 255)
    if kind == 'smile':
        w, h = 0.040, 0.046
        pts = [P(-w, MOUTH_Z + 0.010)]
        for i in range(41):
            a = math.pi * i / 40
            pts.append(P(-w * math.cos(a), MOUTH_Z + 0.010 - h * math.sin(a) ** 0.9))
        pts.append(P(w, MOUTH_Z + 0.010))
        # top lip edge slightly curved upward at corners
        top = [P(w * (1 - 2 * i / 20), MOUTH_Z + 0.010 + 0.006 * abs(1 - 2 * i / 20) ** 2) for i in range(21)]
        poly = pts + top
        d.polygon(poly, fill=dark)
        # tongue
        mask = Image.new('L', img.size, 0)
        ImageDraw.Draw(mask).polygon(poly, fill=255)
        t = Image.new('RGBA', img.size, (0, 0, 0, 0))
        ellipse(ImageDraw.Draw(t), 0.004, MOUTH_Z - 0.030, 0.027, 0.020, (236, 112, 112, 255))
        img.paste(t, (0, 0), Image.composite(t, Image.new('RGBA', img.size, (0, 0, 0, 0)), mask).split()[3])
        # upper teeth band
        teeth = Image.new('RGBA', img.size, (0, 0, 0, 0))
        ImageDraw.Draw(teeth).rectangle([P(-w, MOUTH_Z + 0.02), P(w, MOUTH_Z + 0.004)], fill=(255, 252, 246, 255))
        img.paste(teeth, (0, 0), Image.composite(teeth, Image.new('RGBA', img.size, (0, 0, 0, 0)), mask).split()[3])
        d = ImageDraw.Draw(img)
        # lip line & corner dimples
        d.line(top, fill=(150, 62, 52, 255), width=int(L(0.004)))
        for s in (-1, 1):
            d.line([P(s * (w + 0.002), MOUTH_Z + 0.014), P(s * (w + 0.010), MOUTH_Z + 0.022)], fill=(196, 112, 92, 255), width=int(L(0.004)))
    elif kind == 'talk':
        ellipse(d, 0, MOUTH_Z - 0.010, 0.022, 0.024, dark)
        t = Image.new('RGBA', img.size, (0, 0, 0, 0))
        ellipse(ImageDraw.Draw(t), 0, MOUTH_Z - 0.024, 0.015, 0.010, (236, 112, 112, 255))
        img.alpha_composite(t)
    else:  # soft closed smile
        d.polygon(arc_poly(0, MOUTH_Z + 0.004, 0.030, 0.018, 200, 340, 0.006, 0.006), fill=(150, 56, 50, 255))


def make_face(eyes='open', mouth='smile', size=SIZE):
    big = Image.new('RGBA', (SIZE * SS, SIZE * SS), SKIN + (255,))
    # blush
    def blush(d):
        for s in (-1, 1):
            ellipse(d, s * 0.165, -0.100, 0.036, 0.020, 255)
    soft_layer(big, blush, L(0.012), (242, 128, 118, 170))
    def nose(d):
        ellipse(d, 0.0, -0.092, 0.010, 0.006, 255)
    soft_layer(big, nose, L(0.004), (222, 140, 112, 150))
    for s in (-1, 1):
        if eyes == 'open':
            draw_open_eye(big, s)
        else:
            draw_closed_eye(big, s, happy=(eyes == 'happy'))
    draw_brows(big)
    draw_mouth(big, mouth)
    return big.resize((size, size), Image.LANCZOS).convert('RGB')


if __name__ == '__main__':
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else '.'
    make_face().save(f'{out}/face_preview.png')
