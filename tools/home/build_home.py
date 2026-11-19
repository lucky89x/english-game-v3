"""Warm low-poly furniture for the children's rooms, and a few garden pieces.
Run: OUT=<folder> blender -b -P tools/home/build_home.py   (optional ONLY=home_bed,yard_bench)
Conventions as tools/harbor/hlib.py: metres, base at Z=0, centred, front = Blender -Y = glTF +Z; wall pieces
(clock, picture) have their back on the wall side (+Y). <= 1,500 triangles each (piano and wardrobe <= 2,500).
Glowing parts: light_shade (desk lamp), light_lamp (garden lamp).
"""
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "harbor"))
from hlib import *  # noqa
import bpy
from mathutils import Vector

ONLY = [s for s in os.environ.get("ONLY", "").split(",") if s]


def W():  # shared warm palette
    return dict(wood=mat("wood_warm", "#B57A48", rough=.65), wood2=mat("wood_dark", "#7A4E2C", rough=.7),
                wood3=mat("wood_light", "#D9AD78", rough=.65), cream=mat("fabric_cream", "#F3E7CC", rough=.9),
                brass=mat("brass", "#C9A548", rough=.35, metal=.7), white=mat("paint_white", "#F7F4EE", rough=.6),
                black=mat("piano_black", "#1E1C22", rough=.25))


def legs4(x, y, h, w, m, z0=0.0, taper=None):
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl(w / 2, h, (sx * x, sy * y, z0 + h / 2), m, 8, r2=taper)


def done(name, fname=None):
    group(name)
    export(fname or ("home_%s_v01" % name))


def bed():
    p = W()
    quilt, quilt2 = mat("quilt_blue", "#6E9BD6", rough=.9), mat("quilt_blue_light", "#A9C8F0", rough=.9)
    X, Y = 1.4, 2.0
    box((X, Y, .22), (0, 0, .33), p["wood"], bev=.02)                         # frame
    legs4(X / 2 - .06, Y / 2 - .06, .22, .09, p["wood2"])
    box((X + .06, .08, .95), (0, Y / 2, .55), p["wood"], bev=.02)             # headboard
    box((X + .1, .1, .06), (0, Y / 2, 1.04), p["wood2"], bev=.015)
    for k in range(4):
        box((.18, .02, .45), (-.45 + k * .3, Y / 2 - .045, .62), p["wood3"], bev=.01)
    box((X + .06, .08, .5), (0, -Y / 2, .35), p["wood"], bev=.02)             # footboard
    box((X - .06, Y - .1, .2), (0, 0, .54), p["white"], bev=.04)              # mattress
    box((X - .02, Y * .66, .08), (0, -Y * .16, .66), quilt, bev=.03)          # duvet
    box((X - .02, .32, .1), (0, .23, .67), quilt2, bev=.04)                   # folded top edge
    for k in range(5):
        box((.04, Y * .6, .085), (-.5 + k * .25, -Y * .16, .665), quilt2, bev=.01)
    for sx in (-1, 1):
        ball(.3, (sx * .32, Y / 2 - .3, .7), p["cream"], uv=(10, 6), scale=(1, .55, .28))
    done("bed")


def wardrobe():
    p = W()
    X, Y, H = 1.2, .6, 1.9
    box((X, Y, H - .1), (0, 0, .1 + (H - .1) / 2), p["wood"], bev=.02)
    box((X + .08, Y + .06, .08), (0, 0, H - .02), p["wood2"], bev=.02)        # crown
    box((X + .04, Y + .03, .05), (0, 0, H - .08), p["wood3"], bev=.01)
    legs4(X / 2 - .07, Y / 2 - .07, .1, .08, p["wood2"])
    for sx in (-1, 1):                                                        # two doors with raised panels
        x = sx * X / 4
        box((X / 2 - .03, .03, 1.3), (x, -Y / 2 - .01, 1.12), p["wood"], bev=.012)
        box((X / 2 - .15, .025, .55), (x, -Y / 2 - .03, 1.42), p["wood3"], bev=.012)
        box((X / 2 - .15, .025, .5), (x, -Y / 2 - .03, .8), p["wood3"], bev=.012)
        ball(.025, (sx * .05, -Y / 2 - .05, 1.12), p["brass"], uv=(8, 5))
    box((X - .06, .03, .26), (0, -Y / 2 - .01, .27), p["wood"], bev=.012)     # drawer
    box((.16, .03, .03), (0, -Y / 2 - .04, .29), p["brass"], bev=.006)
    done("wardrobe")


