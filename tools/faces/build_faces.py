"""Face presets for the character creator (19/11): 8 faces x 4 expressions, drawn with Pillow.

Same texture space as tools/chibi05/ngoc_face_v03.py (1024 px covers x, z in [-0.30, 0.30] m around the head centre,
front view, viewer right = +X), so any of them can replace the face map of chr_ngoc_adventurer_v04. The background is
TRANSPARENT: the game paints the chosen skin tone under the features on a canvas (src/game/faces.js), so one set of
files serves every skin tone. The 'sweet' preset reproduces Ngoc's original face.

    python3 tools/faces/build_faces.py [out_dir] [--sheet sheet.png]
writes assets/tex/face_<id>_<happy|blink|talk|joy>.png
"""
from PIL import Image, ImageDraw, ImageFilter
import math
import sys
from pathlib import Path

SIZE, SS, SPAN = 1024, 2, 0.30
EYE_X, EYE_Z, EYE_W, EYE_H = 0.112, -0.046, 0.108, 0.128
MOUTH_Z = -0.138

# id -> style. iris: (dark, light) rgb; ew/eh: eye size; tilt: degrees (outer corner up +); lid: share of the eye hidden by the
# upper lid; lash: thickness; flick: outer lash flicks; brow: (thickness, angle offset deg, rgb, height); blush alpha; extras.
FACES = {
    'sweet':  dict(iris=((44, 22, 10), (150, 82, 34)), ew=1.0, eh=1.0, tilt=0, lid=0, lash=1.0, flick=True, brow=(1.0, 0, (92, 46, 22), 0.040), blush=170),
    'bright': dict(iris=((30, 18, 12), (120, 70, 40)), ew=1.08, eh=1.10, tilt=2, lid=0, lash=1.1, flick=True, brow=(0.9, 4, (80, 40, 20), 0.046), blush=200, sparkle=True),
    'cool':   dict(iris=((26, 26, 34), (92, 96, 120)), ew=1.04, eh=0.78, tilt=7, lid=0.12, lash=0.8, flick=False, brow=(1.35, -10, (52, 32, 22), 0.030), blush=90),
    'gentle': dict(iris=((52, 30, 16), (170, 110, 60)), ew=1.0, eh=0.95, tilt=-6, lid=0.06, lash=0.9, flick=False, brow=(0.9, 12, (110, 64, 34), 0.044), blush=190, freckles=False),
    'sporty': dict(iris=((40, 24, 14), (128, 84, 46)), ew=0.94, eh=0.92, tilt=0, lid=0, lash=0.7, flick=False, brow=(1.6, -4, (60, 34, 20), 0.036), blush=120, freckles=True),
    'dreamy': dict(iris=((46, 26, 64), (140, 104, 176)), ew=1.02, eh=1.0, tilt=-2, lid=0.30, lash=1.2, flick=True, brow=(0.8, 8, (96, 60, 40), 0.048), blush=180),
    'cheeky': dict(iris=((20, 50, 26), (90, 150, 70)), ew=1.0, eh=0.9, tilt=10, lid=0, lash=1.0, flick=True, brow=(1.0, -6, (84, 44, 22), 0.038), blush=170, fang=True),
    'calm':   dict(iris=((24, 38, 60), (80, 130, 180)), ew=0.92, eh=0.86, tilt=0, lid=0.18, lash=0.8, flick=False, brow=(1.1, 0, (70, 44, 28), 0.034), blush=110, mole=True),
}
EXPRESSIONS = [('happy', 'open', 'smile'), ('blink', 'closed', 'smile'), ('talk', 'open', 'talk'), ('joy', 'happy', 'smile')]


def P(x, z):
    s = SIZE * SS
    return ((x / (2 * SPAN) + 0.5) * s, (0.5 - z / (2 * SPAN)) * s)


def L(m):
    return m / (2 * SPAN) * SIZE * SS


def ellipse(d, cx, cz, rx, rz, fill):
    x0, y0 = P(cx - rx, cz + rz)
    x1, y1 = P(cx + rx, cz - rz)
    d.ellipse([x0, y0, x1, y1], fill=fill)


