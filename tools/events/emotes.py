"""Eight chat emotes in sticker style (round face, thick white border, soft shadow), 128 px PNG with transparency.
Run: python tools/events/emotes.py [out folder, default assets/ui] -> emote_1.png .. emote_8.png
1 happy, 2 love (heart eyes), 3 laugh (tears of joy), 4 wow, 5 sad (tear), 6 angry, 7 cool (sunglasses), 8 sleepy (Zzz).
Drawn at 4x and scaled down for smooth edges. Needs Pillow.
"""
import math, os, sys
from PIL import Image, ImageDraw, ImageFilter

OUT = sys.argv[1] if len(sys.argv) > 1 else "assets/ui"
K = 4
S = 128 * K
C = S // 2
R = int(S * .36)
YEL, YEL_D = (255, 210, 72), (236, 168, 40)
INK, RED, PINK, BLUE, WHITE = (60, 40, 30), (230, 70, 80), (255, 140, 160), (90, 170, 240), (255, 255, 255)


def face(fill=YEL, rim=YEL_D):
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    sh = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse((C - R - 14 * K // 2 + 3 * K, C - R - 14 * K // 2 + 6 * K, C + R + 7 * K + 3 * K, C + R + 7 * K + 6 * K), fill=(0, 0, 0, 90))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(4 * K)))
    d = ImageDraw.Draw(im)
    b = 7 * K     # white sticker border
    d.ellipse((C - R - b, C - R - b, C + R + b, C + R + b), fill=WHITE)
    d.ellipse((C - R, C - R, C + R, C + R), fill=rim)
    d.ellipse((C - R + 3 * K, C - R + 2 * K, C + R - 3 * K, C + R - 5 * K), fill=fill)
    d.ellipse((C - R * .55, C - R * .8, C - R * .15, C - R * .55), fill=(255, 240, 190))    # shine
    return im, d


def arc(d, cx, cy, w, h, a0, a1, width, col=INK):
    d.arc((cx - w, cy - h, cx + w, cy + h), a0, a1, fill=col, width=width)


def dot_eyes(d, dy=-.15, r=.09):
    for sx in (-1, 1):
        x, y = C + sx * R * .35, C + R * dy
        d.ellipse((x - R * r * .8, y - R * r * 1.2, x + R * r * .8, y + R * r * 1.2), fill=INK)
        d.ellipse((x - R * r * .3 + R * .02, y - R * r * .8, x + R * r * .1 + R * .02, y - R * r * .3), fill=WHITE)


def cheeks(d):
    for sx in (-1, 1):
        x, y = C + sx * R * .58, C + R * .18
        d.ellipse((x - R * .14, y - R * .08, x + R * .14, y + R * .08), fill=PINK)


def heart(d, x, y, s, col=RED):
    d.ellipse((x - s, y - s * .8, x, y + s * .2), fill=col)
    d.ellipse((x, y - s * .8, x + s, y + s * .2), fill=col)
    d.polygon([(x - s * .97, y - s * .15), (x + s * .97, y - s * .15), (x, y + s * 1.05)], fill=col)


def happy():
    im, d = face()
    dot_eyes(d)
    cheeks(d)
    arc(d, C, C + R * .12, R * .32, R * .28, 20, 160, 6 * K)
    return im


def love():
    im, d = face()
    for sx in (-1, 1):
        heart(d, C + sx * R * .35, C - R * .18, R * .2)
    cheeks(d)
    d.chord((C - R * .3, C + R * .0, C + R * .3, C + R * .5), 0, 180, fill=INK)
    d.ellipse((C - R * .14, C + R * .3, C + R * .14, C + R * .48), fill=(240, 110, 120))
    heart(d, C + R * .78, C - R * .72, R * .2, (255, 90, 120))
    return im


def laugh():
    im, d = face()
    for sx in (-1, 1):   # squeezed eyes ^ ^
        x, y = C + sx * R * .35, C - R * .15
        d.line([(x - R * .16, y + R * .05), (x, y - R * .1), (x + R * .16, y + R * .05)], fill=INK, width=6 * K, joint="curve")
        d.ellipse((x - R * .1 + sx * R * .2, y + R * .05, x + R * .1 + sx * R * .2, y + R * .3), fill=BLUE)   # tears of joy
    d.chord((C - R * .42, C - R * .05, C + R * .42, C + R * .62), 0, 180, fill=INK)
    d.chord((C - R * .25, C + R * .28, C + R * .25, C + R * .6), 180, 360, fill=(240, 110, 120))
    return im


def wow():
    im, d = face()
    for sx in (-1, 1):
        x, y = C + sx * R * .35, C - R * .2
        d.ellipse((x - R * .15, y - R * .17, x + R * .15, y + R * .17), fill=WHITE, outline=INK, width=4 * K)
        d.ellipse((x - R * .07, y - R * .08, x + R * .07, y + R * .08), fill=INK)
        arc(d, x, y - R * .38, R * .14, R * .08, 200, 340, 4 * K)
    d.ellipse((C - R * .14, C + R * .2, C + R * .14, C + R * .52), fill=INK)
    return im


def sad():
    im, d = face(fill=(250, 214, 110))
    dot_eyes(d, dy=-.1)
    for sx in (-1, 1):
        x, y = C + sx * R * .35, C - R * .38
        d.line([(x - sx * R * .15, y - R * .02), (x + sx * R * .12, y + R * .06)], fill=INK, width=4 * K)
    arc(d, C, C + R * .55, R * .28, R * .2, 200, 340, 6 * K)
    x, y = C + R * .42, C + R * .12      # tear
    d.polygon([(x, y - R * .14), (x - R * .09, y + R * .06), (x + R * .09, y + R * .06)], fill=BLUE)
    d.ellipse((x - R * .09, y - R * .02, x + R * .09, y + R * .16), fill=BLUE)
    return im


def angry():
    im, d = face(fill=(255, 140, 90), rim=(226, 90, 60))
    for sx in (-1, 1):
        x, y = C + sx * R * .35, C - R * .1
        d.ellipse((x - R * .08, y - R * .08, x + R * .08, y + R * .1), fill=INK)
        d.line([(x - sx * R * .2, y - R * .3), (x + sx * R * .12, y - R * .14)], fill=INK, width=6 * K)
    arc(d, C, C + R * .5, R * .25, R * .14, 200, 340, 6 * K)
    x, y = C + R * .6, C - R * .62      # cross-popping vein mark
    for a in (45, 135, 225, 315):
        ax, ay = math.cos(math.radians(a)), math.sin(math.radians(a))
        d.line([(x + ax * R * .05, y + ay * R * .05), (x + ax * R * .18, y + ay * R * .18)], fill=(200, 30, 40), width=5 * K)
    return im


def cool():
    im, d = face()
    d.rounded_rectangle((C - R * .68, C - R * .38, C - R * .05, C - R * .02), radius=R * .12, fill=INK)
    d.rounded_rectangle((C + R * .05, C - R * .38, C + R * .68, C - R * .02), radius=R * .12, fill=INK)
    d.line([(C - R * .1, C - R * .3), (C + R * .1, C - R * .3)], fill=INK, width=5 * K)
    d.line([(C - R * .6, C - R * .32), (C - R * .4, C - R * .32)], fill=(200, 200, 210), width=3 * K)
    d.line([(C + R * .14, C - R * .32), (C + R * .34, C - R * .32)], fill=(200, 200, 210), width=3 * K)
    arc(d, C + R * .05, C + R * .18, R * .3, R * .2, 10, 130, 6 * K)
    return im


def sleepy():
    im, d = face(fill=(255, 222, 130))
    for sx in (-1, 1):
        arc(d, C + sx * R * .35, C - R * .12, R * .14, R * .1, 20, 160, 5 * K)
    d.ellipse((C - R * .1, C + R * .3, C + R * .1, C + R * .48), fill=INK)
    d.ellipse((C + R * .14, C + R * .1, C + R * .36, C + R * .32), fill=(200, 230, 255), outline=(120, 180, 230), width=2 * K)  # bubble
    for k, (x, y, s) in enumerate(((.55, -.55, .22), (.78, -.85, .17), (.96, -1.08, .13))):   # Zzz
        x, y, s = C + R * x, C + R * y, R * s
        d.line([(x - s, y - s), (x + s, y - s), (x - s, y + s), (x + s, y + s)], fill=(90, 110, 200), width=max(3, int(s / 3.2)))
    return im


os.makedirs(OUT, exist_ok=True)
for i, fn in enumerate((happy, love, laugh, wow, sad, angry, cool, sleepy), 1):
    im = fn().resize((128, 128), Image.LANCZOS)
    im.save(os.path.join(OUT, f"emote_{i}.png"), optimize=True)
    print("emote", i, fn.__name__, os.path.getsize(os.path.join(OUT, f"emote_{i}.png")), "bytes")
