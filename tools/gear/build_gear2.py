"""Batch 20 (run from build_gear.py): element weapons, element armour (skinned to Ngọc's bones), element amulets.
Weapons: origin at the hand grip, blade/shaft along Blender +Z; materials metal, grip, wood, gem, glow; <= 900 triangles.
Armour: built on Ngọc v04, skinned to chest / spine / upper_arm.L / upper_arm.R (wind cloak adds cape_1, cape_2 under chest);
materials armor_main, armor_trim, glow; <= 1,500 triangles. Amulets: on her chest; metal, gem, glow; <= 400 triangles.
"""
import math, random
import bpy, bmesh
from mathutils import Vector, Matrix, Quaternion

EL = {   # element: (main colour, dark colour, glow colour)
    "ember": ("#E8562A", "#5A1E14", "#FF8A2A"), "frost": ("#9FDCF5", "#2E5C8A", "#7FE0FF"),
    "gale": ("#5FC872", "#25603A", "#8CF0A0"), "spark": ("#F5D23A", "#4A2E7A", "#FFE45A"),
}
EL2 = {"blaze": "ember", "glacier": "frost", "tempest": "gale", "storm": "spark", "inferno": "ember"}


def emats(el):
    c, d, g = EL[el]
    return (mat("metal", c, rough=.25, metal=.7), mat("grip", d, rough=.7), mat("wood", "#7A4E2C", rough=.8),
            mat("gem", g, rough=.05, emit=1.0, alpha=.9), mat("glow", g, emit=1.8, rough=.2))


def flame_inlay(z0, z1, w, m, n=5):
    for k in range(n):
        f = k / n
        z = z0 + (z1 - z0) * f
        for s in (-1, 1):
            cyl(w * (1 - f * .5), (z1 - z0) / n * 1.3, (0, s * .011, z + (z1 - z0) / n * .5), m, 3, r2=0, rot=(math.pi / 2 * 0, .25 * (1 if k % 2 else -1), 0),
                scale=(1, .25, 1))


def sword2(name, el, tier):
    reset()
    metal, grip, wood, gem, glow = emats(el)
    L = .85 if tier == 1 else 1.0
    bl = .6 if tier == 1 else .72
    z0 = .11 if tier == 1 else .13
    w = .036 if tier == 1 else .048
    if el == "ember":
        blade(z0, z0 + bl, w, w * .8, .01, metal, tip=.1)
        flame_inlay(z0 + .05, z0 + bl * .8, w * .55, glow)
    elif el == "frost":
        blade(z0, z0 + bl, w, w * .7, .014, gem, tip=.14, seg=4)
        cyl(.004, bl * .8, (0, -.012, z0 + bl * .45), glow, 4)
    elif el == "gale":
        blade(z0, z0 + bl, w * 1.1, w * .5, .01, metal, tip=.14, curve=.06, wave=.006)
        box((.005, .004, bl * .7), (.015, -.01, z0 + bl * .45), glow, rot=(0, -.08, 0))
    else:   # spark: zig-zag lightning blade
        pts = []
        n = 6
        for i in range(n + 1):
            pts.append(Vector(((.03 if i % 2 else -.03) * (1 - i / n), 0, z0 + bl * i / n)))
        for i in range(n):
            a, b = pts[i], pts[i + 1]
            beam(tuple(a), tuple(b), w * 1.2 * (1 - i / n * .6), glow, .012)
    # guard, grip, pommel
    gw = .18 if tier == 1 else .26
    box((gw, .045, .035), (0, 0, z0 - .02), metal if el != "spark" else grip, bev=.01)
    for s in (-1, 1):
        cyl(.022, .05 if tier == 1 else .08, (s * gw / 2, 0, z0 - .01), metal if el != "spark" else grip, 6, r2=.004, rot=(0, s * .9, 0))
    if tier == 2:
        ball(.03, (0, -.025, z0 - .02), gem, uv=(8, 5), scale=(1, .6, 1.2))
        ball(.03, (0, .025, z0 - .02), gem, uv=(8, 5), scale=(1, .6, 1.2))
    wrap_grip(-.1, z0 - .04, .017, grip, metal, 5)
    if el == "frost":
        cyl(.03, .08, (0, 0, -.14), gem, 6, r2=0, rot=(math.pi, 0, 0))
    elif el == "gale":
        ball(.025, (0, 0, -.12), metal, uv=(8, 5))
        for k, s in enumerate((-1, 1)):   # silk ribbon fluttering from the pommel
            beam((0, 0, -.12), (s * .06, .02, -.3), .025, glow, .004)
            beam((s * .06, .02, -.3), (s * .02, .04, -.42), .02, glow, .004)
    else:
        ball(.026, (0, 0, -.12), metal if el != "spark" else grip, uv=(8, 5))
    group(name, origin=None)
    export(name + "_v01")