def soft_layer(img, draw_fn, blur, color):
    mask = Image.new('L', img.size, 0)
    draw_fn(ImageDraw.Draw(mask))
    mask = mask.filter(ImageFilter.GaussianBlur(blur))
    layer = Image.new('RGBA', img.size, color[:3] + (255,))
    layer.putalpha(mask.point(lambda a: a * color[3] // 255))
    img.alpha_composite(layer)


def arc_poly(cx, cz, rx, rz, a0, a1, thick0, thick1, n=40):
    outer, inner = [], []
    for i in range(n + 1):
        t = i / n
        a = math.radians(a0 + (a1 - a0) * t)
        th = thick0 + (thick1 - thick0) * t
        ox, oz = cx + rx * math.cos(a), cz + rz * math.sin(a)
        outer.append(P(ox + math.cos(a) * th * 0.5, oz + math.sin(a) * th * 0.5))
        inner.append(P(ox - math.cos(a) * th * 0.5, oz - math.sin(a) * th * 0.5))
    return outer + inner[::-1]


LASH = (40, 18, 10, 255)


def open_eye(img, side, st):
    cx, cz = EYE_X * side, EYE_Z
    W, H = EYE_W * st['ew'], EYE_H * st['eh']
    d = ImageDraw.Draw(img)
    ellipse(d, cx, cz, W / 2, H / 2, (255, 250, 244, 255))
    dark, light = st['iris']
    iris = Image.new('RGBA', img.size, (0, 0, 0, 0))
    idr = ImageDraw.Draw(iris)
    irx, irz = W * 0.47, H * 0.47
    for i in range(40):
        t = (i / 39) ** 1.6
        col = tuple(int(dark[c] + (light[c] - dark[c]) * t) for c in range(3)) + (255,)
        k = 1 - (i / 39) * 0.55
        ellipse(idr, cx, cz - irz * (1 - k) * 0.9, irx * k, irz * k, col)
    mask = Image.new('L', img.size, 0)
    ellipse(ImageDraw.Draw(mask), cx, cz - H * 0.015, irx, irz, 255)
    eyemask = Image.new('L', img.size, 0)
    ellipse(ImageDraw.Draw(eyemask), cx, cz, W / 2, H / 2, 255)
    from PIL import ImageChops
    img.paste(iris, (0, 0), ImageChops.multiply(ImageChops.multiply(mask, iris.split()[3]), eyemask))
    d = ImageDraw.Draw(img)
    ellipse(d, cx, cz + H * 0.04, W * 0.27, H * 0.33, (24, 10, 6, 255))
    ellipse(d, cx + W * 0.16 * side, cz + H * 0.20, W * 0.19, H * 0.17, (255, 255, 255, 255))
    ellipse(d, cx - W * 0.17 * side, cz - H * 0.20, W * 0.075, H * 0.065, (255, 255, 255, 235))
    ellipse(d, cx + W * 0.02 * side, cz - H * 0.30, W * 0.05, H * 0.03, (255, 236, 200, 200))
    if st.get('sparkle'):      # a little four-point star in each eye
        sx, sz, r = cx - W * 0.12 * side, cz + H * 0.05, W * 0.09
        d.polygon([P(sx, sz + r), P(sx + r * 0.22, sz + r * 0.22), P(sx + r, sz), P(sx + r * 0.22, sz - r * 0.22),
                   P(sx, sz - r), P(sx - r * 0.22, sz - r * 0.22), P(sx - r, sz), P(sx - r * 0.22, sz + r * 0.22)], fill=(255, 255, 255, 230))
    lid = st['lid']
    if lid > 0:      # heavy upper lid: cut the top of the eye away, then a flatter lash line along the cut
        cut = Image.new('L', img.size, 255)
        top = cz + H / 2 - lid * H
        ImageDraw.Draw(cut).polygon([P(cx - W, top - 0.004), P(cx + W, top - 0.004), P(cx + W, cz + H), P(cx - W, cz + H)], fill=0)
        a = img.split()[3]
        img.putalpha(ImageChops.multiply(a, cut))
        d = ImageDraw.Draw(img)
        lw = 0.016 * st['lash']
        d.polygon(arc_poly(cx, top - 0.040, W * 0.55, 0.044, 20, 160, lw, lw), fill=LASH)
    else:
        a0, a1 = (25, 168) if side > 0 else (12, 155)
        t0, t1 = (0.024 * st['lash'], 0.013 * st['lash']) if side > 0 else (0.013 * st['lash'], 0.024 * st['lash'])
        d.polygon(arc_poly(cx, cz + H * 0.02, W * 0.53, H * 0.50, a0, a1, t0, t1), fill=LASH)
    if st['flick']:
        outer = 1 if side > 0 else -1
        ox, oz = cx + outer * W * 0.50, cz + H * (0.22 if lid <= 0 else 0.5 - lid)
        for k, (dx, dz) in enumerate([(0.026, 0.020), (0.020, 0.032)]):
            d.polygon([P(ox - outer * 0.008, oz - 0.004 + k * 0.012), P(ox + outer * dx, oz + dz), P(ox - outer * 0.004, oz + 0.008 + k * 0.012)], fill=LASH)
    d.polygon(arc_poly(cx, cz, W * 0.50, H * 0.50, 225, 315, 0.003, 0.003, 20), fill=(150, 80, 55, 255))


def closed_eye(img, side, st, happy=False):
    cx, cz = EYE_X * side, EYE_Z
    W, H = EYE_W * st['ew'], EYE_H * st['eh']
    d = ImageDraw.Draw(img)
    lw = 0.014 * max(0.8, st['lash'])
    if happy:
        d.polygon(arc_poly(cx, cz - 0.012, W * 0.5, H * 0.36, 20, 160, lw, lw), fill=LASH)
    else:
        d.polygon(arc_poly(cx, cz + 0.020, W * 0.52, H * 0.34, 200, 340, lw * 0.93, lw * 0.93), fill=LASH)
        if st['flick']:
            outer = 1 if side > 0 else -1
            ox, oz = cx + outer * W * 0.50, cz + 0.010
            d.polygon([P(ox - outer * 0.006, oz - 0.002), P(ox + outer * 0.022, oz + 0.008), P(ox, oz + 0.008)], fill=LASH)


def eye(img, side, st, kind):
    """each eye on its own layer, turned about its centre for the tilt"""
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    if kind == 'open':
        open_eye(layer, side, st)
    else:
        closed_eye(layer, side, st, happy=(kind == 'happy'))
    if st['tilt']:
        layer = layer.rotate(st['tilt'] * side, resample=Image.BICUBIC, center=P(EYE_X * side, EYE_Z))
    img.alpha_composite(layer)


def brows(img, st):
    thick, ang, col, hz = st['brow']
    d = ImageDraw.Draw(img)
    for side in (-1, 1):
        cx = (EYE_X + 0.004) * side
        a0, a1 = (30, 130) if side > 0 else (50, 150)
        lay = Image.new('RGBA', img.size, (0, 0, 0, 0))
        ImageDraw.Draw(lay).polygon(arc_poly(cx, hz, 0.034, 0.016, a0, a1, 0.010 * thick, 0.010 * thick, 20), fill=col + (255,))
        if ang:
            lay = lay.rotate(ang * side, resample=Image.BICUBIC, center=P(cx, hz))
        img.alpha_composite(lay)


def mouth(img, kind, st):
    d = ImageDraw.Draw(img)
    dark = (112, 30, 34, 255)
    from PIL import ImageChops
    if kind == 'smile':
        w, h = 0.040, 0.046
        pts = [P(-w, MOUTH_Z + 0.010)]
        for i in range(41):
            a = math.pi * i / 40
            pts.append(P(-w * math.cos(a), MOUTH_Z + 0.010 - h * math.sin(a) ** 0.9))
        pts.append(P(w, MOUTH_Z + 0.010))
        top = [P(w * (1 - 2 * i / 20), MOUTH_Z + 0.010 + 0.006 * abs(1 - 2 * i / 20) ** 2) for i in range(21)]
        poly = pts + top
        d.polygon(poly, fill=dark)
        mask = Image.new('L', img.size, 0)
        ImageDraw.Draw(mask).polygon(poly, fill=255)
        t = Image.new('RGBA', img.size, (0, 0, 0, 0))
        ellipse(ImageDraw.Draw(t), 0.004, MOUTH_Z - 0.030, 0.027, 0.020, (236, 112, 112, 255))
        img.paste(t, (0, 0), ImageChops.multiply(mask, t.split()[3]))
        teeth = Image.new('RGBA', img.size, (0, 0, 0, 0))
        ImageDraw.Draw(teeth).rectangle([P(-w, MOUTH_Z + 0.02), P(w, MOUTH_Z + 0.004)], fill=(255, 252, 246, 255))
        img.paste(teeth, (0, 0), ImageChops.multiply(mask, teeth.split()[3]))
        d = ImageDraw.Draw(img)
        if st.get('fang'):
            d.polygon([P(0.018, MOUTH_Z + 0.006), P(0.030, MOUTH_Z + 0.006), P(0.024, MOUTH_Z - 0.010)], fill=(255, 252, 246, 255))
        d.line(top, fill=(150, 62, 52, 255), width=int(L(0.004)))
        for s in (-1, 1):
            d.line([P(s * (w + 0.002), MOUTH_Z + 0.014), P(s * (w + 0.010), MOUTH_Z + 0.022)], fill=(196, 112, 92, 255), width=int(L(0.004)))
    elif kind == 'talk':
        ellipse(d, 0, MOUTH_Z - 0.010, 0.022, 0.024, dark)
        t = Image.new('RGBA', img.size, (0, 0, 0, 0))
        ellipse(ImageDraw.Draw(t), 0, MOUTH_Z - 0.024, 0.015, 0.010, (236, 112, 112, 255))
        img.alpha_composite(t)


def make_face(st, eyes='open', mouth_kind='smile', size=SIZE):
    big = Image.new('RGBA', (SIZE * SS, SIZE * SS), (0, 0, 0, 0))
    if st['blush']:
        soft_layer(big, lambda d: [ellipse(d, s * 0.165, -0.100, 0.036, 0.020, 255) for s in (-1, 1)], L(0.012), (242, 128, 118, st['blush']))
    soft_layer(big, lambda d: ellipse(d, 0.0, -0.092, 0.010, 0.006, 255), L(0.004), (222, 140, 112, 150))
    if st.get('freckles'):
        dots = [(0.052, -0.104), (0.070, -0.116), (0.090, -0.110), (0.110, -0.124), (0.130, -0.116), (0.150, -0.128)]
        soft_layer(big, lambda d: [ellipse(d, s * x, z, 0.0055, 0.0055, 255) for s in (-1, 1) for x, z in dots], L(0.0015), (170, 92, 60, 190))
    if st.get('mole'):
        soft_layer(big, lambda d: ellipse(d, 0.150, -0.150, 0.006, 0.006, 255), L(0.0012), (96, 50, 36, 220))
    for s in (-1, 1):
        eye(big, s, st, eyes)
    brows(big, st)
    mouth(big, mouth_kind, st)
    return big.convert('RGBa').resize((size, size), Image.LANCZOS).convert('RGBA')


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    out = Path(args[0]) if args else Path(__file__).resolve().parents[2] / 'assets' / 'tex'
    out.mkdir(parents=True, exist_ok=True)
    sheet_path = sys.argv[sys.argv.index('--sheet') + 1] if '--sheet' in sys.argv else None
    tiles = []
    for fid, st in FACES.items():
        for key, eyes, mk in EXPRESSIONS:
            img = make_face(st, eyes, mk)
            img.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(out / f'face_{fid}_{key}.png', optimize=True)      # 256 colours with alpha: a third of the size
            if key == 'happy':
                tiles.append((fid, img))
                thumb = Image.new('RGBA', (SIZE, SIZE), (246, 200, 166, 255))      # the creator's button picture
                thumb.alpha_composite(img)
                thumb.crop((200, 330, 824, 900)).resize((156, 142), Image.LANCZOS).convert('RGB').save(out / f'face_{fid}_thumb.jpg', quality=86)
    if sheet_path:      # a look sheet: each face on three skin tones, cropped to the features
        skins = [(246, 200, 166), (226, 176, 138), (190, 136, 100)]
        crop = (230, 300, 794, 640)
        cw, ch = crop[2] - crop[0], crop[3] - crop[1]
        sheet = Image.new('RGB', (cw * len(skins) // 2, ch * len(tiles) // 2), (255, 255, 255))
        for r, (fid, img) in enumerate(tiles):
            for c, sk in enumerate(skins):
                base = Image.new('RGBA', (SIZE, SIZE), sk + (255,))
                base.alpha_composite(img)
                sheet.paste(base.crop(crop).resize((cw // 2, ch // 2)), (c * cw // 2, r * ch // 2))
        sheet.save(sheet_path)


if __name__ == '__main__':
    main()
