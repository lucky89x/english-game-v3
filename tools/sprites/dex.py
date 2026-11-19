# Sea Dex icons: 18 little creatures rendered as 256 px PNGs with a transparent background, 3/4 view from above,
# soft light like the candy set (tools/sprites/candy.py), bright colours and a thin dark outline (Freestyle).
#   blender -b -P tools/sprites/dex.py [-- id,id]      -> assets/ui/dex_<id>.png  (Cycles on the CPU)
# Each PNG is squeezed to <= 40 KB with a 256-colour palette. That step needs Pillow: inside Blender it is used when
# importable (e.g. PYTHONPATH=<dir with PIL> blender --python-use-system-env -b -P ...); otherwise run
#   python tools/sprites/dex.py --pack          (plain Python with Pillow) to compress the rendered files afterwards.
import math, os, sys

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'ui')
IDS = ['sardine', 'anchovy', 'mackerel', 'squid', 'shrimp', 'salmon', 'tuna', 'lobster', 'pufferfish', 'seahorse',
       'swordfish', 'starfish', 'dolphin', 'turtle', 'crab', 'jelly', 'pirate', 'octopus']
LIMIT = 40 * 1024


def pack(path):
    from PIL import Image
    im = Image.open(path).convert('RGBA')
    for colors in (256, 160, 96, 64):
        q = im.quantize(colors=colors, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
        q.save(path, optimize=True)
        if os.path.getsize(path) <= LIMIT:
            break
    return os.path.getsize(path)


if __name__ == '__main__' and '--pack' in sys.argv:
    for i in IDS:
        p = os.path.join(OUT, f'dex_{i}.png')
        if os.path.exists(p):
            print(i, pack(p), 'bytes')
    raise SystemExit(0)

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

LINE = (0.13, 0.08, 0.12)


def hexc(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in c)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = 40
    sc.cycles.use_denoising = True
    sc.render.resolution_x = sc.render.resolution_y = 256
    sc.render.film_transparent = True
    sc.render.image_settings.color_mode = 'RGBA'
    sc.render.image_settings.compression = 100
    sc.view_settings.view_transform = 'Standard'
    w = bpy.data.worlds.new('w')
    sc.world = w
    w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND')
    bg.inputs[0].default_value = (0.9, 0.92, 1.0, 1)
    bg.inputs[1].default_value = 0.75
    for loc, en in [((-3, -4, 5), 1100), ((5, -2, 2), 300), ((0, 4, 4), 350)]:     # key, fill, rim (candy set)
        l = bpy.data.objects.new('l', bpy.data.lights.new('l', 'POINT'))
        l.data.energy = en
        l.data.shadow_soft_size = 1.5
        l.location = loc
        sc.collection.objects.link(l)
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = 'ABSOLUTE'
    sc.render.line_thickness = 1.25
    ls = bpy.context.view_layer.freestyle_settings.linesets[0]
    ls.select_by_visibility = True
    ls.select_silhouette, ls.select_border, ls.select_crease = True, True, False
    if ls.linestyle is None:
        ls.linestyle = bpy.data.linestyles.new('line')
    ls.linestyle.color = LINE
    ls.linestyle.thickness = 1.25


MATS = {}


def mat(h, rough=.35, coat=.5, emit=0.0):
    key = (h, rough, coat, emit)
    if key in MATS:
        return MATS[key]
    m = bpy.data.materials.new(h)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = (*hexc(h), 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Coat Weight'].default_value = coat
    b.inputs['Coat Roughness'].default_value = .08
    b.inputs['Subsurface Weight'].default_value = .12
    if emit:
        b.inputs['Emission Color'].default_value = (*hexc(h), 1)
        b.inputs['Emission Strength'].default_value = emit
    MATS[key] = m
    return m


def _done(o, m, smooth=True, sub=0):
    o.data.materials.append(m)
    if smooth:
        for p in o.data.polygons:
            p.use_smooth = True
    if sub:
        md = o.modifiers.new('s', 'SUBSURF')
        md.levels = md.render_levels = sub
    return o


def sph(loc, scale, m, rot=(0, 0, 0), seg=24, sub=0):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=seg, ring_count=seg // 2, location=loc, rotation=rot)
    o = bpy.context.object
    o.scale = scale
    return _done(o, m, sub=sub)


def cone(loc, r1, r2, depth, m, rot=(0, 0, 0), scale=(1, 1, 1), verts=16, smooth=True):
    bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=depth, vertices=verts, location=loc, rotation=rot)
    o = bpy.context.object
    o.scale = scale
    return _done(o, m, smooth)


def tube(pts, r0, r1, m, res=4):
    cu = bpy.data.curves.new('t', 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = 1
    cu.bevel_resolution = res
    cu.use_fill_caps = True
    sp = cu.splines.new('NURBS')
    sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        sp.points[i].co = (*p, 1)
        sp.points[i].radius = r0 + (r1 - r0) * i / (len(pts) - 1)
    sp.use_endpoint_u = True
    sp.order_u = 3
    o = bpy.data.objects.new('t', cu)
    bpy.context.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o
    for x in bpy.context.view_layer.objects:
        x.select_set(x == o)
    bpy.ops.object.convert(target='MESH')
    o = bpy.context.object
    return _done(o, m)


def eye(loc, r, out, pupil='1b1b22', look=Vector((0, -1, .3))):
    """white eyeball, dark pupil pushed out along `out`, small highlight"""
    out = Vector(out).normalized()
    sph(loc, (r, r, r), mat('ffffff', .2, .8))
    p = Vector(loc) + (out * .55 + look.normalized() * .25).normalized() * r * .62
    sph(p, (r * .6, r * .6, r * .6), mat(pupil, .15, 1))
    sph(p + out * r * .45 + Vector((0, 0, r * .25)), (r * .2, r * .2, r * .2), mat('ffffff', .1, 0, 2))


def split_by(o, test, m2):
    """second material on the faces whose world centre passes test(centre)"""
    o.data.materials.append(m2)
    mw = o.matrix_world
    bpy.context.view_layer.update()
    for p in o.data.polygons:
        if test(o.matrix_world @ p.center):
            p.material_index = 1


def body(L, W, H, back, belly, taper=.7, nose=.15, loc=(0, 0, 0)):
    """fish body along X, head at -X: a sphere tapered towards the tail; belly colour below the side line"""
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=32, ring_count=16, location=loc)
    o = bpy.context.object
    for v in o.data.vertices:
        x = v.co.x
        t = max(0.0, x) ** 1.4 * taper + (max(0.0, -x) ** 3) * nose
        v.co = Vector((x * L / 2, v.co.y * W / 2 * (1 - t), v.co.z * H / 2 * (1 - t * .9)))
    _done(o, mat(back))
    split_by(o, lambda c: c.z < loc[2] - H * .05, mat(belly, .3, .6))
    return o


def fin(loc, size, m, rot=(0, 0, 0)):
    """thin rounded fin: a flattened cone"""
    return cone(loc, size[0], 0.02, size[1], m, rot=rot, scale=(1, .18, 1), verts=12)


def tail(x, z, h, m, fork=.55, ang=.55):
    for s in (-1, 1):
        cone((x + h * .45, 0, z + s * h * fork * .55), h * .32, .02, h * 1.0, m, rot=(0, math.pi / 2 - s * ang, 0),
             scale=(1, .22, 1), verts=12)


def fish(L, W, H, back, belly, finc, spots=None, bars=None, stripe=None, bill=0, dorsal=1.0, finlets=None, fork=.55):
    b = body(L, W, H, back, belly)
    tail(L / 2 - .05, 0, H * .62, mat(finc), fork)
    cone((-.05 * L, 0, H * .5), H * .22 * dorsal, .02, H * .55 * dorsal, mat(finc), rot=(0, .5, 0), scale=(1.4, .18, 1), verts=12)
    for s in (-1, 1):
        sph((-L * .18, s * W * .46, -H * .12), (H * .2, .02, H * .09), mat(finc), rot=(0, .5, s * .3))
        eye((-L * .31, s * W * .3, H * .1), H * .14, (0, s, .1))
        if spots:
            for k, (sx, sz) in enumerate(spots):
                sph((sx * L, s * W * .44 * (1 - max(0, sx * 2) ** 1.4 * .6), sz * H), (H * .055, .015, H * .055), mat('2a3550', .3, .5))
        if bars:
            for k in range(bars):
                x = -L * .15 + k * L * .55 / bars
                tube([(x, s * W * .4, H * .38), (x + .05, s * W * .48, H * .18), (x - .02, s * W * .5, .0)], .025, .015, mat('1e2a3a'))
        if stripe:
            tube([(-L * .3, s * W * .5, 0), (0, s * W * .52, -.0), (L * .32, s * W * .28, 0)], .03, .015, mat(stripe, .2, .8))
    if bill:
        cone((-L / 2 - bill / 2 + .05, 0, H * .05), H * .1, .01, bill, mat(back), rot=(0, -math.pi / 2, 0))
    if finlets:
        for k in range(4):
            cone((L * .18 + k * L * .06, 0, H * .3 - k * .02), .04, .0, .1, mat(finlets), rot=(0, .3, 0), scale=(1, .4, 1), verts=8)
            cone((L * .18 + k * L * .06, 0, -H * .3 + k * .02), .04, .0, .1, mat(finlets), rot=(0, math.pi - .3, 0), scale=(1, .4, 1), verts=8)
    sph((-L / 2 + .02, 0, -H * .04), (.05, W * .16, .025), mat('7a3040', .4, .3))     # mouth
    return b


# ------------------------------------------------------------------ the 18 creatures
def sardine():
    fish(1.9, .45, .55, '4f86c6', 'e6edf5', '8fb6dd', spots=[(-.12, .08), (-.02, .06), (.08, .04), (.17, .03)])


def anchovy():
    fish(2.0, .34, .4, '3f9a95', 'eef3f2', '7fc4bd', stripe='d8e4ea')


def mackerel():
    fish(1.95, .5, .6, '2f8a7a', 'f0f2ec', '6aa69a', bars=5)


def salmon():
    fish(2.0, .55, .7, 'e7836f', 'f8dcd0', 'f0a08c', spots=[(-.1, .2), (0, .25), (.1, .18), (.05, .1), (-.05, .12), (.15, .14)])


def tuna():
    fish(2.0, .65, .82, '25407a', 'd9e2ec', '3a5aa0', finlets='f5c832', fork=.8)


def swordfish():
    fish(1.7, .45, .55, '5a5ec0', 'dfe3f2', '7a7fd6', bill=.75, dorsal=1.8, fork=.85)


def pufferfish():
    y, br = mat('f5c84a'), mat('a8742e')
    sph((0, 0, 0), (.78, .74, .72), y, sub=1)
    split_by(bpy.context.object, lambda c: c.z < -.25, mat('fbefc8', .3, .6))
    for i in range(40):  # spikes on a fibonacci sphere
        k = (i + .5) / 40
        el = math.asin(1 - 2 * k)
        az = i * 2.39996
        d = Vector((math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), math.sin(el)))
        if d.x < -.55 and abs(d.z) < .5:
            continue
        p = Vector((d.x * .78, d.y * .74, d.z * .72))
        cone(p + d * .07, .045, .0, .16, br, rot=d.to_track_quat('Z', 'Y').to_euler(), verts=8)
    for k, (a, e) in enumerate(((.8, .5), (1.6, .2), (2.4, .6), (3.6, .3), (4.6, .5), (5.4, .1))):
        d = Vector((math.cos(e) * math.cos(a), math.cos(e) * math.sin(a), math.sin(e)))
        sph(Vector((d.x * .78, d.y * .74, d.z * .72)), (.07, .07, .07), mat('8a5a22'))
    for s in (-1, 1):
        eye((-.48, s * .38, .25), .17, (-.4, s, .3))
        sph((.05, s * .74, -.05), (.18, .03, .1), mat('f0a83a'), rot=(0, 0, s * .4))
    cone((.85, 0, 0), .22, .02, .3, mat('f0a83a'), rot=(0, math.pi / 2, 0), scale=(1, .25, 1))
    sph((-.76, 0, -.1), (.06, .1, .07), mat('c25a4a'))