def staff(name, el, tier):
    reset()
    metal, grip, wood, gem, glow = emats(el)
    below, above = (.25, .74) if tier == 1 else (.3, .72)
    cyl(.022, below + above, (0, 0, (above - below) / 2), wood, 8, r2=.018)
    wrap_grip(-.1, .1, .025, grip, metal, 4)
    cyl(.026, .05, (0, 0, -below + .02), metal, 8, r2=.015)
    top = Vector((0, 0, above))
    if tier == 1:   # orb held by three metal prongs
        cyl(.035, .06, tuple(top - Vector((0, 0, .03))), metal, 8)
        ball(.075, tuple(top + Vector((0, 0, .09))), gem, uv=(12, 8))
        ball(.035, tuple(top + Vector((0, 0, .09))), glow, uv=(8, 5))
        for k in range(3):
            a = k * 2 * math.pi / 3
            p0 = top + Vector((0, 0, .0))
            p1 = top + Vector((.08 * math.cos(a), .08 * math.sin(a), .08))
            p2 = top + Vector((.04 * math.cos(a), .04 * math.sin(a), .17))
            beam(tuple(p0), tuple(p1), .012, metal)
            beam(tuple(p1), tuple(p2), .01, metal)
    else:
        cyl(.04, .08, tuple(top - Vector((0, 0, .02))), metal, 8)
        c = top + Vector((0, 0, .17))
        if el == "ember":   # flame
            for k, (h, r, dx) in enumerate(((.26, .07, 0), (.17, .05, .05), (.15, .045, -.05))):
                cyl(r, h, tuple(c + Vector((dx, 0, -.06 + h / 2))), glow if k == 0 else gem, 6, r2=0)
        elif el == "frost":   # snowflake
            for k in range(6):
                a = k * math.pi / 3
                d = Vector((math.cos(a), 0, math.sin(a)))
                beam(tuple(c), tuple(c + d * .13), .022, gem, .015)
                for s in (-1, 1):
                    side = Vector((-math.sin(a + s * .8), 0, math.cos(a + s * .8)))
                    beam(tuple(c + d * .08), tuple(c + d * .08 + Vector((math.cos(a + s * .8), 0, math.sin(a + s * .8))) * .045), .012, gem, .01)
            ball(.03, tuple(c), glow, uv=(8, 5))
        elif el == "gale":   # swirl
            pts = [c + Vector((.11 * (1 - t) * math.cos(t * 9), .11 * (1 - t) * math.sin(t * 9), .1 * t - .05)) for t in [i / 14 for i in range(15)]]
            for a, b in zip(pts, pts[1:]):
                beam(tuple(a), tuple(b), .024, gem)
            ball(.03, tuple(c), glow, uv=(8, 5))
        else:   # lightning bolt
            pts = [c + Vector(p) for p in ((-.02, 0, .14), (.05, 0, .04), (-.01, 0, .03), (.04, 0, -.1))]
            for a, b in zip(pts, pts[1:]):
                beam(tuple(a), tuple(b), .04, glow, .015)
        torus(.17, .01, tuple(c), glow, 20, 3, rot=(.5, .3, 0))       # floating ring
        for k in range(3):
            a = k * 2 * math.pi / 3
            ball(.018, tuple(c + Vector((.17 * math.cos(a), .17 * math.sin(a) * .87, .17 * math.sin(a) * .47))), gem, uv=(6, 4))
    group(name, origin=None)
    export(name + "_v01")