def mirror():
    p = W()
    glass = mat("mirror", "#CFE3EC", rough=.03, metal=1.0)
    box((.62, .06, 1.62), (0, 0, .95), p["wood"], bev=.02)
    box((.5, .02, 1.5), (0, -.035, .95), glass)
    box((.7, .08, .08), (0, 0, 1.78), p["wood2"], bev=.02)
    ball(.04, (0, 0, 1.86), p["brass"], uv=(8, 5))
    for sx in (-1, 1):                                                        # A-frame stand
        beam((sx * .34, .05, 1.2), (sx * .36, .4, 0), .05, p["wood2"])
        beam((sx * .34, 0, .15), (sx * .36, -.18, 0), .05, p["wood2"])
    beam((-.36, .3, .25), (.36, .3, .25), .035, p["wood2"])
    done("mirror")


def table_chairs():
    p = W()
    seat = mat("cushion_green", "#7DB46A", rough=.9)
    box((1.2, .8, .05), (0, 0, .73), p["wood"], bev=.015)
    box((1.08, .68, .08), (0, 0, .67), p["wood2"])
    legs4(.52, .32, .7, .07, p["wood2"], taper=.03)
    group("table", keep_loc=True)
    for i, (x, y, rz) in enumerate(((-.3, -.62, 0), (.3, -.62, 0), (-.3, .62, math.pi), (.3, .62, math.pi))):
        c, s = math.cos(rz), math.sin(rz)

        def at(px, py, pz):
            return (x + px * c - py * s, y + px * s + py * c, pz)
        for px, py in ((-.18, -.18), (.18, -.18), (-.18, .18), (.18, .18)):
            cyl(.022, .45, at(px, py, .225), p["wood2"], 6)
        box((.42, .42, .04), at(0, 0, .46), p["wood"], rot=(0, 0, rz), bev=.012)
        box((.38, .38, .04), at(0, 0, .49), seat, rot=(0, 0, rz), bev=.015)
        for px in (-.18, .18):
            cyl(.02, .45, at(px, -.2, .7), p["wood2"], 6)
        box((.42, .035, .16), at(0, -.2, .86), p["wood"], rot=(0, 0, rz), bev=.01)
        group("chair_%d" % (i + 1), keep_loc=True)
    export("home_table_chairs_v01")


def sofa():
    p = W()
    fab, fab2 = mat("sofa_coral", "#E9876E", rough=.95), mat("sofa_coral_dark", "#C9674F", rough=.95)
    pil1, pil2 = mat("pillow_yellow", "#F2C84B", rough=.9), mat("pillow_teal", "#5BB3A8", rough=.9)
    box((1.8, .85, .3), (0, 0, .3), fab2, bev=.05)                            # base
    box((1.8, .22, .55), (0, .32, .67), fab, bev=.07)                         # back
    for sx in (-1, 1):
        box((.2, .85, .55), (sx * .8, 0, .43), fab, bev=.07)                  # arms
    for k in range(3):
        box((.46, .62, .16), (-.48 + k * .48, -.08, .52), fab, bev=.06)       # seat cushions
    ball(.2, (-.55, .15, .72), pil1, uv=(10, 6), scale=(1, .45, 1), rot=(.2, 0, .25))
    ball(.2, (.55, .15, .72), pil2, uv=(10, 6), scale=(1, .45, 1), rot=(.2, 0, -.25))
    legs4(.82, .36, .15, .06, p["wood2"], taper=.02)
    done("sofa")