def squid():
    pink, light = mat('f2a3b8'), mat('fbe0e6', .3, .6)
    bpy.ops.mesh.primitive_cone_add(radius1=.42, radius2=.05, depth=1.5, vertices=24, location=(0, 0, .45))
    o = bpy.context.object
    for v in o.data.vertices:
        v.co.x *= 1 - .25 * max(0, -v.co.z)
    _done(o, pink, sub=2)
    for s in (-1, 1):
        cone((s * .3, 0, .95), .3, .02, .5, pink, rot=(0, s * 1.2, 0), scale=(1, .2, 1), verts=12)
    sph((0, 0, -.35), (.4, .38, .25), light, sub=1)
    for s in (-1, 1):
        eye((s * .25, -.28, -.32), .14, (s * .6, -1, 0))
    for k in range(8):
        a = math.pi * 2 * k / 8
        c, sn = math.cos(a), math.sin(a)
        tube([(c * .2, sn * .2, -.5), (c * .35, sn * .35, -.85), (c * .42, sn * .42, -1.1), (c * .5, sn * .45, -1.25)], .07, .02, pink)
    for s in (-1, 1):
        tube([(s * .1, -.15, -.5), (s * .25, -.45, -.9), (s * .3, -.7, -1.2), (s * .2, -.8, -1.35)], .045, .02, light)
        sph((s * .2, -.8, -1.35), (.08, .05, .1), pink)