# ------------------------------------------------------------------ element armour, skinned to Ngọc's skeleton
def ngoc_rig():
    """import Ngọc v04: keep her armature (rest pose), return (armature, body BVH)"""
    from mathutils.bvhtree import BVHTree
    bpy.ops.import_scene.gltf(filepath=NGOC)
    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    body = bpy.data.objects["Ngoc"]
    vs = [body.matrix_world @ v.co for v in body.data.vertices]
    tree = BVHTree.FromPolygons(vs, [list(p.vertices) for p in body.data.polygons])
    if arm.animation_data:
        arm.animation_data.action = None
        for tr in list(arm.animation_data.nla_tracks):
            arm.animation_data.nla_tracks.remove(tr)
    for o in list(bpy.data.objects):
        if o.type == 'MESH':
            bpy.data.objects.remove(o)
    for a in list(bpy.data.actions):
        bpy.data.actions.remove(a)
    arm.name = "NgocRig"
    return arm, tree


def skin(o, rule):
    """vertex groups by rule(world point) -> [(bone, weight)]"""
    me = o.data
    groups = {}
    for v in me.vertices:
        p = o.matrix_world @ v.co
        for b, w in rule(p):
            if b not in groups:
                groups[b] = o.vertex_groups.new(name=b)
            groups[b].add([v.index], w, 'REPLACE')


def torso_rule(p):
    t = max(0.0, min(1.0, (p.z - .62) / .12))
    return [("chest", t), ("spine", 1 - t)] if 0 < t < 1 else [("chest" if t >= 1 else "spine", 1.0)]