def lamp():
    p = W()
    shade = mat("light_shade", "#FFE2A8", emit=2.0, rough=.9)
    lathe([(0, 0), (.12, 0), (.12, .03), (.09, .05), (0, .05)], p["brass"], seg=16)
    cyl(.012, .35, (0, 0, .22), p["brass"], 8)
    ball(.06, (0, 0, .2), mat("lamp_base_teal", "#4FA3A0", rough=.4), uv=(12, 8), scale=(1, 1, 1.2))
    lathe([(.16, .36), (.17, .37), (.1, .58), (.09, .57)], shade, seg=16)
    ball(.04, (0, 0, .45), mat("light_bulb", "#FFF6D8", emit=4.0), uv=(8, 5))
    done("lamp")


def bookcase():
    p = W()
    X, Y, H = 1.0, .32, 1.8
    for sx in (-1, 1):
        box((.04, Y, H), (sx * (X / 2 - .02), 0, H / 2), p["wood"], bev=.01)
    box((X, .02, H), (0, Y / 2 - .01, H / 2), p["wood2"])
    shelves = [.05, .48, .9, 1.32, 1.76]
    for z in shelves:
        box((X, Y, .03), (0, 0, z), p["wood"], bev=.008)
    cols = ["#D9534F", "#F0AD4E", "#5CB85C", "#5B9BD5", "#9B6FCF", "#F27DA8", "#3F8E8C", "#E2C04A", "#8C5A3C", "#F4F0E6"]
    rnd = random.Random(4)
    for si, z in enumerate(shelves[:-1]):
        x = -X / 2 + .06
        while x < X / 2 - .1:
            h = rnd.uniform(.24, .36)
            t = rnd.uniform(.035, .06)
            if rnd.random() < .12 and x < X / 2 - .3:     # a leaning book
                box((t, .22, h), (x + .06, -.02, z + .015 + h / 2 * .97), mat("book%d" % rnd.randrange(10), "#" + cols[rnd.randrange(10)][1:]),
                    rot=(0, .3, 0))
                x += .16
                continue
            m = mat("book_%s" % cols[rnd.randrange(10)][1:], cols[rnd.randrange(10)], rough=.7)
            box((t, .22 + rnd.uniform(-.02, .02), h), (x + t / 2, -.02, z + .015 + h / 2), m)
            x += t + .004
    done("bookcase")


def desk():
    p = W()
    box((1.2, .6, .04), (0, 0, .74), p["wood3"], bev=.012)
    box((.4, .55, .7), (.38, 0, .37), p["wood"], bev=.015)                    # drawer pedestal
    for k in range(3):
        box((.36, .03, .18), (.38, -.29, .17 + k * .22), p["wood3"], bev=.01)
        box((.1, .02, .02), (.38, -.315, .2 + k * .22), p["brass"])
    for sx, sy in ((-1, -1), (-1, 1)):
        cyl(.025, .72, (sx * .55, sy * .25, .36), p["wood2"], 8)
    beam((-.55, -.25, .2), (-.55, .25, .2), .03, p["wood2"])
    box((.22, .16, .04), (-.25, .05, .78), mat("book_red", "#D9534F"), rot=(0, 0, .2))
    cyl(.04, .1, (-.45, .15, .81), mat("cup_teal", "#4FA3A0"), 10)
    for k in range(3):
        cyl(.006, .14, (-.45 + .01 * k, .15, .89), mat("pencil_yellow", "#F2C84B"), 6, rot=(.1 * (k - 1), .1, 0))
    done("desk")


def clock():
    p = W()
    lathe([(0, 0), (.2, 0), (.2, .05), (.18, .06), (0, .06)], p["wood"], seg=24, loc=(0, 0, 0))
    o = OBJS[-1]
    o.rotation_euler = (math.pi / 2, 0, 0)                                   # face looks along -Y
    cyl(.17, .01, (0, -.062, 0), p["cream"], 24, rot=(math.pi / 2, 0, 0))
    for k in range(12):
        a = k * math.pi / 6
        r = .145
        box((.012, .006, .03 if k % 3 else .045), (r * math.sin(a), -.07, r * math.cos(a)), p["wood2"], rot=(0, -a, 0))
    box((.012, .006, .09), (.025, -.074, .035), p["wood2"], rot=(0, -.7, 0))   # hour hand
    box((.008, .006, .13), (-.04, -.076, .055), p["wood2"], rot=(0, .6, 0))    # minute hand
    ball(.012, (0, -.078, 0), p["brass"], uv=(6, 4))
    done("clock")