def shrimp():
    o, l = mat('f58a5a'), mat('ffc7a6', .3, .6)
    pts = []
    for i in range(7):  # curled segmented body
        a = math.radians(-30 + i * 32)
        pts.append(Vector((math.cos(a) * .55, 0, math.sin(a) * .5)))
        r = .3 - i * .03
        sph(pts[-1], (r, r * .85, r), o if i % 2 == 0 else l, rot=(0, -a, 0))
    hd = pts[0] + Vector((-.15, 0, -.18))
    sph(hd, (.33, .28, .3), o)
    cone(hd + Vector((-.35, 0, .02)), .07, .0, .4, o, rot=(0, -math.pi / 2 + .1, 0))
    for s in (-1, 1):
        eye(hd + Vector((-.12, s * .22, .14)), .09, (0, s, .3))
        tube([hd + Vector((-.2, s * .1, .1)), hd + Vector((-.8, s * .5, .5)), hd + Vector((-1.2, s * .8, .3))], .018, .006, o)
        for k in range(4):
            p = pts[k] + Vector((0, s * .18, -.2))
            tube([p, p + Vector((-.05, s * .12, -.22))], .02, .01, l)
    for s in (-1, 0, 1):
        cone(pts[-1] + Vector((.08 * s - .1, s * .15, .25)), .16, .02, .35, o, rot=(.4 * s, -.5, 0), scale=(1, .3, 1), verts=10)