def armor_elem(name, el):
    reset()
    arm, tree = ngoc_rig()
    c, d, g = EL[el]
    main, trim, glow = mat("armor_main", c, rough=.35, metal=.5), mat("armor_trim", d, rough=.4, metal=.6), mat("glow", g, emit=1.8)
    parts = []                      # (start index in OBJS, rule)
    s = len(OBJS)
    o, gr = shell(tree, .5, .79, 5, 14, .028, main, bulge=lambda a, f: .012 * math.cos(a) ** 2 * math.sin(math.pi * f))
    rim(gr[-1], .016, trim)
    rim(gr[0], .018, trim)
    if el == "ember":   # scales: small overlapping plates on the front
        for r in range(1, 5):
            for cc in range(-3, 4):
                p = gr[r][cc % 14]
                n = Vector((p.x, p.y - .005, 0)).normalized()
                ball(.03, tuple(p + n * .014), trim if (r + cc) % 2 else main, uv=(6, 3), scale=(1.2, .4, .9),
                     rot=(0, 0, math.atan2(n.x, -n.y)))
    if el == "spark":   # lightning lines across the plate
        pts = [gr[4][-2], gr[3][-1], gr[2][0], gr[1][1], gr[0][2]]
        for a, b in zip(pts, pts[1:]):
            beam(tuple(a + (a - Vector((0, 0, a.z))).normalized() * .012), tuple(b + (b - Vector((0, 0, b.z))).normalized() * .012), .018, glow, .008)
    if el == "frost":
        for cc in (-2, 0, 2):
            p = gr[3][cc % 14]
            n = Vector((p.x, p.y, 0)).normalized()
            cyl(.025, .09, tuple(p + n * .03), glow, 6, r2=0, rot=n.to_track_quat('Z', 'Y').to_euler())
    parts.append((s, torso_rule))
    for sx, side in ((1, "L"), (-1, "R")):   # pauldrons on the upper arm bones
        s = len(OBJS)
        if el == "ember":
            for k in range(3):
                cyl(.05, .16 - .03 * k, (sx * (.19 + .04 * k), 0, .82 + .02 * k), glow if k == 0 else main, 6, r2=0, rot=(0, sx * .5, 0))
            ball(.09, (sx * .2, 0, .77), main, uv=(10, 5), scale=(1.1, 1.2, .55))
        elif el == "frost":
            ball(.09, (sx * .2, 0, .77), main, uv=(10, 5), scale=(1.1, 1.2, .55))
            for k in range(3):
                cyl(.03, .14, (sx * (.2 + .03 * k), -.04 + .04 * k, .83), glow, 6, r2=0, rot=(0, sx * (.3 + .2 * k), 0))
        elif el == "spark":
            ball(.1, (sx * .2, 0, .77), main, uv=(10, 5), scale=(1.15, 1.2, .55))
            ball(.07, (sx * .21, 0, .81), trim, uv=(10, 5), scale=(1.1, 1.1, .45))
            beam((sx * .14, -.06, .82), (sx * .27, .04, .8), .015, glow, .006)
        parts.append((s, lambda p, side=side: [("upper_arm." + side, 1.0)]))
    if el == "gale":   # light cloak instead of pauldrons: mantle + two-bone cape
        s = len(OBJS)
        shell(tree, .72, .81, 2, 16, .035, main, a0=.5, a1=2 * math.pi - .5, closed=False)
        ball(.012, (0, -.15, .79), glow, uv=(6, 4))
        parts.append((s, torso_rule))
        s = len(OBJS)
        rows, cols = 8, 7
        verts, faces = [], []
        for r in range(rows + 1):
            f = r / rows
            z = .8 - .5 * f
            for cc in range(cols + 1):
                u = cc / cols * 2 - 1
                verts.append((u * (.2 + .1 * f), .17 + .08 * f + .03 * (1 - u * u), z))
        for r in range(rows):
            for cc in range(cols):
                a = r * (cols + 1) + cc
                faces.append([a, a + 1, a + cols + 2, a + cols + 1])
        cape = mesh(verts, faces, trim)
        bm = bmesh.new()
        bm.from_mesh(cape.data)
        for f in bm.faces:
            if f.normal.y < 0:
                f.normal_flip()
        bmesh.ops.solidify(bm, geom=list(bm.faces), thickness=.01)
        bm.to_mesh(cape.data)
        bm.free()
        def cape_rule(p):
            t = (.8 - p.z) / .5
            if t < .35:
                return [("chest", 1 - t / .35), ("cape_1", t / .35)] if t > 0 else [("chest", 1.0)]
            if t < .7:
                return [("cape_1", 1 - (t - .35) / .35), ("cape_2", (t - .35) / .35)]
            return [("cape_2", 1.0)]
        parts.append((s, cape_rule))
        bpy.context.view_layer.objects.active = arm
        bpy.ops.object.mode_set(mode='EDIT')
        eb = arm.data.edit_bones
        b1 = eb.new("cape_1")
        b1.head, b1.tail, b1.parent = (0, .2, .78), (0, .23, .6), eb["chest"]
        b2 = eb.new("cape_2")
        b2.head, b2.tail, b2.parent = (0, .23, .6), (0, .25, .4), b1
        bpy.ops.object.mode_set(mode='OBJECT')
    # skin each part, then join
    bpy.context.view_layer.update()
    for i, (s, rule) in enumerate(parts):
        e = parts[i + 1][0] if i + 1 < len(parts) else len(OBJS)
        for ob in OBJS[s:e]:
            skin(ob, rule)
    o = group(name, origin=None)
    o.parent = arm
    md = o.modifiers.new("NgocRig", 'ARMATURE')
    md.object = arm
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, name + "_v01.glb"), export_format='GLB', export_yup=True, use_selection=True,
                              export_apply=False, export_skins=True, export_animations=False, export_image_format='NONE')
    print("BUILT", name + "_v01", name, "tris", tris(o), "size", *[round(x, 2) for x in o.dimensions])


# ------------------------------------------------------------------ amulets on her chest
PEND = Vector((0, -.165, .7))