def picture():
    p = W()
    sea, sky, sun, sand = mat("paint_sea", "#3E8FCF"), mat("paint_sky", "#BFE3F7"), mat("paint_sun", "#F7C948"), mat("paint_sand", "#F0D9A6")
    box((.7, .04, .52), (0, 0, .26), p["wood2"], bev=.015)
    box((.6, .01, .42), (0, -.021, .26), sky)
    box((.6, .012, .16), (0, -.025, .13), sea)
    box((.6, .014, .05), (0, -.028, .075), sand)
    cyl(.05, .01, (.16, -.026, .38), sun, 16, rot=(math.pi / 2, 0, 0))
    for k in range(3):  # little sailboat
        pass
    cone = cyl(.05, .1, (-.12, -.03, .26), mat("paint_white", "#F7F4EE"), 3, r2=.0, rot=(math.pi / 2, 0, 0), scale=(1, 1, .2))
    box((.12, .012, .02), (-.12, -.03, .205), p["wood"])
    done("picture")


def rug():
    cols = [mat("rug_cream", "#F3E7CC", rough=1), mat("rug_terracotta", "#D9785A", rough=1), mat("rug_teal", "#5BB3A8", rough=1),
            mat("rug_yellow", "#F2C84B", rough=1)]
    prof, mats_ = [(0, .012)], []
    rings = [(.18, 3), (.4, 1), (.52, 0), (.66, 2), (.78, 1), (.9, 0)]
    for r, mi in rings:
        prof.append((r, .012))
        mats_.append(mi)
    prof += [(.9, 0)]
    mats_ += [0]
    lathe(prof, cols, seg=32, mats=mats_)
    for k in range(32):  # fringe
        a = k / 32 * 2 * math.pi
        box((.012, .05, .004), (.92 * math.cos(a), .92 * math.sin(a), .004), cols[0], rot=(0, 0, a + math.pi / 2))
    done("rug")


def plant():
    pot, soil = mat("pot_terracotta", "#C46A43", rough=.85), mat("soil", "#5A3A24", rough=1)
    leaf, leaf2 = mat("leaf", "#4FA046", rough=.75), mat("leaf_dark", "#3A8A33", rough=.75)
    lathe([(0, 0), (.16, 0), (.2, .32), (.23, .33), (.23, .38), (0, .38)], pot, seg=16)
    cyl(.2, .02, (0, 0, .37), soil, 16)
    rnd = random.Random(2)
    for k in range(11):  # broad leaves arching out of the pot on short stalks
        a = k / 11 * 2 * math.pi + rnd.uniform(-.2, .2)
        h = rnd.uniform(.22, .5) if k % 3 else rnd.uniform(.5, .62)
        out = .1 + .18 * (1 - h)
        base = Vector((0, 0, .36))
        tip = Vector((out * math.cos(a), out * math.sin(a), .36 + h))
        rod(tuple(base), tuple(tip), .012, .008, leaf2, 5)
        c = tip + Vector((.12 * math.cos(a), .12 * math.sin(a), -.02))
        ball(.17, tuple(c), leaf if k % 2 else leaf2, uv=(10, 4), scale=(1, .55, .14),
             rot=(rnd.uniform(.35, .7), 0, a + math.pi / 2))
    done("plant")