def lobster():
    r, d = mat('d8392c'), mat('a52a22')
    for i in range(5):  # tail segments
        sph((.35 + i * .22, 0, -.02 * i), (.18 - .015 * i, .26 - .02 * i, .14), r if i % 2 == 0 else d)
    for s in (-1, 0, 1):
        cone((1.45, s * .14, -.1), .14, .02, .3, r, rot=(0, math.pi / 2 + .2, s * .5), scale=(1, .25, 1), verts=10)
    sph((-.15, 0, .05), (.42, .3, .26), r, sub=1)
    cone((-.62, 0, .12), .08, .0, .22, r, rot=(0, -math.pi / 2, 0))
    for s in (-1, 1):
        eye((-.48, s * .14, .26), .08, (0, s, .4))
        tube([(-.55, s * .1, .2), (-1.1, s * .45, .55), (-1.3, s * .7, .2)], .02, .006, d)
        tube([(-.35, s * .25, 0), (-.6, s * .55, .0), (-.8, s * .55, .05)], .07, .055, r)
        cl = Vector((-1.0, s * .62, .05))
        sph(cl, (.3, .17, .13), r, rot=(0, 0, s * .4), sub=1)
        cone(cl + Vector((-.32, s * .06, .05)), .08, .02, .32, d, rot=(0, -math.pi / 2, s * .3), scale=(1, .6, 1), verts=10)
        cone(cl + Vector((-.3, -s * .04, -.04)), .07, .02, .3, r, rot=(0, -math.pi / 2, s * .5), scale=(1, .6, 1), verts=10)
        for k in range(3):
            tube([(-.05 + k * .15, s * .25, -.08), (k * .15, s * .55, -.15), (.05 + k * .15, s * .65, -.4)], .03, .015, d)


def seahorse():
    y, o = mat('f6b73c'), mat('e57d2a')
    pts = [Vector(p) for p in ((0, 0, .9), (.12, 0, .6), (.18, 0, .25), (.1, 0, -.1), (-.08, 0, -.38), (-.05, 0, -.62),
                               (.15, 0, -.78), (.28, 0, -.65), (.22, 0, -.52))]
    for i, p in enumerate(pts[1:]):
        r = .28 - i * .028
        sph(p, (r, r * .8, r * .9), y if i % 2 == 0 else o)
    sph(pts[0], (.28, .24, .26), y, sub=1)
    tube([pts[0] + Vector((-.15, 0, .02)), pts[0] + Vector((-.45, 0, -.02)), pts[0] + Vector((-.62, 0, -.06))], .09, .06, y)
    cone(pts[0] + Vector((.05, 0, .3)), .1, .0, .25, o, scale=(1, .5, 1))
    cone((.38, 0, .25), .25, .02, .2, mat('fbe08a'), rot=(0, math.pi / 2, 0), scale=(1, .15, 1))
    for s in (-1, 1):
        eye(pts[0] + Vector((-.05, s * .2, .06)), .1, (0, s, .3))