def amulet(name, el):
    reset()
    c, d, g = EL[el]
    metal, gem, glow = mat("metal", "#E2B04A", rough=.25, metal=.85), mat("gem", c, rough=.05, emit=.8, alpha=.9), mat("glow", g, emit=2.0)
    pts = [Vector((.11 * math.sin(a), -.15 + .2 * (1 - math.cos(a)) * .5 - .0, .8 - .08 * math.cos(a))) for a in [(-1 + i / 6) * math.pi * .9 for i in range(13)]]
    pts = [Vector((.13 * math.sin(t), .02 - .17 * math.cos(t), .78 + .04 * (1 - math.cos(t)))) for t in [(-1 + 2 * i / 8) * math.pi * .55 for i in range(9)]]
    for a, b in zip(pts, pts[1:]):   # thin chain around the neck under the scarf
        beam(tuple(a), tuple(b), .006, metal)
    beam(tuple(pts[4]), tuple(PEND + Vector((0, 0, .045))), .006, metal)
    torus(.04, .007, tuple(PEND), metal, 12, 3, rot=(math.pi / 2, 0, 0))
    torus(.008, .003, tuple(PEND + Vector((0, 0, .048))), metal, 8, 3)
    R = Matrix.Translation(PEND) @ Matrix.Rotation(math.pi / 2, 4, 'X')
    if el == "ember":
        cyl(.022, .055, tuple(PEND + Vector((0, -.004, .005))), glow, 6, r2=0)
        cyl(.013, .03, tuple(PEND + Vector((.012, -.008, -.008))), gem, 6, r2=0)
    elif el == "frost":
        for k in range(6):
            a = k * math.pi / 3
            beam(tuple(PEND + Vector((0, -.004, 0))), tuple(PEND + Vector((.03 * math.cos(a), -.004, .03 * math.sin(a)))), .008, gem, .004)
        ball(.008, tuple(PEND + Vector((0, -.008, 0))), glow, uv=(6, 4))
    elif el == "gale":
        p = [PEND + Vector((.03 * (1 - t) * math.cos(t * 8), -.005, .03 * (1 - t) * math.sin(t * 8))) for t in [i / 10 for i in range(11)]]
        for a, b in zip(p, p[1:]):
            beam(tuple(a), tuple(b), .008, glow, .004)
    else:
        p = [PEND + Vector(v) for v in ((-.008, -.005, .03), (.012, -.005, .004), (-.004, -.005, .002), (.01, -.005, -.03))]
        for a, b in zip(p, p[1:]):
            beam(tuple(a), tuple(b), .01, glow, .004)
    cyl(.035, .006, tuple(PEND + Vector((0, .004, 0))), gem, 10, rot=(math.pi / 2, 0, 0))
    group(name, origin=None)
    export(name + "_v01")


W2 = {}
for el, n1, n2 in (("ember", "ember", "blaze"), ("frost", "frost", "glacier"), ("gale", "gale", "tempest"), ("spark", "spark", "storm")):
    W2["weapon_sword_" + n1] = (lambda n=n1, e=el: sword2("weapon_sword_" + n, e, 1))
    W2["weapon_sword_" + n2] = (lambda n=n2, e=el: sword2("weapon_sword_" + n, e, 2))
    W2["weapon_staff_" + n1] = (lambda n=n1, e=el: staff("weapon_staff_" + n, e, 1))
    n3 = {"ember": "inferno", "frost": "glacier", "gale": "tempest", "spark": "storm"}[el]
    W2["weapon_staff_" + n3] = (lambda n=n3, e=el: staff("weapon_staff_" + n, e, 2))
W2.update({"armor_flame_mail": lambda: armor_elem("armor_flame_mail", "ember"), "armor_frost_mail": lambda: armor_elem("armor_frost_mail", "frost"),
           "armor_wind_cloak": lambda: armor_elem("armor_wind_cloak", "gale"), "armor_storm_plate": lambda: armor_elem("armor_storm_plate", "spark")})
W2.update({"acc_amulet_" + k: (lambda k=k, e=e: amulet("acc_amulet_" + k, e)) for k, e in (("fire", "ember"), ("ice", "frost"), ("wind", "gale"), ("thunder", "spark"))})
for n, f in W2.items():
    if not ONLY or n in ONLY:
        f()