def guitar():
    p = W()
    body, top, dark = mat("guitar_body", "#B5612E", rough=.4), mat("guitar_top", "#E7B979", rough=.45), mat("guitar_dark", "#3A2A22", rough=.5)
    for z, r in ((.32, .19), (.62, .145)):     # two bouts
        cyl(r, .1, (0, 0, z), body, 20, rot=(math.pi / 2, 0, 0))
        cyl(r - .01, .012, (0, -.051, z), top, 20, rot=(math.pi / 2, 0, 0))
    cyl(.05, .014, (0, -.056, .55), dark, 16, rot=(math.pi / 2, 0, 0))       # sound hole
    box((.1, .02, .02), (0, -.06, .26), dark)                                 # bridge
    box((.05, .04, .5), (0, -.03, 1.0), p["wood2"])                           # neck
    box((.08, .03, .14), (0, -.02, 1.32), dark, rot=(.15, 0, 0))              # head
    for k in range(6):
        x = -.015 + k * .006
        beam((x, -.065, .26), (x, -.055, 1.24), .002, mat("string_steel", "#D8D8D8", metal=.9, rough=.3))
        cyl(.008, .03, ((-1 if k < 3 else 1) * .055, -.02, 1.28 + (k % 3) * .04), p["brass"], 6, rot=(0, math.pi / 2, 0))
    # stand
    for sx in (-1, 1):
        beam((sx * .15, -.15, 0), (sx * .05, .08, .22), .025, dark)
    beam((0, .2, 0), (0, .06, .75), .025, dark)
    done("guitar")


def piano():
    p = W()
    blk, white = p["black"], mat("key_white", "#F7F5EE", rough=.4)
    X, Y, H = 1.5, .6, 1.25
    box((X, Y * .62, H), (0, .1, H / 2), blk, bev=.02)                       # case
    box((X, Y, .06), (0, 0, .74), blk, bev=.01)                              # key bed
    for sx in (-1, 1):
        box((.06, Y, .78), (sx * (X / 2 - .03), -.0, .39), blk, bev=.015)    # cheeks
        cyl(.03, .65, (sx * (X / 2 - .1), -.24, .33), blk, 8)                # front legs
    box((X - .14, .17, .025), (0, -.2, .785), white)                          # white keys
    for k in range(29):
        box((.002, .17, .026), (-(X - .14) / 2 + (k + 1) * (X - .14) / 30, -.2, .787), mat("key_gap", "#BDBAB2"))
    nk = 0
    for k in range(29):                                                       # black keys (2-3 pattern)
        if k % 7 in (0, 1, 3, 4, 5):
            x = -(X - .14) / 2 + (k + 1) * (X - .14) / 30
            box((.013, .1, .02), (x, -.165, .805), blk)
            nk += 1
    box((X - .12, .05, .16), (0, -.05, .9), blk, rot=(-.3, 0, 0))            # music desk
    box((.3, .02, .2), (0, -.07, .99), p["cream"], rot=(-.3, 0, 0))           # sheet music
    for sx in (-1, 1):
        cyl(.012, .05, (sx * .08, -.18, .07), p["brass"], 6, rot=(math.pi / 2, 0, 0))   # pedals
    group("piano", keep_loc=True)
    box((.8, .35, .06), (0, -.75, .5), blk, bev=.015)
    box((.76, .31, .05), (0, -.75, .55), mat("bench_cushion", "#8C3A44", rough=.9), bev=.02)
    legs4(.36, .14, .47, .045, blk)
    group("piano_bench", keep_loc=True)
    export("home_piano_v01")