def swordfish_():
    swordfish()


def starfish():
    o, l = mat('f27b3a'), mat('ffc49a')
    bpy.ops.mesh.primitive_circle_add(vertices=10, radius=1, fill_type='NGON')
    s = bpy.context.object
    for i, v in enumerate(s.data.vertices):
        r = 1.0 if i % 2 == 0 else .42
        a = math.pi / 2 + i * math.pi / 5
        v.co = (r * math.cos(a), r * math.sin(a), 0)
    md = s.modifiers.new('x', 'SOLIDIFY')
    md.thickness, md.offset = .32, 0
    bv = s.modifiers.new('b', 'BEVEL')
    bv.width, bv.segments = .13, 4
    _done(s, o)
    for k in range(5):
        a = math.pi / 2 + k * 2 * math.pi / 5
        for j in range(3):
            r = .3 + j * .2
            sph((r * math.cos(a), r * math.sin(a), .16), (.06, .06, .05), l)
    for sx in (-1, 1):
        eye((sx * .14, -.05, .2), .1, (0, -.3, 1), look=Vector((0, -.6, 1)))
    sph((0, -.22, .17), (.08, .03, .02), mat('9a3a2a'))


def dolphin():
    g, w = mat('6c93c6'), mat('e8f0f8', .3, .6)
    b = body(2.1, .6, .7, '6c93c6', 'e8f0f8', taper=.8, nose=.05)
    tube([(-1.0, 0, -.08), (-1.25, 0, -.12), (-1.35, 0, -.13)], .14, .1, g)
    cone((.05, 0, .42), .22, .02, .4, g, rot=(0, .7, 0), scale=(1.4, .2, 1), verts=12)
    for s in (-1, 1):
        cone((1.15, s * .22, .0), .2, .02, .5, g, rot=(0, math.pi / 2, s * .55), scale=(1, .25, 1), verts=12)
        cone((-.35, s * .3, -.22), .14, .02, .38, g, rot=(.5 * s, 2.3, 0), scale=(1, .25, 1), verts=10)
        eye((-.68, s * .22, .1), .09, (0, s, .2))
    tube([(-1.32, -.0, -.16), (-1.1, 0, -.22), (-.95, 0, -.2)], .02, .02, mat('3a4a6a'))


def turtle():
    shell, plate, skin = mat('3f9a5a'), mat('8cc65a'), mat('9fd18a')
    sph((0, 0, .15), (.8, .65, .45), shell, sub=1)
    split_by(bpy.context.object, lambda c: c.z < .05, mat('e8d39a', .4, .3))
    for k in range(6):
        a = k * math.pi / 3
        sph((.42 * math.cos(a), .34 * math.sin(a), .42), (.17, .15, .06), plate)
    sph((0, 0, .58), (.18, .16, .06), plate)
    sph((-.95, 0, .25), (.27, .24, .22), skin, sub=1)
    for s in (-1, 1):
        eye((-1.08, s * .14, .35), .08, (-.4, s, .3))
        cone((-.45, s * .65, .0), .2, .03, .55, skin, rot=(0, math.pi / 2, s * 2.3), scale=(1, .35, 1), verts=12)
        cone((.5, s * .55, -.02), .15, .02, .38, skin, rot=(0, math.pi / 2, s * .7), scale=(1, .35, 1), verts=12)
    cone((.85, 0, .05), .08, .0, .25, skin, rot=(0, math.pi / 2, 0))
    sph((-1.2, 0, .22), (.05, .1, .02), mat('3a5a3a'))


