"""Low-poly props for English Quest, built procedurally in Blender (headless).
Run: blender -b -P build_props.py   (env OUT = output folder, optional ONLY=name,name)
Style: flat-shaded, one flat colour per material, no textures. Z up in Blender -> Y up in glTF,
front (bow, face) toward Blender -Y = glTF +Z. Feet on z=0, centred on x/y.
"""
import bpy, bmesh, os, math, random, mathutils
from math import pi, radians

OUT = os.environ["OUT"]
ONLY = [s for s in os.environ.get("ONLY", "").split(",") if s]
MATS = {}
OBJS = []


def lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return [(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in c] + [1.0]


def mat(name, hexc, emit=0.0, rough=0.9):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = lin(hexc)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = 0.0
    if emit:
        b.inputs['Emission Color'].default_value = lin(hexc)
        b.inputs['Emission Strength'].default_value = emit
    MATS[name] = m
    return m


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    MATS.clear()
    OBJS.clear()


def _fin(o, m, jit=0.0, seed=1):
    o.data.materials.append(m)
    if jit:
        r = random.Random(seed)
        for v in o.data.vertices:
            v.co += mathutils.Vector((r.uniform(-jit, jit), r.uniform(-jit, jit), r.uniform(-jit, jit)))
    OBJS.append(o)
    return o


def cyl(r, h, loc, m, seg=8, r2=None, rot=(0, 0, 0), scale=(1, 1, 1), jit=0, seed=1):
    bpy.ops.mesh.primitive_cone_add(vertices=seg, radius1=r, radius2=r if r2 is None else r2, depth=h,
                                    location=loc, rotation=rot)
    o = bpy.context.object
    o.scale = scale
    return _fin(o, m, jit, seed)


def ball(r, loc, m, sub=1, scale=(1, 1, 1), rot=(0, 0, 0), jit=0, seed=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=loc, rotation=rot)
    o = bpy.context.object
    o.scale = scale
    return _fin(o, m, jit, seed)


def box(size, loc, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object
    o.scale = size
    return _fin(o, m)


def beam(p1, p2, w, m):
    """square beam between two points"""
    a, b = mathutils.Vector(p1), mathutils.Vector(p2)
    d = b - a
    bpy.ops.mesh.primitive_cube_add(size=1, location=(a + b) / 2)
    o = bpy.context.object
    o.scale = (w, w, d.length)
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = d.to_track_quat('Z', 'Y')
    return _fin(o, m)


def finish(name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in OBJS:
        o.select_set(True)
    bpy.context.view_layer.objects.active = OBJS[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.object.join()
    o = bpy.context.object
    o.name = name
    o.data.name = name
    for p in o.data.polygons:
        p.use_smooth = False
    bpy.context.view_layer.update()
    pts = [v.co for v in o.data.vertices]
    cx = (min(p.x for p in pts) + max(p.x for p in pts)) / 2
    cy = (min(p.y for p in pts) + max(p.y for p in pts)) / 2
    mz = min(p.z for p in pts)
    for v in o.data.vertices:
        v.co.x -= cx
        v.co.y -= cy
        v.co.z -= mz
    # drop unused material slots / remove doubles
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0005)
    bm.to_mesh(o.data)
    bm.free()
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, name + ".glb"), export_format='GLB', export_yup=True,
                              export_apply=True, export_image_format='NONE')
    d = o.dimensions
    print("BUILT", name, "tris", sum(len(p.vertices) - 2 for p in o.data.polygons),
          "size", round(d.x, 2), round(d.y, 2), round(d.z, 2))


# ------------------------------------------------------------------ props
def vegetable_garden():
    wood, wood2 = mat("wood", "#9A6B3F"), mat("wood_dark", "#7A502E")
    soil = mat("soil", "#5A3A24")
    cab, cab2 = mat("cabbage", "#8CC85A"), mat("cabbage_outer", "#5FA040")
    leaf, leaf2 = mat("leaf", "#4FA83D"), mat("leaf_dark", "#3A8A33")
    carrot, tomato = mat("carrot", "#F28A1E"), mat("tomato", "#E0392B")
    stake = mat("stake", "#B58A55")
    L, W = 3.0, 2.0
    for sx in (-1, 1):
        box((0.12, W + 0.12, 0.3), (sx * (L / 2 + 0.06), 0, 0.15), wood)
    for sy in (-1, 1):
        box((L, 0.12, 0.3), (0, sy * (W / 2 + 0.06), 0.15), wood2)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box((0.2, 0.2, 0.38), (sx * (L / 2 + 0.06), sy * (W / 2 + 0.06), 0.19), wood2)
    box((L, W, 0.24), (0, 0, 0.12), soil)
    # row 1 cabbages (front, -Y)
    for i in range(4):
        x = -1.1 + i * 0.73
        ball(0.27, (x, -0.62, 0.42), cab2, 1, (1, 1, 0.7), jit=0.025, seed=i)
        ball(0.19, (x, -0.62, 0.52), cab, 1, (1, 1, 0.8), jit=0.02, seed=i + 9)
    # row 2 carrots (leaf tufts + orange tips)
    for i in range(6):
        x = -1.15 + i * 0.46
        for k in range(3):
            a = k * 2.1 + i
            cyl(0.04, 0.4, (x + 0.07 * math.cos(a), 0.0 + 0.07 * math.sin(a), 0.42), leaf, 4, 0.005,
                (0.35 * math.sin(a), -0.35 * math.cos(a), 0))
        cyl(0.07, 0.1, (x, 0, 0.25), carrot, 6, 0.04)
    # row 3 tomato plants on stakes
    for i in range(3):
        x = -0.95 + i * 0.95
        cyl(0.025, 1.2, (x, 0.65, 0.84), stake, 4)
        ball(0.3, (x, 0.65, 0.55), leaf2, 1, (1, 1, 0.9), jit=0.04, seed=i + 3)
        ball(0.25, (x, 0.65, 0.95), leaf2, 1, (1, 1, 0.9), jit=0.04, seed=i + 13)
        for k in range(3):
            a = k * 2.3 + i
            ball(0.07, (x + 0.27 * math.cos(a), 0.65 + 0.27 * math.sin(a), 0.5 + 0.18 * k), tomato, 1)
    finish("prop_vegetable_garden_v01")


def tree_round():
    bark, bark2 = mat("bark", "#7A5230"), mat("bark_dark", "#5E3D23")
    g1, g2, g3 = mat("leaf_a", "#5DAE46"), mat("leaf_b", "#3F9440"), mat("leaf_c", "#78C055")
    cyl(0.3, 1.5, (0, 0, 0.75), bark, 7, 0.2)
    cyl(0.4, 0.2, (0, 0, 0.1), bark2, 7, 0.32)
    for i, (a) in enumerate((0.5, 2.6, 4.6)):
        cyl(0.07, 0.7, (0.25 * math.cos(a), 0.25 * math.sin(a), 1.65), bark, 5, 0.04,
            (0.7 * math.sin(a), -0.7 * math.cos(a), 0))
    ball(1.2, (0, 0, 2.35), g2, 1, (1, 1, 0.85), jit=0.1, seed=1)
    ball(0.95, (0.7, 0.2, 2.9), g1, 1, jit=0.1, seed=2)
    ball(0.95, (-0.65, -0.25, 2.8), g3, 1, jit=0.1, seed=3)
    ball(0.9, (0.05, -0.1, 3.15), g1, 1, jit=0.1, seed=4)
    ball(0.75, (-0.3, 0.7, 2.6), g2, 1, jit=0.1, seed=5)
    finish("prop_tree_round_v01")


def tree_pine():
    bark = mat("bark", "#6B4627")
    p1, p2, p3 = mat("pine_a", "#2F7A45"), mat("pine_b", "#3B8E4C"), mat("pine_c", "#256A3C")
    cyl(0.25, 1.4, (0, 0, 0.7), bark, 6, 0.17)
    for i, (z, r, h, m) in enumerate(((1.1, 1.5, 1.5, p3), (1.9, 1.2, 1.4, p1), (2.7, 0.9, 1.3, p2),
                                      (3.4, 0.6, 1.1, p1))):
        cyl(r, h, (0, 0, z + h / 2 - 0.1), m, 8, 0.02, jit=0.05, seed=i)
    finish("prop_tree_pine_v01")


def grass_tuft():
    cols = [mat("grass_a", "#7CC24E"), mat("grass_b", "#5BA83E"), mat("grass_c", "#98D45E")]
    r = random.Random(7)
    for i in range(11):
        a = r.uniform(0, 2 * pi)
        d = r.uniform(0.0, 0.14)
        h = r.uniform(0.3, 0.6)
        t = r.uniform(0.1, 0.4)
        cyl(0.045, h, (d * math.cos(a), d * math.sin(a), h / 2 - 0.02), cols[i % 3], 3, 0.004,
            (t * math.sin(a), -t * math.cos(a), 0))
    finish("prop_grass_tuft_v01")


def apple():
    red, red2 = mat("apple_red", "#D9352A"), mat("apple_red_dark", "#B52620")
    stem, leaf = mat("stem", "#6B4627"), mat("leaf", "#58B040")
    ball(0.16, (0, 0, 0.16), red, 2, (1, 1, 0.92), jit=0.006, seed=3)
    ball(0.1, (0.0, 0.0, 0.1), red2, 1, (1.08, 1.08, 0.5))
    cyl(0.012, 0.09, (0, 0, 0.3), stem, 5, 0.008, (0.15, 0, 0))
    ball(0.06, (0.06, 0, 0.31), leaf, 1, (1.6, 0.7, 0.25), (0, -0.4, 0.3))
    finish("prop_apple_v01")


def orange():
    org, org2 = mat("orange", "#F28A1E"), mat("orange_dark", "#D96F12")
    leaf, stem = mat("leaf", "#4FA83D"), mat("stem", "#6B4627")
    ball(0.16, (0, 0, 0.16), org, 2, (1, 1, 0.95), jit=0.007, seed=5)
    cyl(0.05, 0.02, (0, 0, 0.3), leaf, 6, 0.02)
    cyl(0.012, 0.04, (0, 0, 0.32), stem, 4)
    ball(0.06, (0.08, 0.02, 0.3), leaf, 1, (1.6, 0.7, 0.25), (0, -0.3, 0.5))
    ball(0.04, (0.0, 0.0, 0.07), org2, 1, (1.3, 1.3, 0.3))
    finish("prop_orange_v01")


def pond():
    water, water2 = mat("water", "#4FA8D8", rough=0.2), mat("water_deep", "#3C8CC0", rough=0.2)
    stone1, stone2 = mat("stone_a", "#9AA0A6"), mat("stone_b", "#7C838A")
    grass = mat("bank", "#6DB84A")
    pad, flower = mat("lily_pad", "#4E9E40"), mat("lily_flower", "#F5A3C4")
    reed, tip = mat("reed", "#7DAA4A"), mat("cattail", "#6B4627")
    R = 3.2
    cyl(R + 0.9, 0.12, (0, 0, 0.06), grass, 14, jit=0.12, seed=1)
    cyl(R + 0.15, 0.2, (0, 0, 0.07), mat("mud", "#6B4B30"), 14, jit=0.05, seed=2)
    cyl(R, 0.06, (0, 0, 0.16), water, 14, jit=0.04, seed=3)
    cyl(R * 0.5, 0.02, (0.2, 0.1, 0.2), water2, 9, jit=0.03, seed=4)
    r = random.Random(11)
    for i in range(16):
        a = i / 16 * 2 * pi + r.uniform(-0.1, 0.1)
        s = r.uniform(0.28, 0.5)
        ball(s, ((R + 0.2) * math.cos(a), (R + 0.2) * math.sin(a), 0.2), stone1 if i % 2 else stone2, 1,
             (1.2, 1, 0.65), (0, 0, a), jit=0.04, seed=i)
    for (x, y) in ((-0.9, -0.6), (0.7, 0.9), (1.4, -0.9)):
        cyl(0.4, 0.03, (x, y, 0.2), pad, 8, jit=0.015, seed=int(x * 10))
    ball(0.12, (-0.9, -0.6, 0.27), flower, 1, (1, 1, 0.7))
    ball(0.1, (0.7, 0.9, 0.26), flower, 1, (1, 1, 0.7))
    for i in range(9):
        a = radians(130) + i * 0.13
        x, y = (R - 0.1) * math.cos(a), (R - 0.1) * math.sin(a)
        h = r.uniform(0.9, 1.5)
        cyl(0.025, h, (x, y, h / 2 + 0.1), reed, 4, 0.01, (r.uniform(-.12, .12), r.uniform(-.12, .12), 0))
        if i % 3 == 0:
            cyl(0.05, 0.28, (x, y, h + 0.12), tip, 6, 0.05)
    finish("prop_pond_v01")


def campfire():
    st1, st2 = mat("stone_a", "#8E949A"), mat("stone_b", "#6F767D")
    log, logend = mat("log", "#7A502E"), mat("log_end", "#C99A62")
    ash = mat("ash", "#3A3532")
    f1, f2, f3 = mat("flame_red", "#E8501E", 1.5), mat("flame_orange", "#FF8A1E", 2.0), mat("flame_yellow", "#FFD84A", 2.5)
    coal = mat("coal", "#D8431A", 1.2)
    r = random.Random(5)
    cyl(1.0, 0.05, (0, 0, 0.03), ash, 10)
    for i in range(9):
        a = i / 9 * 2 * pi
        ball(0.3, (0.95 * math.cos(a), 0.95 * math.sin(a), 0.16), st1 if i % 2 else st2, 1, (1.2, 1, 0.75),
             (0, 0, a), jit=0.03, seed=i)
    for i in range(5):
        a = i / 5 * 2 * pi + 0.3
        cyl(0.12, 1.6, (0.32 * math.cos(a), 0.32 * math.sin(a), 0.3), log, 6, 0.09,
            (0.0, 0.0, 0.0), jit=0.01, seed=i)
        o = OBJS[-1]
        o.rotation_euler = (0.9 * math.sin(a + pi / 2) * -1 if False else 0.0, 0, 0)
    # replace flat cylinders by leaning logs (rotate in place)
    for i, o in enumerate(OBJS[-5:]):
        a = i / 5 * 2 * pi + 0.3
        o.rotation_mode = 'XYZ'
        o.rotation_euler = (1.0 * math.sin(a), -1.0 * math.cos(a), 0)
        o.location = (0.4 * math.cos(a), 0.4 * math.sin(a), 0.5)
    ball(0.28, (0, 0, 0.16), coal, 1, (1, 1, 0.5))
    cyl(0.34, 0.5, (0, 0, 0.7), f1, 6, 0.06, jit=0.03, seed=2)
    cyl(0.26, 0.8, (0.03, 0, 0.9), f2, 6, 0.02, jit=0.03, seed=3)
    cyl(0.12, 0.6, (0, 0.02, 0.95), f3, 5, 0.01, jit=0.02, seed=4)
    for k, (dx, dy, hh) in enumerate(((0.2, 0.1, 0.45), (-0.18, -0.1, 0.38), (0.0, 0.22, 0.32))):
        cyl(0.09, hh, (dx, dy, 0.66 + hh / 2), f2, 4, 0.01, jit=0.01, seed=k + 6)
    # log seats
    for i in range(3):
        a = radians(200 + i * 70)
        x, y = 2.3 * math.cos(a), 2.3 * math.sin(a)
        cyl(0.3, 0.45, (x, y, 0.225), log, 8, jit=0.015, seed=i + 20)
        cyl(0.27, 0.02, (x, y, 0.46), logend, 8)
    finish("prop_campfire_v01")


def hull_mesh(m):
    # stations from bow (-Y) to stern: (y, half-width top, half-width bottom, z top, z bottom)
    st = [(-1.35, 0.03, 0.02, 0.78, 0.38), (-0.7, 0.36, 0.16, 0.66, 0.16), (0.1, 0.55, 0.28, 0.62, 0.1),
          (0.9, 0.6, 0.3, 0.62, 0.1), (1.3, 0.56, 0.28, 0.64, 0.12)]
    me = bpy.data.meshes.new("hull")
    vs, fs = [], []
    for (y, wt, wb, zt, zb) in st:
        vs += [(-wt, y, zt), (wt, y, zt), (wb, y, zb), (-wb, y, zb)]
    for i in range(len(st) - 1):
        a0, b0 = i * 4, (i + 1) * 4
        fs += [(a0 + 0, b0 + 0, b0 + 3, a0 + 3), (a0 + 1, a0 + 2, b0 + 2, b0 + 1), (a0 + 3, b0 + 3, b0 + 2, a0 + 2)]
    k = (len(st) - 1) * 4
    fs.append((k + 0, k + 3, k + 2, k + 1))
    me.from_pydata(vs, [], fs)
    me.update()
    o = bpy.data.objects.new("hull", me)
    bpy.context.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    sol = o.modifiers.new("s", 'SOLIDIFY')
    sol.thickness = 0.07
    sol.offset = -1
    bpy.ops.object.modifier_apply(modifier="s")
    bpy.ops.object.shade_flat()
    me.materials.append(m)
    OBJS.append(o)


def boat():
    w1, w3, trim = mat("hull", "#A66B3A"), mat("plank", "#C8934F"), mat("trim", "#E9E2D0")
    oar, dark = mat("oar", "#D2A265"), mat("hull_dark", "#7A4B28")
    hull_mesh(w1)
    box((1.0, 0.12, 0.1), (0, 1.3, 0.66), dark)
    box((0.8, 0.22, 0.05), (0, 0.55, 0.42), w3)
    box((0.7, 0.22, 0.05), (0, -0.2, 0.42), w3)
    box((0.12, 0.12, 0.34), (0, -1.33, 0.78), dark)
    for s, yy in ((-1, 0.35), (1, -0.05)):
        cyl(0.028, 1.5, (s * 0.7, yy, 0.78), oar, 5, rot=(0, radians(90), 0))
        box((0.42, 0.15, 0.025), (s * 1.38, yy, 0.78), oar)
        box((0.06, 0.06, 0.1), (s * 0.0, yy, 0.78), dark)
    # lantern-style coil of rope at the bow
    cyl(0.12, 0.05, (0, -1.0, 0.43), trim, 8)
    finish("prop_boat_v01")


def water_tower():
    wood, wood2 = mat("wood", "#A87A4A"), mat("wood_dark", "#7A502E")
    metal = mat("iron", "#5B6670")
    roof, roof2 = mat("roof", "#C7432F"), mat("roof_dark", "#A23524")
    stone = mat("stone", "#8E949A")
    H0, H1 = 0.0, 6.0
    b0, b1 = 2.0, 1.45
    corners = [(sx, sy) for sx in (-1, 1) for sy in (-1, 1)]
    for sx, sy in corners:
        box((0.55, 0.55, 0.3), (sx * b0, sy * b0, 0.15), stone)
        beam((sx * b0, sy * b0, 0.2), (sx * b1, sy * b1, H1), 0.28, wood)
    # cross braces (two levels)
    for z0, z1, k0, k1 in ((1.2, 2.8, 1.8, 1.7), (3.2, 4.8, 1.65, 1.5)):
        def pt(sx, sy, z, k): return (sx * k, sy * k, z)
        for (a, b) in ((corners[0], corners[1]), (corners[1], corners[3]), (corners[3], corners[2]), (corners[2], corners[0])):
            beam(pt(a[0], a[1], z0, k0), pt(b[0], b[1], z1, k1), 0.12, wood2)
            beam(pt(b[0], b[1], z0, k0), pt(a[0], a[1], z1, k1), 0.12, wood2)
    # platform
    box((3.5, 3.5, 0.25), (0, 0, H1 + 0.12), wood2)
    # tank
    cyl(1.75, 2.6, (0, 0, H1 + 0.25 + 1.3), wood, 12)
    for z in (0.7, 1.9):
        cyl(1.8, 0.12, (0, 0, H1 + 0.25 + z), metal, 12)
    # roof
    cyl(2.05, 1.3, (0, 0, H1 + 0.25 + 2.6 + 0.65), roof, 12, 0.05)
    cyl(2.07, 0.12, (0, 0, H1 + 0.25 + 2.6 + 0.05), roof2, 12)
    cyl(0.12, 0.3, (0, 0, H1 + 0.25 + 2.6 + 1.4), metal, 6)
    # pipe + spout
    cyl(0.14, H1 + 0.6, (-1.35, 0, (H1 + 0.6) / 2), metal, 8) if False else None
    cyl(0.14, 5.4, (1.2, -1.2, 3.4), metal, 8, rot=(0, 0, 0))
    cyl(0.14, 1.0, (1.55, -1.2, 0.8), metal, 8, rot=(0, radians(90), 0)) if False else None
    cyl(0.18, 0.5, (1.2, -1.2, 0.7), metal, 8, 0.22)
    # ladder on the front (-Y) side
    for x in (-0.35, 0.35):
        beam((x, -1.95, 0.2), (x, -1.6, H1 + 0.3), 0.07, wood2)
    for i in range(10):
        t = (i + 0.7) / 10.4
        z = 0.2 + t * (H1 + 0.1)
        y = -1.95 + t * 0.35
        box((0.7, 0.07, 0.07), (0, y, z), wood2)
    finish("prop_water_tower_v01")


BUILDERS = {
    "prop_vegetable_garden_v01": vegetable_garden, "prop_tree_round_v01": tree_round,
    "prop_tree_pine_v01": tree_pine, "prop_grass_tuft_v01": grass_tuft, "prop_apple_v01": apple,
    "prop_orange_v01": orange, "prop_pond_v01": pond, "prop_campfire_v01": campfire,
    "prop_boat_v01": boat, "prop_water_tower_v01": water_tower,
}
for n, f in BUILDERS.items():
    if ONLY and n not in ONLY:
        continue
    reset()
    f()
