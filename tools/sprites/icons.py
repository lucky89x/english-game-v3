"""Shop / skill icons from .glb models: 3/4 view, transparent background, soft light, thin dark outline, <= 40 KB.
Run: SRC=<folder with .glb> NAMES=file1,file2 DST=assets/ui PREFIX=item_ SIZE=128 blender -b -P tools/sprites/icons.py
Writes DST/<PREFIX><name without _v01>.png. Optional VIEW=x,y,z (default front-right-above), TINT=hex for tint_main.
Needs Pillow importable in Blender for the 256-colour squeeze (PYTHONPATH + --python-use-system-env), else PNG as rendered.
"""
import bpy, os, math, mathutils

SRC, DST = os.environ["SRC"], os.environ["DST"]
NAMES = [n for n in os.environ["NAMES"].split(",") if n]
PREFIX, S = os.environ.get("PREFIX", "item_"), int(os.environ.get("SIZE", "128"))
VIEW = mathutils.Vector([float(x) for x in os.environ.get("VIEW", ".9,-1.25,1.0").split(",")]).normalized()
TINT = os.environ.get("TINT", "e2b04a")


def lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4) for x in c] + [1]


for n in NAMES:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, n + ".glb"))
    for a in bpy.data.objects:
        if a.type == 'ARMATURE' and a.animation_data:
            a.animation_data.action = None
            for tr in list(a.animation_data.nla_tracks):
                a.animation_data.nla_tracks.remove(tr)
            for pb in a.pose.bones:
                pb.location, pb.rotation_quaternion, pb.scale = (0, 0, 0), (1, 0, 0, 0), (1, 1, 1)
    for m in bpy.data.materials:
        if m.name.startswith("tint_") and m.use_nodes:
            b = next((x for x in m.node_tree.nodes if x.type == 'BSDF_PRINCIPLED'), None)
            if b:
                b.inputs['Base Color'].default_value = lin(TINT)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = 32
    sc.cycles.use_denoising = True
    sc.render.resolution_x = sc.render.resolution_y = S
    sc.render.film_transparent = True
    sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'Standard'
    w = bpy.data.worlds.new('w')
    sc.world = w
    w.use_nodes = True
    bg = next(x for x in w.node_tree.nodes if x.type == 'BACKGROUND')
    bg.inputs[0].default_value = (0.9, 0.92, 1.0, 1)
    bg.inputs[1].default_value = .8
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = 'ABSOLUTE'
    sc.render.line_thickness = 1.0
    ls = bpy.context.view_layer.freestyle_settings.linesets[0]
    ls.select_silhouette, ls.select_border, ls.select_crease = True, True, False
    if ls.linestyle is None:
        ls.linestyle = bpy.data.linestyles.new('line')
    ls.linestyle.color = (0.13, 0.08, 0.12)
    dg = bpy.context.evaluated_depsgraph_get()
    q = (-VIEW).to_track_quat('-Z', 'Y')
    R = q.to_matrix()
    pts = []
    for o in sc.objects:
        if o.type == 'MESH':
            e = o.evaluated_get(dg)
            pts += [R.transposed() @ (e.matrix_world @ v.co) for v in e.to_mesh().vertices]
    xs, ys, zs = [p.x for p in pts], [p.y for p in pts], [p.z for p in pts]
    size = max(max(xs) - min(xs), max(ys) - min(ys))
    c = R @ mathutils.Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, (min(zs) + max(zs)) / 2))
    for loc, en in [((-3, -4, 5), 900), ((5, -2, 2), 260), ((0, 4, 4), 300)]:
        l = bpy.data.objects.new('l', bpy.data.lights.new('l', 'POINT'))
        l.data.energy = en * max(.3, size) ** 2
        l.data.shadow_soft_size = 1.5 * size
        l.location = c + mathutils.Vector(loc) * max(.4, size)
        sc.collection.objects.link(l)
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = size * 1.1
    cam.rotation_euler = q.to_euler()
    cam.location = c + VIEW * (size * 4 + 2)
    cam.data.clip_end = size * 10 + 10
    short = n[:-4] if n.endswith("_v01") else n
    p = os.path.abspath(os.path.join(DST, PREFIX + short + ".png"))
    sc.render.filepath = p
    bpy.ops.render.render(write_still=True)
    try:
        from PIL import Image
        im = Image.open(p).convert('RGBA')
        for colors in (256, 128, 64):
            im.quantize(colors=colors, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(p, optimize=True)
            if os.path.getsize(p) <= 40 * 1024:
                break
    except ImportError:
        pass
    print("ICON", p, os.path.getsize(p))