def crab():
    r, d, l = mat('e5503c'), mat('b8382c'), mat('f6c9a0')
    sph((0, 0, .1), (.78, .58, .38), r, sub=1)
    split_by(bpy.context.object, lambda c: c.z < -.05, l)
    for s in (-1, 1):
        tube([(s * .15, -.3, .3), (s * .2, -.38, .55)], .04, .035, r)
        eye((s * .2, -.4, .62), .12, (s * .2, -1, .3))
        tube([(s * .55, -.3, .05), (s * .85, -.65, .2), (s * .85, -.85, .3)], .08, .07, r)
        cl = Vector((s * .82, -1.0, .32))
        sph(cl, (.25, .3, .2), r, sub=1)
        cone(cl + Vector((s * .02, -.3, .1)), .1, .02, .35, d, rot=(math.pi / 2 + .3, 0, 0), scale=(1, .6, 1), verts=10)
        cone(cl + Vector((-s * .06, -.28, -.04)), .08, .02, .3, r, rot=(math.pi / 2 - .2, 0, 0), scale=(1, .6, 1), verts=10)
        for k in range(3):
            y = -.05 + k * .25
            tube([(s * .65, y, .0), (s * 1.0, y + .05, .15), (s * 1.18, y + .1, -.3)], .05, .02, d)
    sph((0, -.55, .05), (.12, .04, .03), mat('6a2020'))


def jelly():
    p, l, g = mat('a86fe0', .2, .8), mat('d6b0f6', .2, .8), mat('f2c8ff', .2, 0, 1.5)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=32, ring_count=16, location=(0, 0, .3))
    o = bpy.context.object
    for v in o.data.vertices:
        if v.co.z < 0:
            v.co.z *= .25
        v.co = Vector((v.co.x * .8, v.co.y * .8, v.co.z * .7 * (1 + .06 * math.cos(8 * math.atan2(v.co.y, v.co.x)))))
    _done(o, p, sub=1)
    sph((0, 0, .5), (.35, .35, .3), g)
    for k in range(6):
        a = k * math.pi / 3
        sph((.55 * math.cos(a), .55 * math.sin(a), .68), (.07, .07, .04), g)
    for s in (-1, 1):
        eye((s * .25, -.68, .45), .12, (0, -1, .1))
    for k in range(7):
        a = k * 2 * math.pi / 7 + .2
        c, sn = math.cos(a) * .5, math.sin(a) * .5
        tube([(c, sn, .2), (c * 1.1 + .08, sn * 1.1, -.25), (c * .9 - .05, sn, -.7), (c + .05, sn * 1.05, -1.1)], .055, .015, l)
    for k in range(4):
        a = k * math.pi / 2 + .4
        tube([(.12 * math.cos(a), .12 * math.sin(a), .15), (.2 * math.cos(a), .2 * math.sin(a), -.4), (.1 * math.cos(a), .15 * math.sin(a), -.8)], .09, .03, p)


def pirate():
    skin, red, wh, navy, br, blk = mat('f0c09a'), mat('d23a33'), mat('f6f5f1'), mat('2c3e66'), mat('6a4b34'), mat('2a2626')
    for s in (-1, 1):
        sph((s * .16, 0, -.85), (.13, .2, .1), blk)
        tube([(s * .15, 0, -.8), (s * .15, 0, -.45)], .12, .13, br)
    for k in range(5):  # striped shirt
        bpy.ops.mesh.primitive_cylinder_add(radius=.32 - .01 * k, depth=.11, vertices=24, location=(0, 0, -.37 + k * .11))
        _done(bpy.context.object, wh if k % 2 == 0 else navy)
    sph((0, 0, -.42), (.33, .28, .1), br)
    sph((0, -.3, -.42), (.06, .03, .05), mat('e2b04a', .2, 1))
    for s in (-1, 1):
        tube([(s * .3, 0, .05), (s * .45, -.05, -.2), (s * .45, -.1, -.4)], .09, .08, wh)
        sph((s * .45, -.1, -.45), (.09, .09, .09), skin)
    tube([(.45, -.1, -.45), (.5, -.5, -.1), (.52, -.75, .15)], .05, .04, mat('b98550'))
    sph((0, 0, .45), (.5, .46, .46), skin, sub=1)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=32, ring_count=16, location=(0, .03, .62))
    bd = bpy.context.object             # bandana: the top of the head only, lower at the back
    for v in bd.data.vertices:
        z = max(v.co.z, .05 + .45 * max(0, v.co.y))
        v.co = Vector((v.co.x * .54, v.co.y * .5, z * .42))
    _done(bd, red)
    for k in range(6):
        a = k * 1.1
        sph((.38 * math.cos(a), .36 * math.sin(a) - .02, .86), (.04, .04, .02), wh)
    tube([(0, .45, .65), (.1, .7, .45), (.15, .75, .3)], .07, .03, red)
    eye((-.17, -.42, .45), .1, (0, -1, .1))
    sph((.17, -.43, .45), (.12, .04, .1), blk)
    tube([(.17, -.43, .5), (.45, -.1, .7)], .015, .015, blk)
    sph((0, -.48, .32), (.06, .03, .03), mat('a04a3a'))