def drum():
    p = W()
    shell, skin, chrome = mat("drum_red", "#C8343A", rough=.35), mat("drum_skin", "#F4F0E2", rough=.7), mat("chrome", "#B9BEC4", rough=.2, metal=.9)
    gold = mat("cymbal_gold", "#D8B24A", rough=.3, metal=.85)
    cyl(.28, .36, (0, .1, .3), shell, 20, rot=(math.pi / 2, 0, 0))            # bass drum
    cyl(.26, .02, (0, -.09, .3), skin, 20, rot=(math.pi / 2, 0, 0))
    for y in (-.08, .28):
        torus(.28, .012, (0, y, .3), chrome, 20, 4, rot=(math.pi / 2, 0, 0))
    lathe([(0, 0), (.16, 0), (.16, .14), (0, .14)], [shell], seg=16, loc=(.42, -.15, .52))
    cyl(.155, .01, (.42, -.15, .665), skin, 16)
    lathe([(0, 0), (.13, 0), (.13, .12), (0, .12)], [shell], seg=16, loc=(-.2, -.02, .7))
    cyl(.125, .01, (-.2, -.02, .825), skin, 16)
    for (x, y, h) in ((.42, -.15, .52), (-.2, -.02, .7)):
        cyl(.01, h, (x, y + .1, h / 2), chrome, 6)
    cyl(.012, 1.0, (-.5, .1, .5), chrome, 6)
    cyl(.22, .01, (-.5, .1, 1.0), gold, 16, r2=.02, rot=(.15, .1, 0))         # cymbal
    for k in range(3):
        a = k * 2.1
        beam((-.5, .1, .3), (-.5 + .2 * math.cos(a), .1 + .2 * math.sin(a), 0), .015, chrome)
    cyl(.16, .06, (.05, .45, .5), mat("stool_black", "#2A2A30"), 14)          # stool
    cyl(.02, .47, (.05, .45, .235), chrome, 6)
    for k in range(2):
        beam((.3 + k * .04, -.4, .7), (.42 + k * .06, -.2, .7), .012, p["wood3"])   # sticks on the snare
    done("drum")


def violin():
    p = W()
    body, top, dark = mat("violin_body", "#A64B1E", rough=.35), mat("violin_top", "#C8662A", rough=.35), mat("violin_dark", "#1E1A18", rough=.4)
    for z, r in ((.28, .1), (.47, .085)):
        cyl(r, .045, (0, 0, z), body, 18, rot=(math.pi / 2, 0, 0), scale=(1, 1.2, 1))
    cyl(.05, .045, (0, 0, .375), body, 12, rot=(math.pi / 2, 0, 0))
    for sx in (-1, 1):
        box((.006, .01, .06), (sx * .03, -.025, .38), dark, rot=(0, sx * .2, 0))   # f-holes
    box((.03, .025, .3), (0, -.015, .62), dark)                                # fingerboard + neck
    ball(.025, (0, -.0, .8), body, uv=(8, 5), scale=(.8, .8, 1.1))             # scroll
    box((.04, .02, .06), (0, -.01, .76), body)
    box((.06, .012, .02), (0, -.03, .3), mat("violin_bridge", "#E8D2A8"))
    box((.035, .015, .1), (0, -.025, .2), dark)                                # tailpiece
    for sx in (-1, 1):                                                         # stand
        beam((sx * .12, -.12, 0), (0, .05, .2), .02, p["wood2"])
    beam((0, .2, 0), (0, .04, .5), .02, p["wood2"])
    beam((.18, -.08, .02), (.14, .02, .9), .012, p["wood2"])                   # bow leaning beside
    beam((.175, -.09, .03), (.135, .01, .89), .006, mat("bow_hair", "#F4F0E2"))
    done("violin")


# ------------------------------------------------------------------ yard
def flowerbed():
    p = W()
    stone = mat("stone", "#A7A39A", rough=.95)
    soil = mat("soil", "#5A3A24", rough=1)
    leaf = mat("leaf", "#4FA046", rough=.75)
    cols = [mat("flower_red", "#E5484D"), mat("flower_yellow", "#F5C842"), mat("flower_pink", "#F28AB3"),
            mat("flower_purple", "#9B6FCF"), mat("flower_white", "#FAF7F0")]
    box((2.0, .8, .3), (0, 0, .15), stone, bev=.04)
    box((1.86, .66, .05), (0, 0, .29), soil)
    rnd = random.Random(8)
    for k in range(10):
        x, y = -.81 + k * .18 + rnd.uniform(-.04, .04), rnd.uniform(-.22, .22)
        h = rnd.uniform(.12, .3)
        cyl(.012, h, (x, y, .31 + h / 2), leaf, 4)
        ball(.07, (x, y, .3 + .04), leaf, sub=1, scale=(1, 1, .5))
        c = cols[k % 5]
        for j in range(4):
            a = j * 2 * math.pi / 4
            ball(.035, (x + .03 * math.cos(a), y + .03 * math.sin(a), .31 + h), c, sub=1, scale=(1, 1, .5))
        ball(.018, (x, y, .32 + h), cols[1] if k % 5 != 1 else cols[4], sub=1)
    done("flowerbed", "yard_flowerbed_v01")