def octopus():
    m, l, navy, gold, wh = mat('c2416b'), mat('e57c98'), mat('1f2d4f'), mat('d4af47', .25, 1), mat('f4f2ec')
    sph((0, 0, .35), (.72, .66, .7), m, sub=1)
    for k in range(5):
        a = k * 1.3 + .3
        sph((.62 * math.cos(a), .56 * math.sin(a), .55), (.08, .08, .05), l)
    for s in (-1, 1):
        eye((s * .25, -.55, .32), .17, (0, -1, .1))
        tube([(s * .08, -.6, .58), (s * .38, -.55, .62)], .03, .03, mat('7a1f3f'))
    for k in range(8):
        a = k * math.pi / 4 + math.pi / 8
        c, sn = math.cos(a), math.sin(a)
        tube([(c * .4, sn * .4, -.05), (c * .8, sn * .8, -.35), (c * 1.1, sn * 1.1, -.35), (c * 1.2, sn * 1.2, -.15),
              (c * 1.05, sn * 1.05, -.05)], .2, .05, m)
    bpy.ops.mesh.primitive_cylinder_add(radius=.48, depth=.22, vertices=24, location=(0, .02, 1.02))
    _done(bpy.context.object, navy)
    sph((0, .02, 1.16), (.56, .56, .1), wh)
    bpy.ops.mesh.primitive_torus_add(major_radius=.48, minor_radius=.04, location=(0, .02, .94))
    _done(bpy.context.object, gold)
    sph((0, -.42, .9), (.4, .25, .04), mat('15161a', .2, 1), rot=(-.3, 0, 0))
    sph((0, -.48, 1.04), (.08, .03, .08), gold)


BUILD = {'sardine': sardine, 'anchovy': anchovy, 'mackerel': mackerel, 'squid': squid, 'shrimp': shrimp, 'salmon': salmon,
         'tuna': tuna, 'lobster': lobster, 'pufferfish': pufferfish, 'seahorse': seahorse, 'swordfish': swordfish,
         'starfish': starfish, 'dolphin': dolphin, 'turtle': turtle, 'crab': crab, 'jelly': jelly, 'pirate': pirate,
         'octopus': octopus}
VIEW = Vector((.9, -1.25, 1.15)).normalized()       # 3/4 from the front-right and above


def frame():
    """ortho camera along VIEW, fitted to the evaluated meshes"""
    sc = bpy.context.scene
    dg = bpy.context.evaluated_depsgraph_get()
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.data.type = 'ORTHO'
    q = (-VIEW).to_track_quat('-Z', 'Y')
    cam.rotation_euler = q.to_euler()
    R = q.to_matrix()
    pts = []
    for o in sc.objects:
        if o.type == 'MESH':
            e = o.evaluated_get(dg)
            pts += [R.transposed() @ (e.matrix_world @ v.co) for v in e.to_mesh().vertices]
    xs, ys, zs = [p.x for p in pts], [p.y for p in pts], [p.z for p in pts]
    c = R @ Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, (min(zs) + max(zs)) / 2))
    cam.data.ortho_scale = max(max(xs) - min(xs), max(ys) - min(ys)) * 1.12
    cam.location = c + VIEW * 10
    cam.data.clip_end = 30


want = sys.argv[sys.argv.index('--') + 1].split(',') if '--' in sys.argv else IDS
try:
    import PIL  # noqa: F401
    HAVE_PIL = True
except ImportError:
    HAVE_PIL = False
for i in want:
    reset()
    MATS.clear()
    BUILD[i]()
    frame()
    p = os.path.abspath(os.path.join(OUT, f'dex_{i}.png'))
    bpy.context.scene.render.filepath = p
    bpy.ops.render.render(write_still=True)
    print('rendered', i, pack(p) if HAVE_PIL else os.path.getsize(p), 'bytes')
if not HAVE_PIL:
    print('Pillow not found in Blender: run  python tools/sprites/dex.py --pack  to squeeze the PNGs under 40 KB')