def yard_bench():
    p = W()
    paint = mat("bench_green", "#5E9C6A", rough=.6)
    for sx in (-1, 1):
        x = sx * .68
        beam((x, -.2, 0), (x, -.18, .42), .06, p["wood2"])
        beam((x, .2, 0), (x, .2, .85), .06, p["wood2"])
        beam((x, -.24, .42), (x, .22, .42), .05, p["wood2"])
        beam((x, -.22, .62), (x, .2, .62), .05, p["wood2"])
        beam((x, -.2, .42), (x, -.22, .62), .045, p["wood2"])
    for y in (-.16, -.04, .08):
        box((1.5, .1, .035), (0, y, .46), paint, bev=.01)
    for z in (.6, .75):
        box((1.5, .03, .1), (0, .21, z), paint, rot=(-.15, 0, 0), bev=.01)
    done("bench", "yard_bench_v01")


def mailbox():
    p = W()
    blue, red = mat("mailbox_blue", "#3F6FC6", rough=.5), mat("flag_red", "#D8322E", rough=.6)
    box((.09, .09, 1.05), (0, 0, .525), p["wood2"], bev=.01)
    box((.2, .45, .2), (0, 0, 1.12), blue, bev=.02)
    cyl(.1, .45, (0, 0, 1.22), blue, 12, rot=(math.pi / 2, 0, 0))
    box((.2, .02, .28), (0, -.235, 1.15), blue, bev=.01)                      # door
    ball(.02, (0, -.25, 1.2), p["brass"], uv=(6, 4))
    box((.015, .03, .25), (.11, .1, 1.3), red)                                # flag
    box((.015, .1, .06), (.11, .14, 1.4), red)
    box((.18, .02, .05), (0, -.23, 1.0), p["white"])
    done("mailbox", "yard_mailbox_v01")


def garden_lamp():
    p = W()
    iron = mat("cast_iron", "#2E3A36", rough=.55, metal=.35)
    glow = mat("light_lamp", "#FFE3A0", emit=4.0)
    glass = mat("glass", "#E8F4F6", rough=.05, alpha=.4)
    lathe([(0, 0), (.12, 0), (.12, .05), (.07, .1), (.05, .3), (0, .3)], iron, seg=10)
    cyl(.03, .7, (0, 0, .62), iron, 8)
    box((.18, .18, .03), (0, 0, .98), iron, bev=.01)
    cyl(.1, .22, (0, 0, 1.1), glass, 6, cap=False)
    for k in range(6):
        a = k * math.pi / 3
        beam((.1 * math.cos(a), .1 * math.sin(a), .99), (.1 * math.cos(a), .1 * math.sin(a), 1.21), .015, iron)
    ball(.06, (0, 0, 1.1), glow, uv=(8, 5))
    cyl(.15, .12, (0, 0, 1.27), iron, 6, r2=.02)
    ball(.025, (0, 0, 1.35), p["brass"], uv=(6, 4))
    done("garden_lamp", "yard_garden_lamp_v01")


BUILDERS = {"home_bed": bed, "home_wardrobe": wardrobe, "home_mirror": mirror, "home_table_chairs": table_chairs,
            "home_sofa": sofa, "home_lamp": lamp, "home_bookcase": bookcase, "home_desk": desk, "home_clock": clock,
            "home_picture": picture, "home_rug": rug, "home_plant": plant, "home_guitar": guitar, "home_piano": piano,
            "home_drum": drum, "home_violin": violin, "yard_flowerbed": flowerbed, "yard_bench": yard_bench,
            "yard_mailbox": mailbox, "yard_garden_lamp": garden_lamp}
for n, f in BUILDERS.items():
    if ONLY and n not in ONLY:
        continue
    reset()
    f()
